"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { 
  BookOpen, Sparkles, Network, Activity, Search, ShieldAlert,
  Edit, Share2, Award, Settings, Zap, BarChart2, ShieldCheck 
} from "lucide-react";

export default function FeaturesPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("crawling");

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
    { id: "crawling", label: "1. AI Website Crawling" },
    { id: "analysis", label: "2. AI Website Analysis" },
    { id: "seo", label: "3. Search Engine Optimization" },
    { id: "aeo", label: "4. Answer Engine Optimization" },
    { id: "blog-generation", label: "5. AI Blog Generation" },
    { id: "social-generation", label: "6. Social Media Generation" },
    { id: "brand-summary", label: "7. Brand Summary Generation" },
    { id: "content-optimization", label: "8. AI Content Optimization" },
    { id: "prompt-analysis", label: "9. Prompt Analysis & Enhancement" },
    { id: "content-insights", label: "10. Intelligent Content Insights" },
    { id: "workflow-automation", label: "11. AI Workflow Automation" },
    { id: "performance-reporting", label: "12. Analytics & Reporting" },
    { id: "unified-workspace", label: "13. Unified AI Workspace" },
    { id: "stages-growth", label: "14. Built for Every Stage" },
    { id: "innovation", label: "15. Continuous Innovation" },
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Features</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Powerful AI Tools to <span className="grad-text">Transform Your Digital Presence</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            SoloSpider brings together intelligent website analysis, AI-powered content creation, search optimization, and workflow automation into one unified platform. Designed for businesses, agencies, creators, and marketers, our features help you save time, improve visibility, and make smarter digital decisions.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Features List
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
            {/* Section 1 */}
            <section id="crawling" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Website Crawling</h2>
              </div>
              <p>SoloSpider intelligently crawls your website to understand its structure, content, metadata, and overall organization. By analyzing publicly accessible pages, our platform builds the foundation for deeper insights, enabling more accurate recommendations across SEO, AEO, and content optimization.</p>
            </section>

            {/* Section 2 */}
            <section id="analysis" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Website Analysis</h2>
              </div>
              <p>Go beyond basic website audits with comprehensive AI-powered analysis. SoloSpider evaluates your website to identify strengths, uncover improvement opportunities, and provide actionable insights that help enhance your digital presence.</p>
            </section>

            {/* Section 3 */}
            <section id="seo" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Search Engine Optimization (SEO)</h2>
              </div>
              <p>Improve your search engine visibility with intelligent SEO recommendations tailored to your website. From content quality and metadata to structure and optimization opportunities, SoloSpider helps you build a stronger foundation for organic growth.</p>
            </section>

            {/* Section 4 */}
            <section id="aeo" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Answer Engine Optimization (AEO)</h2>
              </div>
              <p>As AI-powered search continues to evolve, optimizing for answer engines has become increasingly important. SoloSpider helps prepare your content for modern AI search experiences, making it easier for intelligent assistants and answer engines (like ChatGPT, Gemini, Perplexity) to understand and surface your information.</p>
            </section>

            {/* Section 5 */}
            <section id="blog-generation" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Blog Generation</h2>
              </div>
              <p>Create well-structured, SEO-friendly blog articles in minutes. Whether you're publishing educational content, marketing campaigns, or industry insights, SoloSpider helps generate high-quality articles that align with your brand and audience.</p>
            </section>

            {/* Section 6 */}
            <section id="social-generation" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Social Media Content Generation</h2>
              </div>
              <p>Maintain a consistent online presence with AI-generated social media content. Generate engaging captions, promotional posts, and creative ideas designed to support your marketing efforts across multiple platforms.</p>
            </section>

            {/* Section 7 */}
            <section id="brand-summary" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Brand Summary Generation</h2>
              </div>
              <p>Instantly generate professional summaries that accurately represent your business, products, or services. SoloSpider transforms website information into clear, concise brand descriptions suitable for websites, presentations, profiles, and marketing materials.</p>
            </section>

            {/* Section 8 */}
            <section id="content-optimization" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Content Optimization</h2>
              </div>
              <p>Improve existing website content with intelligent suggestions focused on readability, clarity, relevance, and search performance. SoloSpider helps refine your content while preserving your unique brand voice and messaging.</p>
            </section>

            {/* Section 9 */}
            <section id="prompt-analysis" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Prompt Analysis & Enhancement</h2>
              </div>
              <p>Create more effective AI prompts through intelligent analysis and optimization. SoloSpider evaluates prompt quality and provides recommendations that help generate more accurate, relevant, and consistent AI outputs across different use cases.</p>
            </section>

            {/* Section 10 */}
            <section id="content-insights" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Intelligent Content Insights</h2>
              </div>
              <p>Understand how your website content performs through AI-driven evaluation. SoloSpider identifies opportunities to strengthen messaging, improve content quality, and enhance the overall user experience with data-backed recommendations.</p>
            </section>

            {/* Section 11 */}
            <section id="workflow-automation" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Workflow Automation</h2>
              </div>
              <p>Reduce repetitive work by automating common digital tasks with artificial intelligence. SoloSpider streamlines content generation, website analysis, and optimization workflows, allowing you to focus on strategy instead of manual processes.</p>
            </section>

            {/* Section 12 */}
            <section id="performance-reporting" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Analytics & Performance Reporting</h2>
              </div>
              <p>Monitor your optimization journey through comprehensive reports and actionable insights. Track website improvements, analyze AI-generated recommendations, and measure progress from a centralized dashboard designed to support informed decision-making.</p>
            </section>

            {/* Section 13 */}
            <section id="unified-workspace" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Unified AI Workspace</h2>
              </div>
              <p>Instead of relying on multiple disconnected tools, SoloSpider brings website intelligence, SEO, AEO, AI content creation, prompt optimization, and analytics together within a single platform. Everything you need to optimize and grow your digital presence is accessible from one streamlined workspace.</p>
            </section>

            {/* Section 14 */}
            <section id="stages-growth" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Built for Every Stage of Growth</h2>
              </div>
              <p>Whether you're an entrepreneur launching your first website, a growing business expanding your digital reach, a marketing agency managing multiple clients, or an enterprise scaling operations, SoloSpider adapts to your workflow with intelligent tools designed to grow alongside your business.</p>
            </section>

            {/* Section 15 */}
            <section id="innovation" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Continuous Innovation</h2>
              </div>
              <p>Artificial intelligence is evolving rapidly, and so is SoloSpider. We continuously enhance our platform with new capabilities, performance improvements, and intelligent features to ensure users always have access to modern solutions for website optimization and digital growth.</p>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
