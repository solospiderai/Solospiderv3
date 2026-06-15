import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, readJson, requireWorkerSecret } from "@/server/api";
import { getQueues } from "@/server/queues";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CrawlSchema = z.object({
  project_id: z.string().uuid(),
  website: z.string().url(),
  max_pages: z.number().int().min(1).max(200).optional().default(50),
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

  const parsed = CrawlSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: run, error: runErr } = await supabase
    .from("crawl_runs")
    .insert({
      project_id: parsed.data.project_id,
      status: "pending",
      pages_found: 0,
      pages_crawled: 0,
    })
    .select("id")
    .single();

  if (runErr) {
    console.error("Failed to create crawl run in DB:", runErr);
    return NextResponse.json({ error: "Failed to initialize crawl run in database" }, { status: 500 });
  }

  const { crawlQueue } = getQueues();
  const job = await crawlQueue.add("crawl", {
    ...parsed.data,
    run_id: run.id,
  }, {
    jobId: `crawl-${parsed.data.project_id}-${Date.now()}`,
  });

  return NextResponse.json({ ok: true, job_id: job.id, run_id: run.id, queue: "crawl" });
}
