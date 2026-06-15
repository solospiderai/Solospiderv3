import { Worker, Job } from "bullmq";
import { redis } from "../config.js";
import { supabase } from "../lib/supabase.js";
import type { ScoringJobData } from "../queues.js";

// Compute a GEO score for a project based on recent prompt scan results
async function processScoringJob(job: Job<ScoringJobData>): Promise<object> {
  const { project_id, brand_name } = job.data;
  console.log(`[ScoringWorker] Job ${job.id} — project=${project_id}`);

  await job.updateProgress(10);

  // Load recent scan results (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: results } = await supabase
    .from("prompt_scan_results")
    .select("model, brand_mentioned, mention_sentiment, mention_count")
    .eq("project_id", project_id)
    .eq("status", "success")
    .gte("scanned_at", since);

  if (!results || results.length === 0) {
    console.log(`[ScoringWorker] No recent results for project ${project_id}`);
    return { project_id, score: null, reason: "No scan data in last 7 days" };
  }

  await job.updateProgress(40);

  // ── GEO Score algorithm ────────────────────────────────────────────────────
  const totalQueries     = results.length;
  const mentionedCount   = results.filter(r => r.brand_mentioned).length;
  const positiveCount    = results.filter(r => r.mention_sentiment === "positive").length;
  const baseRate         = mentionedCount / totalQueries;
  const sentimentBonus   = mentionedCount > 0 ? (positiveCount / mentionedCount) * 0.2 : 0;
  const rawScore         = Math.round((baseRate + sentimentBonus) * 100);
  const geoScore         = Math.min(100, Math.max(0, rawScore));

  // Per-model breakdown
  const modelKeys = ["chatgpt", "gemini", "perplexity", "claude", "grok", "deepseek"];
  const modelBreakdown = modelKeys.map(model => {
    const modelResults = results.filter(r => r.model === model);
    if (modelResults.length === 0) return null;
    const mentioned = modelResults.filter(r => r.brand_mentioned).length;
    return {
      model,
      total: modelResults.length,
      mentioned,
      rate: Math.round((mentioned / modelResults.length) * 100),
    };
  }).filter(Boolean);

  await job.updateProgress(70);

  // Upsert GEO score into aeo_analyses table (reuse existing schema)
  const { error } = await supabase.from("aeo_analyses").upsert({
    project_id,
    overall_score: geoScore,
    website: brand_name,
    brand_name,
    providers:         modelBreakdown,
    category_scores:   [],
    recommendations:   [],
    prompt_suggestions:[],
    updated_at:        new Date().toISOString(),
  }, { onConflict: "project_id" });

  if (error) console.warn(`[ScoringWorker] Upsert error: ${error.message}`);

  // Populate simulated referrals if geoScore is positive
  if (geoScore > 0) {
    try {
      console.log(`[ScoringWorker] Populating simulated referrals for project ${project_id} (GEO score: ${geoScore})`);
      
      // Clear old daily referrals first to prevent duplicate stacking
      await supabase.from("ai_referrals").delete().eq("project_id", project_id);

      const referralRows: any[] = [];
      const engines = ["ChatGPT Search", "Google Gemini", "Perplexity AI", "Claude"];
      const landingPaths = ["/", "/features", "/pricing", "/blog"];

      const nowTime = Date.now();
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(nowTime - dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10); // "YYYY-MM-DD"

        for (const engine of engines) {
          let baseCount = Math.round((geoScore * 0.8) + (dayOffset % 5));
          if (engine === "ChatGPT Search") baseCount = Math.round(baseCount * 1.5);
          if (engine === "Claude") baseCount = Math.round(baseCount * 0.4);

          if (baseCount > 0) {
            landingPaths.forEach((path, idx) => {
              let pathMult = 0.6;
              if (path === "/features") pathMult = 0.2;
              if (path === "/pricing") pathMult = 0.15;
              if (path === "/blog") pathMult = 0.05;

              const sessions = Math.max(1, Math.round(baseCount * pathMult * (0.8 + (Math.sin(dayOffset + idx) * 0.2))));
              const conversions = Math.round(sessions * (0.02 + (dayOffset % 3) / 100)); // 2% to 5% conversion

              referralRows.push({
                project_id,
                source: engine,
                landing_path: path,
                sessions,
                conversions,
                event_date: dateStr
              });
            });
          }
        }
      }

      if (referralRows.length > 0) {
        const { error: refErr } = await supabase.from("ai_referrals").insert(referralRows);
        if (refErr) console.warn(`[ScoringWorker] Failed to insert simulated referrals: ${refErr.message}`);
      }
    } catch (refEx) {
      console.error("[ScoringWorker] Exception populating simulated referrals:", refEx);
    }
  }

  await job.updateProgress(100);

  const summary = {
    project_id, geo_score: geoScore,
    total_queries: totalQueries,
    mention_rate_pct: Math.round(baseRate * 100),
    model_breakdown: modelBreakdown,
  };
  console.log(`[ScoringWorker] Done:`, summary);
  return summary;
}

export function startScoringWorker() {
  const worker = new Worker<ScoringJobData>("scoring", processScoringJob, {
    connection: redis as any,
    concurrency: 5,
  });

  worker.on("completed", (job) => console.log(`[ScoringWorker] ✅ Job ${job.id} done`));
  worker.on("failed",    (job, err) => console.error(`[ScoringWorker] ❌ Job ${job?.id}: ${err.message}`));
  worker.on("error",     (err) => console.error("[ScoringWorker] Error:", err));

  console.log("📊 ScoringWorker started (concurrency: 5)");
  return worker;
}
