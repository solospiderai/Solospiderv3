"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, HelpCircle, Mail, MessageSquare, ShieldAlert } from "lucide-react";

export default function HelpCenterPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("getting-started");

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
    { id: "getting-started", label: "1. Getting Started" },
    { id: "billing", label: "2. Account & Billing" },
    { id: "ai-features", label: "3. AI Features" },
    { id: "technical-support", label: "4. Technical Support" },
    { id: "contact-support", label: "5. Contact Support" },
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
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Welcome to the <span className="grad-text">SoloSpider Help Center</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            Find answers, learn how to use SoloSpider, and get the most out of our AI-powered platform. Whether you're just getting started or looking for guidance on a specific feature, we're here to help.
          </p>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Support Categories
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
              <p className="font-semibold text-base mb-1 leading-normal">
                If you can't find the information you're looking for, feel free to contact us:
              </p>
              <div className="flex items-center gap-2 text-sm text-[var(--ink-2)] font-semibold mt-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline">info@solospider.ai</a>
              </div>
            </div>

            {/* Section 1 */}
            <section id="getting-started" className="scroll-mt-24 space-y-6 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Getting Started</h2>
              
              <div className="space-y-4">
                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">What is SoloSpider?</h4>
                  <p className="text-[14px]">SoloSpider is an AI-powered platform that helps businesses, marketers, agencies, and creators analyze websites, optimize SEO and Answer Engine Optimization (AEO), generate AI-powered content, and automate digital workflows—all from one unified platform.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">How do I create an account?</h4>
                  <p className="text-[14px]">Click <strong>Sign Up</strong>, create your account using your email address, and follow the verification process. Once your account is ready, you can access your dashboard and start exploring SoloSpider's features.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">How do I analyze a website?</h4>
                  <p className="text-[14px]">Simply enter the website URL into the analysis tool. SoloSpider will crawl the website, process its content, and generate AI-powered insights, recommendations, and optimization opportunities.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">What features are included?</h4>
                  <p className="text-[14px] mb-2">SoloSpider includes:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold pl-2">
                    {["AI Website Crawling", "AI Website Analysis", "Search Engine Optimization", "Answer Engine Optimization", "AI Blog Generation", "Social Media Generation", "Brand Summary Generation", "AI Content Optimization", "Prompt Analysis", "Analytics & Reporting"].map((f, i) => (
                      <span key={i} className="flex items-center gap-1.5"><span className="text-primary font-bold">✓</span>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="billing" className="scroll-mt-24 space-y-6 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Account & Billing</h2>
              
              <div className="space-y-4">
                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Can I change my subscription plan?</h4>
                  <p className="text-[14px]">Yes. You can upgrade or change your subscription at any time through your account settings. Any applicable billing changes will be reflected according to your selected plan.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">How do I cancel my subscription?</h4>
                  <p className="text-[14px]">You may cancel your subscription from your account dashboard. Your subscription will remain active until the end of your current billing cycle unless otherwise specified.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Do you offer refunds?</h4>
                  <p className="text-[14px]">Refund requests are reviewed on a case-by-case basis. Since SoloSpider provides digital services that become available immediately after purchase, refunds are not guaranteed. For complete details, please refer to our Refund Policy or contact us directly.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="ai-features" className="scroll-mt-24 space-y-6 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">AI Features</h2>
              
              <div className="space-y-4">
                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Is AI-generated content always accurate?</h4>
                  <p className="text-[14px]">Artificial Intelligence can generate highly useful content, but outputs may occasionally contain inaccuracies or require refinement. We recommend reviewing and verifying AI-generated content before publishing or using it for business decisions.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Can I edit AI-generated content?</h4>
                  <p className="text-[14px]">Absolutely. All AI-generated content can be reviewed, modified, and customized to match your brand voice and business requirements.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Does SoloSpider store my website content?</h4>
                  <p className="text-[14px]">SoloSpider processes website information only as necessary to provide the requested services. Please refer to our Privacy Policy for complete details regarding data processing and retention.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="technical-support" className="scroll-mt-24 space-y-6 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Technical Support</h2>
              
              <div className="space-y-4">
                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Why is my website taking longer to analyze?</h4>
                  <p className="text-[14px]">Analysis time depends on several factors, including website size, page complexity, server response times, and current platform usage. Larger websites may require additional processing time.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">Which browsers are supported?</h4>
                  <p className="text-[14px]">SoloSpider is designed to work with the latest versions of modern web browsers, including Google Chrome, Microsoft Edge, Mozilla Firefox, and Safari.</p>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-xl">
                  <h4 className="font-bold text-[16px] text-[var(--ink)] mb-2">I'm experiencing a technical issue. What should I do?</h4>
                  <p className="text-[14px]">If you're encountering an issue, please email <strong>info@solospider.ai</strong> with your registered email, a detailed description, screenshots, and URLs involved. This helps us resolve your request efficiently.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="contact-support" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]" style={{ marginBottom: '16px' }}>Contact Support</h2>
              <p>Need additional assistance? Our support team is here to help with technical questions, account inquiries, billing concerns, and general feedback.</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm" style={{ marginTop: '16px' }}>
                <h4 className="font-bold text-base font-display">SoloSpider Support Desk</h4>
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  Aiming to reply within <strong>1–2 business days</strong>.
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
