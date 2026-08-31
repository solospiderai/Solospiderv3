import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson, requireWorkerSecret } from "@/server/api";
import { getQueues } from "@/server/queues";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PromptScanSchema = z.object({
  project_id: z.string().uuid(),
  brand_name: z.string().min(1),
  models: z.array(z.string()).min(1).default(["chatgpt", "gemini", "perplexity", "claude"]),
  competitors: z.array(z.string()).optional().default([]),
  prompt_ids: z.array(z.string().uuid()).optional(),
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

export async function POST(request: NextRequest) {
  const unauthorized = requireWorkerSecret(request);
  if (unauthorized) return unauthorized;

  const parsed = PromptScanSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Ensure there is at least one active prompt before scanning
  const { data: existingPrompts, error: queryErr } = await supabase
    .from("aeo_prompts")
    .select("id")
    .eq("project_id", parsed.data.project_id)
    .eq("is_active", true);

  if (queryErr) {
    console.error("Failed to query existing prompts:", queryErr);
  }

  if (!existingPrompts || existingPrompts.length === 0) {
    console.log(`[PromptScanApi] Seeding default active prompts for project ${parsed.data.project_id}`);
    const defaultPrompts = [
      {
        project_id: parsed.data.project_id,
        topic: "Brand Discovery",
        prompt: `What are the best alternatives to standard tools for ${parsed.data.brand_name}?`,
        is_active: true,
      },
      {
        project_id: parsed.data.project_id,
        topic: "Features & Benefits",
        prompt: `How does ${parsed.data.brand_name} compare in pricing, features, and speed?`,
        is_active: true,
      },
      {
        project_id: parsed.data.project_id,
        topic: "Use Cases",
        prompt: `What is the best way to optimize website SEO and AEO using ${parsed.data.brand_name}?`,
        is_active: true,
      },
      {
        project_id: parsed.data.project_id,
        topic: "Competitor Comparison",
        prompt: `Who is the industry leader between ${parsed.data.brand_name} and its competitors?`,
        is_active: true,
      },
      {
        project_id: parsed.data.project_id,
        topic: "Integration & Setup",
        prompt: `Is it easy to integrate WordPress and Shopify with ${parsed.data.brand_name}?`,
        is_active: true,
      },
    ];

    const { error: seedErr } = await supabase.from("aeo_prompts").insert(defaultPrompts);
    if (seedErr) {
      console.error("Failed to seed default prompts:", seedErr);
    }
  }

  const { data: run, error: runErr } = await supabase
    .from("prompt_scan_runs")
    .insert({
      project_id: parsed.data.project_id,
      brand_name: parsed.data.brand_name,
      models: parsed.data.models,
      status: "pending",
      total_prompts: 0,
      completed: 0,
    })
    .select("id")
    .single();

  if (runErr) {
    console.error("Failed to create prompt scan run in DB:", runErr);
    return NextResponse.json({ error: "Failed to initialize scan run in database" }, { status: 500 });
  }

  const { promptScanQueue } = getQueues();
  const job = await promptScanQueue.add("prompt-scan", {
    ...parsed.data,
    run_id: run.id,
  }, {
    jobId: `scan-${parsed.data.project_id}-${Date.now()}`,
  });

  return NextResponse.json({ ok: true, job_id: job.id, run_id: run.id, queue: "prompt-scan" });
}
