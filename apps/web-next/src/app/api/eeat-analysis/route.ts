import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60; // Allow enough time for deep multi-page crawl + LLM

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // 1. Normalize URL
    let normalizedUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let hostname = "";
    try {
      hostname = new URL(normalizedUrl).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`[EEAT Scraper v2] Deep analyzing domain: ${hostname} (URL: ${normalizedUrl})`);

    // Helper fetch with timeout & realistic desktop browser headers
    const fetchPage = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(id);
        if (!response.ok) return "";
        return await response.text();
      } catch {
        clearTimeout(id);
        return "";
      }
    };

    // 2. Multi-Page Crawl (Homepage + Subpages)
    let homeHtml = await fetchPage(normalizedUrl);
    let isSsl = normalizedUrl.startsWith("https://");

    if (!homeHtml && normalizedUrl.startsWith("https://")) {
      const fallbackUrl = normalizedUrl.replace("https://", "http://");
      homeHtml = await fetchPage(fallbackUrl);
      if (homeHtml) isSsl = false;
    }

    // Extract inner subpage links from homepage HTML to perform multi-page audit
    const subpageHtmls: string[] = [];
    const linkMatches = homeHtml.match(/href=["']([^"']+)["']/gi) || [];
    const targetSubPaths = ["about", "contact", "privacy", "terms", "team", "company", "locations", "products", "services"];

    const subUrlsToFetch = new Set<string>();
    for (const hrefAttr of linkMatches) {
      const match = hrefAttr.match(/href=["']([^"']+)["']/i);
      if (!match) continue;
      const href = match[1];
      if (targetSubPaths.some((path) => href.toLowerCase().includes(path))) {
        try {
          const absUrl = new URL(href, normalizedUrl).toString();
          if (absUrl.includes(hostname)) subUrlsToFetch.add(absUrl);
        } catch {}
      }
    }

    // Fetch up to 4 relevant subpages in parallel to ensure 100% signal extraction
    const fetchedSubpages = await Promise.all(
      Array.from(subUrlsToFetch).slice(0, 4).map((url) => fetchPage(url))
    );

    const combinedHtml = [homeHtml, ...fetchedSubpages].join("\n");
    const lowerCombined = combinedHtml.toLowerCase();

    // 3. Robust Ground-Truth Technical Signal Audit
    const hasAboutUs =
      /href="[^"]*(about|about-us|aboutus|company|who-we-are)[^"]*"/i.test(combinedHtml) ||
      /about us|who we are|our story|company history/i.test(combinedHtml);

    const hasContactDetails =
      /href="mailto:/i.test(combinedHtml) ||
      /href="tel:/i.test(combinedHtml) ||
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(combinedHtml) ||
      /contact us|get in touch|reach out|contact details|\+1\s*\d|\(\d{3}\)/i.test(combinedHtml) ||
      /href="[^"]*contact[^"]*"/i.test(combinedHtml);

    const hasOrganizationSchema =
      /type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"(Organization|Corporation|LocalBusiness|Brand|Manufacturer|Product)"/i.test(combinedHtml) ||
      /schema\.org\/(Organization|Corporation|LocalBusiness|Brand|Manufacturer|Product)/i.test(combinedHtml) ||
      /application\/ld\+json/i.test(combinedHtml);

    const hasSocialLinks =
      /(facebook\.com|instagram\.com|linkedin\.com|pinterest\.com|tiktok\.com|youtube\.com|twitter\.com|x\.com)\/[a-zA-Z0-9_-]+/i.test(combinedHtml) ||
      /linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com/i.test(combinedHtml);

    const hasG2 = /g2\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml);
    const hasReddit = /reddit\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml);
    const hasCapterra = /capterra\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml);
    const hasLinkedIn =
      /linkedin\.com\/(company|school|in|pub)\/[a-zA-Z0-9_-]+/i.test(combinedHtml) ||
      /linkedin\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml) ||
      /linkedin\.com/i.test(combinedHtml);
    const hasCrunchbase = /crunchbase\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml);
    const hasTrustPilot = /trustpilot\.com\/[a-zA-Z0-9_-]+/i.test(combinedHtml);
    const hasX =
      /(twitter\.com|x\.com)\/[a-zA-Z0-9_-]+/i.test(combinedHtml) ||
      /twitter\.com|x\.com/i.test(combinedHtml);
    const hasYouTube =
      /(youtube\.com|youtu\.be)\/[a-zA-Z0-9_-]+/i.test(combinedHtml) ||
      /youtube\.com/i.test(combinedHtml);

    // Determine Industry Type for Adaptive Checklist
    let industryCategory: "software_saas" | "hardware_manufacturing" | "ecommerce_retail" | "general" = "general";
    if (/software|saas|app|platform|api|cloud|downloads/i.test(lowerCombined)) {
      industryCategory = "software_saas";
    } else if (/hardware|manufactur|architectural|door|machin|industrial|factory|engineering/i.test(lowerCombined)) {
      industryCategory = "hardware_manufacturing";
    } else if (/cart|shop|checkout|store|price|buy/i.test(lowerCombined)) {
      industryCategory = "ecommerce_retail";
    }

    const checklist = {
      ssl: isSsl,
      aboutUs: hasAboutUs,
      contactDetails: hasContactDetails,
      socialLinks: hasSocialLinks,
      organizationSchema: hasOrganizationSchema,
      g2: industryCategory === "software_saas" ? hasG2 : true, // Omit G2 penalty for non-software sites
      reddit: hasReddit,
      capterra: industryCategory === "software_saas" ? hasCapterra : true, // Omit Capterra penalty for non-software sites
      linkedin: hasLinkedIn,
      crunchbase: hasCrunchbase,
      trustpilot: hasTrustPilot,
      x: hasX,
      youtube: hasYouTube,
    };

    // 4. Extract Key Metadata & Text for LLM
    const titleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : hostname;

    const metaDescMatch =
      homeHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
      homeHtml.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
    const pageDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

    const headings: string[] = [];
    const headingMatches = homeHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || [];
    headingMatches.slice(0, 15).forEach((h) => {
      const cleanH = h.replace(/<[^>]*>/g, "").trim();
      if (cleanH) headings.push(cleanH);
    });

    const cleanSnippet = combinedHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 4000);

    // 5. OpenRouter LLM Evaluation
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      throw new Error("OpenRouter API key is missing");
    }

    const systemPrompt = `You are an expert Google Search Quality Rater auditing a domain for EEAT (Experience, Expertise, Authoritativeness, Trustworthiness).

VERIFIED TECHNICAL CHECKS FOR DOMAIN "${hostname}":
- SSL Active: ${checklist.ssl}
- About Us Page Present: ${checklist.aboutUs}
- Contact Info (Phone/Email/Form): ${checklist.contactDetails}
- Social Media Links Present: ${checklist.socialLinks}
- Schema JSON-LD Present: ${checklist.organizationSchema}
- Social Profiles Found: LinkedIn=${checklist.linkedin}, YouTube=${checklist.youtube}, Twitter/X=${checklist.x}, Trustpilot=${checklist.trustpilot}
- Industry Category: ${industryCategory}

WEBSITE CONTENT DETAILS:
- Title: ${pageTitle}
- Meta Description: ${pageDescription}
- Key Headings: ${headings.join(" | ")}
- Content Text Snippet: "${cleanSnippet}"

CRITICAL AUDIT INSTRUCTIONS:
1. Maintain 100% accuracy to the verified technical checks above. If About Us, Contact Details, or Social Profiles are true, do NOT fail them.
2. Evaluate exactly 6 check questions for each category:
   - Experience: 1. Personal experience narration, 2. Original photos/videos/specs, 3. Practical lessons/advice, 4. Case studies/testimonials, 5. Active subject participation, 6. Relevant topic experience.
   - Expertise: 1. Technical knowledge & terminology, 2. Spec sheets/guides, 3. Structured content, 4. Cites authoritative sources, 5. Detailed methodologies, 6. Factual accuracy.
   - Authority: 1. Industry recognition, 2. Expert recommendations, 3. Long-standing reputation/years in business, 4. Customer/institutional following, 5. Official partnerships, 6. Established brand name.
   - Trust: 1. Transparent mission, 2. No conflicts of interest, 3. Accurate pricing/info, 4. Accessible contact/privacy, 5. Secure HTTPS & design, 6. Honest content.
3. For each category:
   - Calculate passedCount = length of 'working' array (max 6).
   - Calculate score = Math.round((passedCount / 6) * 100).
   - Set totalCount = 6.
   - Set status = passedCount <= 1 ? "Poor" : passedCount <= 3 ? "Needs Work" : "Good".

Return ONLY a valid JSON object matching this schema:
{
  "checklist": {
    "ssl": boolean,
    "aboutUs": boolean,
    "contactDetails": boolean,
    "socialLinks": boolean,
    "organizationSchema": boolean,
    "g2": boolean,
    "reddit": boolean,
    "capterra": boolean,
    "linkedin": boolean,
    "crunchbase": boolean,
    "trustpilot": boolean,
    "x": boolean,
    "youtube": boolean
  },
  "scores": {
    "experience": number,
    "expertise": number,
    "authority": number,
    "trust": number
  },
  "categories": {
    "experience": { "score": number, "passedCount": number, "totalCount": 6, "status": "Poor"|"Needs Work"|"Good", "working": [{"question": string, "details": string}], "missing": [{"question": string, "details": string}], "improve": [string] },
    "expertise": { "score": number, "passedCount": number, "totalCount": 6, "status": "Poor"|"Needs Work"|"Good", "working": [{"question": string, "details": string}], "missing": [{"question": string, "details": string}], "improve": [string] },
    "authority": { "score": number, "passedCount": number, "totalCount": 6, "status": "Poor"|"Needs Work"|"Good", "working": [{"question": string, "details": string}], "missing": [{"question": string, "details": string}], "improve": [string] },
    "trust": { "score": number, "passedCount": number, "totalCount": 6, "status": "Poor"|"Needs Work"|"Good", "working": [{"question": string, "details": string}], "missing": [{"question": string, "details": string}], "improve": [string] }
  }
}`;

    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://solospider.ai",
        "X-Title": "SoloSpider EEAT Analyzer",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.1,
      }),
    });

    if (!llmRes.ok) {
      throw new Error(`OpenRouter request failed with code ${llmRes.status}`);
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content?.trim() || "";

    const cleanJson = rawContent.replace(/```json/i, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // Override checklist with node-verified ground truth for 100% accuracy
    parsedData.checklist = {
      ...checklist,
      ...(parsedData.checklist || {}),
      ssl: isSsl,
      aboutUs: hasAboutUs,
      contactDetails: hasContactDetails,
      socialLinks: hasSocialLinks,
      linkedin: hasLinkedIn,
      x: hasX,
      youtube: hasYouTube,
    };

    // Calculate deterministic scores
    const categoryKeys = ["experience", "expertise", "authority", "trust"] as const;
    for (const key of categoryKeys) {
      if (parsedData.categories?.[key]) {
        const cat = parsedData.categories[key];
        const passed = cat.working ? cat.working.length : 0;
        cat.passedCount = passed;
        cat.totalCount = 6;
        cat.score = Math.round((passed / 6) * 100);
        cat.status = passed <= 1 ? "Poor" : passed <= 3 ? "Needs Work" : "Good";
        if (parsedData.scores) parsedData.scores[key] = cat.score;
      }
    }

    return NextResponse.json({
      domain: hostname,
      url: normalizedUrl,
      industryCategory,
      analysis: parsedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[EEAT Scraper Error]:", error);
    return NextResponse.json({ error: error.message || "EEAT Analysis failed" }, { status: 500 });
  }
}
