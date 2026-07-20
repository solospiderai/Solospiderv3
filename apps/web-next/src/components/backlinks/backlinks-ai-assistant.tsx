'use client';

import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, RefreshCw, MessageSquare } from 'lucide-react';

export function BacklinksAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Backlink Strategy Assistant. Ask me how to optimize outreach, rewrite emails, or analyze prospect failure reasons.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      setTimeout(() => {
        let reply = "Based on your current campaign data, I recommend targeting guest post angles on high-relevance niche blogs. Your open rate is healthy, but adding a specific article reference in Email 1 will boost reply rates by 25%.";
        if (userText.toLowerCase().includes("fail")) {
          reply = "Campaigns often struggle due to generic subject lines or missing contact names. Try personalizing the greeting and highlighting a recent article they published.";
        } else if (userText.toLowerCase().includes("rewrite")) {
          reply = "Here is a high-converting rewrite:\n\n'Hi [Name], loved your recent piece on [Topic]. We built an open resource covering [Value Prop] that your readers will find valuable. Would you open to linking to it?'";
        }

        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        setLoading(false);
      }, 1000);
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer font-semibold text-xs border border-blue-400/30"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>AI Strategy Assistant</span>
        </button>
      )}

      {/* AI Assistant Sidebar Panel (Light Mode) */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 bg-white border-l border-slate-200 text-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Bot className="w-5 h-5 text-blue-600" />
              <span>Backlink AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => setInput('Why did my campaign fail?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 font-medium whitespace-nowrap shadow-xs"
            >
              Why campaigns fail?
            </button>
            <button
              onClick={() => setInput('Rewrite my outreach email')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 font-medium whitespace-nowrap shadow-xs"
            >
              Rewrite email
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl flex items-center gap-2 border border-slate-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>AI analyzing data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI assistant..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
