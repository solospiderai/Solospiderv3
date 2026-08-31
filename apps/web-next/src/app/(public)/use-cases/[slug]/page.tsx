"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

const useCaseContent = {
  agencies: {
    tag: "Agency Scale",
    title: "For Digital Agencies",
    subtitle: "Scale Client Success with AI-Powered Website Intelligence",
    description: "Managing multiple clients requires speed, consistency, and measurable results. SoloSpider helps digital agencies streamline website analysis, optimize SEO and AEO, generate high-quality content, and automate repetitive tasks—all from a single platform.",
    intro: "Whether you're auditing client websites, creating optimized content, improving search visibility, or delivering actionable insights, SoloSpider enables your team to work more efficiently while maintaining quality across every project.",
    useCasesTitle: "How Digital Agencies Use SoloSpider",
    bullets: [
      "Analyze client websites with AI-powered crawling and intelligent insights.",
      "Identify SEO and AEO opportunities to improve online visibility.",
      "Generate blogs, website copy, and social media content faster.",
      "Create professional brand summaries and marketing assets.",
      "Optimize existing content for better readability and search performance.",
      "Streamline repetitive workflows through AI automation.",
      "Monitor performance and deliver data-driven recommendations.",
      "Manage multiple digital projects more efficiently from one platform.",
    ],
    conclusion: "With SoloSpider, agencies can reduce manual effort, accelerate project delivery, and focus more on strategy, creativity, and client growth."
  },
  solo: {
    tag: "Solo Creators",
    title: "For Solo Creators",
    subtitle: "Create More, Grow Faster with AI",
    description: "Building your online presence takes time, but SoloSpider helps you focus on creating while AI handles the heavy lifting. From generating engaging content to optimizing your website for search and AI-powered discovery, SoloSpider gives solo creators the tools to grow their audience with less effort.",
    intro: "SoloSpider provides a full-featured workspace that acts as your personal digital assistant. You get access to everything you need to audit websites, customize brand summary settings, draft contents and optimize visibility in one place.",
    useCasesTitle: "How Solo Creators Use SoloSpider",
    bullets: [
      "Generate SEO-friendly blog articles.",
      "Create engaging social media content.",
      "Optimize website content for better visibility.",
      "Generate professional brand summaries.",
      "Improve content quality with AI recommendations.",
      "Save time by automating repetitive content tasks.",
    ],
    conclusion: "SoloSpider lets you run content and search marketing operations autonomously, freeing up hours of manual work."
  },
  freelancers: {
    tag: "Freelancer Speed",
    title: "For Freelancers",
    subtitle: "Deliver Better Results in Less Time",
    description: "Whether you're a marketer, developer, designer, SEO specialist, or consultant, SoloSpider helps you complete projects faster without compromising quality. Analyze client websites, generate optimized content, and provide actionable insights from one intelligent platform.",
    intro: "Provide professional-grade recommendations and deliverables to your clients under shorter timelines. SoloSpider keeps all client analytics under a single logged-in view for friction-free operations.",
    useCasesTitle: "How Freelancers Use SoloSpider",
    bullets: [
      "Perform AI-powered website audits.",
      "Improve client SEO and AEO performance.",
      "Generate blogs, website copy, and marketing content.",
      "Optimize existing content with AI.",
      "Create brand summaries and business profiles.",
      "Deliver faster, data-driven recommendations to clients.",
    ],
    conclusion: "Delight your clients with rapid turnarounds, structured content plans, and automated optimization workflows."
  },
  d2c: {
    tag: "D2C Brands",
    title: "For D2C Brands",
    subtitle: "Grow Your Brand with Smarter AI",
    description: "In a competitive e-commerce landscape, visibility and quality content matter more than ever. SoloSpider helps D2C brands strengthen their online presence with AI-powered website analysis, optimized content, and intelligent search recommendations that drive engagement and support business growth.",
    intro: "Accelerate your shopping visibility. SoloSpider audits and tracks how search engines and generative models read and describe your products online.",
    useCasesTitle: "How D2C Brands Use SoloSpider",
    bullets: [
      "Optimize product and landing page content.",
      "Improve SEO and AI search visibility.",
      "Generate blogs and marketing content.",
      "Create social media campaigns faster.",
      "Analyze website performance and identify improvements.",
      "Build a stronger and more consistent brand presence.",
    ],
    conclusion: "Scale customer acquisition by optimizing your store copy for modern AI-driven shopping platforms."
  },
  saas: {
    tag: "SaaS Acceleration",
    title: "For SaaS Startups",
    subtitle: "Accelerate Growth with AI-Powered Website Intelligence",
    description: "Growing a SaaS business requires clear messaging, strong search visibility, and continuous content creation. SoloSpider helps startups optimize their websites, create high-quality content, and improve discoverability so teams can spend less time on manual work and more time building great products.",
    intro: "Equip your growth team with powerful insights. Standardize content schedules and verify indexing rates to capture technical search traffic.",
    useCasesTitle: "How SaaS Startups Use SoloSpider",
    bullets: [
      "Analyze and optimize marketing websites.",
      "Improve SEO and Answer Engine Optimization (AEO).",
      "Generate educational blogs and product content.",
      "Create compelling social media posts.",
      "Produce clear brand summaries and messaging.",
      "Use AI insights to strengthen digital growth strategies.",
    ],
    conclusion: "Accelerate organic pipelines and capture developers' attention through clear, optimized, and authoritative content plans."
  }
} as const;

export default function UseCasePage() {
  const { slug } = useParams() as { slug: string };
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

  const content = useCaseContent[slug as keyof typeof useCaseContent];

  if (!content) {
    notFound();
  }

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

      <main className="flex-grow pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 text-center overflow-hidden">
          {/* Subtle concentric circles background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
            <div className="w-[800px] h-[800px] rounded-full border border-primary/20 flex items-center justify-center">
              <div className="w-[600px] h-[600px] rounded-full border border-primary/20 flex items-center justify-center">
                <div className="w-[400px] h-[400px] rounded-full border border-primary/20"></div>
              </div>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-7 relative z-10 text-center flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary text-[12px] font-mono font-bold uppercase tracking-wider mb-5">
              ● {content.tag}
            </span>
            <h1 className="text-4xl md:text-[60px] font-black tracking-tight leading-[1.1] mb-5 max-w-[850px] mx-auto animate-fade-in text-center">
              {content.title}
            </h1>
            <p className="text-[19px] text-[var(--muted)] max-w-[700px] mx-auto leading-relaxed mb-6 font-semibold text-center">
              {content.subtitle}
            </p>
          </div>
        </section>

        {/* Details and Grid Content */}
        <section className="py-8 relative z-10">
          <div className="max-w-[960px] mx-auto px-7 space-y-12">
            {/* Overview Box */}
            <div className="bg-[var(--panel)] border border-[var(--line)] p-6 md:p-8 rounded-2xl shadow-sm text-[var(--ink-2)] text-left space-y-4">
              <p className="text-base font-semibold leading-relaxed">
                {content.description}
              </p>
              <p className="opacity-95 text-[15px] leading-relaxed">
                {content.intro}
              </p>
            </div>

            {/* Bullets Grid */}
            <div className="space-y-6 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-primary font-bold justify-center">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Capabilities</span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-black tracking-tight text-[var(--ink)] pb-8 mb-4 text-center">
                {content.useCasesTitle}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-3.5 p-5 bg-[var(--panel)] border border-[var(--line)] rounded-xl shadow-sm hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-[14.5px] font-semibold text-[var(--ink-2)] leading-relaxed">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-[var(--bg-2)] p-6 md:p-8 rounded-2xl border border-[var(--line)] text-left">
              <p className="text-[15px] font-semibold text-[var(--ink-2)] leading-relaxed">
                {content.conclusion}
              </p>
            </div>

            {/* Call To Action */}
            <div className="text-center pt-8">
              <div className="inline-flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link href="/signup" className="btn btn-grad px-8 py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform w-full sm:w-auto flex items-center justify-center gap-1.5">
                  Start Free Trial <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/pricing" className="btn btn-ghost border-[var(--line)] px-8 py-4 text-sm font-semibold hover:bg-[var(--bg-2)] w-full sm:w-auto">
                  View Pricing Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
