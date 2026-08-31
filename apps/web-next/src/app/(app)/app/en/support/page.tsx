"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Send, MessageSquare, Plus, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function UserSupportPage() {
  const qc = useQueryClient();

  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Failed to load your support tickets");
      return res.json();
    },
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit support ticket");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Support ticket submitted successfully! We will contact you soon.");
      setSubject("");
      setDescription("");
      setShowSubmitForm(false);
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    submitTicketMutation.mutate({ subject, category, priority, description });
  };

  if (isLoading && !data) {
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
          <h3 className="font-bold">Error Loading Support Desk</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const { tickets = [] } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Support</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Need help? Ask questions, file bugs, request billing changes, or submit features suggestions.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitForm(!showSubmitForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          {showSubmitForm ? "Cancel Ticket" : "New Ticket"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Submission Form */}
        {showSubmitForm && (
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-slate-900">Open a New Support Ticket</h3>
            <form onSubmit={handleSubmitTicket} className="space-y-4 text-[12px]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Subject / Short Title
                </label>
                <input
                  type="text"
                  placeholder="Need help with credits..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors"
                  >
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Suggestion</option>
                    <option value="account">Account</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Describe Your Problem
                </label>
                <textarea
                  placeholder="Provide all details including error messages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-violet-500/50 transition-colors min-h-[120px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitTicketMutation.isPending}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-[12px] rounded-xl transition-all shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitTicketMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit Ticket
              </button>
            </form>
          </div>
        )}

        {/* Existing Tickets list */}
        <div className={`${showSubmitForm ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
          <h3 className="text-sm font-bold text-slate-900">Your Support Tickets</h3>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">No support tickets opened yet.</p>
              </div>
            ) : (
              tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap justify-between items-center gap-4 transition-all hover:border-slate-300 shadow-sm"
                >
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-[13px]">{ticket.subject}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${
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
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Opened on {new Date(ticket.created_at).toLocaleDateString()} • Category:{" "}
                      <span className="capitalize">{ticket.category}</span>
                    </p>
                  </div>
                  <Link
                    href={`/app/en/support/${ticket.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 hover:underline"
                  >
                    View Conversation
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
