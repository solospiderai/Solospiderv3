import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";

export const runtime = "nodejs";

const DiscoverTopicsSchema = z.object({
  domain: z.string().min(1),
  brandName: z.string().optional().default(""),
});

async function callOpenRouter(prompt: string, model = "google/gemini-2.5-flash") {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  let text = "";

  console.log(`[callOpenRouter] Model: ${model} | API Key Loaded: ${openrouterKey ? `${openrouterKey.slice(0, 10)}...${openrouterKey.slice(-5)} (len: ${openrouterKey.length})` : "MISSING"}`);

  if (openrouterKey) {
    // Retry up to 3 times to handle temporary local DNS/network drops
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://solospiderv.ai",
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
          text = data.choices?.[0]?.message?.content?.trim() || "";
          break; // Success, exit the retry loop!
        } else {
          const errBody = await response.text();
          console.warn(`[callOpenRouter] (Attempt ${attempt}/3) OpenRouter responded with ${response.status}: ${errBody}`);
        }
      } catch (err) {
        console.warn(`[callOpenRouter] (Attempt ${attempt}/3) Connection failed:`, err);
        if (attempt === 3) {
          console.warn("[callOpenRouter] Max attempts reached, falling back to pollinations...");
        } else {
          // Brief pause (250ms) before retrying
          await new Promise(r => setTimeout(r, 250));
        }
      }
    }
  }

  // Fallback to pollinations if OpenRouter is unavailable
  if (!text) {
    try {
      const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
      const res = await fetch(pollinationsUrl);
      if (res.ok) {
        text = (await res.text()).trim();
      } else {
        throw new Error(`Pollinations responded with status ${res.status}`);
      }
    } catch (err) {
      console.error("[callOpenRouter] Pollinations fallback failed:", err);
      throw new Error(`AI model query failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return text;
}

function cleanDomain(raw: string) {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = DiscoverTopicsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid domain parameter" }, { status: 400 });
    }

    const { domain, brandName } = parsed.data;
    const url = cleanDomain(domain);

    let htmlContent = "";
    try {
      console.log(`[DiscoverTopics] Fetching homepage content from ${url}...`);
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 0 }
      });
      if (pageRes.ok) {
        htmlContent = await pageRes.text();
      } else {
        console.warn(`[DiscoverTopics] Homepage fetch returned status ${pageRes.status}`);
      }
    } catch (fetchErr: any) {
      console.warn(`[DiscoverTopics] Homepage fetch failed: ${fetchErr?.message || fetchErr}`);
    }

    // Extract raw text clues from HTML (remove tags, script, style)
    const textClues = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 10000)
      .trim();

    const promptText = `You are a professional business analyst. Your task is to analyze the text content of a company's website homepage to:
1. DEDUCE the primary target country/market location of this brand. Analyze visible text, addresses, contact details, cities mentioned, currencies, regional spelling conventions (e.g. UK vs US spelling), phone number formats, or venue locations listed on the page. 
   CRITICAL: If the currency is USD and TLD is generic (like .com) but the cities, physical venues, addresses, or services are situated in India (e.g. Mumbai, Bangalore, Delhi), the target location MUST be deduced as "India".
2. DISCOVER exactly 6-8 relevant, high-volume search-phrase keywords/topics (representing unbranded keywords or query themes that actual customers use when looking for products or services in this niche, e.g. 'best budget friendly perfumes', 'long lasting fragrance for women', 'perfume vs eau de toilette', 'perfume sampler sets', 'perfume gift ideas for men') for conversational search engine optimization (AEO/GEO).
3. IDENTIFY exactly 3 actual competitors of this brand (their brand names and website domain names, if possible).
   CRITICAL FOR COMPETITORS: Verify carefully that each competitor is of the exact same business model, rank, and category as the target brand. For instance, if the website is a specific academic university, the competitors MUST be other actual, comparable higher-education universities in the same market or state, not boards, government databases, non-academic portals, or generic abbreviation domains like 'gtu'.

FALLBACK INSTRUCTION: If the "CRAWLED HOMEPAGE CONTENT" section below is empty or says "No page content crawled.", you MUST use your own general pre-trained web knowledge about the domain name "${domain}" and brand name "${brandName}" to deduce the location, topics, and identify 3 actual competitors. Do not return empty arrays.

Business Metadata:
- Provided Brand Name: "${brandName}"
- Domain: "${domain}"

CRAWLED HOMEPAGE CONTENT:
"""
${textClues || "No page content crawled."}
"""

Guidelines for Output:
Return the results STRICTLY as a raw JSON object with the following structure:
{
  "targetLocation": "Country Name (e.g. India, United States, United Kingdom, Canada)",
  "locationCode": "Two-letter country code (e.g. IN, US, GB, CA)",
  "explanation": "1-sentence explaining why this location was deduced from the content",
  "competitors": [
    "competitor1.com",
    "competitor2.com",
    "competitor3.com"
  ],
  "topics": [
    {
      "topic": "Search-phrase keyword topic (lowercase, max 5 words, e.g. 'best budget friendly perfumes')",
      "description": "Short description of what search intents fall under this topic",
      "volume": "Estimated search demand ('High', 'Medium', or 'Low')"
    }
  ]
}

Ensure you output ONLY the raw valid JSON. Do not include markdown code block formatting (like \`\`\`json) or any additional explanation outside the JSON.`;

    const llmResponse = await callOpenRouter(promptText);
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
        try {
          parsedResult = JSON.parse(cleanedText.slice(startIdx, endIdx + 1));
        } catch (err) {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("Invalid response format from AI model");
      }
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("[DiscoverTopics] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
