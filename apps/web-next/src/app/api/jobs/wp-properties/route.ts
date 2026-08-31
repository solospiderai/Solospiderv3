import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const WPPropertiesSchema = z.object({
  integrationId: z.string().uuid(),
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

function isWordPressCom(siteUrl: string): boolean {
  return siteUrl.toLowerCase().includes(".wordpress.com");
}

function getWpApiUrl(siteUrl: string, endpoint: string): string {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  if (isWordPressCom(cleanUrl)) {
    const domain = cleanUrl.replace(/^https?:\/\//, "");
    return `https://public-api.wordpress.com/wp/v2/sites/${domain}/${endpoint}`;
  }
  return `${cleanUrl}/wp-json/wp/v2/${endpoint}`;
}

function parseXmlrpcTerms(xml: string) {
  const categories = [];
  const structRegex = /<struct>([\s\S]*?)<\/struct>/g;
  let match;
  while ((match = structRegex.exec(xml)) !== null) {
    const structContent = match[1];
    const idMatch = /<name>term_id<\/name>\s*<value>\s*<string>(\d+)<\/string>\s*<\/value>/i.exec(structContent) || /<name>term_id<\/name>\s*<value>\s*<int>(\d+)<\/int>\s*<\/value>/i.exec(structContent);
    const nameMatch = /<name>name<\/name>\s*<value>\s*<string>([^<]+)<\/string>\s*<\/value>/i.exec(structContent);
    const slugMatch = /<name>slug<\/name>\s*<value>\s*<string>([^<]+)<\/string>\s*<\/value>/i.exec(structContent);
    if (idMatch && nameMatch) {
      categories.push({
        id: parseInt(idMatch[1], 10),
        name: nameMatch[1],
        slug: slugMatch ? slugMatch[1] : "",
      });
    }
  }
  return categories;
}

function parseXmlrpcAuthors(xml: string) {
  const authors = [];
  const structRegex = /<struct>([\s\S]*?)<\/struct>/g;
  let match;
  while ((match = structRegex.exec(xml)) !== null) {
    const structContent = match[1];
    const idMatch = /<name>user_id<\/name>\s*<value>\s*<string>(\d+)<\/string>\s*<\/value>/i.exec(structContent) || /<name>user_id<\/name>\s*<value>\s*<int>(\d+)<\/int>\s*<\/value>/i.exec(structContent);
    const nameMatch = /<name>display_name<\/name>\s*<value>\s*<string>([^<]+)<\/string>\s*<\/value>/i.exec(structContent);
    const loginMatch = /<name>user_login<\/name>\s*<value>\s*<string>([^<]+)<\/string>\s*<\/value>/i.exec(structContent);
    if (idMatch && nameMatch) {
      authors.push({
        id: parseInt(idMatch[1], 10),
        name: nameMatch[1],
        slug: loginMatch ? loginMatch[1] : nameMatch[1],
      });
    }
  }
  return authors;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = WPPropertiesSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { integrationId } = parsed.data;
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

    const credentials = integration.credentials as any;
    const url = credentials?.siteUrl || credentials?.url;
    const appPassword = credentials?.appPassword || credentials?.app_password;
    const username = credentials?.username;

    if (!url || !username || !appPassword) {
      return NextResponse.json({ error: "Integration credentials are incomplete" }, { status: 400 });
    }

    let categories: any[] = [];
    let authors: any[] = [];

    // Use XML-RPC for WordPress.com
    if (isWordPressCom(url)) {
      const xmlrpcUrl = `${url.replace(/\/$/, "")}/xmlrpc.php`;
      try {
        const catPayload = `<?xml version="1.0" encoding="utf-8"?>
<methodCall>
  <methodName>wp.getTerms</methodName>
  <params>
    <param><value><int>0</int></value></param>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${appPassword}</string></value></param>
    <param><value><string>category</string></value></param>
  </params>
</methodCall>`;

        const authPayload = `<?xml version="1.0" encoding="utf-8"?>
<methodCall>
  <methodName>wp.getAuthors</methodName>
  <params>
    <param><value><int>0</int></value></param>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${appPassword}</string></value></param>
  </params>
</methodCall>`;

        const [catRes, authRes] = await Promise.all([
          fetch(xmlrpcUrl, {
            method: "POST",
            headers: { "Content-Type": "text/xml" },
            body: catPayload,
            signal: AbortSignal.timeout(8000),
          }),
          fetch(xmlrpcUrl, {
            method: "POST",
            headers: { "Content-Type": "text/xml" },
            body: authPayload,
            signal: AbortSignal.timeout(8000),
          })
        ]);

        if (catRes.ok) {
          const catText = await catRes.text();
          if (!catText.includes("<fault>")) {
            categories = parseXmlrpcTerms(catText);
          }
        }
        if (authRes.ok) {
          const authText = await authRes.text();
          if (!authText.includes("<fault>")) {
            authors = parseXmlrpcAuthors(authText);
          }
        }
      } catch (fetchErr: any) {
        console.error("[WPProperties] XML-RPC connection failed:", fetchErr);
        return NextResponse.json({
          error: `Could not connect to WordPress.com XML-RPC at ${url}. Error: ${fetchErr.message || fetchErr}`
        }, { status: 502 });
      }

      return NextResponse.json({ categories, authors });
    }

    const authString = Buffer.from(`${username}:${appPassword}`).toString("base64");

    // 2. Fetch categories and users from WP REST API (server-side to bypass CORS)
    const catUrl = getWpApiUrl(url, "categories?per_page=100");
    const usersUrl = getWpApiUrl(url, "users?per_page=100");

    try {
      const [catRes, authRes] = await Promise.all([
        fetch(catUrl, { 
          headers: { Authorization: `Basic ${authString}` },
          signal: AbortSignal.timeout(8000)
        }),
        fetch(usersUrl, { 
          headers: { Authorization: `Basic ${authString}` },
          signal: AbortSignal.timeout(8000)
        })
      ]);

      if (catRes.ok) {
        categories = await catRes.json().catch(() => []);
      } else {
        console.warn(`[WPProperties] Failed to fetch categories. Status: ${catRes.status}`);
      }

      if (authRes.ok) {
        authors = await authRes.json().catch(() => []);
      } else {
        console.warn(`[WPProperties] Failed to fetch users. Status: ${authRes.status}`);
      }
    } catch (fetchErr: any) {
      console.error("[WPProperties] WP connection failed:", fetchErr);
      return NextResponse.json({ 
        error: `Could not connect to WordPress at ${url}. Error: ${fetchErr.message || fetchErr}` 
      }, { status: 502 });
    }

    return NextResponse.json({ categories, authors });
  } catch (error: any) {
    console.error("[WPProperties] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
