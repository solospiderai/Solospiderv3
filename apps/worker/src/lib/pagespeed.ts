// ── Google PageSpeed Insights API (FREE) ─────────────────────────────────────
// Returns REAL Core Web Vitals (LCP, INP/FID, CLS) and performance score
// No API key required for basic usage.

export interface PageSpeedResult {
  performanceScore: number;     // 0-100
  lcp: number;                 // Largest Contentful Paint in seconds
  fid: number;                 // First Input Delay / INP in milliseconds
  cls: number;                 // Cumulative Layout Shift
  ttfb: number;                // Time to First Byte in seconds
  speedIndex: number;          // Speed Index in seconds
  totalBlockingTime: number;   // Total Blocking Time in milliseconds
}

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function getPageSpeedData(url: string): Promise<PageSpeedResult | null> {
  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    const apiKey = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY;
    let apiUrl = `${PSI_ENDPOINT}?url=${encodeURIComponent(cleanUrl)}&strategy=mobile&category=performance`;
    if (apiKey) {
      apiUrl += `&key=${apiKey}`;
    }
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000); // 60s timeout — PSI can be slow

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "SoloSpider/1.0" },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[PageSpeed] API returned ${res.status} for ${cleanUrl}`);
      return null;
    }

    const data = await res.json() as any;
    
    // Extract real Lighthouse metrics
    const lighthouse = data?.lighthouseResult;
    if (!lighthouse) {
      console.warn("[PageSpeed] No lighthouse result in response");
      return null;
    }

    const categories = lighthouse.categories || {};
    const audits = lighthouse.audits || {};

    const performanceScore = Math.round((categories?.performance?.score || 0) * 100);

    // LCP (Largest Contentful Paint) — in seconds
    const lcpMs = audits?.["largest-contentful-paint"]?.numericValue || 0;
    const lcp = Number((lcpMs / 1000).toFixed(2));

    // Total Blocking Time (proxy for INP/FID) — in milliseconds
    const totalBlockingTime = Math.round(audits?.["total-blocking-time"]?.numericValue || 0);
    const fid = totalBlockingTime; // TBT is the best proxy for INP in lab data

    // CLS (Cumulative Layout Shift)
    const cls = Number((audits?.["cumulative-layout-shift"]?.numericValue || 0).toFixed(3));

    // TTFB — in seconds
    const ttfbMs = audits?.["server-response-time"]?.numericValue || 0;
    const ttfb = Number((ttfbMs / 1000).toFixed(2));

    // Speed Index — in seconds
    const siMs = audits?.["speed-index"]?.numericValue || 0;
    const speedIndex = Number((siMs / 1000).toFixed(2));

    const result: PageSpeedResult = {
      performanceScore,
      lcp,
      fid,
      cls,
      ttfb,
      speedIndex,
      totalBlockingTime,
    };

    console.log(`[PageSpeed] ✅ Real metrics for ${cleanUrl}:`, result);
    return result;
  } catch (err: any) {
    console.error(`[PageSpeed] Failed to get data for ${url}:`, err?.message || err);
    return null;
  }
}
