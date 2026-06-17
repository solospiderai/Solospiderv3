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
  domainAuthority: number;
  sparklineTraffic: { value: number }[];
  sparklineImpressions: { value: number }[];
  sparklineBacklinks: { value: number }[];
}

/**
 * Real traffic data from Perplexity-based lookup (stored in project metadata)
 */
export interface RealTrafficData {
  monthlyVisits?: number;
  organicTraffic?: number;
  organicKeywords?: number;
  backlinks?: number;
  domainAuthority?: number;
  bounceRate?: number;
  avgVisitDuration?: number;
  pagesPerVisit?: number;
  topCountry?: string;
  trafficTrend?: "up" | "down" | "stable";
  source?: string;
}

/**
 * Returns organic traffic, keywords, and backlinks.
 * Uses REAL data from Perplexity when available, falls back to estimation only when real data hasn't been fetched yet.
 */
export function estimateDomainMetrics(domain: string, crawledPageCount: number, realTrafficData?: RealTrafficData | null): EstimatedMetrics {
  if (!domain || crawledPageCount === 0) {
    return {
      organicTraffic: 0,
      organicKeywords: 0,
      backlinks: 0,
      domainAuthority: 0,
      sparklineTraffic: Array(7).fill({ value: 0 }),
      sparklineImpressions: Array(7).fill({ value: 0 }),
      sparklineBacklinks: Array(7).fill({ value: 0 }),
    };
  }

  const cleanHost = cleanDomain(domain);
  const hash = getDomainHash(cleanHost);

  // ─── USE REAL DATA when available ──────────────────────────────────────────
  if (realTrafficData && (realTrafficData.monthlyVisits || realTrafficData.organicTraffic)) {
    const organicTraffic = realTrafficData.organicTraffic || Math.round((realTrafficData.monthlyVisits || 0) * 0.65);
    const organicKeywords = realTrafficData.organicKeywords || Math.round(organicTraffic * 0.15);
    const backlinks = realTrafficData.backlinks || Math.round(organicTraffic * 0.05);
    const domainAuthority = realTrafficData.domainAuthority || 0;

    // Determine trend direction from real data
    const trendDir = realTrafficData.trafficTrend === "up" ? 1 : realTrafficData.trafficTrend === "down" ? -1 : 0;

    const sparklineTraffic = Array(7).fill(null).map((_, i) => {
      const fluctuation = (Math.sin(hash + i) * 0.05) + (trendDir * (6 - i) * 0.01);
      return { value: Math.max(1, Math.round(organicTraffic * (1 + fluctuation))) };
    });

    const sparklineImpressions = Array(7).fill(null).map((_, i) => {
      const fluctuation = (Math.cos(hash + i) * 0.06) + (trendDir * (6 - i) * 0.012);
      const impressionsVal = organicTraffic * 4.5;
      return { value: Math.max(1, Math.round(impressionsVal * (1 + fluctuation))) };
    });

    const sparklineBacklinks = Array(7).fill(null).map((_, i) => {
      const fluctuation = (Math.sin(hash - i) * 0.03) + (trendDir * (6 - i) * 0.003);
      return { value: Math.max(1, Math.round(backlinks * (1 + fluctuation))) };
    });

    return {
      organicTraffic,
      organicKeywords,
      backlinks,
      domainAuthority,
      sparklineTraffic,
      sparklineImpressions,
      sparklineBacklinks,
    };
  }

  // ─── FALLBACK: estimation (only used before real data is fetched) ──────────

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
      domainAuthority: 95,
      sparklineTraffic: Array(7).fill(null).map((_, i) => ({ value: Math.round(traffic * (0.9 + i * 0.015)) })),
      sparklineImpressions: Array(7).fill(null).map((_, i) => ({ value: Math.round(traffic * 4.2 * (0.9 + i * 0.012)) })),
      sparklineBacklinks: Array(7).fill(null).map((_, i) => ({ value: Math.round(backlinksCount * (0.95 + i * 0.008)) })),
    };
  }

  // 2. Normal/local sites - estimate using domain hash + page count (temporary until real data loads)
  const baseTraffic = 15 + (hash % 435);

  let tldMult = 1.0;
  if (cleanHost.endsWith(".in") || cleanHost.endsWith(".co.in")) {
    tldMult = 0.45;
  } else if (cleanHost.endsWith(".xyz") || cleanHost.endsWith(".club") || cleanHost.endsWith(".info")) {
    tldMult = 0.15;
  } else if (cleanHost.endsWith(".ai") || cleanHost.endsWith(".io") || cleanHost.endsWith(".co")) {
    tldMult = 0.8;
  }

  const nameLen = cleanHost.split(".")[0].length;
  let lenMult = 1.0;
  if (nameLen <= 5) lenMult = 2.5;
  else if (nameLen <= 8) lenMult = 1.6;
  else if (nameLen > 15) lenMult = 0.45;

  const scaleMult = 0.6 + (crawledPageCount * 0.08);

  let organicTraffic = Math.round(baseTraffic * tldMult * lenMult * scaleMult);
  if (organicTraffic < 5) organicTraffic = 5;

  const organicKeywords = Math.round(organicTraffic * 0.22) + (hash % 8) + 1;
  const backlinks = Math.round(organicTraffic * 0.06) + (hash % 4) + 1;

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
    domainAuthority: 0,
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
 * Uses real traffic data when available.
 */
export function getTrafficChartData(
  domain: string,
  crawledPageCount: number,
  timeRange: string,
  realTrafficData?: RealTrafficData | null
): ChartDataPoint[] {
  const metrics = estimateDomainMetrics(domain, crawledPageCount, realTrafficData);
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

  // Daily base traffic is monthly traffic divided by 30
  const dailyBaseTraffic = traffic / 30;

  if (timeRange === "today") {
    const hours = [8, 10, 12, 14, 16, 18, 20];
    for (let i = 0; i < hours.length; i++) {
      const h = hours[i];
      // Hourly traffic ranges around daily / 6
      const hourlyTraffic = Math.round((dailyBaseTraffic / 6) * (0.8 + Math.sin(i * 1.2) * 0.25));
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
      const organic = Math.round(dailyBaseTraffic * (1 + change));
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
      const organic = Math.round(dailyBaseTraffic * (1 + change));
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
      const organic = Math.round(dailyBaseTraffic * (1 + change));
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

/**
 * Copies a given text string to the clipboard with a robust fallback for insecure/development domains
 */
export function copyToClipboard(text: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      return true;
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const success = document.execCommand("copy");
      document.body.removeChild(el);
      return success;
    }
  } catch (err) {
    console.error("Clipboard copy fallback failed: ", err);
    return false;
  }
}
