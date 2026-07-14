import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PublishWPSchema = z.object({
  contentId: z.string().uuid(),
  integrationId: z.string().uuid(),
  publishStatus: z.enum(["draft", "publish"]).optional().default("draft"),
  categories: z.array(z.number()).optional(),
  authorId: z.number().optional(),
  canonicalUrl: z.string().optional(),
});

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: { persistSession: false },
    }
  );
}

/**
 * Detects if a URL is a WordPress.com hosted site.
 * WordPress.com sites need the public-api.wordpress.com endpoint.
 */
function isWordPressCom(siteUrl: string): boolean {
  const lower = siteUrl.toLowerCase();
  return lower.includes(".wordpress.com");
}

/**
 * Returns the correct REST API base URL for posts.
 * - Self-hosted: https://mysite.com/wp-json/wp/v2/posts
 * - WordPress.com: https://public-api.wordpress.com/wp/v2/sites/{domain}/posts
 */
function getWpApiUrl(siteUrl: string, endpoint: string): string {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  if (isWordPressCom(cleanUrl)) {
    // Extract domain from URL (remove https://)
    const domain = cleanUrl.replace(/^https?:\/\//, "");
    return `https://public-api.wordpress.com/wp/v2/sites/${domain}/${endpoint}`;
  }
  return `${cleanUrl}/wp-json/wp/v2/${endpoint}`;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = PublishWPSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { contentId, integrationId, publishStatus, categories, authorId } = parsed.data;
    const supabase = getSupabaseAdmin();

    // 1. Fetch integration details
    const { data: integration, error: intErr } = await supabase
      .from("workspace_integrations")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (intErr || !integration) {
      return NextResponse.json({ error: "WordPress integration details not found" }, { status: 404 });
    }

    // 2. Fetch blog content details
    const { data: content, error: contentErr } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (contentErr || !content) {
      return NextResponse.json({ error: "Blog content item not found" }, { status: 404 });
    }

    const credentials = integration.credentials as any;
    const siteUrl = (credentials.siteUrl || credentials.url || "").replace(/\/$/, "");
    const username = credentials.username;
    const appPassword = credentials.appPassword || credentials.app_password;

    if (!siteUrl || !username || !appPassword) {
      return NextResponse.json({ error: "WordPress credentials are incomplete." }, { status: 400 });
    }

    // XML-RPC publishing for WordPress.com
    if (isWordPressCom(siteUrl)) {
      const xmlrpcUrl = `${siteUrl}/xmlrpc.php`;
      const title = content.generated_title || content.h1;
      const body = content.generated_content || "";
      
      const escapeXml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const seoTitle = content.generated_title || content.h1 || "";
      const seoDesc = content.meta_description || "";
      const focusKeyword = content.main_keyword || "";

      const customFields = [
        { key: "_yoast_wpseo_title", value: seoTitle },
        { key: "yoast_wpseo_title", value: seoTitle },
        { key: "_yoast_wpseo_metadesc", value: seoDesc },
        { key: "yoast_wpseo_metadesc", value: seoDesc },
        { key: "_yoast_wpseo_focuskw", value: focusKeyword },
        { key: "yoast_wpseo_focuskw", value: focusKeyword },
        { key: "rank_math_title", value: seoTitle },
        { key: "rank_math_description", value: seoDesc },
        { key: "rank_math_focus_keyword", value: focusKeyword },
      ];

      const customFieldsBlock = `
        <member>
          <name>custom_fields</name>
          <value>
            <array>
              <data>
                ${customFields.map(cf => `
                  <value>
                    <struct>
                      <member>
                        <name>key</name>
                        <value><string>${cf.key}</string></value>
                      </member>
                      <member>
                        <name>value</name>
                        <value><string>${escapeXml(cf.value)}</string></value>
                      </member>
                    </struct>
                  </value>
                `).join("\n")}
              </data>
            </array>
          </value>
        </member>
      `;

      let categoriesBlock = "";
      if (categories && categories.length > 0) {
        categoriesBlock = `
          <member>
            <name>terms</name>
            <value>
              <struct>
                <member>
                  <name>category</name>
                  <value>
                    <array>
                      <data>
                        ${categories.map(catId => `<value><int>${catId}</int></value>`).join("\n")}
                      </data>
                    </array>
                  </value>
                </member>
              </struct>
            </value>
          </member>`;
      }

      let authorBlock = "";
      if (authorId) {
        authorBlock = `
          <member>
            <name>post_author</name>
            <value><int>${authorId}</int></value>
          </member>`;
      }

      const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
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
            <value><string>${escapeXml(title)}</string></value>
          </member>
          <member>
            <name>post_content</name>
            <value><string>${escapeXml(body)}</string></value>
          </member>
          <member>
            <name>post_status</name>
            <value><string>${publishStatus}</string></value>
          </member>
          ${categoriesBlock}
          ${authorBlock}
          ${customFieldsBlock}
        </struct>
      </value>
    </param>
  </params>
</methodCall>`;

      console.log(`[PublishToWP] Sending XML-RPC post to: ${xmlrpcUrl}`);
      
      const xmlRes = await fetch(xmlrpcUrl, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlPayload,
      });

      const responseText = await xmlRes.text();
      if (responseText.includes("<fault>")) {
        const errorMatch = /<name>faultString<\/name>\s*<value>\s*<string>([^<]+)<\/string>/i.exec(responseText);
        const errMsg = errorMatch ? errorMatch[1] : "XML-RPC error publishing";
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }

      const postIdMatch = /<value>\s*<string>(\d+)<\/string>\s*<\/value>/i.exec(responseText) || /<value>\s*<int>(\d+)<\/int>\s*<\/value>/i.exec(responseText);
      if (!postIdMatch) {
        return NextResponse.json({ error: "Failed to parse post ID from WordPress.com response" }, { status: 500 });
      }
      
      const postId = postIdMatch[1];
      const link = `${siteUrl}/?p=${postId}`;

      // Update status in database
      const { error: updateErr } = await supabase
        .from("content_items")
        .update({
          status: "published",
        })
        .eq("id", contentId);

      if (updateErr) throw updateErr;

      return NextResponse.json({ ok: true, wpPostId: parseInt(postId, 10), link });
    }

    const authString = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const apiUrl = getWpApiUrl(siteUrl, "posts");

    // 3. Post to WordPress REST API
    const wpPayload: any = {
      title: content.generated_title || content.h1,
      content: content.generated_content || "",
      status: publishStatus,
    };

    const seoTitle = content.generated_title || content.h1 || "";
    const seoDesc = content.meta_description || "";
    const focusKeyword = content.main_keyword || "";

    wpPayload.meta = {
      _yoast_wpseo_title: seoTitle,
      yoast_wpseo_title: seoTitle,
      _yoast_wpseo_metadesc: seoDesc,
      yoast_wpseo_metadesc: seoDesc,
      _yoast_wpseo_focuskw: focusKeyword,
      yoast_wpseo_focuskw: focusKeyword,
      rank_math_title: seoTitle,
      rank_math_description: seoDesc,
      rank_math_focus_keyword: focusKeyword,
      _rank_math_title: seoTitle,
      _rank_math_description: seoDesc,
      _rank_math_focus_keyword: focusKeyword,
    };

    if (categories && categories.length > 0) wpPayload.categories = categories;
    if (authorId) wpPayload.author = authorId;

    console.log(`[PublishToWP] Sending request to: ${apiUrl}`);

    const wpResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpPayload),
    });

    let wpData: any = null;
    const responseText = await wpResponse.text();
    try {
      wpData = JSON.parse(responseText);
    } catch (e) {
      console.error("[PublishToWP] WordPress response was not JSON. Status:", wpResponse.status, "Body:", responseText.substring(0, 500));
      return NextResponse.json({
        error: `WordPress returned a non-JSON response (Status ${wpResponse.status}). Please check your site URL and ensure it has REST API enabled and supports application passwords.`
      }, { status: 502 });
    }

    if (!wpResponse.ok) {
      console.error("[PublishToWP] WordPress REST API error:", wpData);
      const msg = wpData?.message || wpData?.error || `WordPress returned status ${wpResponse.status}`;
      return NextResponse.json({ error: msg }, { status: wpResponse.status });
    }

    // 4. Update status in database
    const { error: updateErr } = await supabase
      .from("content_items")
      .update({
        status: "published",
      })
      .eq("id", contentId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, wpPostId: wpData.id, link: wpData.link });
  } catch (error: any) {
    console.error("[PublishToWP] Error publishing to WordPress:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
