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

    console.log(`[E-E-A-T Scraper] Analyzing domain: ${hostname} (URL: ${normalizedUrl})`);

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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!res.ok) {
        console.warn(`[E-E-A-T Scraper] Crawl returned non-200 code: ${res.status}`);
        throw new Error(`Crawl returned status ${res.status}`);
      }
      html = await res.text();
    } catch (crawlErr: any) {
      console.error(`[E-E-A-T Scraper] Scraping failed for ${normalizedUrl}:`, crawlErr);
      // Fallback: If https failed, try http
      if (normalizedUrl.startsWith("https://")) {
        try {
          const fallbackUrl = normalizedUrl.replace("https://", "http://");
          const res = await fetchWithTimeout(fallbackUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
          });
          if (!res.ok) {
            throw new Error(`Fallback HTTP returned status ${res.status}`);
          }
          html = await res.text();
          isSsl = false;
        } catch (fallbackErr) {
          console.error(`[E-E-A-T Scraper] Fallback HTTP failed:`, fallbackErr);
          crawlFailed = true;
        }
      } else {
        crawlFailed = true;
      }
    }

    if (crawlFailed) {
      console.warn(`[E-E-A-T Scraper] Both HTTPS and HTTP failed for ${normalizedUrl}. Falling back to general LLM brand knowledge.`);
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
    let hasAboutUs = /href="[^"]*(about|about-us|aboutus)[^"]*"/i.test(html) || /about us/i.test(html);

    // Check for Contact Details
    let hasContactDetails = /href="mailto:/i.test(html) || /href="tel:/i.test(html) || /contact us|contact details/i.test(html) || /href="[^"]*contact[^"]*"/i.test(html);

    // Dynamic checks for client-rendered SPA sites or missing footer/header links in initial home page crawl
    if (!hasAboutUs) {
      try {
        const aboutPaths = ["/about", "/about-us", "/aboutus", "/company"];
        for (const path of aboutPaths) {
          const testUrl = new URL(path, normalizedUrl).toString();
          const testRes = await fetch(testUrl, { method: "HEAD", signal: AbortSignal.timeout(1500) }).catch(() => null);
          if (testRes && testRes.ok) {
            hasAboutUs = true;
            break;
          }
        }
      } catch {}
    }

    if (!hasContactDetails) {
      try {
        const contactPaths = ["/contact", "/contact-us", "/contactus", "/support"];
        for (const path of contactPaths) {
          const testUrl = new URL(path, normalizedUrl).toString();
          const testRes = await fetch(testUrl, { method: "HEAD", signal: AbortSignal.timeout(1500) }).catch(() => null);
          if (testRes && testRes.ok) {
            hasContactDetails = true;
            break;
          }
        }
      } catch {}
    }

    // Check for Schema Organization
    const hasOrganizationSchema = /type="application\/ld\+json"[^>]*>[\s\S]*?"@type"\s*:\s*"Organization"[\s\S]*?<\/script>/i.test(html) ||
                                  /type="application\/ld\+json"[^>]*>[\s\S]*?"Organization"[\s\S]*?<\/script>/i.test(html);

    // Check for general Social Links (Facebook, Instagram, etc. excluding GEO platforms which are checked separately)
    const hasSocialLinks = /(facebook\.com|instagram\.com|pinterest\.com|tiktok\.com)\/[a-zA-Z0-9_-]+/i.test(html);

    // Check social & GEO Platforms (relaxed to avoid false negatives on custom profile routes, e.g. linkedin.com/school/ or custom YouTube URLs)
    const hasG2 = /g2\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasReddit = /reddit\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasCapterra = /capterra\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasLinkedIn = /linkedin\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasCrunchbase = /crunchbase\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasTrustPilot = /trustpilot\.com\/[a-zA-Z0-9_-]+/i.test(html);
    const hasX = /(twitter\.com|x\.com)\/[a-zA-Z0-9_-]+/i.test(html) && !/(share|intent|tweet|widgets)/i.test(html);
    const hasYouTube = /(youtube\.com|youtu\.be)\/[a-zA-Z0-9_-]+/i.test(html);

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
      .substring(0, 2000000);

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
For each of the 4 E-E-A-T categories, evaluate 6 standard check questions and decide PASS or FAIL for each one.
Also, output the corrected/final technical checklist.

INFERENCE & EVALUATION RULES (SNOWSEO COMPATIBLE):
- Evaluate the E-E-A-T category check items by combining the crawled HTML/metadata with your general knowledge of this brand and domain.
- If you have knowledge of the brand/website (e.g., if you know the business, if it has standard social presence, or if the website content points to an active business structure), you should evaluate it realistically. Do NOT artificially fail checks if the crawled HTML is short or SPA-rendered.
- Make reasonable, fair inferences about the presence of E-E-A-T signals (e.g., if the website is a professional agency or site, it naturally possesses expertise, topic relevance, and active subject participation).

SCORING RULE:
- The score for each category is calculated automatically as: score = Math.round((passedCount / 6) * 100)
- You do NOT need to calculate the score yourself. Just set passedCount to the number of checks that passed (length of the 'working' array). Set score to 0 as a placeholder — the server will override it.
- Set status to "Poor" if passedCount <= 1, "Needs Work" if passedCount <= 3, "Good" if passedCount >= 4.

CRITICAL RULE FOR CHECKLIST:
- Use the crawler detections as your starting point, but perform full SEMANTIC analysis on the provided metadata, headings, and HTML text snippet.
- For example, if you find links, headings, or texts like "Reach to Us", "Get in Touch", "Write to Us", "Talk to Us", "Contact", "Support", or visible email addresses/phone numbers, you MUST mark contactDetails as true (PASS).
- Similarly, if you find links or texts like "Our Story", "Who We Are", "Team", "Company", or "About Us", you MUST mark aboutUs as true (PASS).
- Do not fail valid elements due to differences in phrasing or naming. If the intent or link exists semantically in the content, pass the check.
- If you have general knowledge that the brand has active social channels, profiles, or an about/contact section that the crawler might have missed due to SPA connection limits, override it to true (PASS).

CRITICAL RULE FOR CATEGORIES:
- You must evaluate exactly the following 6 standard check questions for each of the 4 categories:

  EXPERIENCE check questions:
  1. "Does it reflect first-hand experience with personal narration?"
  2. "Are original photos/videos/screenshots present?"
  3. "Does it discuss challenges faced, lessons learned, or practical advice?"
  4. "Are specific anecdotes or testimonials provided?"
  5. "Is there evidence of active participation in the subject?"
  6. "Is the experience clearly relevant to the topic?"

  EXPERTISE check questions:
  1. "Is the creator's/company's expertise explicitly mentioned?"
  2. "Does it display specialized technical knowledge and use terminology correctly?"
  3. "Is the content structured systematically and recently updated?"
  4. "Are sources cited to support claims?"
  5. "Are methodologies detailed with examples or case studies?"
  6. "Does it avoid factual errors and contribute new knowledge?"

  AUTHORITY check questions:
  1. "Is the brand widely recognized or cited by other authoritative sources?"
  2. "Is it recommended by experts or featured in reputable media?"
  3. "Does it have a long-standing reputation or evidence of awards?"
  4. "Is there a significant following, engagement, or institutional acknowledgment?"
  5. "Does it host exclusive content or have official partnerships?"
  6. "Is the name synonymous with the topic?"

  TRUST check questions:
  1. "Are unsubstantiated claims avoided with transparent purpose/mission?"
  2. "Are conflicts of interest disclosed?"
  3. "Are errors corrected transparently?"
  4. "Are contact info, privacy policies, and TOS accessible?"
  5. "Is the site secure (HTTPS) and professionally designed?"
  6. "Is the content free of hate, bias, and excessive ads?"

- For each category, distribute all 6 questions between the 'working' and 'missing' arrays depending on whether they pass or fail.
- The sum of items in the 'working' array and the 'missing' array MUST equal exactly 6 (so 'totalCount' is always exactly 6).
- 'passedCount' MUST exactly equal the length of the 'working' array.
- For 'working' items, set 'question' to the exact check question string, and set 'details' to a string starting with "Found: " followed by the positive evidence you found.
- For 'missing' items, set 'question' to the exact check question string, and set 'details' to a description of the gap or missing details.
- Provide 3-5 high-quality actionable improvement recommendations in the 'improve' array.

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
      "working": [{"question": string, "details": string}, ...],
      "missing": [{"question": string, "details": string}, ...],
      "improve": [string, ...]
    },
    "expertise": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [{"question": string, "details": string}, ...],
      "missing": [{"question": string, "details": string}, ...],
      "improve": [string, ...]
    },
    "authority": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [{"question": string, "details": string}, ...],
      "missing": [{"question": string, "details": string}, ...],
      "improve": [string, ...]
    },
    "trust": {
      "score": number,
      "passedCount": number,
      "totalCount": number,
      "status": "Poor" | "Needs Work" | "Good",
      "working": [{"question": string, "details": string}, ...],
      "missing": [{"question": string, "details": string}, ...],
      "improve": [string, ...]
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

    // Deterministic scoring: score = Math.round((passedCount / 6) * 100)
    // This matches SnowSEO's exact formula
    const categoryKeys = ["experience", "expertise", "authority", "trust"] as const;
    for (const key of categoryKeys) {
      const cat = parsedData.categories?.[key];
      if (cat) {
        const passed = Array.isArray(cat.working) ? cat.working.length : 0;
        const total = 6;
        cat.passedCount = passed;
        cat.totalCount = total;
        cat.score = Math.round((passed / total) * 100);
        cat.status = passed <= 1 ? "Poor" : passed <= 3 ? "Needs Work" : "Good";
        // Also override the top-level scores
        if (parsedData.scores) {
          parsedData.scores[key] = cat.score;
        }
      }
    }

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
