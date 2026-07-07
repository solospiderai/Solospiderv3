"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Calendar, Mail, ShieldAlert, ArrowUpRight } from "lucide-react";

export default function TermsOfServicePage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("eligibility");

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
    { id: "eligibility", label: "1. Eligibility" },
    { id: "about", label: "2. About SoloSpider" },
    { id: "accounts", label: "3. User Accounts" },
    { id: "trial", label: "4. Free Trial" },
    { id: "subscriptions", label: "5. Subscription Plans" },
    { id: "payments", label: "6. Payments" },
    { id: "cancellation", label: "7. Cancellation" },
    { id: "refunds", label: "8. Refund Policy" },
    { id: "acceptable-use", label: "9. Acceptable Use" },
    { id: "crawling", label: "10. Website Crawling" },
    { id: "ai-content", label: "11. AI-Generated Content" },
    { id: "intellectual-property", label: "12. Intellectual Property" },
    { id: "user-content", label: "13. User Content" },
    { id: "data-processing", label: "14. Data Processing" },
    { id: "third-party", label: "15. Third-Party Services" },
    { id: "availability", label: "16. Service Availability" },
    { id: "termination", label: "17. Suspension & Termination" },
    { id: "disclaimer", label: "18. Disclaimer of Warranties" },
    { id: "liability", label: "19. Limitation of Liability" },
    { id: "indemnification", label: "20. Indemnification" },
    { id: "privacy", label: "21. Privacy" },
    { id: "changes-services", label: "22. Changes to Services" },
    { id: "changes-terms", label: "23. Changes to Terms" },
    { id: "governing-law", label: "24. Governing Law" },
    { id: "disputes", label: "25. Dispute Resolution" },
    { id: "severability", label: "26. Severability" },
    { id: "entire-agreement", label: "27. Entire Agreement" },
    { id: "contact", label: "28. Contact Information" },
  ];

  // Set up scroll listener to highlight active section
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
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Terms of <span className="grad-text">Service</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-4 font-medium">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span>Effective Date: July 7, 2026</span>
          </div>
        </div>

        {/* Documentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-4 scrollbar-thin border-r border-[var(--line)]">
            <h4 className="font-display font-extrabold text-[12px] uppercase tracking-widest text-[var(--ink)] mb-6 opacity-60">
              Table of Contents
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
                Welcome to <strong>SoloSpider ("SoloSpider", "we", "our", or "us")</strong>. These Terms of Service ("Terms") govern your access to and use of our website, applications, products, APIs, software, and services available through <a href="https://solospider.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5">https://solospider.ai <ArrowUpRight className="w-3.5 h-3.5 opacity-65" /></a> (collectively, the "Services").
              </p>
              <p className="opacity-90">
                By creating an account, accessing, or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with these Terms, you must not access or use the Services.
              </p>
            </div>

            {/* Section 1 */}
            <section id="eligibility" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">1. Eligibility</h2>
              <p>You must be at least 18 years old or the age of legal majority in your jurisdiction to use our Services.</p>
              <p>By using SoloSpider, you represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You have the legal capacity to enter into a binding agreement.</li>
                <li>The information you provide is accurate and complete.</li>
                <li>Your use of the Services complies with all applicable laws and regulations.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="about" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">2. About SoloSpider</h2>
              <p>SoloSpider is an AI-powered platform that helps individuals and businesses improve their online presence through various artificial intelligence tools and website analysis services.</p>
              <p>Depending on your subscription plan, our Services may include:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  "AI-powered website crawling",
                  "Website analysis & indexing check",
                  "SEO and AEO optimization guidance",
                  "AI-generated content drafts",
                  "Blog automation pipelines",
                  "Social media content generation",
                  "Brand profile summary",
                  "Prompt evaluation scans",
                  "Integrations with third-party tools",
                  "Analytics and AEO visibility reports",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-[var(--bg-2)] px-4 py-2.5 rounded-xl border border-[var(--line)] text-[13.5px] font-semibold text-[var(--ink-2)]">
                    <span className="text-primary font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-2">We reserve the right to add, modify, suspend, or discontinue any feature at any time.</p>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">3. User Accounts</h2>
              <p>To access certain Services, you must create an account.</p>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate registration information.</li>
                <li>Keep your login credentials secure.</li>
                <li>Maintain the confidentiality of your account.</li>
                <li>Notify us immediately if you suspect unauthorized access.</li>
              </ul>
              <p>You are responsible for all activities occurring under your account.</p>
            </section>

            {/* Section 4 */}
            <section id="trial" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">4. Free Trial</h2>
              <p>SoloSpider may offer a free trial for eligible users.</p>
              <p>Free trial availability, duration, limitations, and included features may change without prior notice.</p>
              <p>We reserve the right to modify the trial period, restrict abuse, terminate active free trials, or deny multiple trial registrations.</p>
            </section>

            {/* Section 5 */}
            <section id="subscriptions" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">5. Subscription Plans</h2>
              <p>Certain Services require a paid subscription.</p>
              <p>Subscription details, pricing, limits, and features are displayed on our pricing page.</p>
              <p>By purchasing a subscription, you agree to pay all applicable charges. Subscription fees are billed in advance and are non-transferable.</p>
            </section>

            {/* Section 6 */}
            <section id="payments" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">6. Payments</h2>
              <p>Payments are processed through secure third-party payment providers.</p>
              <p>By purchasing a subscription, you authorize us to charge your selected payment method for applicable fees, taxes, and recurring subscription charges where applicable.</p>
              <p>Failure to successfully process payment may result in suspension or termination of your subscription.</p>
            </section>

            {/* Section 7 */}
            <section id="cancellation" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">7. Cancellation</h2>
              <p>You may cancel your subscription at any time through your account dashboard.</p>
              <p>Cancellation prevents future renewals but does not automatically entitle you to a refund for payments already made.</p>
              <p>You may continue using paid features until the end of your current billing period unless otherwise specified.</p>
            </section>

            {/* Section 8 */}
            <section id="refunds" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">8. Refund Policy</h2>
              <p>Refund requests are evaluated on a case-by-case basis.</p>
              <p>Because SoloSpider provides digital software services that begin immediately after purchase, refunds are not guaranteed.</p>
              <p>Factors considered may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical issues preventing service usage</li>
                <li>Duplicate payments or billing errors</li>
                <li>Service availability and applicable consumer protection laws</li>
              </ul>
              <p>We reserve the sole discretion to approve or deny refund requests.</p>
            </section>

            {/* Section 9 */}
            <section id="acceptable-use" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">9. Acceptable Use</h2>
              <p>You agree to use SoloSpider responsibly and lawfully.</p>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 text-slate-700 dark:text-red-200/80 mb-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-650 dark:text-red-400 text-sm mb-1">Strict Prohibition</h4>
                  <p className="text-xs">You must not violate laws, upload malicious code, reverse engineer the platform, disrupt systems, abuse AI features, or attempt to exploit vulnerabilities.</p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="crawling" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">10. Website Crawling</h2>
              <p>Certain features allow users to analyze websites.</p>
              <p>You represent and warrant that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You own the website being analyzed, <strong>or</strong> you have authorization from the owner.</li>
                <li>Your use of website crawling complies with applicable laws, robots.txt directives, and third-party rights.</li>
              </ul>
              <p>SoloSpider is not responsible for unauthorized website analysis initiated by users.</p>
            </section>

            {/* Section 11 */}
            <section id="ai-content" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">11. AI-Generated Content</h2>
              <p>Our Services use artificial intelligence to generate recommendations, content, analyses, and other outputs.</p>
              <p>AI-generated content may contain inaccuracies, should not be considered professional advice, and requires human review before publication.</p>
              <p>You are solely responsible for reviewing, editing, and verifying all AI-generated outputs.</p>
            </section>

            {/* Section 12 */}
            <section id="intellectual-property" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">12. Intellectual Property</h2>
              <p>All intellectual property rights relating to SoloSpider, including software, design, branding, logos, features, source code, user interface, and documentation, remain the exclusive property of SoloSpider or its licensors.</p>
              <p>These Terms do not transfer ownership of any intellectual property to you.</p>
            </section>

            {/* Section 13 */}
            <section id="user-content" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">13. User Content</h2>
              <p>You retain ownership of the content you submit to SoloSpider.</p>
              <p>By submitting content, you grant SoloSpider a limited, non-exclusive, worldwide, royalty-free license to process, analyze, temporarily store, and display such content solely for the purpose of providing the Services.</p>
              <p>We do not claim ownership of your content.</p>
            </section>

            {/* Section 14 */}
            <section id="data-processing" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">14. Data Processing</h2>
              <p>To provide our Services, SoloSpider may temporarily process website URLs, website content, AI prompts, generated outputs, uploaded files, and configuration settings.</p>
              <p>Data is processed only as necessary to provide requested functionality.</p>
            </section>

            {/* Section 15 */}
            <section id="third-party" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">15. Third-Party Services</h2>
              <p>SoloSpider integrates with third-party providers including AI models, analytics, payment processors, and cloud providers.</p>
              <p>We are not responsible for third-party availability, accuracy, policies, outages, or security practices. Your use of integrated services may also be subject to their respective terms.</p>
            </section>

            {/* Section 16 */}
            <section id="availability" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">16. Service Availability</h2>
              <p>While we strive for high availability, we do not guarantee uninterrupted or error-free operation.</p>
              <p>Maintenance, upgrades, technical issues, or circumstances beyond our control may temporarily interrupt the Services.</p>
            </section>

            {/* Section 17 */}
            <section id="termination" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">17. Suspension & Termination</h2>
              <p>We may suspend or terminate your account without prior notice if you violate these Terms, abuse the Services, engage in fraudulent activity, fail to pay applicable fees, pose security risks, or engage in illegal activities.</p>
              <p>Termination does not relieve you of outstanding payment obligations.</p>
            </section>

            {/* Section 18 */}
            <section id="disclaimer" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">18. Disclaimer of Warranties</h2>
              <p>The Services are provided on an "AS IS" and "AS AVAILABLE" basis.</p>
              <p>To the fullest extent permitted by law, SoloSpider disclaims all warranties, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted availability.</p>
            </section>

            {/* Section 19 */}
            <section id="liability" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">19. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, SoloSpider and its affiliates, directors, and employees shall not be liable for any indirect, incidental, consequential, special, or punitive damages.</p>
              <p>Our total liability for any claim shall not exceed the amount you paid to SoloSpider during the twelve (12) months preceding the event giving rise to the claim.</p>
            </section>

            {/* Section 20 */}
            <section id="indemnification" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">20. Indemnification</h2>
              <p>You agree to defend, indemnify, and hold harmless SoloSpider and its partners from any claims, damages, liabilities, losses, expenses, and legal fees arising from your use of the Services, submitted content, violation of these Terms, or infringement of third-party rights.</p>
            </section>

            {/* Section 21 */}
            <section id="privacy" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">21. Privacy</h2>
              <p>Your use of the Services is also governed by our Privacy Policy, which explains how we collect, process, and protect your information.</p>
            </section>

            {/* Section 22 */}
            <section id="changes-services" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">22. Changes to the Services</h2>
              <p>We may modify, improve, discontinue, or replace any aspect of the Services at any time without prior notice. Features, pricing, limitations, and plans may change periodically.</p>
            </section>

            {/* Section 23 */}
            <section id="changes-terms" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">23. Changes to These Terms</h2>
              <p>We may update these Terms from time to time. When material changes are made, we will update the Effective Date. Your continued use of the Services after updated Terms become effective constitutes acceptance of those changes.</p>
            </section>

            {/* Section 24 */}
            <section id="governing-law" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">24. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.</p>
            </section>

            {/* Section 25 */}
            <section id="disputes" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">25. Dispute Resolution</h2>
              <p>Any dispute arising out of or relating to these Terms or the Services shall first be attempted to be resolved through good-faith negotiations.</p>
              <p>If a resolution cannot be reached, the dispute shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
            </section>

            {/* Section 26 */}
            <section id="severability" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">26. Severability</h2>
              <p>If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
            </section>

            {/* Section 27 */}
            <section id="entire-agreement" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">27. Entire Agreement</h2>
              <p>These Terms constitute the entire agreement between you and SoloSpider regarding your use of the Services and supersede all prior agreements, communications, and understandings.</p>
            </section>

            {/* Section 28 */}
            <section id="contact" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]" style={{ marginBottom: '16px' }}>28. Contact Information</h2>
              <p>If you have any questions regarding these Terms of Service, you may contact us at:</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm" style={{ marginTop: '16px' }}>
                <h4 className="font-bold text-base">SoloSpider</h4>
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
