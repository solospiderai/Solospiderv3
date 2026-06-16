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
          `Search the web for: site:${cleanDomainName} OR "${brandName}". Find details about its campus, location, departments, programs, courses, and unique details. Respond with a clear summary of facts about this website/organization.`,
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

    const verifiedPrompts: any[] = [];
    const candidateMap = new Map<string, any>();
    
    let iterations = 0;
    const maxIterations = 3;

    while (verifiedPrompts.length < limit && iterations < maxIterations) {
      iterations++;
      const remainingNeeded = limit - verifiedPrompts.length;
      // Generate double the remaining needed to ensure we have a surplus of candidates
      const batchToGenerate = Math.max(remainingNeeded * 2, 15);
      
      console.log(`[GeneratePromptsWizard] Iteration ${iterations}: Need ${remainingNeeded} more verified prompts. Generating batch of ${batchToGenerate}...`);

      const promptText = `You are an expert SEO and Answer Engine Optimization (AEO/GEO) query researcher.
Your task is to analyze the following business details, crawled homepage content, and selected keyword topics to generate a pool of exactly ${batchToGenerate} highly realistic, diverse, and natural conversational search queries (prompts) that buyers or clients located in "${location}" would search on conversational search engines (like ChatGPT Search, Gemini Search, Claude, or Perplexity) to discover, evaluate, compare, or research products/services in this vertical.

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
4. Do NOT duplicate or repeat any of these queries we have already generated in previous attempts:
[${Array.from(candidateMap.keys()).map(p => `"${p}"`).join(", ")}]
5. Return the result STRICTLY as a valid JSON array of objects. Each object MUST contain these fields:
   - "topic": string (must match one of the focus topics exactly)
   - "prompt": string (the exact conversational prompt)
   - "rationale": string (always set this to empty string "" to save space and prevent token truncation)

Format the output strictly as raw JSON. Do not include markdown code block formatting (like \`\`\`json) or any additional text.`;

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
          break;
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
            console.error("Failed to parse AI prompts response in iteration:", err);
            continue;
          }
        } else {
          console.error("Invalid array format from AI model in iteration");
          continue;
        }
      }

      if (!Array.isArray(promptsArray) || promptsArray.length === 0) {
        console.warn("AI did not return a valid array of prompts in iteration");
        continue;
      }

      // Filter out duplicates and add to candidateMap
      const newCandidates = promptsArray.filter((p: any) => {
        if (!p || !p.prompt) return false;
        const norm = p.prompt.trim().toLowerCase();
        if (candidateMap.has(norm)) return false;
        candidateMap.set(norm, p);
        return true;
      });

      console.log(`[GeneratePromptsWizard] Verifying ${newCandidates.length} new candidate prompts...`);
      const CONCURRENCY = 4;
      for (let i = 0; i < newCandidates.length; i += CONCURRENCY) {
        const batch = newCandidates.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async (c: any) => {
            try {
              console.log(`[GeneratePromptsWizard] Verifying prompt: "${c.prompt}"`);
              
              // Query Perplexity (Search)
              const searchRes = await callOpenRouter(
                `Search for: "${c.prompt}". Respond objectively. Make sure to cite source URLs.`,
                "perplexity/sonar"
              );
              const searchText = searchRes.toLowerCase();
              
              const perpMatch = searchText.includes(cleanDomainName) || 
                                (domainDomainWord.length >= 4 && searchText.includes(domainDomainWord)) || 
                                searchText.includes(cleanBrand);

              console.log(`[GeneratePromptsWizard] Perplexity verification for "${c.prompt}": ${perpMatch ? "PASS" : "FAIL"}`);
              if (!perpMatch) return false;

              // Ground ChatGPT, Gemini, and Claude using the Perplexity Search response context
              const otherModels = ["chatgpt", "gemini", "claude"];
              const otherResults = await Promise.all(
                otherModels.map(async (modelKey) => {
                  try {
                    const groundingPrompt = `You are a search engine assistant answering a query based ONLY on the following search results. Ensure you mention or cite the relevant sources:
---
${searchRes}
---`;
                    
                    const modelRes = await callOpenRouter(
                      c.prompt,
                      MODEL_MAP[modelKey],
                      groundingPrompt
                    );
                    const modelText = modelRes.toLowerCase();
                    const isMatch = modelText.includes(cleanDomainName) || 
                                    (domainDomainWord.length >= 4 && modelText.includes(domainDomainWord)) || 
                                    modelText.includes(cleanBrand);
                    console.log(`[GeneratePromptsWizard] ${modelKey} verification for "${c.prompt}": ${isMatch ? "PASS" : "FAIL"}`);
                    return isMatch;
                  } catch (e: any) {
                    console.warn(`[GeneratePromptsWizard] Grounded model ${modelKey} check failed:`, e?.message || e);
                    return false;
                  }
                })
              );

              const pass = otherResults.every(r => r === true);
              console.log(`[GeneratePromptsWizard] Combined Multi-Model Pass for "${c.prompt}": ${pass ? "PASS" : "FAIL"}`);
              return pass;
            } catch (err) {
              console.warn(`[GeneratePromptsWizard] Verification failed for prompt: "${c.prompt}"`, err);
              return false;
            }
          })
        );

        batch.forEach((c: any, idx: number) => {
          if (results[idx]) {
            verifiedPrompts.push(c);
          }
        });

        if (verifiedPrompts.length >= limit) {
          break;
        }
      }
    }

    console.log(`[GeneratePromptsWizard] Verification complete. Found ${verifiedPrompts.length} verified prompts.`);

    // Guarantee we return exactly the requested limit of prompts (e.g. 25 or 40)
    // We fill the remaining slots with candidate prompts if verified count is below the limit
    const finalPrompts = verifiedPrompts.length >= limit
      ? verifiedPrompts.slice(0, limit)
      : [
          ...verifiedPrompts,
          ...Array.from(candidateMap.values())
            .filter(p => !verifiedPrompts.some(vp => vp.prompt.trim().toLowerCase() === p.prompt.trim().toLowerCase()))
        ].slice(0, limit);

    return NextResponse.json(finalPrompts);
  } catch (error: any) {
    console.error("[GeneratePromptsWizard] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
