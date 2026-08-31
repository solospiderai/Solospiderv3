"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Calendar, Award, Activity, Rocket } from "lucide-react";

export default function ChangelogPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("version-1-0-0");

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

  const triggerWizard = () => {
    setWizardDomain("");
    setIsWizardOpen(true);
  };

  const sections = [
    { id: "version-1-0-0", label: "1. Version 1.0.0" },
    { id: "performance-stability", label: "2. Performance & Stability" },
    { id: "whats-next", label: "3. What's Next" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-primary/20 selection:text-[var(--ink)] font-sans"
      style={
        {
          "--bg": isDark ? "#0e0c1a" : "#fbfaf7",
          "--bg-2": isDark ? "#141226" : "#f3f2eb",
          "--panel": isDark ? "#1c1a35" : "#ffffff",
          "--line": isDark ? "#252340" : "#e2e1da",
          "--ink": isDark ? "#ffffff" : "#000000",
          "--ink-2": isDark ? "#e2e8f0" : "#0f172a",
          "--muted": isDark ? "#94a3b8" : "#475569",
        } as React.CSSProperties
      }
    >
      <MarketingNavbar isDark={isDark} onToggleTheme={toggleTheme} onOpenWizard={triggerWizard} />

      <main className="max-w-[1240px] mx-auto px-7 py-16 md:py-24">
        {/* Header Hero */}
        <div className="relative text-left mb-16 pb-8 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 mb-4 font-mono text-[11px] uppercase tracking-widest text-primary font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Product Changelog</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Stay Up to Date with <span className="grad-text">SoloSpider Updates</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-4 font-medium">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span>Last Updated: July 2026</span>
          </div>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Releases
            </h4>
            <ul className="space-y-2.5 text-[13px] font-semibold">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    onClick={(e) => handleLinkClick(e, sec.id)}
                    className={`block py-1 transition-all duration-200 hover:text-primary ${
                      activeSection === sec.id
                        ? "text-primary border-l-2 border-primary pl-3 -ml-0.5 font-bold"
                        : "text-[var(--muted)] hover:pl-1"
                    }`}
                  >
                    {sec.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Legal Content */}
          <article className="space-y-16 text-[15px] leading-relaxed text-[var(--ink-2)] max-w-none">
            <div className="bg-[var(--panel)] border border-[var(--line)] p-6 md:p-8 rounded-2xl shadow-sm text-[var(--ink-2)] text-left">
              <p className="font-semibold text-base mb-2 leading-normal">
                We're continuously improving SoloSpider with new features, performance enhancements, bug fixes, and AI capabilities.
              </p>
              <p className="opacity-90">
                This page highlights the latest updates to help you stay informed about what's new across the platform.
              </p>
            </div>

            {/* Section 1 */}
            <section id="version-1-0-0" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Version 1.0.0 — Initial Release</h2>
              </div>
              <p>We're excited to introduce the first public release of SoloSpider — an AI-powered platform designed to simplify website analysis, content creation, search optimization, and digital growth.</p>
              <p>What's Included in this release:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  "AI-powered website crawling & structure analysis",
                  "Intelligent SEO recommendations to improve visibility",
                  "Answer Engine Optimization (AEO) visibility diagnostics",
                  "AI Blog Generation with tone matching",
                  "Social Media scheduling & campaign drafts",
                  "Brand Summary generator cards",
                  "AI Content Optimizer & prompts editor",
                  "Analytics metrics & citation diagnostics reporting",
                  "Secure team workspace & subscription checkouts",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-[var(--bg-2)] px-4 py-2.5 rounded-xl border border-[var(--line)] text-[13.5px] font-semibold text-[var(--ink-2)]">
                    <span className="text-primary font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2 */}
            <section id="performance-stability" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Performance & Stability</h2>
              </div>
              <p>We've optimized platform performance to provide faster website analysis, quicker AI-generated responses, and a smoother overall user experience. Continuous improvements will be delivered as the platform evolves.</p>
            </section>

            {/* Section 3 */}
            <section id="whats-next" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">What's Next</h2>
              </div>
              <p>Our team is actively working on expanding SoloSpider with new AI capabilities, enhanced website intelligence, additional automation features, improved reporting, and ongoing performance improvements.</p>
              <p>More updates will be announced here as they become available.</p>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
