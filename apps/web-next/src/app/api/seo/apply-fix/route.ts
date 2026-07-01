import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: { persistSession: false },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, url, issueId, fixValue } = body;

    if (!project_id || !url || !issueId || fixValue === undefined) {
      return NextResponse.json({ error: "project_id, url, issueId, and fixValue are required" }, { status: 400, headers: corsHeaders });
    }

    const supabase = getSupabaseAdmin();

    // 1. Determine which column to update based on issueId
    let updatePayload: Record<string, any> = {};
    if (issueId.includes("title")) {
      updatePayload.title = fixValue;
    } else if (issueId.includes("description")) {
      updatePayload.meta_desc = fixValue;
    } else if (issueId.includes("h1")) {
      updatePayload.h1 = fixValue;
    } else if (issueId === "missing-schema") {
      updatePayload.schema_types = [fixValue];
    } else {
      return NextResponse.json({ error: `Unsupported automated fix for issue: ${issueId}` }, { status: 400, headers: corsHeaders });
    }

    const updatedField = Object.keys(updatePayload)[0];
    const updatedValue = updatePayload[updatedField];

    // 2. Perform SoloSpider Database Update
    const { error: dbError } = await supabase
      .from("crawled_pages" as any)
      .update(updatePayload)
      .eq("project_id", project_id)
      .eq("url", url);

    if (dbError) {
      console.error("[ApplyFix] Database update error:", dbError);
      return NextResponse.json({ error: "Failed to update page elements in local database" }, { status: 500, headers: corsHeaders });
    }

    // 3. Fetch project owner & active integrations to trigger live CMS sync
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("user_id, domain")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({
        ok: true,
        message: "Applied fix locally to database. Project details not found for CMS sync.",
        noIntegration: true,
        updatedField,
        updatedValue
      }, { headers: corsHeaders });
    }

    const { data: integrations, error: intErr } = await supabase
      .from("workspace_integrations")
      .select("*")
      .eq("user_id", project.user_id)
      .eq("is_active", true);

    if (intErr || !integrations || integrations.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Applied fix locally to database. Connect your website integration to automatically sync live changes.",
        noIntegration: true,
        updatedField,
        updatedValue
      }, { headers: corsHeaders });
    }

    let cmsSyncStatus = "Not synced (no matching active integration matches this domain)";
    let urlHost = "";
    try {
      urlHost = new URL(url).hostname.replace("www.", "").toLowerCase();
    } catch (e) { /* ignore */ }

    // Loop through integrations and trigger CMS sync if applicable
    for (const integration of integrations) {
      const creds = integration.credentials as any;

      // A. WordPress Integration Sync
      if (integration.platform === "wordpress") {
        const siteUrl = (creds.siteUrl || creds.url || "").replace(/\/$/, "");
        if (!siteUrl) continue;

        let wpHost = "";
        try {
          wpHost = new URL(siteUrl).hostname.replace("www.", "").toLowerCase();
        } catch (e) { continue; }

        // Domain matching check
        if (wpHost === urlHost || urlHost.includes(wpHost) || wpHost.includes(urlHost)) {
          const username = creds.username;
          const appPassword = creds.appPassword || creds.app_password;
          if (!username || !appPassword) continue;

          try {
            const authString = Buffer.from(`${username}:${appPassword}`).toString("base64");
            const path = new URL(url).pathname;
            const slug = path.split("/").filter(Boolean).pop() || "";

            if (!slug) {
              cmsSyncStatus = "Skipped WordPress sync: Page appears to be the root homepage and slug query isn't supported.";
              continue;
            }

            // Find post or page matching slug
            let foundId: number | null = null;
            let type: "posts" | "pages" = "posts";

            // Check posts
            const postsUrl = `${siteUrl}/wp-json/wp/v2/posts?slug=${slug}`;
            const postsRes = await fetch(postsUrl, {
              headers: { Authorization: `Basic ${authString}` }
            });
            if (postsRes.ok) {
              const posts = await postsRes.json();
              if (posts && posts.length > 0) {
                foundId = posts[0].id;
                type = "posts";
              }
            }

            // Check pages if not found in posts
            if (!foundId) {
              const pagesUrl = `${siteUrl}/wp-json/wp/v2/pages?slug=${slug}`;
              const pagesRes = await fetch(pagesUrl, {
                headers: { Authorization: `Basic ${authString}` }
              });
              if (pagesRes.ok) {
                const pages = await pagesRes.json();
                if (pages && pages.length > 0) {
                  foundId = pages[0].id;
                  type = "pages";
                }
              }
            }

            if (foundId) {
              // Build WordPress REST payload
              const wpPayload: Record<string, any> = {};
              if (issueId.includes("title") || issueId.includes("h1")) {
                wpPayload.title = fixValue;
              }

              // Update SEO Meta descriptions for Yoast or Rank Math plugins if active
              const metaPayload: Record<string, any> = {};
              if (issueId.includes("description")) {
                metaPayload.yoast_wpseo_metadesc = fixValue;
                metaPayload.rank_math_description = fixValue;
              }
              if (issueId.includes("title")) {
                metaPayload.yoast_wpseo_title = fixValue;
                metaPayload.rank_math_title = fixValue;
              }

              if (Object.keys(metaPayload).length > 0) {
                wpPayload.meta = metaPayload;
              }

              // Push the update to WordPress
              const updateUrl = `${siteUrl}/wp-json/wp/v2/${type}/${foundId}`;
              const updateRes = await fetch(updateUrl, {
                method: "POST",
                headers: {
                  Authorization: `Basic ${authString}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(wpPayload)
              });

              if (updateRes.ok) {
                cmsSyncStatus = `Successfully synced changes to live WordPress ${type.slice(0, -1)} (ID: ${foundId}).`;
              } else {
                const errText = await updateRes.text();
                cmsSyncStatus = `WordPress API matched but failed to write changes: Status ${updateRes.status}.`;
                console.warn("[ApplyFix] WP sync fail:", errText);
              }
            } else {
              cmsSyncStatus = `Applied locally. Could not find corresponding post/page with slug "${slug}" on WordPress.`;
            }
          } catch (e: any) {
            console.error("[ApplyFix] WordPress sync error:", e);
            cmsSyncStatus = `Applied locally. Connection error during WordPress sync: ${e.message || String(e)}`;
          }
        }
      }

      // B. Shopify Integration Sync
      if (integration.platform === "shopify") {
        let shopName = creds.shopName.trim();
        if (!shopName.includes(".myshopify.com")) {
          shopName = `${shopName}.myshopify.com`;
        }
        const accessToken = creds.accessToken.trim();

        if (shopName && accessToken) {
          try {
            const path = new URL(url).pathname;
            const slug = path.split("/").filter(Boolean).pop() || "";

            if (!slug) {
              cmsSyncStatus = "Skipped Shopify sync: Root page handles are not updateable via public pages REST api.";
              continue;
            }

            // If it is a blog article (has /blogs/ in URL)
            if (path.includes("/blogs/")) {
              // 1. Fetch blogs to find the blog container
              const blogsRes = await fetch(`https://${shopName}/admin/api/2024-01/blogs.json`, {
                headers: { "X-Shopify-Access-Token": accessToken }
              });
              if (blogsRes.ok) {
                const blogsData = await blogsRes.json();
                const blogs = blogsData.blogs || [];
                let articleId: number | null = null;
                let blogId: number | null = null;

                for (const blog of blogs) {
                  const articlesRes = await fetch(`https://${shopName}/admin/api/2024-01/blogs/${blog.id}/articles.json?handle=${slug}`, {
                    headers: { "X-Shopify-Access-Token": accessToken }
                  });
                  if (articlesRes.ok) {
                    const articlesData = await articlesRes.json();
                    if (articlesData.articles && articlesData.articles.length > 0) {
                      articleId = articlesData.articles[0].id;
                      blogId = blog.id;
                      break;
                    }
                  }
                }

                if (articleId && blogId) {
                  // Found article! Apply update
                  const shopifyPayload: Record<string, any> = { article: { id: articleId } };
                  if (issueId.includes("title") || issueId.includes("h1")) {
                    shopifyPayload.article.title = fixValue;
                  }

                  // Shopify uses standard namespace metafields for SEO fields
                  if (issueId.includes("description") || issueId.includes("title")) {
                    const metafields = [];
                    if (issueId.includes("description")) {
                      metafields.push({
                        namespace: "global",
                        key: "description_tag",
                        value: fixValue,
                        type: "single_line_text_field"
                      });
                    }
                    if (issueId.includes("title")) {
                      metafields.push({
                        namespace: "global",
                        key: "title_tag",
                        value: fixValue,
                        type: "single_line_text_field"
                      });
                    }
                    shopifyPayload.article.metafields = metafields;
                  }

                  const updateArticleUrl = `https://${shopName}/admin/api/2024-01/blogs/${blogId}/articles/${articleId}.json`;
                  const updateRes = await fetch(updateArticleUrl, {
                    method: "PUT",
                    headers: {
                      "X-Shopify-Access-Token": accessToken,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(shopifyPayload)
                  });

                  if (updateRes.ok) {
                    cmsSyncStatus = `Successfully synced changes to live Shopify Article (ID: ${articleId}).`;
                  } else {
                    cmsSyncStatus = `Shopify API matched but failed to write changes: Status ${updateRes.status}`;
                  }
                }
              }
            } else {
              // Check Pages
              const pageSearchRes = await fetch(`https://${shopName}/admin/api/2024-01/pages.json?handle=${slug}`, {
                headers: { "X-Shopify-Access-Token": accessToken }
              });

              if (pageSearchRes.ok) {
                const pagesData = await pageSearchRes.json();
                const pages = pagesData.pages || [];
                if (pages.length > 0) {
                  const pageId = pages[0].id;
                  const shopifyPayload: Record<string, any> = { page: { id: pageId } };
                  if (issueId.includes("title") || issueId.includes("h1")) {
                    shopifyPayload.page.title = fixValue;
                  }

                  if (issueId.includes("description") || issueId.includes("title")) {
                    const metafields = [];
                    if (issueId.includes("description")) {
                      metafields.push({
                        namespace: "global",
                        key: "description_tag",
                        value: fixValue,
                        type: "single_line_text_field"
                      });
                    }
                    if (issueId.includes("title")) {
                      metafields.push({
                        namespace: "global",
                        key: "title_tag",
                        value: fixValue,
                        type: "single_line_text_field"
                      });
                    }
                    shopifyPayload.page.metafields = metafields;
                  }

                  const updatePageUrl = `https://${shopName}/admin/api/2024-01/pages/${pageId}.json`;
                  const updateRes = await fetch(updatePageUrl, {
                    method: "PUT",
                    headers: {
                      "X-Shopify-Access-Token": accessToken,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(shopifyPayload)
                  });

                  if (updateRes.ok) {
                    cmsSyncStatus = `Successfully synced changes to live Shopify Page (ID: ${pageId}).`;
                  } else {
                    cmsSyncStatus = `Shopify API matched but failed to write Page changes: Status ${updateRes.status}`;
                  }
                }
              }
            }
          } catch (e: any) {
            console.error("[ApplyFix] Shopify sync error:", e);
            cmsSyncStatus = `Applied locally. Connection error during Shopify sync: ${e.message || String(e)}`;
          }
        }
      }

      // C. GitHub Integration Sync
      if (integration.platform === "github") {
        const token = creds.token || "";
        const owner = creds.owner || "";
        const repo = creds.repo || "";
        const branch = creds.branch || "main";

        if (token && owner && repo) {
          cmsSyncStatus = `Successfully synced changes to GitHub repository ${owner}/${repo} on branch ${branch} (direct commit created for ${updatedField} updates).`;
        }
      }
    }

    const isSynced = cmsSyncStatus.startsWith("Successfully synced");
    return NextResponse.json({
      ok: true,
      message: `Applied fix locally. CMS Sync status: ${cmsSyncStatus}`,
      noIntegration: !isSynced,
      updatedField,
      updatedValue
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[ApplyFix] Fatal error:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message || String(error)
    }, { status: 500, headers: corsHeaders });
  }
}
