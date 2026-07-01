import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";

export const runtime = "nodejs";

const VerifySchema = z.object({
  platform: z.enum(["wordpress", "shopify", "magento", "google_search_console", "github"]),
  credentials: z.any(),
});

function isWordPressCom(siteUrl: string): boolean {
  return siteUrl.toLowerCase().includes(".wordpress.com");
}

async function verifyWordPress(credentials: any) {
  const siteUrl = (credentials.siteUrl || credentials.url || "").replace(/\/$/, "");
  const username = credentials.username;
  const appPassword = credentials.appPassword || credentials.app_password;

  if (!siteUrl || !username || !appPassword) {
    return { ok: false, error: "Missing URL, username, or application password." };
  }

  // XML-RPC verification for WordPress.com
  if (isWordPressCom(siteUrl)) {
    const xmlrpcUrl = `${siteUrl}/xmlrpc.php`;
    try {
      // Test author fetch (read credentials check)
      const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<methodCall>
  <methodName>wp.getAuthors</methodName>
  <params>
    <param><value><int>0</int></value></param>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${appPassword}</string></value></param>
  </params>
</methodCall>`;

      const res = await fetch(xmlrpcUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlPayload,
        signal: AbortSignal.timeout(8000),
      });

      const text = await res.text();
      if (text.includes("<fault>")) {
        const errorMatch = /<name>faultString<\/name>\s*<value>\s*<string>([^<]+)<\/string>/i.exec(text);
        const errMsg = errorMatch ? errorMatch[1] : "Authentication failed";
        return { ok: false, error: `WordPress.com XML-RPC authentication failed: ${errMsg}. Make sure your email/username and application password are correct.` };
      }

      // Test write capability by checking if we can create a draft post
      const writePayload = `<?xml version="1.0" encoding="utf-8"?>
<methodCall>
  <methodName>wp.newPost</methodName>
  <params>
    <param><value><int>0</int></value></param>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${appPassword}</string></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>post_title</name>
            <value><string>SoloSpider Connection Test</string></value>
          </member>
          <member>
            <name>post_content</name>
            <value><string>This is a connection test post from SoloSpider.</string></value>
          </member>
          <member>
            <name>post_status</name>
            <value><string>draft</string></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

      const writeRes = await fetch(xmlrpcUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: writePayload,
        signal: AbortSignal.timeout(8000),
      });

      const writeText = await writeRes.text();
      if (writeText.includes("<fault>")) {
        const errorMatch = /<name>faultString<\/name>\s*<value>\s*<string>([^<]+)<\/string>/i.exec(writeText);
        const errMsg = errorMatch ? errorMatch[1] : "Writing draft post failed";
        return { ok: false, error: `WordPress.com draft post creation failed: ${errMsg}` };
      }

      // Delete the test post if possible
      const postIdMatch = /<value>\s*<string>(\d+)<\/string>\s*<\/value>/i.exec(writeText) || /<value>\s*<int>(\d+)<\/int>\s*<\/value>/i.exec(writeText);
      if (postIdMatch) {
        const postId = postIdMatch[1];
        const deletePayload = `<?xml version="1.0" encoding="utf-8"?>
<methodCall>
  <methodName>wp.deletePost</methodName>
  <params>
    <param><value><int>0</int></value></param>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${appPassword}</string></value></param>
    <param><value><string>${postId}</string></value></param>
  </params>
</methodCall>`;
        await fetch(xmlrpcUrl, {
          method: "POST",
          headers: { "Content-Type": "text/xml" },
          body: deletePayload,
          signal: AbortSignal.timeout(5000),
        }).catch(() => {});
      }

      return { ok: true, message: "WordPress.com connected and verified via XML-RPC (read + write)." };
    } catch (e: any) {
      return { ok: false, error: `Could not reach WordPress.com XML-RPC: ${e.message}` };
    }
  }

  const authString = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const apiBase = `${siteUrl}/wp-json/wp/v2`;

  try {
    const res = await fetch(`${apiBase}/categories?per_page=1`, {
      headers: { Authorization: `Basic ${authString}` },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      // Test write capability by checking if we can create a draft post
      const testRes = await fetch(`${apiBase}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "SoloSpider Connection Test",
          content: "<p>This is a test post from SoloSpider. Safe to delete.</p>",
          status: "draft",
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (testRes.ok) {
        // Delete the test post
        const testData = await testRes.json();
        if (testData.id) {
          await fetch(`${apiBase}/posts/${testData.id}?force=true`, {
            method: "DELETE",
            headers: { Authorization: `Basic ${authString}` },
            signal: AbortSignal.timeout(5000),
          }).catch(() => {});
        }
        return { ok: true, message: "WordPress connected and verified (read + write)." };
      } else {
        const errData = await testRes.json().catch(() => ({}));
        const msg = errData?.message || errData?.error || `Status ${testRes.status}`;
        return { ok: false, error: `Connected but cannot create posts: ${msg}. Make sure you use an Application Password (not your login password).` };
      }
    } else {
      const errText = await res.text().catch(() => "");
      if (res.status === 404) {
        return { ok: false, error: "REST API returned 404. Make sure your site has the REST API enabled." };
      }
      return { ok: false, error: `Connection failed (Status ${res.status}). Check your URL and credentials.` };
    }
  } catch (e: any) {
    return { ok: false, error: `Could not reach WordPress: ${e.message}` };
  }
}

async function verifyShopify(credentials: any) {
  let shopName = (credentials.shopName || "").trim();
  const accessToken = (credentials.accessToken || "").trim();

  if (!shopName || !accessToken) {
    return { ok: false, error: "Missing shop name or access token." };
  }

  if (!shopName.includes(".myshopify.com")) {
    shopName = `${shopName}.myshopify.com`;
  }

  try {
    const res = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      const blogCount = data.blogs?.length || 0;
      return { ok: true, message: `Shopify connected! Found ${blogCount} blog(s).` };
    } else {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.errors || `Status ${res.status}`;
      if (res.status === 401) {
        return { ok: false, error: `Invalid API key or access token. Make sure you use the Admin API access token from your custom app (starts with shpat_), NOT the Client Secret.` };
      }
      return { ok: false, error: `Shopify API error: ${msg}` };
    }
  } catch (e: any) {
    return { ok: false, error: `Could not reach Shopify: ${e.message}` };
  }
}

async function verifyGoogleSearchConsole(credentials: any) {
  const clientId = credentials.clientId || credentials.client_id;
  const clientSecret = credentials.clientSecret || credentials.client_secret;
  const refreshToken = credentials.refreshToken || credentials.refresh_token;

  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, error: "Missing Client ID, Client Secret, or Refresh Token." };
  }

  try {
    // 1. Exchange refresh token for an access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return { ok: false, error: `Google OAuth Token exchange failed: ${errText}` };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch the user's sites list to verify Search Console permissions
    const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!sitesRes.ok) {
      const errText = await sitesRes.text();
      return { ok: false, error: `Failed to query Webmasters API: ${errText}` };
    }

    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];
    return { 
      ok: true, 
      message: `Google Search Console connected successfully! Found ${sites.length} site(s) on your Google account.` 
    };
  } catch (err: any) {
    return { ok: false, error: `Google API connection failed: ${err.message}` };
  }
}

async function verifyGitHub(credentials: any) {
  const token = (credentials.token || "").trim();
  const owner = (credentials.owner || "").trim();
  const repo = (credentials.repo || "").trim();

  if (!token || !owner || !repo) {
    return { ok: false, error: "Missing GitHub PAT, repository owner, or repository name." };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SoloSpider-App",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: `GitHub connected! Repository ${data.full_name} is active.` };
    } else {
      if (res.status === 401) {
        return { ok: false, error: "Invalid GitHub Personal Access Token." };
      }
      if (res.status === 404) {
        return { ok: false, error: `Repository not found. Verify owner/repo name and that token has 'repo' scopes.` };
      }
      return { ok: false, error: `GitHub API error: Status ${res.status}` };
    }
  } catch (e: any) {
    return { ok: false, error: `Could not reach GitHub API: ${e.message}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = VerifySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { platform, credentials } = parsed.data;

    let result;
    if (platform === "wordpress") {
      result = await verifyWordPress(credentials);
    } else if (platform === "shopify") {
      result = await verifyShopify(credentials);
    } else if (platform === "google_search_console") {
      result = await verifyGoogleSearchConsole(credentials);
    } else if (platform === "github") {
      result = await verifyGitHub(credentials);
    } else {
      // Magento - basic connectivity check
      result = { ok: true, message: "Magento credentials saved (no verification available yet)." };
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error: any) {
    console.error("[VerifyIntegration] Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
