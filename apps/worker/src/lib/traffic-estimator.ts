// ── Real Traffic Estimator ────────────────────────────────────────────────────
// Uses Perplexity (web search AI) to find real traffic estimates for any domain
// from sources like SimilarWeb, Semrush, Ahrefs, etc.

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

export async function estimateRealTraffic(domain: string): Promise<TrafficEstimate | null> {
  try {
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    console.log(`[TrafficEstimator] Looking up real traffic data for: ${cleanDomain}`);

    const searchPrompt = `Find the estimated monthly web traffic statistics for the website "${cleanDomain}". 

Search SimilarWeb, Semrush, Ahrefs, and any other available sources to find REAL traffic data.

I need these EXACT metrics:
1. Total monthly visits (number)
2. Organic search traffic (number of monthly organic visits)  
3. Number of organic keywords the site ranks for
4. Number of backlinks
5. Domain Authority or Domain Rating (0-100)
6. Bounce rate (percentage as decimal, e.g. 0.45 for 45%)
7. Average visit duration in seconds
8. Pages per visit (number)
9. Top traffic country
10. Traffic trend (is it going up, down, or stable compared to last month?)

If you can find the exact numbers from SimilarWeb or any source, use those. If a website is very small/new and has minimal traffic data available, estimate based on the website's content, age, and category.

Respond ONLY with a valid JSON object in this exact format:
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
      "You are a web traffic data analyst. Respond ONLY with valid JSON containing real traffic data from web sources.",
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

    console.log(`[TrafficEstimator] ✅ Real traffic data for ${cleanDomain}:`, result);
    return result;
  } catch (err: any) {
    console.error(`[TrafficEstimator] Failed to estimate traffic for ${domain}:`, err?.message || err);
    return null;
  }
}
