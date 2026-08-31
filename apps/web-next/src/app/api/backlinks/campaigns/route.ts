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

    let query = supabase
      .from("campaigns")
      .select("*, campaign_messages(*)")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("backlink_project_id", projectId);
    }

    const { data: campaigns, error } = await query;
    if (error) throw error;

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { backlink_project_id, name, target_page_url, prospect_ids } = body;

    if (!backlink_project_id || !name || !target_page_url) {
      return NextResponse.json({ error: "project_id, name, and target_page_url are required" }, { status: 400 });
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        backlink_project_id,
        name,
        target_page_url,
        status: "active",
        total_prospects: (prospect_ids || []).length,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
