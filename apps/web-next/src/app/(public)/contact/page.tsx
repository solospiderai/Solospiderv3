"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Mail, Clock, MessageSquare, Briefcase, Sparkles } from "lucide-react";

export default function ContactUsPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("get-in-touch");

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
    { id: "get-in-touch", label: "1. Get in Touch" },
    { id: "support", label: "2. Support" },
    { id: "business-partnership", label: "3. Business & Partnerships" },
    { id: "feedback-suggestions", label: "4. Feedback & Suggestions" },
    { id: "response-time", label: "5. Response Time" },
    { id: "stay-connected", label: "6. Stay Connected" },
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
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            We'd Love to <span className="grad-text">Hear From You</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            Whether you have a question, need assistance, want to share feedback, or are interested in learning more about SoloSpider, our team is here to help. We're committed to providing timely support and ensuring you have the best possible experience with our platform.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Directory
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
            <section id="get-in-touch" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]" style={{ marginBottom: '16px' }}>Get in Touch</h2>
              <p>For questions about SoloSpider, partnerships, business inquiries, or general information, contact us at:</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm" style={{ marginTop: '16px' }}>
                <h4 className="font-bold text-base font-display">General Inquiries</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="support" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Support</h2>
              <p>If you're experiencing technical issues or need help using our platform, please include as much detail as possible in your email, such as:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your registered email address.</li>
                <li>A description of the issue or question.</li>
                <li>Screenshots or screen recordings (if applicable).</li>
                <li>The steps taken before the issue occurred.</li>
              </ul>
              <p>Providing this information helps us investigate and resolve your request more efficiently.</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm pt-5">
                <h4 className="font-bold text-base font-display">Technical Support</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="business-partnership" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Business & Partnership Inquiries</h2>
              <p>We're always interested in collaborating with businesses, agencies, technology partners, and organizations looking to leverage AI-powered website intelligence and digital growth solutions.</p>
              <p>For partnership opportunities or business discussions, please contact us at:</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm pt-5">
                <h4 className="font-bold text-base font-display">Partnership Desk</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Briefcase className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="feedback-suggestions" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Feedback & Suggestions</h2>
              <p>Your feedback plays an important role in shaping the future of SoloSpider. If you have ideas for new features, product improvements, or ways we can enhance your experience, we'd love to hear from you.</p>
              <p>Every suggestion is reviewed by our team as we continue to improve and expand our platform.</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm pt-5">
                <h4 className="font-bold text-base font-display">Feedback Channel</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="response-time" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Response Time</h2>
              <p>We strive to respond to all inquiries as quickly as possible. While response times may vary depending on request volume, we aim to reply to most emails within <strong>1–2 business days</strong>.</p>
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 text-slate-700 dark:text-violet-200/80 mb-4 flex gap-3">
                <Clock className="w-5 h-5 shrink-0 text-violet-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-violet-650 dark:text-violet-400 text-sm mb-1">Timely Support</h4>
                  <p className="text-xs">Our response team handles support requests sequentially to ensure you receive details tailored to your concern.</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="stay-connected" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Stay Connected</h2>
              <p>SoloSpider is continuously evolving with new features, AI capabilities, and platform improvements. We appreciate your interest in our mission to simplify website optimization and digital growth through artificial intelligence.</p>
              <p className="font-semibold">Thank you for choosing SoloSpider. We look forward to hearing from you.</p>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
