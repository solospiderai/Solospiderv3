import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId } = await params;

  try {
    // Fetch ticket. The RLS policy should ensure user can only fetch their own ticket,
    // but we can explicitly check as well.
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Fetch messages (RLS filters out internal notes automatically, but we can filter too)
    const { data: messages, error: msgErr } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("is_internal_note", false)
      .order("created_at", { ascending: true });

    if (msgErr) throw msgErr;

    return NextResponse.json({
      ticket,
      messages: messages || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch ticket details" },
      { status: 500 }
    );
  }
}
