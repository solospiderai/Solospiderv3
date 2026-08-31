import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PublishShopifySchema = z.object({
  contentId: z.string().uuid().optional(),
  integrationId: z.string().uuid(),
  publishStatus: z.enum(["draft", "active"]).optional().default("draft"),
  blogId: z.string().optional(),
  step: z.enum(["get_blogs", "publish"]).optional().default("publish"),
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

function mdToHtml(md: string): string {
  // Simple markdown to HTML converter for Shopify blog body
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .split("\n\n")
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const parsed = PublishShopifySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { contentId, integrationId, publishStatus, blogId, step } = parsed.data;
    const supabase = getSupabaseAdmin();

    // 1. Fetch integration details
    const { data: integration, error: intErr } = await supabase
      .from("workspace_integrations")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (intErr || !integration) {
      return NextResponse.json({ error: "Shopify integration details not found" }, { status: 404 });
    }

    const credentials = integration.credentials as any;
    let shopName = credentials.shopName.trim();
    if (!shopName.includes(".myshopify.com")) {
      shopName = `${shopName}.myshopify.com`;
    }
    const accessToken = credentials.accessToken.trim();

    // STEP A: Fetch Blogs
    if (step === "get_blogs") {
      const response = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[PublishToShopify] Error fetching blogs:", data);
        return NextResponse.json({ error: data?.errors || "Failed to fetch Shopify blogs" }, { status: response.status });
      }

      let blogs = data.blogs || [];
      if (blogs.length === 0) {
        console.log("[PublishToShopify] No blogs found. Automatically creating 'News' blog category.");
        const createBlogRes = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blog: {
              title: "News",
            },
          }),
        });
        const createBlogData = await createBlogRes.json();
        if (createBlogRes.ok && createBlogData.blog) {
          blogs = [createBlogData.blog];
        } else {
          console.error("[PublishToShopify] Failed to auto-create blog category:", createBlogData);
        }
      }

      return NextResponse.json({ blogs });
    }

    // STEP B: Publish Article
    if (!contentId) {
      return NextResponse.json({ error: "contentId is required for publishing" }, { status: 400 });
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

    // Determine target blog ID
    let targetBlogId = blogId;
    if (!targetBlogId || targetBlogId === "none") {
      const blogsRes = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });
      const blogsData = await blogsRes.json();
      let blogs = blogsData.blogs || [];
      if (blogsRes.ok && blogs.length > 0) {
        targetBlogId = blogs[0].id.toString();
      } else {
        console.log("[PublishToShopify] No blogs found during publish. Auto-creating 'News' blog.");
        const createBlogRes = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blog: {
              title: "News",
            },
          }),
        });
        const createBlogData = await createBlogRes.json();
        if (createBlogRes.ok && createBlogData.blog) {
          targetBlogId = createBlogData.blog.id.toString();
        } else {
          return NextResponse.json({ error: "No blogs found on your Shopify store and failed to auto-create a 'News' blog category." }, { status: 400 });
        }
      }
    }

    const title = content.generated_title || content.h1;
    const bodyHtml = mdToHtml(content.generated_content || "");

    const shopifyPayload = {
      article: {
        title,
        body_html: bodyHtml,
        published: publishStatus === "active",
        author: "SoloSpider",
        image: content.featured_image_url ? { src: content.featured_image_url } : undefined,
      },
    };

    console.log(`[PublishToShopify] Sending article to Shopify store: ${shopName}, blog ID: ${targetBlogId}`);

    const wpResponse = await fetch(`https://${shopName}/admin/api/2024-01/blogs/${targetBlogId}/articles.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shopifyPayload),
    });

    const responseText = await wpResponse.text();
    let shopifyData: any = null;
    try {
      shopifyData = JSON.parse(responseText);
    } catch (e) {
      console.error("[PublishToShopify] Shopify response was not JSON:", responseText);
      return NextResponse.json({ error: `Shopify returned non-JSON response (Status ${wpResponse.status})` }, { status: 500 });
    }

    if (!wpResponse.ok) {
      console.error("[PublishToShopify] Shopify REST API error:", shopifyData);
      return NextResponse.json({ error: JSON.stringify(shopifyData.errors) || `Shopify returned status ${wpResponse.status}` }, { status: wpResponse.status });
    }

    // Update status in database
    const { error: updateErr } = await supabase
      .from("content_items")
      .update({
        status: "published",
      })
      .eq("id", contentId);

    if (updateErr) throw updateErr;

    const articleUrl = `https://${shopName}/blogs/${shopifyData.article.handle}`;

    return NextResponse.json({ ok: true, wpPostId: shopifyData.article.id, link: articleUrl });
  } catch (error: any) {
    console.error("[PublishToShopify] Error publishing to Shopify:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
