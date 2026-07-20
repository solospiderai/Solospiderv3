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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BacklinksDashboardPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [websiteUrl, setWebsiteUrl] = useState(activeProject?.domain || '');
  const [gscConnected, setGscConnected] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Dynamic state from database
  const [prospects, setProspects] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [verifiedLinks, setVerifiedLinks] = useState<any[]>([]);
  const [lostLinks, setLostLinks] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any>(null);

  // Fetch real data from Supabase for current project
  useEffect(() => {
    async function loadBacklinksData() {
      if (!activeProject?.id) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        // Check GSC integration
        const { data: gsc } = await supabase
          .from('workspace_integrations')
          .select('*')
          .eq('user_id', activeProject.user_id)
          .eq('platform', 'google_search_console')
          .eq('is_active', true)
          .maybeSingle();

        if (gsc) setGscConnected(true);

        // Fetch backlink project if exists
        const { data: bProj } = await supabase
          .from('backlink_projects')
          .select('*')
          .eq('project_id', activeProject.id)
          .maybeSingle();

        if (bProj) {
          setProjectData(bProj);
          if (bProj.promotable_pages?.length > 0) setStep(3);

          // Fetch real prospects
          const { data: pList } = await supabase
            .from('prospects')
            .select('*')
            .eq('backlink_project_id', bProj.id)
            .order('relevance_score', { ascending: false });

          if (pList) setProspects(pList);

          // Fetch real campaigns
          const { data: cList } = await supabase
            .from('campaigns')
            .select('*')
            .eq('backlink_project_id', bProj.id);

          if (cList) setCampaigns(cList);

          // Fetch live verified links
          const { data: vList } = await supabase
            .from('verified_backlinks')
            .select('*')
            .eq('backlink_project_id', bProj.id);

          if (vList) setVerifiedLinks(vList);

          // Fetch lost links
          const { data: lList } = await supabase
            .from('lost_backlinks')
            .select('*')
            .eq('backlink_project_id', bProj.id);

          if (lList) setLostLinks(lList);
        }
      } catch (err: any) {
        console.error("Error loading backlink data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadBacklinksData();
  }, [activeProject, supabase]);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    setIsCrawling(true);
    setStep(2);

    try {
      const cleanUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

      // Create or update backlink project in Supabase
      const { data: newProj, error } = await supabase
        .from('backlink_projects')
        .upsert({
          user_id: activeProject?.user_id,
          project_id: activeProject?.id,
          website: cleanUrl,
          name: activeProject?.name || 'My Project',
        })
        .select()
        .single();

      if (error) throw error;

      // Call trigger API for crawling and prospect discovery
      await fetch('/api/backlinks/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: cleanUrl, name: activeProject?.name || 'My Project' }),
      });

      setProjectData(newProj);
      toast.success("AI Crawling & Prospect Discovery initiated!");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger AI crawl");
    } finally {
      setIsCrawling(false);
    }
  };

  const qualifiedProspectsCount = prospects.filter((p) => p.relevance_score >= 80).length;
  const totalEmailsSent = campaigns.reduce((acc, c) => acc + (c.emails_sent || 0), 0);

  return (
    <div className="space-y-8 text-slate-900">
      {/* GSC Integration & Onboarding Header Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-100 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Backlink Acquisition Platform</h1>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                SoloSpider Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              AI-powered backlink discovery, GSC index sync, contact extraction, personalized outreach & link monitoring.
            </p>
          </div>

          {/* GSC Integration Status Pill (Clickable) */}
          <div className="flex items-center gap-3">
            {gscConnected ? (
              <Link
                href="/app/en/settings/integrations"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Google Search Console Connected</span>
              </Link>
            ) : (
              <Link
                href="/app/en/settings/integrations"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Plug2 className="w-4 h-4 text-amber-600" />
                <span>Connect Google Search Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3-Step Guided Workflow Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            className={`p-4 rounded-xl border transition cursor-pointer ${
              step === 1 ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50/80 border-slate-200 text-slate-600'
            }`}
            onClick={() => setStep(1)}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Website Setup & GSC</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">Enter website URL & sync Google Search Console for live backlink indexing.</p>
          </div>

          <div
            className={`p-4 rounded-xl border transition cursor-pointer ${
              step === 2 ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50/80 border-slate-200 text-slate-600'
            }`}
            onClick={() => setStep(2)}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>AI Site Analysis</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">AI crawls homepage, blog, pricing, docs & resources to extract keywords & assets.</p>
          </div>

          <div
            className={`p-4 rounded-xl border transition cursor-pointer ${
              step === 3 ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50/80 border-slate-200 text-slate-600'
            }`}
            onClick={() => setStep(3)}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Prospect Discovery & Outreach</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">Scored prospect list (0–100) + 4-step AI sequence launch.</p>
          </div>
        </div>

        {/* Website Crawl Form */}
        <form onSubmit={handleStartCrawl} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter website URL (e.g. https://mywebsite.com)..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={isCrawling}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>AI Crawling Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run AI Analysis & Discover Prospects</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Dashboard KPI Grid (Interactive Clickable Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/app/en/backlinks/prospects" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-medium">Discovered Prospects</span>
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{prospects.length}</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{qualifiedProspectsCount} qualified (Score 80+)</span>
          </div>
        </Link>

        <Link href="/app/en/backlinks/campaigns" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-medium">Outreach Campaigns</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{campaigns.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total Emails Sent: <span className="text-slate-900 font-semibold">{totalEmailsSent}</span>
          </div>
        </Link>

        <Link href="/app/en/backlinks/verification" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-medium">Live Backlinks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{verifiedLinks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Status: <span className="text-slate-900 font-semibold">Verified Live</span>
          </div>
        </Link>

        <Link href="/app/en/backlinks/verification" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition">
          <div className="flex justify-between items-start text-slate-500 mb-2">
            <span className="text-xs font-medium">Lost Link Monitor</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{lostLinks.length}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Audit run every 7 days</div>
        </Link>
      </div>

      {/* Discovered Prospects Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Scored Prospect Opportunities (0–100)</span>
          </h3>
          <Link href="/app/en/backlinks/prospects" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
            <span>View All Prospects ({prospects.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {prospects.length > 0 ? (
          <div className="space-y-3 text-xs">
            {prospects.slice(0, 5).map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{p.domain || p.website}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px]">{p.category || 'Blog'}</span>
                  </div>
                  <p className="text-slate-600 max-w-xl text-[11px]">
                    Reason: {p.score_explanation || 'Relevant industry publication with target keyword alignment.'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-emerald-600 font-bold text-base">{p.relevance_score || 75} Score</div>
                  <Link
                    href="/app/en/backlinks/campaigns"
                    className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
                  >
                    Launch Campaign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-3">
            <Search className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">No prospects discovered yet.</p>
            <p>Enter your website URL above and click <strong>Run AI Analysis & Discover Prospects</strong> to start finding high-relevance backlink opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
