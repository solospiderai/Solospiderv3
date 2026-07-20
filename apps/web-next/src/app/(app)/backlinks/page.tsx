'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Zap,
} from 'lucide-react';

export default function BacklinksDashboardPage() {
  const [stats, setStats] = useState({
    prospectsFound: 48,
    qualifiedProspects: 32,
    emailsSent: 124,
    openRate: '42.5%',
    replyRate: '12.8%',
    positiveReplies: 9,
    backlinksEarned: 6,
    lostLinks: 1,
    avgAuthority: 58,
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Backlink Acquisition Dashboard</h1>
          <p className="text-sm text-slate-300 mt-1">
            Discover opportunities, send personalized AI outreach, and monitor earned links.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/backlinks/prospects"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Discover Prospects</span>
          </Link>
          <Link
            href="/backlinks/campaigns"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Prospects Found</span>
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.prospectsFound}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.qualifiedProspects} qualified</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Outreach Sent</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.emailsSent}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Open Rate: <span className="text-white font-medium">{stats.openRate}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Backlinks Earned</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.backlinksEarned}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Authority: <span className="text-white font-medium">{stats.avgAuthority}</span> (Est.)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Lost Link Monitor</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.lostLinks}</div>
          <div className="text-[11px] text-amber-300 mt-1">Recheck every 7 days</div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Campaigns */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Outreach Campaigns</h3>
            <Link href="/backlinks/campaigns" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">AI Tools Directory Outreach</div>
                <div className="text-[11px] text-slate-400">Target: /blog/ai-seo-guide • 18 Prospects</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-medium">
                  Active
                </span>
                <div className="text-[11px] text-slate-400 mt-1">12 Sent • 4 Replied</div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Guest Post Pitch - Marketing Blogs</div>
                <div className="text-[11px] text-slate-400">Target: /homepage • 14 Prospects</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-medium">
                  Scheduled
                </span>
                <div className="text-[11px] text-slate-400 mt-1">Ready to send</div>
              </div>
            </div>
          </div>
        </div>

        {/* Backlinks Verification Summary */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Live Backlink Status</h3>
          
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between font-medium text-emerald-400">
                <span>techcrunch-news.com</span>
                <span>dofollow</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                Anchor: "Solospider AI platform"
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-emerald-500/20 rounded-xl">
              <div className="flex justify-between font-medium text-emerald-400">
                <span>searchengineland-demo.org</span>
                <span>dofollow</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                Anchor: "SEO automation tool"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
