import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";
import { isNonUserPage } from "@/lib/seo-utils";

export const runtime = "nodejs";

const GeneratePromptsSchema = z.object({
  projectId: z.string().uuid(),
  limit: z.number().optional().default(25),
});

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: { persistSession: false },
    }
  );
}

async function callLLM(prompt: string, maxTokens = 2000, model = "google/gemini-2.5-flash") {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  let text = "";

  if (openrouterKey) {
    try {
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
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || "";
      } else {
        console.warn(`[callLLM] OpenRouter responded with ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      console.warn("[callLLM] OpenRouter failed, falling back:", err);
    }
  }

  // Fallback to pollinations if OpenRouter is unavailable
  if (!text) {
    try {
      const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
      const res = await fetch(pollinationsUrl);
      if (res.ok) {
        text = (await res.text()).trim();
      }
    } catch (err) {
      console.error("[callLLM] Pollinations fallback failed:", err);
    }
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = GeneratePromptsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { projectId, limit = 25 } = parsed.data;
    const supabase = getSupabaseAdmin();

    // 1. Fetch project details
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rawDesc = project.brand_description || "";
    let cleanDesc = rawDesc;
    let competitorsFromMeta: string[] = [];
    let location = "United States";
    const parts = rawDesc.split("\n---\nMETADATA: ");
    if (parts.length > 1) {
      cleanDesc = parts[0];
      try {
        const meta = JSON.parse(parts[1]);
        if (Array.isArray(meta.competitors)) {
          competitorsFromMeta = meta.competitors;
        }
        if (meta.location) {
          location = meta.location;
        }
      } catch (e) {
        console.warn("[GeneratePromptsAPI] Failed to parse project metadata:", e);
      }
    }

    const brandName = project.brand_name || project.name;
    const domain = project.domain;
    const brandDescription = cleanDesc || project.brand_tagline || "a digital brand";

    // 2. Fetch crawled pages to extract context
    const { data: pages } = await supabase
      .from("crawled_pages" as any)
      .select("url, title, meta_desc, h1")
      .eq("project_id", projectId)
      .limit(100);

    const userFacingPages = (pages || [])
      .filter((p: any) => !isNonUserPage(p.url))
      .slice(0, 15);

    let webContent = "";
    if (userFacingPages.length > 0) {
      webContent = userFacingPages.map(p => `* URL: ${p.url}\n  Title: "${p.title || ""}"\n  H1: "${p.h1 || ""}"\n  Description: "${p.meta_desc || ""}"`).join("\n");
    } else {
      console.log(`[GeneratePromptsAPI] No user-facing crawled pages in database. Fetching homepage ${domain} dynamically...`);
      try {
        let cleanUrl = domain.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = "https://" + cleanUrl;
        }
        const pageRes = await fetch(cleanUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .slice(0, 10000)
            .trim();
          webContent = `Homepage Context (Fetched Dynamically):\n${cleanText}`;
        } else {
          console.warn(`[GeneratePromptsAPI] Homepage fetch returned status ${pageRes.status}`);
        }
      } catch (err: any) {
        console.warn(`[GeneratePromptsAPI] Dynamic homepage fetch failed: ${err?.message || err}`);
      }
    }

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
    const cleanBrand = brandName.toLowerCase().trim();
    const cleanDomainName = cleanDomain.split("/")[0]; // e.g. gandhinagaruni.ac.in
    const domainDomainWord = cleanDomainName.split(".")[0]; // e.g. gandhinagaruni

    if (!webContent || webContent.includes("enable JavaScript") || webContent.length < 300) {
      console.log("[GeneratePromptsAPI] Crawled content is empty or JS blocked. Performing Perplexity search fallback...");
      try {
        const searchInfo = await callLLM(
          `Search the web for: site:${cleanDomainName} OR "${brandName}". Find details about its campus, location, departments, programs, courses, and unique details. Respond with a clear summary of facts about this website/organization.`,
          2000,
          "perplexity/sonar"
        );
        if (searchInfo) {
          webContent = searchInfo;
          console.log(`[GeneratePromptsAPI] Web search fallback retrieved ${webContent.length} characters of context.`);
        }
      } catch (searchErr: any) {
        console.error("[GeneratePromptsAPI] Web search fallback failed:", searchErr?.message || searchErr);
      }
    }

    const MODEL_MAP: Record<string, string> = {
      chatgpt:    "openai/gpt-4o-mini",
      gemini:     "google/gemini-2.5-flash",
      claude:     "anthropic/claude-3-haiku",
      perplexity: "perplexity/sonar",
    };

    const verifiedPrompts: any[] = [];
    const candidateMap = new Map<string, any>();
    
    let iterations = 0;
    const maxIterations = 3;

    while (verifiedPrompts.length < limit && iterations < maxIterations) {
      iterations++;
      const remainingNeeded = limit - verifiedPrompts.length;
      const batchToGenerate = Math.max(remainingNeeded * 2, 15);
      
      console.log(`[GeneratePromptsAPI] Iteration ${iterations}: Need ${remainingNeeded} more verified prompts. Generating batch of ${batchToGenerate}...`);

      const promptText = `You are an expert SEO and Answer Engine Optimization (AEO/GEO) query researcher.
Your task is to analyze the following business details, crawled website content, and target market context to generate exactly ${batchToGenerate} highly realistic, diverse, and natural conversational search queries (prompts) that buyers or clients located in "${location}" would search on conversational search engines (like ChatGPT Search, Gemini Search, Claude, or Perplexity) to discover, evaluate, compare, or research products/services in this vertical.

Business Information (For niche context only):
- Brand Name: "${brandName}"
- Domain: "${domain}"
- Target Location / Country: "${location}"
- Competitors: [${competitorsFromMeta.join(", ")}]

Crawled Website Content:
${webContent}

Guidelines for generating prompts:
1. Generate exactly ${batchToGenerate} search prompts.
2. Group the prompts logically under 6-8 key unbranded search-phrase keywords/topics relevant to the brand's industry (e.g. 'best budget friendly perfumes', 'long lasting fragrance for women', 'perfume vs eau de toilette', 'perfume sampler sets', 'perfume gift ideas for men'). 
3. CRITICAL: ALL GENERATED PROMPTS MUST BE COMPLETELY UNBRANDED. Do NOT include our brand name "${brandName}", our domain "${domain}", or the names of the competitors (like ${competitorsFromMeta.join(", ")}) in any of the prompts. They must be organic category/industry queries that real users would search (e.g. "perfumes under $50 that smell luxurious", "how do I choose a signature scent", "What are some highly recommended fragrances known for lasting all day?", "Compare perfume and EDT for longevity").
4. The queries must read naturally like queries typed or spoken by real users in "${location}" (e.g. including local search terms, pricing in local currency like INR if location is India, or targeting localized intent).
5. The prompts must be highly specific, localized, and long-tail (targeting unique features, exact locations, specific services, or niche topics found on the website's crawled content) so that a search engine is highly likely to retrieve and cite our website "${domain}" based on its unique content.
6. Do NOT duplicate or repeat any of these queries we have already generated in previous attempts:
[${Array.from(candidateMap.keys()).map(p => `"${p}"`).join(", ")}]
7. Do NOT generate generic placeholder templates such as "Is [Brand] trustworthy?". Instead, customize them to the actual niche, features, and topics of the business (e.g. fragrance, construction procurement, venue booking, etc.) while keeping them unbranded.

8. Return the result STRICTLY as a valid JSON array of objects. Each object MUST contain these fields:
   - "topic": string (lowercase, max 5 words, capitalized search-phrase keyword topic, e.g. 'best budget friendly perfumes')
   - "prompt": string (the exact conversational search engine prompt)
   - "rationale": string (always set this to empty string "" to save space and prevent token truncation)

Format your output STRICTLY as a raw JSON array. Do not include markdown code block formatting (like \`\`\`json or backticks) or any additional text.`;

      const llmResponse = await callLLM(promptText, 3000);
      if (!llmResponse) {
        console.warn("[GeneratePromptsAPI] Empty LLM response in iteration");
        continue;
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
          const candidate = cleanedText.slice(startIdx, endIdx + 1);
          try {
            promptsArray = JSON.parse(candidate);
          } catch (err) {
            console.error("[GeneratePromptsAPI] Failed to parse candidate JSON:", err);
            continue;
          }
        } else {
          console.error("[GeneratePromptsAPI] Invalid array format from AI model in iteration");
          continue;
        }
      }

      if (!Array.isArray(promptsArray) || promptsArray.length === 0) {
        console.warn("[GeneratePromptsAPI] AI did not return a valid array of prompts in iteration");
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

      console.log(`[GeneratePromptsAPI] Verifying ${newCandidates.length} new candidate prompts...`);
      const CONCURRENCY = 4;
      for (let i = 0; i < newCandidates.length; i += CONCURRENCY) {
        const batch = newCandidates.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async (c: any) => {
            try {
              console.log(`[GeneratePromptsAPI] Verifying prompt: "${c.prompt}"`);
              const searchRes = await callLLM(
                `Search for: "${c.prompt}". Respond objectively. Make sure to cite source URLs.`,
                2000,
                "perplexity/sonar"
              );
              const searchText = searchRes.toLowerCase();
              
              const perpMatch = searchText.includes(cleanDomainName) || 
                                (domainDomainWord.length >= 4 && searchText.includes(domainDomainWord)) || 
                                searchText.includes(cleanBrand);

              console.log(`[GeneratePromptsAPI] Perplexity verification for "${c.prompt}": ${perpMatch ? "PASS" : "FAIL"}`);
              if (!perpMatch) return false;

              // Ground ChatGPT, Gemini, and Claude using Perplexity Search response context
              const otherModels = ["chatgpt", "gemini", "claude"];
              const otherResults = await Promise.all(
                otherModels.map(async (modelKey) => {
                  try {
                    const groundingPrompt = `You are a search engine assistant answering a query based ONLY on the following search results. Ensure you mention or cite the relevant sources:
---
${searchRes}
---`;
                    
                    const modelRes = await callLLM(
                      c.prompt,
                      2000,
                      MODEL_MAP[modelKey]
                    );
                    const modelText = modelRes.toLowerCase();
                    const isMatch = modelText.includes(cleanDomainName) || 
                                    (domainDomainWord.length >= 4 && modelText.includes(domainDomainWord)) || 
                                    modelText.includes(cleanBrand);
                    console.log(`[GeneratePromptsAPI] ${modelKey} verification for "${c.prompt}": ${isMatch ? "PASS" : "FAIL"}`);
                    return isMatch;
                  } catch (e: any) {
                    console.warn(`[GeneratePromptsAPI] Grounded model ${modelKey} check failed:`, e?.message || e);
                    return false;
                  }
                })
              );

              const pass = otherResults.every(r => r === true);
              console.log(`[GeneratePromptsAPI] Combined Multi-Model Pass for "${c.prompt}": ${pass ? "PASS" : "FAIL"}`);
              return pass;
            } catch (err) {
              console.warn(`[GeneratePromptsAPI] Verification failed for prompt: "${c.prompt}"`, err);
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

    console.log(`[GeneratePromptsAPI] Verification complete. Found ${verifiedPrompts.length} verified prompts.`);

    // Guarantee we return exactly the requested limit of prompts
    const finalPrompts = verifiedPrompts.length >= limit
      ? verifiedPrompts.slice(0, limit)
      : [
          ...verifiedPrompts,
          ...Array.from(candidateMap.values())
            .filter(p => !verifiedPrompts.some(vp => vp.prompt.trim().toLowerCase() === p.prompt.trim().toLowerCase()))
        ].slice(0, limit);

    // 4. Delete existing prompts to make room for a completely fresh list of AI prompts
    const { error: deleteErr } = await supabase
      .from("aeo_prompts")
      .delete()
      .eq("project_id", projectId);

    if (deleteErr) {
      console.warn(`[GeneratePromptsAPI] Failed to clear old prompts: ${deleteErr.message}`);
    }

    const newRows = finalPrompts
      .filter((p: any) => p && p.prompt)
      .map((p: any) => ({
        project_id: projectId,
        topic: (p.topic || "General").trim(),
        prompt: p.prompt.trim(),
        is_active: true,
      }));

    if (newRows.length > 0) {
      const { error: insertError } = await supabase
        .from("aeo_prompts")
        .insert(newRows);
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true, generated: finalPrompts.length, inserted: newRows.length });
  } catch (error: any) {
    console.error("[GeneratePromptsAPI] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
