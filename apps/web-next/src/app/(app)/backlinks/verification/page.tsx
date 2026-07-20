'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, ShieldAlert, Clock } from 'lucide-react';

interface VerifiedLink {
  id: string;
  referring_url: string;
  target_url: string;
  anchor_text: string;
  rel_type: string;
  status_code: number;
  last_seen: string;
}

interface LostLink {
  id: string;
  referring_url: string;
  target_url: string;
  reason: string;
  detected_at: string;
}

const mockVerified: VerifiedLink[] = [
  {
    id: 'v1',
    referring_url: 'https://aisoftwareinsider.com/best-seo-tools-2026',
    target_url: 'https://solospider.ai/blog/ai-seo-guide',
    anchor_text: 'Solospider AI platform',
    rel_type: 'dofollow',
    status_code: 200,
    last_seen: 'Today at 02:00 AM',
  },
  {
    id: 'v2',
    referring_url: 'https://searchenginetactics.io/resources',
    target_url: 'https://solospider.ai',
    anchor_text: 'automated SEO crawler',
    rel_type: 'dofollow',
    status_code: 200,
    last_seen: 'Yesterday',
  },
];

const mockLost: LostLink[] = [
  {
    id: 'l1',
    referring_url: 'https://techblog-archive.com/top-10-ai',
    target_url: 'https://solospider.ai',
    reason: '404 Page Removed',
    detected_at: '3 days ago',
  },
];

export default function VerificationPage() {
  const [tab, setTab] = useState<'verified' | 'lost'>('verified');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Backlink Verification & Lost Link Monitor</h1>
          <p className="text-xs text-slate-400">
            Real-time crawler verification of live backlinks and automated 7-day lost link tracking.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recheck All Links</span>
        </button>
      </div>

      {/* Toggle Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setTab('verified')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            tab === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verified Active Links ({mockVerified.length})</span>
        </button>

        <button
          onClick={() => setTab('lost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            tab === 'lost' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Lost / Removed Links ({mockLost.length})</span>
        </button>
      </div>

      {tab === 'verified' ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Referring URL</th>
                <th className="p-3">Target Page</th>
                <th className="p-3">Anchor Text</th>
                <th className="p-3">Rel Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mockVerified.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-semibold text-blue-400 max-w-xs truncate">
                    <a href={v.referring_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                      <span>{v.referring_url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs truncate">{v.target_url}</td>
                  <td className="p-3 font-mono text-white">"{v.anchor_text}"</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-semibold border border-emerald-500/20">
                      {v.rel_type}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">{v.status_code} OK</td>
                  <td className="p-3 text-slate-400">{v.last_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Referring URL</th>
                <th className="p-3">Target Page</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Detected At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mockLost.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-300 font-mono">{l.referring_url}</td>
                  <td className="p-3 text-slate-400">{l.target_url}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-semibold border border-amber-500/20">
                      {l.reason}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{l.detected_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
