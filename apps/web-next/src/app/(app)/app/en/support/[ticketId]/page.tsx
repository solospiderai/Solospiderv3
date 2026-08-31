"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, ArrowLeft, Send, User, Headphones } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UserTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const qc = useQueryClient();

  const [messageText, setMessageText] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["support", "tickets", ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to load ticket details");
      return res.json();
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to post message reply");
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      toast.success("Reply posted successfully!");
      qc.invalidateQueries({ queryKey: ["support", "tickets", ticketId] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendReplyMutation.mutate(messageText);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#9025F2]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl flex items-center gap-4 text-red-400">
        <AlertTriangle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-bold">Error Loading Ticket Details</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { ticket, messages = [] } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/app/en/support"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Ticket List
        </Link>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{ticket.subject}</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1 font-mono">Ticket ID: {ticket.id}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border tracking-wider ${
              ticket.status === "open"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : ticket.status === "in_progress"
                ? "bg-amber-50 text-amber-600 border-amber-100"
                : ticket.status === "resolved"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-slate-50 text-slate-600 border-slate-100"
            }`}
          >
            {ticket.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Messages feed */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Conversation</h3>

          {/* Feed list */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] mb-6 pr-2 scrollbar-thin">
            {messages.map((m: any) => {
              const isAdminSender = m.sender_id !== ticket.user_id;

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-[12px] p-4 rounded-2xl max-w-[80%] ${
                    isAdminSender
                      ? "bg-slate-50 border border-slate-100 mr-auto"
                      : "bg-violet-50/50 border border-violet-100/50 ml-auto"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-black ${
                      isAdminSender ? "bg-violet-600" : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {isAdminSender ? <Headphones className="h-3 w-3 text-white" /> : <User className="h-3 w-3 text-slate-500" />}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-slate-950">
                        {isAdminSender ? "SoloSpider Support Staff" : "You"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form */}
          {ticket.status !== "closed" ? (
            <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-100 flex gap-2 items-end">
              <textarea
                placeholder="Write message response to support staff..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-500/50 transition-colors min-h-[60px]"
              />
              <button
                type="submit"
                disabled={sendReplyMutation.isPending}
                className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer"
              >
                {sendReplyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs font-semibold text-slate-500">
              This ticket is closed. If you still have problems, please create a new support ticket.
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-[12px] h-fit shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Ticket Details</h3>
          <div className="space-y-3">
            <div className="py-1 space-y-0.5">
              <span className="text-slate-400 font-semibold">Priority</span>
              <p className="text-slate-800 font-bold capitalize">{ticket.priority}</p>
            </div>
            <div className="py-1 space-y-0.5">
              <span className="text-slate-400 font-semibold">Category</span>
              <p className="text-slate-800 font-bold capitalize">{ticket.category}</p>
            </div>
            <div className="py-1 space-y-0.5">
              <span className="text-slate-400 font-semibold">Resolution Summary</span>
              <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                {ticket.resolution_summary || "Our staff is checking details to resolve this ticket."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
