"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Loader2, Globe, Link as LinkIcon, Target, CheckSquare, Rocket } from "lucide-react";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { useAuth } from "@/hooks/useAuth";
import { triggerRazorpayCheckout } from "@/lib/razorpay";
import { CouponModal } from "@/components/dashboard/coupon-modal";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<"growth" | "scale">("growth");
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

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisUrl) return;
    setWizardDomain(analysisUrl);
    setIsWizardOpen(true);
  };

  const handlePlanClick = (planId: "growth" | "scale") => {
    setSelectedPlanId(planId);
    setCouponModalOpen(true);
  };

  const handleConfirmCoupon = (couponCode: string, email?: string) => {
    setCouponModalOpen(false);
    triggerRazorpayCheckout({
      planId: selectedPlanId,
      userEmail: email || user?.email,
      couponCode: couponCode || undefined,
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-primary/20 selection:text-[var(--ink)] overflow-x-hidden font-sans transition-colors duration-300"
      style={
        {
          "--bg": isDark ? "#0e0c1a" : "#fbfaf7",
          "--bg-2": isDark ? "#141226" : "#f3f2eb",
          "--panel": isDark ? "#1c1a35" : "#ffffff",
          "--line": isDark ? "#252340" : "#e2e1da",
          "--ink": isDark ? "#ffffff" : "#000000",
          "--ink-2": isDark ? "#e2e8f0" : "#0f172a",
          "--muted": isDark ? "#94a3b8" : "#334155",
        } as React.CSSProperties
      }
    >
      <MarketingNavbar 
        isDark={isDark} 
        onToggleTheme={toggleTheme} 
        onOpenWizard={() => { setWizardDomain(""); setIsWizardOpen(true); }} 
      />

      <main className="relative overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative w-full md:h-[769px] pt-[60px] pb-[40px] md:pt-[90.5px] md:pb-0 overflow-hidden border-b border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between" id="hero">
          {/* Background Grid (Concentric Circles & Radiating Lines matching Figma SVG layout) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <svg
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1920px] h-[859px] opacity-[0.09] dark:opacity-[0.14]"
              viewBox="0 0 1920 859"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Radiating Lines from bottom-center (960, 859) */}
              <line x1="960" y1="859" x2="960" y2="-53" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1195.2" y2="-21.8" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1416" y2="69.4" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1605.6" y2="213.4" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1749.6" y2="403" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1840.8" y2="623.8" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1872" y2="859" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1840.8" y2="1094.2" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1749.6" y2="1315" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1605.6" y2="1504.6" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1416" y2="1648.6" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="1195.2" y2="1739.8" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="724.8" y2="1739.8" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="504" y2="1648.6" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="314.4" y2="1504.6" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="170.4" y2="1315" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="79.2" y2="1094.2" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="48" y2="859" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="79.2" y2="623.8" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="170.4" y2="403" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="314.4" y2="213.4" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="504" y2="69.4" stroke="#9025F2" strokeWidth="1.275" />
              <line x1="960" y1="859" x2="724.8" y2="-21.8" stroke="#9025F2" strokeWidth="1.275" />

              {/* Concentric Circles centered at (960, 859) */}
              <circle cx="960" cy="859" r="144" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="264" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="408" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="576" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="744" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="912" stroke="#9025F2" strokeWidth="1.0625" />
              <circle cx="960" cy="859" r="1080" stroke="#9025F2" strokeWidth="1.0625" />
            </svg>
          </div>

          <div className="relative text-center max-w-[980px] mx-auto px-7 z-10 flex-grow flex flex-col justify-center items-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 h-[39px] px-5 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[12px] font-semibold text-[var(--ink)] mb-[25.5px] shadow-sm shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9025F2]"></span>
              Now live — The AI marketing OS for agencies &amp; creators
            </span>

            {/* Heading */}
            <h1 className="text-[34px] sm:text-[52px] md:text-[80px] leading-[1.05] mb-[20px] font-black tracking-tight text-[var(--ink)]">
              Replace Your Entire<br />
              <span className="grad-text">Marketing Workflow</span><br />
              With One Tool
            </h1>

            {/* Sub text */}
            <p className="text-[15px] sm:text-[18px] md:text-[20px] text-[var(--ink-2)] max-w-[760px] mx-auto mb-[32px] leading-[1.6] opacity-90">
              Solo Spider automates time-consuming marketing tasks while giving your team the tools they need to create content faster, improve SEO, and increase online visibility.
            </p>

            {/* URL Input Bar - Fully Mobile Responsive & Precise Figma Sizing */}
            <div className="w-full max-w-[640px] mx-auto mb-[20px]">
              <form onSubmit={handleStartAnalysis} className="h-auto sm:h-[62.5px] w-full p-2 sm:p-[9px] rounded-[16px] bg-[var(--panel)] border border-[var(--line)] shadow-[0_16px_40px_rgba(144,37,242,0.08)] hover:shadow-[0_20px_50px_rgba(144,37,242,0.14)] focus-within:border-primary/45 transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-grow flex items-center pl-2">
                  <Globe className="w-4.5 h-4.5 text-[var(--muted)] shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your website URL (e.g., example.com)"
                    value={analysisUrl}
                    onChange={(e) => setAnalysisUrl(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] font-semibold text-[14px] md:text-[15px] py-2 sm:py-0 px-2 placeholder-[var(--muted)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full sm:w-[180.14px] h-[44.5px] bg-primary hover:bg-primary-2 text-white font-extrabold text-[13.5px] rounded-[14px] shrink-0 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Start Analysis <span className="text-[13px] sm:text-[14px]">⚡</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Under-Input Text */}
            <p className="text-[11.5px] text-[var(--muted)] font-semibold mb-[36px] flex items-center justify-center gap-1.5">
              <span>⚡ SEO &amp; AEO scans start instantly in the background</span>
            </p>

            {/* Sub CTA Buttons with Exact Figma Sizing */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-[20px] mb-[32px]">
              <button onClick={() => router.push("/signup")} className="w-[173px] h-[50px] bg-[#9025F2] hover:bg-primary-2 text-white rounded-[5px] text-[14.5px] font-bold cursor-pointer shadow-md flex items-center justify-center">
                Start free trial →
              </button>
              <a href="#problem" className="w-[187px] h-[49px] rounded-[9.5px] text-[14.5px] font-bold border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--bg-2)] transition-all cursor-pointer flex items-center justify-center">
                See How It Works
              </a>
            </div>

            {/* Promo Items */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-semibold text-[var(--ink-2)] opacity-85">
              {["No credit card required", "Free plan available", "Set up in 5 minutes"].map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-emerald-500 text-[14px] font-extrabold">✓</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUSTED BY LOGO BAR (Separate Section to prevent grid line overflow) */}
        <section className="py-12 border-b border-[var(--line)] bg-[var(--bg)] relative z-10">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center text-[12.5px] sm:text-[13px] text-[var(--muted)] mb-7 tracking-wider uppercase font-bold">
              Trusted by 2,000+ agencies, freelancers, and solo founders
            </div>
            <div className="flex justify-center items-center gap-8 sm:gap-12 flex-wrap text-[var(--ink-2)] font-display font-bold text-base sm:text-lg opacity-70">
              <span className="tracking-tight">Loomstack</span>
              <span className="tracking-wider uppercase">NORTHWIND</span>
              <span className="font-extrabold uppercase">PEAK CO</span>
              <span className="flex items-center gap-1">◇ Lattice</span>
              <span className="uppercase tracking-widest font-extrabold">CIVIC</span>
              <span className="flex items-center gap-1.5 font-bold"><span className="text-xs">●</span> Pulse</span>
              <span className="font-serif italic font-medium">Modern</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PROBLEM SECTION – "You're paying for 6 tools…"               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)]" id="problem">
          <div className="max-w-[1240px] mx-auto px-7 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-14 items-center">
            {/* Left: Text */}
            <div className="text-left">
              <div className="mono text-pink-500 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                The problem
              </div>
              <h2 className="text-4xl md:text-[56px] leading-[1.1] mb-6 font-black tracking-tight">
                You&apos;re paying for <span className="text-pink-500">6 tools</span><br />
                that should be <span className="grad-text">one.</span>
              </h2>
              <div className="text-[17px] text-[var(--ink-2)] space-y-5 leading-relaxed">
                <p>The average digital marketer juggles Surfer SEO, Buffer, Canva, Ahrefs, a blog CMS, and a separate AI writing tool — spending ₹30,000–₹80,000 a month on subscriptions that barely talk to each other.</p>
                <p>That&apos;s before counting the hours lost copy-pasting between tools, briefing freelancers, chasing approvals, and manually posting content.</p>
                <p>Solo Spider was built to collapse the entire stack into a single, automated workflow — so you spend less time on the tools and more time on the work that actually grows your business.</p>
              </div>
            </div>

            {/* Right: Diagram */}
            <div className="relative w-full max-w-[680px] mx-auto" style={{ minHeight: 420 }}>
              {/* SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 680 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 110,55 C 160,55 170,195 195,195" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 150,105 C 180,105 180,195 195,195" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 80,175 C 130,175 170,195 195,195" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 155,195 C 175,195 185,195 195,195" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 80,280 C 130,280 170,210 195,210" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 155,345 C 175,345 185,230 195,210" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <line x1="210" y1="205" x2="265" y2="205" stroke={isDark ? "#ffffff15" : "#00000010"} strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="415" y1="205" x2="470" y2="205" stroke={isDark ? "#ffffff15" : "#00000010"} strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 485,195 C 510,195 520,65 535,65" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 485,195 C 510,195 520,140 535,140" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 485,205 C 510,205 520,215 535,215" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 485,210 C 510,210 520,290 535,290" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <path d="M 485,215 C 510,215 520,360 535,360" stroke={isDark ? "#ffffff20" : "#00000015"} strokeWidth="1.5" fill="none" />
                <circle cx="200" cy="205" r="6" fill={isDark ? "#1c1a35" : "#ffffff"} stroke={isDark ? "#ffffff30" : "#00000020"} strokeWidth="1.5" />
                <circle cx="200" cy="205" r="2.5" fill={isDark ? "#ffffff" : "#000000"} />
                <circle cx="480" cy="205" r="6" fill={isDark ? "#1c1a35" : "#ffffff"} stroke={isDark ? "#ffffff30" : "#00000020"} strokeWidth="1.5" />
                <circle cx="480" cy="205" r="2.5" fill={isDark ? "#ffffff" : "#000000"} />
              </svg>

              {/* Left: 6 tool cards */}
              {[
                { icon: "📊", name: "Surfer", sub: "", top: 20, left: 0 },
                { icon: "☰", name: "Buffer", sub: "Social", top: 70, left: 90 },
                { icon: "✦", name: "Canva", sub: "Design", top: 140, left: -5 },
                { icon: "⟐", name: "ahrefs", sub: "SEO", top: 160, left: 90 },
                { icon: "✎", name: "CMS", sub: "", top: 245, left: 0 },
                { icon: "◎", name: "AI Writing", sub: "", top: 305, left: 80 },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="absolute z-10 flex flex-col items-center"
                  style={{ top: tool.top, left: tool.left }}
                >
                  <div className="w-[62px] h-[62px] rounded-2xl bg-[#141226] text-white flex flex-col items-center justify-center border border-white/10 shadow-lg">
                    <span className="text-[18px] mb-0.5">{tool.icon}</span>
                    <span className="text-[8px] font-extrabold tracking-wide uppercase leading-none">{tool.name}</span>
                  </div>
                  {tool.sub && (
                    <span className="text-[8px] font-bold text-[var(--muted)] mt-1 uppercase tracking-wider">{tool.sub}</span>
                  )}
                </div>
              ))}

              {/* Center: Purple gradient squircle */}
              <div className="absolute z-10" style={{ top: 115, left: 265 }}>
                <div className="w-[150px] h-[170px] rounded-[28px] flex flex-col items-center justify-center text-white shadow-[0_20px_50px_rgba(144,37,242,0.4)] border border-white/15" style={{ background: 'linear-gradient(180deg, #a855f7 0%, #9025F2 50%, #c084fc 100%)' }}>
                  <span className="text-[42px] mb-1">🕷️</span>
                  <span className="font-display font-black text-[15px] tracking-wide">solospider</span>
                </div>
              </div>

              {/* Right: 5 target capsules */}
              {[
                { icon: "✓", title: "SEO", sub: "SEARCH ENGINE OPTIMIZED", top: 35 },
                { icon: "★", title: "AEO", sub: "ANSWER ENGINE OPTIMIZED", top: 112 },
                { icon: "📍", title: "GEO", sub: "GEOGRAPHICALLY OPTIMIZED", top: 189 },
                { icon: "💬", title: "Social", sub: "SOCIAL MEDIA OPTIMIZED", top: 262 },
                { icon: "✍", title: "AI Writing", sub: "AI POWERED CONTENT", top: 335 },
              ].map((item) => (
                <div
                  key={item.title}
                  className="absolute z-10"
                  style={{ top: item.top, right: 0 }}
                >
                  <div className="w-[145px] h-[60px] rounded-xl bg-[#141226] text-white flex items-center gap-2.5 px-3 border border-white/8 shadow-md">
                    <span className="text-[14px] shrink-0">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-[12px] leading-tight">{item.title}</span>
                      <span className="text-[6.5px] tracking-wider text-gray-400 font-bold leading-tight mt-0.5 uppercase">{item.sub}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD PREVIEW                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[960px] mx-auto mb-16">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● Dashboard
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[48px] tracking-tight font-black text-[var(--ink)] whitespace-nowrap">
                Built for agencies. Priced for solo creators.
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[760px] mx-auto">Solo Spider works whether you&apos;re running campaigns for 20 clients or building a brand entirely on your own.</p>
            </div>

            <div className="relative w-full max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-[var(--line)] shadow-[0_32px_64px_-24px_rgba(14,12,26,0.22)]">
              <img
                src="/assets/Frame-57.png"
                alt="Solo Spider Dashboard Preview"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* WHO IT'S FOR – Two cards side by side                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)]" id="audience">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[960px] mx-auto mb-16">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● Who it&apos;s for
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[48px] tracking-tight font-black text-[var(--ink)] whitespace-nowrap">
                Built for agencies. Priced for solo creators.
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[760px] mx-auto">Solo Spider works whether you&apos;re running campaigns for 20 clients or building a brand entirely on your own.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {/* Agency Card */}
              <div className="relative p-[1.5px] bg-gradient-to-b from-primary via-[#b260ff] to-transparent rounded-3xl overflow-hidden shadow-[0_20px_50px_-28px_rgba(14,12,26,0.1)] group">
                <div className="bg-[var(--panel)] bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] rounded-[22px] p-10 lg:p-11 flex flex-col gap-4.5 relative z-10 h-full">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary text-white text-[12px] font-semibold border border-primary tracking-wide self-start mb-4">
                    For Agencies
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-[var(--ink)] mb-4">Scale your agency without increasing operational complexity</h3>
                  <p className="text-[15px] text-[var(--ink-2)] leading-relaxed mb-6">Growing an agency shouldn&apos;t mean juggling more tools or adding unnecessary overhead. Solo Spider helps you streamline content creation, social media management, SEO, and AI search visibility across every client account—all from one centralized platform.</p>
                  
                  <div className="flex flex-col gap-3 mb-8">
                    {[
                      "Manage multiple client brands from a single workspace",
                      "Generate blogs, social posts, captions, and creative assets tailored to each client",
                      "Plan, schedule, and publish content across channels with ease",
                      "Deliver clear, client-friendly SEO audit reports",
                      "Show up in AI search results before your competitors do (AEO & GEO)",
                      "Share professional white-label reports with clients"
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 items-start text-[14.5px] text-[var(--ink)]">
                        <div className="shrink-0 w-[22px] h-[22px] rounded-full bg-primary text-white flex items-center justify-center text-[12px] font-extrabold mt-0.5">✓</div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className="btn bg-primary text-white hover:bg-primary-2 self-start mt-auto cursor-pointer">Explore Agency Plan →</button>
                </div>
              </div>

              {/* Individual Card */}
              <div className="relative bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-10 lg:p-11 flex flex-col gap-4.5 overflow-hidden shadow-[0_20px_50px_-28px_rgba(14,12,26,0.1)] group">
                <div className="relative z-10">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary-soft text-primary-2 text-[12px] font-semibold border border-primary/20 tracking-wide self-start mb-4">
                    For Individuals
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-[var(--ink)] mb-4">Grow your marketing without the complexity</h3>
                  <p className="text-[15px] text-[var(--ink-2)] leading-relaxed mb-6">Running a business means wearing many hats. Solo Spider helps you simplify your marketing by automating content creation, social media, SEO, and AI search visibility—all from one easy-to-use platform.</p>
                  
                  <div className="flex flex-col gap-3 mb-8">
                    {[
                      "Publish blog posts without managing a complex CMS",
                      "Generate engaging social media images, videos, and captions in minutes",
                      "Identify and resolve SEO issues with guided recommendations",
                      "Increase your visibility across ChatGPT, Gemini, AI Overviews, and other AI-powered search experiences",
                      "Plan, create, and schedule a month's worth of content in under an hour"
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 items-start text-[14.5px] text-[var(--ink)]">
                        <div className="shrink-0 w-[22px] h-[22px] rounded-full bg-primary text-white flex items-center justify-center text-[12px] font-extrabold mt-0.5">✓</div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className="btn btn-ghost self-start mt-auto cursor-pointer">Explore Solo Plan →</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* AI SEARCH METRICS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-16">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● AI Search Metrics
              </span>
              <h2 className="mb-4 text-4xl md:text-[54px] tracking-tight font-black text-[var(--ink)] leading-[1.1]">
                Discover how AI<br />interprets your brand
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[660px] mx-auto">
                Track the most important performance indicators across AI search.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 items-stretch">
              {/* Left Column: SEO/AEO/GEO Cards */}
              <div className="flex flex-col gap-5 justify-between">
                {[
                  {
                    title: "SEO",
                    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  },
                  {
                    title: "AEO",
                    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  },
                  {
                    title: "GEO",
                    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-6 md:p-8 rounded-2xl text-left flex flex-col justify-center border ${
                      idx === 0
                        ? "bg-white dark:bg-[var(--panel)] border-[var(--line)] shadow-[0_12px_36px_rgba(144,37,242,0.06)]"
                        : "bg-[#F4F3EE] dark:bg-[var(--panel-soft)] border-transparent"
                    }`}
                  >
                    <h3 className="text-2xl font-black mb-2.5 font-display text-[var(--ink)]">
                      {item.title}
                    </h3>
                    <p className="text-[14px] text-[var(--ink-2)] leading-relaxed opacity-90">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Column: Search Mockup */}
              <div className="bg-[#F4F3EE] dark:bg-[var(--panel-soft)] rounded-[32px] p-6 lg:p-8 flex flex-col gap-6 text-left border border-[var(--line)]">
                <div className="flex items-center justify-between bg-white dark:bg-[var(--panel)] rounded-full pl-5 pr-1.5 py-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-[var(--line)]">
                  <span className="text-[13.5px] text-[var(--ink-2)] opacity-70 font-medium">Digital Marketing Company...</span>
                  <button type="button" className="w-9 h-9 rounded-full bg-[#9025F2] hover:bg-[#7c1ed4] text-white flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-col gap-6">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="flex flex-col gap-1.5 border-b border-dashed border-[var(--line)] pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[13.5px] text-[#9025F2] font-black">0{num}.</span>
                        <span className="text-[13.5px] font-black text-[var(--ink)]">www.website.com</span>
                      </div>
                      <span className="text-[11px] text-[var(--muted)] pl-[26px] font-mono leading-none">www.website.com</span>
                      <div className="pl-[26px] flex flex-col gap-1.5 mt-2">
                        <div className="h-[6px] bg-[#e5e4de] dark:bg-[var(--line)] rounded-full w-[70%]"></div>
                        <div className="h-[6px] bg-[#e5e4de] dark:bg-[var(--line)] rounded-full w-[50%]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SIX SUPERPOWERS – 2×2 feature card grid                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]" id="features">
          <div className="max-w-[1240px] mx-auto px-7">
            {/* 2-Column Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-16 text-left border-b border-[var(--line)] pb-10">
              <div>
                <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                  ● Everything included
                </span>
                <h2 className="text-4xl md:text-[54px] tracking-tight font-black leading-tight text-[var(--ink)]">
                  Six superpowers.<br />
                  One subscription.
                </h2>
              </div>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[540px] leading-relaxed lg:text-right">
                No integrations to configure. No freelancers to brief. No tool-switching. Everything works together because it lives in one place.
              </p>
            </div>

            {/* 2×2 Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  num: "01",
                  category: "CONTENT & BLOG AUTOMATION",
                  title: "Write less. Publish more.",
                  desc: "Solo Spider generates long-form, SEO-optimised blog posts in your brand voice — then schedules and publishes them automatically. You approve. It does everything else.",
                  mockup: (
                    <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl p-4.5 mt-4 flex flex-col gap-3.5 text-[11px] text-[var(--ink)]">
                      <div className="flex gap-2 items-center">
                        <input type="text" readOnly placeholder="Enter Main Keywords" className="flex-1 bg-[var(--panel)] border border-[var(--line)] px-2.5 py-1.5 rounded text-[10px] placeholder-[var(--muted)]" />
                        <input type="text" readOnly placeholder="Enter Title" className="flex-1 bg-[var(--panel)] border border-[var(--line)] px-2.5 py-1.5 rounded text-[10px] placeholder-[var(--muted)]" />
                        <select disabled className="bg-[var(--panel)] border border-[var(--line)] p-1.5 rounded text-[10px]"><option>Eng (US)</option></select>
                        <button type="button" className="bg-primary text-white px-3 py-1.5 rounded font-bold text-[10px]">Generate</button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[9px] uppercase font-mono font-bold text-[var(--muted)]">Core Settings</div>
                        <div className="grid grid-cols-4 gap-1.5 text-[9px] text-[var(--ink-2)]">
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Language</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Type</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Size</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Level</div>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[9px] text-[var(--ink-2)]">
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Tone</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Point of View</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Readability</div>
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-1 rounded text-center">Select Target country</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-[var(--line)]">
                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--muted)] font-semibold">
                          <span>📁</span> Upload Image
                        </div>
                        <button type="button" className="btn btn-grad py-1.5 px-4 text-[9.5px] font-bold rounded-lg shadow-sm">Generate Blog Post</button>
                      </div>
                    </div>
                  ),
                },
                {
                  num: "02",
                  category: "SOCIAL MEDIA — END TO END",
                  title: "Plan It. Generate It. Post It. Automatically.",
                  desc: "From on-brand images and short-form videos to captions and hashtags — Solo Spider handles your entire social media presence without you logging into a single platform.",
                  mockup: (
                    <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl p-4.5 mt-4 flex flex-col gap-2.5 text-[10px] text-[var(--ink-2)] overflow-hidden">
                      <div className="grid grid-cols-7 border-b border-[var(--line)] pb-2 text-[8px] font-mono uppercase font-bold text-[var(--muted)] text-center">
                        <div>Time</div>
                        <div>Sun 28</div>
                        <div>Mon 29</div>
                        <div>Tue 30</div>
                        <div>Wed 01</div>
                        <div>Thu 02</div>
                        <div>Fri 03</div>
                      </div>
                      <div className="relative flex flex-col gap-3.5 h-[130px] overflow-hidden">
                        {[ "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM" ].map((time, idx) => (
                          <div key={idx} className="flex items-center border-b border-[var(--line)] pb-1.5 last:border-0 last:pb-0">
                            <span className="w-10 text-[8px] text-[var(--muted)] font-mono">{time}</span>
                            <div className="flex-1 grid grid-cols-6 gap-1"></div>
                          </div>
                        ))}
                        <div className="absolute top-[5px] left-[55px] z-10 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded p-1.5 text-[7.5px] flex flex-col gap-0.5 leading-tight font-bold w-[75px] shadow-sm">
                          <div className="flex items-center gap-1">🔷 Facebook</div>
                          <div>12K Reach</div>
                          <div className="opacity-80">5% Eng.</div>
                        </div>
                        <div className="absolute top-[40px] left-[140px] z-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded p-1.5 text-[7.5px] flex flex-col gap-0.5 leading-tight font-bold w-[75px] shadow-sm">
                          <div className="flex items-center gap-1">💼 LinkedIn</div>
                          <div>8.5K Reach</div>
                          <div className="opacity-80">3% Eng.</div>
                        </div>
                        <div className="absolute top-[8px] right-[65px] z-10 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded p-1.5 text-[7.5px] flex flex-col gap-0.5 leading-tight font-bold w-[75px] shadow-sm">
                          <div className="flex items-center gap-1">📷 Instagram</div>
                          <div>15K Reach</div>
                          <div className="opacity-80">4% Eng.</div>
                        </div>
                        <div className="absolute top-[45px] right-[2px] z-10 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-[var(--ink)] rounded p-1.5 text-[7.5px] flex flex-col gap-0.5 leading-tight font-bold w-[75px] shadow-sm">
                          <div className="flex items-center gap-1">🐦 X</div>
                          <div>6K Reach</div>
                          <div className="opacity-80">4% Eng.</div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  num: "03",
                  category: "SEO — AUDIT & FIX",
                  title: "Identify SEO Issues. Fix Them with Ease.",
                  desc: "Solo Spider scans your entire website for SEO issues — broken tags, slow pages, missing meta descriptions, weak internal linking — then helps you fix them without touching code.",
                  mockup: (
                    <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl p-4.5 mt-4 flex flex-col gap-3.5 text-[10px] text-[var(--ink)]">
                      <div className="grid grid-cols-4 gap-2 text-center font-mono">
                        <div className="p-2 bg-[var(--panel)] border border-[var(--line)] rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">On-Page Score</div>
                          <div className="text-xs font-black text-rose-500 mt-0.5">46 ↓</div>
                        </div>
                        <div className="p-2 bg-[var(--panel)] border border-[var(--line)] rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Organic Traffic</div>
                          <div className="text-xs font-black text-emerald-500 mt-0.5">164 ↑ 20%</div>
                        </div>
                        <div className="p-2 bg-[var(--panel)] border border-[var(--line)] rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Keywords</div>
                          <div className="text-xs font-black text-emerald-500 mt-0.5">251 ↑ 25%</div>
                        </div>
                        <div className="p-2 bg-[var(--panel)] border border-[var(--line)] rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Backlinks</div>
                          <div className="text-xs font-black text-emerald-500 mt-0.5">90 ↑ 15%</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 text-[9px] border-t border-[var(--line)] pt-3">
                        <div className="text-[8px] uppercase font-mono font-bold text-[var(--muted)]">Target Market &amp; Competitors</div>
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1 font-bold">🌐 Market: <span className="text-primary font-bold">United States</span></div>
                          <div className="flex gap-1">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px]">abcompany.com</span>
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px]">xyz.com</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 border-t border-[var(--line)] pt-3 text-[9px]">
                        <div className="flex gap-3 text-[8px] uppercase font-mono font-bold text-[var(--muted)]">
                          <span className="text-primary border-b border-primary pb-0.5">SEO Issues (8)</span>
                          <span>Audited Pages (27)</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[8.5px]">
                          <div className="flex items-center gap-1.5 text-rose-500 font-semibold">⚠️ 16 pages are missing title tags</div>
                          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">⚠️ 2 pages have duplicate title tags</div>
                          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">⚠️ 18 pages are missing descriptions</div>
                          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">⚠️ 17 pages are missing H1 tags</div>
                          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">⚠️ 16 pages have thin content (&lt;200 wo...</div>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  num: "04",
                  category: "AEO & GEO — BE FOUND IN AI SEARCH",
                  title: "Google Is Changing. Your Visibility Strategy Should Too.",
                  desc: "AI-powered search is here. ChatGPT, Gemini, and Google's AI Overviews are now answering questions directly — and most brands are invisible in those answers. Solo Spider helps you show up.",
                  mockup: (
                    <div className="bg-[var(--bg-2)] border border-[var(--line)] rounded-xl p-4.5 mt-4 flex flex-col gap-3 text-[10px] text-[var(--ink)]">
                      <div className="flex justify-between items-center border-b border-[var(--line)] pb-2">
                        <span className="font-mono text-[9px] uppercase font-bold text-emerald-500 flex items-center gap-1">🟢 Scan Complete</span>
                        <button type="button" className="px-2 py-0.5 border border-primary/20 text-primary text-[8px] rounded font-bold hover:bg-primary-soft">Re-scan</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center font-mono">
                        <div className="bg-[var(--panel)] border border-[var(--line)] p-2 rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Active Prompts</div>
                          <div className="text-sm font-black text-primary mt-0.5">30</div>
                        </div>
                        <div className="bg-[var(--panel)] border border-[var(--line)] p-2 rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Citations</div>
                          <div className="text-sm font-black text-primary mt-0.5">00</div>
                        </div>
                        <div className="bg-[var(--panel)] border border-[var(--line)] p-2 rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">Query Fanouts</div>
                          <div className="text-sm font-black text-primary mt-0.5">00</div>
                        </div>
                        <div className="bg-[var(--panel)] border border-[var(--line)] p-2 rounded-lg">
                          <div className="text-[7px] uppercase text-[var(--muted)] font-bold">AI Referrals</div>
                          <div className="text-sm font-black text-primary mt-0.5">00</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold">🤖 Gemini</span>
                          <div className="w-[180px] bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold">🟠 Claude</span>
                          <div className="w-[180px] bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: '20%' }}></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold">🟢 ChatGPT</span>
                          <div className="w-[180px] bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ].map((card) => (
                <div key={card.num} className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-7 lg:p-8 flex flex-col text-left transition-all duration-200 hover:border-primary/30 hover:-translate-y-1 shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)]">
                  <div className="flex justify-between items-center mb-3.5 border-b border-[var(--line)] pb-2.5">
                    <span className="font-mono text-[12px] text-[var(--muted)] font-bold">{card.num}</span>
                    <span className="text-[9px] font-bold text-primary font-mono tracking-wider uppercase">{card.category}</span>
                  </div>
                  <h4 className="font-display text-[20px] font-bold tracking-tight text-[var(--ink)] mb-2">{card.title}</h4>
                  <p className="text-[14px] text-[var(--ink-2)] leading-relaxed">{card.desc}</p>
                  {card.mockup}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS – 4 step cards                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]" id="how">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● How it works
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                From setup to running on<br />autopilot in one day.
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[660px] mx-auto">Connect your accounts, customize your preferences, and let Solo Spider automate your marketing workflows from one unified platform.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {[
                { icon: LinkIcon, title: "Connect your channels", desc: "Link your website, social accounts, and any existing CMS. Solo Spider pulls in your brand voice, existing content, and target audience automatically." },
                { icon: Target, title: "Set your goals", desc: "Tell Solo Spider what you want to achieve — more blog traffic, stronger social presence, better rankings, or AI search visibility. It builds your content strategy around your goals." },
                { icon: CheckSquare, title: "Review and approve", desc: "Solo Spider generates your blogs, social posts, and SEO fixes. You review, tweak if you like, and hit approve. Or set it to fully auto — your call." },
                { icon: Rocket, title: "Watch it run", desc: "Content goes live. Posts publish. SEO improves. AI search visibility grows. You get weekly reports showing exactly what's working — and what Solo Spider is doing about what isn't." }
              ].map((step, i) => (
                <div key={i} className="bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-7 lg:p-8 flex flex-col gap-3.5 transition-all duration-250 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(144,37,242,0.2)] shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)] text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-1">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-display text-[20px] font-bold tracking-tight text-[var(--ink)]">{step.title}</h4>
                  <p className="text-[14px] text-[var(--ink-2)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NUMBERS – "Real Results. Not Marketing Fluff."                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)] overflow-hidden">
          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● By the numbers
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                Real Results.<br />Not Marketing Fluff.
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(14,12,26,0.1)]">
              {[
                { v: "10×", l: "Faster content production vs. doing it manually." },
                { v: "6 tools", l: "Replaced by a single Solo Spider subscription." },
                { v: "80%", l: "Reduction in time spent on repetitive marketing tasks." },
                { v: "5 mins", l: "Average setup time to publish your first blog." },
                { v: "₹40k+", l: "Avg. monthly tool cost replaced by one Solo Spider plan." },
                { v: "2,000+", l: "Agencies and creators already using Solo Spider." }
              ].map((num, i) => (
                <div key={i} className="bg-[var(--panel)] p-8 lg:p-12 flex flex-col gap-2.5 text-left">
                  <div className="font-display font-black text-5xl lg:text-[64px] leading-none tracking-tight text-primary">{num.v}</div>
                  <div className="text-[14.5px] text-[var(--ink-2)] leading-relaxed">{num.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COMPARISON TABLE                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● vs. the old way
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                Stop Paying for a Stack.<br />Start Using a System.
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[660px] mx-auto">Here&apos;s what Solo Spider replaces — and what none of those tools can do together.</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-[var(--panel)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(14,12,26,0.08)]">
              <div className="grid grid-cols-[1.6fr_repeat(6,1fr)] items-center bg-gradient-to-b from-[var(--bg-2)] to-[var(--bg)] border-b border-[var(--line)]">
                <div className="py-4.5 px-6 font-display font-bold text-[13px] text-[var(--ink)] text-left border-r border-[var(--line)]">Capability</div>
                <div className="py-4.5 px-4 font-display font-extrabold text-[14px] text-white bg-primary text-center border-r border-[var(--line)]">Solo Spider</div>
                {["Surfer SEO", "Buffer", "Canva Pro", "Ahrefs", "ChatGPT"].map((tool) => (
                  <div key={tool} className="py-4.5 px-4 font-display font-bold text-[13px] text-[var(--ink-2)] text-center border-r last:border-r-0 border-[var(--line)]" role="columnheader">{tool}</div>
                ))}
              </div>
              
              {[
                { name: "Blog writing & publishing", vals: ["✓", "—", "—", "—", "—", "Partial"] },
                { name: "Blog scheduling", vals: ["✓", "—", "—", "—", "—", "—"] },
                { name: "Social image generation", vals: ["✓", "—", "—", "✓", "—", "—"] },
                { name: "Social video generation", vals: ["✓", "—", "—", "Partial", "—", "—"] },
                { name: "Social scheduling & posting", vals: ["✓", "—", "✓", "—", "—", "—"] },
                { name: "SEO audit & fixes", vals: ["✓", "✓", "—", "—", "✓", "—"] },
                { name: "AEO analysis", vals: ["✓", "—", "—", "—", "—", "—"] },
                { name: "GRO / AI search visibility", vals: ["✓", "—", "—", "—", "—", "—"] },
                { name: "All-in-one dashboard", vals: ["✓", "—", "—", "—", "—", "—"] },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-[1.6fr_repeat(6,1fr)] items-center border-b border-[var(--line)] last:border-b-0 even:bg-[var(--bg-2)]" role="row">
                  <div className="py-4.5 px-6 font-semibold text-[13.5px] text-[var(--ink)] border-r border-[var(--line)] text-left">{row.name}</div>
                  <div className="py-4.5 px-4 text-center border-r border-[var(--line)] bg-primary/5 font-bold text-primary text-[18px]">
                    {row.vals[0] === "✓" ? "✓" : <span className="text-[11.5px] font-semibold bg-[#fef3c7] text-[#b45309] px-2 py-1 rounded-md">{row.vals[0]}</span>}
                  </div>
                  {row.vals.slice(1, 6).map((val, j) => (
                    <div key={j} className="py-4.5 px-4 text-center border-r last:border-r-0 border-[var(--line)]">
                      {val === "✓" ? <span className="text-primary font-extrabold text-[18px]">✓</span> : val === "—" ? <span className="text-[#c4c4d1] text-[18px]">—</span> : <span className="text-[11.5px] font-semibold bg-[#fef3c7] text-[#b45309] px-2 py-1 rounded-md">{val}</span>}
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="grid grid-cols-[1.6fr_repeat(6,1fr)] items-center bg-[var(--bg-2)] font-semibold" role="row">
                <div className="py-4.5 px-6 text-[13.5px] text-[var(--ink)] border-r border-[var(--line)] text-left">Typical monthly cost</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] bg-primary/5 text-primary text-[13.5px]">₹20,000</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">₹8,000+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">₹3,500+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">₹2,000+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">₹15,000+</div>
                <div className="py-4.5 px-4 text-center text-[var(--ink-2)] text-[13.5px]">₹1,600+</div>
              </div>
            </div>

            {/* Mobile Fallback */}
            <div className="grid lg:hidden gap-4 text-left">
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 shadow-[0_14px_30px_-22px_rgba(14,12,26,0.08)]">
                <h4 className="font-display font-bold text-[16px] mb-3 grad-text">Solo Spider replaces all five</h4>
                {[
                  "Blog writing & publishing", "Blog scheduling", "Social image generation",
                  "Social video generation", "Social scheduling & posting", "SEO audit & fixes",
                  "AEO analysis", "GRO / AI search visibility", "All-in-one dashboard"
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-[13px] border-b border-dashed border-[var(--line)] last:border-b-0">
                    <span className="text-[var(--ink)]">{item}</span>
                    <span className="text-primary font-bold">✓</span>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 shadow-[0_14px_30px_-22px_rgba(14,12,26,0.08)]">
                <h4 className="font-display font-bold text-[16px] mb-3 text-[var(--ink)]">What you&apos;d pay for the stack</h4>
                {[
                  { n: "Surfer SEO", p: "₹8,000+" },
                  { n: "Buffer", p: "₹3,500+" },
                  { n: "Canva Pro", p: "₹2,000+" },
                  { n: "Ahrefs", p: "₹15,000+" },
                  { n: "ChatGPT", p: "₹1,600+" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-[13px] border-b border-dashed border-[var(--line)] last:border-b-0 text-[var(--ink-2)]">
                    <span className="text-[var(--ink)]">{item.n}</span>
                    <span>{item.p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[var(--muted)] text-[13px] mt-4.5">Prices approximate. Solo Spider replaces all five — for less than the cost of one.</div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PRICING                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)]" id="pricing">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[48px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● Pricing
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                One Price.<br />Everything included.
              </h2>
              <p className="text-[18px] text-[var(--ink-2)] max-w-[660px] mx-auto">No feature gating. No per-seat pricing surprises. Pick the plan that fits your volume and get access to every single Solo Spider capability.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-[1240px] mx-auto text-left">
              {/* Free Plan */}
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Free forever</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Free</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For creators just getting started</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-primary">₹0</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-5 mt-1">
                  {[
                    "1 project",
                    "1 AI model (+$50/extra)",
                    "5 blog posts/month",
                    "30 social posts (schedule only)",
                    "1 SEO audit (total)",
                    "SEO recommendations only",
                    "5 social media connections",
                    "SoloSpider branding on reports",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-primary text-[14px] font-bold">✓</span>
                      <span className="leading-tight text-[var(--ink-2)]">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-3 text-xs border-[var(--line)] hover:border-primary">Get started free →</button>
              </div>

              {/* Starter Plan */}
              <div className="relative border-2 border-primary bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] shadow-[0_20px_50px_-12px_rgba(144,37,242,0.18)] rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(144,37,242,0.28)] overflow-visible">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white font-display font-extrabold text-[10px] tracking-widest uppercase px-5 py-2 rounded-full z-20 shadow-[0_4px_14px_rgba(144,37,242,0.5)] whitespace-nowrap" style={{background:'#9025F2'}}>Most popular</span>
                
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Recommended for creators</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] -mt-1 uppercase">Starter</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For founders, freelancers &amp; creators</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[46px] leading-none tracking-tight text-primary">$199</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-5 mt-1">
                  {[
                    "5 projects (+$50/extra)",
                    "4 AI models (+$50/extra)",
                    "Unlimited blog posts",
                    "Unlimited social scheduling",
                    "30 AI media studio posts/mo",
                    "Weekly SEO audit + AI fix",
                    "Unlimited AEO/GEO",
                    "5 social media connections",
                    "Priority support",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-primary text-[14px] font-bold">✓</span>
                      <span className="leading-tight text-[var(--ink-2)] font-semibold">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanClick("growth")} className="btn btn-grad w-full justify-center mt-auto cursor-pointer py-3 text-xs relative overflow-hidden transition-all duration-200">Start Starter plan →</button>
              </div>

              {/* Growth Plan */}
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">For scaling businesses</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Growth</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For growing teams &amp; agencies</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-[var(--ink)]">$699</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-5 mt-1">
                  {[
                    "10 projects (+$50/extra)",
                    "7 AI models (+$50/extra)",
                    "Unlimited blog posts",
                    "Unlimited social scheduling",
                    "30 AI media studio posts/mo",
                    "Weekly SEO audit + AI fix",
                    "Unlimited AEO/GEO",
                    "5 social media connections",
                    "Your brand logo on reports",
                    "API access (coming soon)",
                    "24/7 dedicated support",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-primary text-[14px] font-bold">✓</span>
                      <span className="leading-tight text-[var(--ink-2)]">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanClick("scale")} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-3 text-xs border-[var(--line)] hover:border-primary">Start Growth plan →</button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Best for enterprise</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Enterprise</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For large teams &amp; custom volume</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-[var(--ink)]">Custom</span>
                </div>
                <div className="flex flex-col gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-5 mt-7">
                  {[
                    "Custom projects",
                    "Custom AI models",
                    "Custom blog generation",
                    "Custom social & media studio",
                    "Custom SEO audit + AI fix",
                    "Custom AEO/GEO",
                    "Custom social connections",
                    "Your brand on reports",
                    "Full API access",
                    "Custom SLA & support",
                    "Dedicated onboarding call",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-primary text-[14px] font-bold">✓</span>
                      <span className="leading-tight text-[var(--ink-2)]">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-3 text-xs border-[var(--line)] hover:border-primary">Talk to us →</button>
              </div>
            </div>

            <div className="text-center mt-12 text-[var(--muted)] text-[14px] leading-relaxed">
              All plans include a <strong className="text-[var(--ink)]">7-day free trial</strong>. Credit card required.
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FAQs                                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● Common questions
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                Everything you want to<br />know before you sign up.
              </h2>
            </div>
            
            <div className="max-w-[880px] mx-auto flex flex-col gap-3.5 text-left">
              {[
                { q: "Do I need any technical skills to use Solo Spider?", a: "Not at all. Solo Spider is designed to be used without any coding or technical knowledge. If you can use Gmail, you can use Solo Spider. Setup takes under 5 minutes." },
                { q: "Will the content actually sound like me?", a: "Yes. Solo Spider learns your brand voice from your existing content, website, and the preferences you set during onboarding. You can always edit and refine drafts before publishing — but most users find they barely need to." },
                { q: "What platforms does Solo Spider post to?", a: "Instagram, LinkedIn, X (Twitter), Facebook, and more. Blog publishing works with WordPress, Webflow, Wix, and custom CMS setups via API." },
                { q: "What's AEO and GRO — do I really need it?", a: "AEO (Answer Engine Optimisation) and GRO (Generative Result Optimisation) help you appear in AI-generated search results — like Google's AI Overviews, ChatGPT, and Gemini answers. AI search is growing rapidly. Brands that optimise for it now will have a significant advantage. Yes, you need it." },
                { q: "How is Solo Spider different from just using ChatGPT?", a: "ChatGPT can write — but it can't publish, schedule, audit, post, or track your SEO and AI visibility. Solo Spider wraps powerful AI writing with an end-to-end marketing workflow. It's the difference between having an ingredient and having a meal." },
                { q: "Can I manage multiple clients or brands?", a: "Yes. The Agency plan supports client workspaces, each with their own brand settings, content calendars, and reports. You can manage everything without ever logging out." },
                { q: "Is there a free trial?", a: "Yes — every paid plan comes with a 14-day free trial. No credit card required. You can also use the Starter plan for free, forever." },
              ].map((faq, i) => (
                <div key={i} className={`bg-[var(--panel)] border border-[var(--line)] rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-primary/20' : ''}`}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex justify-between items-center gap-4.5 p-5 lg:px-6 lg:py-5 text-left font-display font-semibold text-[18px] text-[var(--ink)]"
                  >
                    <span>{faq.q}</span>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[14px] transition-all duration-200 ${openFaq === i ? 'bg-primary text-white rotate-45 border border-transparent' : 'bg-primary-soft text-primary border border-primary/15'}`}>
                      {openFaq === i ? "×" : "+"}
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-350 ease-in-out ${openFaq === i ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-6 pt-4 border-t border-[var(--line)] text-[15px] text-[var(--ink-2)] leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FINAL CTA                                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative bg-[var(--bg-2)] overflow-hidden py-20 md:py-[130px]">
          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className={`rounded-[32px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(144,37,242,0.25)] p-[1.5px] transition-all duration-300 ${
              isDark ? "bg-gradient-to-b from-primary to-transparent" : "bg-transparent"
            }`}>
              <div className={`relative text-center max-w-[920px] mx-auto py-12 md:py-20 px-6 md:px-10 rounded-[30.5px] overflow-hidden transition-all duration-300 ${
                isDark 
                  ? "bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)]" 
                  : "bg-primary text-white"
              }`}>
              
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider mb-6 ${
                isDark 
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                  : "bg-white/10 text-white border-white/20"
              }`}>
                ● READY TO SWITCH?
              </span>
              <h2 className="text-4xl md:text-[64px] leading-[1.05] mb-6 font-black tracking-tight text-white">
                Simplify your marketing.<br />
                <span className={isDark ? "grad-text" : "text-purple-200"}>Amplify your results.</span>
              </h2>
              <p className={`text-[18px] mb-9 max-w-[680px] mx-auto ${isDark ? "text-[var(--ink-2)]" : "text-white/85"}`}>
                Join 2,000+ agencies and creators who replaced their entire digital marketing workflow with Solo Spider. Less cost. Less complexity. More output.
              </p>
              
              <div className="flex justify-center gap-3.5 flex-wrap mb-9">
                <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className={`btn px-8 py-4 rounded-full font-bold cursor-pointer transition-all ${
                  isDark 
                    ? "btn-grad" 
                    : "bg-white text-primary hover:bg-purple-100 hover:scale-[1.02] shadow-lg shadow-black/10"
                }`}>
                  Start Free
                </button>
                <button onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} className={`btn px-8 py-4 rounded-full font-bold cursor-pointer transition-all ${
                  isDark 
                    ? "btn-ghost" 
                    : "bg-transparent border border-white/40 text-white hover:bg-white/10"
                }`}>
                  Book a Demo
                </button>
              </div>
              
              <div className={`flex justify-center flex-wrap gap-x-8 gap-y-4 text-[13.5px] ${isDark ? "text-[var(--ink-2)]" : "text-white/80"}`}>
                {["Free plan, always", "14-day trial on paid plans", "Cancel anytime", "Setup under 5 minutes"].map((p, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span className={isDark ? "text-primary font-extrabold" : "text-purple-200 font-extrabold"}>✓</span>
                    <span>{p}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      <MarketingFooter />

      <AeoWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialDomain={wizardDomain}
      />

      <CouponModal 
        isOpen={couponModalOpen} 
        onClose={() => setCouponModalOpen(false)} 
        onConfirm={handleConfirmCoupon} 
        planId={selectedPlanId}
        isLoggedIn={!!user}
      />
    </div>
  );
}
