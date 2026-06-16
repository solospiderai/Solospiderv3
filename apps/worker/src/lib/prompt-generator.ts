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
  // 1. Check JSON-LD schema for logo (highly reliable, standard official logo)
  const ldJsonRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = ldJsonRegex.exec(html)) !== null) {
    try {
      const jsonText = ldMatch[1].trim();
      const logoMatch = /"logo"\s*:\s*"([^"]+)"/i.exec(jsonText);
      if (logoMatch) {
        const logoUrl = logoMatch[1].trim();
        if (logoUrl && !logoUrl.startsWith("@") && logoUrl.length > 2 && !logoUrl.startsWith("data:")) {
          // If the JSON-LD logo is just a favicon, don't return it immediately
          if (!logoUrl.toLowerCase().includes("favicon") && !logoUrl.toLowerCase().includes("icon-")) {
            return decodeEntities(makeAbsolute(logoUrl, baseUrl));
          }
        }
      }
    } catch {}
  }

  // 2. Check itemprop="logo" metadata
  const itempropLogoM = /<[^>]+itemprop=["']logo["'][^>]+content=["']([^"']+)["']/i.exec(html)
    ?? /<img[^>]+itemprop=["']logo["'][^>]+src=["']([^"']+)["']/i.exec(html);
  if (itempropLogoM && !itempropLogoM[1].startsWith("data:")) {
    const logoUrl = itempropLogoM[1].trim();
    if (!logoUrl.toLowerCase().includes("favicon") && !logoUrl.toLowerCase().includes("icon-")) {
      return decodeEntities(makeAbsolute(logoUrl, baseUrl));
    }
  }

  // 3. Check og:logo
  const ogLogoM = /<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i.exec(html)
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:logo["']/i.exec(html);
  if (ogLogoM && !ogLogoM[1].startsWith("data:")) return decodeEntities(makeAbsolute(ogLogoM[1], baseUrl));

  const brandLower = brandName.toLowerCase().trim();
  
  // Extract keywords from domain name
  const cleanDomain = domainName.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  const domainParts = cleanDomain.split("/")[0].split(".");
  const commonTlds = new Set(["com", "org", "net", "edu", "gov", "co", "in", "io", "ai", "info", "biz", "us", "uk", "ca", "de", "fr"]);
  const domainKeywords = domainParts.filter(p => p && p.length > 2 && !commonTlds.has(p));

  // Extract images inside <nav> or <header> tags
  const headerImages = new Set<string>();
  const headerNavRegex = /<(nav|header)[^>]*>([\s\S]*?)<\/\1>/gi;
  const headerNavRanges: { start: number; end: number }[] = [];
  let hnMatch;
  while ((hnMatch = headerNavRegex.exec(html)) !== null) {
    headerNavRanges.push({ start: hnMatch.index, end: hnMatch.index + hnMatch[0].length });
    const content = hnMatch[2];
    const imgRegexInner = /<img\s+([^>]+)>/gi;
    let imgInnerMatch;
    while ((imgInnerMatch = imgRegexInner.exec(content)) !== null) {
      const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgInnerMatch[1]);
      if (srcMatch) headerImages.add(srcMatch[1]);
      // Also track lazy loaded src inside nav/header
      const lazySrcMatch = /\b(?:data-src|data-lazy-src|data-original|srcset)=["']([^"'\s]+)["']/i.exec(imgInnerMatch[1]);
      if (lazySrcMatch) {
        const cleanLazy = lazySrcMatch[1].split(",")[0].trim().split(" ")[0];
        if (cleanLazy) headerImages.add(cleanLazy);
      }
    }
  }

  // Extract images inside homepage links
  const homepageImages = new Set<string>();
  const homepageLinkRanges: { start: number; end: number; attrs: string }[] = [];
  const aRegex = /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi;
  let aMatch;
  while ((aMatch = aRegex.exec(html)) !== null) {
    const aAttrs = aMatch[1];
    const aContent = aMatch[2];
    const hrefMatch = /\bhref=["']([^"']*)["']/i.exec(aAttrs);
    if (hrefMatch) {
      const href = hrefMatch[1].trim();
      const isHomepageLink = href === "/" || href === "" || href === baseUrl || href === baseUrl + "/" || href.replace(/\/$/, "") === domainName.replace(/\/$/, "") || href.startsWith("/?") || href.startsWith("?");
      if (isHomepageLink) {
        homepageLinkRanges.push({ start: aMatch.index, end: aMatch.index + aMatch[0].length, attrs: aAttrs });
        const imgRegexInner = /<img\s+([^>]+)>/gi;
        let imgInnerMatch;
        while ((imgInnerMatch = imgRegexInner.exec(aContent)) !== null) {
          const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgInnerMatch[1]);
          if (srcMatch) homepageImages.add(srcMatch[1]);
          const lazySrcMatch = /\b(?:data-src|data-lazy-src|data-original|srcset)=["']([^"'\s]+)["']/i.exec(imgInnerMatch[1]);
          if (lazySrcMatch) {
            const cleanLazy = lazySrcMatch[1].split(",")[0].trim().split(" ")[0];
            if (cleanLazy) homepageImages.add(cleanLazy);
          }
        }
      }
    }
  }

  const candidates: { src: string; score: number }[] = [];

  // Check apple-touch-icon (high quality favicon fallback)
  const appleTouchIconM = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i.exec(html)
    ?? /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i.exec(html);
  if (appleTouchIconM) {
    const iconUrl = appleTouchIconM[1].trim();
    if (iconUrl && !iconUrl.startsWith("data:")) {
      candidates.push({ src: iconUrl, score: 15 }); // high score for touch icon fallback
    }
  }

  // Check high resolution icons
  const iconM = /<link[^>]+rel=["']icon["'][^>]+sizes=["'](?:192x192|96x96|32x32)["'][^>]+href=["']([^"']+)["']/i.exec(html)
    ?? /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["'][^>]+sizes=["'](?:192x192|96x96|32x32)["']/i.exec(html);
  if (iconM) {
    const iconUrl = iconM[1].trim();
    if (iconUrl && !iconUrl.startsWith("data:")) {
      candidates.push({ src: iconUrl, score: 8 });
    }
  }

  // 4. Scan all img tags
  const imgRegex = /<img\s+([^>]*)\/>|<img\s+([^>]*?)>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgAttrs = match[1] || match[2] || "";
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(imgAttrs);
    if (!srcMatch) continue;
    const src = srcMatch[1];
    
    // Resolve lazy loading attributes if present
    let realSrc = src;
    const lazySrcMatch = /\b(?:data-src|data-lazy-src|data-original|data-fallback-src|srcset)=["']([^"'\s]+)["']/i.exec(imgAttrs);
    if (lazySrcMatch) {
      const candidateLazy = lazySrcMatch[1].split(",")[0].trim().split(" ")[0];
      if (candidateLazy && !candidateLazy.startsWith("data:")) {
        realSrc = candidateLazy;
      }
    }

    const altMatch = /\balt=["']([^"']+)["']/i.exec(imgAttrs);
    const alt = altMatch ? altMatch[1] : "";
    const idMatch = /\bid=["']([^"']+)["']/i.exec(imgAttrs);
    const id = idMatch ? idMatch[1] : "";
    const classMatch = /\bclass=["']([^"']+)["']/i.exec(imgAttrs);
    const className = classMatch ? classMatch[1] : "";

    let score = 0;
    const srcLower = realSrc.toLowerCase();
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
    if (headerImages.has(realSrc) || headerImages.has(src)) score += 12;
    if (homepageImages.has(realSrc) || homepageImages.has(src)) score += 15;

    // Penalties
    if (srcLower.includes("favicon") || srcLower.includes("icon") || srcLower.includes("avatar")) score -= 10;
    if (srcLower.includes("banner") || srcLower.includes("hero") || srcLower.includes("slide")) score -= 15;
    if (srcLower.endsWith(".svg")) score += 3;

    // Social media / platform penalties
    const socialExcluded = [
      "facebook", "instagram", "twitter", "linkedin", "youtube", "pinterest", "tiktok", "threads",
      "stripe", "trustpilot", "visa", "paypal", "app-store", "google-play"
    ];
    if (socialExcluded.some(platform => srcLower.includes(platform) || altLower.includes(platform) || idLower.includes(platform) || classLower.includes(platform))) {
      score -= 80;
    }

    // Data url penalty (placeholders)
    if (realSrc.startsWith("data:")) score -= 50;

    // Position bonus (first 12,000 characters)
    if (match.index < 12000) score += 5;

    candidates.push({ src: realSrc, score });
  }

  // 5. Scan inline SVG tags
  const svgRegex = /<svg\b([^>]*?)>([\s\S]*?)<\/svg>/gi;
  let svgMatch;
  while ((svgMatch = svgRegex.exec(html)) !== null) {
    const svgAttrs = svgMatch[1];
    const svgContent = svgMatch[2];
    const svgIndex = svgMatch.index;
    const svgLength = svgMatch[0].length;
    
    // Skip inline SVGs that are too large (e.g. detailed graphics/maps) or too small (chevrons)
    if (svgLength > 30000 || svgLength < 150) continue;

    let score = 0;
    const svgAttrsLower = svgAttrs.toLowerCase();
    const svgContentLower = svgContent.toLowerCase();

    // Check if inside header/nav
    const insideHeaderNav = headerNavRanges.some(r => svgIndex >= r.start && (svgIndex + svgLength) <= r.end);
    if (insideHeaderNav) score += 15;

    // Check if inside homepage link
    const parentLink = homepageLinkRanges.find(r => svgIndex >= r.start && (svgIndex + svgLength) <= r.end);
    if (parentLink) {
      score += 20;
      const linkAttrsLower = parentLink.attrs.toLowerCase();
      if (linkAttrsLower.includes("logo")) score += 15;
      if (brandLower && linkAttrsLower.includes(brandLower)) score += 15;
    }

    if (svgAttrsLower.includes("logo")) score += 15;
    if (svgAttrsLower.includes("brand")) score += 10;
    if (brandLower && svgAttrsLower.includes(brandLower)) score += 15;

    const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(svgContent);
    if (titleM) {
      const titleText = titleM[1].toLowerCase().trim();
      if (titleText.includes("logo")) score += 25;
      if (brandLower && titleText.includes(brandLower)) score += 25;
    }

    // Penalize utility SVGs and social icons
    const socialExcluded = [
      "facebook", "instagram", "twitter", "linkedin", "youtube", "pinterest", "tiktok", "threads",
      "stripe", "trustpilot", "visa", "paypal", "app-store", "google-play"
    ];
    if (socialExcluded.some(platform => svgAttrsLower.includes(platform) || svgContentLower.includes(platform))) {
      score -= 80;
    }

    const utilityKeywords = [
      "search", "cart", "user", "bag", "menu", "close", "arrow", "phone", "mail",
      "heart", "wishlist", "truck", "star", "magnifying", "chevron", "login"
    ];
    for (const keyword of utilityKeywords) {
      if (svgAttrsLower.includes(keyword) || svgContentLower.includes(keyword)) {
        score -= 40;
      }
    }

    if (svgIndex < 15000) score += 5;

    // SVG specific bonus if it seems to be a logo
    if (score > 10) {
      score += 10;
    }

    const base64Svg = Buffer.from(svgMatch[0].trim()).toString("base64");
    const src = `data:image/svg+xml;base64,${base64Svg}`;
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
  if (ogImageM && !ogImageM[1].startsWith("data:")) {
    return decodeEntities(makeAbsolute(ogImageM[1], baseUrl));
  }

  // Final fallback: return first candidate image if exists (excluding penalized non-SVG data urls)
  const validFallback = candidates.find(c => !c.src.startsWith("data:") || c.src.startsWith("data:image/svg+xml"));
  if (validFallback) {
    return decodeEntities(makeAbsolute(validFallback.src, baseUrl));
  }

  return null;
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

    if (!webContent || webContent.includes("enable JavaScript") || webContent.length < 300) {
      console.log("[PromptGenerator] Crawled content is empty or JS blocked. Performing Perplexity search fallback...");
      try {
        const searchInfo = await queryModel(
          "perplexity",
          `Search the web for: site:${domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]} OR "${brandName}". Find details about this brand/organization, including its core offerings, services, products, business category, target audience, location, and key features. Respond with a detailed and objective summary of facts about this website/organization.`
        );
        if (searchInfo && searchInfo.text) {
          webContent = searchInfo.text;
          console.log(`[PromptGenerator] Web search fallback retrieved ${webContent.length} characters of context.`);
        }
      } catch (searchErr: any) {
        console.error("[PromptGenerator] Web search fallback failed:", searchErr?.message || searchErr);
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
      await enqueueAutoScan(projectId, brandName, competitorsFromMeta);
      return;
    }

    // 3. Iterative prompt generation and verification loop
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
    const cleanBrand = brandName.toLowerCase().trim();
    const cleanDomainName = cleanDomain.split("/")[0]; // e.g. gandhinagaruni.ac.in
    const domainDomainWord = cleanDomainName.split(".")[0]; // e.g. gandhinagaruni

    const verifiedPrompts: any[] = [];
    const candidateMap = new Map<string, any>();
    
    let iterations = 0;
    const maxIterations = 3;
    const limit = 25; // Worker default target

    while (verifiedPrompts.length < limit && iterations < maxIterations) {
      iterations++;
      const remainingNeeded = limit - verifiedPrompts.length;
      const batchToGenerate = Math.max(remainingNeeded * 2, 15);
      
      console.log(`[PromptGenerator] Iteration ${iterations}: Need ${remainingNeeded} more verified prompts. Generating batch of ${batchToGenerate}...`);

      const promptText = `You are an expert SEO and Answer Engine Optimization (AEO/GEO) query researcher.
Your task is to analyze the following business details, crawled homepage content, and target market context to generate a pool of exactly ${batchToGenerate} highly realistic, diverse, and natural conversational search queries (prompts) that buyers or clients located in "${location}" would search on conversational search engines (like ChatGPT Search, Gemini Search, Claude, or Perplexity) to discover, evaluate, compare, or research products/services in this vertical.

Business Information (For niche context only):
- Brand Name: "${brandName}"
- Domain: "${domain}"
- Target Location / Country: "${location}"
- Competitors: [${competitorsFromMeta.join(", ")}]

Crawled Website Content:
${webContent}

Guidelines for generating prompts:
1. Generate exactly ${batchToGenerate} search prompts.
2. Group the prompts logically under 6-8 key search-phrase keywords/topics relevant to the brand's industry.
3. CRITICAL: EVERY GENERATED PROMPT MUST BE COMPLETELY UNBRANDED. Do NOT include our brand name "${brandName}", our domain "${domain}", or the names of the competitors (like ${competitorsFromMeta.join(", ")}) in any of the prompts. They must be organic category/industry queries that real users would search (e.g. "perfumes under $50 that smell luxurious", "how do I choose a signature scent", "What are some highly recommended fragrances known for lasting all day?", "Compare perfume and EDT for longevity").
4. The prompts must be highly specific, localized, and long-tail (targeting unique features, exact locations, specific services, or niche topics found on the website's crawled homepage content) so that a search engine is highly likely to retrieve and cite our website "${domain}" based on its unique content.
5. Do NOT duplicate or repeat any of these queries we have already generated in previous attempts:
[${Array.from(candidateMap.keys()).map(p => `"${p}"`).join(", ")}]
6. Do NOT generate generic placeholder templates such as "Is [Brand] trustworthy?". Instead, customize them to the actual niche, features, and topics of the business (e.g. fragrance, construction procurement, venue booking, etc.) while keeping them unbranded.

7. Return the result strictly as a valid JSON array of objects. Each object MUST contain these fields:
   - "topic": string (lowercase, max 5 words, capitalized search-phrase keyword topic, e.g. 'best budget friendly perfumes')
   - "prompt": string (the exact conversational search engine prompt)
   - "rationale": string (always set this to empty string "" to save space and prevent token truncation)

Format your output STRICTLY as a raw JSON array. Do not include markdown code block formatting (like \`\`\`json or backticks) or any additional text.`;

      try {
        const res = await queryModel("gemini", promptText, "You are a JSON generator. Respond ONLY with valid JSON array.", 3000);
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
              continue;
            }
          } else {
            console.error("[PromptGenerator] Invalid array format from AI model in iteration");
            continue;
          }
        }

        if (!Array.isArray(promptsArray) || promptsArray.length === 0) {
          console.warn("[PromptGenerator] AI did not return a valid array of prompts in iteration");
          continue;
        }

        // Filter out duplicates, branded prompts, and add to candidateMap
        const newCandidates = promptsArray.filter((p: any) => {
          if (!p || !p.prompt) return false;
          const norm = p.prompt.trim().toLowerCase();
          if (candidateMap.has(norm)) return false;
          if (!isValidUnbrandedPrompt(p.prompt, brandName, domain, competitorsFromMeta)) {
            console.log(`[PromptGenerator] Skipping branded prompt: "${p.prompt}"`);
            return false;
          }
          candidateMap.set(norm, p);
          return true;
        });

        console.log(`[PromptGenerator] Verifying ${newCandidates.length} new candidate prompts...`);
        const CONCURRENCY = 4;
        for (let i = 0; i < newCandidates.length; i += CONCURRENCY) {
          const batch = newCandidates.slice(i, i + CONCURRENCY);
          const results = await Promise.all(
            batch.map(async (c: any) => {
              try {
                console.log(`[PromptGenerator] Verifying prompt: "${c.prompt}"`);
                
                // Query Perplexity (Search)
                const searchRes = await queryModel(
                  "perplexity",
                  `Search for: "${c.prompt}". Respond objectively. Make sure to cite source URLs.`
                );
                const searchText = searchRes.text.toLowerCase();
                const perpMatch = searchText.includes(cleanDomainName) || 
                                  (domainDomainWord.length >= 4 && searchText.includes(domainDomainWord)) || 
                                  searchText.includes(cleanBrand);

                console.log(`[PromptGenerator] Perplexity verification for "${c.prompt}": ${perpMatch ? "PASS" : "FAIL"}`);
                if (!perpMatch) return false;

                // Ground ChatGPT, Gemini, and Claude using Perplexity Search response context
                const otherModels = ["chatgpt", "gemini", "claude"];
                const otherResults = await Promise.all(
                  otherModels.map(async (modelKey) => {
                    try {
                      const groundingPrompt = `You are a search engine assistant answering a query based ONLY on the following search results. Ensure you mention or cite the relevant sources:
---
${searchRes.text}
---`;
                      
                      const modelRes = await queryModel(
                        modelKey,
                        c.prompt,
                        groundingPrompt
                      );
                      const modelText = modelRes.text.toLowerCase();
                      const isMatch = modelText.includes(cleanDomainName) || 
                                      (domainDomainWord.length >= 4 && modelText.includes(domainDomainWord)) || 
                                      modelText.includes(cleanBrand);
                      console.log(`[PromptGenerator] ${modelKey} verification for "${c.prompt}": ${isMatch ? "PASS" : "FAIL"}`);
                      return isMatch;
                    } catch (e: any) {
                      console.warn(`[PromptGenerator] Grounded model ${modelKey} check failed:`, e?.message || e);
                      return false;
                    }
                  })
                );

                const pass = otherResults.every(r => r === true);
                console.log(`[PromptGenerator] Combined Multi-Model Pass for "${c.prompt}": ${pass ? "PASS" : "FAIL"}`);
                return pass;
              } catch (err) {
                console.warn(`[PromptGenerator] Verification failed for prompt: "${c.prompt}"`, err);
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
      } catch (err) {
        console.error(`[PromptGenerator] Error in iteration ${iterations}:`, err);
      }
    }

    console.log(`[PromptGenerator] Verification complete. Found ${verifiedPrompts.length} verified prompts.`);

    // Guarantee we return exactly 25 prompts (fill remaining slots with candidate prompts if short)
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
      console.warn(`[PromptGenerator] Failed to clear old prompts: ${deleteErr.message}`);
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
      console.log(`[PromptGenerator] Successfully inserted ${newRows.length} new dynamic AI prompts for project ${projectId}.`);
    } else {
      console.log(`[PromptGenerator] No new AEO prompts to insert for project ${projectId}.`);
    }

    await enqueueAutoScan(projectId, brandName, competitorsFromMeta);
  } catch (err) {
    console.error(`[PromptGenerator] Error generating AEO prompts:`, err);
  }
}

async function enqueueAutoScan(projectId: string, brandName: string, competitors: string[]) {
  try {
    const { promptScanQueue } = await import("../queues.js");
    console.log(`[PromptGenerator] Enqueuing automatic prompt scan for project ${projectId} (${brandName}) with competitors:`, competitors);
    await promptScanQueue.add("prompt-scan", {
      project_id: projectId,
      brand_name: brandName,
      models: ["chatgpt", "gemini", "perplexity", "claude"],
      competitors: competitors,
    }, {
      jobId: `auto-scan-${projectId}-${Date.now()}`
    });
  } catch (scanErr) {
    console.error("[PromptGenerator] Failed to enqueue automatic prompt scan:", scanErr);
  }
}
