'use client';

import React, { useState } from 'react';
import { Inbox, Sparkles, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

interface ReplyItem {
  id: string;
  sender_email: string;
  sender_name: string;
  domain: string;
  subject: string;
  message_body: string;
  sentiment: 'positive' | 'negative' | 'question' | 'negotiation';
  ai_summary: string;
  ai_suggested_reply: string;
  date: string;
}

const mockReplies: ReplyItem[] = [
  {
    id: 'r1',
    sender_email: 'sarah@aisoftwareinsider.com',
    sender_name: 'Sarah Jenkins',
    domain: 'aisoftwareinsider.com',
    subject: 'Re: Resource page recommendation for AI tools',
    message_body: 'Hi there! Thanks for reaching out. We actually love the tool and would be happy to include Solospider in our top 10 AI SEO listicle! Could you send over a 100-word overview?',
    sentiment: 'positive',
    ai_summary: 'Prospect agreed to include Solospider in top 10 listicle and requested a 100-word product description.',
    ai_suggested_reply: 'Hi Sarah, thank you! Here is a concise 100-word overview along with our high-res logo asset. Let me know if you need anything else!',
    date: '2 hours ago',
  },
  {
    id: 'r2',
    sender_email: 'alex@searchenginetactics.io',
    sender_name: 'Alex Rivera',
    domain: 'searchenginetactics.io',
    subject: 'Re: Guest post contribution',
    message_body: 'Hey! We do accept guest contributions, but we have a standard editorial administrative processing fee of $50 for indexing.',
    sentiment: 'negotiation',
    ai_summary: 'Prospect is open to publishing but requests a $50 editorial fee.',
    ai_suggested_reply: 'Hi Alex, thanks for letting me know. We prefer organic non-paid collaborations, but could we offer an exchange link from our upcoming roundup instead?',
    date: '1 day ago',
  },
];

export default function InboxPage() {
  const [replies, setReplies] = useState<ReplyItem[]>(mockReplies);
  const [selectedReply, setSelectedReply] = useState<ReplyItem>(mockReplies[0]);
  const [replyText, setReplyText] = useState(mockReplies[0].ai_suggested_reply);

  const handleSelect = (item: ReplyItem) => {
    setSelectedReply(item);
    setReplyText(item.ai_suggested_reply);
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reply Management & AI Assistant</h1>
        <p className="text-xs text-slate-500">
          Incoming outreach responses classified automatically with AI recommended replies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reply List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {replies.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r)}
              className={`p-4 cursor-pointer transition ${
                selectedReply.id === r.id ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-900 text-xs">{r.sender_name}</span>
                <span className="text-[10px] text-slate-400">{r.date}</span>
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
                onClick={() => setReplyText(selectedReply.ai_suggested_reply)}
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
              <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm">
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
