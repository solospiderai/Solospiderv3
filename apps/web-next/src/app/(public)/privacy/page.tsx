"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Calendar, Mail, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("scope");

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
    { id: "scope", label: "1. Scope" },
    { id: "collect", label: "2. Information We Collect" },
    { id: "use", label: "3. How We Use Information" },
    { id: "ai-processing", label: "4. AI Processing" },
    { id: "crawling-data", label: "5. Website Content Processing" },
    { id: "analytics-data", label: "6. Google Analytics" },
    { id: "third-party", label: "7. Third-Party Services" },
    { id: "sharing", label: "8. How We Share Information" },
    { id: "retention", label: "9. Data Retention" },
    { id: "security", label: "10. Data Security" },
    { id: "international", label: "11. International Users" },
    { id: "rights", label: "12. Your Rights" },
    { id: "deletion", label: "13. Account Deletion" },
    { id: "children", label: "14. Children's Privacy" },
    { id: "third-party-links", label: "15. Third-Party Links" },
    { id: "changes", label: "16. Policy Changes" },
    { id: "contact", label: "17. Contact Us" },
    { id: "consent", label: "18. Consent" },
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
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Privacy <span className="grad-text">Policy</span>
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
                Welcome to <strong>SoloSpider ("SoloSpider", "we", "our", or "us")</strong>.
              </p>
              <p className="opacity-90">
                This Privacy Policy explains how we collect, use, process, disclose, and protect your information when you access or use our website, applications, software, APIs, and related services available through <a href="https://solospider.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5">https://solospider.ai <ArrowUpRight className="w-3.5 h-3.5 opacity-65" /></a> (collectively, the "Services"). By using SoloSpider, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>

            {/* Section 1 */}
            <section id="scope" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">1. Scope</h2>
              <p>This Privacy Policy applies to all users of SoloSpider worldwide. It explains:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>What information we collect and how we use it.</li>
                <li>How we store and protect your information.</li>
                <li>Your privacy rights and how to exercise them.</li>
                <li>How to contact us regarding privacy matters.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="collect" className="scroll-mt-24 space-y-6 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">2. Information We Collect</h2>
              <p>Depending on how you use our Services, we may collect the following categories of information:</p>
              
              <div className="space-y-5 pl-4 border-l-2 border-[var(--line)]">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">A. Account Information</h3>
                  <p>When you create an account, we may collect your full name, email address, password (stored securely in encrypted form), profile details, and account preferences.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">B. Subscription Information</h3>
                  <p>If you purchase a paid plan, we track your subscription plan tier, billing status, invoice data, and transaction details. <strong>We do not store your complete payment card details.</strong> Payment processing is handled securely by trusted third-party providers (e.g. Stripe, Razorpay).</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">C. Website Analysis Information</h3>
                  <p>When using SoloSpider to analyze websites, we temporarily retrieve and process URLs, metadata, public code structure, SEO settings, and crawl results to generate recommendations.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">D. AI Inputs and Outputs</h3>
                  <p>When using AI content features, we process text prompts, instructions, uploaded files, and generated outputs solely to deliver AI-powered writing and scheduling.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">E. Device and Technical Information</h3>
                  <p>We automatically collect technical details such as your browser type, device type, operating system, IP address, system language settings, screen resolution, and time zone.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">F. Usage Information</h3>
                  <p>We track your log-in history, feature usage, session timings, error reports, and general performance metrics to improve the quality of SoloSpider.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-[var(--ink)]">G. Cookies and Similar Technologies</h3>
                  <p>We use cookies to maintain user sessions, remember preferences, and analyze website traffic. You can manage cookies in your browser settings, though disabling them may impact some website features.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="use" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">3. How We Use Your Information</h2>
              <p>We use collected information to provide, maintain, and optimize SoloSpider, including to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage user accounts & subscriptions.</li>
                <li>Process website crawler requests & run SEO/AEO analysis.</li>
                <li>Deliver AI-powered blogging, copywriting, and media drafts.</li>
                <li>Analyze system performance, troubleshoot bugs, and enforce our Terms of Service.</li>
                <li>Authenticate requests and block security threats or fraudulent abuse.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="ai-processing" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">4. AI Processing</h2>
              <p>SoloSpider integrates with multiple third-party artificial intelligence engines (e.g. OpenAI, Anthropic, OpenRouter) to generate outputs.</p>
              <p>When you submit content, website context, or prompts for generation, that data is securely transmitted to these providers. We select reputable AI vendors that maintain appropriate security standards. AI-generated content requires human review before commercial publication.</p>
            </section>

            {/* Section 5 */}
            <section id="crawling-data" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">5. Temporary Processing of Website Content</h2>
              <p>To analyze a website, SoloSpider's web crawler temporarily retrieves and parses public HTML content from the specified domains. This enables us to provide brand profile building, search-engine audits, and content gaps identification.</p>
              <p>Unless required for operational logs, diagnostics, or billing metrics, this retrieved crawl content is not retained longer than necessary to run your requested analysis.</p>
            </section>

            {/* Section 6 */}
            <section id="analytics-data" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">6. Google Analytics</h2>
              <p>We use Google Analytics to monitor public traffic patterns and optimize user flows. Google Analytics collects anonymized session lengths, geographical regions, browser types, and traffic sources. Google processes this information according to its own privacy policy.</p>
            </section>

            {/* Section 7 */}
            <section id="third-party" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">7. Third-Party Services</h2>
              <p>Our Services rely on several trusted external providers for payment processing, database hosting, analytical tracking, and custom SMTP email delivery. These providers process information only on our behalf and are subject to their respective privacy terms.</p>
            </section>

            {/* Section 8 */}
            <section id="sharing" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">8. How We Share Information</h2>
              <p><strong>We do not sell your personal information.</strong> We only share information to service providers executing services on our behalf, or in case of business transfers, legal requirements, or protecting user rights against fraud.</p>
            </section>

            {/* Section 9 */}
            <section id="retention" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">9. Data Retention</h2>
              <p>We retain personal information only for as long as necessary to provide active Services, maintain accounts, and comply with regulatory and legal reporting obligations.</p>
            </section>

            {/* Section 10 */}
            <section id="security" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">10. Data Security</h2>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-slate-700 dark:text-emerald-200/80 mb-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-650 dark:text-emerald-450 text-sm mb-1">Secure Architecture</h4>
                  <p className="text-xs">We protect data using secure authentication, end-to-end encryption in transit, strict access control, regular patches, and monitoring. However, no internet method is 100% secure.</p>
                </div>
              </div>
            </section>

            {/* Section 11 */}
            <section id="international" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">11. International Users</h2>
              <p>SoloSpider is operated from India, but is hosted globally. By using the Services, you agree that your information may be processed and stored in other countries where our data servers are located.</p>
            </section>

            {/* Section 12 */}
            <section id="rights" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">12. Your Rights</h2>
              <p>Depending on your location, you may have legal rights to access, correct, restrict, port, object to, or delete your personal information. To trigger a request, contact our team via the contact details below.</p>
            </section>

            {/* Section 13 */}
            <section id="deletion" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">13. Account Deletion</h2>
              <p>You may request deletion of your account at any time. Upon request, we will remove or anonymize your personal account data unless retention is required by database transaction history or active legal holds.</p>
            </section>

            {/* Section 14 */}
            <section id="children" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">14. Children's Privacy</h2>
              <p>SoloSpider is designed for individuals at least 18 years old. We do not knowingly collect personal data from minors. If you suspect a minor has created an account, please notify us immediately.</p>
            </section>

            {/* Section 15 */}
            <section id="third-party-links" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">15. Links to Third-Party Websites</h2>
              <p>We are not responsible for the privacy practices of external websites linked within our site. Please read the privacy policies of third-party domains before submitting personal info.</p>
            </section>

            {/* Section 16 */}
            <section id="changes" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">16. Changes to This Privacy Policy</h2>
              <p>We may periodically update this policy. We will notify users of material changes by updating the effective date of this document. Continued use of SoloSpider signifies your consent to the changes.</p>
            </section>

            {/* Section 17 */}
            <section id="contact" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">17. Contact Us</h2>
              <p>If you have any questions or privacy-related complaints, please reach out to us:</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm">
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

            {/* Section 18 */}
            <section id="consent" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">18. Consent</h2>
              <p className="font-semibold">
                By accessing or using SoloSpider, creating an account, or purchasing a subscription plan, you confirm that you have read, understood, and agree to the data collection and processing methods outlined in this Privacy Policy.
              </p>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
