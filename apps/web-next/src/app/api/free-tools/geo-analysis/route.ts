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

    // Check for Privacy Policy
    const hasPrivacyPolicy = /href="[^"]*privacy[^"]*"/i.test(html) || /privacy policy/i.test(html);

    // Check for Terms of Service
    const hasTermsOfService = /href="[^"]*(terms|tos|terms-of-service)[^"]*"/i.test(html) || /terms of service|terms & conditions/i.test(html);

    // Check for Schema Organization
    const hasOrganizationSchema = /type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"Organization"[\s\S]*?<\/script>/i.test(html) ||
                                  /type="application\/ld\+json"[^>]*>[\s\S]*?"Organization"[\s\S]*?<\/script>/i.test(html);

    // Check for Twitter Card
    const hasTwitterCard = /<meta[^>]*(name|property)="twitter:card"/i.test(html) || /name="twitter:/i.test(html);

    // Check for Copyright
    const hasCopyright = /(©|copyright)/i.test(html);

    // Check for Contact Details
    const hasContactDetails = /href="mailto:/i.test(html) || /href="tel:/i.test(html) || /contact us|contact details/i.test(html) || /href="[^"]*contact[^"]*"/i.test(html);

    // Check for Internal Links
    const linkMatches = html.match(/href="([^"]*)"/gi) || [];
    let internalLinksCount = 0;
    linkMatches.forEach((linkStr) => {
      const match = linkStr.match(/href="([^"]*)"/i);
      if (match && match[1]) {
        const href = match[1];
        if (href.startsWith("/") || href.includes(hostname)) {
          internalLinksCount++;
        }
      }
    });

    // Check social & GEO Platforms
    const hasG2 = /g2\.com/i.test(html);
    const hasReddit = /reddit\.com/i.test(html);
    const hasCapterra = /capterra\.com/i.test(html);
    const hasLinkedIn = /linkedin\.com/i.test(html);
    const hasCrunchbase = /crunchbase\.com/i.test(html);
    const hasTrustPilot = /trustpilot\.com/i.test(html);
    const hasX = /(twitter\.com|x\.com)/i.test(html);
    const hasYouTube = /youtube\.com/i.test(html);

    const checklist = {
      ssl: isSsl,
      privacyPolicy: hasPrivacyPolicy,
      termsOfService: hasTermsOfService,
      organizationSchema: hasOrganizationSchema,
      twitterCard: hasTwitterCard,
      copyright: hasCopyright,
      contactDetails: hasContactDetails,
      internalLinks: internalLinksCount > 3,
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
- Privacy Policy Page: ${checklist.privacyPolicy}
- Terms of Service Page: ${checklist.termsOfService}
- Organization Schema: ${checklist.organizationSchema}
- Twitter Card Meta: ${checklist.twitterCard}
- Copyright Notice: ${checklist.copyright}
- Contact Details: ${checklist.contactDetails}
- Solid Internal Links: ${checklist.internalLinks}
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

${crawlFailed ? `IMPORTANT NOTE: The crawler was blocked or unable to reach the page. Please evaluate the brand/website "${hostname}" using your general knowledge of this brand and its digital presence. If you do not know this specific brand, generate plausible rating points based on standard industry expectations for this domain.` : ""}

INSTRUCTIONS:
Calculate a score from 0 to 100 for each of the 4 categories (Experience, Expertise, Authority, Trust) based on the content quality and technical checklist.
Also, output the corrected/final technical checklist based on your general knowledge of this brand and website footprint. If the crawler failed or was blocked (crawlFailed=${crawlFailed}), use your knowledge of the brand "${hostname}" to fill in the checklist.

Return ONLY a valid JSON object matching this schema (do not include markdown syntax outside of the JSON block):
{
  "checklist": {
    "ssl": boolean,
    "privacyPolicy": boolean,
    "termsOfService": boolean,
    "organizationSchema": boolean,
    "twitterCard": boolean,
    "copyright": boolean,
    "contactDetails": boolean,
    "internalLinks": boolean,
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
