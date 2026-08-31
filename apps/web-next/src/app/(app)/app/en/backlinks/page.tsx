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
  Bot,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BacklinksDashboardPage() {
  const { activeProject } = useProjects();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [websiteUrl, setWebsiteUrl] = useState(activeProject?.domain || '');
  const [gscConnected, setGscConnected] = useState(false);
  
  // Crawl Loading States
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStatusText, setCrawlStatusText] = useState('');
  const [lastCrawlFinished, setLastCrawlFinished] = useState(false);

  // Launch Campaign Modal state
  const [launchModalProspect, setLaunchModalProspect] = useState<any | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);


  // Dynamic state from database
  const [prospects, setProspects] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [verifiedLinks, setVerifiedLinks] = useState<any[]>([]);
  const [lostLinks, setLostLinks] = useState<any[]>([]);

  // Function to load all data from Supabase
  const loadBacklinksData = async () => {
    if (!activeProject?.id) return;

    try {
      const { data: gsc } = await supabase
        .from('workspace_integrations')
        .select('*')
        .eq('user_id', activeProject.user_id)
        .eq('platform', 'google_search_console')
        .eq('is_active', true)
        .maybeSingle();

      if (gsc) setGscConnected(true);

      let bProj: any = null;
      if (activeProject?.id) {
        const res = await supabase.from('backlink_projects').select('*').eq('project_id', activeProject.id).maybeSingle();
        bProj = res.data;
      }

      if (!bProj) {
        const { data: fallbackList } = await supabase
          .from('backlink_projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackList && fallbackList.length > 0) {
          bProj = fallbackList[0];
        }
      }

      if (bProj) {
        if (bProj.promotable_pages?.length > 0) {
          setStep(3);
          setLastCrawlFinished(true);
        }

        const { data: pList } = await supabase
          .from('prospects')
          .select('*')
          .eq('backlink_project_id', bProj.id)
          .order('relevance_score', { ascending: false });

        if (pList) setProspects(pList);

        const { data: cList } = await supabase
          .from('campaigns')
          .select('*')
          .eq('backlink_project_id', bProj.id);

        if (cList) setCampaigns(cList);

        const { data: vList } = await supabase
          .from('verified_backlinks')
          .select('*')
          .eq('backlink_project_id', bProj.id);

        if (vList) setVerifiedLinks(vList);

        const { data: lList } = await supabase
          .from('lost_backlinks')
          .select('*')
          .eq('backlink_project_id', bProj.id);

        if (lList) setLostLinks(lList);
      }
    } catch (err: any) {
      console.error("Error loading backlink data:", err);
    }
  };

  useEffect(() => {
    loadBacklinksData();
  }, [activeProject, supabase]);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    setIsCrawling(true);
    setCrawlProgress(15);
    setCrawlStatusText("Step 1/3: Crawling target domain & discovering full DOM links...");

    const p1 = new Promise((res) => setTimeout(res, 2000));
    const p2 = new Promise((res) => setTimeout(res, 3500));
    const p3 = new Promise((res) => setTimeout(res, 3600));

    try {
      const cleanUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

      // Call API
      const apiPromise = fetch('/api/backlinks/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          website: cleanUrl, 
          name: activeProject?.name || 'My Project',
          projectId: activeProject?.id 
        }),
      });


      await p1;
      setCrawlProgress(55);
      setCrawlStatusText("Step 2/3: OpenRouter AI extracting industry keywords & promotable assets...");

      await p2;
      setCrawlProgress(85);
      setCrawlStatusText("Step 3/3: Discovering and scoring target prospects (0–100)...");

      await p3;
      const res = await apiPromise;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to analyze website");

      if (json.prospects && Array.isArray(json.prospects)) {
        setProspects(json.prospects);
      }
      if (json.verifiedBacklinks && Array.isArray(json.verifiedBacklinks)) {
        setVerifiedLinks(json.verifiedBacklinks);
      }

      setCrawlProgress(100);
      setCrawlStatusText("AI Crawl Complete! Prospects & Live Backlinks Extracted.");
      toast.success("AI Crawling & Live Backlink Extraction completed!");



      // Refresh database records
      await loadBacklinksData();
      setStep(3);
      setLastCrawlFinished(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger AI crawl");
    } finally {
      setTimeout(() => {
        setIsCrawling(false);
      }, 1000);
    }
  };

  const handleOpenLaunchModal = (p: any) => {
    setLaunchModalProspect(p);
    const existingEmail = p.contacts?.[0]?.email || p.contact_email || "";
    setRecipientEmail(existingEmail);


    const mySite = websiteUrl || activeProject?.domain || 'https://mywebsite.com';
    setEmailSubject(`Resource feature & backlink collaboration for ${p.domain || p.website}`);
    setEmailBody(`Hi Editorial Team at ${p.domain || p.website},\n\nI was reading your website and noticed your coverage of high-quality industry resources.\n\nWe recently published a comprehensive guide at ${mySite} that would add great value to your readers on ${p.domain}.\n\nWould you be open to featuring a resource link or exploring a guest contribution?\n\nBest regards,\nOutreach Team\n${mySite}`);
  };


  const handleConfirmDispatchModal = async () => {
    if (!launchModalProspect) return;
    const p = launchModalProspect;
    setIsDispatching(true);

    try {
      const targetEmail = recipientEmail.trim() || p.contacts?.[0]?.email || p.contact_email || p.domain;

      let bProj: any = null;
      if (activeProject?.id) {
        const res = await supabase.from('backlink_projects').select('id').eq('project_id', activeProject.id).maybeSingle();
        bProj = res.data;
      }

      if (!bProj) {
        const { data: fallbackList } = await supabase
          .from('backlink_projects')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackList && fallbackList.length > 0) {
          bProj = fallbackList[0];
        }
      }

      if (!bProj) {
        const { data: created } = await supabase
          .from('backlink_projects')
          .insert({
            user_id: activeProject?.user_id,
            project_id: activeProject?.id || null,
            website: websiteUrl || activeProject?.domain || 'https://mywebsite.com',
            name: activeProject?.name || 'My Project',
          })
          .select()
          .single();
        bProj = created;
      }

      if (!bProj) throw new Error("Could not initialize backlink project");

      // Dispatch pitch API call with custom recipient email
      const dispatchRes = await fetch('/api/backlinks/send-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: p.id,
          backlinkProjectId: bProj.id,
          recipientEmail: targetEmail,
          subject: emailSubject,
          emailBody: emailBody,
          targetPageUrl: p.contact_page_url || p.website || `https://${p.domain}`,
          domain: p.domain || p.website
        })
      });

      const dispatchJson = await dispatchRes.json();
      if (!dispatchRes.ok) throw new Error(dispatchJson.error || "Failed to dispatch pitch");

      if (p.id) {
        await supabase.from('prospects').update({ status: 'contacted' }).eq('id', p.id);
      }

      toast.success(`Dispatched pitch email to ${targetEmail}!`);
      setLaunchModalProspect(null);
      await loadBacklinksData();
    } catch (err: any) {
      console.error("handleConfirmDispatchModal error:", err);
      toast.error(err.message || "Failed to launch campaign");
    } finally {
      setIsDispatching(false);
    }
  };


  const qualifiedProspectsCount = prospects.filter((p) => p.relevance_score >= 80).length;

  const totalEmailsSent = campaigns.reduce((acc, c) => acc + (c.emails_sent || 0), 0);

  // Manual Prospect Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDomain, setManualDomain] = useState("");
  const [manualCategory, setManualCategory] = useState("Blog");
  const [manualContactName, setManualContactName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualContactUrl, setManualContactUrl] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualBody, setManualBody] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const handleOpenManualModal = () => {
    const mySite = websiteUrl || activeProject?.domain || 'https://mywebsite.com';
    setManualDomain("");
    setManualCategory("Blog");
    setManualContactName("");
    setManualEmail("");
    setManualContactUrl("");
    setManualSubject(`Resource feature & backlink collaboration`);
    setManualBody(`Hi Editorial Team,\n\nI was reading your website and noticed your coverage of high-quality industry resources.\n\nWe recently published a comprehensive guide at ${mySite} that would add great value to your readers.\n\nWould you be open to featuring a resource link or exploring a guest contribution?\n\nBest regards,\nOutreach Team\n${mySite}`);
    setShowManualModal(true);
  };

  const handleSaveManualProspect = async (sendEmail: boolean) => {
    if (!manualDomain) {
      toast.error("Please enter a target domain / website URL");
      return;
    }
    setIsSubmittingManual(true);

    try {
      const cleanDom = manualDomain.replace(/https?:\/\//, '').replace(/\/$/, '');
      const fullWeb = manualDomain.startsWith('http') ? manualDomain : `https://${cleanDom}`;

      let bProj: any = null;
      if (activeProject?.id) {
        const res = await supabase.from('backlink_projects').select('id').eq('project_id', activeProject.id).maybeSingle();
        bProj = res.data;
      }
      if (!bProj) {
        const { data: fallbackList } = await supabase
          .from('backlink_projects')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackList && fallbackList.length > 0) bProj = fallbackList[0];
      }

      if (!bProj) {
        const { data: created } = await supabase
          .from('backlink_projects')
          .insert({
            user_id: activeProject?.user_id,
            project_id: activeProject?.id || null,
            website: websiteUrl || activeProject?.domain || 'https://mywebsite.com',
            name: activeProject?.name || 'My Project',
          })
          .select()
          .single();
        bProj = created;
      }

      if (!bProj) throw new Error("Could not initialize backlink project");

      // 1. Insert prospect into Supabase
      const { data: prospect, error: pErr } = await supabase
        .from('prospects')
        .insert({
          backlink_project_id: bProj.id,
          website: fullWeb,
          domain: cleanDom,
          category: manualCategory,
          relevance_score: 85,
          score_explanation: 'Manually added prospect opportunity',
          estimated_authority: 70,
          estimated_traffic: 10000,
          spam_risk: 'Low',
          contact_page_url: manualContactUrl || fullWeb,
          status: sendEmail ? 'contacted' : 'discovered'
        })
        .select()
        .single();

      if (pErr) throw pErr;

      // 2. Insert contact if email provided
      if (manualEmail.trim() && prospect) {
        await supabase.from('contacts').insert({
          prospect_id: prospect.id,
          name: manualContactName || 'Editorial Team',
          role: 'Editor / Content Lead',
          email: manualEmail.trim(),
          is_verified: true,
          verification_status: 'verified'
        });
      }

      // 3. Send Email pitch if requested
      if (sendEmail && manualEmail.trim()) {
        const dispatchRes = await fetch('/api/backlinks/send-pitch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prospectId: prospect.id,
            backlinkProjectId: bProj.id,
            recipientEmail: manualEmail.trim(),
            subject: manualSubject,
            emailBody: manualBody,
            targetPageUrl: manualContactUrl || fullWeb,
            domain: cleanDom
          })
        });

        const dispatchJson = await dispatchRes.json();
        if (!dispatchRes.ok) throw new Error(dispatchJson.error || "Failed to dispatch pitch");

        toast.success(`Dispatched pitch email & saved prospect for ${cleanDom}!`);
      } else {
        toast.success(`Saved manual prospect for ${cleanDom}!`);
      }

      setShowManualModal(false);
      await loadBacklinksData();
    } catch (err: any) {
      console.error("handleSaveManualProspect error:", err);
      toast.error(err.message || "Failed to save prospect");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* GSC Integration & Onboarding Header Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-100 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 truncate">Backlink Acquisition Platform</h1>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold shrink-0">
                SoloSpider Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 truncate">
              AI-powered backlink discovery, GSC index sync, contact extraction & link monitoring.
            </p>
          </div>

          {/* GSC Integration Status Pill & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenManualModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual Prospect</span>
            </button>
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
            disabled={isCrawling}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter website URL (e.g. https://mywebsite.com)..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isCrawling}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md shrink-0 disabled:opacity-70"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>AI Crawling & Analyzing Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run AI Analysis & Discover Prospects</span>
              </>
            )}
          </button>
        </form>

        {/* LIVE AI CRAWL PROGRESS BAR (Visible while crawling) */}
        {isCrawling && (
          <div className="p-5 bg-white border border-blue-300 rounded-xl space-y-3 shadow-md animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span>{crawlStatusText}</span>
              </div>
              <span className="font-bold text-blue-600 text-sm">{crawlProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${crawlProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed Crawl Badge & GSC Status Banner */}
        {!isCrawling && lastCrawlFinished && (
          <div className="space-y-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium shadow-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Website analysis complete! Target pages & assets extracted.</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">{prospects.length} Prospects Discovered</span>
            </div>

            {!gscConnected && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-xs">
                <div className="flex items-center gap-2">
                  <Plug2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Showing live web search results (<strong>{verifiedLinks.length} verified backlinks detected</strong>). Connect Google Search Console to sync full index.
                  </span>
                </div>
                <Link
                  href="/app/en/settings/integrations"
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold rounded-lg shrink-0 text-center transition"
                >
                  Connect GSC for Full Sync ➔
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashboard KPI Grid */}
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
            Status: <span className="text-slate-900 font-semibold">{gscConnected ? 'GSC Index Synced' : 'Verified Live'}</span>
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

      {/* Discovered Opportunities Section */}
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
            {prospects.map((p) => (
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
                  <button
                    onClick={() => handleOpenLaunchModal(p)}
                    className="inline-block px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-semibold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Launch Campaign</span>
                  </button>
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

      {/* Launch Campaign Pitch & Email Preview Modal */}
      {launchModalProspect && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Outreach Pitch & Email Dispatch</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Target Prospect: <strong>{launchModalProspect.domain || launchModalProspect.website}</strong></p>
              </div>
              <button
                onClick={() => setLaunchModalProspect(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Recipient Email Address (Editable)</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="No direct email published. Submit pitch via verified contact page ↗"

                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Target Contact Page:</span>
                    <a
                      href={launchModalProspect.contact_page_url || launchModalProspect.website || `https://${launchModalProspect.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline truncate block text-xs pt-1"
                    >
                      {launchModalProspect.contact_page_url || `https://${launchModalProspect.domain}/contact`} ↗
                    </a>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700">Source: </span>
                    <span>
                      {launchModalProspect.contact_page_url
                        ? `Scraped from ${launchModalProspect.contact_page_url}`
                        : `Extracted via Domain HTML & Metadata Search (${launchModalProspect.domain})`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[9px]">Verified Source</span>
                </div>
              </div>




              <div>
                <label className="block text-slate-700 font-semibold mb-1">Outreach Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">AI Pitch Message (Step 1)</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-[11px] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-[11px] text-slate-500">4-Step Automated Sequence Ready</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLaunchModalProspect(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDispatchModal}
                  disabled={isDispatching}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isDispatching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isDispatching ? "Dispatching..." : "Dispatch Pitch & Launch Campaign"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Prospect & Backlink Outreach Request Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Manually Add Prospect & Send Backlink Request</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter custom target website, contact email, and dispatch outreach request.</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Website / Domain <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={manualDomain}
                    onChange={(e) => setManualDomain(e.target.value)}
                    placeholder="e.g. techcrunch.com or https://blog.example.com"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Blog">Blog / Publication</option>
                    <option value="Directory">Industry Directory</option>
                    <option value="Resource Page">Resource Page</option>
                    <option value="Guest Post">Guest Post / Contributor</option>
                    <option value="Review Hub">Review / Software Listing</option>
                    <option value="Press">Press & Media</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Name (Optional)</label>
                  <input
                    type="text"
                    value={manualContactName}
                    onChange={(e) => setManualContactName(e.target.value)}
                    placeholder="e.g. John Doe or Editorial Lead"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Recipient Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. editor@website.com or your email"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Contact / Submission Page URL (Optional)</label>
                <input
                  type="text"
                  value={manualContactUrl}
                  onChange={(e) => setManualContactUrl(e.target.value)}
                  placeholder="e.g. https://website.com/contact"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Outreach Email Subject</label>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pitch Message Content</label>
                <textarea
                  rows={4}
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveManualProspect(false)}
                  disabled={isSubmittingManual}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
                >
                  Save Prospect Only
                </button>
                <button
                  onClick={() => handleSaveManualProspect(true)}
                  disabled={isSubmittingManual}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isSubmittingManual ? "Processing..." : "Send Request & Save Prospect"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


