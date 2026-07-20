'use client';

import React, { useState } from 'react';
import { Send, Play, Pause, Plus, Mail, Clock, Sparkles } from 'lucide-react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Outreach Campaigns & Sequences</h1>
          <p className="text-xs text-slate-500">
            Automated 4-step AI outreach sequences (Initial $\rightarrow$ 4d Followup $\rightarrow$ 7d Followup $\rightarrow$ 14d Final).
          </p>
        </div>
        <button
          onClick={() => setActiveTab(activeTab === 'list' ? 'create' : 'list')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'list' ? 'Create Campaign' : 'Back to Campaigns'}</span>
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">AI Tools Directory Outreach</h3>
                <p className="text-xs text-slate-500 mt-0.5">Target: /blog/ai-seo-guide</p>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-full">
                Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <div className="text-slate-900 font-bold">18</div>
                <div className="text-[10px] text-slate-500">Prospects</div>
              </div>
              <div>
                <div className="text-blue-600 font-bold">12</div>
                <div className="text-[10px] text-slate-500">Sent</div>
              </div>
              <div>
                <div className="text-emerald-600 font-bold">4</div>
                <div className="text-[10px] text-slate-500">Replied</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
              <span>Sequence: 4 Steps (Initial + 3 Followups)</span>
              <button className="text-blue-600 hover:underline font-medium">Edit Sequence</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 max-w-3xl shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Create AI-Personalized Campaign</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. AI Marketing Listicles Outreach"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Page to Promote (URL)</label>
              <input
                type="text"
                placeholder="https://solospider.ai/blog/ai-seo-automation"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-900">Automated Sequence Steps</h3>
              
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 1: Initial Pitch</span>
                  <span className="text-blue-600 font-bold">Day 0 (Immediate)</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 2: Gentle Follow-up 1</span>
                  <span className="text-slate-500">Day +4</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 3: Value-add Follow-up 2</span>
                  <span className="text-slate-500">Day +7</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
                  <span className="font-semibold text-slate-900">Step 4: Final Break-up Email</span>
                  <span className="text-slate-500">Day +14</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('list')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer text-xs shadow-md"
            >
              Generate AI Sequence & Launch Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
