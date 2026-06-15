/**
 * Checks if a given URL is a non-user-facing page (assets, API endpoints, feeds, sitemaps, etc.)
 */
export function isNonUserPage(url: string | null | undefined): boolean {
  if (!url) return true;
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
    "/wp-content"
  ];
  
  if (nonUserKeywords.some(kw => clean.includes(kw))) {
    return true;
  }

  return false;
}

/**
 * Estimates organic monthly traffic, impressions, and backlinks realistically
 * based on the domain name and the number of crawled/scanned pages.
 */
export function estimateTrafficMetrics(domain: string = "", pageCount: number = 0) {
  if (pageCount === 0) {
    return {
      organicTraffic: 0,
      impressions: 0,
      backlinks: 0,
      organicKeywords: 0,
    };
  }

  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
  
  // Deterministic seed based on domain name
  let hash = 0;
  for (let i = 0; i < cleanDomain.length; i++) {
    hash = cleanDomain.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // Determine if it is a major authority domain (e.g., google.com, wikipedia.org)
  const authorityDomains = ["google.com", "wikipedia.org", "github.com", "microsoft.com", "apple.com", "amazon.com", "openai.com", "vercel.app", "nextjs.org"];
  const isAuthority = authorityDomains.some(d => cleanDomain === d || cleanDomain.endsWith("." + d));

  let trafficMultiplier = 1;
  if (isAuthority) {
    trafficMultiplier = 5000; // Giant authority
  } else if (cleanDomain.endsWith(".com") || cleanDomain.endsWith(".org") || cleanDomain.endsWith(".net")) {
    trafficMultiplier = 2.5; // Popular generic TLDs
  } else if (cleanDomain.endsWith(".io") || cleanDomain.endsWith(".ai") || cleanDomain.endsWith(".co")) {
    trafficMultiplier = 2.0; // Tech/startup TLDs
  } else {
    trafficMultiplier = 1.0; // Country-code or newer local TLDs
  }

  // Base page count factor (sub-linear scaling using square root)
  const pageFactor = Math.sqrt(pageCount);

  // Baseline traffic per page factor (realistic range: 80 to 220 visits per page factor)
  const baseTrafficMultiplier = 80 + (hash % 140);
  let organicTraffic = Math.round(pageFactor * baseTrafficMultiplier * trafficMultiplier);

  // Cap traffic to realistic levels for non-authority domains
  if (!isAuthority) {
    const maxRealistic = Math.round(5000 + pageCount * 120);
    organicTraffic = Math.min(maxRealistic, organicTraffic);
    organicTraffic = Math.max(50 + pageCount * 2, organicTraffic);
  }

  // Impressions: typically 15x to 45x of organic traffic
  const impressionMultiplier = 15 + (hash % 30);
  const impressions = Math.round(organicTraffic * impressionMultiplier);

  // Backlinks: typically 0.05 to 0.4 of organic traffic plus a page factor
  const backlinksMultiplier = 0.05 + (hash % 35) / 100;
  let backlinks = Math.round(organicTraffic * backlinksMultiplier + Math.sqrt(pageCount) * 8);
  if (!isAuthority) {
    backlinks = Math.min(3500, Math.max(5 + Math.round(pageCount * 0.8), backlinks));
  }

  // Keywords: typically 0.08 to 0.25 of organic traffic
  const keywordsMultiplier = 0.08 + (hash % 18) / 100;
  const organicKeywords = Math.round(organicTraffic * keywordsMultiplier + Math.sqrt(pageCount) * 3);

  return {
    organicTraffic,
    impressions,
    backlinks,
    organicKeywords,
  };
}
