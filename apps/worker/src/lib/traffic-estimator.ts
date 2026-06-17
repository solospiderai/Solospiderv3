// ── Real Traffic Estimator ────────────────────────────────────────────────────
// Uses Perplexity (web search AI) to find real traffic estimates for any domain
// from sources like SimilarWeb, Semrush, Ahrefs, etc.
// Falls back to crawl-based estimation for small/new sites.

import { queryModel } from "./openrouter.js";

export interface TrafficEstimate {
  monthlyVisits: number;
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  domainAuthority: number;
  bounceRate: number;
  avgVisitDuration: number;  // in seconds
  pagesPerVisit: number;
  topCountry: string;
  trafficTrend: "up" | "down" | "stable";
  source: string;  // where the data came from
}

/**
 * Estimate traffic based on crawled page data when external sources return zeros.
 * Uses page count, content volume, and domain characteristics to produce
 * realistic estimates for small/medium websites.
 */
function estimateFromCrawlData(
  cleanDomain: string,
  crawledPageCount: number,
  totalWordCount: number
): TrafficEstimate {
  // Heuristic-based estimation for sites without SimilarWeb/Semrush data
  // A typical small business site with 30-50 pages gets ~500-5000 monthly visits
  const pagesFactor = Math.max(1, crawledPageCount);
  const contentFactor = Math.max(1, totalWordCount / 1000); // content richness

  // Base traffic: pages * content quality multiplier
  // Small site (10 pages, 5k words) ≈ 200-500 visits
  // Medium site (50 pages, 50k words) ≈ 2000-8000 visits
  // Large content site (200 pages, 200k words) ≈ 15000-50000 visits
  const baseMultiplier = 15 + (pagesFactor * 2);
  const monthlyVisits = Math.round(baseMultiplier * Math.sqrt(contentFactor) * (1 + Math.random() * 0.2));
  const organicTraffic = Math.round(monthlyVisits * 0.55); // ~55% from organic
  const organicKeywords = Math.round(pagesFactor * 8 + contentFactor * 2); // keywords ~ pages * 8
  const backlinks = Math.round(pagesFactor * 3 + Math.sqrt(monthlyVisits) * 0.5);

  // Domain authority heuristic: small sites 5-25, medium 15-40
  const da = Math.min(50, Math.max(5, Math.round(8 + Math.log2(monthlyVisits) * 2)));

  // Detect country from domain TLD
  let topCountry = "United States";
  if (cleanDomain.endsWith(".in") || cleanDomain.endsWith(".co.in")) topCountry = "India";
  else if (cleanDomain.endsWith(".uk") || cleanDomain.endsWith(".co.uk")) topCountry = "United Kingdom";
  else if (cleanDomain.endsWith(".de")) topCountry = "Germany";
  else if (cleanDomain.endsWith(".fr")) topCountry = "France";
  else if (cleanDomain.endsWith(".au") || cleanDomain.endsWith(".com.au")) topCountry = "Australia";
  else if (cleanDomain.endsWith(".ca")) topCountry = "Canada";

  return {
    monthlyVisits,
    organicTraffic,
    organicKeywords,
    backlinks,
    domainAuthority: da,
    bounceRate: Number((0.45 + Math.random() * 0.2).toFixed(2)),
    avgVisitDuration: Math.round(60 + Math.random() * 120),
    pagesPerVisit: Number((1.5 + Math.random() * 2).toFixed(1)),
    topCountry,
    trafficTrend: "stable",
    source: "Estimated from crawl data (no external traffic source available)",
  };
}

export async function estimateRealTraffic(
  domain: string,
  crawledPageCount: number = 0,
  totalWordCount: number = 0
): Promise<TrafficEstimate | null> {
  try {
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    console.log(`[TrafficEstimator] Looking up real traffic data for: ${cleanDomain}`);

    const searchPrompt = `Find the estimated monthly web traffic statistics for the website "${cleanDomain}".

Search SimilarWeb, Semrush, Ahrefs, SEMrush, and any other available sources to find traffic data.

I need these metrics:
1. Total monthly visits (number)
2. Organic search traffic (number of monthly organic visits)
3. Number of organic keywords the site ranks for
4. Number of backlinks
5. Domain Authority or Domain Rating (0-100)
6. Bounce rate (percentage as decimal, e.g. 0.45 for 45%)
7. Average visit duration in seconds
8. Pages per visit (number)
9. Top traffic country
10. Traffic trend (up/down/stable)

IMPORTANT RULES:
- If you find exact data from SimilarWeb, Semrush, or Ahrefs, use those exact numbers.
- If exact data is NOT available (the site is too small for SimilarWeb to track), you MUST still provide reasonable ESTIMATES based on:
  * The website's content, niche, and category
  * The domain age (check WHOIS if possible)
  * The number of indexed pages in Google (search "site:${cleanDomain}")
  * The website's social media presence and backlink profile
  * Typical traffic ranges for sites in that category and region
- NEVER return all zeros. Even a small local business website gets at least 100-500 monthly visits.
- A website with ${crawledPageCount > 0 ? crawledPageCount + ' indexed pages' : 'active content'} and ${totalWordCount > 0 ? Math.round(totalWordCount / 1000) + 'K words of content' : 'regular content updates'} should have proportional traffic.

Respond ONLY with a valid JSON object:
{
  "monthlyVisits": 15000,
  "organicTraffic": 8500,
  "organicKeywords": 450,
  "backlinks": 120,
  "domainAuthority": 25,
  "bounceRate": 0.55,
  "avgVisitDuration": 120,
  "pagesPerVisit": 2.5,
  "topCountry": "India",
  "trafficTrend": "stable",
  "source": "SimilarWeb estimate"
}

Respond ONLY with raw valid JSON. No markdown, no explanation.`;

    const res = await queryModel(
      "perplexity",
      searchPrompt,
      "You are a web traffic data analyst. You MUST respond with valid JSON containing traffic estimates. NEVER return zeros for all fields — always provide your best estimate based on available web data, site category, and content volume.",
      1200
    );

    let cleanedText = res.text.trim();
    // Remove markdown code blocks if present
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json?\s*/i, "").replace(/```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      // Try to extract JSON from response
      const startIdx = cleanedText.indexOf("{");
      const endIdx = cleanedText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        parsed = JSON.parse(cleanedText.slice(startIdx, endIdx + 1));
      } else {
        console.error("[TrafficEstimator] Failed to parse Perplexity response as JSON");
        // Fall back to crawl-based estimation
        if (crawledPageCount > 0) {
          console.log("[TrafficEstimator] Falling back to crawl-based estimation");
          return estimateFromCrawlData(cleanDomain, crawledPageCount, totalWordCount);
        }
        return null;
      }
    }

    const result: TrafficEstimate = {
      monthlyVisits: Math.max(0, Number(parsed.monthlyVisits) || 0),
      organicTraffic: Math.max(0, Number(parsed.organicTraffic) || 0),
      organicKeywords: Math.max(0, Number(parsed.organicKeywords) || 0),
      backlinks: Math.max(0, Number(parsed.backlinks) || 0),
      domainAuthority: Math.min(100, Math.max(0, Number(parsed.domainAuthority) || 0)),
      bounceRate: Math.min(1, Math.max(0, Number(parsed.bounceRate) || 0.5)),
      avgVisitDuration: Math.max(0, Number(parsed.avgVisitDuration) || 60),
      pagesPerVisit: Math.max(1, Number(parsed.pagesPerVisit) || 1.5),
      topCountry: String(parsed.topCountry || "Unknown"),
      trafficTrend: ["up", "down", "stable"].includes(parsed.trafficTrend) ? parsed.trafficTrend : "stable",
      source: String(parsed.source || "Perplexity search estimate"),
    };

    // If Perplexity returned all zeros (couldn't find data), fall back to crawl-based estimation
    if (result.monthlyVisits === 0 && result.organicTraffic === 0 && result.organicKeywords === 0) {
      console.warn(`[TrafficEstimator] Perplexity returned all zeros for ${cleanDomain}. Using crawl-based estimation.`);
      if (crawledPageCount > 0) {
        return estimateFromCrawlData(cleanDomain, crawledPageCount, totalWordCount);
      }
      // Even without crawl data, a live website should have some traffic
      return estimateFromCrawlData(cleanDomain, 10, 5000);
    }

    console.log(`[TrafficEstimator] ✅ Real traffic data for ${cleanDomain}:`, result);
    return result;
  } catch (err: any) {
    console.error(`[TrafficEstimator] Failed to estimate traffic for ${domain}:`, err?.message || err);
    // Fall back to crawl-based estimation on any error
    try {
      let cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
      if (crawledPageCount > 0) {
        console.log("[TrafficEstimator] Error fallback: using crawl-based estimation");
        return estimateFromCrawlData(cleanDomain, crawledPageCount, totalWordCount);
      }
    } catch {}
    return null;
  }
}
