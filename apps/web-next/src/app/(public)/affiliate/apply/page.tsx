"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AeoWizardModal } from "@/components/dashboard/aeo-wizard-modal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Sparkles, ChevronRight } from "lucide-react";

export default function AffiliateApplyPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDomain, setWizardDomain] = useState("");
  const [isDark, setIsDark] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("United States");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [social, setSocial] = useState("");
  const [strategy, setStrategy] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [experience, setExperience] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) return;

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("affiliate_applications")
        .insert({
          name,
          email,
          country,
          website: website || null,
          linkedin: linkedin || null,
          social: social || null,
          strategy,
          audience_size: audienceSize,
          experience,
          status: "pending"
        });

      if (error) {
        throw error;
      }

      toast.success("Successfully registered application in live database!");
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (dbError) {
      console.warn("Supabase database insert failed, fallback to local storage:", dbError);
      
      // Fallback to local storage if tables are not created or connection error
      const stored = window.localStorage.getItem("solospider_affiliate_state");
      let state = stored ? JSON.parse(stored) : { applications: [], affiliates: [], referrals: [], payouts: [], commissionRate: 25 };
      
      const newApp = {
        id: "app-" + Date.now(),
        name,
        email,
        country,
        website,
        linkedin,
        social,
        strategy,
        audienceSize,
        experience,
        status: "pending",
        appliedDate: new Date().toISOString().split("T")[0]
      };

      state.applications = [newApp, ...(state.applications || [])];
      window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(state));
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-300"
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

      <main className="flex-grow pt-28 pb-20 flex items-center justify-center">
        <div className="max-w-[640px] w-full mx-auto px-7">
          {!isSubmitted ? (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-12 shadow-xl text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-2 block">Apply Now</span>
              <h2 className="text-3xl font-black mb-6">Partner with SoloSpider</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Country *</label>
                    <select 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    >
                      {["United States", "India", "United Kingdom", "Canada", "Germany", "Australia", "Singapore", "France", "Japan"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Website URL (Optional)</label>
                    <input 
                      type="url" 
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="https://yourblog.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">LinkedIn Profile (Optional)</label>
                    <input 
                      type="url" 
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Social Profile Handle (Optional)</label>
                    <input 
                      type="text" 
                      value={social}
                      onChange={(e) => setSocial(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="@twitterhandle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">How do you plan to promote SoloSpider? *</label>
                  <textarea 
                    required 
                    rows={3}
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about your audience and marketing plans..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Audience Size *</label>
                    <input 
                      type="text" 
                      required 
                      value={audienceSize}
                      onChange={(e) => setAudienceSize(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. 10k followers, 50k monthly pageviews"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Marketing Experience *</label>
                    <input 
                      type="text" 
                      required 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. 3 years SEO marketing, developer"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="terms"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <label htmlFor="terms" className="text-xs text-[var(--muted)] leading-relaxed font-semibold cursor-pointer">
                    I accept the <Link href="/terms" className="text-primary hover:underline">Affiliate Terms & Conditions</Link> and agree to promote SoloSpider ethically.
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn btn-grad py-4 text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Submitting application..." : "Submit Application"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-12 shadow-xl text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black mb-3">Application Submitted!</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed font-semibold max-w-md mb-8">
                Thank you for applying. Our partner success team will review your application and contact you via email once approved.
              </p>

              <div className="bg-[var(--bg-2)] p-6 rounded-2xl border border-[var(--line)] text-left w-full space-y-4">
                <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Simulated Demo Controls
                </h4>
                <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed">
                  To test the complete affiliate flow immediately, visit the Admin Panel to approve this application:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link 
                    href="/affiliate/admin" 
                    className="btn btn-grad px-5 py-2.5 text-xs font-bold flex items-center gap-1 justify-center cursor-pointer shadow-sm"
                  >
                    Go to Admin Review <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="/affiliate" 
                    className="btn btn-ghost border-[var(--line)] px-5 py-2.5 text-xs font-semibold hover:bg-[var(--panel)] flex justify-center cursor-pointer"
                  >
                    Back to Partner Page
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <MarketingFooter />

      <AeoWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} initialDomain={wizardDomain} />
    </div>
  );
}
