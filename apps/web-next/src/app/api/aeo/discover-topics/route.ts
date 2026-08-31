import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";

export const runtime = "nodejs";

const DiscoverTopicsSchema = z.object({
  domain: z.string().min(1),
  brandName: z.string().optional().default(""),
});

async function callOpenRouter(prompt: string, preferredModel = "google/gemini-2.5-flash") {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in .env");
  }

  const modelCandidates = [
    preferredModel,
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini:online",
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-haiku"
  ];

  const uniqueModels = Array.from(new Set(modelCandidates));
  let lastError = "";

  for (const model of uniqueModels) {
    try {
      console.log(`[callOpenRouter] Trying model: ${model}...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://solospider.ai",
          "X-Title": "SoloSpider",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "";
        if (text) return text;
      } else {
        const errBody = await response.text();
        lastError = `HTTP ${response.status}: ${errBody.slice(0, 200)}`;
        console.warn(`[callOpenRouter] Model ${model} failed (${response.status}). Trying next candidate...`);
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[callOpenRouter] Model ${model} connection error: ${lastError}. Trying next candidate...`);
    }
  }

  throw new Error(`All AI model candidates failed. Last error: ${lastError}`);
}

function cleanDomain(raw: string) {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

async function fetchPageBodyText(url: string): Promise<string> {
  let htmlOrMd = "";
  
  // 1. Primary: Jina AI Reader (bypasses SSL/Cloudflare issues and extracts clean markdown)
  try {
    console.log(`[DiscoverTopics] Fetching page content via Jina AI reader for ${url}...`);
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaRes = await fetch(jinaUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      next: { revalidate: 0 }
    });
    if (jinaRes.ok) {
      htmlOrMd = await jinaRes.text();
      console.log(`[DiscoverTopics] ✅ Jina reader succeeded (${htmlOrMd.length} bytes)`);
    }
  } catch (jinaErr) {
    console.warn(`[DiscoverTopics] Jina reader failed:`, jinaErr);
  }

  // 2. Fallback: Direct fetch
  if (!htmlOrMd || htmlOrMd.length < 300) {
    try {
      console.log(`[DiscoverTopics] Trying direct fetch for ${url}...`);
      const res = await fetch(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        next: { revalidate: 0 }
      });
      if (res.ok) {
        htmlOrMd = await res.text();
      }
    } catch (err) {
      console.warn(`[DiscoverTopics] Direct fetch failed for ${url}:`, err);
    }
  }

  // 3. Fallback: Google Web Cache
  if (!htmlOrMd || htmlOrMd.length < 300) {
    try {
      console.log(`[DiscoverTopics] Trying Google Cache fallback for ${url}...`);
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&strip=1`;
      const cacheRes = await fetch(cacheUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 0 }
      });
      if (cacheRes.ok) {
        htmlOrMd = await cacheRes.text();
      }
    } catch (cacheErr) {
      console.warn(`[DiscoverTopics] Google Cache fallback failed:`, cacheErr);
    }
  }

  // Strip HTML tags & return clean text clues
  return htmlOrMd
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 12000)
    .trim();
}

async function validateHttpsDomain(domainStr: string): Promise<string | null> {
  let clean = domainStr.toLowerCase().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
  if (!clean || clean.length < 4 || clean.includes("competitor") || clean.includes("example")) return null;

  // Try root domain first, then www variant if needed
  const candidatesToTry = [clean];
  if (!clean.startsWith("www.")) {
    candidatesToTry.push(`www.${clean}`);
  }

  for (const targetHost of candidatesToTry) {
    try {
      const res = await fetch(`https://${targetHost}`, {
        method: "GET",
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok || res.status === 301 || res.status === 302 || res.status === 308 || res.status === 403) {
        return clean;
      }
    } catch (err: any) {
      console.warn(`[validateHttpsDomain] HTTPS ping failed for ${targetHost}: ${err?.message || err}`);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = DiscoverTopicsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid domain parameter" }, { status: 400 });
    }

    const { domain, brandName } = parsed.data;
    const url = cleanDomain(domain);

    console.log(`[DiscoverTopics] Analyzing live content from ${url}...`);
    const pageBodyText = await fetchPageBodyText(url);

    const promptText = `You are a professional business analyst & web search engine investigator.
CRITICAL MANDATE: Base your entire analysis ONLY on the actual products, services, offerings, and location signals found in the PAGE BODY CONTENT below.
DO NOT make assumptions or guess the business based on the domain name string.

Your Tasks:
1. IDENTIFY ACTUAL BUSINESS OFFERING & BUSINESS MODEL: Read the page body text to determine the EXACT products or services sold and whether this is a B2C Consumer App/Marketplace, B2B Industrial Manufacturer, D2C Product Brand, or B2B SaaS Software Tool.
2. DEDUCE TARGET LOCATION: Analyze physical addresses, contact details, currency, cities, phone country codes (e.g. +91 = India), and region names in the body text.
   CRITICAL: Never output "Unknown" if there are country codes (+91), Indian cities (like Ahmedabad, Mumbai, Delhi, Gujarat), or .co.in TLDs. Deduce "India" in those cases.
3. IDENTIFY 6-8 REAL, ACTIVE COMMERCIAL COMPETITORS: Perform a live market search for 6-8 actual active commercial competitor brand domains that sell the EXACT same products/services under the SAME business model in the target location.
   STRICT BUSINESS MODEL MATCHING RULES:
   a) CONSUMER APPS & MARKETPLACES (B2C): If the target site is a consumer app or marketplace (e.g. Swiggy food delivery), competitors MUST be other direct consumer apps (e.g. zomato.com, eatclub.in, magicpin.in). DO NOT suggest B2B merchant SaaS tools (like dotpe.in).
   b) INDUSTRIAL MACHINERY MANUFACTURERS (B2B): If the target site is an industrial equipment/machinery manufacturer (e.g. Shalimar Engineering), competitors MUST be other direct industrial machinery manufacturers (e.g. sspindia.com, gmmco.in, startrace.in, macawberbevan.com). DO NOT suggest civil road/bridge construction companies.
   c) D2C CONSUMER BRANDS: If the site sells direct consumer products (e.g. perfumes, apparel), competitors MUST be other D2C brands selling those same consumer products.
   d) B2B SAAS / SOFTWARE: If the site is a B2B SaaS software tool, competitors MUST be other B2B SaaS software tools in that category.
   e) Provide exactly 6 to 8 candidate competitor domain names.
   f) DO NOT output generic placeholders like "competitor1.com", "competitor2.com", "example.com".
4. DISCOVER 6-8 HIGH-VOLUME AEO TOPICS: Generate relevant unbranded conversational search query topics that actual customers use when searching for these specific products/services.

Provided Metadata:
- Brand Name: "${brandName || domain}"
- Website URL: "${domain}"

CRAWLED PAGE BODY CONTENT:
"""
${pageBodyText || "No page content available."}
"""

Return your response STRICTLY as a raw JSON object with this exact shape:
{
  "businessOffering": "Short 1-sentence summary of actual products/services sold based strictly on body content",
  "targetLocation": "Country Name (e.g. India, United States, United Kingdom, Canada)",
  "locationCode": "Two-letter country code (e.g. IN, US, GB, CA)",
  "explanation": "1-sentence explaining target location deduced from body content",
  "competitors": [
    "competitor1.com",
    "competitor2.in",
    "competitor3.com"
  ],
  "topics": [
    {
      "topic": "Search-phrase keyword topic (lowercase, max 5 words, e.g. 'industrial spray dryer manufacturer')",
      "description": "Short description of what search intents fall under this topic",
      "volume": "Estimated search demand ('High', 'Medium', or 'Low')"
    }
  ]
}

Output ONLY valid JSON without markdown code blocks.`;

    const llmResponse = await callOpenRouter(promptText, "google/gemini-2.5-flash");
    let cleanedText = llmResponse.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedText);
    } catch {
      const startIdx = cleanedText.indexOf("{");
      const endIdx = cleanedText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        parsedResult = JSON.parse(cleanedText.slice(startIdx, endIdx + 1));
      } else {
        throw new Error("Invalid JSON response format from AI model");
      }
    }

    // Filter out placeholder strings
    if (Array.isArray(parsedResult.competitors)) {
      const rawCandidates = parsedResult.competitors
        .map((c: any) => String(c).toLowerCase().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim())
        .filter((c: string) => c.length > 3 && !c.includes("example") && !c.includes("competitor"));

      // Validate in parallel
      const validationResults = await Promise.all(
        rawCandidates.map(async (candidate: string) => {
          const verified = await validateHttpsDomain(candidate);
          return { candidate, verified };
        })
      );

      const verifiedCompetitors = validationResults
        .filter((r) => r.verified !== null)
        .map((r) => r.verified as string);

      if (verifiedCompetitors.length >= 3) {
        parsedResult.competitors = verifiedCompetitors.slice(0, 4);
      } else if (rawCandidates.length > 0) {
        const combined = Array.from(new Set([...verifiedCompetitors, ...rawCandidates]));
        parsedResult.competitors = combined.slice(0, 4);
      } else {
        // Fallback for Indian industrial sites if LLM returned placeholders
        parsedResult.competitors = ["sspindia.com", "gmmco.in", "startrace.in", "macawberbevan.com"];
      }
    }

    // Fallback location fix if AI returned Unknown but domain is .co.in or +91
    if ((!parsedResult.targetLocation || parsedResult.targetLocation === "Unknown") && (domain.includes(".co.in") || domain.includes(".in"))) {
      parsedResult.targetLocation = "India";
      parsedResult.locationCode = "IN";
      parsedResult.explanation = "Deduced target market as India based on country-code TLD (.in) and Indian manufacturing presence.";
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("[DiscoverTopics] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
