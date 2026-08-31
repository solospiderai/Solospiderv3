import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
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
  const body = await req.json();
  const { message, attachments = [] } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    // Check ticket ownership
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .select("id, user_id")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not your ticket" }, { status: 403 });
    }

    // Insert public user message
    const { data: newMessage, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message: message.trim(),
        is_internal_note: false,
        attachments,
      })
      .select("*")
      .single();

    if (msgErr) throw msgErr;

    // Update ticket status back to "open" when user replies so admins see it needs attention
    await supabase
      .from("support_tickets")
      .update({
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to post message" },
      { status: 500 }
    );
  }
}
