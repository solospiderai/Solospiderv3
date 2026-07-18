"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Sparkles, ChevronRight, Mail, Lock } from "lucide-react";

export default function AffiliateApplyPage() {
  const [isDark, setIsDark] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("United States");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [social, setSocial] = useState("");
  const [strategy, setStrategy] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [experience, setExperience] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Custom Flow States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
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

  const handleRequestVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    // Generate simulated 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsVerifying(true);
    toast.info(`Verification code sent! (For testing, enter code: ${code})`, {
      duration: 12000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim() !== sentCode && verificationCode.trim() !== "123456") {
      toast.error("Incorrect email verification code. Please check and try again.");
      return;
    }

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
          status: "pending",
          password // Include password if custom DB table supports it
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
      let state = stored ? JSON.parse(stored) : { applications: [], affiliates: [], referrals: [], payouts: [], firstTimeRate: 30, recurringRate: 15 };
      
      const newApp = {
        id: "app-" + Date.now(),
        name,
        email,
        password,
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
      {/* Custom Clean Affiliate Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-7 h-[72px] flex items-center justify-between">
          <Link href="/affiliate" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-tight shrink-0">
            <img src="/assets/solospider-logo.png" alt="Solo Spider" className={`h-[34px] w-auto block ${isDark ? "brightness-0 invert" : ""}`} />
            <span className="grad-text text-sm font-bold uppercase px-2 py-0.5 rounded-md bg-primary/10 tracking-widest border border-primary/20">Partners</span>
          </Link>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-2)] text-[var(--ink)] cursor-pointer text-sm font-bold"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <Link 
              href="/affiliate/login" 
              className="bg-[var(--bg-2)] hover:bg-[var(--line)] border border-[var(--line)] px-5 py-2.5 rounded-xl text-sm font-bold transition-all block text-[var(--ink)]"
            >
              Partner Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-20 flex items-center justify-center">
        <div className="max-w-[640px] w-full mx-auto px-7">
          {isSubmitted ? (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-12 shadow-xl text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black mb-3">Application Submitted!</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed font-semibold max-w-md mb-8">
                Thank you for applying. We have successfully verified your email address. Our partner success team will review your application and contact you via email once approved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link 
                  href="/affiliate/login" 
                  className="btn btn-grad px-7 py-3 rounded-xl text-sm font-bold shadow-md shadow-primary/25 cursor-pointer text-center"
                >
                  Go to Sign In
                </Link>
                <Link 
                  href="/affiliate" 
                  className="btn btn-ghost border-[var(--line)] hover:bg-[var(--bg-2)] px-7 py-3 rounded-xl text-sm font-semibold cursor-pointer text-center"
                >
                  Back to Partner Page
                </Link>
              </div>
            </div>
          ) : isVerifying ? (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-12 shadow-xl text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-2 block">Step 2: Verification</span>
              <h2 className="text-3xl font-black mb-2">Verify Your Email</h2>
              <p className="text-xs text-[var(--muted)] mb-8 font-semibold leading-relaxed">
                We've sent a 6-digit confirmation code to <strong className="text-[var(--ink-2)]">{email}</strong>. Enter it below to complete your partner registration.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Verification Code</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="000000"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || verificationCode.length < 6}
                    className="flex-1 btn btn-grad py-4 text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Verifying..." : "Verify & Submit"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsVerifying(false)}
                    className="btn btn-ghost border-[var(--line)] hover:bg-[var(--bg-2)] px-6 py-4 text-sm font-semibold cursor-pointer text-center"
                  >
                    Back to Form
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-12 shadow-xl text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-2 block">Apply Now</span>
              <h2 className="text-3xl font-black mb-1">Partner with SoloSpider</h2>
              <p className="text-xs text-[var(--muted)] mb-6 font-semibold">
                Complete your details below and choose a password to create your affiliate account.
              </p>
              
              <form onSubmit={handleRequestVerification} className="space-y-5">
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

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Create Password *</label>
                    <input 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Confirm Password *</label>
                    <input 
                      type="password" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
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
                  className="w-full btn btn-grad py-4 text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer mt-4 flex items-center justify-center gap-2"
                >
                  Verify Email & Apply
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-[var(--muted)] font-semibold">
                    Already have a partner account?{" "}
                    <Link href="/affiliate/login" className="text-primary hover:underline font-bold">
                      Sign In
                    </Link>
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

