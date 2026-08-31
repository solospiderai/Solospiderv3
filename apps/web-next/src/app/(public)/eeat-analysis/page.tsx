"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
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
  FileCode,
  Copy,
  Sparkles
} from "lucide-react";

interface EeatSignal {
  question: string;
  details: string;
}

interface EeatCategory {
  score: number;
  passedCount: number;
  totalCount: number;
  status: "Poor" | "Needs Work" | "Good";
  working: EeatSignal[];
  missing: EeatSignal[];
  improve: string[];
}

interface AnalysisResult {
  url: string;
  domain: string;
  updatedAt: string;
  checklist: {
    ssl: boolean;
    aboutUs: boolean;
    contactDetails: boolean;
    socialLinks: boolean;
    organizationSchema: boolean;
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
  const [subTabs, setSubTabs] = useState<Record<string, "summary" | "issues" | "passed">>({});
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("solospider_theme");
      const nextDark = saved === "dark";
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    window.localStorage.setItem("solospider_theme", nextDark ? "dark" : "light");
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  
  // Custom Wizard Dialog state to make all cards & buttons work
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");

  // Free Tool: llms.txt Generator States
  const [isLlmTxtOpen, setIsLlmTxtOpen] = useState(false);
  const [llmBrandName, setLlmBrandName] = useState("");
  const [llmDescription, setLlmDescription] = useState("");
  const [llmCoreProduct, setLlmCoreProduct] = useState("");
  const [llmUseCases, setLlmUseCases] = useState("");
  const [copiedLlm, setCopiedLlm] = useState(false);

  // Free Tool: JSON-LD Schema Generator States
  const [isJsonLdOpen, setIsJsonLdOpen] = useState(false);
  const [schemaType, setSchemaType] = useState<"Organization" | "Article" | "FAQPage">("Organization");
  const [schemaOrgName, setSchemaOrgName] = useState("");
  const [schemaOrgUrl, setSchemaOrgUrl] = useState("");
  const [schemaOrgLogo, setSchemaOrgLogo] = useState("");
  const [schemaArticleTitle, setSchemaArticleTitle] = useState("");
  const [schemaArticleAuthor, setSchemaArticleAuthor] = useState("");
  const [schemaArticlePublisher, setSchemaArticlePublisher] = useState("");
  const [schemaFaqQ1, setSchemaFaqQ1] = useState("");
  const [schemaFaqA1, setSchemaFaqA1] = useState("");
  const [schemaFaqQ2, setSchemaFaqQ2] = useState("");
  const [schemaFaqA2, setSchemaFaqA2] = useState("");
  const [copiedSchema, setCopiedSchema] = useState(false);

  const [recentAnalyses, setRecentAnalyses] = useState<Array<{ url: string; date: string }>>([]);

  // Load recent analyses from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eeat_analysis_history');
      if (saved) {
        setRecentAnalyses(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Centralized audit runner
  const runAudit = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setAnalyzing(true);
    setError(null);
    try {
      const cleanTarget = targetUrl.trim();
      const res = await fetch(`/api/eeat-analysis?url=${encodeURIComponent(cleanTarget)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze URL.");
      }
      setResult(data);

      // Save to recent analyses history
      const cleanHost = cleanTarget.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      const newEntry = { url: cleanHost, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      
      setRecentAnalyses((prev) => {
        const filtered = prev.filter((item) => item.url.toLowerCase() !== cleanHost.toLowerCase());
        const updated = [newEntry, ...filtered].slice(0, 8);
        try {
          localStorage.setItem('eeat_analysis_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please check the URL and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    runAudit(urlInput);
  };

  // Click handler to launch SoloSpider Project setup wizard
  const handleLaunchWizard = () => {
    setWizardDomain(urlInput.trim() || "");
    setIsWizardOpen(true);
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
      <div className="relative w-[340px] h-[320px] mx-auto select-none scale-90 sm:scale-100 transition-all duration-300">
        <svg width="340" height="320" viewBox="0 0 340 320" className="mx-auto overflow-visible">
          {/* Background Grid Circles */}
          {[0.25, 0.5, 0.75, 1.0].map((scale, i) => (
            <circle 
              key={i} 
              cx={center + 20} 
              cy={center + 10} 
              r={rMax * scale} 
              fill="none" 
              className="stroke-[var(--line)]" 
              strokeWidth="1.5" 
            />
          ))}

          {/* Axes lines */}
          <line x1={center + 20} y1={center + 10 - rMax} x2={center + 20} y2={center + 10 + rMax} className="stroke-[var(--line)] opacity-60" strokeWidth="1.5" />
          <line x1={center + 20 - rMax} y1={center + 10} x2={center + 20 + rMax} y2={center + 10} className="stroke-[var(--line)] opacity-60" strokeWidth="1.5" />

          {/* Outer Grid Labels */}
          <text x={center + 20} y={center + 10 - rMax - 12} textAnchor="middle" className="text-[11px] font-black fill-[var(--muted)] uppercase tracking-widest">Experience</text>
          <text x={center + 20 + rMax + 12} y={center + 14} textAnchor="start" className="text-[11px] font-black fill-[var(--muted)] uppercase tracking-widest">Expertise</text>
          <text x={center + 20} y={center + 10 + rMax + 24} textAnchor="middle" className="text-[11px] font-black fill-[var(--muted)] uppercase tracking-widest">Authority</text>
          <text x={center + 20 - rMax - 12} y={center + 14} textAnchor="end" className="text-[11px] font-black fill-[var(--muted)] uppercase tracking-widest">Trust</text>

          {/* Filled Data Polygon */}
          <polygon 
            points={points.map(p => `${p.x + 20},${p.y + 10}`).join(" ")} 
            className="animate-draw-polygon fill-[var(--primary)]/15 stroke-[var(--primary)]" 
            strokeWidth="3" 
            strokeLinejoin="round"
          />

          {/* Data Vertices Points */}
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x + 20} cy={p.y + 10} r="5" className="fill-[var(--primary)] stroke-[var(--bg)]" strokeWidth="2" />
          ))}
        </svg>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-450";
    if (score >= 50) return "text-amber-550 dark:text-amber-450";
    return "text-rose-550 dark:text-rose-455";
  };

  const getScoreBadgeColor = (status: string) => {
    if (status === "Good") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-500/20";
    if (status === "Needs Work") return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-455 border border-amber-200 dark:border-amber-500/20";
    return "bg-rose-50 text-rose-605 dark:bg-rose-500/10 dark:text-rose-450 border border-rose-200 dark:border-rose-500/20";
  };

  // Grid wrap blueprint template section wrapper
  const renderSectionWrapper = (content: React.ReactNode, hasTopBorder = false) => {
    return (
      <section className="relative z-10 w-full animate-fade-in-up">
        {hasTopBorder && <div className="w-full h-px bg-[var(--line)]" />}
        <div className="grid w-full grid-cols-1 lg:grid-cols-[1fr_10fr_1fr] xl:grid-cols-[1fr_1fr_10fr_1fr_1fr] bg-[var(--bg-2)]">
          {/* Column Grid Left margins */}
          <div className="relative hidden xl:block bg-[var(--bg-2)]"><div className="absolute inset-0 bg-[var(--panel)]" /></div>
          <div className="relative hidden lg:block bg-[var(--bg-2)]">
            <div className="absolute inset-0 rounded-r-2xl bg-[var(--panel)]">
              <div className="absolute top-0 right-0 bottom-0 z-10 w-px bg-[var(--line)]" />
            </div>
          </div>

          {/* Main Workspace Column */}
          <div className="relative w-full min-w-0 bg-[var(--bg-2)]">
            <div className="w-full min-w-0 lg:rounded-2xl bg-[var(--panel)] shadow-sm border-x border-[var(--line)]">
              {content}
            </div>
          </div>

          {/* Column Grid Right margins */}
          <div className="relative hidden lg:block bg-[var(--bg-2)]">
            <div className="absolute inset-0 rounded-l-2xl bg-[var(--panel)]">
              <div className="absolute top-0 bottom-0 left-0 z-10 w-px bg-[var(--line)]" />
            </div>
          </div>
          <div className="relative hidden xl:block bg-[var(--bg-2)]"><div className="absolute inset-0 bg-[var(--panel)]" /></div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden font-sans selection:bg-purple-500/20 selection:text-purple-650 transition-colors duration-300">
      <MarketingNavbar isDark={isDark} onToggleTheme={toggleTheme} onOpenWizard={handleLaunchWizard} />

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
          background-image: linear-gradient(rgba(144, 37, 242, 0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(144, 37, 242, 0.035) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .blueprint-grid {
          background-image: linear-gradient(rgba(180, 96, 255, 0.018) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(180, 96, 255, 0.018) 1px, transparent 1px);
        }

        /* ===== PDF / Print Styles ===== */
        @media print {
          /* Hide navbar, footer, hero input section, FAQ, wizard, and print button */
          nav,
          .geo-hero-section,
          .geo-faq-section,
          .geo-footer-section,
          .geo-print-btn,
          .geo-cta-section,
          [data-wizard-modal] {
            display: none !important;
          }
          /* Remove backgrounds and shadows for clean PDF */
          body, html {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-shadow: none !important;
          }
          /* Ensure results section fills the page */
          #results-section {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
        }
      `}</style>

      {/* Main hero background section */}
      <section className="relative z-10 w-full blueprint-grid geo-hero-section">
        <div className="grid w-full grid-cols-1 lg:grid-cols-[1fr_10fr_1fr] xl:grid-cols-[1fr_1fr_10fr_1fr_1fr] bg-[var(--bg-2)]/30">
          <div className="hidden xl:block" />
          <div className="hidden lg:block border-r border-[var(--line)]/40" />
          <div className="w-full min-w-0 px-4 sm:px-8 py-20 lg:py-24 max-w-5xl mx-auto">
            
            {/* Tool Icon Visual */}
            <div className="relative flex items-center justify-center mb-8 animate-fade-in-up">
              <div 
                className="relative z-10 rounded-[36px] bg-[var(--panel)] p-5 shadow-xl border border-[var(--line)]"
                style={{
                  boxShadow: '0 20px 40px -15px rgba(144, 37, 242, 0.08), 0 0 50px 10px rgba(144, 37, 242, 0.03)'
                }}
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-[#9025F2] via-[#b260ff] to-[#ec4899] text-white flex items-center justify-center shadow-md">
                  <Compass className="h-9.5 w-9.5 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Title & Sub */}
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
              <h1 className="text-4xl md:text-5.5xl font-black tracking-tight leading-[1.1] text-[var(--ink)] mb-5">
                Free <span className="grad-text">EEAT Analysis</span> Tool
              </h1>
              <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                Analyze your website's Experience, Expertise, Authoritativeness, and Trustworthiness signals. Get instant EEAT reports and actionable recommendations to optimize for AI search engines.
              </p>
            </div>

            {/* URL Input Form */}
            <div className="max-w-xl mx-auto animate-fade-in-up">
              <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-bold text-[var(--muted)] tracking-wider">
                <span>EEAT CRAWLER ACTIVE</span>
                <span>
                  <span className="text-[var(--primary)] font-black">5</span>/5 FREE CHECKS LEFT
                </span>
              </div>
              
              <form onSubmit={handleAnalyze} className="relative z-10">
                <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-[var(--panel)] border border-[var(--line)] p-2 sm:rounded-full shadow-lg shadow-slate-100 dark:shadow-none focus-within:border-[var(--primary)]/60 transition-all duration-200">
                  <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
                    <span className="select-none font-bold text-[var(--muted)] text-sm">https://</span>
                    <input 
                      id="url-input"
                      type="text" 
                      placeholder="example.com" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={analyzing}
                      className="w-full bg-transparent ml-1.5 text-[var(--ink)] text-sm font-bold placeholder-[var(--muted)]/50 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={analyzing || !urlInput.trim()}
                    className="w-full sm:w-auto rounded-xl sm:rounded-full bg-gradient-to-r from-[#9025F2] via-[#b260ff] to-[#ec4899] hover:brightness-110 active:scale-[0.98] px-7 py-3 text-sm font-black tracking-wide text-white transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-500/10"
                  >
                    {analyzing ? (
                      <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Analyzing EEAT...
                      </>
                    ) : (
                      <>
                      <Search className="w-4 h-4 text-white" />
                      Analyze EEAT
                      </>
                    )}
                  </button>
                </div>

                {/* Recently Analyzed Websites History */}
                {recentAnalyses.length > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-[var(--muted)] text-[11px] uppercase tracking-wider">Recently Analyzed:</span>
                    {recentAnalyses.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUrlInput(item.url);
                          runAudit(item.url);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--primary)] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>{item.url}</span>
                        <span className="text-[9px] text-[var(--muted)] font-normal">({item.date})</span>
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold max-w-md mx-auto text-center animate-fade-in-up">
                    ⚠️ {error}
                  </div>
                )}
              </form>
            </div>
          </div>
          <div className="hidden lg:block border-l border-[var(--line)]/40" />
          <div className="hidden xl:block" />
        </div>
      </section>

      {/* Analysis Results Dashboard */}
      {result && (
        <section id="results-section" className="w-full bg-[var(--bg-2)]/40 py-12 px-4 transition-all duration-500">
          <div className="max-w-5xl mx-auto animate-fade-in-up">
            {/* Results Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-[var(--line)]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">AUDIT COMPLETED</span>
                <h2 className="text-2xl font-black text-[var(--ink)] mt-1">EEAT Analysis Results</h2>
                <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-[var(--muted)]">
                  <span className="text-[var(--ink-2)]">{result.domain}</span>
                  <span>•</span>
                  <span>Checked: {result.updatedAt}</span>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                className="geo-print-btn self-start sm:self-center border border-[var(--line)] hover:bg-[var(--bg-2)] bg-[var(--panel)] px-4.5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all active:scale-97 flex items-center gap-2 cursor-pointer text-[var(--ink-2)] shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Save Report
              </button>
            </div>

            {/* Radar chart & Score summary grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              {/* Radar chart */}
              <div className="lg:col-span-6 bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 flex flex-col justify-center items-center shadow-xs">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)] mb-6 w-full text-left">
                  EEAT Quality Dimensions
                </h3>
                {renderRadarChart(result.analysis.scores)}
              </div>
              {/* Individual Score cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Expertise", score: result.analysis.scores.expertise, icon: Award, label: "Expertise", iconColor: "text-violet-500 bg-violet-500/10" },
                  { name: "Experience", score: result.analysis.scores.experience, icon: UserCheck, label: "Experience", iconColor: "text-indigo-500 bg-indigo-500/10" },
                  { name: "Authoritativeness", score: result.analysis.scores.authority, icon: BookOpen, label: "Authoritativeness", iconColor: "text-emerald-500 bg-emerald-500/10" },
                  { name: "Trustworthiness", score: result.analysis.scores.trust, icon: ShieldCheck, label: "Trustworthiness", iconColor: "text-purple-500 bg-purple-500/10" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className={`w-10 h-10 rounded-xl ${item.iconColor} flex items-center justify-center mb-4`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-[var(--ink)]">{item.score}</span>
                          <span className="text-slate-400 font-bold text-sm">/100</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
                        <HelpCircle className="w-3.5 h-3.5 opacity-60" />
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Checklist */}
            {(() => {
              const checklistItems = [
                { label: "SSL Certificate", present: result.checklist.ssl },
                { label: "About Us Page", present: result.checklist.aboutUs },
                { label: "Contact Details", present: result.checklist.contactDetails },
                { label: "Social Links", present: result.checklist.socialLinks },
                { label: "Organization Schema", present: result.checklist.organizationSchema },
                { label: "GEO Platform: G2", present: result.checklist.g2 },
                { label: "GEO Platform: Reddit", present: result.checklist.reddit },
                { label: "GEO Platform: Capterra", present: result.checklist.capterra },
                { label: "GEO Platform: LinkedIn", present: result.checklist.linkedin },
                { label: "GEO Platform: CrunchBase", present: result.checklist.crunchbase },
                { label: "GEO Platform: TrustPilot", present: result.checklist.trustpilot },
                { label: "GEO Platform: X (Twitter)", present: result.checklist.x },
                { label: "GEO Platform: YouTube", present: result.checklist.youtube },
              ];
              const missingCount = checklistItems.filter(item => !item.present).length;
              const foundCount = checklistItems.filter(item => item.present).length;

              return (
                <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 md:p-8 mb-12 shadow-xs">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[var(--ink)]">Technical Audit</h3>
                        <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full px-2.5 py-0.5">{missingCount}</span>
                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full px-2.5 py-0.5">{foundCount}</span>
                      </div>
                      <p className="text-xs font-bold text-[var(--muted)] mt-1">Essential metrics for search and user experience</p>
                    </div>
                  </div>

                  {/* Missing Details Grid */}
                  {missingCount > 0 && (
                    <div className="mb-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-4">Missing details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {checklistItems
                          .filter(item => !item.present)
                          .map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-[var(--bg-2)]/40 border border-[var(--line)]/50 rounded-xl px-4 py-3">
                              <span className="text-xs font-bold text-[var(--ink-2)]">{item.label}</span>
                              <span className="rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 px-2.5 py-0.5 text-[9px] font-black text-rose-500 dark:text-rose-450 uppercase">Missing</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Details Found */}
                  {foundCount > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-4">Details found</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {checklistItems
                          .filter(item => item.present)
                          .map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-[var(--bg-2)]/40 border border-[var(--line)]/50 rounded-xl px-4 py-3">
                              <span className="text-xs font-bold text-[var(--ink-2)]">{item.label}</span>
                              <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/30 dark:border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-450 uppercase">Present</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Detailed Accordions for EEAT */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[var(--ink)] mb-4">Detailed Analysis</h3>

              {Object.entries(result.analysis.categories).map(([key, category]) => {
                const isOpen = openCategory === key;
                const activeTab = subTabs[key] || "summary";
                const issuesCount = category.missing.length;
                const passedCount = category.working.length;

                // Category details definition
                const catDetails = {
                  experience: {
                    title: "Experience",
                    subtitle: "First-hand experience with the topic",
                    icon: UserCheck,
                    iconColor: "text-indigo-500 bg-indigo-500/10"
                  },
                  expertise: {
                    title: "Expertise",
                    subtitle: "Demonstrated knowledge and qualifications",
                    icon: Award,
                    iconColor: "text-violet-500 bg-violet-500/10"
                  },
                  authority: {
                    title: "Authority",
                    subtitle: "Recognition and reputation in the field",
                    icon: BookOpen,
                    iconColor: "text-emerald-500 bg-emerald-500/10"
                  },
                  trust: {
                    title: "Trust",
                    subtitle: "Security, transparency, and safety",
                    icon: ShieldCheck,
                    iconColor: "text-purple-500 bg-purple-500/10"
                  }
                }[key as "experience" | "expertise" | "authority" | "trust"] || {
                  title: key,
                  subtitle: "",
                  icon: HelpCircle,
                  iconColor: "text-gray-500 bg-gray-500/10"
                };

                const Icon = catDetails.icon;

                return (
                  <div key={key} className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-xs">
                    {/* Header trigger */}
                    <button 
                      onClick={() => setOpenCategory(isOpen ? null : key)}
                      className="w-full px-6 py-5 flex items-start gap-4 hover:bg-[var(--bg-2)]/30 transition-all text-left cursor-pointer border-0 bg-transparent"
                    >
                      <div className={`w-10 h-10 rounded-full ${catDetails.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-base font-black text-[var(--ink)]">{catDetails.title}</span>
                            <span className={`text-sm font-extrabold ${getScoreColor(category.score)}`}>{category.score}/100</span>
                            <span className="text-[10px] text-[var(--muted)] font-bold">{category.passedCount}/{category.totalCount} signals passed</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getScoreBadgeColor(category.status)}`}>
                              {category.status}
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-[var(--muted)] mt-1.5">{catDetails.subtitle}</p>
                      </div>
                    </button>

                    {/* Content */}
                    {isOpen && (
                      <div className="px-6 pb-8 pt-4 border-t border-[var(--line)] animate-fade-in-up">
                        {/* Sub Tabs navigation matching SnowSEO */}
                        <div className="flex gap-6 border-b border-[var(--line)]/50 mb-6">
                          <button
                            onClick={() => setSubTabs(prev => ({ ...prev, [key]: "summary" }))}
                            className={`pb-2.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer border-0 bg-transparent ${
                              activeTab === "summary"
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                          >
                            Summary
                          </button>
                          <button
                            onClick={() => setSubTabs(prev => ({ ...prev, [key]: "issues" }))}
                            className={`pb-2.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer border-0 bg-transparent ${
                              activeTab === "issues"
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                          >
                            Issues ({issuesCount})
                          </button>
                          <button
                            onClick={() => setSubTabs(prev => ({ ...prev, [key]: "passed" }))}
                            className={`pb-2.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer border-0 bg-transparent ${
                              activeTab === "passed"
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                            }`}
                          >
                            Passed ({passedCount})
                          </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === "summary" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 mb-3 flex items-center gap-1.5 font-bold">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                What's Working
                              </h5>
                              <ul className="space-y-3.5">
                                {category.working.map((item, idx) => (
                                  <li key={idx} className="text-xs text-[var(--ink-2)] leading-relaxed pl-3.5 border-l-2 border-emerald-500/30 font-medium">
                                    <strong className="block text-[var(--ink)] mb-0.5">{item.question}</strong>
                                    <span className="text-[var(--muted)]">{item.details}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-450 mb-3 flex items-center gap-1.5 font-bold">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                What's Missing
                              </h5>
                              <ul className="space-y-3.5">
                                {category.missing.map((item, idx) => (
                                  <li key={idx} className="text-xs text-[var(--ink-2)] leading-relaxed pl-3.5 border-l-2 border-rose-500/30 font-medium">
                                    <strong className="block text-[var(--ink)] mb-0.5">{item.question}</strong>
                                    <span className="text-[var(--muted)]">{item.details}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {activeTab === "issues" && (
                          <div className="mb-6 space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-450 mb-3 flex items-center gap-1.5 font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              Identified Issues
                            </h5>
                            {issuesCount > 0 ? (
                              <div className="space-y-3">
                                {category.missing.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 items-start p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-2xl">
                                    <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-black text-[var(--ink)] mb-1">{item.question}</h6>
                                      <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">{item.details}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--muted)] italic">No issues detected for this category.</p>
                            )}
                          </div>
                        )}

                        {activeTab === "passed" && (
                          <div className="mb-6 space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 mb-3 flex items-center gap-1.5 font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Passed Signals
                            </h5>
                            {passedCount > 0 ? (
                              <div className="space-y-3">
                                {category.working.map((item, idx) => (
                                  <div key={idx} className="flex gap-4 items-start p-4 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-2xl">
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-black text-[var(--ink)] mb-1">{item.question}</h6>
                                      <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">{item.details}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--muted)] italic">No passed signals detected for this category.</p>
                            )}
                          </div>
                        )}

                        {/* How to Improve */}
                        {category.improve && category.improve.length > 0 && (
                          <div className="bg-[var(--primary)]/[0.03] border border-[var(--primary)]/10 rounded-2xl p-5">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)] mb-3 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5" />
                              How to Improve
                            </h5>
                            <ol className="space-y-2.5 list-decimal list-inside text-xs text-[var(--ink-2)] leading-relaxed font-medium">
                              {category.improve.map((item, idx) => (
                                <li key={idx} className="pl-1">
                                  {item}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
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
                className="rounded-full border border-[var(--line)] hover:bg-[var(--bg-2)] px-6 py-3 text-xs font-black tracking-wider text-[var(--ink-2)] uppercase transition-all cursor-pointer shadow-sm active:scale-97"
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
          <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--bg-2)]/50 px-4 py-1.5 mb-6 shadow-xs">
            <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Features</span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-black text-[var(--ink)] tracking-tight mb-4">
            Understand Your Content Quality
          </h2>
          <p className="text-[var(--muted)] max-w-2xl mx-auto text-sm leading-relaxed mb-16 font-medium">
            Our EEAT Analysis tool evaluates your website content against Google's EEAT guidelines to make sure you rank in AI search queries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Deep Content Analysis", desc: "Scans your page for signals that demonstrate first-hand experience and expertise.", icon: FileText },
              { title: "Comprehensive Scoring", desc: "Get individual scores for Experience, Expertise, Authoritativeness, and Trustworthiness.", icon: Activity },
              { title: "Actionable Recommendations", desc: "Receive prioritized suggestions to improve your EEAT signals.", icon: HelpCircle },
              { title: "Authority Signals", desc: "Identifies author credentials, citations, and backlink quality indicators.", icon: Award },
              { title: "Trust Factors", desc: "Checks for security, privacy policies, and transparency signals.", icon: ShieldCheck },
              { title: "SEO Insights", desc: "Understand how Google evaluates your content quality and what to improve.", icon: Globe }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-[var(--bg-2)]/30 border border-[var(--line)]/50 rounded-2xl p-6 text-center hover:border-[var(--primary)]/20 hover:bg-[var(--panel)] transition-all duration-300 group shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-all">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--ink)] mb-2">{item.title}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">{item.desc}</p>
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
              <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--bg-2)]/50 px-4 py-1.5 mb-6 shadow-xs">
                <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">How it works</span>
              </div>
              <h2 className="text-3xl md:text-3.5xl font-black text-[var(--ink)] leading-tight tracking-tight mb-4">
                Analyze &amp; Improve Your Content's EEAT Signals
              </h2>
              <p className="text-[var(--muted)] text-sm leading-relaxed font-medium">
                Evaluate experience, expertise, authority, and trust across any webpage. Get clear scores and actionable insights to strengthen content quality and improve search performance.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {[
                { step: "01", title: "Enter Your Website URL", desc: "Paste any publicly accessible website and start analyzing EEAT signals instantly." },
                { step: "02", title: "Content Analysis", desc: "Scans experience, expertise, authority, and trust to identify strong and weak signals." },
                { step: "03", title: "Get Your Scores", desc: "View category-wise EEAT scores and see exactly what is present and what is missing." },
                { step: "04", title: "Improve &amp; Optimize", desc: "Get prioritized improvement suggestions to strengthen content quality and search rankings." }
              ].map((item, idx) => (
                <div key={idx} className="bg-[var(--bg-2)]/30 border border-[var(--line)]/50 rounded-2xl p-5 hover:border-[var(--primary)]/20 transition-all flex gap-4 items-start shadow-xs">
                  <span className="text-2xl font-black text-[var(--primary)]">{item.step}</span>
                  <div>
                    <h3 className="font-bold text-base text-[var(--ink)] mb-1">{item.title}</h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        true
      )}

      {/* FAQs Section */}
      <div className="geo-faq-section">
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--bg-2)]/50 px-4 py-1.5 mb-6 shadow-xs">
              <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">FAQs</span>
            </div>
            <h2 className="text-3xl md:text-3.5xl font-black text-[var(--ink)] tracking-tight mb-4">Have Questions?</h2>
            <p className="text-[var(--muted)] text-sm font-semibold max-w-lg mx-auto">
              Clear answers to common questions about Generative Engine Optimization (GEO), EEAT, and how the audit functions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar list of tools — sticky */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 self-start">
              <div className="bg-[var(--bg-2)]/60 border border-[var(--line)]/50 rounded-2xl p-6 lg:h-[600px] lg:flex lg:flex-col lg:justify-start lg:gap-2.5 shadow-xs">
                <span className="text-xs font-black text-[var(--muted)] px-3 py-1.5 uppercase tracking-widest block mb-2">Tools Navigation</span>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "Domain Rating Checker", icon: Award },
                    { name: "SEO Audit Suite", icon: Activity },
                    { name: "Page Speed Analyzer", icon: Activity },
                    { name: "Keyword Research Tool", icon: Search },
                    { name: "Backlink Auditor", icon: Link2 },
                    { name: "XML Sitemap Generator", icon: FileCode },
                    { name: "Sitemap Finder & Indexer", icon: FileCode },
                    { name: "Sitemap Quality Validator", icon: FileCode }
                  ].map((tool, idx) => (
                    <div 
                      key={idx} 
                      onClick={handleLaunchWizard}
                      className="px-4.5 py-3.5 rounded-xl text-sm font-bold text-[var(--ink-2)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3 font-semibold">
                        <tool.icon className="w-4.5 h-4.5 text-[var(--muted)] group-hover:text-[var(--primary)]" />
                        {tool.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable FAQs Accordions — scrollable */}
            <div className="lg:col-span-8 lg:max-h-[600px] lg:overflow-y-auto lg:pr-2 space-y-3.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--line) transparent' }}>
              {[
                {
                  q: "What is GEO (Generative Engine Optimization)?",
                  a: "GEO is the practice of optimizing website content so that AI engines (like ChatGPT, Claude, Gemini, Copilot, and Perplexity) can crawl, read, understand, and cite your brand as the primary source when answering user queries."
                },
                {
                  q: "How does SoloSpider's GEO Analysis tool work?",
                  a: "The tool crawls your website and audits 15+ vital signals (SSL status, terms & conditions sheets, schemas, and brand review listings). It then processes raw heading layout and content text, running a specialized quality rater audit (powered by Gemini) to calculate EEAT metrics."
                },
                {
                  q: "How is GEO different from traditional SEO?",
                  a: "Traditional SEO targets keyword positions on Google search results pages. GEO optimizes for citation weight in LLM responses. AI search models prefer content that provides structured facts, verified author qualifications, brand trust signals, and machine-readable data formatting."
                },
                {
                  q: "What is Google EEAT and why does it matter for GEO?",
                  a: "EEAT stands for Experience, Expertise, Authoritativeness, and Trustworthiness. It represents the quality guidelines search raters use to evaluate content. Since LLM models are trained on high EEAT content, presenting these signals clearly is the most effective way to gain citations."
                },
                {
                  q: "Which AI platforms are affected by GEO?",
                  a: "All generative search engines, including OpenAI Search (SearchGPT), ChatGPT Plus, Perplexity AI, Claude (with web access), Google Gemini (and Search Generative Experience), Microsoft Copilot, and voice assistants powered by LLMs."
                },
                {
                  q: "Does having an llms.txt file help GEO performance?",
                  a: "Yes. An llms.txt file acts as a robot-friendly sitemap for LLM crawlers, providing a brief summary and structured markdown paths to help AI models consume your site content efficiently without crawling raw HTML noise."
                },
                {
                  q: "What makes AI models choose my site over competitors?",
                  a: "AI models select sources that offer specific data points, verified facts, explicit expert credentials, structured question-and-answer sections, and strong external trust validation (such as G2 reviews, crunchbase profiles, and verified social media footprints)."
                },
                {
                  q: "How can I track if my website is cited in AI search results?",
                  a: "You can test citations by prompting AI tools directly about your industry niche, tracking referral traffic coming from domains like chatgpt.com or perplexity.ai, or using SoloSpider's AEO dashboard to automate tracking of your brand mentions."
                },
                {
                  q: "What are the risk factors of ignoring GEO optimization?",
                  a: "As users shift from classic search engines to AI assistants, ignoring GEO means your brand will not be recommended in generative responses. This leads to a gradual loss of market share to competitors who optimize their content for LLM extractability."
                },
                {
                  q: "Can I optimize for both traditional SEO and GEO at the same time?",
                  a: "Absolutely. Strong SEO and GEO are highly complementary. Traditional SEO builds domain authority and indexability, while GEO refines the on-page experience and factual density so that AI assistants can pull quote-worthy content."
                },
                {
                  q: "What content types perform best in AI search engines?",
                  a: "Highly detailed pages containing unique research, original statistics, expert case studies, and well-structured comparative tables perform best. Avoid superficial placeholders and focus on clear, definitive answers."
                },
                {
                  q: "How frequently should I update my content for GEO?",
                  a: "AI crawlers prioritize fresh, relevant information. Update your key resources, statistics, and about-pages regularly, and ensure the copyright and metadata dates are updated to show current signals."
                }
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="bg-[var(--bg-2)]/40 border border-[var(--line)]/50 rounded-2xl overflow-hidden shadow-xs transition-all">
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4.5 flex items-center justify-between text-left hover:bg-[var(--bg-2)]/60 transition-all cursor-pointer border-0"
                    >
                      <span className="text-xs sm:text-sm font-bold text-[var(--ink)]">{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--primary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1.5 border-t border-[var(--line)] animate-fade-in-up">
                        <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">
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
      </div>

      {/* Explore Free Tools Section */}
      <div className="geo-cta-section">
      {renderSectionWrapper(
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xl md:text-2xl font-black text-[var(--ink)]">Explore Free Tools</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1st Card: AI Media Studio */}
            <Link 
              href="/app/en/media-studio"
              className="bg-[var(--bg-2)]/30 border border-[var(--line)]/50 rounded-2xl p-6 hover:border-[var(--primary)]/20 hover:bg-[var(--panel)] transition-all duration-300 group flex flex-col justify-between h-56 shadow-xs cursor-pointer no-underline text-inherit"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-base text-[var(--ink)] mb-2">AI Media Studio</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">Design custom visual assets, social media graphics, and thumbnails tailored for your brand presence.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-[var(--primary)] uppercase tracking-widest mt-4">
                Launch Media Studio <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 2nd Card: SEO Audit Tool */}
            <div 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                const inp = document.getElementById("url-input") || document.querySelector("input[placeholder='example.com']");
                if (inp) {
                  (inp as HTMLInputElement).focus();
                }
              }}
              className="bg-[var(--bg-2)]/30 border border-[var(--line)]/50 rounded-2xl p-6 hover:border-[var(--primary)]/20 hover:bg-[var(--panel)] transition-all duration-300 group flex flex-col justify-between h-56 shadow-xs cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-base text-[var(--ink)] mb-2">SEO Audit Tool</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">Analyze on-page SEO issues, metadata headers, sitemaps, and indexing readiness instantly.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-[var(--primary)] uppercase tracking-widest mt-4">
                Run Free Audit <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* 3rd Card: Integrations */}
            <Link 
              href="/integrations"
              className="bg-[var(--bg-2)]/30 border border-[var(--line)]/50 rounded-2xl p-6 hover:border-[var(--primary)]/20 hover:bg-[var(--panel)] transition-all duration-300 group flex flex-col justify-between h-56 shadow-xs cursor-pointer no-underline text-inherit"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                  <Link2 className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-base text-[var(--ink)] mb-2">CMS &amp; API Integrations</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">Connect Shopify, WordPress, and custom APIs to publish updates automatically.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-[var(--primary)] uppercase tracking-widest mt-4">
                Manage Integrations <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>,
        true
      )}
      </div>

      <div className="geo-footer-section">
        <MarketingFooter />
      </div>

      {/* SoloSpider Setup Wizard Modal (Links all checker buttons/cards to actual functionality) */}
      <div data-wizard-modal>
        <AeoWizardModal 
          isOpen={isWizardOpen} 
          onClose={() => setIsWizardOpen(false)} 
          initialDomain={wizardDomain} 
        />
      </div>
    </div>
  );
}
