"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Award, CheckCircle2, Building2, HelpCircle, Mail } from "lucide-react";

export default function CaseStudiesPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("success-stories");

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
    { id: "success-stories", label: "1. Success Stories" },
    { id: "what-find-here", label: "2. What You'll Find Here" },
    { id: "industries-cover", label: "3. Industries We'll Cover" },
    { id: "coming-soon", label: "4. Coming Soon" },
    { id: "success-story", label: "5. Have a Success Story?" },
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
            <Award className="w-3.5 h-3.5" />
            <span>Success Stories</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Real Results. <span className="grad-text">Real Growth.</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            At SoloSpider, our mission is to help businesses simplify website intelligence, optimize their digital presence, and achieve measurable growth through artificial intelligence.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Case Studies
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
                As organizations continue to use SoloSpider across website analysis, SEO, Answer Engine Optimization (AEO), AI-powered content creation, and workflow automation, we'll be sharing detailed case studies that highlight real challenges, practical solutions, and measurable outcomes.
              </p>
            </div>

            {/* Section 1 */}
            <section id="success-stories" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Success Stories</h2>
              <p>We are coordinating with our early launch partners to publish details on citation growth, keyword optimization, and traffic gains in detail. Check back soon for metric-backed deep dives.</p>
            </section>

            {/* Section 2 */}
            <section id="what-find-here" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">What You'll Find Here</h2>
              <p>Our upcoming case studies will provide an in-depth look at how businesses use SoloSpider to solve real-world digital challenges.</p>
              <p>Each case study will explore:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Business objectives and initial search challenges.</li>
                <li>Website analysis crawl findings & AI-driven index diagnostics.</li>
                <li>SEO and generative AEO citation optimization strategies.</li>
                <li>AI-powered content generation workflows and schedule mappings.</li>
                <li>Results, traffic increases, core metrics, and lessons learned.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="industries-cover" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Industries We'll Cover</h2>
              </div>
              <p>SoloSpider is built for organizations across a wide range of industries. Future case studies will feature businesses such as:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                {[
                  "Digital Agencies",
                  "SaaS Companies",
                  "E-Commerce & D2C",
                  "Tech Startups",
                  "Content Creators",
                  "Freelancers",
                  "Digital Consultants",
                  "Enterprise Teams",
                ].map((item, idx) => (
                  <div key={idx} className="bg-[var(--bg-2)] px-4 py-2.5 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--ink-2)] text-center">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4 */}
            <section id="coming-soon" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Coming Soon</h2>
              </div>
              <p>We're currently working with early users and continuously improving the SoloSpider platform. As more businesses achieve meaningful results, we'll publish detailed case studies showcasing how AI-powered website intelligence helps improve visibility, streamline workflows, and support long-term digital growth.</p>
              <p>Stay tuned for upcoming success stories and practical insights from organizations using SoloSpider.</p>
            </section>

            {/* Section 5 */}
            <section id="success-story" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]" style={{ marginBottom: '16px' }}>Have a Success Story?</h2>
              <p>If you're using SoloSpider and would like to share your experience, we'd love to hear from you. Exceptional customer stories may be featured in our future case studies.</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm" style={{ marginTop: '16px' }}>
                <h4 className="font-bold text-base font-display">Share Your Success</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
