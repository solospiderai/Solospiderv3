"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  // Handle Google OAuth callback — runs when redirected back with affiliate_google=true
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isGoogleCallback = params.get("affiliate_google") === "true";

    if (isGoogleCallback) {
      handleGoogleCallback();
    }
  }, []);

  const handleGoogleCallback = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const googleEmail = user.email;

        // Store affiliate session independently in sessionStorage
        window.sessionStorage.setItem("solospider_partner_email", googleEmail);

        // Check if this email is an approved affiliate
        const stored = window.localStorage.getItem("solospider_affiliate_state");
        const stateObj = stored ? JSON.parse(stored) : { applications: [], affiliates: [], referrals: [], payouts: [], firstTimeRate: 30, recurringRate: 15 };
        const affiliatesList = stateObj.affiliates || [];

        const found = affiliatesList.find(
          (a: any) => a.email.toLowerCase() === googleEmail.toLowerCase()
        );

        if (found) {
          if (found.status === "suspended") {
            toast.error("This affiliate account is suspended. Please contact support.");
            return;
          }
          toast.success(`Welcome back, ${found.name}!`);
          router.push("/affiliate/dashboard");
        } else {
          // Auto-register as new affiliate from Google Sign-In
          const refId = googleEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 15).toLowerCase();
          const newAffiliate = {
            id: "aff-google-" + Date.now(),
            name: user.user_metadata?.full_name || googleEmail.split("@")[0],
            email: googleEmail,
            refId: refId,
            clicks: 0,
            signups: 0,
            activeCustomers: 0,
            pendingCommission: 0.00,
            paidCommission: 0.00,
            totalEarnings: 0.00,
            balance: 0.00,
            status: "active" as const,
          };

          stateObj.affiliates.push(newAffiliate);
          window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(stateObj));

          toast.success(`Welcome, ${newAffiliate.name}! Your partner account has been created.`);
          router.push("/affiliate/dashboard");
        }
      } else {
        toast.error("Google sign-in failed. Could not retrieve user information.");
      }
    } catch (err) {
      console.error("Google callback error:", err);
      toast.error("An error occurred during Google sign-in.");
    }
  };

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Strict admin check
      if (email === "info@solospider.ai" && password === "123456") {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("solospider_admin_authenticated", "true");
        }
        toast.success("Welcome back, Administrator!");
        router.push("/affiliate/admin");
        return;
      }

      // 2. Regular affiliate check — validate against local affiliate state only (no Supabase auth)
      const stored = window.localStorage.getItem("solospider_affiliate_state");
      const stateObj = stored ? JSON.parse(stored) : null;
      const affiliatesList = stateObj?.affiliates || [];
      const applicationsList = stateObj?.applications || [];
      
      // Find if this email is a registered affiliate
      const found = affiliatesList.find((a: any) => a.email.toLowerCase() === email.toLowerCase());
      
      if (found) {
        if (found.status === "suspended") {
          toast.error("This affiliate account is suspended. Please contact support.");
          setIsSubmitting(false);
          return;
        }

        // Verify password if set in record
        if (found.password && found.password !== password) {
          toast.error("Incorrect password. Please try again.");
          setIsSubmitting(false);
          return;
        }

        // Store logged in partner in sessionStorage (independent of Supabase auth)
        window.sessionStorage.setItem("solospider_partner_email", found.email);
        toast.success(`Welcome back, ${found.name}!`);
        router.push("/affiliate/dashboard");
      } else {
        // Check if there is a pending application under this email
        const pendingFound = applicationsList.find((app: any) => app.email.toLowerCase() === email.toLowerCase());
        if (pendingFound) {
          toast.warning("Your partner application is pending admin review. You can sign in once the administrator approves it.");
        } else {
          toast.error("Account not found. Please apply to the program first.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during sign-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/affiliate/login?affiliate_google=true")}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google sign-in.");
      setIsGoogleLoading(false);
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
      {/* Custom Clean Navbar */}
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
            <Link href="/" className="text-sm font-bold text-[var(--ink-2)] hover:text-primary transition-colors">
              Back to Main Site
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-20 px-7">
        <div className="max-w-[460px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-10 shadow-xl text-left relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-2 block">Affiliate portal</span>
            <h2 className="text-3xl font-black mb-2">Partner Sign In</h2>
            <p className="text-xs text-[var(--muted)] mb-8 font-semibold">
              Enter your credentials to access your referrals ledger and payout manager.
            </p>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-[var(--bg-2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] font-bold text-sm py-3 rounded-xl transition-all cursor-pointer mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.43 1.68 14.9.75 12 .75c-4.63 0-8.58 2.66-10.45 6.55l3.66 2.84C6.07 7.21 8.8 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.46h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.49z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.21 14.81c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.55 7.41C.56 9.38 0 11.62 0 13.97s.56 4.59 1.55 6.56l3.66-2.84c-.24-.72-.38-1.49-.38-2.28z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.25c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.2 0-5.93-2.17-6.89-5.1l-3.66 2.84c1.87 3.89 5.82 6.55 10.45 6.55z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-[var(--line)]"></div>
              <span className="text-[10px] font-mono text-[var(--muted)] font-bold uppercase tracking-widest">or email credentials</span>
              <div className="h-px flex-1 bg-[var(--line)]"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-grad py-3.5 text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{isSubmitting ? "Signing in..." : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 text-center text-xs font-semibold text-[var(--muted)] border-t border-[var(--line)] pt-5">
              Don't have a partner account?{" "}
              <Link href="/affiliate/apply" className="text-primary hover:underline">
                Apply to the program
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
