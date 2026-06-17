// ── Site crawler library ────────────────────────────────────────────────────
// Discovers URLs via sitemap.xml (multiple candidates), falls back to
// crawling homepage links. Returns crawled page metadata.
// ALL DATA IS REAL — no simulated/fake pages.

export interface CrawledPageData {
  url:            string;
  title:          string | null;
  meta_desc:      string | null;
  h1:             string | null;
  word_count:     number;
  schema_types:   string[];
  has_faq_schema: boolean;
  has_howto:      boolean;
  status_code:    number | null;
  source:         "sitemap" | "crawl" | "manual";
}

// Real Chrome browser User-Agent — most sites block bot UAs
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const FALLBACK_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const TIMEOUT = 30_000; // 30 seconds — many real sites need 5-10s with DNS/TLS, especially when crawled in batches

async function fetchPage(url: string, retryCount = 1): Promise<{ html: string; status: number; error?: string } | null> {
  const userAgents = [CHROME_UA, FALLBACK_UA];
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const ua = userAgents[attempt % userAgents.length];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
        },
        redirect: "follow",
      });
      const html = await res.text();
      clearTimeout(timer);
      if (res.status === 429 && attempt < retryCount) {
        console.log(`[Crawler] 429 rate limit encountered for ${url}. Waiting 2s before retry...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return { html, status: res.status };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retryCount) {
        console.log(`[Crawler] Fetch attempt ${attempt + 1} failed for ${url}, retrying with different UA...`);
        await new Promise(r => setTimeout(r, 500)); // brief delay before retry
        continue;
      }
    }
  }
  return { html: "", status: 0, error: lastError ? (lastError.message || String(lastError)) : "Unknown fetch error" };
}

function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const u = decodeHtmlEntities(m[1].trim());
    if (u && u.startsWith("http")) urls.push(u);
  }
  return [...new Set(urls)];
}

function isNonUserPage(url: string): boolean {
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  
  // 1. File extension check
  const assetExtensions = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
    ".css", ".js", ".json", ".xml", ".txt",
    ".pdf", ".zip", ".rar", ".tar", ".gz",
    ".mp4", ".mp3", ".wav", ".avi", ".mov",
    ".woff", ".woff2", ".ttf", ".eot",
    ".md"
  ];
  if (assetExtensions.some(ext => clean.endsWith(ext) || clean.includes(ext + "/"))) {
    return true;
  }

  // 2. Specific path/keyword checks for non-user pages
  const nonUserKeywords = [
    "/wp-json",
    "/feed",
    "/rss",
    "/atom",
    "sitemap",
    "xmlrpc.php",
    "/wp-admin",
    "/wp-includes",
    "/wp-content",
    "_next/",
    "_vercel/",
    "/api/",
    "/fonts/",
    "/assets/",
    "/static/"
  ];
  
  if (nonUserKeywords.some(kw => clean.includes(kw))) {
    return true;
  }

  return false;
}

function extractLinks(html: string, base: string, origin: string): string[] {
  const urls: string[] = [];
  const re = /href=["']([^"'#?]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const abs = new URL(m[1], base).href;
      if (abs.startsWith(origin)) {
        const clean = abs.split("?")[0].replace(/\/$/, "");
        if (!isNonUserPage(clean)) {
          urls.push(clean);
        }
      }
    } catch { /* skip */ }
  }
  return [...new Set(urls)];
}

function decodeHtmlEntities(str: string | null): string | null {
  if (!str) return null;
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

function parseMeta(html: string): Omit<CrawledPageData, "url" | "status_code" | "source"> {
  const titleM  = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const title   = titleM ? decodeHtmlEntities(titleM[1].trim().slice(0, 250)) : null;

  const metaM   = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html)
               ?? /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i.exec(html);
  const meta_desc = metaM ? decodeHtmlEntities(metaM[1].trim().slice(0, 500)) : null;

  const h1M = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  let h1 = null;
  if (h1M) {
    let h1Text = h1M[1].replace(/<[^>]+>/g, " ").trim();
    if (!h1Text) {
      const imgAltM = /<img[^>]+alt=["']([^"']*)["']/i.exec(h1M[1]);
      if (imgAltM) {
        h1Text = imgAltM[1].trim() || "Logo";
      } else if (h1M[1].includes("<img") || h1M[1].includes("<svg")) {
        h1Text = "Logo / Brand Header";
      } else {
        h1Text = "Brand Header";
      }
    }
    h1 = decodeHtmlEntities(h1Text.slice(0, 250));
  }

  const text       = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const word_count = text.trim().split(" ").filter(Boolean).length;

  const schemaRe   = /"@type"\s*:\s*"([^"]+)"/g;
  const schemaTypes: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = schemaRe.exec(html)) !== null) schemaTypes.push(sm[1]);
  const schema_types   = [...new Set(schemaTypes)];
  const has_faq_schema = schema_types.some(s => s.toLowerCase().includes("faq"));
  const has_howto      = schema_types.some(s => s.toLowerCase().includes("howto"));

  return { title, meta_desc, h1, word_count, schema_types, has_faq_schema, has_howto };
}

export async function discoverUrls(
  website: string,
  maxPages: number
): Promise<Array<{ url: string; source: "sitemap" | "crawl" }>> {
  let origin = "";
  try {
    let target = website.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }
    origin = new URL(target).origin;
  } catch (e) {
    console.error(`[Crawler] Invalid website URL format: ${website}`, e);
    origin = website.startsWith("http") ? website : `https://${website}`;
  }
  const pageUrls: string[] = [];
  const sitemapsToProcess = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.txt`,
    `${origin}/sitemap`,
  ];

  // Try to discover sitemap URLs from robots.txt first
  try {
    const robotsPage = await fetchPage(`${origin}/robots.txt`);
    if (robotsPage && robotsPage.status < 400 && robotsPage.status > 0) {
      const re = /sitemap:\s*(https?:\/\/[^\s#]+)/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(robotsPage.html)) !== null) {
        const sUrl = match[1].trim();
        if (sUrl && !sitemapsToProcess.includes(sUrl)) {
          sitemapsToProcess.unshift(sUrl); // prioritize discovered sitemap
        }
      }
    }
  } catch (err) {
    console.warn(`[Crawler] Failed to parse robots.txt sitemaps:`, err);
  }

  const processedSitemaps = new Set<string>();
  const maxSitemapsToFetch = 15;
  let sitemapsFetchedCount = 0;
  let foundSitemap = false;

  let sitemapIndex = 0;
  while (sitemapIndex < sitemapsToProcess.length && pageUrls.length < maxPages && sitemapsFetchedCount < maxSitemapsToFetch) {
    const sm = sitemapsToProcess[sitemapIndex++];
    const normSm = sm.trim().toLowerCase();
    if (processedSitemaps.has(normSm)) continue;
    processedSitemaps.add(normSm);

    sitemapsFetchedCount++;
    const page = await fetchPage(sm);
    if (page && page.status < 400 && page.status > 0) {
      const extracted = extractSitemapUrls(page.html)
        .filter(u => u.startsWith(origin));

      if (extracted.length > 0) {
        foundSitemap = true;
        for (const u of extracted) {
          const uClean = u.replace(/\/$/, "");
          const uLower = uClean.toLowerCase();
          const isXml = uLower.split("?")[0].endsWith(".xml") || uLower.includes("/sitemap");

          if (isXml) {
            if (!processedSitemaps.has(uLower)) {
              sitemapsToProcess.push(u);
            }
          } else {
            if (!isNonUserPage(uClean) && !pageUrls.includes(uClean)) {
              pageUrls.push(uClean);
              if (pageUrls.length >= maxPages) break;
            }
          }
        }
      }
    }
  }

  const queue: Array<{ url: string; source: "sitemap" | "crawl" }> = [];
  if (foundSitemap && pageUrls.length > 0) {
    pageUrls.forEach(u => queue.push({ url: u, source: "sitemap" }));
  } else {
    // Fallback: BFS crawl starting from homepage
    const startUrl = website.replace(/\/$/, "");
    const discovered = new Set<string>([startUrl]);
    const crawlQueue = [startUrl];
    const visited = new Set<string>();
    let fetchedCount = 0;
    const maxDiscoveryFetches = Math.max(15, maxPages * 2);

    while (crawlQueue.length > 0 && discovered.size < maxPages && fetchedCount < maxDiscoveryFetches) {
      const currentUrl = crawlQueue.shift()!;
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      fetchedCount++;
      const page = await fetchPage(currentUrl);
      if (page && page.status < 400 && page.status > 0) {
        const links = extractLinks(page.html, currentUrl, origin);
        for (const link of links) {
          const cleanLink = link.replace(/\/$/, "");
          if (cleanLink.startsWith(origin) && !discovered.has(cleanLink)) {
            discovered.add(cleanLink);

            // Only enqueue for BFS link extraction if it's likely an HTML page
            if (!isNonUserPage(cleanLink)) {
              crawlQueue.push(cleanLink);
            }

            if (discovered.size >= maxPages) break;
          }
        }
      }
    }

    discovered.forEach(u => {
      queue.push({ url: u, source: "crawl" });
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  return queue.filter(item => {
    const norm = item.url.replace(/\/$/, "");
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  }).slice(0, maxPages);
}

export async function crawlPage(
  url: string,
  source: "sitemap" | "crawl"
): Promise<CrawledPageData> {
  const page = await fetchPage(url);

  if (!page || page.status >= 400 || page.status === 0) {
    // Honestly record failed pages — no fake data
    return {
      url,
      title: page?.error ? `Fetch Error: ${page.error}` : "Failed to load",
      meta_desc: null,
      h1: null,
      word_count: 0,
      schema_types: [],
      has_faq_schema: false,
      has_howto: false,
      status_code: page ? (page.status || null) : null,
      source,
    };
  }

  return { url, ...parseMeta(page.html), status_code: page.status, source };
}

