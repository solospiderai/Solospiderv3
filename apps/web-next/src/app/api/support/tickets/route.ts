import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tickets: tickets || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject, category = "other", priority = "medium", description } = body;

  if (!subject || !subject.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  try {
    // 1. Insert support ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        priority,
        status: "open",
      })
      .select("*")
      .single();

    if (ticketErr) throw ticketErr;

    // 2. Insert initial ticket message (the user's description)
    const { error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: description.trim(),
        is_internal_note: false,
      });

    if (msgErr) throw msgErr;

    // 3. Log to system email log that support ticket was created confirmation email sent
    await supabase.from("email_log").insert({
      recipient_user_id: user.id,
      recipient_email: user.email || "",
      subject: `Ticket Opened: ${subject.trim()}`,
      body: `Hi there, we have successfully opened ticket #${ticket.id}. Our support team will get back to you shortly.`,
      template: "ticket_open",
      status: "sent",
      related_ticket_id: ticket.id,
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create ticket" },
      { status: 500 }
    );
  }
}
