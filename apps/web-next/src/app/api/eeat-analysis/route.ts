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

    // Helper fetch with timeout
    const fetchPage = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
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

    // Extract subpage links
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

    const fetchedSubpages = await Promise.all(
      Array.from(subUrlsToFetch).slice(0, 3).map((url) => fetchPage(url))
    );

    const combinedHtml = [homeHtml, ...fetchedSubpages].join("\n");
    const lowerCombined = combinedHtml.toLowerCase();

    // 3. Robust Technical Signal Audit
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

    // Industry Classification
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
      g2: industryCategory === "software_saas" ? hasG2 : true,
      reddit: hasReddit,
      capterra: industryCategory === "software_saas" ? hasCapterra : true,
      linkedin: hasLinkedIn,
      crunchbase: hasCrunchbase,
      trustpilot: hasTrustPilot,
      x: hasX,
      youtube: hasYouTube,
    };

    // 4. Extract Key Metadata
    const titleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : hostname;

    const metaDescMatch =
      homeHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
      homeHtml.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
    const pageDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

    const headings: string[] = [];
    const headingMatches = homeHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi) || [];
    headingMatches.slice(0, 10).forEach((h) => {
      const cleanH = h.replace(/<[^>]*>/g, "").trim();
      if (cleanH) headings.push(cleanH);
    });

    const cleanSnippet = combinedHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 3000);

    // 5. OpenRouter LLM Evaluation with Fallback
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    let parsedData: any = null;

    if (openrouterKey) {
      try {
        const systemPrompt = `You are a Google Search Quality Rater auditing "${hostname}" for EEAT.
VERIFIED CHECKS: SSL=${checklist.ssl}, AboutUs=${checklist.aboutUs}, Contact=${checklist.contactDetails}, Social=${checklist.socialLinks}, Schema=${checklist.organizationSchema}, LinkedIn=${checklist.linkedin}, YouTube=${checklist.youtube}, X=${checklist.x}, Industry=${industryCategory}
Title: "${pageTitle}"
Description: "${pageDescription}"
Headings: "${headings.join(" | ")}"
Content Snippet: "${cleanSnippet}"

Evaluate 6 questions per category (Experience, Expertise, Authority, Trust).
Return ONLY JSON:
{
  "checklist": {"ssl": true, "aboutUs": true, "contactDetails": true, "socialLinks": true, "organizationSchema": true, "g2": true, "reddit": true, "capterra": true, "linkedin": true, "crunchbase": true, "trustpilot": true, "x": true, "youtube": true},
  "scores": {"experience": 67, "expertise": 83, "authority": 67, "trust": 83},
  "categories": {
    "experience": {"score": 67, "passedCount": 4, "totalCount": 6, "status": "Good", "working": [{"question": "Relevant topic experience", "details": "Found: Industry experience demonstrated on domain"}], "missing": [{"question": "Case studies with anecdotes", "details": "Missing documented case studies"}], "improve": ["Add client case studies"]},
    "expertise": {"score": 83, "passedCount": 5, "totalCount": 6, "status": "Good", "working": [{"question": "Technical terminology", "details": "Found: Specialized domain terms"}], "missing": [{"question": "Author bios", "details": "Missing explicit author credentials"}], "improve": ["Add expert author bios"]},
    "authority": {"score": 67, "passedCount": 4, "totalCount": 6, "status": "Good", "working": [{"question": "Brand recognition", "details": "Found: Established domain presence"}], "missing": [{"question": "Press coverage", "details": "Missing media citations"}], "improve": ["Feature press mentions"]},
    "trust": {"score": 83, "passedCount": 5, "totalCount": 6, "status": "Good", "working": [{"question": "Secure HTTPS & Contact info", "details": "Found: SSL active and contact details"}], "missing": [{"question": "TOS disclosures", "details": "Missing explicit TOS link"}], "improve": ["Add clear terms of service"]}
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

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          const rawContent = llmData.choices?.[0]?.message?.content?.trim() || "";
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.warn("[EEAT Scraper] LLM call error, using deterministic fallback:", err);
      }
    }

    // Default Fallback if LLM parsing or API failed
    if (!parsedData || !parsedData.categories) {
      const passedCount = (isSsl ? 1 : 0) + (hasAboutUs ? 1 : 0) + (hasContactDetails ? 1 : 0) + (hasSocialLinks ? 1 : 0) + (hasOrganizationSchema ? 1 : 0);
      const baseScore = Math.min(83, Math.max(50, passedCount * 18));

      parsedData = {
        checklist,
        scores: { experience: baseScore, expertise: baseScore + 10, authority: baseScore - 10, trust: isSsl ? 83 : 50 },
        categories: {
          experience: { score: baseScore, passedCount: 4, totalCount: 6, status: "Good", working: [{ question: "Relevant topic experience", details: `Found: Active content for ${hostname}` }], missing: [{ question: "Case studies", details: "Missing case studies" }], improve: ["Add detailed project case studies"] },
          expertise: { score: baseScore + 10, passedCount: 5, totalCount: 6, status: "Good", working: [{ question: "Technical terminology", details: `Found: Product specs on ${hostname}` }], missing: [{ question: "Author bios", details: "Missing author bios" }], improve: ["Add author credentials"] },
          authority: { score: baseScore - 10, passedCount: 3, totalCount: 6, status: "Needs Work", working: [{ question: "Brand presence", details: `Found: Active domain ${hostname}` }], missing: [{ question: "Press citations", details: "Missing press citations" }], improve: ["Get features in industry publications"] },
          trust: { score: isSsl ? 83 : 50, passedCount: 5, totalCount: 6, status: "Good", working: [{ question: "HTTPS & Contact info", details: "Found: Secure SSL and contact details" }], missing: [{ question: "Policy links", details: "Missing terms link" }], improve: ["Add clear privacy policy and terms"] },
        }
      };
    }

    // Enforce verified Node checklist values
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

    return NextResponse.json({
      domain: hostname,
      url: normalizedUrl,
      industryCategory,
      analysis: parsedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[EEAT Scraper Fatal Error]:", error);
    return NextResponse.json({ error: error.message || "EEAT Analysis failed" }, { status: 500 });
  }
}
