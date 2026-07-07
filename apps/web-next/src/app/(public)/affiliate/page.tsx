"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { Rocket } from "lucide-react";

export default function AffiliatePage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
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

  const triggerWizard = () => {
    setWizardDomain("");
    setIsWizardOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-300"
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

      <main className="flex-grow flex flex-col items-center justify-center pt-28 pb-20 relative overflow-hidden">
        {/* Subtle background lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[800px] h-[800px] rounded-full border border-primary/20 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full border border-primary/20 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full border border-primary/20"></div>
            </div>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-7 relative z-10 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20 transform rotate-3">
            <Rocket className="w-10 h-10 text-white -rotate-3" />
          </div>
          <h2 className="text-4xl md:text-[52px] font-black tracking-tight mb-4 leading-tight max-w-2xl">
            Solo Spider <span className="grad-text">Affiliate Program</span> is Coming Soon
          </h2>
          <p className="text-lg text-[var(--muted)] font-medium max-w-lg mb-10 leading-relaxed">
            Join the Solo Spider affiliate program and earn industry-leading commissions by sharing the AI marketing OS with your audience. We are launching this program soon!
          </p>
          
          <div className="flex items-center gap-3 bg-[var(--panel)] border border-[var(--line)] shadow-sm rounded-full px-6 py-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            <span className="text-sm font-bold text-[var(--ink)] uppercase tracking-widest">In Active Development</span>
          </div>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
