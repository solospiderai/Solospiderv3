"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, ArrowLeft, Send, CheckCircle2, User, Headphones } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const qc = useQueryClient();

  const [messageText, setMessageText] = useState("");

  // Fetch ticket details
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "tickets", ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to load support ticket details");
      return res.json();
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async (payload: { message: string; isInternalNote: boolean }) => {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload.message,
          isInternalNote: payload.isInternalNote,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      toast.success("Reply sent successfully!");
      qc.invalidateQueries({ queryKey: ["admin", "tickets", ticketId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (updatedFields: { status?: string; priority?: string }) => {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Failed to update ticket status");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Ticket updated successfully!");
      qc.invalidateQueries({ queryKey: ["admin", "tickets", ticketId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendReplyMutation.mutate({ message: messageText, isInternalNote: false });
  };

  const handleStatusChange = (status: string) => {
    updateTicketMutation.mutate({ status });
  };

  const handlePriorityChange = (priority: string) => {
    updateTicketMutation.mutate({ priority });
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-100 bg-red-500/5 rounded-2xl flex items-center gap-4 text-red-600">
        <AlertTriangle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-bold">Error Loading Support Ticket</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { ticket, messages } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/app/en/admin/support"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Ticket List
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{ticket.subject}</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1 font-mono">Ticket ID: {ticket.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-violet-200/40 transition-colors"
            >
              <option value="open" className="bg-white">Open</option>
              <option value="in_progress" className="bg-white">In Progress</option>
              <option value="waiting_on_user" className="bg-white">Waiting On User</option>
              <option value="resolved" className="bg-white">Resolved</option>
              <option value="closed" className="bg-white">Closed</option>
            </select>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-violet-200/40 transition-colors"
            >
              <option value="low" className="bg-white">Low</option>
              <option value="medium" className="bg-white">Medium</option>
              <option value="high" className="bg-white">High</option>
              <option value="urgent" className="bg-white">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Thread */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Conversation Thread</h3>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] mb-6 pr-2 scrollbar-thin">
            {messages.map((m: any) => {
              const isAdminSender = m.sender_id !== ticket.user_id;

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-[12px] p-4 rounded-2xl max-w-[80%] ${
                    m.is_internal_note
                      ? "bg-amber-500/5 border border-amber-500/10 ml-auto border-dashed"
                      : isAdminSender
                      ? "bg-violet-600/10 border border-violet-200/20 ml-auto"
                      : "bg-slate-50 border border-slate-200/80 shadow-sm mr-auto"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-black ${
                      m.is_internal_note
                        ? "bg-amber-500/20 text-amber-600"
                        : isAdminSender
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {m.is_internal_note ? "N" : isAdminSender ? <Headphones className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-slate-800">
                        {m.is_internal_note
                          ? "Internal Note"
                          : isAdminSender
                          ? "Administrator"
                          : ticket.user_email}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-200/80 shadow-sm">
            <div className="flex gap-2 items-end">
              <textarea
                placeholder="Write support response..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-200/40 transition-colors min-h-[60px]"
              />
              <button
                type="submit"
                disabled={sendReplyMutation.isPending}
                className="p-3 bg-violet-600 hover:bg-violet-750 text-white rounded-xl transition-all shadow-[0_2px_8px_rgba(144,37,242,0.4)] cursor-pointer"
              >
                {sendReplyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User Sidebar Details */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6 text-[12px] h-fit">
          <h3 className="text-sm font-bold text-slate-800">Requester Details</h3>
          <div className="space-y-4">
            <div className="py-2 border-b border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">User Email</span>
              <p className="text-slate-800 font-bold block truncate">{ticket.user_email}</p>
            </div>
            <div className="py-2 border-b border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">User ID</span>
              <p className="text-slate-500 font-semibold font-mono text-[10px] truncate">
                {ticket.user_id}
              </p>
            </div>
            <div className="py-2 border-b border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">Category</span>
              <p className="text-slate-800 font-bold capitalize">{ticket.category}</p>
            </div>
            <div className="py-2 border-b border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">Assigned To</span>
              <p className="text-slate-800 font-bold">{ticket.assignee_email || "Unassigned"}</p>
            </div>
            <Link
              href={`/app/en/admin/users/${ticket.user_id}`}
              className="w-full py-2 bg-slate-50/50 border border-slate-200/80 shadow-sm hover:bg-slate-100 text-slate-800 font-bold text-[11px] rounded-xl transition-colors block text-center"
            >
              Open User Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
