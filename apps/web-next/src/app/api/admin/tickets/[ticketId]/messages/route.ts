import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/server/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { ticketId } = await params;
  const admin = getSupabaseAdminClient();

  try {
    const { data: messages, error: mErr } = await admin
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (mErr) throw mErr;

    return NextResponse.json({ messages: messages || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { error, user: adminUser } = await requireAdmin();
  if (error) return error;

  const { ticketId } = await params;
  const admin = getSupabaseAdminClient();
  const body = await req.json();

  const { message, isInternalNote = false, attachments = [] } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    // Check if ticket exists
    const { data: ticket, error: tErr } = await admin
      .from("support_tickets")
      .select("user_id, status")
      .eq("id", ticketId)
      .maybeSingle();

    if (tErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Insert message
    const { data: newMessage, error: mErr } = await admin
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: adminUser!.id,
        message: message.trim(),
        is_internal_note: isInternalNote,
        attachments,
      })
      .select("*")
      .single();

    if (mErr) throw mErr;

    // Update ticket updated_at and status if it is not internal note
    // If admin replies, we set status to in_progress or waiting_on_user, typically waiting_on_user
    const ticketUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (!isInternalNote) {
      ticketUpdates.status = "waiting_on_user";
    }

    await admin
      .from("support_tickets")
      .update(ticketUpdates)
      .eq("id", ticketId);

    // If it's a public reply, log email sending if needed (or log to email_log)
    if (!isInternalNote) {
      // Get user email
      const { data: userData } = await admin.auth.admin.getUserById(ticket.user_id);
      if (userData?.user?.email) {
        await admin.from("email_log").insert({
          recipient_user_id: ticket.user_id,
          recipient_email: userData.user.email,
          subject: `Re: Ticket Resolution Support`,
          body: message.trim(),
          template: "ticket_reply",
          status: "sent",
          related_ticket_id: ticketId,
          sent_by: adminUser!.id,
        });
      }
    }

    await logAdminAction(
      adminUser!.id,
      isInternalNote ? "add_ticket_note" : "reply_ticket",
      "ticket",
      ticketId,
      { message_id: newMessage.id }
    );

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add message" },
      { status: 500 }
    );
  }
}
