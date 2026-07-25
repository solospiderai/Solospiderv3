// ── Brand citation parser ───────────────────────────────────────────────────
// Extracts position, context, sentiment and count of brand mentions
// from an AI model response.

export interface CitationResult {
  brandMentioned:       boolean;
  mentionPosition:      number | null;   // 1-indexed sentence number
  mentionContext:       string | null;   // first sentence containing brand
  mentionSentiment:     "positive" | "negative" | "neutral" | "not_mentioned";
  mentionCount:         number;
  competitorsMentioned: string[];
}

const POSITIVE_WORDS = [
  "best", "top", "recommended", "excellent", "great", "leading",
  "trusted", "popular", "powerful", "innovative", "perfect", "outstanding",
  "industry-leading", "robust", "reliable", "comprehensive", "superior",
];

const NEGATIVE_WORDS = [
  "avoid", "bad", "poor", "limited", "expensive", "problematic",
  "disappointing", "worst", "lacking", "buggy", "unreliable", "complex",
];

export function parseCitations(
  responseText: string,
  brandName: string,
  competitors: string[] = [],
  brandDomain?: string
): CitationResult {
  if (!responseText || !brandName) {
    return {
      brandMentioned: false, mentionPosition: null, mentionContext: null,
      mentionSentiment: "not_mentioned", mentionCount: 0, competitorsMentioned: [],
    };
  }

  const lower = responseText.toLowerCase();
  const variations = new Set<string>();

  // Clean brand name if it is a URL or domain
  const cleanBrandName = brandName.toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/\/$/, "");
  
  const brandNoExt = cleanBrandName.split(".")[0];

  variations.add(brandName.toLowerCase());
  variations.add(cleanBrandName);
  variations.add(brandNoExt);
  variations.add(brandNoExt.replace(/[-_]/g, " "));

  // Specific common cases for concatenated domains (e.g. shalimarengineering -> shalimar engineering)
  if (brandNoExt === "shalimarengineering") {
    variations.add("shalimar");
    variations.add("shalimar engineering");
  }

  if (brandDomain) {
    const cleanDomain = brandDomain.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/$/, "");
    const domainNoExt = cleanDomain.split(".")[0];
    
    variations.add(cleanDomain);
    variations.add(domainNoExt);
    variations.add(domainNoExt.replace(/[-_]/g, " "));

    if (domainNoExt === "shalimarengineering") {
      variations.add("shalimar");
      variations.add("shalimar engineering");
    }
  }

  // Filter out very short variations to prevent false positives
  const activeVariations = Array.from(variations)
    .map(v => v.trim())
    .filter(v => v.length > 2);

  // Helper to check if a string contains any brand variation with word boundaries
  const matchesBrand = (str: string) => {
    const s = str.toLowerCase();
    return activeVariations.some(v => {
      // For domain names or URLs with dots, use literal boundary check; for words, use \b
      if (v.includes(".")) {
        return s.includes(v);
      }
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
      return regex.test(s);
    });
  };

  let mentionPosition: number | null = null;
  let mentionContext:  string | null  = null;

  // Split into sentences (handles . ! ? followed by whitespace or end)
  const sentences = responseText.split(/(?<=[.!?])\s+|(?<=[.!?])$/);
  for (let i = 0; i < sentences.length; i++) {
    if (matchesBrand(sentences[i])) {
      mentionPosition = i + 1;
      mentionContext  = sentences[i].trim().slice(0, 500);
      break;
    }
  }

  const brandMentioned = mentionPosition !== null;

  // Count mentions in the entire response text using activeVariations with strict boundaries
  let mentionCount = 0;
  if (brandMentioned) {
    for (const variation of activeVariations) {
      const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = variation.includes(".")
        ? new RegExp(escaped, "gi")
        : new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "gi");
      const matches = lower.match(regex);
      if (matches && matches.length > 0) {
        mentionCount = matches.length;
        break;
      }
    }
    if (mentionCount === 0) mentionCount = 1;
  }

  // Negation-aware sentiment scoring on context window
  let mentionSentiment: CitationResult["mentionSentiment"] = "not_mentioned";
  if (brandMentioned) {
    const ctx = (mentionContext ?? lower).toLowerCase();
    
    // Check for negations near positive terms (e.g. "not recommended", "not the best", "lacks features")
    const negationRegex = /\b(not|no|never|hardly|rarely|cannot|lacks|fails|without)\b(?:\s+\w+){0,3}\s+(best|top|recommended|excellent|great|leading|trusted|popular|powerful|innovative|perfect|outstanding|robust|reliable)/gi;
    const negatedPositives = (ctx.match(negationRegex) ?? []).length;

    let posScore = POSITIVE_WORDS.filter(w => new RegExp(`\\b${w}\\b`, "i").test(ctx)).length;
    let negScore = NEGATIVE_WORDS.filter(w => new RegExp(`\\b${w}\\b`, "i").test(ctx)).length;

    // Flip negated positives to negative score
    posScore = Math.max(0, posScore - negatedPositives);
    negScore += negatedPositives;

    if (posScore > negScore) mentionSentiment = "positive";
    else if (negScore > posScore) mentionSentiment = "negative";
    else mentionSentiment = "neutral";
  }

  // Which competitors are mentioned? (Use word boundaries)
  const competitorsMentioned = competitors.filter(c => {
    if (!c || c.trim().length === 0) return false;
    const cleanComp = c.trim().toLowerCase();
    const escaped = cleanComp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = cleanComp.includes(".")
      ? new RegExp(escaped, "i")
      : new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
    return regex.test(lower);
  });

  return {
    brandMentioned,
    mentionPosition,
    mentionContext,
    mentionSentiment,
    mentionCount,
    competitorsMentioned,
  };
}

export interface ExtractedCitation {
  title: string;
  url: string;
}

export function extractCitationsFromText(text: string): ExtractedCitation[] {
  if (!text) return [];
  const citations: ExtractedCitation[] = [];
  const seenUrls = new Set<string>();

  // 1. Match Markdown links [Anchor Text](URL)
  const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim().replace(/[\.\,\)\?\]\}]$/, "");
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      citations.push({ title, url });
    }
  }

  // 2. Match raw URLs
  const rawUrlRegex = /(https?:\/\/[^\s\)\"\'\>\,\u201c\u201d]+)/g;
  const rawMatches = text.match(rawUrlRegex) || [];
  for (const url of rawMatches) {
    const cleanUrl = url.trim().replace(/[\.\,\)\?\]\}]$/, "");
    if (!seenUrls.has(cleanUrl)) {
      seenUrls.add(cleanUrl);
      let domain = cleanUrl;
      try {
        domain = new URL(cleanUrl).hostname.replace(/^www\./, "");
      } catch {}
      citations.push({ title: domain, url: cleanUrl });
    }
  }

  return citations;
}
