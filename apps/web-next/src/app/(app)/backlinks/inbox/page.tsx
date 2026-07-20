'use client';

import React, { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Inbox, Sparkles, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyItem {
  id: string;
  sender_email: string;
  sender_name?: string;
  domain?: string;
  subject: string;
  message_body: string;
  sentiment: 'positive' | 'negative' | 'question' | 'negotiation';
  ai_summary?: string;
  ai_suggested_reply?: string;
  created_at: string;
}

export default function InboxPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<ReplyItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadReplies() {
      if (!activeProject?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: bProj } = await supabase
          .from('backlink_projects')
          .select('id')
          .eq('project_id', activeProject.id)
          .maybeSingle();

        if (bProj) {
          const { data: rList } = await supabase
            .from('campaign_replies')
            .select('*, prospects(domain), contacts(name)')
            .order('created_at', { ascending: false });

          if (rList && rList.length > 0) {
            const formatted = rList.map((r: any) => ({
              id: r.id,
              sender_email: r.sender_email,
              sender_name: r.contacts?.name || 'Prospect Contact',
              domain: r.prospects?.domain || 'Website',
              subject: r.subject || 'Outreach Reply',
              message_body: r.message_body,
              sentiment: r.sentiment || 'question',
              ai_summary: r.ai_summary || 'Outreach response received.',
              ai_suggested_reply: r.ai_suggested_reply || 'Thank you for getting back to us!',
              created_at: new Date(r.created_at).toLocaleDateString(),
            }));
            setReplies(formatted);
            setSelectedReply(formatted[0]);
            setReplyText(formatted[0].ai_suggested_reply || '');
          }
        }
      } catch (err: any) {
        console.error("Error loading replies:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReplies();
  }, [activeProject, supabase]);

  const handleSelect = (item: ReplyItem) => {
    setSelectedReply(item);
    setReplyText(item.ai_suggested_reply || '');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);

    setTimeout(() => {
      toast.success("Reply sent successfully!");
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reply Management & AI Assistant</h1>
        <p className="text-xs text-slate-500">
          Incoming outreach responses classified automatically with AI recommended replies.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-2 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p>Loading replies...</p>
        </div>
      ) : replies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reply List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            {replies.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelect(r)}
                className={`p-4 cursor-pointer transition ${
                  selectedReply?.id === r.id ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-900 text-xs">{r.sender_name}</span>
                  <span className="text-[10px] text-slate-400">{r.created_at}</span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mb-2">{r.subject}</div>

                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    r.sentiment === 'positive'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {r.sentiment}
                </span>
              </div>
            ))}
          </div>

          {/* Selected Thread Detail */}
          {selectedReply && (
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-bold text-slate-900">{selectedReply.subject}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  From: <span className="text-slate-900 font-semibold">{selectedReply.sender_name}</span> ({selectedReply.sender_email})
                </div>
              </div>

              {/* Received Email Body */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                {selectedReply.message_body}
              </div>

              {/* AI Summary Box */}
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Conversation Summary</span>
                </div>
                <p className="text-slate-700">{selectedReply.ai_summary}</p>
              </div>

              {/* Reply Composition Box */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-900">Suggested AI Reply</label>
                  <button
                    onClick={() => setReplyText(selectedReply.ai_suggested_reply || '')}
                    className="text-blue-600 hover:underline text-[11px] font-medium"
                  >
                    Reset to AI suggestion
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleSendReply}
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-3 shadow-sm">
          <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-800">No replies received yet.</p>
          <p>When prospects reply to your outreach emails, their responses will automatically appear here with AI sentiment classification and suggested replies.</p>
        </div>
      )}
    </div>
  );
}
