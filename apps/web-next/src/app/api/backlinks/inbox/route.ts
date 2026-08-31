import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: replies, error } = await supabase
      .from("campaign_replies")
      .select("*, prospects(*), contacts(*), campaigns(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ replies: replies || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
