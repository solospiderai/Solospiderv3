"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/data-table";
import { Loader2, AlertTriangle, Send, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const qc = useQueryClient();

  // Compose forms states
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [broadcast, setBroadcast] = useState(false);
  const [planFilter, setPlanFilter] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch email logs
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "emails"],
    queryFn: async () => {
      const res = await fetch("/api/admin/emails");
      if (!res.ok) throw new Error("Failed to load email logs");
      return res.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send email");
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.type === "simulated") {
        toast.warning("Email process simulated! Configure RESEND_API_KEY or SMTP credentials in your .env file to send real emails.");
      } else {
        toast.success(`Email sent successfully via ${data?.type || "provider"}!`);
      }
      setRecipientEmail("");
      setSubject("");
      setContent("");
      qc.invalidateQueries({ queryKey: ["admin", "emails"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required");
      return;
    }
    if (!broadcast && !recipientEmail.trim()) {
      toast.error("Recipient email is required for direct messages");
      return;
    }

    sendEmailMutation.mutate({
      recipientEmail: broadcast ? "" : recipientEmail,
      subject,
      content,
      broadcast,
      planFilter: broadcast ? planFilter : "",
    });
  };

  if (isLoading && !data) {
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
          <h3 className="font-bold">Error Loading Email Logs</h3>
          <p className="text-xs opacity-80">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: "recipient_email",
      label: "Recipient Email",
      sortable: true,
      render: (row: any) => <span className="font-bold text-slate-800 text-[12px]">{row.recipient_email}</span>,
    },
    {
      key: "subject",
      label: "Subject Line",
      render: (row: any) => (
        <span className="text-slate-600 font-semibold text-[12px] max-w-[200px] truncate block">
          {row.subject}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
            row.status === "sent"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "template",
      label: "Template",
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          {row.template || "custom"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Sent At",
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-400 font-semibold text-[11px]">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email Center</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Monitor auto-generated emails, notifications, and broadcast messages to users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6 h-fit">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-600" /> Compose Message
          </h3>
          <form onSubmit={handleSendEmail} className="space-y-4 text-[12px]">
            {/* Direct vs Broadcast */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Message Scope
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcast(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    !broadcast
                      ? "bg-violet-600/10 text-violet-600 border-violet-200/25"
                      : "bg-white text-slate-400 border-transparent hover:text-slate-500"
                  }`}
                >
                  Direct Email
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcast(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                    broadcast
                      ? "bg-violet-600/10 text-violet-600 border-violet-200/25"
                      : "bg-white text-slate-400 border-transparent hover:text-slate-500"
                }`}
                >
                  Broadcast (Bulk)
                </button>
              </div>
            </div>

            {broadcast ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Target Plan Tier
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-violet-200/40 transition-colors"
                >
                  <option value="" className="bg-white">All Plan Tiers</option>
                  <option value="free" className="bg-white">Starter (Free)</option>
                  <option value="growth" className="bg-white">Growth</option>
                  <option value="scale" className="bg-white">Scale</option>
                  <option value="custom" className="bg-white">Custom</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-200/40 transition-colors"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Subject
              </label>
              <input
                type="text"
                placeholder="Platform updates..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-200/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Content Body
              </label>
              <textarea
                placeholder="Write your email details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200/80 shadow-sm rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-200/40 transition-colors min-h-[120px]"
              />
            </div>

            <button
              type="submit"
              disabled={sendEmailMutation.isPending}
              className="w-full py-2 bg-violet-600 hover:bg-violet-750 disabled:opacity-50 text-slate-800 font-bold text-[12px] rounded-xl transition-all shadow-[0_2px_8px_rgba(144,37,242,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send Email
            </button>
          </form>
        </div>

        {/* Logs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">System Email logs</h3>
          <DataTable columns={columns} data={data?.logs || []} searchable={false} pageSize={12} />
        </div>
      </div>
    </div>
  );
}
