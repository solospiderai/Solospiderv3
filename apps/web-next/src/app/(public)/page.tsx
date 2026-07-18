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
import { captureReferralCode } from "@/lib/affiliate-tracking";

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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    // Capture affiliate referral code from URL (?ref=xxx)
    captureReferralCode();
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
        <section className="relative w-full pt-[90px] pb-[40px] md:pt-[110px] md:pb-[60px] overflow-hidden bg-[var(--bg)]" id="hero" style={{ fontFamily: "'Geist', sans-serif" }}>
          {/* Background Grid (Concentric Circles & Radiating Lines matching Figma SVG layout) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <svg
              width="1920"
              height="859"
              viewBox="0 0 1920 859"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-1/2 -translate-x-1/2 top-[-20px] w-[900px] h-[403px] md:top-auto md:bottom-[25px] md:w-[1920px] md:h-[859px] pointer-events-none select-none z-0"
            >
              <g opacity="0.1" clipPath="url(#clip0_311_886)">
                <path d="M960 859V-53" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1195.2 -21.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1416 69.4" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1605.6 213.4" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1749.6 403" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1840.8 623.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M0 858H1920" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1840.8 1094.2" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1749.6 1315" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1605.6 1504.6" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1416 1648.6" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L1195.2 1739.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L724.8 1739.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L504 1648.6" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L314.4 1504.6" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L170.4 1315" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L79.2002 1094.2" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L79.2002 623.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L170.4 403" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L314.4 213.4" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L504 69.4" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 859L724.8 -21.8" stroke="#9025F2" strokeWidth="1.275"/>
                <path d="M960 1003C1039.53 1003 1104 938.529 1104 859C1104 779.471 1039.53 715 960 715C880.471 715 816 779.471 816 859C816 938.529 880.471 1003 960 1003Z" stroke="#9025F2" strokeWidth="1.0625"/>
                <path d="M960 1123C1105.8 1123 1224 1004.8 1224 859C1224 713.197 1105.8 595 960 595C814.197 595 696 713.197 696 859C696 1004.8 814.197 1123 960 1123Z" stroke="#9025F2" strokeWidth="1.0625"/>
                <path d="M960 1267C1185.33 1267 1368 1084.33 1368 859C1368 633.668 1185.33 451 960 451C734.668 451 552 633.668 552 859C552 1084.33 734.668 1267 960 1267Z" stroke="#9025F2" strokeWidth="1.0625"/>
                <path d="M960 1435C1278.12 1435 1536 1177.12 1536 859C1536 540.884 1278.12 283 960 283C641.884 283 384 540.884 384 859C384 1177.12 641.884 1435 960 1435Z" stroke="#9025F2" strokeWidth="1.0625"/>
                <path d="M960 1603C1370.9 1603 1704 1269.9 1704 859C1704 448.1 1370.9 115 960 115C549.1 115 216 448.1 216 859C216 1269.9 549.1 1603 960 1603Z" stroke="#9025F2" strokeWidth="1.0625"/>
                <path d="M960 1771C1463.68 1771 1872 1362.68 1872 859C1872 355.316 1463.68 -53 960 -53C456.316 -53 48 355.316 48 859C48 1362.68 456.316 1771 960 1771Z" stroke="#9025F2" strokeWidth="1.0625"/>
              </g>
              <defs>
                <clipPath id="clip0_311_886">
                  <rect width="1920" height="960" fill="white" transform="translate(0 -101)"/>
                </clipPath>
              </defs>
            </svg>
          </div>

          <div className="relative text-center max-w-[980px] mx-auto px-7 z-10 flex flex-col items-center">
            {/* Badge - #2: Geist 400 14px line-height 100% */}
            <span
              className="inline-flex items-center gap-2 h-[39px] px-5 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[var(--ink-2)] mb-[28px] shadow-sm shrink-0"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#9025F2]"></span>
              Now live — The AI marketing OS for agencies &amp; creators
            </span>

            {/* Heading - #3: Geist 800 66px line-height 72px */}
            <h1
              className="mb-[24px] text-[var(--ink)] text-3xl sm:text-4xl md:text-5xl lg:text-[66px] leading-[1.1] md:leading-[72px] font-extrabold"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 800, letterSpacing: 0, textAlign: 'center' }}
            >
              Replace Your Entire<br />
              <span className="grad-text">Marketing Workflow</span><br />
              With One Tool
            </h1>

            {/* Sub text - #4: Geist 400 18px line-height 32px */}
            <p
              className="text-[var(--ink-2)] max-w-[720px] mx-auto mb-[32px] text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center' }}
            >
              Solo Spider automates time-consuming marketing tasks while giving your team the tools they need to create content faster, improve SEO, and increase online visibility.
            </p>

            {/* URL Input Bar */}
            <div className="w-full max-w-[640px] mx-auto mb-[20px]">
              <form onSubmit={handleStartAnalysis} className="h-auto sm:h-[62.5px] w-full p-2 sm:p-[9px] rounded-[16px] bg-[var(--panel)] border border-[var(--line)] shadow-[0_16px_40px_rgba(144,37,242,0.08)] hover:shadow-[0_20px_50px_rgba(144,37,242,0.14)] focus-within:border-primary/45 transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-grow flex items-center px-2 py-1.5 sm:py-0">
                  <Globe className="w-4.5 h-4.5 text-[var(--muted)] shrink-0" />
                  {/* Input placeholder - #5: Geist 400 14px line-height 100% */}
                  <input
                    type="text"
                    required
                    placeholder="Enter your website URL (e.g., example.com)"
                    value={analysisUrl}
                    onChange={(e) => setAnalysisUrl(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] py-2 sm:py-0 px-2 placeholder-[#9CA3AF]"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: '0%' }}
                  />
                </div>
                {/* Button - #6: Geist 700 16px */}
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full sm:w-[180.14px] h-[44.5px] bg-primary hover:bg-primary-2 text-white rounded-[14px] shrink-0 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '100%', letterSpacing: 0, textAlign: 'center', verticalAlign: 'middle' }}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Start Analysis <span className="text-[14px]">⚡</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Under-Input Text - #7: Geist 400 14px line-height 18px */}
            <p
              className="text-[#9CA3AF] mb-0 flex items-center justify-center gap-1.5"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '18px', letterSpacing: '0%', textAlign: 'center', verticalAlign: 'middle' }}
            >
              <span>⚡ SEO &amp; AEO scans start instantly in the background</span>
            </p>

            {/* Sub CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 mt-[24px] mb-[20px] relative z-10 w-full max-w-[400px] sm:max-w-none mx-auto">
              {/* #8: Geist 700 14px */}
              <button
                onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }}
                className="w-full sm:w-[187px] h-[49px] rounded-[9.5px] bg-[#9025F2] hover:bg-primary-2 text-white cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle' }}
              >
                Start free trial <span className="text-[14px]">→</span>
              </button>
              {/* #9: Inter 600 15px */}
              <button
                onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }}
                className="w-full sm:w-[187px] h-[49px] rounded-[9.5px] border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--bg-2)] cursor-pointer flex items-center justify-center active:scale-[0.98] transition-all"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, lineHeight: '100%', letterSpacing: '0%', textAlign: 'center', verticalAlign: 'middle' }}
              >
                See How It Works
              </button>
            </div>

            {/* Checklist Features - #10: Inter 400 16px */}
            <div
              className="flex justify-center flex-wrap gap-x-8 gap-y-3 text-[var(--ink-2)] mt-[20px] relative z-10 text-sm sm:text-base leading-none"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center', verticalAlign: 'middle' }}
            >
              <span className="flex items-center gap-2">
                <span className="text-[#22c55e] font-black">✓</span>
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#22c55e] font-black">✓</span>
                <span>Free plan available</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#22c55e] font-black">✓</span>
                <span>Set up in 5 minutes</span>
              </span>
            </div>
          </div>
        </section>

        {/* TRUSTED BY LOGO BAR */}
        <section className="h-auto py-12 md:h-[201px] md:py-0 flex flex-col justify-center border-b border-[var(--line)] bg-[var(--bg)] relative z-10">
          <div className="max-w-[1240px] mx-auto px-7 w-full">
            {/* #1: Geist 400 18px */}
            <div
              className="text-center text-[var(--muted)] mb-5 text-base md:text-lg"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center' }}
            >
              Trusted by 2,000+ agencies, freelancers, and solo founders
            </div>
            {/* #2: Geist 600 18px line-height 28px */}
            <div
              className="flex justify-center items-center gap-8 sm:gap-12 flex-wrap text-[var(--ink-2)] opacity-70 text-base md:text-lg leading-relaxed md:leading-[28px]"
              style={{ fontFamily: "'Geist', sans-serif", fontWeight: 600, letterSpacing: '0%', verticalAlign: 'middle' }}
            >
              <span>Loomstack</span>
              <span>NORTHWIND</span>
              <span>PEAK CO</span>
              <span>◇ Lattice</span>
              <span>CIVIC</span>
              <span>● Pulse</span>
              <span>Modern</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PROBLEM SECTION – "You're paying for 6 tools…"               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)] overflow-hidden" id="problem">
          <div className="max-w-[1240px] mx-auto px-7 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-14 items-center">
            <div className="text-left">
              {/* #3: Geist 400 14px uppercase */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] mb-6 shadow-sm font-normal text-xs uppercase"
                style={{ fontFamily: "'Geist', sans-serif", letterSpacing: '0%', verticalAlign: 'middle' }}
              >
                <span className="w-2 h-2 rounded-full bg-[#9025F2]"></span>
                The problem
              </div>
              
              {/* #4: Geist 700 42px */}
              <h2
                className="mb-6 text-[var(--ink)] text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: 0 }}
              >
                You&apos;re paying for 6 tools<br />
                that should be one.
              </h2>
              
              {/* #5: Geist 400 16px line-height 28px */}
              <div
                className="text-[var(--ink-2)] space-y-5 text-sm sm:text-base leading-relaxed md:leading-[28px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%' }}
              >
                <p>The average digital marketer juggles Surfer SEO, Buffer, Canva, Ahrefs, a blog CMS, and a separate AI writing tool — spending ₹30,000–₹80,000 a month on subscriptions that barely talk to each other.</p>
                <p>That&apos;s before counting the hours lost copy-pasting between tools, briefing freelancers, chasing approvals, and manually posting content.</p>
                <p>Solo Spider was built to collapse the entire stack into a single, automated workflow — so you spend less time on the tools and more time on the work that actually grows your business.</p>
              </div>
            </div>

            {/* Right: Diagram Image with #F4F1EA background box (in light mode) or dark background (in dark mode) */}
            <div 
              className="relative w-full flex items-center justify-center z-10 p-6 sm:p-10 rounded-[32px] border transition-all duration-300"
              style={{
                backgroundColor: isDark ? "#141226" : "#F4F1EA",
                borderColor: isDark ? "rgba(144,37,242,0.25)" : "#e2e1da",
              }}
            >
              <img
                src={isDark ? "/assets/problem-diagram-dark.png" : "/assets/problem-diagram-light.png"}
                alt="Solo Spider replaces 6 tools with one"
                className="w-full h-auto max-w-[620px]"
              />
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DASHBOARD PREVIEW                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[960px] mx-auto mb-16">
              {/* #6: Geist 400 14px uppercase */}
              <span
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3 text-xs uppercase"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', verticalAlign: 'middle' }}
              >
                ● Dashboard
              </span>
              {/* #7: Geist 700 42px */}
              <h2
                className="mb-[18px] text-[var(--ink)] text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: 0, textAlign: 'center' }}
              >
                Built for agencies. Priced for solo creators.
              </h2>
              {/* #8: Geist 400 18px line-height 32px */}
              <p
                className="text-[var(--ink-2)] max-w-[760px] mx-auto text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center' }}
              >
                Solo Spider works whether you&apos;re running campaigns for 20 clients or building a brand entirely on your own.
              </p>
            </div>

            {/* Dashboard Image - Figma: 1200x760, border-radius 24.62px, border 1px */}
            <div className="relative mx-auto overflow-hidden border border-[var(--line)] shadow-[0_32px_64px_-24px_rgba(14,12,26,0.22)] bg-[var(--panel)]" style={{ maxWidth: 1200, borderRadius: '24.62px' }}>
              <img
                src={isDark ? "/assets/dashboard-dark.svg" : "/assets/dashboard-light.svg"}
                alt="Solo Spider Dashboard Preview"
                className="w-full block"
                style={{ height: 'auto', maxHeight: 760 }}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* WHO IT'S FOR – Two cards side by side                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]" id="audience">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[960px] mx-auto mb-16">
              {/* #9: Geist 400 14px uppercase */}
              <span
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle', textTransform: 'uppercase' }}
              >
                ● Who it&apos;s for
              </span>
              {/* #10: Geist 700 42px */}
              <h2
                className="mb-[18px] text-[var(--ink)] text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: 0, textAlign: 'center' }}
              >
                Built for agencies. Priced for solo creators.
              </h2>
              {/* #11: Geist 400 18px line-height 32px */}
              <p
                className="text-[var(--ink-2)] max-w-[760px] mx-auto text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center' }}
              >
                Solo Spider works whether you&apos;re running campaigns for 20 clients or building a brand entirely on your own.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {/* Agency Card - Figma: 705x700, border-radius 10px */}
              <div className="relative bg-[var(--panel)] border border-[var(--line)] p-10 lg:p-11 flex flex-col gap-4.5 overflow-hidden shadow-[0_20px_50px_-28px_rgba(14,12,26,0.1)] group" style={{ borderRadius: 10, minHeight: 700 }}>
                <div className="relative z-10 flex flex-col h-full">
                  {/* #12: Geist 400 14px letter-spacing 3px uppercase */}
                  <span
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary text-white border border-primary self-start mb-4"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: 3, textTransform: 'uppercase' }}
                  >
                    For Agencies
                  </span>
                  {/* #13: Geist 400 16px line-height 28px */}
                  <p
                    className="text-[var(--ink-2)] mb-6"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '28px', letterSpacing: '0%' }}
                  >
                    Growing an agency shouldn&apos;t mean juggling more tools. Solo Spider streamlines content, social, SEO, and AI search visibility across every client account — all from one centralized platform.
                  </p>
                  
                  {/* #14: Geist 400 16px line-height 100% */}
                  <div className="flex flex-col gap-3 mb-8">
                    {[
                      "Manage multiple client brands from a single workspace",
                      "Generate blogs, social posts, captions, and creative assets tailored to each client",
                      "Plan, schedule, and publish content across channels with ease",
                      "Deliver clear, client-friendly SEO audit reports",
                      "Show up in AI search results before your competitors do (AEO & GEO)",
                      "Share professional white-label reports with clients"
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start text-[var(--ink)]"
                        style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '100%', letterSpacing: '0%' }}
                      >
                        <span className="shrink-0 text-primary font-black text-[18px] leading-none select-none mt-0.5">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* #15: Geist 700 14px */}
                  <Link
                    href="/pricing"
                    className="w-[187px] h-[49px] rounded-[9.5px] bg-[#9025F2] hover:bg-primary-2 text-white self-start mt-auto cursor-pointer flex items-center justify-center no-underline text-inherit"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle' }}
                  >
                    Explore Agency Plan
                  </Link>
                </div>
              </div>

              {/* Individual Card - Figma: 705x700, border-radius 10px */}
              <div className="relative bg-[var(--panel)] border border-[var(--line)] p-10 lg:p-11 flex flex-col gap-4.5 overflow-hidden shadow-[0_20px_50px_-28px_rgba(14,12,26,0.1)] group" style={{ borderRadius: 10, minHeight: 700 }}>
                <div className="relative z-10 flex flex-col h-full">
                  {/* #12: Geist 400 14px letter-spacing 3px uppercase */}
                  <span
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary-soft text-primary-2 border border-primary/20 self-start mb-4"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: 3, textTransform: 'uppercase' }}
                  >
                    For Individuals
                  </span>
                  {/* #13: Geist 400 16px line-height 28px */}
                  <p
                    className="text-[var(--ink-2)] mb-6"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '28px', letterSpacing: '0%' }}
                  >
                    Running a business means wearing many hats. Solo Spider simplifies your marketing by automating content, social, SEO, and AI search visibility — all from one easy-to-use platform.
                  </p>
                  
                  {/* #14: Geist 400 16px line-height 100% */}
                  <div className="flex flex-col gap-3 mb-8">
                    {[
                      "Publish blog posts without managing a complex CMS",
                      "Generate engaging social media images, videos, and captions in minutes",
                      "Identify and resolve SEO issues with guided recommendations",
                      "Increase your visibility across ChatGPT, Gemini, AI Overviews, and other AI-powered search experiences",
                      "Plan, create, and schedule a month's worth of content in under an hour"
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start text-[var(--ink)]"
                        style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '100%', letterSpacing: '0%' }}
                      >
                        <span className="shrink-0 text-primary font-black text-[18px] leading-none select-none mt-0.5">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* #15: Geist 700 14px */}
                  <Link
                    href="/pricing"
                    className="w-[187px] h-[49px] rounded-[9.5px] border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--bg-2)] transition-all self-start mt-auto cursor-pointer flex items-center justify-center no-underline text-inherit"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle' }}
                  >
                    Explore Solo Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* AI SEARCH METRICS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-10 md:py-16 bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-8">
              {/* #1: AI Search Metrics badge */}
              <span 
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle', textTransform: 'uppercase' }}
              >
                ● AI Search Metrics
              </span>
              {/* #2: Discover how AI interprets your brand */}
              <h2 
                className="mb-4 text-[var(--ink)] text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0px', textAlign: 'center' }}
              >
                Discover how AI<br />interprets your brand
              </h2>
              {/* #3: Track the most important performance indicators across AI search. */}
              <p 
                className="text-[var(--ink-2)] max-w-[660px] mx-auto text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%', textAlign: 'center' }}
              >
                Track the most important performance indicators across AI search.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-4 items-stretch">
              {/* Left Column: SEO/AEO/GEO Cards */}
              <div className="flex flex-col gap-2.5 h-full">
                {[
                  {
                    title: "SEO",
                    isBold: true,
                    desc: "Corem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  },
                  {
                    title: "AEO",
                    isBold: false,
                    desc: "Corem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  },
                  {
                    title: "GEO",
                    isBold: false,
                    desc: "Corem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus."
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 p-4.5 md:p-5 rounded-2xl text-left flex flex-col justify-center border transition-all duration-300 ${
                      idx === 0
                        ? isDark
                          ? "bg-[var(--panel)] border-[var(--line)] shadow-[0_12px_36px_rgba(0,0,0,0.3)]"
                          : "bg-white border-[var(--line)] shadow-[0_12px_36px_rgba(144,37,242,0.06)]"
                        : isDark
                          ? "bg-[var(--bg-2)] border-[var(--line)]"
                          : "bg-[#F4F3EE] border-transparent"
                    }`}
                  >
                    {/* #4: SEO (Bold 30px), #5: AEO and GEO (Regular 30px) */}
                    <h3 
                      className="mb-2.5 text-[var(--ink)]"
                      style={{ 
                        fontFamily: "'Geist', sans-serif", 
                        fontWeight: item.isBold ? 700 : 400, 
                        fontSize: 30, 
                        lineHeight: '100%', 
                        letterSpacing: '0px' 
                      }}
                    >
                      {item.title}
                    </h3>
                    {/* #6: Description text */}
                    <p 
                      className="text-[var(--ink-2)]"
                      style={{ 
                        fontFamily: "'Geist', sans-serif", 
                        fontWeight: 400, 
                        fontSize: 16, 
                        lineHeight: '28px', 
                        letterSpacing: '0%' 
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Column: Search Mockup */}
              <div className={`flex rounded-[32px] p-4.5 lg:p-6 flex-col gap-4 text-left border transition-all duration-300 ${
                isDark 
                  ? "bg-[var(--bg-2)] border-[var(--line)]" 
                  : "bg-[#F4F3EE] border-[var(--line)]"
              }`}>
                {/* #10 Search Bar Layout */}
                <div 
                  className={`flex items-center justify-between rounded-[40px] pl-6 pr-2 py-1 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border transition-all duration-300 w-full max-w-[770px] h-[60px]`}
                  style={{
                    backgroundColor: isDark ? "var(--panel)" : "#ffffff",
                    borderColor: "var(--line)",
                    borderWidth: "1px"
                  }}
                >
                  {/* #11 Digital Marketing Company... (in search bar) */}
                  <span 
                    className="text-[var(--ink-2)] opacity-70"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '100%', letterSpacing: '0%' }}
                  >
                    Digital Marketing Company...
                  </span>
                  <button type="button" className="w-10 h-10 rounded-full bg-[#9025F2] hover:bg-[#7c1ed4] text-white flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-col gap-4 mt-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="flex flex-col gap-1.5 border-b border-dashed border-[var(--line)] pb-3.5 last:border-0 last:pb-0">
                      <div className="flex items-baseline gap-2.5">
                        {/* #9: numbers 01. , 02. , 03. , 04. */}
                        <span 
                          className="text-[#9025F2]"
                          style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: '100%', letterSpacing: '0%' }}
                        >
                          0{num}.
                        </span>
                        {/* #7: www.website.com */}
                        <span 
                          className="text-[var(--ink)]"
                          style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '100%', letterSpacing: '0%' }}
                        >
                          www.website.com
                        </span>
                      </div>
                      {/* #8: www.website.com (grey one) */}
                      <span 
                        className="text-[var(--muted)] pl-[46px] block"
                        style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 12, lineHeight: '100%', letterSpacing: '0%' }}
                      >
                        www.website.com
                      </span>
                      <div className="pl-[46px] flex flex-col gap-1.5 mt-1">
                        <div className={`h-[6px] rounded-full w-[70%] ${isDark ? "bg-white/10" : "bg-[#e5e4de]"}`}></div>
                        <div className={`h-[6px] rounded-full w-[50%] ${isDark ? "bg-white/10" : "bg-[#e5e4de]"}`}></div>
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
        <section 
          className="relative py-20 md:py-[130px] bg-[var(--bg)]" 
          id="features"
        >
          <div className="max-w-[1240px] mx-auto px-7">
            {/* 2-Column Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-16 text-left border-b border-[var(--line)] pb-10">
              <div>
                {/* #12 Everything included */}
                <span 
                  className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-4"
                  style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', letterSpacing: '0%', verticalAlign: 'middle', textTransform: 'uppercase' }}
                >
                  ● Everything included
                </span>
                {/* #13 Six superpowers. One subscription. */}
                <h2 
                  className="text-[var(--ink)] text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                  style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0px' }}
                >
                  Six superpowers.<br />
                  One subscription.
                </h2>
              </div>
              {/* #14 Description subtext */}
              <p 
                className="text-[var(--ink-2)] max-w-[650px] text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px] text-left"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%' }}
              >
                No integrations to configure. No freelancers to brief. No tool-switching.<br className="hidden lg:inline" /> Everything works together because it lives in one place.
              </p>
            </div>

            {/* 2×2 Feature Cards - Asymmetrical Grid matching Figma layout with mathematically equal heights */}
            <div className="flex flex-col gap-[10px]">
              {/* Row 1: Blog Automation (900px wide) + Social Media (510px wide) */}
              <div className="grid grid-cols-1 lg:grid-cols-[900fr_510fr] gap-[10px]">
                {/* Card 1: Content & Blog Automation */}
                <div className="rounded-3xl overflow-hidden shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)] transition-all duration-200 hover:-translate-y-1 border border-[var(--line)]">
                  <img 
                    src={isDark ? "/assets/feature-blog-dark.png" : "/assets/feature-blog-light.png"} 
                    alt="Content & Blog Automation" 
                    className="w-full h-auto block"
                  />
                </div>

                {/* Card 2: Social Media — End to End */}
                <div className="rounded-3xl overflow-hidden shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)] transition-all duration-200 hover:-translate-y-1 border border-[var(--line)]">
                  <img 
                    src={isDark ? "/assets/feature-social-dark.png" : "/assets/feature-social-light.png"} 
                    alt="Social Media — End to End" 
                    className="w-full h-auto block"
                  />
                </div>
              </div>

              {/* Row 2: SEO (510px wide) + AEO & GEO (900px wide) */}
              <div className="grid grid-cols-1 lg:grid-cols-[510fr_900fr] gap-[10px]">
                {/* Card 3: SEO — Audit & Fix */}
                <div className="rounded-3xl overflow-hidden shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)] transition-all duration-200 hover:-translate-y-1 border border-[var(--line)]">
                  <img 
                    src={isDark ? "/assets/feature-seo-dark.png" : "/assets/feature-seo-light.png"} 
                    alt="SEO — Audit & Fix" 
                    className="w-full h-auto block"
                  />
                </div>

                {/* Card 4: AEO & GEO — Be Found in AI Search */}
                <div className="rounded-3xl overflow-hidden shadow-[0_14px_40px_-28px_rgba(14,12,26,0.1)] transition-all duration-200 hover:-translate-y-1 border border-[var(--line)]">
                  <img 
                    src={isDark ? "/assets/feature-aeo-dark.png" : "/assets/feature-aeo-light.png"} 
                    alt="AEO & GEO — Be Found in AI Search" 
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS – 4 step cards                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]" id="how">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              {/* #1 Badge */}
              <span 
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', textTransform: 'uppercase', letterSpacing: '0%' }}
              >
                ● How it works
              </span>
              {/* #2 Title */}
              <h2 
                className="mb-[18px] text-[var(--ink)] text-center"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 42, lineHeight: '100%', letterSpacing: '0px' }}
              >
                From setup to running on autopilot in one day.
              </h2>
              {/* #3 Subtext */}
              <p 
                className="text-[var(--ink-2)] max-w-[660px] mx-auto text-center font-normal"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 18, lineHeight: '32px', letterSpacing: '0%' }}
              >
                Connect your accounts, customize your preferences, and let Solo Spider automate your marketing workflows from one unified platform.
              </p>
            </div>
            
            {/* Desktop / Tablet view: show the pixel-perfect theme-swapped image cards */}
            <div className="hidden md:block w-full mt-16">
              <img 
                src={isDark ? "/assets/how-it-works-dark.png" : "/assets/how-it-works-light.png"} 
                alt="How it works" 
                className="w-full h-auto block"
              />
            </div>

            {/* Mobile view: show the horizontal scrolling HTML cards list for readability */}
            <div className="md:hidden flex overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory gap-5 mt-10">
              {[
                { 
                  icon: LinkIcon, 
                  title: "Connect your channels", 
                  desc: "Link your website, social accounts, and CMS. Solo Spider pulls in your brand voice, content & audience automatically." 
                },
                { 
                  icon: Target, 
                  title: "Set your goals", 
                  desc: "Tell Solo Spider what you want — more traffic, stronger social, better rankings, or AI visibility. It builds your strategy." 
                },
                { 
                  icon: CheckSquare, 
                  title: "Review and approve", 
                  desc: "It generates blogs, social posts, and SEO fixes. You review, tweak, and approve — or set it to fully auto." 
                },
                { 
                  icon: Rocket, 
                  title: "Watch it run", 
                  desc: "Content goes live. Posts publish. SEO improves. You get weekly reports on exactly what's working." 
                }
              ].map((step, i) => (
                <div key={i} className="bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-7 flex flex-col gap-3.5 text-left snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px]">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-1">
                    <step.icon className="w-6 h-6" />
                  </div>
                  {/* #4 Headings */}
                  <h4 
                    className="text-[var(--ink)] font-bold"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 24, lineHeight: '100%', letterSpacing: '0px' }}
                  >
                    {step.title}
                  </h4>
                  {/* #5 Contents */}
                  <p 
                    className="text-[var(--ink-2)] font-normal"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '28px', letterSpacing: '0%' }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NUMBERS – "Real Results. Not Marketing Fluff."                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)] overflow-hidden">
          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              {/* #6 Badge */}
              <span 
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', textTransform: 'uppercase', letterSpacing: '0%' }}
              >
                ● By the numbers
              </span>
              {/* #7 Title */}
              <h2 
                className="mb-[18px] text-[var(--ink)] text-center text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0px' }}
              >
                Real Results.<br />
                Not Marketing Fluff.
              </h2>
            </div>
            
            <div className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible pb-6 md:pb-0 no-scrollbar snap-x snap-mandatory gap-4 md:gap-px bg-transparent md:bg-[var(--line)] md:border md:border-[var(--line)] md:rounded-3xl md:overflow-hidden md:shadow-[0_30px_60px_-30px_rgba(14,12,26,0.1)]">
              {[
                { v: "10×", l: "Faster content production vs. doing it manually." },
                { v: "6 Tools", l: "Replaced by a single Solo Spider subscription." },
                { v: "80%", l: "Reduction in time spent on repetitive marketing tasks." },
                { v: "5 mins", l: "Average setup time to publish your first blog." },
                { v: "₹40k+", l: "Avg. monthly tool cost replaced by one Solo Spider plan." },
                { v: "2,000+", l: "Agencies and creators already using Solo Spider." }
              ].map((num, i) => (
                <div key={i} className="bg-[var(--panel)] p-8 lg:p-12 flex flex-col gap-2.5 text-left snap-start min-w-[240px] sm:min-w-[280px] flex-shrink-0 w-[240px] sm:w-[280px] md:w-auto md:min-w-0 md:flex-shrink rounded-2xl border border-[var(--line)] md:border-0 md:rounded-none">
                  {/* #8 Value */}
                  <div 
                    className="text-primary font-extralight"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 200, fontSize: 60, lineHeight: '100%', letterSpacing: '0px' }}
                  >
                    {num.v}
                  </div>
                  {/* #9 content */}
                  <div 
                    className="text-[var(--ink-2)] font-normal"
                    style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 16, lineHeight: '28px', letterSpacing: '0%' }}
                  >
                    {num.l}
                  </div>
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
              {/* #10 Badge */}
              <span 
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, fontSize: 14, lineHeight: '100%', textTransform: 'uppercase', letterSpacing: '0%' }}
              >
                ● vs. the old way
              </span>
              {/* #11 Title */}
              <h2 
                className="mb-[18px] text-[var(--ink)] text-center text-2xl sm:text-3xl md:text-[42px] leading-tight md:leading-[100%]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0px' }}
              >
                Stop Paying for a Stack.<br />
                Start Using a System.
              </h2>
              {/* #12 Subtext */}
              <p 
                className="text-[var(--ink-2)] max-w-[660px] mx-auto text-center font-normal text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%' }}
              >
                Here&apos;s what Solo Spider replaces — and what none<br className="hidden lg:inline" /> of those tools can do together.
              </p>
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
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] bg-primary/5 text-primary text-[13.5px]">$199</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">$99+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">$42+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">$24+</div>
                <div className="py-4.5 px-4 text-center border-r border-[var(--line)] text-[var(--ink-2)] text-[13.5px]">$180+</div>
                <div className="py-4.5 px-4 text-center text-[var(--ink-2)] text-[13.5px]">$20+</div>
              </div>
            </div>

            {/* Mobile Fallback */}
            <div className="flex lg:hidden overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory gap-4 text-left">
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 shadow-[0_14px_30px_-22px_rgba(14,12,26,0.08)] snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] flex flex-col justify-between">
                <div>
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
                <div className="flex justify-between py-2 text-[13px] border-t border-dashed border-[var(--line)] mt-3 pt-2">
                  <span className="text-[var(--ink)] font-bold">Typical monthly cost</span>
                  <span className="text-primary font-black text-sm">$199</span>
                </div>
              </div>
              
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 shadow-[0_14px_30px_-22px_rgba(14,12,26,0.08)] snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-bold text-[16px] mb-3 text-[var(--ink)]">What you&apos;d pay for the stack</h4>
                  {[
                    { n: "Surfer SEO", p: "$99+" },
                    { n: "Buffer", p: "$42+" },
                    { n: "Canva Pro", p: "$24+" },
                    { n: "Ahrefs", p: "$180+" },
                    { n: "ChatGPT", p: "$20+" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-[13px] border-b border-dashed border-[var(--line)] last:border-b-0 text-[var(--ink-2)]">
                      <span className="text-[var(--ink)]">{item.n}</span>
                      <span>{item.p}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 text-[13px] border-t border-dashed border-[var(--line)] mt-3 pt-2">
                  <span className="text-[var(--ink)] font-bold">Total stack cost</span>
                  <span className="text-red-500 font-black text-sm">$365+</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[var(--muted)] text-[13px] mt-4.5">Prices approximate. Solo Spider replaces all five — for less than the cost of one.</div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PRICING                                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg)]" id="pricing">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[48px]">
              <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
                ● Pricing
              </span>
              <h2 className="mb-[18px] text-4xl md:text-[54px] tracking-tight font-black leading-[1.1] text-[var(--ink)]">
                One Price.<br />Everything included.
              </h2>
              <p 
                className="text-[var(--ink-2)] max-w-[720px] mx-auto text-center font-normal animate-fade-in text-sm sm:text-base md:text-lg leading-relaxed md:leading-[32px]"
                style={{ fontFamily: "'Geist', sans-serif", fontWeight: 400, letterSpacing: '0%' }}
              >
                No feature gating. No per-seat pricing surprises. Pick the plan that fits<br className="hidden lg:inline" /> your volume and get access to every single Solo Spider capability.
              </p>
            </div>

            <div className="flex md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 overflow-x-auto md:overflow-x-visible pt-5 pb-6 md:pb-0 no-scrollbar snap-x snap-mandatory gap-4 md:gap-6 items-stretch max-w-[1240px] mx-auto text-left">
              {/* Free Plan */}
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-4.5 md:p-6 lg:p-7 flex flex-col gap-3.5 md:gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto md:min-w-0 md:flex-shrink">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Free forever</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Free</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For creators just getting started</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-primary">$0</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-2.5 md:gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-3.5 md:pt-5 mt-1">
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
              <div className="relative border-2 border-primary bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] shadow-[0_20px_50px_-12px_rgba(144,37,242,0.18)] rounded-3xl p-4.5 md:p-6 lg:p-7 flex flex-col gap-3.5 md:gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(144,37,242,0.28)] overflow-visible snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto md:min-w-0 md:flex-shrink">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white font-display font-extrabold text-[10px] tracking-widest uppercase px-5 py-2 rounded-full z-20 shadow-[0_4px_14px_rgba(144,37,242,0.5)] whitespace-nowrap" style={{background:'#9025F2'}}>Most popular</span>
                
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Recommended for creators</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] -mt-1 uppercase">Starter</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For founders, freelancers &amp; creators</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[46px] leading-none tracking-tight text-primary">$199</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-2.5 md:gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-3.5 md:pt-5 mt-1">
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
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-4.5 md:p-6 lg:p-7 flex flex-col gap-3.5 md:gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto md:min-w-0 md:flex-shrink">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">For scaling businesses</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Growth</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For growing teams &amp; agencies</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-[var(--ink)]">$699</span>
                  <span className="text-[13px] font-semibold text-[var(--muted)] font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-2.5 md:gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-3.5 md:pt-5 mt-1">
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
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-4.5 md:p-6 lg:p-7 flex flex-col gap-3.5 md:gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative snap-start min-w-[280px] sm:min-w-[320px] flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto md:min-w-0 md:flex-shrink">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Best for enterprise</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-[var(--ink)] uppercase">Enterprise</h3>
                <div className="text-[12px] text-[var(--muted)] -mt-2">For large teams &amp; custom volume</div>
                <div className="flex items-baseline justify-start gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-[var(--ink)]">Custom</span>
                </div>
                <div className="flex flex-col gap-2.5 md:gap-3.5 text-[13px] text-[var(--ink-2)] border-t border-[var(--line)] pt-3.5 md:pt-5 mt-4">
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
        <section className="relative py-10 md:py-[130px] bg-[var(--bg)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-8 md:mb-[72px]">
              <span 
                className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary mb-3"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase'
                }}
              >
                ● Common questions
              </span>
              <h2 
                className="mb-[18px] text-[var(--ink)] leading-tight md:leading-[100%]"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(24px, 5.5vw, 42px)",
                  lineHeight: '100%',
                  letterSpacing: '0px',
                  textAlign: 'center'
                }}
              >
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
                    className="w-full flex justify-between items-center gap-4.5 p-4 md:p-5 lg:px-6 lg:py-5 text-left text-[var(--ink)]"
                    style={{
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 600,
                      fontSize: 17,
                      lineHeight: '23.8px',
                      letterSpacing: '0%',
                      verticalAlign: 'middle'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[14px] transition-all duration-200 ${openFaq === i ? 'bg-primary text-white rotate-45 border border-transparent' : 'bg-primary-soft text-primary border border-primary/15'}`}>
                      {openFaq === i ? "×" : "+"}
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-350 ease-in-out ${openFaq === i ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div 
                      className="px-6 pb-6 pt-4 border-t border-[var(--line)] text-[var(--ink-2)]"
                      style={{
                        fontFamily: "'Geist', sans-serif",
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: '28px',
                        letterSpacing: '0%'
                      }}
                    >
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
        <section className="relative bg-[var(--bg)] overflow-hidden py-10 md:py-[130px]">
          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className={`relative text-center max-w-[1240px] mx-auto py-8 md:py-20 px-5 md:px-10 rounded-[32px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(144,37,242,0.25)] transition-all duration-300 ${
              isDark 
                ? "bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] border border-[var(--line)]" 
                : "bg-[#9025f2] text-white border-0"
            }`}>
              
              <span 
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border mb-6 ${
                  isDark 
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                    : "bg-white/10 text-white border-white/20"
                }`}
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  textTransform: 'uppercase'
                }}
              >
                ● READY TO SWITCH?
              </span>
              <h2 
                className="mb-4 md:mb-6 text-white leading-tight md:leading-[100%]"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(24px, 5.5vw, 42px)",
                  lineHeight: '100%',
                  letterSpacing: '0px',
                  textAlign: 'center'
                }}
              >
                Simplify your marketing.<br />
                <span className={isDark ? "grad-text" : "text-purple-200"}>Amplify your results.</span>
              </h2>
              <p 
                className={`mb-6 md:mb-9 max-w-[680px] mx-auto ${isDark ? "text-[var(--ink-2)]" : "text-white/85"}`}
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(14px, 4.2vw, 18px)",
                  lineHeight: "clamp(22px, 5.5vw, 32px)",
                  letterSpacing: '0%',
                  textAlign: 'center'
                }}
              >
                Join 2,000+ agencies and creators who replaced their entire digital marketing workflow with Solo Spider. Less cost. Less complexity. More output.
              </p>
              
              <div className="flex justify-center gap-3.5 flex-wrap mb-6 md:mb-9">
                <button 
                  onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} 
                  className={`btn px-8 py-4 rounded-full cursor-pointer transition-all ${
                    isDark 
                      ? "btn-grad" 
                      : "bg-white text-primary hover:bg-purple-100 hover:scale-[1.02] shadow-lg shadow-black/10"
                  }`}
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle'
                  }}
                >
                  Start Free — No Card Needed
                </button>
                <button 
                  onClick={() => { setWizardDomain(""); setIsWizardOpen(true); }} 
                  className={`btn px-8 py-4 rounded-full cursor-pointer transition-all ${
                    isDark 
                      ? "btn-ghost" 
                      : "bg-transparent border border-white/40 text-white hover:bg-white/10"
                  }`}
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    verticalAlign: 'middle'
                  }}
                >
                  Book a 20-Minute Demo
                </button>
              </div>
              
              <div 
                className={`flex justify-center flex-wrap gap-x-8 gap-y-4 ${isDark ? "text-[var(--ink-2)]" : "text-white/80"}`}
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: 15,
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  textAlign: 'center'
                }}
              >
                {["Free plan, always", "7-day trial on paid plans", "Cancel anytime", "Setup under 5 minutes"].map((p, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span className={isDark ? "text-primary font-extrabold" : "text-purple-200 font-extrabold"}>✓</span>
                    <span>{p}</span>
                  </span>
                ))}
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

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-[#9025F2] text-white p-3.5 rounded-full shadow-lg border border-white/10 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 animate-fade-in"
          style={{ boxShadow: "0 10px 25px -5px rgba(144,37,242,0.5)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
