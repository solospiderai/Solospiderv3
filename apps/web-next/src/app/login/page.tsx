"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Shield, LayoutDashboard } from "lucide-react";
import { AuthVisualPanel } from "@/components/auth-visual-panel";

export default function LoginPage() {
  const router = useRouter();
  const redirectedFrom = "/app/en/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error, data: authData } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      
      if (email === "info@solospider.ai") {
        setAdminUser(authData.user);
      } else {
        const { data: adminCheck } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", authData.user?.id)
          .maybeSingle();

        if (adminCheck) {
          setAdminUser(authData.user);
        } else {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("solospider_role_view", "user");
          }
          router.replace(redirectedFrom);
          router.refresh();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      toast.error(error.message || "Failed to login with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={
      {
        "--bg": "#ffffff",
        "--bg-2": "#f8f6ff",
        "--panel": "#ffffff",
        "--line": "#e5e7eb",
        "--ink": "#000000",
        "--ink-2": "#0f172a",
        "--muted": "#334155",
      } as React.CSSProperties
    }>
      {/* Left panel */}
      <AuthVisualPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-sm">
          <div className="flex items-center mb-6 lg:hidden">
            <Link href="/" className="cursor-pointer">
              <img src="/assets/solospider-logo.png" alt="Solo Spider" className="h-[34px] w-auto" />
            </Link>
          </div>
          <h2 className="font-display text-[26px] font-bold tracking-tight text-ink mb-1">
            Welcome back
          </h2>
          <p className="text-[15px] text-ink-2 mb-8">
            Sign in to your account
          </p>

          <div className="space-y-4">
            <button
              className="w-full flex items-center justify-center gap-2 border border-line rounded-xl py-3 text-sm font-semibold hover:bg-bg-2 transition-colors disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Sign in with Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-semibold tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@agency.com"
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:border-primary transition-colors text-ink"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-line rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:border-primary transition-colors text-ink"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button 
                type="submit" 
                className="w-full btn btn-grad justify-center py-3"
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Admin View Selection Overlay */}
      {adminUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0822]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-6 text-slate-900 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black tracking-tight text-slate-900 leading-none">Administrator Access</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                Welcome back! Select which view you would like to open for this session.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("solospider_role_view", "admin");
                  }
                  router.replace("/app/en/admin");
                  router.refresh();
                }}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-violet-100 hover:border-violet-200 bg-violet-50/50 hover:bg-violet-50 text-violet-750 font-black text-xs rounded-2xl transition-all cursor-pointer"
              >
                <Shield className="w-6 h-6 text-violet-600" />
                Go to Admin Panel
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("solospider_role_view", "user");
                  }
                  router.replace("/app/en/dashboard");
                  router.refresh();
                }}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800 font-black text-xs rounded-2xl transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-6 h-6 text-slate-700" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
