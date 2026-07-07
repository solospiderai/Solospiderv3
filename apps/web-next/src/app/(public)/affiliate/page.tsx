"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { 
  Award, ArrowRight, ShieldCheck, DollarSign, Users, 
  Target, BarChart3, HelpCircle, ChevronDown, Sparkles 
} from "lucide-react";

export default function AffiliateLandingPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const faqs = [
    {
      q: "How does the tracking work?",
      a: "When a visitor clicks your unique referral link, a tracking cookie is stored in their browser for 60 days. If they create an account and subscribe to any paid plan within that period, the sale is automatically attributed to you."
    },
    {
      q: "What is the minimum payout amount?",
      a: "The minimum payout threshold is $50. Once your approved earnings cross this limit, you can request a payout to your designated bank account or UPI address."
    },
    {
      q: "Can I refer my own accounts?",
      a: "No, self-referrals are strictly prohibited. Referrals must be unique external customers. Attempting to refer yourself or manipulate tracking will result in immediate suspension of your affiliate account."
    },
    {
      q: "How are commission payments processed?",
      a: "Commissions are recorded instantly. Once the referred subscriber's monthly billing cycle finishes successfully, the commission status shifts to Approved. Approved payouts are processed on a monthly basis upon request."
    }
  ];

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

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 text-center overflow-hidden border-b border-[var(--line)]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <div className="w-[900px] h-[900px] rounded-full border border-primary/20 flex items-center justify-center">
              <div className="w-[700px] h-[700px] rounded-full border border-primary/20 flex items-center justify-center">
                <div className="w-[500px] h-[500px] rounded-full border border-primary/25"></div>
              </div>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-7 relative z-10 text-center flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary text-[12px] font-mono font-bold uppercase tracking-wider mb-5">
              🚀 Partner With Us
            </span>
            <h1 className="text-4xl md:text-[68px] font-black tracking-tight leading-[1.05] mb-6 max-w-[950px] mx-auto text-center">
              Earn <span className="grad-text">25% Recurring</span> Commission with SoloSpider
            </h1>
            <p className="text-[19px] text-[var(--muted)] max-w-[700px] mx-auto leading-relaxed mb-10 font-semibold text-center">
              Join the official SoloSpider Affiliate Program. Promote the AI Marketing OS, help businesses grow their digital presence, and earn recurring commissions on every client you refer.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
              <Link 
                href="/affiliate/apply" 
                className="btn btn-grad px-8 py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/affiliate/dashboard" 
                className="btn btn-ghost border-[var(--line)] px-8 py-4 text-sm font-semibold hover:bg-[var(--bg-2)] w-full sm:w-auto flex items-center justify-center cursor-pointer"
              >
                Affiliate Dashboard
              </Link>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl mt-20 pt-10 border-t border-[var(--line)]">
              {[
                { title: "25% Lifetime", desc: "Recurring Commission" },
                { title: "60 Days", desc: "Tracking Cookie Window" },
                { title: "$50 Threshold", desc: "Minimum Payout amount" },
                { title: "Monthly Payouts", desc: "Direct Bank & UPI Transfer" }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <h4 className="text-xl md:text-2xl font-black text-primary mb-1">{item.title}</h4>
                  <p className="text-xs text-[var(--muted)] font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Partner with Us */}
        <section className="py-20 md:py-28 border-b border-[var(--line)]">
          <div className="max-w-[1240px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-16">
              Why Become a <span className="grad-text">SoloSpider Affiliate</span>?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Generous Commissions",
                  desc: "Earn 25% lifetime recurring commission on all subscription sales generated by your links.",
                  icon: DollarSign
                },
                {
                  title: "High Conversion Rates",
                  desc: "SoloSpider is an all-in-one AI platform replacing multiple tools, making it easy to convert leads.",
                  icon: Target
                },
                {
                  title: "Real-time Analytics",
                  desc: "Track referral clicks, successful signups, subscription plans, and commission history in real-time.",
                  icon: BarChart3
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 text-left hover:border-primary/30 transition-colors duration-300">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--bg-2)]/30">
          <div className="max-w-[1000px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-16">
              How the Program Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                { step: "01", title: "Join", desc: "Submit your registration application. Our partner success team reviews applications within 1-2 business days." },
                { step: "02", title: "Promote", desc: "Share your unique referral link across blogs, social media channels, email newsletters, and client networks." },
                { step: "03", title: "Earn", desc: "Receive lifetime commission payouts directly to your bank account or UPI every month your referrals remain active." }
              ].map((item, idx) => (
                <div key={idx} className="text-center relative flex flex-col items-center">
                  <span className="text-5xl font-black text-primary/15 font-mono mb-4 block">{item.step}</span>
                  <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                  <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold max-w-[280px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commissions Breakout */}
        <section className="py-20 md:py-28 border-b border-[var(--line)]">
          <div className="max-w-[800px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Commission Breakout
            </h2>
            <p className="text-sm text-[var(--muted)] font-semibold mb-12">
              See what you earn every month per client subscription referred:
            </p>

            <div className="border border-[var(--line)] rounded-3xl overflow-hidden shadow-sm bg-[var(--panel)]">
              <div className="grid grid-cols-3 bg-[var(--bg-2)] border-b border-[var(--line)] px-6 py-4 font-bold text-xs uppercase tracking-wider text-left text-[var(--ink)]">
                <span>Plan Level</span>
                <span>Plan Pricing</span>
                <span>Your Commission (25%)</span>
              </div>
              <div className="divide-y divide-[var(--line)] text-left text-sm font-semibold">
                {[
                  { name: "Starter Plan", price: "$49 / mo", commission: "$12.25 / mo" },
                  { name: "Growth Plan", price: "$99 / mo", commission: "$24.75 / mo" },
                  { name: "Pro Plan", price: "$199 / mo", commission: "$49.75 / mo" }
                ].map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 px-6 py-4">
                    <span className="font-bold text-[var(--ink)]">{item.name}</span>
                    <span className="text-[var(--muted)]">{item.price}</span>
                    <span className="text-primary font-extrabold">{item.commission}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who Can Join */}
        <section className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--bg-2)]/30">
          <div className="max-w-[1240px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-16">
              Who Can Join the Program?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Agencies & Consultants", desc: "Manage client projects and recommend SoloSpider to bundle website diagnostics." },
                { title: "Freelancers & Creators", desc: "Monetize your blogs, YouTube content, LinkedIn newsletters, and tutorials." },
                { title: "SEO Professionals", desc: "Help marketers explore modern Answer Engine Optimization diagnostics." },
                { title: "Affiliate Marketers", desc: "Drive structured campaigns and earn life-long recurring SaaS payouts." }
              ].map((item, idx) => (
                <div key={idx} className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl text-left hover:border-primary/20 transition-colors">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-widest mb-2">✦ {item.title}</h4>
                  <p className="text-xs text-[var(--muted)] leading-normal font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="py-20 md:py-28 border-b border-[var(--line)]">
          <div className="max-w-[800px] mx-auto px-7 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-16">
              Affiliate Program FAQs
            </h2>

            <div className="space-y-4 text-left">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between px-6 py-5 font-bold text-base select-none">
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </div>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-sm text-[var(--muted)] leading-relaxed font-semibold border-t border-[var(--line)]/50 pt-4 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply Now CTA */}
        <section className="py-20 md:py-28 text-center bg-gradient-to-br from-indigo-500/10 to-purple-600/10 relative overflow-hidden">
          <div className="max-w-[800px] mx-auto px-7 relative z-10 flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Start Earning Today
            </h2>
            <p className="text-base text-[var(--muted)] font-semibold max-w-lg mb-8">
              Become a SoloSpider partner and join our mission to make website optimization and content operations simple.
            </p>
            <Link 
              href="/affiliate/apply" 
              className="btn btn-grad px-10 py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              Apply to the Program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
