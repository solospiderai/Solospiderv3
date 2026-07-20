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
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backlink Verification & Lost Link Monitor</h1>
          <p className="text-xs text-slate-500">
            Real-time crawler verification of live backlinks and automated 7-day lost link tracking.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer shadow-sm">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Recheck All Links</span>
        </button>
      </div>

      {/* Toggle Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setTab('verified')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            tab === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Verified Active Links ({mockVerified.length})</span>
        </button>

        <button
          onClick={() => setTab('lost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            tab === 'lost' ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Lost / Removed Links ({mockLost.length})</span>
        </button>
      </div>

      {tab === 'verified' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-3.5">Referring URL</th>
                <th className="p-3.5">Target Page</th>
                <th className="p-3.5">Anchor Text</th>
                <th className="p-3.5">Rel Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockVerified.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-blue-600 max-w-xs truncate">
                    <a href={v.referring_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                      <span>{v.referring_url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-xs truncate">{v.target_url}</td>
                  <td className="p-3.5 font-mono text-slate-900 font-medium">"{v.anchor_text}"</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                      {v.rel_type}
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-600 font-bold">{v.status_code} OK</td>
                  <td className="p-3.5 text-slate-500">{v.last_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-3.5">Referring URL</th>
                <th className="p-3.5">Target Page</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Detected At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLost.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 text-slate-800 font-mono">{l.referring_url}</td>
                  <td className="p-3.5 text-slate-500">{l.target_url}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-semibold border border-amber-200">
                      {l.reason}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{l.detected_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
