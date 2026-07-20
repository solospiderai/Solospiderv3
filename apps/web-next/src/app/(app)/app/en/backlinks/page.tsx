'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Globe,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Layers,
  Plug2,
} from 'lucide-react';

export default function ResponaBacklinksDashboardPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [websiteUrl, setWebsiteUrl] = useState(activeProject?.domain || '');
  const [gscConnected, setGscConnected] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);

  const [crawledData, setCrawledData] = useState<{
    industry?: string;
    pages?: string[];
    keywords?: string[];
  } | null>(null);

  // Check Google Search Console Integration Status from database
  useEffect(() => {
    async function checkGsc() {
      if (!activeProject) return;
      const { data } = await supabase
        .from('workspace_integrations')
        .select('*')
        .eq('user_id', activeProject.user_id)
        .eq('platform', 'google_search_console')
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setGscConnected(true);
      }
    }
    checkGsc();
  }, [activeProject]);

  const handleStartCrawl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;
    setIsCrawling(true);
    setStep(2);

    // Simulate Step 2 AI Crawl of Homepage, Blog, Pricing, Docs, Services
    setTimeout(() => {
      setCrawledData({
        industry: 'B2B SaaS & AI Automation',
        pages: ['/blog', '/pricing', '/docs', '/services', '/resources'],
        keywords: ['AI SEO', 'Content Generator', 'Backlink Outreach', 'Rank Tracking'],
      });
      setIsCrawling(false);
      setStep(3);
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* GSC Integration & Onboarding Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/20 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Backlink Acquisition Platform</h1>
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
                Respona Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              AI-powered backlink discovery, GSC index sync, contact extraction, personalized outreach & link monitoring.
            </p>
          </div>

          {/* GSC Integration Status Pill */}
          <div className="flex items-center gap-3">
            {gscConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Google Search Console Connected</span>
              </div>
            ) : (
              <Link
                href="/app/en/settings/integrations"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl text-xs font-semibold transition"
              >
                <Plug2 className="w-4 h-4" />
                <span>Connect Google Search Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3-Step Respona Workflow Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            className={`p-4 rounded-xl border transition ${
              step === 1 ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Website Setup & GSC</span>
            </div>
            <p className="text-[11px] leading-relaxed">Enter website URL & sync Google Search Console for live backlink indexing.</p>
          </div>

          <div
            className={`p-4 rounded-xl border transition ${
              step === 2 ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>AI Site Analysis</span>
            </div>
            <p className="text-[11px] leading-relaxed">AI crawls homepage, blog, pricing, docs & resources to extract keywords & assets.</p>
          </div>

          <div
            className={`p-4 rounded-xl border transition ${
              step === 3 ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Prospect Discovery & Outreach</span>
            </div>
            <p className="text-[11px] leading-relaxed">Scored prospect list (0–100) + 4-step AI sequence launch.</p>
          </div>
        </div>

        {/* Website Crawl Form */}
        <form onSubmit={handleStartCrawl} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter website URL (e.g. https://mywebsite.com)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isCrawling}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isCrawling ? 'AI Crawling Website...' : 'Run AI Analysis & Discover Prospects'}</span>
          </button>
        </form>
      </div>

      {/* Crawled Results Summary (When Step 2/3 complete) */}
      {crawledData && (
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AI Website Extraction Complete</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Extracted Industry:</span>
              <div className="text-white font-semibold mt-0.5">{crawledData.industry}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Crawled Page Assets:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {crawledData.pages?.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Extracted Target Keywords:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {crawledData.keywords?.map((k) => (
                  <span key={k} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px]">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Discovered Prospects</span>
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">48</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>32 qualified (Score 80+)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Outreach Sent</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">124</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Open Rate: <span className="text-white font-medium">42.5%</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Live Backlinks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">6</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Authority: <span className="text-white font-medium">58 DR</span> (Est.)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-start text-slate-400 mb-2">
            <span className="text-xs font-medium">Lost Link Monitor</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">1</div>
          <div className="text-[11px] text-amber-300 mt-1">Audit run every 7 days</div>
        </div>
      </div>

      {/* Discovered Opportunities vs GSC Indexed Backlinks Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Scored Prospect Opportunities (0–100)</span>
          </h3>
          <Link href="/app/en/backlinks/prospects" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
            <span>View All Prospects</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Opportunity Card List */}
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>aisoftwareinsider.com</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px]">SaaS Directory</span>
              </div>
              <p className="text-slate-400 max-w-xl text-[11px]">
                Reason: Very relevant AI SaaS blog. Publishes weekly, accepts guest posts & resource submissions.
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-emerald-400 font-bold text-base">94 Score</div>
              <Link
                href="/app/en/backlinks/campaigns"
                className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition"
              >
                Launch Campaign
              </Link>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>searchenginetactics.io</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px]">Blog</span>
              </div>
              <p className="text-slate-400 max-w-xl text-[11px]">
                Reason: Niche SEO & marketing publication. High engagement on automation topics. Verified contact found.
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-emerald-400 font-bold text-base">88 Score</div>
              <Link
                href="/app/en/backlinks/campaigns"
                className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition"
              >
                Launch Campaign
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
