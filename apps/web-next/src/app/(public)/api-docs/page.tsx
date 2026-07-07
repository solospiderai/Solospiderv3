"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Key, Terminal, Code, Cpu, Mail } from "lucide-react";

export default function ApiDocsPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("build-with");

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
    { id: "build-with", label: "1. Build with SoloSpider" },
    { id: "what-able-do", label: "2. Upcoming Capabilities" },
    { id: "dev-experience", label: "3. Developer Experience" },
    { id: "authentication", label: "4. Authentication" },
    { id: "coming-soon", label: "5. Documentation Coming Soon" },
    { id: "stay-updated", label: "6. Stay Updated" },
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
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Center</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            SoloSpider <span className="grad-text">Developer API</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            We're working on a public API that will enable developers to integrate SoloSpider's AI-powered website intelligence directly into their own applications, workflows, and platforms.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              API Docs
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
                Our goal is to provide a secure, scalable, and developer-friendly API that makes it easy to leverage SoloSpider's capabilities programmatically.
              </p>
            </div>

            {/* Section 1 */}
            <section id="build-with" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Build with SoloSpider</h2>
              <p>The SoloSpider Developer Platform is designed to support custom integrations, third-party analytics dashboarding, CRM hookups, and large-scale bulk content automation processes.</p>
            </section>

            {/* Section 2 */}
            <section id="what-able-do" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">What You'll Be Able to Do</h2>
              <p>The upcoming SoloSpider API is being designed to support a wide range of integrations, including:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  "AI-powered website analysis",
                  "Triggerable website crawling",
                  "SEO and Answer Engine Optimization (AEO) insights",
                  "AI content generation endpoints",
                  "Brand summary profile generation",
                  "Prompt quality scans",
                  "Analytics metrics & visibility reporting",
                  "AI marketing workflow automations",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-[var(--bg-2)] px-4 py-2.5 rounded-xl border border-[var(--line)] text-[13.5px] font-semibold text-[var(--ink-2)]">
                    <span className="text-primary font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3 */}
            <section id="dev-experience" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Developer Experience</h2>
              <p>The SoloSpider API is being built with developers in mind. Documentation will include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Detailed authentication guides.</li>
                <li>Comprehensive REST API reference.</li>
                <li>JSON request and response examples.</li>
                <li>Native SDKs and webhook integration guides.</li>
                <li>Standardized HTTP error code handling.</li>
                <li>Rate limits and traffic best practices.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="authentication" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Authentication</h2>
              </div>
              <p>The public API will use secure Bearer Token authentication to protect your applications and data. Detailed authentication instructions and API key management will be available when the developer platform launches.</p>
            </section>

            {/* Section 5 */}
            <section id="coming-soon" className="scroll-mt-24 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Documentation Coming Soon</h2>
              </div>
              <p>Comprehensive API documentation, integration examples, and developer resources will be published as part of our upcoming developer platform.</p>
            </section>

            {/* Section 6 */}
            <section id="stay-updated" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]" style={{ marginBottom: '16px' }}>Stay Updated</h2>
              <p>If you're interested in integrating with SoloSpider or would like early access to our developer API, we'd love to hear from you. For developer inquiries and API-related questions, contact us at:</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm" style={{ marginTop: '16px' }}>
                <h4 className="font-bold text-base font-display">SoloSpider DevRel Desk</h4>
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
