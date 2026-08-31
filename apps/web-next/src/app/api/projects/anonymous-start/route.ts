import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getQueues } from "@/server/queues";

export const runtime = "nodejs";

const StartSchema = z.object({
  domain: z.string().min(1),
});

function cleanAndNormalizeDomain(urlStr: string): string {
  let cleaned = urlStr.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  try {
    const parsed = new URL(cleaned);
    return parsed.origin; // e.g. https://example.com
  } catch {
    return cleaned;
  }
}

function getProjectNameFromDomain(domain: string): string {
  try {
    const url = new URL(domain);
    const host = url.hostname.replace(/^www\./i, "");
    const part = host.split(".")[0];
    if (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
  } catch {}
  return domain;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = StartSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const rawDomain = parsed.data.domain;
    const normalizedDomain = cleanAndNormalizeDomain(rawDomain);
    const projectName = getProjectNameFromDomain(normalizedDomain);

    const location = "United States";
    const competitors: string[] = [];
    const metadataBlock = `\n---\nMETADATA: ${JSON.stringify({ location, competitors })}`;
    const brandDescription = `Market audience targeted: ${location}. Generated based on selection.${metadataBlock}`;

    const adminClient = getSupabaseAdminClient();

    // 1. Create project with user_id = null (anonymous creation)
    const { data: project, error: projectErr } = await adminClient
      .from("projects")
      .insert({
        name: projectName,
        domain: normalizedDomain,
        brand_name: projectName,
        brand_description: brandDescription,
        user_id: null,
      } as any)
      .select("id")
      .single();

    if (projectErr || !project) {
      console.error("Failed to create anonymous project:", projectErr);
      return NextResponse.json({ error: "Failed to initialize project" }, { status: 500 });
    }

    // 2. Create crawl run record in DB
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

    // 3. Enqueue crawl job in BullMQ
    const { crawlQueue } = getQueues();
    await crawlQueue.add("crawl", {
      project_id: project.id,
      website: normalizedDomain,
      max_pages: 50,
      run_id: run.id,
    }, {
      jobId: `crawl-${project.id}-${Date.now()}`,
    });

    console.log(`[AnonymousStart] Successfully started analysis for ${normalizedDomain}. Project ID: ${project.id}`);

    return NextResponse.json({ ok: true, projectId: project.id });
  } catch (error: any) {
    console.error("[AnonymousStart] Error starting analysis:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
