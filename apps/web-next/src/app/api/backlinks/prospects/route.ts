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

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const { data: prospects, error } = await supabase
      .from("prospects")
      .select("*, contacts(*), prospect_analysis(*)")
      .eq("backlink_project_id", projectId)
      .order("relevance_score", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ prospects: prospects || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prospect_id, status } = body;

    if (!prospect_id || !status) {
      return NextResponse.json({ error: "prospect_id and status are required" }, { status: 400 });
    }

    const { data: prospect, error } = await supabase
      .from("prospects")
      .update({ status })
      .eq("id", prospect_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prospect });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
