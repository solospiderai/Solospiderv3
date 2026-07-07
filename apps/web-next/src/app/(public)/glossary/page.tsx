"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, HelpCircle } from "lucide-react";

export default function GlossaryPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("ai");

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

  const glossaryTerms = [
    { id: "ai", term: "Artificial Intelligence (AI)", def: "Artificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence, such as understanding language, generating content, analyzing data, and making recommendations." },
    { id: "website-crawling", term: "Website Crawling", def: "Website crawling is the process of automatically exploring and collecting publicly accessible information from a website. SoloSpider uses intelligent crawling to analyze website structure, pages, metadata, and content before generating AI-powered insights." },
    { id: "website-analysis", term: "Website Analysis", def: "Website analysis is the process of evaluating a website's content, structure, performance, and optimization opportunities to identify areas for improvement and support better digital growth." },
    { id: "seo", term: "Search Engine Optimization (SEO)", def: "SEO is the practice of improving a website's visibility in search engine results by optimizing content, keywords, metadata, and overall website structure." },
    { id: "aeo", term: "Answer Engine Optimization (AEO)", def: "Answer Engine Optimization (AEO) focuses on optimizing content for AI-powered search experiences and answer engines, helping information become easier for intelligent assistants and modern search platforms (like ChatGPT, Gemini, Perplexity) to understand and present." },
    { id: "ai-content-generation", term: "AI Content Generation", def: "AI Content Generation uses artificial intelligence to create written content such as blog articles, website copy, marketing content, social media posts, and business summaries." },
    { id: "content-optimization", term: "Content Optimization", def: "Content optimization involves improving existing content to increase clarity, readability, relevance, engagement, and search performance while maintaining consistency with your brand." },
    { id: "brand-summary", term: "Brand Summary", def: "A brand summary is a concise description of a business, its products or services, target audience, and unique value proposition. SoloSpider can generate professional brand summaries using AI." },
    { id: "prompt", term: "Prompt", def: "A prompt is an instruction or input provided to an AI model that guides it in generating a response or completing a task." },
    { id: "prompt-analysis", term: "Prompt Analysis", def: "Prompt analysis evaluates the quality and effectiveness of a prompt, helping users improve clarity and generate more accurate AI responses." },
    { id: "workflow-automation", term: "Workflow Automation", def: "Workflow automation uses technology to reduce manual effort by automating repetitive tasks, improving efficiency, and streamlining business processes." },
    { id: "analytics", term: "Analytics", def: "Analytics refers to the collection and interpretation of data that helps measure website performance, user engagement, optimization progress, and overall digital growth." },
    { id: "dashboard", term: "Dashboard", def: "The dashboard is the central workspace within SoloSpider where users can access AI tools, website analyses, reports, generated content, and account information." },
    { id: "digital-presence", term: "Digital Presence", def: "Digital presence represents how a business or individual appears online through websites, content, search visibility, social media, and other digital channels." },
    { id: "metadata", term: "Metadata", def: "Metadata is information embedded within a webpage, such as page titles, descriptions, keywords, and structured data, that helps search engines and AI systems better understand the page." },
    { id: "keywords", term: "Keywords", def: "Keywords are the words and phrases people use when searching online. Optimizing content around relevant keywords helps improve discoverability in search engines." },
    { id: "ai-insights", term: "AI Insights", def: "AI insights are recommendations and observations generated by artificial intelligence after analyzing website content, structure, and digital performance." },
    { id: "cloud-platform", term: "Cloud Platform", def: "A cloud platform delivers software and services over the internet, allowing users to securely access SoloSpider from anywhere without installing additional software." },
    { id: "subscription-plan", term: "Subscription Plan", def: "A subscription plan provides access to SoloSpider's features based on the selected pricing tier and associated usage limits." },
    { id: "user-workspace", term: "User Workspace", def: "A user workspace is the personalized environment where users manage projects, website analyses, AI-generated content, reports, and platform settings." },
    { id: "continuous-optimization", term: "Continuous Optimization", def: "Continuous optimization is the ongoing process of improving website performance, content quality, search visibility, and digital strategy based on AI-powered recommendations and evolving best practices." },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of glossaryTerms) {
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
            <span>Product Glossary</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            SoloSpider <span className="grad-text">Glossary</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            Understanding the Language of AI and Website Intelligence. Learn the key terms, frameworks, and definitions behind our optimization platform.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Glossary Index
            </h4>
            <ul className="space-y-2.5 text-[13px] font-semibold">
              {glossaryTerms.map((sec) => (
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
                    {sec.term}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Main Legal Content */}
          <article className="space-y-12 text-[15px] leading-relaxed text-[var(--ink-2)] max-w-none">
            {glossaryTerms.map((item, index) => (
              <section key={item.id} id={item.id} className="scroll-mt-24 space-y-3 text-left pb-8 border-b border-[var(--line)]/50 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary font-bold bg-primary-soft/40 px-2 py-0.5 rounded-md">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
                    {item.term}
                  </h2>
                </div>
                <p className="text-[14.5px] leading-relaxed text-[var(--ink-2)] opacity-90">
                  {item.def}
                </p>
              </section>
            ))}
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
