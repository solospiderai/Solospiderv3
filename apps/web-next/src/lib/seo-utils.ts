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
 * Normalizes a URL or domain string to extract the clean hostname (e.g. "example.com")
 */
export function cleanDomain(domain: string): string {
  try {
    let d = domain.trim().toLowerCase();
    if (!d.startsWith("http://") && !d.startsWith("https://")) {
      d = "https://" + d;
    }
    const url = new URL(d);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return domain.trim().toLowerCase().replace(/^www\./, "");
  }
}

/**
 * Calculates a deterministic numeric hash of a string
 */
export function getDomainHash(domain: string): number {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export interface EstimatedMetrics {
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  sparklineTraffic: { value: number }[];
  sparklineImpressions: { value: number }[];
  sparklineBacklinks: { value: number }[];
}

/**
 * Estimates organic traffic, keywords, and backlinks deterministically
 * based on the domain name and the number of pages crawled.
 */
export function estimateDomainMetrics(domain: string, crawledPageCount: number): EstimatedMetrics {
  if (!domain || crawledPageCount === 0) {
    return {
      organicTraffic: 0,
      organicKeywords: 0,
      backlinks: 0,
      sparklineTraffic: Array(7).fill({ value: 0 }),
      sparklineImpressions: Array(7).fill({ value: 0 }),
      sparklineBacklinks: Array(7).fill({ value: 0 }),
    };
  }

  const cleanHost = cleanDomain(domain);
  const hash = getDomainHash(cleanHost);

  // 1. Popular sites matching hardcoded actual traffic
  const highTrafficSites: Record<string, number> = {
    "google.com": 9500000000,
    "youtube.com": 3300000000,
    "facebook.com": 1200000000,
    "wikipedia.org": 4500000000,
    "amazon.com": 3200000000,
    "twitter.com": 400000000,
    "x.com": 400000000,
    "instagram.com": 600000000,
    "reddit.com": 2000000000,
    "linkedin.com": 150000000,
    "github.com": 50000000,
    "openai.com": 200000000,
    "chatgpt.com": 300000000,
    "netflix.com": 150000000,
    "apple.com": 50000000,
    "microsoft.com": 80000000,
  };

  if (cleanHost in highTrafficSites) {
    const traffic = highTrafficSites[cleanHost];
    const keywords = Math.round(traffic * 0.12);
    const backlinksCount = Math.round(traffic * 0.05);
    
    return {
      organicTraffic: traffic,
      organicKeywords: keywords,
      backlinks: backlinksCount,
      sparklineTraffic: Array(7).fill(null).map((_, i) => ({ value: Math.round(traffic * (0.9 + i * 0.015)) })),
      sparklineImpressions: Array(7).fill(null).map((_, i) => ({ value: Math.round(traffic * 4.2 * (0.9 + i * 0.012)) })),
      sparklineBacklinks: Array(7).fill(null).map((_, i) => ({ value: Math.round(backlinksCount * (0.95 + i * 0.008)) })),
    };
  }

  // 2. Normal/local sites - estimate realistically using domain name length and extension
  // Base baseline traffic: 15 to 450 monthly visits
  const baseTraffic = 15 + (hash % 435);

  let tldMult = 1.0;
  if (cleanHost.endsWith(".in") || cleanHost.endsWith(".co.in")) {
    tldMult = 0.45; // country-specific (lower global organic traffic baseline)
  } else if (cleanHost.endsWith(".xyz") || cleanHost.endsWith(".club") || cleanHost.endsWith(".info")) {
    tldMult = 0.15; // low tier spam TLDs
  } else if (cleanHost.endsWith(".ai") || cleanHost.endsWith(".io") || cleanHost.endsWith(".co")) {
    tldMult = 0.8;
  }

  // Shorter domains generally indicate more authority
  const nameLen = cleanHost.split(".")[0].length;
  let lenMult = 1.0;
  if (nameLen <= 5) lenMult = 2.5;
  else if (nameLen <= 8) lenMult = 1.6;
  else if (nameLen > 15) lenMult = 0.45;

  // Scale based on crawled page count (represents content depth)
  // 5 pages crawled: 1.0x, 50 pages crawled: 4.6x, 150 pages crawled: 12.6x
  const scaleMult = 0.6 + (crawledPageCount * 0.08);

  let organicTraffic = Math.round(baseTraffic * tldMult * lenMult * scaleMult);
  if (organicTraffic < 5) organicTraffic = 5;

  // Organic Keywords and Backlinks correlate with traffic
  const organicKeywords = Math.round(organicTraffic * 0.22) + (hash % 8) + 1;
  const backlinks = Math.round(organicTraffic * 0.06) + (hash % 4) + 1;

  // Determine a deterministic trend direction for this site (up or down)
  const trendDir = (hash % 2 === 0) ? 1 : -1;

  const sparklineTraffic = Array(7).fill(null).map((_, i) => {
    const fluctuation = (Math.sin(hash + i) * 0.08) + (trendDir * (6 - i) * 0.015);
    return { value: Math.max(1, Math.round(organicTraffic * (1 + fluctuation))) };
  });

  const sparklineImpressions = Array(7).fill(null).map((_, i) => {
    const fluctuation = (Math.cos(hash + i) * 0.1) + (trendDir * (6 - i) * 0.018);
    const impressionsVal = organicTraffic * 4.5;
    return { value: Math.max(1, Math.round(impressionsVal * (1 + fluctuation))) };
  });

  const sparklineBacklinks = Array(7).fill(null).map((_, i) => {
    const fluctuation = (Math.sin(hash - i) * 0.04) + (trendDir * (6 - i) * 0.005);
    return { value: Math.max(1, Math.round(backlinks * (1 + fluctuation))) };
  });

  return {
    organicTraffic,
    organicKeywords,
    backlinks,
    sparklineTraffic,
    sparklineImpressions,
    sparklineBacklinks,
  };
}

export interface ChartDataPoint {
  name: string;
  organic: number;
  paid: number;
}

/**
 * Generates dynamic, consistent time-series data for the TrafficChart
 * that exactly anchors to the organic traffic number.
 */
export function getTrafficChartData(
  domain: string,
  crawledPageCount: number,
  timeRange: string
): ChartDataPoint[] {
  const metrics = estimateDomainMetrics(domain, crawledPageCount);
  const traffic = metrics.organicTraffic;

  if (traffic === 0) {
    const size = timeRange === "today" ? 7 : timeRange === "30" ? 6 : timeRange === "90" ? 6 : 7;
    const dataPoints: ChartDataPoint[] = [];
    const now = new Date();
    for (let i = size - 1; i >= 0; i--) {
      if (timeRange === "today") {
        const hours = [8, 10, 12, 14, 16, 18, 20];
        dataPoints.push({ name: `${hours[size - 1 - i]}:00`, organic: 0, paid: 0 });
      } else {
        const offset = timeRange === "30" ? i * 5 : timeRange === "90" ? i * 15 : i;
        const d = new Date();
        d.setDate(now.getDate() - offset);
        const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dataPoints.push({ name, organic: 0, paid: 0 });
      }
    }
    return dataPoints;
  }

  const cleanHost = cleanDomain(domain);
  const hash = getDomainHash(cleanHost);
  const dataPoints: ChartDataPoint[] = [];
  const now = new Date();

  // Paid traffic is 5% to 25% of organic traffic
  const paidRatio = 0.05 + ((hash % 20) / 100);
  const trendDir = (hash % 2 === 0) ? 1 : -1;

  if (timeRange === "today") {
    const hours = [8, 10, 12, 14, 16, 18, 20];
    for (let i = 0; i < hours.length; i++) {
      const h = hours[i];
      // Hourly traffic ranges around traffic/30
      const hourlyTraffic = Math.round((traffic / 30) * (0.8 + Math.sin(i * 1.2) * 0.25));
      const hourlyPaid = Math.round(hourlyTraffic * paidRatio);
      dataPoints.push({
        name: `${h}:00`,
        organic: Math.max(1, hourlyTraffic),
        paid: Math.max(0, hourlyPaid),
      });
    }
  } else if (timeRange === "30") {
    // Last 30 Days in 5-day intervals
    for (let i = 25; i >= 0; i -= 5) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const change = (Math.sin(hash + i) * 0.12) - (trendDir * i * 0.006);
      const organic = Math.round(traffic * (1 + change));
      const paid = Math.round(organic * paidRatio);
      dataPoints.push({
        name,
        organic: Math.max(1, organic),
        paid: Math.max(0, paid),
      });
    }
  } else if (timeRange === "90") {
    // Last 90 Days in 15-day intervals
    for (let i = 75; i >= 0; i -= 15) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const change = (Math.sin(hash + i / 2) * 0.18) - (trendDir * i * 0.003);
      const organic = Math.round(traffic * (1 + change));
      const paid = Math.round(organic * paidRatio);
      dataPoints.push({
        name,
        organic: Math.max(1, organic),
        paid: Math.max(0, paid),
      });
    }
  } else {
    // Last 7 days (default)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const change = (Math.sin(hash + i * 2) * 0.08) - (trendDir * i * 0.012);
      const organic = Math.round(traffic * (1 + change));
      const paid = Math.round(organic * paidRatio);
      dataPoints.push({
        name,
        organic: Math.max(1, organic),
        paid: Math.max(0, paid),
      });
    }
  }

  return dataPoints;
}
