// ── Gap Detector ──────────────────────────────────────────────────────────────
// After a prompt scan run completes, reads its results, clusters brand-misses
// where competitors were mentioned, generates a content brief title + outline
// via LLM, and upserts each gap into aeo_content_gaps.
//
// Called once at the end of a scan run.  Safe to call multiple times — the
// unique index on (project_id, prompt_text) means re-runs merge/update existing
// rows rather than creating duplicates.

import { env } from "../config.js";
import { supabase } from "./supabase.js";

const BASE_URL = "https://openrouter.ai/api/v1";
const BRIEF_MODEL = "openai/gpt-4o-mini";

interface GapCluster {
  promptText: string;
  topic: string;
  competitors: string[];
  models: string[];
  missCount: number;
}

interface BriefSection {
  h2: string;
  keyPoints: string[];
}

interface Brief {
  title: string;
  outline: BriefSection[];
}

// ── Derive topic from prompt ─────────────────────────────────────────────────
function topicFromPrompt(prompt: string): string {
  return prompt
    .replace(/^(what|which|how|why|is|compare|does|can)\s+/i, "")
    .split("?")[0]
    .trim()
    .slice(0, 80);
}

// ── Score gap priority with intent weighting ────────────────────────────────
function scoreGap(competitorCount: number, modelCount: number, promptText: string = ""): number {
  const lower = promptText.toLowerCase();
  const isCommercial = /\b(best|compare|vs|pricing|cost|top|alternative|review|buy|choose)\b/i.test(lower);
  const intentBonus = isCommercial ? 20 : 5;
  return Math.min(100, competitorCount * 25 + modelCount * 15 + intentBonus);
}

function priorityFromScore(score: number): "high" | "medium" | "low" {
  if (score > 70) return "high";
  if (score > 40) return "medium";
  return "low";
}

// ── Generate content brief via LLM ──────────────────────────────────────────
async function generateBrief(
  promptText: string,
  brandName: string,
  competitors: string[],
): Promise<Brief | null> {
  if (!env.OPENROUTER_API_KEY) return null;

  const systemPrompt = `You are a senior AEO/GEO (Answer Engine Optimization) content strategist.
Given a search query where the target brand was missing and competitors were cited, generate an authoritative content brief optimized for AI search engine extraction (Perplexity, ChatGPT Search, Gemini).

Structure Requirements:
1. Every section MUST use an "Answer-First" H2 heading that directly addresses the user question in the first 2 sentences.
2. Include explicit JSON-LD FAQ schema markup recommendations.
3. Highlight unique brand differentiators and authoritative data benchmarks.

Return ONLY valid JSON with this exact shape:
{
  "title": "<SEO/AEO-optimised article title, max 90 chars>",
  "outline": [
    { "h2": "<Answer-First section heading>", "keyPoints": ["<point 1>", "<point 2>"] },
    { "h2": "<Answer-First section heading>", "keyPoints": ["<point 1>", "<point 2>"] },
    { "h2": "<FAQ & JSON-LD Schema section>", "keyPoints": ["<point 1>", "<point 2>"] }
  ]
}`;

  const userPrompt = `Brand: ${brandName}
Competing brands cited: ${competitors.join(", ")}
Gap query: "${promptText}"`;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://solospider.ai",
        "X-Title": "SoloSpider GapDetector",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        model: BRIEF_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned) as Brief;

    if (
      typeof parsed.title === "string" &&
      Array.isArray(parsed.outline) &&
      parsed.outline.length > 0
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Fallback brief (no LLM call) ─────────────────────────────────────────────
function fallbackBrief(promptText: string, brandName: string): Brief {
  const title =
    promptText
      .replace(/^compare\s+/i, "The Ultimate Guide to ")
      .replace(/\bvs\b/gi, "and")
      .replace(/^which is better for\s+/i, "Why You Should Choose ")
      .trim() + " in 2026";

  return {
    title: title.slice(0, 120),
    outline: [
      {
        h2: "Why conversational AI engines favour structured authority",
        keyPoints: ["Cite specific benchmarks and data points", "Link to primary research sources"],
      },
      {
        h2: `${brandName} vs the competition — feature comparison`,
        keyPoints: ["Create a visual comparison matrix", "Highlight unique differentiators"],
      },
      {
        h2: "Implementation guide and AEO optimisation checklist",
        keyPoints: ["Add FAQPage JSON-LD schema", "Structure content with answer-first H2s"],
      },
    ],
  };
}

// ── Check whether crawled pages already cover this gap ──────────────────────
async function contentExists(projectId: string, promptText: string): Promise<boolean> {
  const keywords = promptText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 5);

  if (!keywords.length) return false;

  // Build an OR filter across title + url using ilike
  const filters = keywords.map(k => `title.ilike.%${k}%,url.ilike.%${k}%`).join(",");
  const { data } = await supabase
    .from("crawled_pages")
    .select("id")
    .eq("project_id", projectId)
    .or(filters)
    .limit(1);

  return Boolean(data && data.length > 0);
}

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * Reads all scan results for a completed run, clusters brand-misses where
 * competitors were cited, generates AI content briefs, and upserts rows into
 * aeo_content_gaps.
 */
export async function persistGapsForRun(
  projectId: string,
  runId: string,
  brandName: string,
): Promise<{ gaps_upserted: number }> {
  // 1. Load scan results for this run that missed the brand but cited competitors
  const { data: results, error } = await supabase
    .from("prompt_scan_results")
    .select("prompt_text, model, brand_mentioned, competitors_mentioned")
    .eq("project_id", projectId)
    .eq("status", "success")
    .eq("brand_mentioned", false)
    .not("competitors_mentioned", "eq", "{}");

  if (error) {
    console.warn(`[GapDetector] Failed to load results: ${error.message}`);
    return { gaps_upserted: 0 };
  }

  if (!results || results.length === 0) {
    console.log("[GapDetector] No brand-miss results with competitor mentions — nothing to persist.");
    return { gaps_upserted: 0 };
  }

  // 2. Cluster by prompt_text
  const clusterMap = new Map<string, GapCluster>();
  for (const row of results) {
    const competitors: string[] = Array.isArray(row.competitors_mentioned)
      ? row.competitors_mentioned
      : [];
    if (!competitors.length) continue;

    const existing = clusterMap.get(row.prompt_text) ?? {
      promptText: row.prompt_text,
      topic: topicFromPrompt(row.prompt_text),
      competitors: [] as string[],
      models: [] as string[],
      missCount: 0,
    };
    existing.competitors = Array.from(new Set([...existing.competitors, ...competitors]));
    if (!existing.models.includes(row.model)) existing.models.push(row.model);
    existing.missCount += 1;
    clusterMap.set(row.prompt_text, existing);
  }

  const clusters = Array.from(clusterMap.values());
  console.log(`[GapDetector] ${clusters.length} gap cluster(s) found for run ${runId}`);

  let upserted = 0;

  for (const cluster of clusters) {
    const score = scoreGap(cluster.competitors.length, cluster.models.length, cluster.promptText);
    const priority = priorityFromScore(score);
    const exists = await contentExists(projectId, cluster.promptText);

    // Generate brief — try LLM first, fall back to template
    let brief: Brief;
    try {
      const llmBrief = await generateBrief(cluster.promptText, brandName, cluster.competitors);
      brief = llmBrief ?? fallbackBrief(cluster.promptText, brandName);
    } catch {
      brief = fallbackBrief(cluster.promptText, brandName);
    }

    const { error: upsertErr } = await supabase
      .from("aeo_content_gaps")
      .upsert(
        {
          project_id:       projectId,
          prompt_text:      cluster.promptText,
          topic:            cluster.topic,
          competitors:      cluster.competitors,
          models:           cluster.models,
          score,
          priority,
          content_exists:   exists,
          brief_title:      brief.title,
          brief_outline:    brief.outline,
          scan_run_id:      runId,
          miss_count:       cluster.missCount,
          last_detected_at: new Date().toISOString(),
        },
        {
          onConflict: "project_id,prompt_text",
          // On duplicate: accumulate miss_count, refresh everything else
        } as any,
      );

    if (upsertErr) {
      console.warn(`[GapDetector] Upsert error for "${cluster.promptText.slice(0, 60)}": ${upsertErr.message}`);
    } else {
      upserted++;
    }
  }

  console.log(`[GapDetector] Upserted ${upserted} gap(s) for run ${runId}`);
  return { gaps_upserted: upserted };
}
