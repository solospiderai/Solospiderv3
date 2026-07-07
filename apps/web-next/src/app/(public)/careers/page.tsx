"use client";

import { useState, useEffect } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { BookOpen, Briefcase, Mail, Sparkles, Star, Users } from "lucide-react";

export default function CareersPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState("why-work-with-us");

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
    { id: "why-work-with-us", label: "1. Why Work With Us" },
    { id: "who-looking-for", label: "2. Who We're Looking For" },
    { id: "opportunities", label: "3. Opportunities" },
    { id: "internship-program", label: "4. Internship Program" },
    { id: "general-applications", label: "5. General Applications" },
    { id: "join-journey", label: "6. Join Our Journey" },
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
            <Briefcase className="w-3.5 h-3.5" />
            <span>Careers at SoloSpider</span>
          </div>
          <h1 className="text-4xl md:text-[56px] leading-[1.1] font-display font-black tracking-tight mb-4">
            Build the Future of <span className="grad-text">AI-Powered Digital Growth</span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-4 font-medium max-w-3xl">
            At SoloSpider, we're building intelligent AI tools that help businesses understand, optimize, and grow their digital presence. From website analysis and SEO insights to AI-powered content generation and automation, our mission is to simplify complex digital workflows through innovative technology.
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
                We're always looking for curious, motivated, and talented individuals who are excited about building products that make a real impact.
              </p>
              <p className="opacity-90">
                Whether you're an experienced professional, a recent graduate, or an aspiring intern, SoloSpider offers an opportunity to learn, contribute, and grow alongside a team passionate about the future of artificial intelligence.
              </p>
            </div>

            {/* Section 1 */}
            <section id="why-work-with-us" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Why Work With Us</h2>
              <p>At SoloSpider, every idea has the opportunity to become a feature that helps businesses around the world. We value innovation, ownership, collaboration, and continuous learning.</p>
              <p>When you join SoloSpider, you'll have the opportunity to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  { title: "Cutting-Edge Stack", desc: "Work on modern AI-powered products and LLM integration infrastructures.", icon: Sparkles },
                  { title: "Real Impact", desc: "Solve real-world challenges in website intelligence, AEO and automation.", icon: Star },
                  { title: "Ownership", desc: "Contribute directly to meaningful features and lead development pipelines.", icon: Users },
                  { title: "Growth Environment", desc: "Learn new technologies daily in a fast-moving, innovative workspace.", icon: Briefcase },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4 p-5 bg-[var(--panel)] border border-[var(--line)] rounded-xl shadow-sm">
                      <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[15px] text-[var(--ink)] mb-1">{item.title}</h4>
                        <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2 */}
            <section id="who-looking-for" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Who We're Looking For</h2>
              <p>We're interested in individuals who are:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Passionate about technology and innovation.</li>
                <li>Curious and eager to learn.</li>
                <li>Strong problem-solvers with a growth mindset.</li>
                <li>Self-motivated and proactive.</li>
                <li>Comfortable working collaboratively in a flat organization.</li>
                <li>Committed to building high-quality, pixel-perfect user experiences.</li>
              </ul>
              <p className="pt-2">We believe great talent comes from diverse backgrounds and experiences, and we're always excited to connect with people who share our passion for creating intelligent software.</p>
            </section>

            {/* Section 3 */}
            <section id="opportunities" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Opportunities</h2>
              <p>As SoloSpider continues to grow, opportunities may become available across areas such as:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {[
                  "AI & Machine Learning",
                  "Software Engineering",
                  "Frontend Development",
                  "Backend Development",
                  "Full Stack Development",
                  "UI/UX Design",
                  "Product Management",
                  "SEO & Digital Marketing",
                  "Content Strategy",
                  "Sales & DevRel",
                  "Customer Success",
                ].map((item, idx) => (
                  <div key={idx} className="bg-[var(--bg-2)] px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-semibold text-[var(--ink)] text-center">
                    {item}
                  </div>
                ))}
              </div>
              <p className="pt-2 text-xs text-[var(--muted)]">Current openings may vary based on business needs.</p>
            </section>

            {/* Section 4 */}
            <section id="internship-program" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Internship Program</h2>
              <p>Learning is an important part of innovation.</p>
              <p>Our internship opportunities are designed to provide hands-on experience through real projects, practical problem-solving, and exposure to modern technologies. Interns work on meaningful assignments while developing technical and professional skills in a collaborative environment.</p>
            </section>

            {/* Section 5 */}
            <section id="general-applications" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">General Applications</h2>
              <p>Don't see a role that matches your background?</p>
              <p>We're always interested in connecting with talented individuals who believe they can contribute to SoloSpider's mission.</p>
              <p>If you'd like to be considered for future opportunities, send us your resume along with a brief introduction about yourself and your areas of interest.</p>
              <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl max-w-md space-y-3 shadow-sm pt-5">
                <div className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:info@solospider.ai" className="hover:text-primary hover:underline font-semibold">info@solospider.ai</a>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="join-journey" className="scroll-mt-24 space-y-4 text-left">
              <h2 className="font-display text-2xl font-black tracking-tight text-[var(--ink)]">Join Our Journey</h2>
              <p className="font-semibold text-[16px]">
                Artificial Intelligence is transforming the way businesses operate online, and we're excited to help shape that future.
              </p>
              <p>
                If you're passionate about building innovative technology and creating products that solve real problems, we'd love to hear from you. We'll review your application and reach out if there's a suitable opportunity that matches your skills and experience.
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
