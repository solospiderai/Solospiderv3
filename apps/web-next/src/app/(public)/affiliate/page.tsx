"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function AffiliatePage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync dark mode state from document body/class
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains("dark") || 
                          document.body.classList.contains("dark");
      setIsDark(isDarkTheme);
    };

    checkTheme();
    
    // Set up observer to track theme toggles dynamically
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-300">
      <MarketingNavbar />

      <main className="flex-grow pt-28 pb-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 text-center overflow-hidden">
          {/* Subtle Concentric Grid Lines background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
            <div className="w-[800px] h-[800px] rounded-full border border-primary/20 flex items-center justify-center">
              <div className="w-[600px] h-[600px] rounded-full border border-primary/20 flex items-center justify-center">
                <div className="w-[400px] h-[400px] rounded-full border border-primary/20"></div>
              </div>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary text-[12px] font-mono font-bold uppercase tracking-wider mb-5">
              ● Affiliate Program
            </span>
            <h1 className="text-4xl md:text-[64px] font-black tracking-tight leading-[1.1] mb-6 max-w-[850px] mx-auto animate-fade-in">
              Refer & Earn with <span className="grad-text">Solo Spider</span>
            </h1>
            <p className="text-[19px] text-[var(--ink-2)] max-w-[680px] mx-auto leading-relaxed mb-10">
              Join the Solo Spider affiliate program and earn industry-leading commissions by sharing the AI marketing OS with your audience.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/dashboard" className="btn btn-primary px-8 py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform w-full sm:w-auto">
                Get Your Affiliate Link
              </Link>
              <Link href="#how-it-works" className="btn btn-ghost border-[var(--line)] px-8 py-4 text-sm font-semibold hover:bg-[var(--bg-2)] w-full sm:w-auto">
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="py-12 bg-[var(--bg-2)] border-y border-[var(--line)]">
          <div className="max-w-[1240px] mx-auto px-7 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-left bg-[var(--panel)] p-8 md:p-10 rounded-3xl border border-[var(--line)] shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-6">
                30%
              </div>
              <h3 className="text-2xl font-black mb-3 font-display">First-Time Commission</h3>
              <p className="text-[15px] text-[var(--ink-2)] leading-relaxed">
                When a new user signs up using your affiliate code, you receive an immediate <strong>30% commission</strong> on their initial payment.
              </p>
            </div>

            <div className="text-left bg-[var(--panel)] p-8 md:p-10 rounded-3xl border border-[var(--line)] shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xl mb-6">
                15%
              </div>
              <h3 className="text-2xl font-black mb-3 font-display">Recurring Commission</h3>
              <p className="text-[15px] text-[var(--ink-2)] leading-relaxed">
                Enjoy passive income with a <strong>15% recurring commission</strong> on every single billing cycle for as long as their subscription remains active.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20" id="how-it-works">
          <div className="max-w-[1240px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-[44px] font-black tracking-tight mb-16">
              Three Simple Steps to Earn
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-6 shadow-md">
                  1
                </div>
                <h4 className="text-xl font-bold mb-3">Get Your Link</h4>
                <p className="text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[280px]">
                  Sign up for a free creator account and access your unique reference link inside the dashboard.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-6 shadow-md">
                  2
                </div>
                <h4 className="text-xl font-bold mb-3">Share & Recommend</h4>
                <p className="text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[280px]">
                  Promote Solo Spider on your blog, social media, newsletter, or directly to clients.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-6 shadow-md">
                  3
                </div>
                <h4 className="text-xl font-bold mb-3">Earn Recurring Revenue</h4>
                <p className="text-[14px] text-[var(--ink-2)] leading-relaxed max-w-[280px]">
                  Track clicks and conversions in real-time, and get payouts directly to your account.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
