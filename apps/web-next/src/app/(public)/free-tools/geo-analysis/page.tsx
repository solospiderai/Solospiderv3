"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Loader2, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  UserCheck, 
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface EeatCategory {
  score: number;
  passedCount: number;
  totalCount: number;
  status: "Poor" | "Needs Work" | "Good";
  working: string[];
  missing: string[];
  improve: string[];
}

interface AnalysisResult {
  url: string;
  domain: string;
  updatedAt: string;
  checklist: {
    ssl: boolean;
    privacyPolicy: boolean;
    termsOfService: boolean;
    organizationSchema: boolean;
    twitterCard: boolean;
    copyright: boolean;
    contactDetails: boolean;
    internalLinks: boolean;
    g2: boolean;
    reddit: boolean;
    capterra: boolean;
    linkedin: boolean;
    crunchbase: boolean;
    trustpilot: boolean;
    x: boolean;
    youtube: boolean;
  };
  analysis: {
    scores: {
      experience: number;
      expertise: number;
      authority: number;
      trust: number;
    };
    categories: {
      experience: EeatCategory;
      expertise: EeatCategory;
      authority: EeatCategory;
      trust: EeatCategory;
    };
  };
}

export default function GeoAnalysisPage() {
  const [urlInput, setUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>("expertise");

  // Handle running the audit
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/free-tools/geo-analysis?url=${encodeURIComponent(urlInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze URL.");
      }
      setResult(data);
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check the URL and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to draw Radar Chart dynamically using custom SVG
  const renderRadarChart = (scores: { experience: number; expertise: number; authority: number; trust: number }) => {
    const center = 150;
    const rMax = 100;
    
    // Scale scores to radius
    const rExp = (scores.experience / 100) * rMax;
    const rExpert = (scores.expertise / 100) * rMax;
    const rAuth = (scores.authority / 100) * rMax;
    const rTrust = (scores.trust / 100) * rMax;

    // Vertices coordinates: Top = Experience, Right = Expertise, Bottom = Authority, Left = Trust
    // Angle: Top = -90 (or 270 deg), Right = 0, Bottom = 90, Left = 180
    const points = [
      { x: center, y: center - rExp }, // Experience (Top)
      { x: center + rExpert, y: center }, // Expertise (Right)
      { x: center, y: center + rAuth }, // Authority (Bottom)
      { x: center - rTrust, y: center }, // Trust (Left)
    ];

    const polygonPointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <svg width="300" height="300" className="mx-auto select-none">
        {/* Background Grid Circles */}
        {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
          <circle 
            key={i} 
            cx={center} 
            cy={center} 
            r={rMax * scale} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.08)" 
            strokeWidth="1.5" 
          />
        ))}

        {/* Axes lines */}
        <line x1={center} y1={center - rMax} x2={center} y2={center + rMax} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <line x1={center - rMax} y1={center} x2={center + rMax} y2={center} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />

        {/* Outer Grid Labels */}
        <text x={center} y={center - rMax - 12} textAnchor="middle" className="text-[12px] font-black fill-white/80">Experience</text>
        <text x={center + rMax + 14} y={center + 4} textAnchor="start" className="text-[12px] font-black fill-white/80">Expertise</text>
        <text x={center} y={center + rMax + 20} textAnchor="middle" className="text-[12px] font-black fill-white/80">Authority</text>
        <text x={center - rMax - 14} y={center + 4} textAnchor="end" className="text-[12px] font-black fill-white/80">Trust</text>

        {/* Filled Data Polygon */}
        <polygon 
          points={polygonPointsStr} 
          fill="rgba(168, 85, 247, 0.35)" 
          stroke="rgb(168, 85, 247)" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />

        {/* Data Vertices Points */}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="5" fill="rgb(192, 132, 252)" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBadgeColor = (status: string) => {
    if (status === "Good") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    if (status === "Needs Work") return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    return "bg-red-500/15 text-red-400 border border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-[#09070f] text-white overflow-x-hidden font-sans selection:bg-purple-500/20 selection:text-purple-300">
      <MarketingNavbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-4 max-w-6xl mx-auto text-center">
        {/* Background Ambient Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-4 py-1.5 mb-8">
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-purple-400">Public Tool</span>
          <span className="h-1 w-1 rounded-full bg-purple-400" />
          <span className="text-[12px] font-semibold text-slate-350">Free E-E-A-T Score Checker</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
          Free <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">GEO Analysis</span> Tool
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg mb-10 leading-relaxed">
          Analyze your website's Experience, Expertise, Authoritativeness, and Trustworthiness signals. Get instant recommendations to rank higher on Google and AI search platforms.
        </p>

        {/* URL Input Form */}
        <form onSubmit={handleAnalyze} className="max-w-xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white/5 border border-white/10 p-2 sm:rounded-full">
            <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
              <span className="select-none font-bold text-slate-500 text-sm">https://</span>
              <input 
                type="text" 
                placeholder="example.com" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={analyzing}
                className="w-full bg-transparent ml-1 text-white text-sm font-semibold placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={analyzing || !urlInput}
              className="rounded-full bg-purple-600 px-8 py-3 text-sm font-black tracking-wide text-white hover:bg-purple-500 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Site...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze GEO
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-500/25 text-red-300 text-xs font-semibold max-w-md mx-auto">
              ⚠️ {error}
            </div>
          )}
        </form>
      </section>

      {/* Analysis Results Dashboard */}
      {result && (
        <section id="results-section" className="py-12 border-t border-white/5 bg-white/[0.01] px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-black">GEO Analysis Results</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                  <span className="font-semibold text-white">{result.domain}</span>
                  <span>•</span>
                  <span>Last updated: {result.updatedAt}</span>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="self-start sm:self-center border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Save Report
              </button>
            </div>

            {/* Radar chart & Score summary grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              {/* Radar chart */}
              <div className="lg:col-span-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 w-full text-left">
                  E-E-A-T Score Breakdown
                </h3>
                {renderRadarChart(result.analysis.scores)}
              </div>

              {/* Individual Score cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Expertise", score: result.analysis.scores.expertise, icon: Award },
                  { name: "Experience", score: result.analysis.scores.experience, icon: UserCheck },
                  { name: "Authoritativeness", score: result.analysis.scores.authority, icon: BookOpen },
                  { name: "Trustworthiness", score: result.analysis.scores.trust, icon: ShieldCheck },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[13px] font-black uppercase tracking-wider text-slate-400">{item.name}</span>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-8">
                        <span className={`text-4xl font-black ${getScoreColor(item.score)}`}>{item.score}</span>
                        <span className="text-slate-500 font-bold text-sm">/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Checklist */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 mb-12">
              <div className="mb-6">
                <h3 className="text-lg font-black">Technical Audit Checklist</h3>
                <p className="text-xs font-semibold text-slate-400">Essential structural metrics for search credibility and trustworthiness</p>
              </div>

              {/* Missing Details Grid */}
              <div className="mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Missing Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Privacy Policy", present: result.checklist.privacyPolicy },
                    { label: "Terms of Service", present: result.checklist.termsOfService },
                    { label: "Organization Schema", present: result.checklist.organizationSchema },
                    { label: "Twitter Card", present: result.checklist.twitterCard },
                    { label: "GEO Platform: G2", present: result.checklist.g2 },
                    { label: "GEO Platform: Reddit", present: result.checklist.reddit },
                    { label: "GEO Platform: Capterra", present: result.checklist.capterra },
                    { label: "GEO Platform: LinkedIn", present: result.checklist.linkedin },
                    { label: "GEO Platform: CrunchBase", present: result.checklist.crunchbase },
                    { label: "GEO Platform: TrustPilot", present: result.checklist.trustpilot },
                    { label: "GEO Platform: X (Twitter)", present: result.checklist.x },
                    { label: "GEO Platform: YouTube", present: result.checklist.youtube },
                  ]
                    .filter(item => !item.present)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5">
                        <span className="text-xs font-bold text-slate-300">{item.label}</span>
                        <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-black text-red-400 uppercase">Missing</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Details Found */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Details Found</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "SSL Certificate", present: result.checklist.ssl },
                    { label: "Contact Details", present: result.checklist.contactDetails },
                    { label: "Copyright", present: result.checklist.copyright },
                    { label: "Internal Links", present: result.checklist.internalLinks },
                    { label: "Privacy Policy", present: result.checklist.privacyPolicy },
                    { label: "Terms of Service", present: result.checklist.termsOfService },
                    { label: "Organization Schema", present: result.checklist.organizationSchema },
                    { label: "Twitter Card", present: result.checklist.twitterCard },
                    { label: "GEO Platform: G2", present: result.checklist.g2 },
                    { label: "GEO Platform: Reddit", present: result.checklist.reddit },
                    { label: "GEO Platform: Capterra", present: result.checklist.capterra },
                    { label: "GEO Platform: LinkedIn", present: result.checklist.linkedin },
                    { label: "GEO Platform: CrunchBase", present: result.checklist.crunchbase },
                    { label: "GEO Platform: TrustPilot", present: result.checklist.trustpilot },
                    { label: "GEO Platform: X (Twitter)", present: result.checklist.x },
                    { label: "GEO Platform: YouTube", present: result.checklist.youtube },
                  ]
                    .filter(item => item.present)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5">
                        <span className="text-xs font-bold text-slate-300">{item.label}</span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 uppercase">Present</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Detailed Accordions for E-E-A-T */}
            <div className="space-y-4">
              <h3 className="text-lg font-black mb-4">Detailed Analysis</h3>

              {Object.entries(result.analysis.categories).map(([key, category]) => {
                const isOpen = openCategory === key;
                return (
                  <div key={key} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                    {/* Header trigger */}
                    <button 
                      onClick={() => setOpenCategory(isOpen ? null : key)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <h4 className="text-base font-black capitalize">{key}</h4>
                        <span className={`text-sm font-extrabold ${getScoreColor(category.score)}`}>{category.score}/100</span>
                        <span className="text-[10px] text-slate-400 font-bold">{category.passedCount}/{category.totalCount} signals passed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getScoreBadgeColor(category.status)}`}>
                          {category.status}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {/* Content */}
                    {isOpen && (
                      <div className="px-6 pb-8 pt-4 border-t border-white/5">
                        {/* Working & Missing side-by-side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              What's Working
                            </h5>
                            <ul className="space-y-2">
                              {category.working.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-350 leading-relaxed pl-1.5 border-l border-emerald-500/30">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              What's Missing
                            </h5>
                            <ul className="space-y-2">
                              {category.missing.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-350 leading-relaxed pl-1.5 border-l border-red-500/30">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* How to Improve */}
                        <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-2xl p-5">
                          <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            How to Improve
                          </h5>
                          <ol className="space-y-2.5 list-decimal list-inside text-xs text-slate-300 leading-relaxed">
                            {category.improve.map((item, idx) => (
                              <li key={idx} className="pl-1">
                                {item}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setResult(null);
                  setUrlInput("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-full border border-purple-500/20 hover:border-purple-500/30 hover:bg-purple-500/5 px-6 py-2.5 text-xs font-black tracking-wider text-purple-400 uppercase transition-all"
              >
                Analyze Another Page
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Understand Content Quality Section */}
      <section className="py-20 px-4 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 mb-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Features</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black mb-4">Understand Your Content Quality</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-16">
            Our GEO Analysis tool evaluates your website content against Google's E-E-A-T guidelines to make sure you rank in AI search queries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Deep Content Analysis", desc: "Scans your page for signals that demonstrate first-hand experience and expertise." },
              { title: "Comprehensive Scoring", desc: "Get individual scores for Experience, Expertise, Authoritativeness, and Trustworthiness." },
              { title: "Actionable Recommendations", desc: "Receive prioritized suggestions to improve your E-E-A-T signals." },
              { title: "Authority Signals", desc: "Identifies author credentials, citations, and backlink quality indicators." },
              { title: "Trust Factors", desc: "Checks for security, privacy policies, and transparency signals." },
              { title: "SEO Insights", desc: "Understand how Google evaluates your content quality and what to improve." }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#120f20]/50 border border-white/5 rounded-2xl p-6 text-center hover:border-purple-500/20 hover:bg-[#120f20]/80 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-all">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 px-4 border-t border-white/5 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 mb-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">How it works</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">
                Analyze &amp; Improve Your Content's E-E-A-T Signals
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Evaluate experience, expertise, authority, and trust across any webpage. Get clear scores and actionable insights to strengthen content quality and improve search performance.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {[
                { step: "01", title: "Enter Your Website URL", desc: "Paste any publicly accessible website and start analyzing E-E-A-T signals instantly." },
                { step: "02", title: "Content Analysis", desc: "Scans experience, expertise, authority, and trust to identify strong and weak signals." },
                { step: "03", title: "Get Your Scores", desc: "View category-wise E-E-A-T scores and see exactly what is present and what is missing." },
                { step: "04", title: "Improve &amp; Optimize", desc: "Get prioritized improvement suggestions to strengthen content quality and search rankings." }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#120f20]/50 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all flex gap-4 items-start">
                  <span className="text-2xl font-black text-purple-400">{item.step}</span>
                  <div>
                    <h3 className="font-bold text-base mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools Section */}
      <section className="py-20 px-4 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xl md:text-2xl font-black">Explore Free Tools</h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
              View All <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Domain Rating Checker", desc: "Check any website's Domain Rating (DR) score instantly. Understand your site's SEO authority." },
              { title: "SEO Audit", desc: "Get a comprehensive SEO audit of your website with actionable recommendations." },
              { title: "JSON-LD Generator", desc: "Generate Schema.org JSON-LD from any URL or content to boost AI search citations." }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#120f20]/50 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 hover:bg-[#120f20]/80 transition-all group flex flex-col justify-between h-56">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-purple-400 uppercase tracking-wider mt-4">
                  Try for Free <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 px-4 border-t border-white/5 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 mb-6">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">FAQs</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-4">Have Questions?</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Clear answers to common questions about our tools, data, and how the analysis works.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar list of tools */}
            <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
              {[
                "Domain Rating Checker",
                "SEO Audit",
                "Page Speed Analyzer",
                "Keyword Research",
                "Backlink Checker",
                "XML Sitemap Generator",
                "Sitemap Finder & Checker",
                "Sitemap Validator"
              ].map((tool, idx) => (
                <div key={idx} className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between">
                  {tool}
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="lg:col-span-8 space-y-4">
              {[
                {
                  q: "What is GEO (Generative Engine Optimization)?",
                  a: "GEO is the practice of optimizing your content to appear in AI-generated responses from ChatGPT, Claude, Perplexity AI, Google Gemini, and Microsoft Copilot. While traditional SEO focuses on ranking in search results, GEO focuses on being cited when AI systems generate answers."
                },
                {
                  q: "How does SoloSpider's GEO Analysis work?",
                  a: "The tool crawls your homepage and checks for over 15 structural and E-E-A-T validation tags. It then extracts your headings, content, and schema declarations and passes them to our E-E-A-T analysis engine (powered by Gemini) to calculate precise quality ratings."
                },
                {
                  q: "How does GEO Analysis evaluate my content?",
                  a: "It checks for 'Experience' (firsthand insights, imagery, unique details), 'Expertise' (professional terminology, lack of placeholders, clear arguments), 'Authoritativeness' (brand mentions, linked reviews, external links), and 'Trustworthiness' (presence of privacy/terms sheets, SSL certificate, copyright protection, transparent contact handles)."
                },
                {
                  q: "How is GEO different from traditional SEO?",
                  a: "Traditional SEO optimizes for keyword positions on Google search results pages. GEO optimizes for citation probability in LLM responses. AI search models prefer content that provides high-quality sources, verified claims, domain-specific terminology, and explicit trust indicators."
                }
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-200">{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 border-t border-white/5">
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
