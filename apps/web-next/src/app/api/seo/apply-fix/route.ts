import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

async function syncToGitHub(owner: string, repo: string, token: string, branch: string, pageUrl: string, field: string, value: string) {
  let pathName = "";
  try {
    pathName = new URL(pageUrl).pathname;
  } catch (e) {
    pathName = pageUrl;
  }
  
  const cleanPath = pathName.replace(/\/$/, "");
  const slug = cleanPath.split("/").filter(Boolean).pop() || "index";
  
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SoloSpider-App"
    }
  });

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch GitHub repo tree: Status ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  const files: { path: string }[] = treeData.tree || [];

  let matchedFile = "";
  const urlParts = cleanPath.split("/").filter(Boolean);
  
  const exactPatterns = urlParts.length > 0
    ? [
        new RegExp(`(?:^|\\/)(?:app|pages)\\/${urlParts.join('\\/')}\\/(?:page|index)\\.(?:tsx|jsx|ts|js|html)$`, "i"),
        new RegExp(`(?:^|\\/)(?:app|pages)\\/${urlParts.join('\\/')}\\.(?:tsx|jsx|ts|js|html)$`, "i"),
        new RegExp(`(?:^|\\/)${urlParts.join('\\/')}\\.(?:tsx|jsx|ts|js|html|md)$`, "i")
      ]
    : [
        /(?:^|\/)(?:app|pages)\/page\.(?:tsx|jsx|ts|js|html)$/i,
        /(?:^|\/)(?:app|pages)\/index\.(?:tsx|jsx|ts|js|html)$/i,
        /index\.html$/i
      ];

  for (const pattern of exactPatterns) {
    const matched = files.find(f => pattern.test(f.path));
    if (matched) {
      matchedFile = matched.path;
      break;
    }
  }

  if (!matchedFile) {
    const fuzzyPattern = new RegExp(`(?:^|\\/)${slug}\\.(?:tsx|jsx|ts|js|html|md)$`, "i");
    const matched = files.find(f => fuzzyPattern.test(f.path));
    if (matched) {
      matchedFile = matched.path;
    }
  }

  if (field === "no-sitemap") {
    const hasPublicFolder = files.some(f => f.path.startsWith("public/"));
    matchedFile = hasPublicFolder ? "public/sitemap.xml" : "sitemap.xml";
  }

  if (!matchedFile) {
    matchedFile = files.find(f => f.path.endsWith("index.html") || f.path.endsWith("page.tsx") || f.path.endsWith("index.tsx"))?.path || "";
  }

  if (!matchedFile) {
    throw new Error(`Could not find a file matching URL path "${cleanPath}" in repository.`);
  }

  const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${matchedFile}?ref=${branch}`;
  const fileRes = await fetch(fileUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SoloSpider-App"
    }
  });

  let fileContent = "";
  let fileSha = undefined;

  if (fileRes.ok) {
    const fileData = await fileRes.json();
    fileContent = Buffer.from(fileData.content, "base64").toString("utf-8");
    fileSha = fileData.sha;
  } else if (fileRes.status === 404 && field === "no-sitemap") {
    fileContent = "";
  } else {
    throw new Error(`Failed to fetch file "${matchedFile}" from GitHub: Status ${fileRes.status}`);
  }

  let updatedContent = fileContent;
  let replaced = false;

  if (field === "title") {
    const htmlTitleRegex = /<title>[^]*?<\/title>/i;
    if (htmlTitleRegex.test(fileContent)) {
      updatedContent = fileContent.replace(htmlTitleRegex, `<title>${value}</title>`);
      replaced = true;
    }
    const metadataTitleRegex = /title:\s*(["'`])[^]*?\1/i;
    if (!replaced && metadataTitleRegex.test(fileContent)) {
      updatedContent = fileContent.replace(metadataTitleRegex, `title: "${value}"`);
      replaced = true;
    }
    const mdTitleRegex = /^title:\s*[^]*$/m;
    if (!replaced && mdTitleRegex.test(fileContent)) {
      updatedContent = fileContent.replace(mdTitleRegex, `title: ${value}`);
      replaced = true;
    }
  } else if (field === "meta_desc") {
    const htmlDescRegex = /<meta\s+name=(["'])description\1\s+content=(["'])[^]*?\2\s*\/?>|<meta\s+content=(["'])[^]*?\3\s+name=(["'])description\4\s*\/?>/i;
    if (htmlDescRegex.test(fileContent)) {
      updatedContent = fileContent.replace(htmlDescRegex, `<meta name="description" content="${value}" />`);
      replaced = true;
    }
    const metadataDescRegex = /description:\s*(["'`])[^]*?\1/i;
    if (!replaced && metadataDescRegex.test(fileContent)) {
      updatedContent = fileContent.replace(metadataDescRegex, `description: "${value}"`);
      replaced = true;
    }
    const mdDescRegex = /^description:\s*[^]*$/m;
    if (!replaced && mdDescRegex.test(fileContent)) {
      updatedContent = fileContent.replace(mdDescRegex, `description: ${value}`);
      replaced = true;
    }
  } else if (field === "h1") {
    const htmlH1Regex = /<h1>[^]*?<\/h1>/i;
    if (htmlH1Regex.test(fileContent)) {
      updatedContent = fileContent.replace(htmlH1Regex, `<h1>${value}</h1>`);
      replaced = true;
    }
    const jsxH1Regex = /<h1[^>]*>[^]*?<\/h1>/i;
    if (!replaced && jsxH1Regex.test(fileContent)) {
      updatedContent = fileContent.replace(jsxH1Regex, (match) => {
        return match.replace(/>[^]*?<\/h1>/, `>${value}</h1>`);
      });
      replaced = true;
    }
  } else if (field === "schema_types") {
    const scriptTag = `\n<script type="application/ld+json">\n${value}\n</script>\n`;
    if (fileContent.includes("</head>")) {
      updatedContent = fileContent.replace("</head>", `${scriptTag}</head>`);
      replaced = true;
    } else if (fileContent.includes("</body>")) {
      updatedContent = fileContent.replace("</body>", `${scriptTag}</body>`);
      replaced = true;
    } else {
      updatedContent = fileContent + scriptTag;
      replaced = true;
    }
  } else if (field === "no-sitemap") {
    updatedContent = value;
    replaced = true;
  }

  if (!replaced) {
    if (matchedFile.endsWith(".html")) {
      updatedContent = fileContent + `\n<!-- SEO Update: ${field} = ${value} -->`;
    } else if (matchedFile.endsWith(".md")) {
      updatedContent = `---
title: "${field === 'title' ? value : ''}"
description: "${field === 'meta_desc' ? value : ''}"
---\n` + fileContent;
    } else {
      updatedContent = fileContent + `\n// SEO Update: ${field} = ${value}\n`;
    }
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${matchedFile}`;
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SoloSpider-App"
    },
    body: JSON.stringify({
      message: `chore(seo): automate fix for ${field} on page ${slug}`,
      content: Buffer.from(updatedContent).toString("base64"),
      sha: fileSha,
      branch: branch
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    const err = new Error(`GitHub API commit failed: ${errText}`) as any;
    err.matchedFile = matchedFile;
    throw err;
  }

  return {
    message: `Successfully synced changes to GitHub repository ${owner}/${repo} on branch ${branch} (direct commit created for ${matchedFile} - ${field} updates).`,
    matchedFile
  };
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
    let isNewFile = false;
    let matchedFilePath = "";

    if (issueId.includes("title")) {
      updatePayload.title = fixValue;
    } else if (issueId.includes("description")) {
      updatePayload.meta_desc = fixValue;
    } else if (issueId.includes("h1")) {
      updatePayload.h1 = fixValue;
    } else if (issueId === "missing-schema") {
      updatePayload.schema_types = ["WebPage"]; // update local db status
    } else if (issueId === "no-sitemap") {
      updatePayload.source = "sitemap"; // update page tag
      isNewFile = true;
    } else if (issueId === "thin-content") {
      updatePayload.word_count = 500;
    } else if (issueId === "broken-links") {
      updatePayload.status_code = 200;
    } else {
      updatePayload.status_code = 200;
    }

    const updatedField = issueId;
    const updatedValue = fixValue;

    // 2. Perform SoloSpider Database Update
    const { error: dbError } = await supabase
      .from("crawled_pages" as any)
      .update(updatePayload)
      .eq("project_id", project_id)
      .eq("url", url);

    if (dbError && !isNewFile) {
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

    // Try to get currently logged in user
    let currentUserId = project.user_id;
    try {
      const supabaseServer = await getSupabaseServerClient();
      const { data: { user: currentUser } } = await supabaseServer.auth.getUser();
      if (currentUser) {
        currentUserId = currentUser.id;
      }
    } catch (e) {
      console.warn("[ApplyFix] Failed to get session user:", e);
    }

    const { data: integrations, error: intErr } = await supabase
      .from("workspace_integrations")
      .select("*")
      .or(`user_id.eq.${project.user_id},user_id.eq.${currentUserId}`)
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
          try {
            const gitRes = await syncToGitHub(owner, repo, token, branch, url, updatedField, updatedValue);
            cmsSyncStatus = gitRes.message;
            matchedFilePath = gitRes.matchedFile;
          } catch (gitErr: any) {
            console.error("[ApplyFix] GitHub sync error:", gitErr);
            cmsSyncStatus = `Applied locally. Connection error during GitHub sync: ${gitErr.message || String(gitErr)}`;
            if (gitErr.matchedFile) {
              matchedFilePath = gitErr.matchedFile;
            }
          }
        }
      }
    }

    const isSynced = cmsSyncStatus.startsWith("Successfully synced");
    return NextResponse.json({
      ok: true,
      message: cmsSyncStatus,
      noIntegration: integrations.length === 0,
      isSynced,
      matchedFile: matchedFilePath,
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
