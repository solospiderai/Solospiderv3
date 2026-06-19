import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getQueues } from "@/server/queues";

export const runtime = "nodejs";

const LaunchSchema = z.object({
  domain: z.string().min(1),
  brandName: z.string().optional(),
  location: z.string().optional().default("United States"),
  competitors: z.array(z.string()).optional().default([]),
  prompts: z.array(z.object({
    topic: z.string(),
    prompt: z.string(),
  })).min(1),
});

function cleanAndNormalizeDomain(urlStr: string): string {
  let cleaned = urlStr.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned;
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = LaunchSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { domain, brandName, location, competitors, prompts } = parsed.data;
    const normalizedDomain = cleanAndNormalizeDomain(domain);
    const cleanBrand = brandName?.trim() || domain.trim();

    const metadataBlock = `\n---\nMETADATA: ${JSON.stringify({ location, competitors })}`;
    const brandDescription = `Market audience targeted: ${location}. Generated based on selection.${metadataBlock}`;

    const adminClient = getSupabaseAdminClient();

    // 1. Create project record anonymously (user_id: null)
    const { data: project, error: projectErr } = await adminClient
      .from("projects")
      .insert({
        name: cleanBrand,
        domain: normalizedDomain,
        brand_name: cleanBrand,
        brand_description: brandDescription,
        user_id: null,
      } as any)
      .select("id")
      .single();

    if (projectErr || !project) {
      console.error("Failed to create anonymous project:", projectErr);
      return NextResponse.json({ error: "Failed to initialize project" }, { status: 500 });
    }

    // 2. Insert prompts into aeo_prompts
    const promptRows = prompts.map(p => ({
      project_id: project.id,
      topic: p.topic,
      prompt: p.prompt.trim(),
      is_active: true,
    }));

    const { error: insertErr } = await adminClient
      .from("aeo_prompts")
      .insert(promptRows);

    if (insertErr) {
      console.error("Failed to insert anonymous prompts:", insertErr);
      return NextResponse.json({ error: "Failed to save prompts" }, { status: 500 });
    }

    // 3. Create crawl run record in DB
    const { data: run, error: runErr } = await adminClient
      .from("crawl_runs")
      .insert({
        project_id: project.id,
        status: "pending",
        pages_found: 0,
        pages_crawled: 0,
      })
      .select("id")
      .single();

    if (runErr || !run) {
      console.error("Failed to create crawl run in DB:", runErr);
      return NextResponse.json({ error: "Failed to initialize crawl run" }, { status: 500 });
    }

    // 4. Enqueue crawl job in BullMQ
    const { crawlQueue } = getQueues();
    await crawlQueue.add("crawl", {
      project_id: project.id,
      website: normalizedDomain,
      max_pages: 50,
      run_id: run.id,
    }, {
      jobId: `crawl-${project.id}-${Date.now()}`,
    });

    console.log(`[AnonymousLaunch] Successfully launched scan for ${normalizedDomain}. Project ID: ${project.id}`);

    return NextResponse.json({ ok: true, projectId: project.id });
  } catch (error: any) {
    console.error("[AnonymousLaunch] Error launching scan:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
