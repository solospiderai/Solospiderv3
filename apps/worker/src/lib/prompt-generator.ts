import { supabase } from "./supabase.js";
import { queryModel } from "./openrouter.js";

function makeAbsolute(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return "https:" + url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}

function findLogoUrl(html: string, baseUrl: string, brandName: string, domainName: string): string | null {
  // 1. Check og:logo
  const ogLogoM = /<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:logo["']/i.exec(html);
  if (ogLogoM) return decodeEntities(makeAbsolute(ogLogoM[1], baseUrl));

  const brandLower = brandName.toLowerCase().trim();
  
  // Extract keywords from domain name
  const cleanDomain = domainName.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  const domainParts = cleanDomain.split("/")[0].split(".");
  const commonTlds = new Set(["com", "org", "net", "edu", "gov", "co", "in", "io", "ai", "info", "biz", "us", "uk", "ca", "de", "fr"]);
  const domainKeywords = domainParts.filter(p => p && p.length > 2 && !commonTlds.has(p));

  // Extract images inside <nav> or <header> tags
  const headerImages = new Set<string>();
  const headerNavRegex = /<(nav|header)[^>]*>([\s\S]*?)<\/\1>/gi;
  let hnMatch;
  while ((hnMatch = headerNavRegex.exec(html)) !== null) {
    const content = hnMatch[2];
    const imgRegexInner = /<img\s+([^>]+)>/gi;
    let imgInnerMatch;
    while ((imgInnerMatch = imgRegexInner.exec(content)) !== null) {
      const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgInnerMatch[1]);
      if (srcMatch) headerImages.add(srcMatch[1]);
    }
  }

  // Extract images inside homepage links
  const homepageImages = new Set<string>();
  const aRegex = /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi;
  let aMatch;
  while ((aMatch = aRegex.exec(html)) !== null) {
    const aAttrs = aMatch[1];
    const aContent = aMatch[2];
    const hrefMatch = /\bhref=["']([^"']*)["']/i.exec(aAttrs);
    if (hrefMatch) {
      const href = hrefMatch[1].trim();
      const isHomepageLink = href === "/" || href === "" || href === baseUrl || href === baseUrl + "/" || href.replace(/\/$/, "") === domainName.replace(/\/$/, "");
      if (isHomepageLink) {
        const imgRegexInner = /<img\s+([^>]+)>/gi;
        let imgInnerMatch;
        while ((imgInnerMatch = imgRegexInner.exec(aContent)) !== null) {
          const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgInnerMatch[1]);
          if (srcMatch) homepageImages.add(srcMatch[1]);
        }
      }
    }
  }

  // 2. Scan all img tags
  const imgRegex = /<img\s+([^>]*)\/>|<img\s+([^>]*?)>/gi;
  const candidates: { src: string; score: number }[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgAttrs = match[1] || match[2] || "";
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgAttrs);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    const altMatch = /\balt=["']([^"']+)["']/i.exec(imgAttrs);
    const alt = altMatch ? altMatch[1] : "";
    const idMatch = /\bid=["']([^"']+)["']/i.exec(imgAttrs);
    const id = idMatch ? idMatch[1] : "";
    const classMatch = /\bclass=["']([^"']+)["']/i.exec(imgAttrs);
    const className = classMatch ? classMatch[1] : "";

    let score = 0;
    const srcLower = src.toLowerCase();
    const altLower = alt.toLowerCase().trim();
    const idLower = id.toLowerCase();
    const classLower = className.toLowerCase();

    // Word logo/brand matches
    if (srcLower.includes("logo")) score += 10;
    if (altLower.includes("logo")) score += 10;
    if (idLower.includes("logo")) score += 10;
    if (classLower.includes("logo")) score += 10;

    if (srcLower.includes("brand")) score += 5;
    if (altLower.includes("brand")) score += 5;
    if (idLower.includes("brand")) score += 5;
    if (classLower.includes("brand")) score += 5;

    // Brand name match
    if (brandLower && (altLower === brandLower || altLower.includes(brandLower))) {
      score += 15;
    }

    // Domain keywords match
    for (const kw of domainKeywords) {
      if (altLower.includes(kw) || srcLower.includes(kw)) {
        score += 15;
      }
    }

    // Structural matches
    if (headerImages.has(src)) score += 12;
    if (homepageImages.has(src)) score += 15;

    // Penalties
    if (srcLower.includes("favicon") || srcLower.includes("icon") || srcLower.includes("avatar")) score -= 10;
    if (srcLower.includes("banner") || srcLower.includes("hero") || srcLower.includes("slide")) score -= 10;
    if (srcLower.endsWith(".svg")) score += 3;

    // Position bonus (first 12,000 characters)
    if (match.index < 12000) score += 5;

    candidates.push({ src, score });
  }

  // Filter and sort candidates
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    // If the top candidate has a decent score, return it
    if (candidates[0].score > -5) {
      return decodeEntities(makeAbsolute(candidates[0].src, baseUrl));
    }
  }

  // Fallback to og:image
  const ogImageM = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  if (ogImageM) {
    return decodeEntities(makeAbsolute(ogImageM[1], baseUrl));
  }

  // Final fallback: return first candidate image if exists
  if (candidates.length > 0) {
    return decodeEntities(makeAbsolute(candidates[0].src, baseUrl));
  }

  return null;
}

export async function generateAndSaveAiPrompts(projectId: string) {
  try {
    console.log(`[PromptGenerator] Generating AEO prompts for project ${projectId}...`);

    // 1. Fetch project details
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) {
      console.error(`[PromptGenerator] Project ${projectId} not found:`, fetchErr);
      return;
    }

    const rawDesc = project.brand_description || "";
    const hasMetadata = rawDesc.includes("\n---\nMETADATA: ");
    let cleanDesc = rawDesc;
    let competitorsFromMeta: string[] = [];
    let location = "United States";
    let hasFullMetadata = false;
    
    const parts = rawDesc.split("\n---\nMETADATA: ");
    if (hasMetadata && parts.length > 1) {
      cleanDesc = parts[0];
      try {
        const meta = JSON.parse(parts[1]);
        if (Array.isArray(meta.competitors)) {
          competitorsFromMeta = meta.competitors;
        }
        if (meta.location) {
          location = meta.location;
        }
        if (meta.colors && meta.fonts && meta.summary) {
          hasFullMetadata = true;
        }
      } catch (e) {
        console.warn("[PromptGenerator] Failed to parse project metadata:", e);
      }
    }

    const brandName = project.brand_name || project.name;
    const domain = project.domain;
    const brandDescription = cleanDesc || project.brand_tagline || "a digital brand";

    // 2. Fetch crawled pages to guide AI prompt generation
    const { data: pages } = await supabase
      .from("crawled_pages" as any)
      .select("url, title, meta_desc, h1")
      .eq("project_id", projectId)
      .limit(15);

    let webContent = "";
    if (pages && pages.length > 0) {
      webContent = pages.map(p => `* URL: ${p.url}\n  Title: ${p.title || ""}\n  H1: ${p.h1 || ""}\n  Description: ${p.meta_desc || ""}`).join("\n");
    } else {
      console.log(`[PromptGenerator] No crawled pages in database. Fetching homepage ${domain} dynamically...`);
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
          console.warn(`[PromptGenerator] Homepage fetch returned status ${pageRes.status}`);
        }
      } catch (err: any) {
        console.warn(`[PromptGenerator] Dynamic homepage fetch failed: ${err?.message || err}`);
      }
    }

    if (!webContent) {
      webContent = "No pages indexed yet.";
    }

    // Auto-discover location, competitors, colors, fonts, etc. if missing
    if (!hasFullMetadata) {
      console.log(`[PromptGenerator] Incomplete or missing metadata for project ${projectId}. Running auto-discovery...`);
      try {
        let homepageHtml = "";
        let cleanUrl = domain.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = "https://" + cleanUrl;
        }
        try {
          const pageRes = await fetch(cleanUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoloSpider-Crawler/1.0" }
          });
          if (pageRes.ok) {
            homepageHtml = await pageRes.text();
          }
        } catch (err) {
          console.warn("[PromptGenerator] Failed to fetch homepage HTML for logo search:", err);
        }

        const logoUrl = homepageHtml ? findLogoUrl(homepageHtml, cleanUrl, brandName, domain) : null;

        const discoveryPrompt = `You are a world-class branding strategist and business analyst. 
Your task is to analyze the following company details and crawled website text content to generate a comprehensive, accurate brand profile, visual identity, brand voice, and competitors.

Company Details:
- Name: "${brandName}"
- Website: "${domain}"
- Tagline: "${project.brand_tagline || ""}"

Crawled Website Context:
${webContent}

Analyze the branding, tone, visual style, colors, fonts, target audience, business category, location (primarily targeted country/market), and competitors of this specific company. 
CRITICAL: Do not assume the company is a Software/SaaS platform unless the crawled content explicitly indicates that. If it's a fragrance, venue booking, cosmetics, hospitality, construction, or other business, model it accurately.

For Target Country (location):
- Analyze the text, contact details, currencies, regional references, and phone numbers.
- If the domain is a .in or target market is explicitly/implicitly India (e.g. pricing in INR, offices in India, cities like Mumbai/Delhi/Bangalore), set target location/location to "India".

For Competitors:
- Deduce exactly 3 or 4 real competitors in this specific category (e.g. for a premium Indian fragrance brand like Fraganote, competitors would be Ajmal Perfumes, Villain, Skinn by Titan, Nykaa Perfumes, etc. For a SaaS, it would be related SaaS platforms. Do not output generic SaaS competitors like Semrush/Ahrefs unless the brand itself is an SEO/SaaS company).

For Color Palette:
- Suggest 6 harmonious hex color codes representing the brand's style. For luxury fragrance, suggest rich golds, deep obsidian, luxury purples, warm cream. For tech, blues/indigos.

For Font Pairings:
- Suggest primary and secondary Google fonts. For luxury, use serif/display fonts like Playfair Display, Montserrat, etc.

For Brand Voice:
- Set sliders from 0 to 100 representing: professionalCasual, friendlyFormal, boldSubtle, premiumAccessible, simpleComplex.
- Suggest 4 brand voice tags.

Return the results strictly as a JSON object with the following schema:
{
  "summary": "A highly professional, engaging brand summary paragraph (exactly 3 to 4 sentences long) highlighting their core values, product/service offering, and target audience.",
  "location": "Target country name",
  "industry": "Industry name (e.g. Fragrance & Cosmetics, Real Estate, Event Management)",
  "category": "Niche business category",
  "targetAudience": "Description of target customers",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
  "fonts": {
    "primary": "Primary Google Font Name",
    "secondary": "Secondary Google Font Name"
  },
  "designStyles": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "voiceSliders": {
    "professionalCasual": 30,
    "friendlyFormal": 40,
    "boldSubtle": 20,
    "premiumAccessible": 10,
    "simpleComplex": 50
  },
  "voiceTags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com"],
  "competitorsDetail": [
    {
      "name": "competitor1.com",
      "positioning": "Short positioning statement",
      "strengths": "Top strength",
      "share": 25
    },
    ...
  ]
}

Respond ONLY with raw valid JSON. Do not include markdown code block formatting (like \`\`\`json) or any explanation outside the JSON.`;

        const discRes = await queryModel("gemini", discoveryPrompt, "You are a JSON generator. Respond ONLY with valid JSON.");
        let cleanedDisc = discRes.text.trim();
        if (cleanedDisc.startsWith("```")) {
          cleanedDisc = cleanedDisc.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }
        
        let parsedDisc: any = {};
        try {
          parsedDisc = JSON.parse(cleanedDisc);
        } catch {
          const startIdx = cleanedDisc.indexOf("{");
          const endIdx = cleanedDisc.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            parsedDisc = JSON.parse(cleanedDisc.slice(startIdx, endIdx + 1));
          }
        }

        if (logoUrl && !parsedDisc.logoUrl) {
          parsedDisc.logoUrl = logoUrl;
        }

        if (parsedDisc && parsedDisc.location) {
          location = parsedDisc.location;
        }
        if (parsedDisc && Array.isArray(parsedDisc.competitors)) {
          competitorsFromMeta = parsedDisc.competitors;
        }

        const summary = parsedDisc.summary || "A premium and dedicated brand focused on high quality offerings.";
        const metadataBlock = `\n---\nMETADATA: ${JSON.stringify(parsedDisc)}`;
        const newDesc = `${summary}${metadataBlock}`;
        
        const updateData: any = { brand_description: newDesc };
        if (parsedDisc.logoUrl) {
          updateData.brand_logo_url = parsedDisc.logoUrl;
        }

        await supabase
          .from("projects")
          .update(updateData)
          .eq("id", projectId);
          
        console.log(`[PromptGenerator] Auto-discovered metadata saved: location=${location}, competitors=${competitorsFromMeta.join(", ")}`);
      } catch (discErr) {
        console.warn(`[PromptGenerator] Auto-discovery failed for project ${projectId}:`, discErr);
      }
    }

    // Check if custom prompts already exist (e.g. created in the onboarding wizard)
    const { count, error: countErr } = await supabase
      .from("aeo_prompts")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (!countErr && typeof count === "number" && count > 5) {
      console.log(`[PromptGenerator] Project ${projectId} already has ${count} custom prompts. Skipping AI prompt generation to preserve them.`);
      return;
    }

    // 3. Prompt for model
    const promptText = `You are an expert SEO and Answer Engine Optimization (AEO/GEO) query researcher.
Your task is to analyze the following business details, crawled homepage content, and target market context to generate a comprehensive list of exactly 25 highly realistic, diverse, and natural conversational search queries (prompts) that buyers or clients located in "${location}" would search on conversational search engines (like ChatGPT Search, Gemini Search, Claude, or Perplexity) to discover, evaluate, compare, or research products/services in this vertical.

Business Information (For niche context only):
- Brand Name: "${brandName}"
- Domain: "${domain}"
- Target Location / Country: "${location}"
- Competitors: [${competitorsFromMeta.join(", ")}]

Crawled Website Content:
${webContent}

Guidelines for generating prompts:
1. Generate exactly 25 search prompts. Do not generate less or more.
2. Group the prompts logically under 6-8 key search-phrase keywords/topics relevant to the brand's industry.
3. CRITICAL: EVERY GENERATED PROMPT MUST EXPLICITLY MENTION OR INCLUDE our brand name "${brandName}" or our website domain "${domain}" to ensure that search engines retrieve and display information about our brand. They must be realistic user queries/prompts comparing, evaluating, reviewing, or exploring "${brandName}" in the context of the topic (e.g., "Is ${brandName} a reliable choice for [topic]?", "Compare ${brandName} vs alternatives for [topic]", "What are the reviews and experiences of using ${brandName} for [topic]?", "Where can I find pricing or contact details for ${brandName} for [topic]?").
4. The queries must read naturally like queries typed or spoken by real users in "${location}" (e.g. including local search terms, pricing in local currency like INR if location is India, or targeting localized intent).
5. Do NOT generate generic placeholder templates such as "Is ${brandName} trustworthy?". Instead, customize them to the actual niche, features, and topics of the business (e.g. fragrance, construction procurement, venue booking, etc.) while incorporating our brand name "${brandName}" or domain "${domain}".

6. Return the result strictly as a valid JSON array of objects. Each object MUST contain these fields:
   - "topic": string (lowercase, max 5 words, capitalized search-phrase keyword topic, e.g. 'best budget friendly perfumes')
   - "prompt": string (the exact conversational search engine prompt)
   - "rationale": string (1-sentence explaining why this prompt is important for AEO research)

Format your output STRICTLY as a raw JSON array. Do not include markdown code block formatting (like \`\`\`json or backticks) or any additional text.`;

    const res = await queryModel("gemini", promptText, "You are a JSON generator. Respond ONLY with valid JSON array.", 2500);
    let cleanedText = res.text.trim();
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
          console.error("[PromptGenerator] Failed to parse candidate JSON:", err);
        }
      }
    }

    if (!Array.isArray(promptsArray) || promptsArray.length === 0) {
      console.warn("[PromptGenerator] AI did not return a valid array of prompts.");
      return;
    }

    // 4. Delete existing prompts to make room for a completely fresh list of AI prompts
    const { error: deleteErr } = await supabase
      .from("aeo_prompts")
      .delete()
      .eq("project_id", projectId);

    if (deleteErr) {
      console.warn(`[PromptGenerator] Failed to clear old prompts: ${deleteErr.message}`);
    }

    const newRows = promptsArray
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
      console.log(`[PromptGenerator] Successfully inserted ${newRows.length} new dynamic AI prompts for project ${projectId}.`);
    } else {
      console.log(`[PromptGenerator] No new AEO prompts to insert for project ${projectId}.`);
    }
  } catch (err) {
    console.error(`[PromptGenerator] Error generating AEO prompts:`, err);
  }
}
