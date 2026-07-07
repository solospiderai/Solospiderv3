"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { 
  Users, CheckCircle2, DollarSign, BarChart3, Settings, 
  Percent, Link2, Copy, Eye, Award, LogOut, ShieldAlert,
  ArrowRight, Download, Mail, Building2, User, Key, Check 
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  clicks: number;
  signups: number;
  activeCustomers: number;
  pendingCommission: number;
  paidCommission: number;
  totalEarnings: number;
  balance: number;
  status: "active" | "suspended";
}

interface Referral {
  id: string;
  affiliateId: string;
  customerName: string;
  plan: string;
  signupDate: string;
  purchaseDate: string;
  status: string;
  commission: number;
}

interface PayoutRequest {
  id: string;
  affiliateId: string;
  email: string;
  amount: number;
  date: string;
  method: string;
  status: "pending" | "paid" | "rejected";
  reference?: string;
}

export default function AffiliateDashboardPage() {
  const [isDark, setIsDark] = useState(false);

  // Auth simulation
  const [currentAffiliate, setCurrentAffiliate] = useState<Affiliate | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [availableAffiliates, setAvailableAffiliates] = useState<Affiliate[]>([]);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "referrals" | "payouts" | "resources" | "settings">("overview");

  // State objects
  const [stateReferrals, setStateReferrals] = useState<Referral[]>([]);
  const [statePayouts, setStatePayouts] = useState<PayoutRequest[]>([]);
  
  // Forms
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");
  
  // Settings
  const [profileName, setProfileName] = useState("");
  const [profileCountry, setProfileCountry] = useState("United States");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");

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



  // Sync data from localStorage
  const loadState = async () => {
    let usingSupabase = false;
    let supabaseAffiliates: Affiliate[] = [];
    let supabasePayouts: PayoutRequest[] = [];
    let supabaseRefs: Referral[] = [];

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch affiliates
      const { data: affData, error: affErr } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affErr) throw affErr;

      supabaseAffiliates = (affData || []).map((aff: any) => ({
        id: aff.id,
        name: aff.name,
        email: aff.email,
        refId: aff.ref_id,
        clicks: aff.clicks,
        signups: aff.signups,
        activeCustomers: aff.active_customers,
        pendingCommission: Number(aff.pending_commission),
        paidCommission: Number(aff.paid_commission),
        totalEarnings: Number(aff.total_earnings),
        balance: Number(aff.balance),
        status: aff.status as "active" | "suspended"
      }));

      // Fetch referrals
      const { data: refData, error: refErr } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (refErr) throw refErr;

      supabaseRefs = (refData || []).map((ref: any) => ({
        id: ref.id,
        affiliateId: ref.affiliate_id,
        customerName: ref.customer_name,
        plan: ref.plan,
        signupDate: ref.signup_date,
        purchaseDate: ref.purchase_date || "",
        status: ref.status,
        commission: Number(ref.commission)
      }));

      // Fetch payouts
      const { data: payData, error: payErr } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (payErr) throw payErr;

      supabasePayouts = (payData || []).map((pay: any) => {
        const associatedAff = supabaseAffiliates.find((a) => a.id === pay.affiliate_id);
        return {
          id: pay.id,
          affiliateId: pay.affiliate_id,
          email: associatedAff ? associatedAff.email : "unknown@affiliate.com",
          amount: Number(pay.amount),
          date: pay.date,
          method: pay.method,
          status: pay.status as "pending" | "paid" | "rejected",
          reference: pay.reference || undefined
        };
      });

      usingSupabase = true;
      setAvailableAffiliates(supabaseAffiliates);
      setStatePayouts(supabasePayouts);
      setStateReferrals(supabaseRefs);

      if (currentAffiliate) {
        const fresh = supabaseAffiliates.find((a) => a.id === currentAffiliate.id);
        if (fresh) setCurrentAffiliate(fresh);
      }
    } catch (err) {
      console.warn("Supabase fetch failed in dashboard, fallback to localStorage:", err);
    }

    if (!usingSupabase && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("solospider_affiliate_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAvailableAffiliates(parsed.affiliates || []);
        setStatePayouts(parsed.payouts || []);
        
        // Load default referrals if none exist
        if (!parsed.referrals || parsed.referrals.length === 0) {
          const defaultRefs: Referral[] = [
            {
              id: "ref-1",
              affiliateId: "aff-1",
              customerName: "Jane Corp",
              plan: "Pro Plan - Monthly ($199)",
              signupDate: "2026-06-10",
              purchaseDate: "2026-06-10",
              status: "active",
              commission: 49.75
            },
            {
              id: "ref-2",
              affiliateId: "aff-1",
              customerName: "David Lee",
              plan: "Growth Plan - Monthly ($99)",
              signupDate: "2026-06-25",
              purchaseDate: "2026-06-25",
              status: "active",
              commission: 24.75
            },
            {
              id: "ref-3",
              affiliateId: "aff-1",
              customerName: "Apex Agency",
              plan: "Pro Plan - Monthly ($199)",
              signupDate: "2026-07-02",
              purchaseDate: "2026-07-02",
              status: "active",
              commission: 49.75
            }
          ];
          setStateReferrals(defaultRefs);
          parsed.referrals = defaultRefs;
          window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(parsed));
        } else {
          setStateReferrals(parsed.referrals);
        }

        // If already logged in, update current affiliate instance
        if (currentAffiliate) {
          const fresh = (parsed.affiliates as Affiliate[]).find((a) => a.id === currentAffiliate.id);
          if (fresh) setCurrentAffiliate(fresh);
        }
      }
    }
  };

  useEffect(() => {
    loadState();
    // Listen for changes (e.g. from admin panel action)
    window.addEventListener("storage", loadState);
    return () => window.removeEventListener("storage", loadState);
  }, [currentAffiliate?.id]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const aff = availableAffiliates.find((a) => a.email.toLowerCase() === loginEmail.toLowerCase());
    if (aff) {
      if (aff.status === "suspended") {
        toast.error("This affiliate account is suspended. Please contact support.");
        return;
      }
      setCurrentAffiliate(aff);
      setProfileName(aff.name);
      toast.success(`Logged in as ${aff.name}`);
    } else {
      toast.error("Email not found. Verify application status in Admin panel first.");
    }
  };

  const handleQuickLogin = (aff: Affiliate) => {
    if (aff.status === "suspended") {
      toast.error("This affiliate account is suspended. Please contact support.");
      return;
    }
    setCurrentAffiliate(aff);
    setProfileName(aff.name);
    toast.success(`Logged in as ${aff.name}`);
  };

  const handleLogout = () => {
    setCurrentAffiliate(null);
    toast.info("Logged out from affiliate dashboard.");
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Referral link copied to clipboard!");
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;

    const amount = Number(payoutAmount);
    if (isNaN(amount) || amount < 50) {
      toast.error("Minimum payout request is $50.");
      return;
    }

    if (amount > currentAffiliate.balance) {
      toast.error("Requested amount exceeds your current available balance.");
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Insert payout request
      const { error: payErr } = await supabase
        .from("affiliate_payouts")
        .insert({
          affiliate_id: currentAffiliate.id,
          amount,
          method: payoutMethod,
          status: "pending"
        });

      if (payErr) throw payErr;

      // 2. Fetch current balance
      const { data: affData, error: fetchErr } = await supabase
        .from("affiliates")
        .select("balance, pending_commission")
        .eq("id", currentAffiliate.id)
        .single();

      if (fetchErr) throw fetchErr;

      // 3. Deduct balance, add pending commission in affiliates table
      const nextBalance = Math.max(0, Number(affData.balance) - amount);
      const nextPending = Number(affData.pending_commission) + amount;

      const { error: affErr } = await supabase
        .from("affiliates")
        .update({ balance: nextBalance, pending_commission: nextPending })
        .eq("id", currentAffiliate.id);

      if (affErr) throw affErr;

      toast.success("Payout request submitted to database! Awaiting admin approval.");
      setPayoutAmount("");
      loadState();
    } catch (dbError) {
      console.warn("Supabase payout request failed, fallback to localStorage:", dbError);
      
      const newRequest: PayoutRequest = {
        id: "pay-" + Date.now(),
        affiliateId: currentAffiliate.id,
        email: currentAffiliate.email,
        amount,
        date: new Date().toISOString().split("T")[0],
        method: payoutMethod,
        status: "pending"
      };

      const stored = window.localStorage.getItem("solospider_affiliate_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.payouts = [newRequest, ...(parsed.payouts || [])];
        
        parsed.affiliates = (parsed.affiliates as Affiliate[]).map((a) => {
          if (a.id === currentAffiliate.id) {
            return { ...a, balance: a.balance - amount, pendingCommission: a.pendingCommission + amount };
          }
          return a;
        });

        window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(parsed));
        toast.success("Payout request submitted! Awaiting admin approval.");
        setPayoutAmount("");
        loadState();
      }
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAffiliate) return;

    const stored = window.localStorage.getItem("solospider_affiliate_state");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.affiliates = (parsed.affiliates as Affiliate[]).map((a) => {
        if (a.id === currentAffiliate.id) {
          return { ...a, name: profileName };
        }
        return a;
      });
      window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(parsed));
      toast.success("Profile settings updated!");
      loadState();
    }
  };

  const activeRefs = stateReferrals.filter((r) => r.affiliateId === currentAffiliate?.id);
  const activePayouts = statePayouts.filter((p) => p.affiliateId === currentAffiliate?.id);

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
        <div className="max-w-[1240px] mx-auto px-7 h-16 flex items-center justify-between">
          <Link href="/affiliate" className="flex items-center gap-2.5">
            <span className="font-display font-black text-lg tracking-tight">
              SoloSpider <span className="grad-text text-xs font-bold uppercase ml-1 px-2 py-0.5 rounded-md bg-primary/10 tracking-widest border border-primary/20">Partners</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-2)] text-[var(--ink)] cursor-pointer text-xs font-bold"
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <Link href="/" className="text-xs font-bold text-[var(--ink-2)] hover:text-primary transition-colors">
              Back to Main Site
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-[1240px] mx-auto px-7">
          
          {!currentAffiliate ? (
            /* Login Simulation Screen */
            <div className="max-w-[480px] w-full mx-auto bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-10 shadow-xl text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary mb-2 block">Affiliate portal</span>
              <h2 className="text-3xl font-black mb-6">Partner Login</h2>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Registered Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                    placeholder="name@company.com"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full btn btn-grad py-3.5 text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Access Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Select Panel */}
              <div className="mt-8 pt-8 border-t border-[var(--line)] space-y-4">
                <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  Quick Login (Approved Accounts)
                </h4>
                <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed">
                  Select one of the pre-loaded seed partner profiles to explore:
                </p>
                <div className="space-y-2">
                  {availableAffiliates.map((aff) => (
                    <button
                      key={aff.id}
                      onClick={() => handleQuickLogin(aff)}
                      className="w-full bg-[var(--bg-2)] hover:bg-primary-soft/10 border border-[var(--line)] rounded-xl p-3.5 flex items-center justify-between text-left cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-[var(--ink)]">{aff.name}</div>
                        <div className="text-[10px] text-[var(--muted)] font-semibold">{aff.email}</div>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-bold">ref: {aff.refId}</span>
                    </button>
                  ))}
                  {availableAffiliates.length === 0 && (
                    <div className="text-xs text-[var(--muted)] font-semibold">No approved accounts. Please submit an application or use the Admin panel to approve.</div>
                  )}
                </div>
                
                <p className="text-[11px] text-[var(--muted)] pt-2 font-semibold">
                  New to the program? <Link href="/affiliate/apply" className="text-primary hover:underline font-bold">Apply now to partner</Link>
                </p>
              </div>
            </div>
          ) : (
            /* Active Dashboard Interface */
            <div>
              {/* Profile Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)] mb-10 text-left">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                      ● Active Partner
                    </span>
                  </div>
                  <h1 className="text-3xl font-black">Welcome back, {currentAffiliate.name}</h1>
                  <p className="text-xs text-[var(--muted)] font-semibold mt-1">
                    Partner ID: <span className="font-mono text-primary font-bold">{currentAffiliate.refId}</span> • Email: {currentAffiliate.email}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleLogout}
                    className="btn btn-ghost border-red-500/30 text-red-500 hover:bg-red-500/10 px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-[var(--line)] mb-8 gap-4 overflow-x-auto pb-px">
                {[
                  { id: "overview", label: "Overview", icon: BarChart3 },
                  { id: "links", label: "Referral Links", icon: Link2 },
                  { id: "referrals", label: `My Referrals (${activeRefs.length})`, icon: Users },
                  { id: "payouts", label: "Payouts & Wallet", icon: DollarSign },
                  { id: "resources", label: "Marketing Kit", icon: Award },
                  { id: "settings", label: "Settings", icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-3.5 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Display */}
              <div className="text-left">
                {activeTab === "overview" && (
                  <div className="space-y-10">
                    {/* Primary stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      {[
                        { label: "Total clicks", val: currentAffiliate.clicks },
                        { label: "Total signups", val: currentAffiliate.signups },
                        { label: "Active referrals", val: currentAffiliate.activeCustomers },
                        { label: "Conversion rate", val: `${((currentAffiliate.signups / (currentAffiliate.clicks || 1)) * 100).toFixed(1)}%` }
                      ].map((item, i) => (
                        <div key={i} className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-2xl">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">{item.label}</h5>
                          <span className="text-2xl font-black text-[var(--ink)]">{item.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Financial summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {[
                        { label: "Total Earnings", val: `$${currentAffiliate.totalEarnings.toFixed(2)}`, desc: "Lifetime accrued commission", highlight: false },
                        { label: "Approved balance", val: `$${currentAffiliate.balance.toFixed(2)}`, desc: "Available for instant payout", highlight: true },
                        { label: "Pending payout", val: `$${currentAffiliate.pendingCommission.toFixed(2)}`, desc: "In audit / requested status", highlight: false }
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          className={`border rounded-2xl p-6 flex flex-col justify-between ${
                            item.highlight 
                              ? 'bg-primary/5 border-primary/30 text-[var(--ink)]' 
                              : 'bg-[var(--panel)] border-[var(--line)]'
                          }`}
                        >
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">{item.label}</h5>
                            <span className="text-3xl font-black">{item.val}</span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] mt-4 font-semibold">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Performance Visual Chart (Real 30-Day referrals count) */}
                    {(() => {
                      const now = new Date();
                      const weeks = [
                        { label: "Days 22-30", count: 0 },
                        { label: "Days 15-21", count: 0 },
                        { label: "Days 8-14", count: 0 },
                        { label: "Days 1-7 (Recent)", count: 0 }
                      ];

                      activeRefs.forEach((ref) => {
                        const signupDate = new Date(ref.signupDate);
                        const diffTime = Math.abs(now.getTime() - signupDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 7) {
                          weeks[3].count += 1;
                        } else if (diffDays <= 14) {
                          weeks[2].count += 1;
                        } else if (diffDays <= 21) {
                          weeks[1].count += 1;
                        } else if (diffDays <= 30) {
                          weeks[0].count += 1;
                        }
                      });

                      const maxVal = Math.max(...weeks.map((w) => w.count), 1);

                      return (
                        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 md:p-8">
                          <h3 className="font-display text-lg font-black mb-6 text-left">Referrals Performance (Last 30 Days)</h3>
                          <div className="h-[220px] w-full flex items-end justify-around gap-2 border-b border-[var(--line)] pb-2 relative z-10">
                            {weeks.map((w, idx) => {
                              const barHeight = (w.count / maxVal) * 100;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end max-w-[120px]">
                                  <div className="w-full max-w-[40px] flex items-end justify-center h-full relative">
                                    {w.count > 0 && (
                                      <div className="absolute -top-6 text-[10px] font-mono font-bold text-primary">
                                        {w.count} refs
                                      </div>
                                    )}
                                    <div 
                                      className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:opacity-85" 
                                      style={{ height: `${Math.max(5, barHeight)}%` }}
                                      title={`Referrals: ${w.count}`}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--muted)]">{w.label}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex gap-6 mt-4 justify-start text-[11px] font-bold">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-sm"></span> Real Referrals</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "links" && (
                  <div className="space-y-6">
                    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 md:p-8 space-y-6">
                      <h3 className="font-display text-xl font-extrabold">Your Referral Links</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Default Landing Page Link</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={`https://solospider.ai/?ref=${currentAffiliate.refId}`}
                              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--ink)] focus:outline-none"
                            />
                            <button
                              onClick={() => handleCopyLink(`https://solospider.ai/?ref=${currentAffiliate.refId}`)}
                              className="btn btn-ghost border-[var(--line)] hover:bg-[var(--bg-2)] px-4 flex items-center justify-center cursor-pointer rounded-xl shrink-0"
                            >
                              <Copy className="w-4 h-4 text-primary" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Sign-Up Page Link</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={`https://solospider.ai/signup?ref=${currentAffiliate.refId}`}
                              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--ink)] focus:outline-none"
                            />
                            <button
                              onClick={() => handleCopyLink(`https://solospider.ai/signup?ref=${currentAffiliate.refId}`)}
                              className="btn btn-ghost border-[var(--line)] hover:bg-[var(--bg-2)] px-4 flex items-center justify-center cursor-pointer rounded-xl shrink-0"
                            >
                              <Copy className="w-4 h-4 text-primary" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* QR Code section */}
                      <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center gap-6">
                        {/* Custom SVG QR Code mockup */}
                        <div className="w-32 h-32 bg-white p-3 rounded-2xl border border-slate-200 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                            {/* Outer frame */}
                            <path d="M5,5 h20 v20 h-20 z M5,10 h15 v10 h-15 z" fill="currentColor" />
                            <path d="M75,5 h20 v20 h-20 z M80,10 h15 v10 h-15 z" fill="currentColor" />
                            <path d="M5,75 h20 v20 h-20 z M5,80 h15 v10 h-15 z" fill="currentColor" />
                            {/* Inner pixels */}
                            <rect x="35" y="10" width="5" height="15" fill="currentColor" />
                            <rect x="45" y="5" width="10" height="5" fill="currentColor" />
                            <rect x="60" y="15" width="5" height="15" fill="currentColor" />
                            <rect x="15" y="35" width="15" height="5" fill="currentColor" />
                            <rect x="35" y="35" width="30" height="5" fill="currentColor" />
                            <rect x="75" y="35" width="5" height="20" fill="currentColor" />
                            <rect x="10" y="50" width="5" height="15" fill="currentColor" />
                            <rect x="25" y="45" width="5" height="15" fill="currentColor" />
                            <rect x="40" y="55" width="20" height="5" fill="currentColor" />
                            <rect x="65" y="50" width="5" height="25" fill="currentColor" />
                            <rect x="45" y="70" width="15" height="15" fill="currentColor" />
                            <rect x="80" y="70" width="15" height="15" fill="currentColor" />
                            <rect x="15" y="85" width="15" height="5" fill="currentColor" />
                          </svg>
                        </div>
                        
                        <div className="text-center sm:text-left space-y-2">
                          <h4 className="font-bold text-[15px]">Custom QR Code</h4>
                          <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed">
                            Share this QR code during webinars, live events, or embed it on print promotions to capture offline referrals instantly.
                          </p>
                          <button
                            onClick={() => toast.success("QR Code download started (Simulated)")}
                            className="btn btn-ghost border-[var(--line)] px-4 py-2 text-xs font-bold hover:bg-[var(--bg-2)] cursor-pointer flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-primary" /> Download PNG
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "referrals" && (
                  <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-semibold">
                        <thead className="bg-[var(--bg-2)] border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--ink)] text-left">
                          <tr>
                            <th className="px-6 py-4">Referred Customer</th>
                            <th className="px-6 py-4">Subscription Plan</th>
                            <th className="px-6 py-4">Signup Date</th>
                            <th className="px-6 py-4">Purchase Date</th>
                            <th className="px-6 py-4">Current Status</th>
                            <th className="px-6 py-4 text-right">Commission Earned</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-left">
                          {activeRefs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-xs text-[var(--muted)] font-semibold">
                                No referrals recorded yet. Share your links to track signups here.
                              </td>
                            </tr>
                          ) : (
                            activeRefs.map((ref) => (
                              <tr key={ref.id} className="hover:bg-[var(--bg-2)]/30">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-[var(--ink)]">{ref.customerName}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-[var(--muted)]">{ref.plan}</td>
                                <td className="px-6 py-4">{ref.signupDate}</td>
                                <td className="px-6 py-4">{ref.purchaseDate || "—"}</td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {ref.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-primary">${ref.commission.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "payouts" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Wallet Control Panel */}
                    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 md:p-8 lg:col-span-2 space-y-6">
                      <h3 className="font-display text-xl font-extrabold">Available Wallet Balance</h3>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-left">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Approved Payout Balance</span>
                        <h4 className="text-4xl font-black text-primary mt-1">${currentAffiliate.balance.toFixed(2)}</h4>
                        <div className="text-[11px] text-[var(--muted)] font-semibold mt-3">
                          Minimum Payout Limit is <strong>$50.00</strong>
                        </div>
                      </div>

                      {/* Request Payout Ticket Form */}
                      <form onSubmit={handleRequestPayout} className="space-y-4">
                        <h4 className="font-bold text-sm text-[var(--ink)]">Request Payout Transfer</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Request Amount ($)</label>
                            <input 
                              type="number" 
                              required 
                              min="50"
                              max={currentAffiliate.balance}
                              value={payoutAmount}
                              onChange={(e) => setPayoutAmount(e.target.value)}
                              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none"
                              placeholder="e.g. 100"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Payment Method</label>
                            <select 
                              value={payoutMethod}
                              onChange={(e) => setPayoutMethod(e.target.value)}
                              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none"
                            >
                              <option value="Bank Transfer">Bank Transfer (Direct)</option>
                              <option value="UPI">UPI Payment</option>
                              <option value="PayPal">PayPal (Future support)</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={currentAffiliate.balance < 50}
                          className="btn btn-grad w-full py-3.5 text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
                        >
                          Request Payout Transfer
                        </button>
                      </form>
                    </div>

                    {/* Payout Ticket History list */}
                    <div className="space-y-4 text-left">
                      <h3 className="font-display text-lg font-black">Transfer Ledger</h3>
                      
                      <div className="space-y-3">
                        {activePayouts.map((p) => (
                          <div key={p.id} className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 flex items-center justify-between gap-4">
                            <div>
                              <div className="font-bold text-sm text-[var(--ink)]">${p.amount.toFixed(2)}</div>
                              <div className="text-[10px] text-[var(--muted)] font-semibold mt-0.5">{p.date} • {p.method}</div>
                              {p.reference && <div className="text-[9px] font-mono text-[var(--muted)] mt-1">Ref: {p.reference}</div>}
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                        {activePayouts.length === 0 && (
                          <div className="bg-[var(--panel)] border border-[var(--line)] p-8 rounded-2xl text-center text-xs text-[var(--muted)] font-semibold">
                            No payment history transfers.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-8">
                    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 md:p-8 text-left space-y-4">
                      <h3 className="font-display text-xl font-extrabold">Marketing Materials Kit</h3>
                      <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed">
                        Download logo assets, promotion copy, banners, and guidelines to help you promote SoloSpider professionally:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl space-y-4">
                        <h4 className="font-bold text-sm text-[var(--ink)]">SoloSpider Brand Assets</h4>
                        <p className="text-xs text-[var(--muted)] font-semibold">Contains brand logos, guidelines, and vector files.</p>
                        <button
                          onClick={() => toast.success("Downloading zip file (Simulated)")}
                          className="btn btn-ghost border-[var(--line)] px-4 py-2 text-xs font-bold hover:bg-[var(--bg-2)] cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" /> Brand Assets (.Zip)
                        </button>
                      </div>

                      <div className="bg-[var(--panel)] border border-[var(--line)] p-6 rounded-2xl space-y-4">
                        <h4 className="font-bold text-sm text-[var(--ink)]">Email Swipe Templates</h4>
                        <p className="text-xs text-[var(--muted)] font-semibold">High-converting cold and newsletter email drafts.</p>
                        <button
                          onClick={() => toast.success("Downloading zip file (Simulated)")}
                          className="btn btn-ghost border-[var(--line)] px-4 py-2 text-xs font-bold hover:bg-[var(--bg-2)] cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" /> Email Templates (.Zip)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 max-w-2xl text-left">
                    <h3 className="font-display text-xl font-extrabold mb-6">Affiliate Settings</h3>
                    
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Display Name</label>
                          <input 
                            type="text" 
                            required 
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Payout Method Option</label>
                          <input 
                            type="text" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none"
                            placeholder="UPI Address or Bank Details"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-grad px-8 py-3 text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer"
                      >
                        Save Settings
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
