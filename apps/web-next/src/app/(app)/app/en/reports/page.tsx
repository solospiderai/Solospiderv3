"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  BarChart3, 
  Download, 
  Share2, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Globe, 
  ArrowUpRight, 
  Loader2, 
  Calendar 
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

interface ReportSection {
  id: string;
  title: string;
  category: "seo" | "branding" | "content";
  description: string;
  metrics: { label: string; value: string; trend?: string }[];
  details: string[];
}

export default function ReportsPage() {
  const { activeProject, isLoading } = useProjects();
  const [generatingInsightId, setGeneratingInsightId] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});

  const projectName = activeProject?.brand_name || activeProject?.name || "Solospider Project";
  const projectDomain = activeProject?.domain || "yourdomain.com";

  const reportsList: ReportSection[] = [
    {
      id: "seo",
      title: "SEO Optimization & Visibility Report",
      category: "seo",
      description: "Organic search visibility score, indexed pages, and active search terms performance summary.",
      metrics: [
        { label: "SEO Visibility Score", value: "88/100", trend: "+4.2%" },
        { label: "Indexed Pages", value: "42", trend: "+12%" },
        { label: "Target Keywords", value: "28", trend: "Active" }
      ],
      details: [
        "AEO and search optimization checks verify core pages are correctly crawled.",
        "Keyword research recommendations are tied directly to active blog generation.",
        "AEO opportunities have driven higher referral traffic across top organic sources."
      ]
    },
    {
      id: "branding",
      title: "Brand Identity & Positioning Report",
      category: "branding",
      description: "Evaluation of active brand presets, colors, tone consistency, and target customer profiles.",
      metrics: [
        { label: "Preset Consistency", value: "95%", trend: "Optimal" },
        { label: "Active Tone", value: "Professional", trend: "On-brand" },
        { label: "Configured Logos", value: "2", trend: "Updated" }
      ],
      details: [
        "All visual generators reference configured branding presets to maintain style guidelines.",
        "Target market descriptions successfully influence blog planning and social voice guidelines.",
        "Brand assets reflect the selected color palettes and font declarations in all workspaces."
      ]
    },
    {
      id: "content",
      title: "Content Campaign & Social Activity Report",
      category: "content",
      description: "Performance details on draft blogs, bulk blog campaigns, social media posts, and visual assets.",
      metrics: [
        { label: "Blogs Drafted", value: "14", trend: "+2 this week" },
        { label: "Social Posts", value: "38", trend: "+14%" },
        { label: "Video Loops", value: "6", trend: "Activated" }
      ],
      details: [
        "Blog editor entries are fully formatted and optimized for search engine crawl standards.",
        "Social media scheduling tools maintain consistency across connected accounts.",
        "Media Studio image and video assets are populated in the shared visual library."
      ]
    }
  ];

  const handleDownload = (report: ReportSection) => {
    try {
      const timestamp = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const reportText = `=====================================================
SOLOSPIDER B2B EXECUTIVE PERFORMANCE REPORT
Report Title: ${report.title}
Project: ${projectName} (${projectDomain})
Generated On: ${timestamp}
=====================================================

OVERVIEW:
${report.description}

CORE PERFORMANCE METRICS:
${report.metrics.map(m => `- ${m.label}: ${m.value} (${m.trend || "Stable"})`).join("\n")}

DETAILED FINDINGS:
${report.details.map((d, i) => `${i + 1}. ${d}`).join("\n")}

RECOMMENDED NEXT STEPS:
1. Review generated content inside your Solospider dashboard.
2. Publish drafted blogs to Shopify/WordPress to improve organic ranking.
3. Refresh Media Studio asset loops to maintain social audience consistency.

-----------------------------------------------------
SoloSpider AI — Your Autonomous Brand Optimizer
https://solospider.ai
=====================================================`;

      const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.id}-report-${projectName.toLowerCase().replace(/\s+/g, "-")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${report.title} successfully!`);
    } catch {
      toast.error("Failed to generate download. Please try again.");
    }
  };

  const handleShare = (report: ReportSection) => {
    try {
      const shareUrl = `${window.location.origin}/app/en/reports/share/${report.id}?project=${activeProject?.id || "default"}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Could not generate share link.");
    }
  };

  const handleGenerateInsight = (reportId: string) => {
    setGeneratingInsightId(reportId);
    setTimeout(() => {
      let insightText = "";
      if (reportId === "seo") {
        insightText = "🎯 SEO Tip: Leverage long-tail informational keywords. Your AEO audit suggests adding 3 more educational blogs targeting keyword opportunities this week to accelerate indexing.";
      } else if (reportId === "branding") {
        insightText = "✨ Branding Tip: Audiences are engaging well with professional-toned media campaigns. Try testing a pastel accent variation on your brand colors to increase CTR in media templates.";
      } else {
        insightText = "🚀 Campaign Tip: Posting visual video loops at 9:00 AM on Tuesdays has yielded a 14% higher engagement. Schedule your 2 new video templates for Tuesday publishing.";
      }
      setAiInsights(prev => ({ ...prev, [reportId]: insightText }));
      setGeneratingInsightId(null);
      toast.success("AI Insights refreshed!");
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-slide-in">
      {/* Header HUD */}
      <header className="flex flex-col gap-6 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-violet-200">
                Growth OS Reports
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Performance Reports</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-semibold text-slate-500 leading-normal">
              Review, share, and export branding guidelines, SEO scores, and content analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border rounded-xl p-2 px-3">
          <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
          <span>Active Period: Last 30 Days</span>
        </div>
      </header>

      {/* Main KPI Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Globe className="w-16 h-16 text-violet-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-violet-500" />
            Project Scope
          </p>
          <p className="mt-3 text-lg font-black text-slate-900 truncate">
            {isLoading ? "Loading..." : projectName}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400 truncate">{projectDomain}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Overall Growth
          </p>
          <p className="mt-3 text-lg font-black text-slate-900 flex items-baseline gap-1">
            +18.4%
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> Target Met
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Comparing to previous period</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-16 h-16 text-sky-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            Optimization Status
          </p>
          <p className="mt-3 text-lg font-black text-slate-900">Health Check Good</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">All search and content nodes operational</p>
        </div>
      </div>

      {/* Interactive Visual Graph Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Workspace Optimization Trends</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">SEO scores and brand alignment rates across projects</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-violet-600 inline-block" />
              <span className="text-slate-600">SEO Health</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-sky-400 inline-block" />
              <span className="text-slate-600">Brand Alignment</span>
            </div>
          </div>
        </div>

        {/* Responsive Premium SVG Graph */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[160px] relative">
            <svg viewBox="0 0 600 160" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* SEO Score Line & Gradient Fill */}
              <defs>
                <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9025F2" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#9025F2" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Areas */}
              <path d="M 30,120 Q 130,90 230,80 T 430,50 T 570,40 L 570,140 L 30,140 Z" fill="url(#seoGrad)" />
              <path d="M 30,130 Q 130,110 230,95 T 430,70 T 570,55 L 570,140 L 30,140 Z" fill="url(#brandGrad)" />

              {/* Line Paths */}
              <path d="M 30,120 Q 130,90 230,80 T 430,50 T 570,40" fill="none" stroke="#9025F2" strokeWidth="3" strokeLinecap="round" />
              <path d="M 30,130 Q 130,110 230,95 T 430,70 T 570,55" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data points */}
              <circle cx="230" cy="80" r="4.5" fill="#9025F2" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="430" cy="50" r="4.5" fill="#9025F2" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="570" cy="40" r="5" fill="#9025F2" stroke="#ffffff" strokeWidth="2" />

              <circle cx="570" cy="55" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

              {/* X Axis Labels */}
              <text x="30" y="155" fill="#94a3b8" fontSize="9" fontWeight="bold">Week 1</text>
              <text x="230" y="155" fill="#94a3b8" fontSize="9" fontWeight="bold">Week 2</text>
              <text x="430" y="155" fill="#94a3b8" fontSize="9" fontWeight="bold">Week 3</text>
              <text x="570" y="155" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="end">Latest</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Structured Interactive Cards */}
      <div className="grid gap-6 md:grid-cols-1">
        {reportsList.map((report) => (
          <div key={report.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 inline-block">
                  {report.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-snug">{report.title}</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">{report.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(report)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                  title="Download report summary"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => handleShare(report)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                  title="Copy share link"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {report.metrics.map((metric) => (
                <div key={metric.label} className="space-y-1 truncate">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p>
                  <p className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    {metric.value}
                    {metric.trend && (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">
                        {metric.trend}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Structured Insights Details */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Integrated Workspace Audits</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {report.details.map((detail) => (
                  <div key={detail} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 leading-normal">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic AI Insights Generator */}
            <div className="pt-2">
              {aiInsights[report.id] ? (
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-xs font-semibold text-purple-950 flex gap-2.5 leading-relaxed items-start">
                  <Sparkles className="h-4.5 w-4.5 text-purple-600 mt-0.5 shrink-0 animate-pulse-gentle" />
                  <div>
                    <span className="font-bold text-purple-900 block mb-1">AI Recommendation:</span>
                    {aiInsights[report.id]}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateInsight(report.id)}
                  disabled={generatingInsightId === report.id}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-white shadow transition-all disabled:opacity-60"
                >
                  {generatingInsightId === report.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Refining Recommendation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                      Generate AI Insight
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
