"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Calendar, HelpCircle, ShieldCheck, Milestone, CheckCircle2 } from "lucide-react";

export default function RoadmapPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("research-vision");

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
    { id: "research-vision", label: "1. Research & Vision" },
    { id: "architecture", label: "2. Platform Architecture" },
    { id: "website-intelligence", label: "3. AI Website Intelligence" },
    { id: "search-optimization", label: "4. Search Optimization" },
    { id: "content-suite", label: "5. AI Content Suite" },
    { id: "prompt-intelligence", label: "6. Prompt Intelligence" },
    { id: "analytics-insights", label: "7. Analytics & Insights" },
    { id: "user-platform", label: "8. User Platform" },
    { id: "improvements", label: "9. Continuous Improvements" },
    { id: "today", label: "10. Today" },
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
            <Milestone className="w-3.5 h-3.5" />
            <span>Product Roadmap</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            SoloSpider <span className="grad-text">Roadmap</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            SoloSpider has been built with a clear vision: to simplify website intelligence, AI-powered content creation, and digital growth by bringing powerful capabilities into a single platform. Here's a look at the milestones that have shaped our journey.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Journey Milestones
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
            <section id="research-vision" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Research & Vision</h2>
              </div>
              <p>Every great platform begins with a problem to solve. SoloSpider was created after identifying the growing need for a unified AI platform that combines website analysis, SEO, AEO, content generation, and automation without requiring multiple disconnected tools.</p>
            </section>

            {/* Section 2 */}
            <section id="architecture" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Platform Architecture</h2>
              </div>
              <p>The foundation of SoloSpider was designed with scalability, security, and performance in mind. A modern cloud-based architecture was established to support AI-powered processing, intelligent website crawling, and seamless user experiences.</p>
            </section>

            {/* Section 3 */}
            <section id="website-intelligence" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Website Intelligence</h2>
              </div>
              <p>One of the platform's first major capabilities was the development of AI-powered website crawling and analysis. This enabled SoloSpider to understand website structure, content, and metadata, forming the basis for intelligent recommendations.</p>
            </section>

            {/* Section 4 */}
            <section id="search-optimization" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Search Optimization</h2>
              </div>
              <p>SEO and Answer Engine Optimization (AEO) capabilities were introduced to help users improve their website visibility across both traditional search engines and modern AI-powered search experiences.</p>
            </section>

            {/* Section 5 */}
            <section id="content-suite" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Content Suite</h2>
              </div>
              <p>SoloSpider expanded beyond analysis by introducing AI-powered content creation tools, including blog generation, social media content generation, brand summary creation, and intelligent content optimization.</p>
            </section>

            {/* Section 6 */}
            <section id="prompt-intelligence" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Prompt Intelligence</h2>
              </div>
              <p>To improve AI interactions, SoloSpider added prompt analysis and enhancement features, helping users create more effective prompts and generate higher-quality AI outputs.</p>
            </section>

            {/* Section 7 */}
            <section id="analytics-insights" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Analytics & Insights</h2>
              </div>
              <p>Comprehensive analytics and reporting were integrated to transform AI-generated data into clear, actionable insights, allowing users to make informed decisions about their digital strategy.</p>
            </section>

            {/* Section 8 */}
            <section id="user-platform" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">User Platform</h2>
              </div>
              <p>A complete user platform was developed with secure authentication, subscription management, an intuitive dashboard, and a streamlined experience for managing AI-powered workflows from a single workspace.</p>
            </section>

            {/* Section 9 */}
            <section id="improvements" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Continuous Improvements</h2>
              </div>
              <p>Since its development began, SoloSpider has undergone continuous refinement through performance optimizations, user experience enhancements, AI model improvements, bug fixes, and platform stability updates to deliver a faster, more reliable experience.</p>
            </section>

            {/* Section 10 */}
            <section id="today" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Today</h2>
              </div>
              <p>Today, SoloSpider stands as an AI-powered platform that combines website crawling, intelligent analysis, SEO, AEO, AI content generation, prompt optimization, analytics, and workflow automation into one unified solution, helping businesses, creators, agencies, and marketers grow their digital presence more efficiently.</p>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
