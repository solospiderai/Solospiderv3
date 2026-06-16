import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";

export const runtime = "nodejs";

const GeneratePromptsWizardSchema = z.object({
  brandName: z.string().min(1),
  domain: z.string().min(1),
  location: z.string().min(1),
  selectedTopics: z.array(z.string()).min(1),
  competitors: z.array(z.string()).optional().default([]),
  limit: z.number().optional().default(25),
});

async function callOpenRouter(prompt: string, model = "google/gemini-2.5-flash", systemPrompt?: string) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment");
  }

  const messages = systemPrompt
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    : [{ role: "user", content: prompt }];

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
      messages: messages,
      max_tokens: 3000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter responded with status ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function isValidUnbrandedPrompt(prompt: string, brandName: string, domain: string, competitors: string[]): boolean {
  const p = prompt.toLowerCase();
  
  // Clean brand name and check if prompt contains it
  const brand = brandName.toLowerCase().trim();
  if (brand && p.includes(brand)) return false;

  // Clean domain and check if prompt contains the full domain or domain name
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  const domainName = cleanDomain.split("/")[0];
  if (domainName && p.includes(domainName)) return false;

  // Extract keywords from domain name (excluding common TLDs)
  const domainParts = domainName.split(".");
  const commonTlds = new Set(["com", "org", "net", "edu", "gov", "co", "in", "io", "ai", "info", "biz", "us", "uk", "ca", "de", "fr", "ac"]);
  const domainKeywords = domainParts.filter(part => part && part.length > 2 && !commonTlds.has(part));
  
  for (const kw of domainKeywords) {
    if (kw.length >= 4 && p.includes(kw)) return false;
  }

  // Check competitors
  for (const comp of competitors) {
    const cleanComp = comp.toLowerCase().trim();
    if (!cleanComp) continue;
    if (p.includes(cleanComp)) return false;
    
    // Check competitor base name (e.g. competitor name without .com)
    const compParts = cleanComp.split(".");
    const compName = compParts[0];
    if (compName && compName.length >= 4 && p.includes(compName)) return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = GeneratePromptsWizardSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { brandName, domain, location, selectedTopics, competitors, limit } = parsed.data;

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
    const cleanBrand = brandName.toLowerCase().trim();
    const cleanDomainName = cleanDomain.split("/")[0]; // e.g. gandhinagaruni.ac.in
    const domainDomainWord = cleanDomainName.split(".")[0]; // e.g. gandhinagaruni

    const MODEL_MAP: Record<string, string> = {
      chatgpt:    "openai/gpt-4o-mini",
      gemini:     "google/gemini-2.5-flash",
      claude:     "anthropic/claude-3-haiku",
      perplexity: "perplexity/sonar",
    };

    let webContent = "";
    try {
      console.log(`[GeneratePromptsWizard] Fetching homepage content for domain ${domain} dynamically...`);
      let cleanUrl = domain.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = "https://" + cleanUrl;
      }
      const pageRes = await fetch(cleanUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        webContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 10000)
          .trim();
      }
    } catch (err: any) {
      console.warn(`[GeneratePromptsWizard] Dynamic homepage fetch failed: ${err?.message || err}`);
    }

    if (!webContent || webContent.includes("enable JavaScript") || webContent.length < 300) {
      console.log("[GeneratePromptsWizard] Direct homepage fetch was empty or JS blocked. Executing Perplexity web search fallback...");
      try {
        const searchInfo = await callOpenRouter(
          `Search the web for: site:${cleanDomainName} OR "${brandName}". Find details about this brand/organization, including its core offerings, services, products, business category, target audience, location, and key features. Respond with a detailed and objective summary of facts about this website/organization.`,
          "perplexity/sonar"
        );
        if (searchInfo) {
          webContent = searchInfo;
          console.log(`[GeneratePromptsWizard] Web search fallback retrieved ${webContent.length} characters of context.`);
        }
      } catch (searchErr: any) {
        console.error("[GeneratePromptsWizard] Web search fallback failed:", searchErr?.message || searchErr);
      }
    }
    const promptText = `You are an expert SEO and Answer Engine Optimization (AEO/GEO) query researcher.
Your task is to analyze the following business details, crawled homepage content, and selected keyword topics to generate exactly ${limit} highly realistic, diverse, and natural conversational search queries (prompts) that buyers or clients located in "${location}" would search on conversational search engines (like ChatGPT Search, Gemini Search, Claude, or Perplexity) to discover, evaluate, compare, or research products/services in this vertical.

Business Information (For niche context only):
- Brand Name: "${brandName}"
- Domain: "${domain}"
- Target Location / Country: "${location}"
- Competitors: [${competitors.join(", ")}]
- Selected Focus Topics: [${selectedTopics.join(", ")}]

Crawled Homepage Content:
${webContent || "No page content available."}

Guidelines to ensure search engines retrieve and show our website "${domain}" without us mentioning the brand name or domain in the prompt:
1. EVERY GENERATED PROMPT MUST BE COMPLETELY UNBRANDED. Do NOT include our brand name "${brandName}", our domain "${domain}", or competitor names in any of the prompts.
2. CRITICAL: The prompts must be hyper-specific, localized, and long-tail. They must reference unique details from the Crawled Homepage Content, such as:
   - Specific physical locations, unique street/road names, landmarks, or highway routes near the brand (e.g. "Which university is located near Kharna on the Gandhinagar-Mansa highway?").
   - Highly specific course titles, unique programs, special labs, facilities, or exact certifications offered (e.g. "colleges in Gandhinagar offering B.Tech in Computer Engineering with specialization in cloud computing").
   - Distinctive campus details (e.g., campus acreage, specific facilities, distinct slogans/text mentioned on the homepage).
   - Specific details, achievements, or unique features that belong directly to this organization.
   - Do not generate generic questions. Focus on extremely specific aspects of the site's content so that search engines are forced to cite this website as the primary source.
3. Group the prompts under the selected focus topics: [${selectedTopics.join(", ")}].
4. Return the result STRICTLY as a valid JSON array of objects. Each object MUST contain these fields:
   - "topic": string (must match one of the focus topics exactly)
   - "prompt": string (the exact conversational prompt)
   - "rationale": string (always set this to empty string "")

Format the output strictly as raw JSON. Do not include markdown code block formatting (like triple backticks or JSON tags) or any additional text.`;

    let llmResponse = "";
    try {
      llmResponse = await callOpenRouter(promptText);
    } catch (err: any) {
      console.warn("[GeneratePromptsWizard] OpenRouter failed, trying Pollinations fallback:", err?.message || err);
      try {
        const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(promptText)}?model=openai`;
        const res = await fetch(pollinationsUrl);
        if (res.ok) {
          llmResponse = (await res.text()).trim();
        } else {
          throw new Error(`Pollinations responded with status ${res.status}`);
        }
      } catch (fallbackErr: any) {
        console.error("[GeneratePromptsWizard] Fallback also failed:", fallbackErr);
        throw new Error(`AI prompt generation failed: ${err?.message || err}. (Fallback error: ${fallbackErr?.message || fallbackErr})`);
      }
    }

    let cleanedText = llmResponse.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let promptsArray = [];
    try {
      promptsArray = JSON.parse(cleanedText);
    } catch {
      const startIdx = cleanedText.indexOf("[");
      const endIdx = cleanedText.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          promptsArray = JSON.parse(cleanedText.slice(startIdx, endIdx + 1));
        } catch (err) {
          throw new Error("Failed to parse AI prompts response as JSON array");
        }
      } else {
        throw new Error("Invalid array format from AI model");
      }
    }

    if (!Array.isArray(promptsArray) || promptsArray.length === 0) {
      throw new Error("AI did not return a valid array of prompts");
    }

    // Filter and limit to requested limit if necessary
    const finalPrompts = promptsArray
      .filter((p: any) => p && p.prompt && isValidUnbrandedPrompt(p.prompt, brandName, domain, competitors))
      .slice(0, limit);
    return NextResponse.json(finalPrompts);
  } catch (error: any) {
    console.error("[GeneratePromptsWizard] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
