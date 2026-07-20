import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    let verifiedQuery = supabase.from("verified_backlinks").select("*").order("first_seen", { ascending: false });
    let lostQuery = supabase.from("lost_backlinks").select("*").order("detected_at", { ascending: false });

    if (projectId) {
      verifiedQuery = verifiedQuery.eq("backlink_project_id", projectId);
      lostQuery = lostQuery.eq("backlink_project_id", projectId);
    }

    const [{ data: verified }, { data: lost }] = await Promise.all([verifiedQuery, lostQuery]);

    return NextResponse.json({
      verified_backlinks: verified || [],
      lost_backlinks: lost || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
