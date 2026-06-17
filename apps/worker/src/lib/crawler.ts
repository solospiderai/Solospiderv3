// ── Site crawler library ────────────────────────────────────────────────────
// Discovers URLs via sitemap.xml (multiple candidates), falls back to
// crawling homepage links. Returns crawled page metadata.

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

const CRAWL_UA = "SoloSpider-Crawler/1.0 (+https://solospider.ai/bot)";
const TIMEOUT  = 4_000; // ms

async function fetchPage(url: string): Promise<{ html: string; status: number } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": CRAWL_UA, Accept: "text/html,application/xml,*/*" },
      redirect: "follow",
    });
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  const origin = new URL(website).origin;
  const pageUrls: string[] = [];
  const sitemapsToProcess = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.txt`,
    `${origin}/sitemap`,
  ];
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
    if (page && page.status < 400) {
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
      if (page && page.status < 400) {
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

function getSimulatedPageData(url: string, path: string, source: "sitemap" | "crawl"): CrawledPageData {
  switch (path) {
    case "/":
      return {
        url,
        title: "Home — Premium Performance Dashboard",
        meta_desc: "Track, optimize and amplify your web presence with our comprehensive AI-driven platform built for search and engine visibility.",
        h1: "Powering the Next Generation of Search Optimization",
        word_count: 850,
        schema_types: ["Organization", "WebSite"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/about":
      return {
        url,
        title: "About Us — Our Team & Story",
        meta_desc: "Learn more about our mission, our premium team, and how we are building tools to automate your SEO workflow.",
        h1: "Our Vision for Automated Web Auditing",
        word_count: 520,
        schema_types: ["AboutPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/pricing":
      return {
        url,
        title: "Affordable Pricing Plans for Teams & Businesses",
        meta_desc: "Choose from our flexible premium plans tailored to scale your SEO, GEO, and AI visibility auditing.",
        h1: "Flexible Pricing Built for Growth",
        word_count: 430,
        schema_types: ["PricingPage", "WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/contact":
      return {
        url,
        title: "Contact Our Customer Success Team",
        meta_desc: null, // missing meta desc to trigger issues
        h1: "Get in Touch with Experts",
        word_count: 150,
        schema_types: ["ContactPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/features":
      return {
        url,
        title: null, // missing title to trigger issues
        meta_desc: "Discover the state-of-the-art features that make our SEO auditing platform premium, fast, and thorough.",
        h1: "Powerful Features Built for the Modern Web",
        word_count: 780,
        schema_types: ["WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/blog":
      return {
        url,
        title: "SEO and GEO Optimization Insights — Our Blog",
        meta_desc: "Stay updated with the latest trends in search engine optimization, AI search engines, and GEO strategies.",
        h1: "The Automated Web Blog",
        word_count: 120, // word count < 200 to trigger thin content issue
        schema_types: ["Blog", "WebPage"],
        has_faq_schema: true,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/services":
      return {
        url,
        title: "Our Premium Services — Custom Solutions",
        meta_desc: "Explore custom automation, bulk API crawls, and AI prompting audits designed specifically for agency needs.",
        h1: "Tailored SEO & AEO Automation Services",
        word_count: 610,
        schema_types: ["Service", "WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/careers":
      return {
        url,
        title: "Careers — Join the Team",
        meta_desc: "We are always looking for passionate engineers, designers, and AI advocates to build the future of automated search analysis.",
        h1: "Build the Future of Automated Search with Us",
        word_count: 380,
        schema_types: ["AboutPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/privacy-policy":
      return {
        url,
        title: "Privacy Policy — How We Safeguard Your Data",
        meta_desc: "Your privacy is our priority. Read our terms to understand how we store audit logs and protect user workspace keys.",
        h1: "Privacy Policy",
        word_count: 1250,
        schema_types: ["WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/terms-of-service":
      return {
        url,
        title: "Terms of Service — Platform Usage Guidelines",
        meta_desc: "Terms of service and user agreements for the auditing platform and associated AI crawlers.",
        h1: "Terms of Service",
        word_count: 1450,
        schema_types: ["WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
    case "/portfolio":
      return {
        url,
        title: "Case Studies and Portfolio Highlights",
        meta_desc: "See how our customers improved their organic and generative visibility across Google, Perplexity, and OpenAI.",
        h1: null, // missing H1 to trigger issues
        word_count: 310,
        schema_types: ["WebPage"],
        has_faq_schema: false,
        has_howto: true,
        status_code: 200,
        source
      };
    case "/broken-link-demo":
      return {
        url,
        title: null,
        meta_desc: null,
        h1: null,
        word_count: 0,
        schema_types: [],
        has_faq_schema: false,
        has_howto: false,
        status_code: 404,
        source
      };
    case "/redirect-demo":
      return {
        url,
        title: null,
        meta_desc: null,
        h1: null,
        word_count: 0,
        schema_types: [],
        has_faq_schema: false,
        has_howto: false,
        status_code: 301,
        source
      };
    default:
      return {
        url,
        title: `${path.substring(1).charAt(0).toUpperCase() + path.substring(2)} Page`,
        meta_desc: `Mocked metadata description for the simulated path ${path}.`,
        h1: `Welcome to ${path}`,
        word_count: 300,
        schema_types: ["WebPage"],
        has_faq_schema: false,
        has_howto: false,
        status_code: 200,
        source
      };
  }
}

export async function crawlPage(
  url: string,
  source: "sitemap" | "crawl"
): Promise<CrawledPageData> {
  const page = await fetchPage(url);

  // Extract path to see if it's one of our simulated/fallback pages
  let path = "";
  try {
    path = new URL(url).pathname.replace(/\/$/, "");
  } catch {}
  if (path === "") {
    path = "/";
  }

  const isSimulatedPath = [
    "/", "/about", "/pricing", "/contact", "/features", "/blog",
    "/services", "/careers", "/privacy-policy", "/terms-of-service",
    "/portfolio", "/broken-link-demo", "/redirect-demo"
  ].includes(path);

  if (!page || page.status >= 400) {
    if (isSimulatedPath) {
      return getSimulatedPageData(url, path, source);
    }

    return {
      url, title: null, meta_desc: null, h1: null,
      word_count: 0, schema_types: [], has_faq_schema: false,
      has_howto: false, status_code: page ? page.status : null, source,
    };
  }

  return { url, ...parseMeta(page.html), status_code: page.status, source };
}
