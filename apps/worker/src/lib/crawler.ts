// ── Site crawler library ────────────────────────────────────────────────────
// Discovers URLs via sitemap.xml (multiple candidates), falls back to
// crawling homepage links, then Google Search discovery for blocked sites.
// Returns crawled page metadata.
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

// Multiple User-Agent strings for rotation — bypass WAFs/bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

const TIMEOUT = 8000;

let uaIndex = 0;
function getNextUA(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

async function fetchPage(url: string, retryCount = 1): Promise<{ html: string; status: number; error?: string } | null> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const ua = getNextUA();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
        },
        redirect: "follow",
      });
      const html = await res.text();
      clearTimeout(timer);
      if (res.status === 429 && attempt < retryCount) {
        console.log(`[Crawler] 429 rate limit on ${url}. Waiting 3s...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      return { html, status: res.status };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retryCount) {
        console.log(`[Crawler] Fetch attempt ${attempt + 1} failed for ${url}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
    }
  }
  return { html: "", status: 0, error: lastError ? (lastError.message || String(lastError)) : "Unknown fetch error" };
}

/**
 * Fallback page fetcher — tries Google Web Cache when direct fetch fails (403/blocked).
 * This lets us audit pages from sites that block direct crawling.
 */
async function fetchPageWithFallback(url: string): Promise<{ html: string; status: number; error?: string; cached?: boolean } | null> {
  // 1. Try direct fetch first
  const directResult = await fetchPage(url, 1);
  if (directResult && directResult.status >= 200 && directResult.status < 400 && directResult.html.length > 500) {
    return directResult;
  }

  // If the page does not exist (e.g. 404) or is a normal client/server error (except 403/429 blocking), return immediately
  if (directResult && directResult.status > 0 && directResult.status !== 403 && directResult.status !== 429) {
    return directResult;
  }

  // 2. Fallback: Try Google Web Cache
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&strip=0`;
    console.log(`[Crawler] Direct fetch failed for ${url} (status: ${directResult?.status}). Trying Google Cache...`);
    const cacheResult = await fetchPage(cacheUrl, 1);
    if (cacheResult && cacheResult.status >= 200 && cacheResult.status < 400 && cacheResult.html.length > 500) {
      // Strip Google's cache wrapper to get clean HTML
      let html = cacheResult.html;
      const bodyStart = html.indexOf('<div id="google-cache-hdr">');
      if (bodyStart > -1) {
        const bodyAfter = html.indexOf('</div>', bodyStart);
        if (bodyAfter > -1) {
          html = html.slice(bodyAfter + 6);
        }
      }
      console.log(`[Crawler] ✅ Got page from Google Cache: ${url}`);
      return { html, status: 200, cached: true };
    }
  } catch (e: any) {
    console.log(`[Crawler] Google Cache fallback failed for ${url}: ${e.message}`);
  }

  // 3. Fallback: Try Google AMP Cache
  try {
    const ampUrl = url.replace(/^https?:\/\//, "");
    const ampCacheUrl = `https://${ampUrl.replace(/\//g, "/").split("/")[0]}.cdn.ampproject.org/c/s/${ampUrl}`;
    const ampResult = await fetchPage(ampCacheUrl, 0);
    if (ampResult && ampResult.status >= 200 && ampResult.status < 400 && ampResult.html.length > 300) {
      console.log(`[Crawler] ✅ Got page from AMP Cache: ${url}`);
      return { html: ampResult.html, status: 200, cached: true };
    }
  } catch { /* silent */ }

  // 4. Fallback: Try archive.org's Wayback Machine
  try {
    const waybackUrl = `https://web.archive.org/web/2024/${url}`;
    console.log(`[Crawler] Trying Wayback Machine for ${url}...`);
    const waybackResult = await fetchPage(waybackUrl, 0);
    if (waybackResult && waybackResult.status >= 200 && waybackResult.status < 400 && waybackResult.html.length > 500) {
      console.log(`[Crawler] ✅ Got page from Wayback Machine: ${url}`);
      return { html: waybackResult.html, status: 200, cached: true };
    }
  } catch { /* silent */ }

  // Return the original (failed) result
  return directResult;
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

/**
 * Discovers URLs for a site using Google Search (site:domain.com).
 * This is the ultimate fallback when both sitemap and BFS crawl fail
 * (e.g. when the site blocks crawlers with 403).
 */
async function discoverUrlsViaGoogleSearch(origin: string, maxPages: number): Promise<string[]> {
  const domain = new URL(origin).hostname;
  const urls: string[] = [];
  const seen = new Set<string>();
  
  // Google Search pages to try (each gives ~10 results)
  const pagesToFetch = Math.min(Math.ceil(maxPages / 8), 15);
  
  for (let page = 0; page < pagesToFetch && urls.length < maxPages; page++) {
    const start = page * 10;
    const searchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(domain)}&start=${start}&num=10`;
    
    try {
      const ua = getNextUA();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.google.com/",
        },
        redirect: "follow",
      });
      clearTimeout(timer);

      if (res.status !== 200) {
        console.log(`[Crawler] Google Search returned ${res.status} on page ${page + 1}`);
        break;
      }

      const html = await res.text();
      
      // Extract URLs from Google search results
      // Google embeds result URLs in various formats
      const urlPatterns = [
        // Standard href links matching the domain
        new RegExp(`href="(https?://(?:www\\.)?${domain.replace(/\./g, "\\.")}[^"]*)"`, "gi"),
        // /url?q= format (Google redirect wrapper)
        new RegExp(`/url\\?q=(https?://(?:www\\.)?${domain.replace(/\./g, "\\.")}[^&"]+)`, "gi"),
        // data-href or data-url attributes
        new RegExp(`data-(?:href|url)="(https?://(?:www\\.)?${domain.replace(/\./g, "\\.")}[^"]*)"`, "gi"),
      ];

      for (const pattern of urlPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          let u = decodeURIComponent(match[1]).split("&")[0].replace(/\/$/, "");
          // Clean Google's tracking params
          u = u.split("?")[0].replace(/\/$/, "");
          
          if (u.startsWith(origin) && !seen.has(u) && !isNonUserPage(u)) {
            seen.add(u);
            urls.push(u);
            if (urls.length >= maxPages) break;
          }
        }
      }

      // Brief delay between Google searches to avoid rate limiting
      if (page < pagesToFetch - 1) {
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      }
    } catch (err: any) {
      console.log(`[Crawler] Google Search page ${page + 1} failed: ${err.message}`);
      break;
    }
  }

  console.log(`[Crawler] Google Search discovered ${urls.length} URLs for ${domain}`);
  return urls;
}

/**
 * Discovers URLs using Bing Search as additional fallback.
 */
async function discoverUrlsViaBingSearch(origin: string, maxPages: number): Promise<string[]> {
  const domain = new URL(origin).hostname;
  const urls: string[] = [];
  const seen = new Set<string>();
  
  const pagesToFetch = Math.min(Math.ceil(maxPages / 8), 10);
  
  for (let page = 0; page < pagesToFetch && urls.length < maxPages; page++) {
    const first = page * 10 + 1;
    const searchUrl = `https://www.bing.com/search?q=site:${encodeURIComponent(domain)}&first=${first}`;
    
    try {
      const ua = getNextUA();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
      clearTimeout(timer);

      if (res.status !== 200) break;

      const html = await res.text();
      
      // Extract URLs from Bing results
      const pattern = new RegExp(`href="(https?://(?:www\\.)?${domain.replace(/\./g, "\\.")}[^"]*)"`, "gi");
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let u = match[1].split("?")[0].replace(/\/$/, "");
        if (u.startsWith(origin) && !seen.has(u) && !isNonUserPage(u)) {
          seen.add(u);
          urls.push(u);
          if (urls.length >= maxPages) break;
        }
      }

      if (page < pagesToFetch - 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
      }
    } catch (err: any) {
      console.log(`[Crawler] Bing Search page ${page + 1} failed: ${err.message}`);
      break;
    }
  }

  console.log(`[Crawler] Bing Search discovered ${urls.length} URLs for ${domain}`);
  return urls;
}

/**
 * Generate common URL patterns for a website based on typical site structures.
 * Used as final fallback when all other discovery methods fail.
 */
function generateCommonUrlPatterns(origin: string): string[] {
  const commonPaths = [
    "", "/about", "/about-us", "/contact", "/contact-us",
    "/services", "/products", "/pricing", "/features",
    "/blog", "/faq", "/careers", "/privacy", "/terms"
  ];
  
  return commonPaths.map(p => `${origin}${p}`.replace(/\/$/, ""));
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
    // ── Strategy 1: Sitemap URLs found ──
    pageUrls.forEach(u => queue.push({ url: u, source: "sitemap" }));
    console.log(`[Crawler] Strategy 1 (Sitemap): Found ${pageUrls.length} URLs`);
  } else {
    // ── Strategy 2: BFS Crawl ──
    console.log(`[Crawler] No sitemap found. Trying BFS crawl from homepage...`);
    const startUrl = origin.replace(/\/$/, "");
    const discovered = new Set<string>([startUrl]);
    const crawlQueue = [startUrl];
    const visited = new Set<string>();
    let fetchedCount = 0;
    const maxDiscoveryFetches = Math.max(15, maxPages * 2);
    let directFetchBlocked = false;

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
            if (!isNonUserPage(cleanLink)) {
              crawlQueue.push(cleanLink);
            }
            if (discovered.size >= maxPages) break;
          }
        }
      } else {
        // Track if the site is blocking us
        if (page && (page.status === 403 || page.status === 0)) {
          directFetchBlocked = true;
        }
      }
    }

    // Only add BFS results if we found more than just the homepage
    if (discovered.size > 1) {
      discovered.forEach(u => queue.push({ url: u, source: "crawl" }));
      console.log(`[Crawler] Strategy 2 (BFS): Found ${discovered.size} URLs`);
    }

    // ── Strategy 3: Google Search discovery (when site blocks crawlers) ──
    if (queue.length < maxPages && (directFetchBlocked || queue.length <= 1)) {
      console.log(`[Crawler] Site appears to block direct crawling (got ${queue.length} URLs). Trying Google Search discovery...`);
      const remaining = maxPages - queue.length;
      const existingUrls = new Set(queue.map(q => q.url.replace(/\/$/, "")));
      
      const googleUrls = await discoverUrlsViaGoogleSearch(origin, remaining + 20);
      for (const u of googleUrls) {
        const uClean = u.replace(/\/$/, "");
        if (!existingUrls.has(uClean)) {
          queue.push({ url: uClean, source: "crawl" });
          existingUrls.add(uClean);
        }
        if (queue.length >= maxPages) break;
      }
      console.log(`[Crawler] Strategy 3 (Google): Total URLs after Google = ${queue.length}`);
    }

    // ── Strategy 4: Bing Search discovery ──
    if (queue.length < maxPages && queue.length < Math.floor(maxPages * 0.5)) {
      console.log(`[Crawler] Still only ${queue.length} URLs. Trying Bing Search discovery...`);
      const remaining = maxPages - queue.length;
      const existingUrls = new Set(queue.map(q => q.url.replace(/\/$/, "")));
      
      const bingUrls = await discoverUrlsViaBingSearch(origin, remaining + 20);
      for (const u of bingUrls) {
        const uClean = u.replace(/\/$/, "");
        if (!existingUrls.has(uClean)) {
          queue.push({ url: uClean, source: "crawl" });
          existingUrls.add(uClean);
        }
        if (queue.length >= maxPages) break;
      }
      console.log(`[Crawler] Strategy 4 (Bing): Total URLs after Bing = ${queue.length}`);
    }

    // ── Strategy 5: Common URL patterns as final fallback ──
    if (queue.length < maxPages && queue.length < Math.floor(maxPages * 0.5)) {
      console.log(`[Crawler] Still only ${queue.length} URLs. Probing common URL patterns...`);
      const existingUrls = new Set(queue.map(q => q.url.replace(/\/$/, "")));
      const commonUrls = generateCommonUrlPatterns(origin);
      
      // Probe common URLs in parallel batches of 8
      for (let i = 0; i < commonUrls.length && queue.length < maxPages; i += 8) {
        const batch = commonUrls.slice(i, i + 8);
        const results = await Promise.allSettled(
          batch.map(async (u) => {
            if (existingUrls.has(u)) return null;
            const page = await fetchPage(u, 0);
            if (page && page.status >= 200 && page.status < 400) {
              return u;
            }
            return null;
          })
        );
        
        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            const uClean = result.value.replace(/\/$/, "");
            if (!existingUrls.has(uClean)) {
              queue.push({ url: uClean, source: "crawl" });
              existingUrls.add(uClean);
            }
          }
        }
      }
      console.log(`[Crawler] Strategy 5 (Common Patterns): Total URLs = ${queue.length}`);
    }

    // ── Strategy 6: Secondary BFS from discovered working pages ──
    // Now that we have some valid pages, crawl them for internal links to find more
    if (queue.length < maxPages && queue.length > 0) {
      console.log(`[Crawler] Running secondary BFS from ${queue.length} discovered pages to find more...`);
      const existingUrls = new Set(queue.map(q => q.url.replace(/\/$/, "")));
      const pagesToScan = [...queue].slice(0, Math.min(queue.length, 20)); // Scan up to 20 pages for links
      
      for (const item of pagesToScan) {
        if (queue.length >= maxPages) break;
        
        const page = await fetchPage(item.url, 0);
        if (page && page.status >= 200 && page.status < 400 && page.html.length > 100) {
          const links = extractLinks(page.html, item.url, origin);
          for (const link of links) {
            const cleanLink = link.replace(/\/$/, "");
            if (!existingUrls.has(cleanLink) && !isNonUserPage(cleanLink)) {
              existingUrls.add(cleanLink);
              queue.push({ url: cleanLink, source: "crawl" });
              if (queue.length >= maxPages) break;
            }
          }
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
      }
      console.log(`[Crawler] Strategy 6 (Secondary BFS): Total URLs = ${queue.length}`);
    }
  }

  // Deduplicate and slice
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
  // Use the robust fallback fetcher that tries Google Cache and Wayback Machine
  const page = await fetchPageWithFallback(url);

  if (!page || page.status >= 400 || page.status === 0) {
    // Record failed pages honestly
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
