import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/server/api";
import { getSupabaseAdminClient } from "@/server/supabase-admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ClaimSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ClaimSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { projectId } = parsed.data;
    const adminClient = getSupabaseAdminClient();

    // 1. Fetch the project using admin client to bypass RLS (since user_id is null, the user's client won't see it)
    const { data: project, error: fetchErr } = await adminClient
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Check if the project is already claimed by someone else
    if (project.user_id && project.user_id !== user.id) {
      return NextResponse.json({ error: "Project is already claimed by another user" }, { status: 403 });
    }

    // 3. Update project ownership to the current user
    const { error: updateErr } = await adminClient
      .from("projects")
      .update({ user_id: user.id })
      .eq("id", projectId);

    if (updateErr) {
      console.error("Failed to claim project:", updateErr);
      return NextResponse.json({ error: "Failed to claim project" }, { status: 500 });
    }

    console.log(`[ClaimProject] User ${user.id} successfully claimed project ${projectId}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[ClaimProject] Error claiming project:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
