import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60; // Allow enough time for crawling + LLM

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // 1. Normalize the URL
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

    console.log(`[GEO Scraper] Analyzing domain: ${hostname} (URL: ${normalizedUrl})`);

    // 2. Fetch page HTML
    let html = "";
    let isSsl = normalizedUrl.startsWith("https://");
    let crawlFailed = false;

    // Helper fetch with 10-second timeout
    const fetchWithTimeout = async (url: string, options: any = {}) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    try {
      const res = await fetchWithTimeout(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SoloSpiderGEOAnalyzer/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!res.ok) {
        console.warn(`[GEO Scraper] Crawl returned non-200 code: ${res.status}`);
      }
      html = await res.text();
    } catch (crawlErr: any) {
      console.error(`[GEO Scraper] Scraping failed for ${normalizedUrl}:`, crawlErr);
      // Fallback: If https failed, try http
      if (normalizedUrl.startsWith("https://")) {
        try {
          const fallbackUrl = normalizedUrl.replace("https://", "http://");
          const res = await fetchWithTimeout(fallbackUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          html = await res.text();
          isSsl = false;
        } catch (fallbackErr) {
          console.error(`[GEO Scraper] Fallback HTTP failed:`, fallbackErr);
          crawlFailed = true;
        }
      } else {
        crawlFailed = true;
      }
    }

    if (crawlFailed) {
      console.warn(`[GEO Scraper] Both HTTPS and HTTP failed for ${normalizedUrl}. Falling back to general LLM brand knowledge.`);
      html = `
        <html>
          <head>
            <title>${hostname}</title>
            <meta name="description" content="AI evaluation placeholder for ${hostname}">
          </head>
          <body>
            <h1>${hostname}</h1>
            <p>Evaluating ${hostname} based on brand presence.</p>
          </body>
        </html>
      `;
    }

    // 3. Technical Checklist Audit (regex-based)
    const lowerHtml = html.toLowerCase();

    // Check for About Us Page
    const hasAboutUs = /href="[^"]*(about|about-us|aboutus)[^"]*"/i.test(html) || /about us/i.test(html);

    // Check for Contact Details
    const hasContactDetails = /href="mailto:/i.test(html) || /href="tel:/i.test(html) || /contact us|contact details/i.test(html) || /href="[^"]*contact[^"]*"/i.test(html);

    // Check for Schema Organization
    const hasOrganizationSchema = /type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"Organization"[\s\S]*?<\/script>/i.test(html) ||
                                  /type="application\/ld\+json"[^>]*>[\s\S]*?"Organization"[\s\S]*?<\/script>/i.test(html);

    // Check for general Social Links (Facebook, Instagram, etc. excluding GEO platforms which are checked separately)
    const hasSocialLinks = /(facebook\.com|instagram\.com|pinterest\.com|tiktok\.com)\/[a-zA-Z0-9_-]+/i.test(html);

    // Check social & GEO Platforms (refined to require profile/channel slugs and exclude sharing endpoints)
    const hasG2 = /g2\.com\/products\/[a-zA-Z0-9_-]+/i.test(html);
    const hasReddit = /reddit\.com\/(r|user|u)\/[a-zA-Z0-9_-]+/i.test(html);
    const hasCapterra = /capterra\.com\/p\/[a-zA-Z0-9_-]+/i.test(html);
    const hasLinkedIn = /linkedin\.com\/(company|in|showcase)\/[a-zA-Z0-9_-]+/i.test(html);
    const hasCrunchbase = /crunchbase\.com\/(organization|person)\/[a-zA-Z0-9_-]+/i.test(html);
    const hasTrustPilot = /trustpilot\.com\/review\/[a-zA-Z0-9_-]+/i.test(html);
    const hasX = /(twitter\.com|x\.com)\/(?!(share|intent|tweet|widgets))[a-zA-Z0-9_]{1,15}/i.test(html);
    const hasYouTube = /youtube\.com\/(channel|c|user|@|show)\/[a-zA-Z0-9_-]+/i.test(html) || /youtu\.be\//i.test(html);

    const checklist = {
      ssl: isSsl,
      aboutUs: hasAboutUs,
      contactDetails: hasContactDetails,
      socialLinks: hasSocialLinks,
      organizationSchema: hasOrganizationSchema,
      g2: hasG2,
      reddit: hasReddit,
      capterra: hasCapterra,
      linkedin: hasLinkedIn,
      crunchbase: hasCrunchbase,
      trustpilot: hasTrustPilot,
      x: hasX,
      youtube: hasYouTube,
    };

    // 4. Content Extract for LLM
    // Extract title, description, and visible heading tags
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : hostname;

    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                         html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
    const pageDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

    // Extract headings
    const headings: string[] = [];
    const headingMatches = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || [];
    headingMatches.slice(0, 10).forEach((h) => {
      const cleanH = h.replace(/<[^>]*>/g, "").trim();
      if (cleanH) headings.push(cleanH);
    });

    // Extract raw text lines (first 3000 chars)
    const rawText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 3000);

    // 5. OpenRouter LLM Call
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      throw new Error("OpenRouter API key is missing");
    }

    const systemPrompt = `You are a Google Search Quality Rater and GEO (Generative Engine Optimization) expert.
Evaluate the following website details and text content against Google's official E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines.

CRAWLER DETECTED CHECKLIST (INITIAL ESTIMATES):
- SSL Active: ${checklist.ssl}
- About Us Page: ${checklist.aboutUs}
- Contact Details: ${checklist.contactDetails}
- Social Links: ${checklist.socialLinks}
- Organization Schema: ${checklist.organizationSchema}
- GEO Platform references linked:
  * G2: ${checklist.g2}
  * Reddit: ${checklist.reddit}
  * Capterra: ${checklist.capterra}
  * LinkedIn: ${checklist.linkedin}
  * Crunchbase: ${checklist.crunchbase}
  * Trustpilot: ${checklist.trustpilot}
  * X (Twitter): ${checklist.x}
  * YouTube: ${checklist.youtube}

WEBSITE METADATA:
- Title: ${pageTitle}
- Description: ${pageDescription}
- Main Headings: ${headings.join(" | ")}
- Home Content Snippet: "${rawText}"

${crawlFailed ? `IMPORTANT NOTE: The crawler was blocked or unable to reach the page. Please evaluate the brand/website "${hostname}" using your general knowledge of this brand and its digital presence. If you do not know this specific brand, generate plausible rating points based on standard industry expectations for this domain.` : `NOTE: The crawled HTML was ${html.length} characters long. ${html.length < 5000 ? "This is quite short, indicating the site likely uses client-side rendering (React/Next.js/SPA). The content above may not represent the full site. Use your knowledge of this brand/domain to supplement." : "This appears to be a server-rendered page with substantial content."}`}

INSTRUCTIONS:
Calculate a score from 0 to 100 for each of the 4 categories (Experience, Expertise, Authority, Trust) based on the content quality and technical checklist.
Also, output the corrected/final technical checklist. 

IMPORTANT CONTEXT: The HTML snippet provided is only a partial server-side fetch (not a full browser render). Many modern sites use client-side rendering (React, Next.js, Angular) so the snippet may be minimal even for large, legitimate websites. DO NOT penalize a site just because the crawled snippet is short. Instead, ALWAYS combine the crawled data with your own knowledge of the brand/domain.

SCORING GUIDELINES:
1. Experience (0-100): Measures firsthand, real-world experience signals.
   - Consider: Does the brand/site operate a real product or service? Do they have user reviews, testimonials, case studies, original photos, or real-world usage evidence?
   - If you recognize this as a real operating business/service (e.g. e-commerce, SaaS, food delivery, etc.), start at 65-75 and adjust based on the depth of experience signals.
   - Only score below 40 if the site appears to be purely template/placeholder content with zero evidence of real operation.

2. Expertise (0-100): Measures demonstrated knowledge and qualifications.
   - Consider: Does the site show subject-matter depth? Are there detailed product descriptions, technical documentation, blog posts, About Us pages with team credentials, or industry-specific content?
   - If the site has an About Us page (aboutUs=true) with team/company info, start at 65+.
   - If the site shows clear domain specialization (e.g. a food delivery platform showing restaurant menus, a SaaS showing feature docs), score 70+.
   - Only score below 40 for sites with zero content depth and no About page.

3. Authoritativeness (0-100): Measures external recognition, reputation, and brand footprint.
   - Base the score primarily on the number of verified external platform presences:
     * Each present platform (LinkedIn, X, YouTube, Crunchbase, G2, Capterra, Trustpilot, Reddit) adds roughly 8-12 points.
     * Organization schema adds 5-10 points.
   - A site with 0 external profiles should score 15-25.
   - A site with 3-4 profiles should score 50-70.
   - A site with 5+ profiles should score 75-95.
   - If you recognize this as a well-known brand (nationally/globally recognized), score at least 80 regardless of what the crawler found.

4. Trustworthiness (0-100): Measures security, transparency, and safety signals.
   - SSL (ssl=true): +10-15 points
   - About Us page: +10-15 points
   - Contact Details: +10-15 points
   - Social Links: +5-10 points
   - Organization Schema: +5-10 points
   - Privacy Policy / Terms (inferred from content): +5-10 points
   - A basic site with SSL + contact + about should score at least 55-65.
   - A well-established brand with all trust signals should score 80-95.

CRITICAL RULE FOR CHECKLIST:
- Use the crawler detections as your starting point for the checklist values.
- You MAY override crawler results to true ONLY if you have high-confidence knowledge that the brand genuinely operates that profile (e.g., you know for a fact that a company has an official LinkedIn page even though the crawler didn't find a link on their homepage).
- You MAY override crawler results to true for core items like aboutUs, contactDetails, and socialLinks if the brand is well-known and you know these exist even though the crawled HTML snippet didn't contain them.
- For completely unknown, small, or obscure sites, stick strictly to what the crawler found.

CRITICAL RULE FOR CATEGORIES:
- For each of the 4 categories (experience, expertise, authority, trust), evaluate exactly 6 specific quality signals.
- Therefore, the sum of items in the 'working' array and the 'missing' array MUST equal exactly 6 (so 'totalCount' is always exactly 6).
- 'passedCount' MUST exactly equal the length of the 'working' array.
- The 'working' items should describe specific positive signals found or known to exist.
- The 'missing' items should describe specific gaps or improvements needed.
- The 'improve' array should provide actionable recommendations.

Return ONLY a valid JSON object matching this schema (do not include markdown syntax outside of the JSON block):
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
    "experience": number (0-100),
    "expertise": number (0-100),
    "authority": number (0-100),
    "trust": number (0-100)
  },
  "categories": {
    "experience": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [string, string, ...],
      "missing": [string, string, ...],
      "improve": [string, string, ...]
    },
    "expertise": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [string, string, ...],
      "missing": [string, string, ...],
      "improve": [string, string, ...]
    },
    "authority": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [string, string, ...],
      "missing": [string, string, ...],
      "improve": [string, string, ...]
    },
    "trust": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [string, string, ...],
      "missing": [string, string, ...],
      "improve": [string, string, ...]
    }
  }
}`;

    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://solospider.ai",
        "X-Title": "SoloSpider GEO Analyzer",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.2,
      }),
    });

    if (!llmRes.ok) {
      throw new Error(`OpenRouter request failed with code ${llmRes.status}`);
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content?.trim() || "";

    // Parse JSON safely
    let parsedData;
    try {
      // Remove any markdown block syntax if LLM returns it
      const cleanJson = rawContent.replace(/```json/i, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (err) {
      console.error("[GEO Scraper] Failed to parse LLM JSON:", rawContent);
      throw new Error("Failed to generate structured E-E-A-T results.");
    }

    const finalChecklist = parsedData.checklist || checklist;
    const finalAnalysis = {
      scores: parsedData.scores,
      categories: parsedData.categories
    };

    return NextResponse.json({
      url: normalizedUrl,
      domain: hostname,
      updatedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      checklist: finalChecklist,
      analysis: finalAnalysis,
    });
  } catch (error: any) {
    console.error("[GEO Audit API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze domain" }, { status: 500 });
  }
}
