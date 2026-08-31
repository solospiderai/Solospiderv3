"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Calendar, Clock, X, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  publishDate: string;
  readTime: string;
  snippet: string;
  paragraphs: string[];
}

export default function BlogPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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

  const blogPosts: BlogPost[] = [
    {
      id: "blog-1",
      title: "The Future of Website Intelligence: How AI Is Transforming Digital Growth",
      publishDate: "July 2026",
      readTime: "8 min read",
      snippet: "The way businesses manage their websites is changing rapidly. Learn how modern AI ecosystems are consolidating website analysis, SEO, and content ops into unified suites.",
      paragraphs: [
        "The way businesses manage their websites is changing rapidly. Traditional tools often focus on individual tasks like SEO, analytics, or content creation, forcing teams to switch between multiple platforms to achieve their goals.",
        "Artificial Intelligence is changing that approach.",
        "Modern AI platforms can now analyze websites, identify optimization opportunities, generate high-quality content, and automate repetitive workflows—all within a single ecosystem. This shift allows businesses to spend less time on manual processes and more time focusing on growth.",
        "At SoloSpider, we believe website intelligence should go beyond simple audits. By combining AI-powered website crawling, content optimization, SEO, Answer Engine Optimization (AEO), and intelligent insights, businesses can better understand their online presence and make smarter, data-driven decisions.",
        "As AI continues to evolve, website optimization will become increasingly proactive rather than reactive. The future belongs to platforms that help businesses continuously improve their digital presence through intelligent automation and actionable recommendations."
      ]
    },
    {
      id: "blog-2",
      title: "Understanding SEO and AEO: Why Both Matter in the Age of AI Search",
      publishDate: "July 2026",
      readTime: "6 min read",
      snippet: "Discover why traditional SEO and generative Answer Engine Optimization (AEO) are two sides of the same coin in securing visibility across modern search assistants.",
      paragraphs: [
        "For years, Search Engine Optimization (SEO) has been the foundation of online visibility. Businesses optimized websites to rank higher on traditional search engines and attract more visitors.",
        "Today, a new layer has emerged—Answer Engine Optimization (AEO).",
        "AI assistants and modern search experiences are increasingly providing direct answers instead of lists of links. This means websites need content that is not only optimized for search engines but also structured in a way that AI systems can easily understand and reference.",
        "Rather than replacing SEO, AEO complements it. Businesses that optimize for both traditional search and AI-powered search experiences are better positioned to reach users wherever they search for information.",
        "SoloSpider helps bridge this gap by providing AI-powered insights that support both SEO and AEO strategies from one unified platform."
      ]
    },
    {
      id: "blog-3",
      title: "Why Businesses Need AI-Powered Website Analysis",
      publishDate: "July 2026",
      readTime: "7 min read",
      snippet: "Manual website audits are slow and error-prone. Learn how AI analysis uncovers technical bottlenecks, metadata gaps, and visibility opportunities in seconds.",
      paragraphs: [
        "A website is often the first interaction customers have with a business. Yet many organizations rely on manual reviews or disconnected tools to evaluate their online presence.",
        "AI-powered website analysis changes that process by examining website structure, content quality, metadata, search optimization opportunities, and overall performance in a fraction of the time.",
        "Instead of spending hours identifying issues manually, businesses receive intelligent recommendations that help prioritize improvements and accelerate decision-making.",
        "Whether you're managing a company website, an e-commerce store, or multiple client projects, AI-powered analysis provides a clearer understanding of where your website performs well and where opportunities exist for growth.",
        "SoloSpider brings these capabilities together to simplify website intelligence and help businesses make confident, informed decisions."
      ]
    },
    {
      id: "blog-4",
      title: "Creating Smarter Content with Artificial Intelligence",
      publishDate: "July 2026",
      readTime: "5 min read",
      snippet: "Consistently writing quality copy is hard. Discover how to balance generative AI drafting with human creative oversight to produce brand-authentic content.",
      paragraphs: [
        "Creating consistent, high-quality content is one of the biggest challenges for modern businesses. From blog articles and social media posts to website copy and brand messaging, content demands continue to grow.",
        "Artificial Intelligence helps streamline this process by assisting with research, idea generation, writing, optimization, and refinement.",
        "However, AI works best as a collaborative tool rather than a replacement for human creativity. Businesses should combine AI-generated drafts with human expertise to ensure content remains accurate, authentic, and aligned with their brand voice.",
        "SoloSpider helps simplify content creation through AI-powered blog generation, social media content, brand summaries, prompt enhancement, and content optimization—enabling teams to produce better content more efficiently."
      ]
    }
  ];

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
            <span>Official Blog</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            The SoloSpider <span className="grad-text">Digital Blog</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-2xl">
            Read up on the latest trends in AI search visibility, website analytics, and AEO optimization workflows.
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/45 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.08)] text-left"
            >
              <div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)] font-semibold mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> {post.publishDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" /> {post.readTime}
                  </span>
                </div>
                <h3 className="font-display text-xl lg:text-2xl font-extrabold tracking-tight text-[var(--ink)] mb-3">
                  {post.title}
                </h3>
                <p className="text-[14px] text-[var(--ink-2)] leading-relaxed opacity-90 mb-6">
                  {post.snippet}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(post)}
                className="btn btn-ghost border-[var(--line)] w-full justify-center py-3 text-xs font-bold hover:bg-[var(--bg-2)] cursor-pointer flex items-center gap-1.5"
              >
                Read Full Article <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Article Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl relative text-left"
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
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--panel)] border-b border-[var(--line)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 text-xs text-[var(--muted)] font-semibold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> {selectedPost.publishDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> {selectedPost.readTime}
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-2)] text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6">
              <h2 className="font-display text-2xl md:text-3xl font-black tracking-tight text-[var(--ink)] leading-tight">
                {selectedPost.title}
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-[var(--ink-2)]">
                {selectedPost.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[var(--line)] px-6 py-4 bg-[var(--bg-2)] flex justify-end rounded-b-3xl">
              <button
                onClick={() => setSelectedPost(null)}
                className="btn btn-ghost border-[var(--line)] px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
