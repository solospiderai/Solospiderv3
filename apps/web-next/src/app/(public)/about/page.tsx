"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Mail, ShieldCheck, Heart, Sparkles, Building, Rocket } from "lucide-react";

export default function AboutUsPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("mission");

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
    { id: "mission", label: "1. Our Mission" },
    { id: "what-we-do", label: "2. What We Do" },
    { id: "audience", label: "3. Built for Modern Businesses" },
    { id: "why-solospider", label: "4. Why SoloSpider?" },
    { id: "technology", label: "5. Our Technology" },
    { id: "commitment", label: "6. Our Commitment" },
    { id: "privacy-trust", label: "7. Privacy and Trust" },
    { id: "looking-ahead", label: "8. Looking Ahead" },
    { id: "join-journey", label: "9. Join the Journey" },
    { id: "contact", label: "10. Contact Us" },
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>About SoloSpider</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Transforming Websites into <span className="grad-text">Smarter Digital Experiences</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            At <strong>SoloSpider</strong>, we believe every website has untapped potential. Our mission is to help businesses, creators, marketers, agencies, and entrepreneurs unlock that potential through the power of Artificial Intelligence.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Overview
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
              <p className="font-semibold text-base mb-4 leading-normal">
                We built SoloSpider to simplify the way people analyze, optimize, and grow their online presence. Instead of relying on multiple disconnected tools, SoloSpider brings intelligent website analysis, AI-powered content generation, SEO insights, Answer Engine Optimization (AEO), and workflow automation together in one platform.
              </p>
              <p className="opacity-90">
                Whether you're launching a new website, improving search visibility, creating engaging content, or scaling your digital strategy, SoloSpider helps you work faster and make better decisions.
              </p>
            </div>

            {/* Section 1 */}
            <section id="mission" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Our Mission</h2>
              <p>Our mission is to make advanced AI technology accessible to everyone by providing intelligent tools that simplify website optimization, content creation, and digital growth.</p>
              <p>We strive to eliminate repetitive work, reduce complexity, and empower users to focus on building exceptional online experiences rather than managing countless manual tasks.</p>
            </section>

            {/* Section 2 */}
            <section id="what-we-do" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">What We Do</h2>
              <p>SoloSpider combines artificial intelligence with website intelligence to help users understand, improve, and scale their digital presence.</p>
              <p>Our platform offers powerful capabilities including:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  "AI-powered website analysis",
                  "Search Engine Optimization (SEO) insights",
                  "Answer Engine Optimization (AEO)",
                  "AI-generated blogs and articles",
                  "Social media content generation",
                  "Brand summary creation",
                  "Website content optimization",
                  "Prompt analysis and enhancement",
                  "Automated digital workflows",
                  "Performance reporting and insights",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-[var(--bg-2)] px-4 py-2.5 rounded-xl border border-[var(--line)] text-[13.5px] font-semibold text-[var(--ink-2)]">
                    <span className="text-primary font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-2">Every feature is designed to save time while delivering meaningful, actionable results.</p>
            </section>

            {/* Section 3 */}
            <section id="audience" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Built for Modern Businesses</h2>
              <p>SoloSpider is designed for businesses of every size.</p>
              <p>Our platform supports:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {[
                  { label: "Startups", icon: Sparkles },
                  { label: "Marketing Agencies", icon: Building },
                  { label: "Freelancers", icon: BookOpen },
                  { label: "Content Creators", icon: Heart },
                  { label: "E-commerce Brands", icon: Building },
                  { label: "Developers", icon: Rocket },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-[var(--panel)] border border-[var(--line)] rounded-xl shadow-sm items-center text-center">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-[13px] font-bold text-[var(--ink)]">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="pt-2">Whether you're managing one website or hundreds, SoloSpider provides scalable AI tools that adapt to your workflow.</p>
            </section>

            {/* Section 4 */}
            <section id="why-solospider" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Why SoloSpider?</h2>
              <p>The digital landscape is evolving rapidly. Traditional SEO alone is no longer enough. Businesses now need content that performs across search engines, AI assistants, and answer engines.</p>
              <p>SoloSpider was created to bridge that gap.</p>
              <p>Our platform helps users:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Understand their websites more effectively</li>
                <li>Create high-quality AI-assisted content</li>
                <li>Improve discoverability</li>
                <li>Optimize for both traditional search and AI-driven search experiences</li>
                <li>Reduce manual effort through intelligent automation</li>
              </ul>
              <p>We continuously improve our platform to keep pace with emerging technologies and changing digital trends.</p>
            </section>

            {/* Section 5 */}
            <section id="technology" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Our Technology</h2>
              <p>SoloSpider leverages multiple advanced artificial intelligence models and modern cloud infrastructure to deliver reliable, scalable, and intelligent services.</p>
              <p>By combining AI with website analysis, automation, and data-driven insights, we enable users to make informed decisions and execute digital strategies with greater efficiency.</p>
              <p>We continuously evaluate new technologies to ensure our users have access to innovative solutions as the AI ecosystem evolves.</p>
            </section>

            {/* Section 6 */}
            <section id="commitment" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Our Commitment</h2>
              <p>We are committed to building software that is:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reliable</li>
                <li>Secure</li>
                <li>User-focused</li>
                <li>Continuously improving</li>
                <li>Accessible to businesses worldwide</li>
              </ul>
              <p>We believe technology should simplify work, not complicate it. Every update and feature we release is guided by our commitment to helping users achieve better digital outcomes with less effort.</p>
            </section>

            {/* Section 7 */}
            <section id="privacy-trust" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Privacy and Trust</h2>
              <p>Trust is fundamental to everything we build.</p>
              <p>We implement industry-standard security practices to protect user information and process data responsibly. Website analysis and AI processing are performed only to provide the requested services, and we continually work to improve the security, reliability, and transparency of our platform.</p>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-slate-700 dark:text-emerald-200/80 mb-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-650 dark:text-emerald-450 text-sm mb-1">Responsible Innovation</h4>
                  <p className="text-xs">As AI technology evolves, we remain committed to responsible innovation while maintaining the privacy and confidence of our users.</p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="looking-ahead" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Looking Ahead</h2>
              <p>Artificial Intelligence is reshaping the future of digital marketing, website optimization, and online business.</p>
              <p>At SoloSpider, our vision is to become a trusted AI platform that empowers businesses around the world to build smarter websites, create better content, and grow with confidence.</p>
              <p>We're constantly expanding our capabilities, refining our technology, and listening to our community so we can continue delivering solutions that create real value.</p>
            </section>

            {/* Section 9 */}
            <section id="join-journey" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Join the Journey</h2>
              <p className="font-semibold">Whether you're just starting your online journey or managing an established digital presence, SoloSpider is here to help you work smarter, create faster, and grow with confidence. Together, let's build the future of AI-powered digital success.</p>
            </section>

            {/* Section 10 */}
            <section id="contact" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Contact Us</h2>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm">
                <h4 className="font-bold text-base font-display">SoloSpider</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Website: <a href="https://solospider.ai" target="_blank" rel="noopener noreferrer" className="hover:underline">https://solospider.ai</a>
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
