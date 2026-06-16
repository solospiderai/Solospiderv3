import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { createClient } from "@supabase/supabase-js";
import { isNonUserPage } from "@/lib/seo-utils";

export const runtime = "nodejs";

const GenerateBrandSummarySchema = z.object({
  projectId: z.string().uuid(),
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

async function callLLM(prompt: string, maxTokens = 500) {
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
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (err) {
      console.warn("[generate-brand-summary] OpenRouter failed, falling back:", err);
    }
  }

  if (!text) {
    try {
      const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
      const res = await fetch(pollinationsUrl);
      if (res.ok) {
        text = (await res.text()).trim();
      }
    } catch (err) {
      console.error("[generate-brand-summary] Pollinations fallback failed:", err);
    }
  }

  return text;
}

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

    // Social media / helper / badge penalties
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

function extractColorsFromHtml(html: string): string[] {
  const hexRegex = /#([A-Fa-f0-9]{6})\b/gi;
  const colorCounts: Record<string, number> = {};
  let match;
  while ((match = hexRegex.exec(html)) !== null) {
    const hex = match[0].toLowerCase();
    
    // Filter out whites, blacks, and neutral background grays
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Check if grayscale/neutral: differences between R, G, B are all very small (e.g. within 15)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 15) {
      continue;
    }
    
    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
  }
  
  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = GenerateBrandSummarySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid projectId parameter" }, { status: 400 });
    }

    const { projectId } = parsed.data;
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

    // 2. Fetch some crawled pages to guide brand tone/topic
    const { data: pages } = await supabase
      .from("crawled_pages" as any)
      .select("url, title, meta_desc, h1")
      .eq("project_id", projectId)
      .limit(100);

    const userFacingPages = (pages || [])
      .filter((p: any) => !isNonUserPage(p.url))
      .slice(0, 15);

    // 3. Fetch homepage HTML to extract logo & full-text content
    let homepageHtml = "";
    let cleanUrl = project.domain.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    try {
      const pageRes = await fetch(cleanUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoloSpider-Crawler/1.0" },
        next: { revalidate: 0 }
      });
      if (pageRes.ok) {
        homepageHtml = await pageRes.text();
      }
    } catch (err) {
      console.warn("[generate-brand-summary] Failed to fetch homepage HTML:", err);
    }

    let homepageText = "";
    if (homepageHtml) {
      homepageText = homepageHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 8000)
        .trim();
    }

    const logoUrl = homepageHtml ? findLogoUrl(homepageHtml, cleanUrl, project.brand_name || project.name, project.domain) : null;
    const extractedColors = homepageHtml ? extractColorsFromHtml(homepageHtml) : [];
    const colorGroundingText = extractedColors.length > 0
      ? `\nExtracted Style Colors: Here are some of the main hex colors found on their homepage to guide your color choice: ${extractedColors.join(", ")}.\n`
      : "";

    let crawledContext = "";
    if (homepageText) {
      crawledContext += `Homepage Content:\n"""\n${homepageText}\n"""\n\n`;
    }
    if (userFacingPages.length > 0) {
      crawledContext += `Crawled Metadata:\n`;
      userFacingPages.forEach((p: any) => {
        crawledContext += `* URL: ${p.url}\n  Title: "${p.title || ""}"\n  Description: "${p.meta_desc || ""}"\n  H1: "${p.h1 || ""}"\n`;
      });
    }

    // 4. Build comprehensive branding prompt
    const prompt = `You are a world-class branding strategist and business analyst. 
Your task is to analyze the following company details and crawled website text content to generate a comprehensive, accurate brand profile, visual identity, brand voice, and competitors.

Company Details:
- Name: "${project.brand_name || project.name}"
- Website: "${project.domain}"
- Tagline: "${project.brand_tagline || ""}"
${colorGroundingText}

Crawled Website Context:
${crawledContext}

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

    const resultText = await callLLM(prompt, 1500);
    let cleanedJson = resultText.trim();
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsedMeta: any = {};
    try {
      parsedMeta = JSON.parse(cleanedJson);
    } catch {
      const startIdx = cleanedJson.indexOf("{");
      const endIdx = cleanedJson.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          parsedMeta = JSON.parse(cleanedJson.slice(startIdx, endIdx + 1));
        } catch (e) {
          console.error("[generate-brand-summary] Failed to parse nested JSON:", e);
        }
      }
    }

    if (logoUrl && !parsedMeta.logoUrl) {
      parsedMeta.logoUrl = logoUrl;
    }

    const summary = parsedMeta.summary || "A premium and dedicated brand focused on high quality offerings.";
    const metadataBlock = `\n---\nMETADATA: ${JSON.stringify(parsedMeta)}`;
    const updatedDesc = `${summary}${metadataBlock}`;

    // 5. Update the projects table
    const updateData: any = {
      brand_description: updatedDesc,
    };
    if (parsedMeta.logoUrl) {
      updateData.brand_logo_url = parsedMeta.logoUrl;
    }

    const { error: updateErr } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ brand_description: updatedDesc });
  } catch (error: any) {
    console.error("[GenerateBrandSummary] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
