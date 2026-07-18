import { supabase } from "../lib/supabase.js";

export async function processDueBlogPosts() {
  console.log("[Blogs] Checking for due scheduled blog posts...");
  try {
    const { data: contentItems, error } = await supabase
      .from("content_items")
      .select("*")
      .in("status", ["completed", "draft"])
      .not("scheduled_date", "is", null)
      .lte("scheduled_date", new Date().toISOString())
      .limit(5);

    if (error) throw error;
    if (!contentItems || contentItems.length === 0) return;

    console.log(`[Blogs] Found ${contentItems.length} due blog posts. Publishing...`);

    for (const item of contentItems) {
      // Find active integration for this project
      const { data: integrations } = await supabase
        .from("workspace_integrations")
        .select("*")
        .eq("project_id", item.project_id);

      const wpInt = integrations?.find((i: any) => i.platform === "wordpress" && i.connection_status === "active");
      const shopifyInt = integrations?.find((i: any) => i.platform === "shopify" && i.connection_status === "active");

      if (wpInt) {
        console.log(`[Blogs] Found WordPress integration for project ${item.project_id}. Publishing post ${item.id}...`);
        await publishToWordPress(item, wpInt);
      } else if (shopifyInt) {
        console.log(`[Blogs] Found Shopify integration for project ${item.project_id}. Publishing post ${item.id}...`);
        await publishToShopify(item, shopifyInt);
      } else {
        console.warn(`[Blogs] No active integrations found for project ${item.project_id}. Cannot publish post ${item.id}.`);
        // Update status to failed so it doesn't retry forever
        await supabase
          .from("content_items")
          .update({ status: "failed" })
          .eq("id", item.id);
      }
    }
  } catch (err) {
    console.error("[Blogs] Error publishing scheduled blog posts:", err);
  }
}

async function publishToWordPress(item: any, integration: any) {
  const credentials = integration.credentials as any;
  const siteUrl = (credentials.siteUrl || credentials.url || "").replace(/\/$/, "");
  const username = credentials.username;
  const appPassword = credentials.appPassword || credentials.app_password;

  if (!siteUrl || !username || !appPassword) {
    console.error("[Blogs] WordPress credentials are incomplete.");
    await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
    return;
  }

  try {
    const authString = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const apiUrl = siteUrl.includes(".wordpress.com") 
      ? `https://public-api.wordpress.com/wp/v2/sites/${siteUrl.replace(/^https?:\/\//, "")}/posts`
      : `${siteUrl}/wp-json/wp/v2/posts`;

    const wpPayload = {
      title: item.generated_title || item.h1,
      content: item.generated_content || "",
      status: "publish",
      meta: {
        _yoast_wpseo_title: item.generated_title || item.h1,
        _yoast_wpseo_metadesc: item.meta_description || "",
        _yoast_wpseo_focuskw: item.main_keyword || "",
        rank_math_title: item.generated_title || item.h1,
        rank_math_description: item.meta_description || "",
        rank_math_focus_keyword: item.main_keyword || "",
      }
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpPayload),
    });

    if (res.ok) {
      console.log(`[Blogs] WordPress post published successfully for item ${item.id}!`);
      await supabase
        .from("content_items")
        .update({ status: "published" })
        .eq("id", item.id);
    } else {
      console.error(`[Blogs] WordPress API failed: ${res.status} - ${await res.text()}`);
      await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
    }
  } catch (err) {
    console.error(`[Blogs] Exception during WordPress publishing for item ${item.id}:`, err);
    await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
  }
}

async function publishToShopify(item: any, integration: any) {
  const credentials = integration.credentials as any;
  const shopName = credentials.shopName;
  const accessToken = credentials.accessToken;

  if (!shopName || !accessToken) {
    console.error("[Blogs] Shopify credentials are incomplete.");
    await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
    return;
  }

  try {
    const shopUrl = shopName.includes("myshopify.com") ? shopName : `${shopName}.myshopify.com`;
    
    // Get default blog category id from Shopify
    const blogsRes = await fetch(`https://${shopUrl}/admin/api/2024-04/blogs.json`, {
      headers: { "X-Shopify-Access-Token": accessToken }
    });
    const blogsData = await blogsRes.json() as any;
    const defaultBlogId = blogsData?.blogs?.[0]?.id;

    if (!defaultBlogId) {
      throw new Error("No default Shopify blog category found to publish to.");
    }

    const payload = {
      article: {
        title: item.generated_title || item.h1,
        body_html: item.generated_content || "",
        published: true,
        summary_html: item.meta_description || "",
      }
    };

    const res = await fetch(`https://${shopUrl}/admin/api/2024-04/blogs/${defaultBlogId}/articles.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`[Blogs] Shopify post published successfully for item ${item.id}!`);
      await supabase
        .from("content_items")
        .update({ status: "published" })
        .eq("id", item.id);
    } else {
      console.error(`[Blogs] Shopify API failed: ${res.status} - ${await res.text()}`);
      await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
    }
  } catch (err) {
    console.error(`[Blogs] Exception during Shopify publishing for item ${item.id}:`, err);
    await supabase.from("content_items").update({ status: "failed" }).eq("id", item.id);
  }
}
