"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { useAuth } from "@/hooks/useAuth";
import { triggerRazorpayCheckout } from "@/lib/razorpay";

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("solospider_theme");
      setIsDark(saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    window.localStorage.setItem("solospider_theme", nextDark ? "dark" : "light");
  };

  const triggerWizard = () => {
    setWizardDomain("");
    setIsWizardOpen(true);
  };

  const handlePlanClick = (planId: "growth" | "scale") => {
    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    let couponCode = undefined;
    if (planId === "growth") {
      const codeInput = window.prompt("Do you have a coupon code? (Enter SOLO99 for 99% off the Growth Plan)");
      if (codeInput !== null) {
        couponCode = codeInput;
      }
    }

    triggerRazorpayCheckout({
      planId,
      userEmail: user.email,
      couponCode,
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-ink selection:bg-primary/20 selection:text-ink overflow-x-hidden font-sans"
      style={
        {
          "--bg": isDark ? "#0e0c1a" : "#fbfaf7",
          "--bg-2": isDark ? "#141226" : "#f3f2eb",
          "--panel": isDark ? "#1c1a35" : "#ffffff",
          "--line": isDark ? "#252340" : "#e2e1da",
          "--ink": isDark ? "#ffffff" : "#000000",
          "--ink-2": isDark ? "#e2e8f0" : "#0f172a",
          "--muted": isDark ? "#94a3b8" : "#334155",
        } as React.CSSProperties
      }
    >
      <MarketingNavbar 
        isDark={isDark} 
        onToggleTheme={toggleTheme} 
        onOpenWizard={triggerWizard} 
      />

      <main>
        {/* HERO & PRICING PLANS SECTION */}
        <section className="relative pt-[140px] pb-24 bg-[var(--bg)] text-center overflow-hidden">
          <div className="max-w-[820px] mx-auto px-7 relative z-10 mb-16">
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold px-3 py-1 bg-primary-soft rounded-full border border-primary/10">— Pricing plans</span>
            <h1 className="text-4xl md:text-[64px] leading-[1.05] mt-6 mb-6 font-display font-black tracking-tight">
              One Price.<br />
              <span className="grad-text">Everything Included.</span>
            </h1>
            <p className="text-[18px] text-ink-2 max-w-[620px] mx-auto">
              No feature gating. No per-seat pricing surprises. Pick the plan that fits your volume and get access to every single Solo Spider capability.
            </p>
          </div>

          <div className="max-w-[1240px] mx-auto px-7 relative z-10">

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              
              {/* Starter Plan */}
              <div className="bg-[var(--panel)] border border-line rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Free forever</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-ink uppercase">STARTER</h3>
                <div className="text-[12px] text-muted -mt-2">For creators just getting started</div>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-ink">₹0</span>
                  <span className="text-[13px] font-semibold text-muted font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-3 text-[13px] text-ink-2 border-t border-line pt-5 mt-1">
                  {[
                    "1 project",
                    "1 AI model (+$50/extra)",
                    "5 blog posts/month",
                    "30 social posts (schedule only)",
                    "1 SEO audit (total)",
                    "SEO recommendations only",
                    "5 social media connections",
                    "SoloSpider branding on reports",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start text-left">
                      <div className="shrink-0 w-4.5 h-4.5 rounded-full bg-primary-soft text-primary flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={triggerWizard} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-2 text-xs">Get started free →</button>
              </div>

              {/* Growth Plan */}
              <div className="relative border-2 border-[#9025F2] bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] shadow-[0_20px_50px_-12px_rgba(144,37,242,0.18)] rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-12px_rgba(144,37,242,0.28)] overflow-visible">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#9025F2] text-white font-display font-extrabold text-[11px] tracking-widest uppercase px-5 py-2 rounded-full z-20 shadow-[0_4px_14px_rgba(144,37,242,0.5)] whitespace-nowrap" style={{background:'#9025F2'}}>Most popular</span>
                
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Recommended for creators</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-ink -mt-1 uppercase">GROWTH</h3>
                <div className="text-[12px] text-muted -mt-2">For founders, freelancers & creators</div>
                <div className="mt-1 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-black text-[46px] leading-none tracking-tight text-primary transition-all duration-200">
                      $199
                    </span>
                    <span className="text-[13px] font-semibold text-muted font-sans ml-1">/month</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-[13px] text-ink-2 border-t border-line pt-5 mt-1">
                  {[
                    "5 projects (+$50/extra)",
                    "4 AI models (+$50/extra)",
                    "Unlimited blog posts",
                    "Unlimited social scheduling",
                    "30 AI media studio posts/mo",
                    "Weekly SEO audit + AI fix",
                    "Unlimited AEO/GEO",
                    "5 social media connections",
                    "Priority support",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start text-left">
                      <div className="shrink-0 w-4.5 h-4.5 rounded-full bg-primary text-white flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="leading-tight font-medium text-ink">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanClick("growth")} className="btn btn-grad w-full justify-center mt-auto cursor-pointer py-2 text-xs relative overflow-hidden transition-all duration-200 hover:scale-[1.02]">Start Growth plan →</button>
              </div>

              {/* Scale Plan */}
              <div className="bg-[var(--panel)] border border-line rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">For scaling businesses</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-ink uppercase">SCALE</h3>
                <div className="text-[12px] text-muted -mt-2">For growing teams & agencies</div>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-ink">$699</span>
                  <span className="text-[13px] font-semibold text-muted font-sans ml-1">/month</span>
                </div>
                <div className="flex flex-col gap-3 text-[13px] text-ink-2 border-t border-line pt-5 mt-1">
                  {[
                    "10 projects (+$50/extra)",
                    "7 AI models (+$50/extra)",
                    "Unlimited blog posts",
                    "Unlimited social scheduling",
                    "30 AI media studio posts/mo",
                    "Weekly SEO audit + AI fix",
                    "Unlimited AEO/GEO",
                    "5 social media connections",
                    "Your brand logo on reports",
                    "API access (coming soon)",
                    "24/7 dedicated support",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start text-left">
                      <div className="shrink-0 w-4.5 h-4.5 rounded-full bg-primary-soft text-primary flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanClick("scale")} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-2 text-xs">Start Scale plan →</button>
              </div>

              {/* Custom Plan */}
              <div className="bg-[var(--panel)] border border-line rounded-3xl p-6 lg:p-7 flex flex-col gap-5 transition-all duration-300 hover:border-primary/45 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(144,37,242,0.12)] relative">
                <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold">Best for enterprise</span>
                <h3 className="font-display text-[22px] font-extrabold tracking-tight text-ink uppercase">CUSTOM</h3>
                <div className="text-[12px] text-muted -mt-2">For large teams & custom volume</div>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="font-display font-black text-[44px] leading-none tracking-tight text-ink">Custom</span>
                </div>
                <div className="flex flex-col gap-3 text-[13px] text-ink-2 border-t border-line pt-5 mt-7">
                  {[
                    "Custom projects",
                    "Custom AI models",
                    "Custom blog generation",
                    "Custom social & media studio",
                    "Custom SEO audit + AI fix",
                    "Custom AEO/GEO",
                    "Custom social connections",
                    "Your brand on reports",
                    "Full API access",
                    "Custom SLA & support",
                    "Dedicated onboarding call",
                  ].map((f, i) => (
                    <div key={i} className="flex gap-2.5 items-start text-left">
                      <div className="shrink-0 w-4.5 h-4.5 rounded-full bg-primary-soft text-primary flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={triggerWizard} className="btn btn-ghost w-full justify-center mt-auto cursor-pointer py-2 text-xs">Talk to us →</button>
              </div>

            </div>

            <div className="text-center mt-12 text-muted text-[14px] leading-relaxed">
              All plans include a <strong className="text-ink">7-day free trial</strong>. Credit card required.
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)] overflow-hidden border-t border-line">

          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary font-bold px-3 py-1 bg-primary-soft rounded-full border border-primary/10">— Customer success</span>
              <h2 className="text-3xl md:text-5xl mt-6 mb-[18px] font-display font-black">
                Loved by Creators & Agencies.<br />
                <span className="grad-text">Real Results. No Hype.</span>
              </h2>
              <p className="text-[17px] text-ink-2 max-w-[600px] mx-auto">
                See how marketing teams and solo builders are scaling their AI visibility and content output.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1240px] mx-auto">
              {[
                { 
                  q: "We cancelled Surfer, Buffer, and Canva in the same week. Solo Spider does everything they did — faster, cheaper, and without three different logins.", 
                  n: "Priya M.", 
                  r: "Founder, digital content agency · Mumbai",
                  initials: "PM",
                  color: "from-primary to-primary-2"
                },
                { 
                  q: "I'm a solopreneur running a D2C brand. Before Solo Spider, marketing took 3 hours a day. Now it takes 20 minutes. I genuinely don't know how I did it without this.", 
                  n: "Rahul D.", 
                  r: "Founder · Ahmedabad",
                  initials: "RD",
                  color: "from-[#ec4899] to-[#f43f5e]"
                },
                { 
                  q: "I use Solo Spider for 6 clients. The content quality is good enough that two clients thought I'd hired a writer. I hadn't — I just had the right tool.", 
                  n: "Sneha K.", 
                  r: "Freelance digital marketer · Bengaluru",
                  initials: "SK",
                  color: "from-primary to-[#ec4899]"
                },
                { 
                  q: "The AEO and GRO features alone are worth the subscription. No other tool even tracks AI search visibility. We're way ahead of our competitors because of it.", 
                  n: "Arjun T.", 
                  r: "Head of Growth, SaaS startup · Pune",
                  initials: "AT",
                  color: "from-[#06b6d4] to-primary"
                },
                {
                  q: "Our clients love the white-label reports. We've seen a 40% increase in search visibility within the first two months of optimization.",
                  n: "Vikram S.",
                  r: "Agency Director · Delhi",
                  initials: "VS",
                  color: "from-[#f59e0b] to-[#d97706]"
                },
                {
                  q: "Automating blog posts and scheduling social content is incredibly easy. Solo Spider handles all my branding details perfectly.",
                  n: "Neha R.",
                  r: "Lifestyle Creator · Goa",
                  initials: "NR",
                  color: "from-[#10b981] to-[#059669]"
                },
                {
                  q: "Generating brand-specific content draft pipelines is seamless. The AEO monitoring dashboard helps us audit search results in real time.",
                  n: "Amit P.",
                  r: "Tech Founder · Hyderabad",
                  initials: "AP",
                  color: "from-[#3b82f6] to-[#2563eb]"
                },
                {
                  q: "Managing campaigns across 12 different workspace accounts is a breeze. It's the first tool that combines AI execution with clear SEO audits.",
                  n: "Divya J.",
                  r: "Marketing Lead · Chennai",
                  initials: "DJ",
                  color: "from-[#8b5cf6] to-[#7c3aed]"
                },
                {
                  q: "The onboarding setup took less than 5 minutes. The priority support and automatic content drafts have saved me thousands of rupees.",
                  n: "Kunal K.",
                  r: "Freelancer · Kochi",
                  initials: "KK",
                  color: "from-[#ec4899] to-[#db2777]"
                }
              ].map((test, i) => (
                <div 
                  key={i} 
                  className="bg-[var(--panel)] border border-line rounded-[24px] p-8 flex flex-col gap-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_50px_-15px_rgba(144,37,242,0.08)] hover:-translate-y-1 relative group overflow-hidden shadow-sm"
                >
                  <div className="absolute -right-4 -top-8 text-[120px] font-serif text-primary/5 select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-300">
                    “
                  </div>
                  
                  {/* Rating stars */}
                  <div className="flex gap-1 text-[13px] justify-start">
                    {[...Array(5)].map((_, idx) => (
                      <svg key={idx} className="w-[17px] h-[17px] text-yellow-500 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-[15.5px] text-ink-2 font-medium leading-relaxed italic z-10 text-left">
                    "{test.q}"
                  </p>

                  <div className="w-full h-px bg-gradient-to-r from-line via-line-2/45 to-transparent mt-auto" />

                  <div className="flex items-center gap-4 z-10 text-left">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${test.color} text-white flex items-center justify-center font-display font-extrabold text-[15px] shrink-0 shadow-sm`}>
                      {test.initials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[14.5px] text-ink">{test.n}</span>
                      <span className="text-[12.5px] text-muted">{test.r}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="relative py-20 md:py-[130px] bg-[var(--bg-2)]">
          <div className="max-w-[1240px] mx-auto px-7">
            <div className="text-center max-w-[820px] mx-auto mb-[72px]">
              <div className="mono text-primary mb-[18px]">— Common questions</div>
              <h2 className="mb-[18px] text-3xl md:text-5xl">Everything You Want to Know<br /><span className="grad-text">Before You Sign Up.</span></h2>
            </div>
            
            <div className="max-w-[880px] mx-auto flex flex-col gap-3.5">
              {[
                { q: "Do I need any technical skills to use Solo Spider?", a: "Not at all. Solo Spider is designed to be used without any coding or technical knowledge. If you can use Gmail, you can use Solo Spider. Setup takes under 5 minutes." },
                { q: "Will the content actually sound like me?", a: "Yes. Solo Spider learns your brand voice from your existing content, website, and the preferences you set during onboarding. You can always edit and refine drafts before publishing — but most users find they barely need to." },
                { q: "What platforms does Solo Spider post to?", a: "Instagram, LinkedIn, X (Twitter), Facebook, and more. Blog publishing works with WordPress, Webflow, Wix, and custom CMS setups via API." },
                { q: "What's AEO and GRO — do I really need it?", a: "AEO (Answer Engine Optimisation) and GRO (Generative Result Optimisation) help you appear in AI-generated search results — like Google's AI Overviews, ChatGPT, and Gemini answers. AI search is growing rapidly. Brands that optimise for it now will have a significant advantage. Yes, you need it." },
                { q: "How is Solo Spider different from just using ChatGPT?", a: "ChatGPT can write — but it can't publish, schedule, audit, post, or track your SEO and AI visibility. Solo Spider wraps powerful AI writing with an end-to-end marketing workflow. It's the difference between having an ingredient and having a meal." },
                { q: "Can I manage multiple clients or brands?", a: "Yes. The Agency plan supports 25+ separate client workspaces, each with their own brand settings, content calendars, and reports. You can manage everything without ever logging out." },
                { q: "Is there a free trial?", a: "Yes — every paid plan comes with a 14-day free trial. No credit card required. You can also use the Starter plan for free, forever." },
              ].map((faq, i) => (
                <div key={i} className={`bg-[var(--panel)] border border-line rounded-2xl overflow-hidden transition-colors duration-250 hover:border-primary/20 shadow-[0_8px_24px_-18px_rgba(14,12,26,0.08)] ${openFaq === i ? 'border-primary/20' : ''}`}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex justify-between items-center gap-4.5 p-5 lg:px-6 lg:py-5 text-left font-display font-semibold text-[18px] text-ink cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[14px] transition-all duration-250 ${openFaq === i ? 'bg-primary text-white rotate-45 border border-transparent' : 'bg-primary-soft text-primary border border-primary/15'}`}>+</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-350 ease-in-out ${openFaq === i ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-6 pt-4 border-t border-line text-[15px] text-ink-2 leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="relative bg-[var(--bg)] overflow-hidden py-20 md:py-[130px]">
          <div className="max-w-[1240px] mx-auto px-7 relative z-10">
            <div className="relative text-center max-w-[920px] mx-auto py-12 md:py-20 px-6 md:px-10 bg-gradient-to-b from-[var(--panel)] to-[var(--bg-2)] rounded-[32px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(144,37,242,0.2)]">
              <div className="absolute inset-0 rounded-[32px] p-[1.5px] bg-grad [mask-image:linear-gradient(#fff_0_0)] [mask-composite:exclude] pointer-events-none"></div>
              
              <div className="mono text-[#22d3ee] mb-3.5">— Ready to switch?</div>
              <h2 className="text-4xl md:text-[64px] leading-[1.05] mb-6 font-display font-black">
                Simplify Your Marketing.<br />
                <span className="grad-text">Amplify Your Results.</span>
              </h2>
              <p className="text-[18px] text-ink-2 mb-9 max-w-[680px] mx-auto">
                Join 2,000+ agencies and creators who replaced their entire digital marketing workflow with Solo Spider. Less cost. Less complexity. More output.
              </p>
              
              <div className="flex justify-center gap-3.5 flex-wrap mb-9">
                <button onClick={triggerWizard} className="btn btn-grad cursor-pointer">Start Free — No Card Needed →</button>
                <button onClick={triggerWizard} className="btn btn-ghost cursor-pointer">Book a 20-Minute Demo</button>
              </div>
              
              <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 text-[13.5px] text-ink-2">
                <span className="flex items-center gap-2"><span className="text-primary font-extrabold">✓</span>Free plan available, always</span>
                <span className="flex items-center gap-2"><span className="text-primary font-extrabold">✓</span>14-day trial of paid plans</span>
                <span className="flex items-center gap-2"><span className="text-primary font-extrabold">✓</span>Cancel or change plans anytime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
