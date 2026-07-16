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
  ChevronRight,
  Printer,
  Globe,
  Plus,
  Compass,
  FileText,
  Activity,
  Link2,
  FileCode
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
    const points = [
      { x: center, y: center - rExp }, // Experience (Top)
      { x: center + rExpert, y: center }, // Expertise (Right)
      { x: center, y: center + rAuth }, // Authority (Bottom)
      { x: center - rTrust, y: center }, // Trust (Left)
    ];

    const polygonPointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <div className="relative w-[300px] h-[300px] mx-auto select-none scale-90 sm:scale-100 transition-all duration-300">
        <svg width="300" height="300" className="mx-auto">
          {/* Background Grid Circles */}
          {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
            <circle 
              key={i} 
              cx={center} 
              cy={center} 
              r={rMax * scale} 
              fill="none" 
              className="stroke-slate-200/50 dark:stroke-white/10" 
              strokeWidth="1.5" 
            />
          ))}

          {/* Axes lines */}
          <line x1={center} y1={center - rMax} x2={center} y2={center + rMax} className="stroke-slate-300/40 dark:stroke-white/10" strokeWidth="1.5" />
          <line x1={center - rMax} y1={center} x2={center + rMax} y2={center} className="stroke-slate-300/40 dark:stroke-white/10" strokeWidth="1.5" />

          {/* Outer Grid Labels */}
          <text x={center} y={center - rMax - 12} textAnchor="middle" className="text-[11px] font-black fill-slate-500 dark:fill-slate-400 uppercase tracking-widest">Experience</text>
          <text x={center + rMax + 14} y={center + 4} textAnchor="start" className="text-[11px] font-black fill-slate-500 dark:fill-slate-400 uppercase tracking-widest">Expertise</text>
          <text x={center} y={center + rMax + 22} textAnchor="middle" className="text-[11px] font-black fill-slate-500 dark:fill-slate-400 uppercase tracking-widest">Authority</text>
          <text x={center - rMax - 14} y={center + 4} textAnchor="end" className="text-[11px] font-black fill-slate-500 dark:fill-slate-400 uppercase tracking-widest">Trust</text>

          {/* Filled Data Polygon */}
          <polygon 
            points={polygonPointsStr} 
            className="animate-draw-polygon fill-orange-500/15 dark:fill-orange-500/25 stroke-orange-500" 
            strokeWidth="3" 
            strokeLinejoin="round"
          />

          {/* Data Vertices Points */}
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="5" className="fill-orange-500 stroke-white dark:stroke-[#09070f]" strokeWidth="2" />
          ))}
        </svg>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-550 dark:text-emerald-400";
    if (score >= 50) return "text-amber-550 dark:text-amber-400";
    return "text-rose-550 dark:text-rose-455";
  };

  const getScoreBadgeColor = (status: string) => {
    if (status === "Good") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
    if (status === "Needs Work") return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
  };

  // Grid wrap blueprint template section wrapper
  const renderSectionWrapper = (content: React.ReactNode, hasTopBorder = false) => {
    return (
      <section className="relative z-10 w-full animate-fade-in-up">
        {hasTopBorder && <div className="w-full h-px bg-slate-200/80 dark:bg-slate-800/40" />}
        <div className="grid w-full grid-cols-1 lg:grid-cols-[1fr_10fr_1fr] xl:grid-cols-[1fr_1fr_10fr_1fr_1fr] bg-slate-100/50 dark:bg-[#07050e]">
          {/* Column Grid Left margins */}
          <div className="relative hidden xl:block bg-slate-100/50 dark:bg-[#07050e]"><div className="absolute inset-0 bg-[#fbfbfb] dark:bg-[#0c0a1a]/50" /></div>
          <div className="relative hidden lg:block bg-slate-100/50 dark:bg-[#07050e]">
            <div className="absolute inset-0 rounded-r-2xl bg-[#fbfbfb] dark:bg-[#0c0a1a]/50">
              <div className="absolute top-0 right-0 bottom-0 z-10 w-px bg-slate-200/60 dark:bg-slate-800/30" />
            </div>
          </div>

          {/* Main Workspace Column */}
          <div className="relative w-full min-w-0 bg-slate-100/50 dark:bg-[#07050e]">
            <div className="w-full min-w-0 lg:rounded-2xl bg-[#fbfbfb] dark:bg-[#0c0a1a]/50 shadow-sm border-x border-slate-200/40 dark:border-slate-800/20">
              {content}
            </div>
          </div>

          {/* Column Grid Right margins */}
          <div className="relative hidden lg:block bg-slate-100/50 dark:bg-[#07050e]">
            <div className="absolute inset-0 rounded-l-2xl bg-[#fbfbfb] dark:bg-[#0c0a1a]/50">
              <div className="absolute top-0 bottom-0 left-0 z-10 w-px bg-slate-200/60 dark:bg-slate-800/30" />
            </div>
          </div>
          <div className="relative hidden xl:block bg-slate-100/50 dark:bg-[#07050e]"><div className="absolute inset-0 bg-[#fbfbfb] dark:bg-[#0c0a1a]/50" /></div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09070f] text-slate-900 dark:text-white overflow-x-hidden font-sans selection:bg-orange-500/20 selection:text-orange-600 transition-colors duration-300">
      <MarketingNavbar />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes drawPolygon {
          from {
            transform: scale(0.92);
            opacity: 0.3;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-draw-polygon {
          transform-origin: center;
          animation: drawPolygon 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .blueprint-grid {
          background-image: linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .blueprint-grid {
          background-image: linear-gradient(rgba(99, 102, 241, 0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.025) 1px, transparent 1px);
        }
      `}</style>

      {/* Main hero background section */}
      <section className="relative z-10 w-full blueprint-grid">
        <div className="grid w-full grid-cols-1 lg:grid-cols-[1fr_10fr_1fr] xl:grid-cols-[1fr_1fr_10fr_1fr_1fr] bg-slate-100/30 dark:bg-[#07050e]/30">
          <div className="hidden xl:block" />
          <div className="hidden lg:block border-r border-slate-200/40 dark:border-slate-800/10" />
          <div className="w-full min-w-0 px-4 sm:px-8 py-20 lg:py-24 max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold text-slate-405 dark:text-slate-500 mb-8 animate-fade-in-up">
              <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-350 transition-colors">Home</Link>
              <span>/</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer">Free Tools</span>
              <span>/</span>
              <span className="text-orange-500 dark:text-orange-400 font-extrabold">GEO Analysis</span>
            </nav>

            {/* Tool Icon Visual */}
            <div className="relative flex items-center justify-center mb-8 animate-fade-in-up">
              <div 
                className="relative z-10 rounded-[36px] bg-white dark:bg-[#130f26] p-5 shadow-xl border border-slate-200/50 dark:border-slate-800/40"
                style={{
                  boxShadow: '0 20px 40px -15px rgba(249, 115, 22, 0.12), 0 0 50px 10px rgba(249, 115, 22, 0.05)'
                }}
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md">
                  <Compass className="h-9.5 w-9.5 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Title & Sub */}
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
              <h1 className="text-4xl md:text-5.5xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white mb-5">
                Free <span className="text-orange-500 dark:text-orange-400">GEO Analysis</span> Tool
              </h1>
              <p className="text-slate-505 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                Analyze your website's Experience, Expertise, Authoritativeness, and Trustworthiness signals. Get instant E-E-A-T reports and actionable recommendations to optimize for AI engines.
              </p>
            </div>

            {/* URL Input Form */}
            <div className="max-w-xl mx-auto animate-fade-in-up">
              <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                <span>EEAT CRAWLER ACTIVE</span>
                <span>
                  <span className="text-orange-500 dark:text-orange-400">5</span>/5 FREE CHECKS LEFT
                </span>
              </div>
              
              <form onSubmit={handleAnalyze} className="relative z-10">
                <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white dark:bg-[#120f24] border border-slate-200 dark:border-slate-800/80 p-2 sm:rounded-full shadow-lg shadow-slate-100 dark:shadow-none focus-within:border-orange-500/50 dark:focus-within:border-orange-500/50 transition-all duration-205">
                  <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
                    <span className="select-none font-bold text-slate-400 dark:text-slate-500 text-sm">https://</span>
                    <input 
                      type="text" 
                      placeholder="example.com" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={analyzing}
                      className="w-full bg-transparent ml-1.5 text-slate-800 dark:text-white text-sm font-bold placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={analyzing || !urlInput.trim()}
                    className="w-full sm:w-auto rounded-xl sm:rounded-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] px-7 py-3 text-sm font-black tracking-wide text-white transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-500/10"
                  >
                    {analyzing ? (
                      <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Analyzing GEO...
                      </>
                    ) : (
                      <>
                      <Search className="w-4 h-4 text-white" />
                      Analyze GEO
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold max-w-md mx-auto text-center animate-fade-in-up">
                    ⚠️ {error}
                  </div>
                )}
              </form>
            </div>
          </div>
          <div className="hidden lg:block border-l border-slate-200/40 dark:border-slate-800/10" />
          <div className="hidden xl:block" />
        </div>
      </section>

      {/* Analysis Results Dashboard */}
      {result && (
        <section id="results-section" className="w-full bg-slate-100/50 dark:bg-[#07050e] py-12 px-4 transition-all duration-500">
          <div className="max-w-5xl mx-auto animate-fade-in-up">
            {/* Results Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-slate-200/60 dark:border-slate-800/40">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400">AUDIT COMPLETED</span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">GEO Analysis Results</h2>
                <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-405 dark:text-slate-500">
                  <span className="text-slate-600 dark:text-slate-355">{result.domain}</span>
                  <span>•</span>
                  <span>Checked: {result.updatedAt}</span>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="self-start sm:self-center border border-slate-200 dark:border-slate-800 hover:bg-slate-105 dark:hover:bg-slate-800 bg-white dark:bg-[#130f24] px-4.5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all active:scale-97 flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Save Report
              </button>
            </div>

            {/* Radar chart & Score summary grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              {/* Radar chart */}
              <div className="lg:col-span-6 bg-white dark:bg-[#0e0c1f] border border-slate-200/60 dark:border-slate-800/30 rounded-3xl p-6 flex flex-col justify-center items-center shadow-xs">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 w-full text-left">
                  E-E-A-T Quality Dimensions
                </h3>
                {renderRadarChart(result.analysis.scores)}
              </div>

              {/* Individual Score cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Expertise", score: result.analysis.scores.expertise, icon: Award, label: "Professional trust" },
                  { name: "Experience", score: result.analysis.scores.experience, icon: UserCheck, label: "First-hand signals" },
                  { name: "Authoritativeness", score: result.analysis.scores.authority, icon: BookOpen, label: "Platform influence" },
                  { name: "Trustworthiness", score: result.analysis.scores.trust, icon: ShieldCheck, label: "Safety & privacy" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-[#0e0c1f] border border-slate-200/60 dark:border-slate-800/30 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-400/80 dark:text-slate-500/80">{item.label}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 dark:text-orange-400">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-8 flex items-baseline gap-1">
                        <span className={`text-4.5xl font-black ${getScoreColor(item.score)}`}>{item.score}</span>
                        <span className="text-slate-400 dark:text-slate-650 font-bold text-sm">/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Checklist */}
            <div className="bg-white dark:bg-[#0e0c1f] border border-slate-200/60 dark:border-slate-800/30 rounded-3xl p-6 md:p-8 mb-12 shadow-xs">
              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Technical Audit Checklist</h3>
                <p className="text-xs font-bold text-slate-405 dark:text-slate-500">Essential structured parameters required to demonstrate website safety and AI citation-readiness</p>
              </div>

              {/* Missing Details Grid */}
              <div className="mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Missing details / Weak Signals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Privacy Policy Page", present: result.checklist.privacyPolicy },
                    { label: "Terms of Service", present: result.checklist.termsOfService },
                    { label: "Schema.org Organization", present: result.checklist.organizationSchema },
                    { label: "Twitter Card Meta", present: result.checklist.twitterCard },
                    { label: "Linked G2 reviews", present: result.checklist.g2 },
                    { label: "Active Reddit handles", present: result.checklist.reddit },
                    { label: "Linked Capterra Profile", present: result.checklist.capterra },
                    { label: "Verified LinkedIn company page", present: result.checklist.linkedin },
                    { label: "Active CrunchBase listing", present: result.checklist.crunchbase },
                    { label: "Verifiable TrustPilot link", present: result.checklist.trustpilot },
                    { label: "Active X (Twitter) handle", present: result.checklist.x },
                    { label: "Official YouTube Channel", present: result.checklist.youtube },
                  ]
                    .filter(item => !item.present)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-3">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 px-2.5 py-0.5 text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase">Missing</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Details Found */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Details Found / Active Signals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "SSL (HTTPS Mode)", present: result.checklist.ssl },
                    { label: "Contact Details / Handles", present: result.checklist.contactDetails },
                    { label: "Copyright Declarations", present: result.checklist.copyright },
                    { label: "Comprehensive Internal Links", present: result.checklist.internalLinks },
                    { label: "Privacy Policy Page", present: result.checklist.privacyPolicy },
                    { label: "Terms of Service", present: result.checklist.termsOfService },
                    { label: "Schema.org Organization", present: result.checklist.organizationSchema },
                    { label: "Twitter Card Meta", present: result.checklist.twitterCard },
                    { label: "Linked G2 reviews", present: result.checklist.g2 },
                    { label: "Active Reddit handles", present: result.checklist.reddit },
                    { label: "Linked Capterra Profile", present: result.checklist.capterra },
                    { label: "Verified LinkedIn company page", present: result.checklist.linkedin },
                    { label: "Active CrunchBase listing", present: result.checklist.crunchbase },
                    { label: "Verifiable TrustPilot link", present: result.checklist.trustpilot },
                    { label: "Active X (Twitter) handle", present: result.checklist.x },
                    { label: "Official YouTube Channel", present: result.checklist.youtube },
                  ]
                    .filter(item => item.present)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-3">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/30 dark:border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Present</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Detailed Accordions for E-E-A-T */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Detailed Signal Analysis</h3>

              {Object.entries(result.analysis.categories).map(([key, category]) => {
                const isOpen = openCategory === key;
                return (
                  <div key={key} className="bg-white dark:bg-[#0e0c1f] border border-slate-200/60 dark:border-slate-800/30 rounded-3xl overflow-hidden shadow-xs">
                    {/* Header trigger */}
                    <button 
                      onClick={() => setOpenCategory(isOpen ? null : key)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer border-0"
                    >
                      <div className="flex items-center gap-4">
                        <h4 className="text-base font-black capitalize text-slate-800 dark:text-white">{key}</h4>
                        <span className={`text-sm font-extrabold ${getScoreColor(category.score)}`}>{category.score}/100</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold hidden sm:inline">{category.passedCount}/{category.totalCount} checks passed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getScoreBadgeColor(category.status)}`}>
                          {category.status}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                      </div>
                    </button>

                    {/* Content */}
                    {isOpen && (
                      <div className="px-6 pb-8 pt-4 border-t border-slate-100 dark:border-white/5 animate-fade-in-up">
                        {/* Working & Missing side-by-side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-650 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              What's Working
                            </h5>
                            <ul className="space-y-2">
                              {category.working.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed pl-2.5 border-l border-emerald-500/30 font-medium">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              What's Missing
                            </h5>
                            <ul className="space-y-2">
                              {category.missing.map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed pl-2.5 border-l border-rose-500/30 font-medium">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* How to Improve */}
                        <div className="bg-orange-50/30 dark:bg-orange-500/[0.02] border border-orange-200/40 dark:border-orange-500/10 rounded-2xl p-5">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Actionable Optimization Steps
                          </h5>
                          <ol className="space-y-2.5 list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
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
            
            <div className="mt-10 text-center">
              <button 
                onClick={() => {
                  setResult(null);
                  setUrlInput("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 px-6 py-3 text-xs font-black tracking-wider text-slate-600 dark:text-slate-300 uppercase transition-all cursor-pointer shadow-sm active:scale-97"
              >
                Analyze Another Website
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Understand Content Quality Section */}
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16 text-center">
          <div className="inline-flex rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-1.5 mb-6 shadow-xs">
            <span className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest">Features</span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-black text-slate-850 dark:text-white tracking-tight mb-4">
            Understand Your Content Quality
          </h2>
          <p className="text-slate-500 dark:text-slate-450 max-w-2xl mx-auto text-sm leading-relaxed mb-16 font-medium">
            Our GEO Analysis tool evaluates your website content against Google's E-E-A-T guidelines to make sure you rank in AI search queries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Deep Content Analysis", desc: "Scans your page for signals that demonstrate first-hand experience and expertise.", icon: FileText },
              { title: "Comprehensive Scoring", desc: "Get individual scores for Experience, Expertise, Authoritativeness, and Trustworthiness.", icon: Activity },
              { title: "Actionable Recommendations", desc: "Receive prioritized suggestions to improve your E-E-A-T signals.", icon: HelpCircle },
              { title: "Authority Signals", desc: "Identifies author credentials, citations, and backlink quality indicators.", icon: Award },
              { title: "Trust Factors", desc: "Checks for security, privacy policies, and transparency signals.", icon: ShieldCheck },
              { title: "SEO Insights", desc: "Understand how Google evaluates your content quality and what to improve.", icon: Globe }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50/50 dark:bg-[#120f26]/30 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 text-center hover:border-orange-500/20 dark:hover:border-orange-500/20 hover:bg-white dark:hover:bg-[#120f26]/60 transition-all duration-300 group shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-all">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-505 dark:text-slate-450 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>,
        true
      )}

      {/* How it works Section */}
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-1.5 mb-6 shadow-xs">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">How it works</span>
              </div>
              <h2 className="text-3xl md:text-3.5xl font-black text-slate-800 dark:text-white leading-tight tracking-tight mb-4">
                Analyze &amp; Improve Your Content's E-E-A-T Signals
              </h2>
              <p className="text-slate-500 dark:text-slate-455 text-sm leading-relaxed font-medium">
                Evaluate experience, expertise, authority, and trust across any webpage. Get clear scores and actionable insights to strengthen content quality and improve search performance.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {[
                { step: "01", title: "Enter Your Website URL", desc: "Paste any publicly accessible website and start analyzing E-E-A-T signals instantly." },
                { step: "02", title: "Content Analysis", desc: "Scans experience, expertise, authority, and trust to identify strong and weak signals." },
                { step: "03", title: "Get Your Scores", desc: "View category-wise E-E-A-T scores and see exactly what is present and what is missing." },
                { step: "04", title: "Improve &amp; Optimize", desc: "Get prioritized improvement suggestions to strengthen content quality and search rankings." }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 dark:bg-[#120f26]/30 border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 hover:border-orange-500/20 dark:hover:border-orange-500/20 transition-all flex gap-4 items-start shadow-xs">
                  <span className="text-2xl font-black text-orange-500">{item.step}</span>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        true
      )}

      {/* FAQs Section */}
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-1.5 mb-6 shadow-xs">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">FAQs</span>
            </div>
            <h2 className="text-3xl md:text-3.5xl font-black text-slate-850 dark:text-white tracking-tight mb-4">Have Questions?</h2>
            <p className="text-slate-550 dark:text-slate-450 text-sm font-semibold max-w-lg mx-auto">
              Clear answers to common questions about our tools, data, and how the analysis works.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar list of tools */}
            <div className="lg:col-span-4 bg-slate-50/60 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 px-4 py-1.5 uppercase tracking-wider block">Tools Navigation</span>
              {[
                { name: "Domain Rating Checker", active: false, icon: Award },
                { name: "SEO Audit Tool", active: false, icon: Activity },
                { name: "Page Speed Analyzer", active: false, icon: Activity },
                { name: "Keyword Research Tool", active: false, icon: Search },
                { name: "Backlink Checker", active: false, icon: Link2 },
                { name: "XML Sitemap Generator", active: false, icon: FileCode },
                { name: "Sitemap Finder & Checker", active: false, icon: FileCode },
                { name: "Sitemap Validator", active: false, icon: FileCode }
              ].map((tool, idx) => (
                <div 
                  key={idx} 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <tool.icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {tool.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400/80" />
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="lg:col-span-8 space-y-3.5">
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
                  <div key={idx} className="bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden shadow-xs transition-all">
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4.5 flex items-center justify-between text-left hover:bg-slate-100/40 dark:hover:bg-white/5 transition-all cursor-pointer border-0"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-805 dark:text-slate-200">{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1.5 border-t border-slate-200/40 dark:border-white/5 animate-fade-in-up">
                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        true
      )}

      {/* Explore Free Tools Section */}
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white">Explore Free Tools</h2>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-650 dark:hover:text-slate-350">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Domain Rating Checker", desc: "Check any website's Domain Rating (DR) score instantly. Understand your site's SEO authority." },
              { title: "SEO Audit", desc: "Get a comprehensive SEO audit of your website with actionable recommendations." },
              { title: "JSON-LD Generator", desc: "Generate Schema.org JSON-LD from any URL or content to boost AI search citations." }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50/50 dark:bg-[#120f26]/30 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 hover:border-orange-500/20 dark:hover:border-orange-500/20 hover:bg-white dark:hover:bg-[#120f26]/60 transition-all duration-300 group flex flex-col justify-between h-56 shadow-xs">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-850 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-orange-500 uppercase tracking-widest mt-4">
                  Try for Free <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>,
        true
      )}

      <MarketingFooter />
    </div>
  );
}
