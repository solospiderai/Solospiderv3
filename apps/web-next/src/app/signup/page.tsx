"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Shield, Zap, Sparkles, LayoutDashboard } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Welcome! Account created successfully.");
      router.replace("/app/en/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app/en/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen font-sans"
      style={
        {
          "--bg": "#ffffff",
          "--bg-2": "#f8f6ff",
          "--panel": "#ffffff",
          "--line": "#e5e7eb",
          "--ink": "#000000",
          "--ink-2": "#0f172a",
          "--muted": "#334155",
        } as React.CSSProperties
      }
    >
      {/* Left panel: Showcase (Visible on lg viewports) */}
      <div 
        className="hidden lg:flex lg:w-[48%] bg-[#0a0822] text-white flex-col justify-between p-12 relative overflow-hidden select-none border-r border-white/5"
        style={
          {
            color: "#ffffff",
            "--ink": "#ffffff",
            "--ink-2": "#f8fafc",
            "--muted": "#94a3b8",
          } as React.CSSProperties
        }
      >
        {/* Glow blobs */}
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(144,37,242,0.18)_0,transparent_65%)] blur-[40px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12)_0,transparent_65%)] blur-[40px] pointer-events-none"></div>

        {/* Concentric Spider Web Vector Grid */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.045] pointer-events-none" viewBox="-400 -400 800 800" fill="none" stroke="#b260ff" strokeWidth="0.8">
          <g>
            <line x1="0" y1="0" x2="0" y2="-380" />
            <line x1="0" y1="0" x2="190" y2="-329" />
            <line x1="0" y1="0" x2="380" y2="0" />
            <line x1="0" y1="0" x2="190" y2="329" />
            <line x1="0" y1="0" x2="0" y2="380" />
            <line x1="0" y1="0" x2="-190" y2="329" />
            <line x1="0" y1="0" x2="-380" y2="0" />
            <line x1="0" y1="0" x2="-190" y2="-329" />
          </g>
          <circle cx="0" cy="0" r="70" />
          <circle cx="0" cy="0" r="150" />
          <circle cx="0" cy="0" r="230" />
          <circle cx="0" cy="0" r="310" />
        </svg>

        {/* Branding header */}
        <div className="relative z-10">
          <Link href="/">
            <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[36px] w-auto" />
          </Link>
        </div>

        {/* Key Features & Value Proposition */}
        <div className="relative z-10 my-auto max-w-lg space-y-9">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono tracking-widest text-[#22d3ee] uppercase">
              ⚡ Exclusive Onboarding
            </span>
            <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] text-white">
              Unlock Your Autonomous <br />
              <span className="grad-text">Marketing Workspace</span>
            </h1>
            <p className="text-[15px] text-slate-300 font-medium leading-relaxed">
              Your site analysis and optimization process has been scheduled. Set up your credentials to claim ownership of the workspace and start tracking visibility.
            </p>
          </div>

          {/* Benefits Bullet Points */}
          <div className="space-y-4.5">
            {[
              {
                icon: CheckCircle2,
                color: "text-violet-400",
                title: "50-Page Automated Crawl",
                desc: "Full scan for Core Web Vitals, speed index, on-page SEO issues, and tags."
              },
              {
                icon: Sparkles,
                color: "text-pink-400",
                title: "25 AEO & GEO Scans Scheduled",
                desc: "Real-time query grounding monitoring across ChatGPT, Gemini, and Claude."
              },
              {
                icon: Zap,
                color: "text-cyan-400",
                title: "Branding Auto-Discovery",
                desc: "Deduce your color palettes, fonts, brand voice metrics, and key market rivals."
              }
            ].map((benefit, i) => (
              <div key={i} className="flex gap-4 items-start">
                <benefit.icon className={`h-5.5 w-5.5 shrink-0 ${benefit.color} mt-0.5`} />
                <div className="space-y-0.5">
                  <h4 className="text-[14.5px] font-extrabold text-white leading-tight">{benefit.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11.5px] text-slate-400 font-semibold flex items-center justify-between">
          <span>© 2026 Solo Spider AI Inc.</span>
          <span>Security Guaranteed</span>
        </div>
      </div>

      {/* Right panel: Signup Card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        {/* Glow blobs on mobile viewport */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none lg:hidden" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-pink/5 blur-[80px] rounded-full pointer-events-none lg:hidden" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo fallback for mobile */}
          <div className="flex items-center mb-8 lg:hidden">
            <Link href="/">
              <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[32px] w-auto" />
            </Link>
          </div>

          <div className="space-y-1.5 mb-7">
            <h2 className="font-display text-[28px] font-black tracking-tight text-ink">
              Create Your Account
            </h2>
            <p className="text-[14.5px] font-semibold text-slate-500">
              Claim your workspace and view your website analysis results.
            </p>
          </div>

          <div className="space-y-5">
            {/* Google Signup */}
            <button
              className="w-full flex items-center justify-center gap-2.5 border border-line rounded-xl py-3 text-sm font-semibold hover:bg-bg-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <svg className="h-4.5 w-4.5" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Sign up with Google
            </button>

            {/* Separator */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400 font-bold">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700" htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="w-full border border-line rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:border-primary transition-all text-ink font-semibold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-line rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:border-primary transition-all text-ink font-semibold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="agree" 
                  required 
                  defaultChecked 
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer mt-0.5" 
                />
                <label htmlFor="agree" className="text-[11.5px] text-slate-450 leading-relaxed font-semibold cursor-pointer">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full btn btn-grad justify-center py-3.5 h-auto text-sm cursor-pointer active:scale-[0.98] mt-2"
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />}
                Get Started Free
              </button>
            </form>
          </div>

          <p className="mt-7 text-center text-[13.5px] text-slate-500 font-semibold">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
