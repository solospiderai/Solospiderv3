"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PLANS, type PlanKey } from "@/lib/plans/plan-config";
import {
  Loader2,
  User,
  CreditCard,
  Settings2,
  Save,
  ShieldCheck,
  Zap,
  History,
  Check,
  HelpCircle,
  Key,
  Crown,
  ArrowUpRight,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  content_id: string | null;
}

interface PaymentRecord {
  id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  created_at: string;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BillingPortal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credits, setCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ plan: "free", status: "active", current_period_start: null, current_period_end: null, cancelled_at: null });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [upgrading, setUpgrading] = useState<PlanKey | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Preferences
  const [defaultTone, setDefaultTone] = useState("Professional");
  const [defaultCountry, setDefaultCountry] = useState("United States");
  const [defaultWordCount, setDefaultWordCount] = useState("1200");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDefaultTone(localStorage.getItem("bf_default_tone") || "Professional");
      setDefaultCountry(localStorage.getItem("bf_default_country") || "United States");
      setDefaultWordCount(localStorage.getItem("bf_default_word_count") || "1200");
    }
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("razorpay-checkout-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/status");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Failed to fetch subscription status:", err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const supabase = getSupabaseBrowserClient();

      try {
        // Fetch credits
        const { data: creditData } = await supabase
          .from("workspace_credits")
          .select("total_credits, used_credits, locked_credits")
          .eq("user_id", user.id)
          .maybeSingle();

        if (creditData) {
          const total = creditData.total_credits || 0;
          const used = creditData.used_credits || 0;
          const locked = creditData.locked_credits || 0;
          setCredits({ total, used, remaining: Math.max(0, total - used - locked) });
        } else {
          const { error: insertError } = await supabase
            .from("workspace_credits")
            .insert({ user_id: user.id, total_credits: 50, used_credits: 0, locked_credits: 0 });
          if (!insertError) {
            setCredits({ total: 50, used: 0, remaining: 50 });
          } else {
            setCredits({ total: 50, used: 0, remaining: 50 });
          }
        }

        // Fetch transactions
        const { data: txData } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setTransactions((txData as CreditTransaction[]) || []);

        // Fetch subscription status
        await fetchSubscriptionStatus();
      } catch (err) {
        console.error("Error fetching settings/billing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, fetchSubscriptionStatus]);

  // ── Upgrade handler ──
  const handleUpgrade = async (planKey: PlanKey) => {
    if (!user) {
      toast.error("Please log in to upgrade your plan.");
      return;
    }

    setUpgrading(planKey);

    try {
      // 1. Create subscription on backend
      const res = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create subscription");
        setUpgrading(null);
        return;
      }

      // 2. Open Razorpay checkout
      if (!window.Razorpay) {
        toast.error("Payment system is loading. Please try again in a moment.");
        setUpgrading(null);
        return;
      }

      const options = {
        key: data.razorpay_key,
        subscription_id: data.subscription_id,
        name: "Solo Spider",
        description: `${data.plan_name} Plan - $${data.amount}/month`,
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                plan: planKey,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success(`🎉 Successfully upgraded to ${data.plan_name}!`);
              await fetchSubscriptionStatus();
              // Reload credits
              const supabase = getSupabaseBrowserClient();
              const { data: newCredits } = await supabase
                .from("workspace_credits")
                .select("total_credits, used_credits, locked_credits")
                .eq("user_id", user.id)
                .maybeSingle();
              if (newCredits) {
                setCredits({
                  total: newCredits.total_credits,
                  used: newCredits.used_credits,
                  remaining: Math.max(0, newCredits.total_credits - newCredits.used_credits - newCredits.locked_credits),
                });
              }
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user.email || "",
        },
        theme: {
          color: "#9025F2",
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Upgrade error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  // Auto-trigger upgrade from query parameter
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan") as PlanKey | null;
      if (planParam && (planParam === "growth" || planParam === "scale")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("plan");
        window.history.replaceState({}, document.title, url.toString());
        setTimeout(() => {
          handleUpgrade(planParam);
        }, 1000);
      }
    }
  }, [user]);

  // ── Cancel handler ──
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/payments/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Subscription cancelled.");
        await fetchSubscriptionStatus();
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleSavePreferences = () => {
    setSaving(true);
    localStorage.setItem("bf_default_tone", defaultTone);
    localStorage.setItem("bf_default_country", defaultCountry);
    localStorage.setItem("bf_default_word_count", defaultWordCount);
    setTimeout(() => {
      setSaving(false);
      toast.success("Preferences saved successfully");
    }, 400);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsChangingPassword(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);
    if (error) { toast.error(error.message || "Failed to change password"); }
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); setShowPasswordForm(false); }
  };

  const txTypeConfig: Record<string, { label: string; color: string }> = {
    usage: { label: "Usage", color: "bg-blue-500/10 text-blue-600 border border-blue-500/20" },
    refund: { label: "Refund", color: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" },
    manual_adjustment: { label: "Adjustment", color: "bg-amber-500/10 text-amber-600 border border-amber-500/20" },
    reset: { label: "Reset", color: "bg-purple-500/10 text-purple-600 border border-purple-500/20" },
  };
  const txStatusConfig: Record<string, string> = {
    locked: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    refunded: "bg-slate-100 text-slate-500 border border-slate-200",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading billing data...</p>
      </div>
    );
  }

  const isEmailProvider = user?.app_metadata?.provider === "email";
  const currentPlanKey = (subscription?.plan || "free") as PlanKey;
  const currentPlan = PLANS[currentPlanKey] || PLANS.free;
  const isActive = subscription?.status === "active";
  const isCancelled = subscription?.status === "cancelled";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="bg-indigo-500/10 text-indigo-600 p-3 rounded-2xl border border-indigo-500/10">
            <Settings2 className="h-6 w-6" />
          </span>
          Preferences &amp; Billing
        </h1>
        <p className="text-slate-500 text-sm font-semibold mt-2 ml-16">
          Manage your subscription, credits, and workspace preferences.
        </p>
      </div>

      {/* ━━━ SUBSCRIPTION PLAN CARD ━━━ */}
      <div className="bg-gradient-to-br from-[#9025F2] via-[#7c3aed] to-[#6d28d9] text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-white/15 px-4 py-1.5 rounded-full text-purple-100 border border-white/10">
                Current Plan
              </span>
              {isCancelled && (
                <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-red-500/20 px-3 py-1 rounded-full text-red-200 border border-red-400/20">
                  Cancelling
                </span>
              )}
            </div>

            <h2 className="text-4xl font-black tracking-tight">
              {currentPlan.name}
              {currentPlan.price !== null && currentPlan.price > 0 && (
                <span className="text-lg text-purple-200 font-bold ml-2">
                  ${currentPlan.price}/mo
                </span>
              )}
              {currentPlan.price === 0 && (
                <span className="text-lg text-purple-200 font-bold ml-2">Free</span>
              )}
            </h2>

            {subscription?.current_period_end && (
              <p className="text-sm text-purple-200">
                {isCancelled ? "Access until" : "Next billing"}: {" "}
                <strong className="text-white">
                  {new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </strong>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {currentPlanKey === "free" && (
              <>
                <button
                  onClick={() => handleUpgrade("growth")}
                  disabled={!!upgrading}
                  className="bg-white text-[#9025F2] font-black py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-purple-50 transition-all disabled:opacity-50 text-sm shadow-lg"
                >
                  {upgrading === "growth" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                  Upgrade to Growth — $199/mo
                </button>
                <button
                  onClick={() => handleUpgrade("scale")}
                  disabled={!!upgrading}
                  className="bg-white/10 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50 text-sm border border-white/10"
                >
                  {upgrading === "scale" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                  Upgrade to Scale — $699/mo
                </button>
              </>
            )}
            {currentPlanKey === "growth" && (
              <button
                onClick={() => handleUpgrade("scale")}
                disabled={!!upgrading}
                className="bg-white text-[#9025F2] font-black py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-purple-50 transition-all disabled:opacity-50 text-sm shadow-lg"
              >
                {upgrading === "scale" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                Upgrade to Scale — $699/mo
              </button>
            )}
            {currentPlanKey !== "free" && isActive && !isCancelled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-purple-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors mt-1"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="font-black text-red-900 text-lg">Cancel Subscription?</h3>
          </div>
          <p className="text-sm text-red-700">
            Your plan will remain active until the end of your current billing period. After that, you'll be downgraded to the free Starter plan with 50 credits.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-xl flex items-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Yes, Cancel
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-xl transition-all text-sm"
            >
              Keep My Plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side */}
        <div className="lg:col-span-2 space-y-8">

          {/* Default Preferences */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 space-y-6">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-3">
              <span className="bg-purple-500/10 text-purple-600 p-2 rounded-xl"><Settings2 className="h-5 w-5" /></span>
              Default Generation Settings
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              These configurations pre-fill all 1-Click and Bulk generator runs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tone of Voice</label>
                <select value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold text-sm">
                  <option value="Professional">Professional</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Formal">Formal</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Authoritative">Authoritative</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Target Country</label>
                <select value={defaultCountry} onChange={(e) => setDefaultCountry(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold text-sm">
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="Australia">Australia</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Target Length</label>
                <input type="number" min={500} max={3000} step={100} value={defaultWordCount} onChange={(e) => setDefaultWordCount(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold text-sm" />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={handleSavePreferences} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 text-sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Default Presets"}
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 space-y-6">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-3">
              <span className="bg-indigo-500/10 text-indigo-600 p-2 rounded-xl"><User className="h-5 w-5" /></span>
              User Account Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Email Address</label>
                <p className="font-black text-slate-900 text-sm">{user?.email || "—"}</p>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Account ID</label>
                <p className="font-mono text-xs text-slate-600 truncate max-w-[200px]" title={user?.id}>{user?.id || "—"}</p>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Created At</label>
                <p className="font-black text-slate-900 text-sm">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}
                </p>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Auth Credentials</label>
                <p className="font-black text-slate-900 text-sm capitalize">{user?.app_metadata?.provider || "email"}</p>
              </div>
            </div>
          </div>

          {/* Security */}
          {isEmailProvider && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 space-y-6">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-3">
                <span className="bg-pink-500/10 text-pink-600 p-2 rounded-xl"><ShieldCheck className="h-5 w-5" /></span>
                Account Security &amp; Credentials
              </h3>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Regularly refresh your credential passkeys to ensure robust security.
              </p>
              {!showPasswordForm ? (
                <button onClick={() => setShowPasswordForm(true)} className="bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all text-sm">
                  <Key className="h-4 w-4 text-slate-500" /> Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-700">New Password</label>
                      <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm font-semibold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-700">Confirm Password</label>
                      <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm font-semibold" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isChangingPassword || !newPassword || !confirmPassword} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all text-xs">
                      {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Update Password
                    </button>
                    <button type="button" onClick={() => { setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all text-xs">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 space-y-6">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-3">
                <span className="bg-emerald-500/10 text-emerald-600 p-2 rounded-xl"><CreditCard className="h-5 w-5" /></span>
                Payment History
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${p.status === "captured" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : p.status === "failed" ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {p.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          {PLANS[p.plan as PlanKey]?.name || p.plan}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(p.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400">{p.razorpay_payment_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-lg">
                        ${(p.amount / 100).toFixed(2)}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{p.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="space-y-8">

          {/* Credit overview card */}
          {credits && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-white/10 px-4 py-1.5 rounded-full text-indigo-200 border border-white/10">
                  Credit Bank Account
                </span>
                <Zap className="h-5 w-5 text-amber-400 fill-amber-400 shrink-0" />
              </div>
              <div>
                <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Available Balance</h4>
                <p className="text-5xl font-black text-white mt-1 tracking-tight">{credits.remaining} <span className="text-lg text-indigo-300 font-black">CR</span></p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-200">
                  <span>{credits.used} Used</span>
                  <span>{credits.total} Total</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (credits.used / credits.total) * 100))}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isActive && !isCancelled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {isActive && !isCancelled ? "Subscription Active" : isCancelled ? "Cancelling" : "Free Plan"}
                </span>
              </div>
            </div>
          )}

          {/* Transaction Ledger */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 space-y-6">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-3">
              <span className="bg-amber-500/10 text-amber-600 p-2 rounded-xl"><History className="h-5 w-5" /></span>
              Credit Usage
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No Activity Yet</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Generate content to populate logs</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {transactions.map((tx) => {
                  const typeConf = txTypeConfig[tx.type] || txTypeConfig.usage;
                  const statusClass = txStatusConfig[tx.status] || "";
                  return (
                    <div key={tx.id} className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-xs transition-all">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${typeConf.color}`}>{typeConf.label}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${statusClass}`}>{tx.status}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(tx.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">{tx.type === "refund" ? "+" : "-"}{Math.abs(tx.amount)}</span>
                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Credits</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
