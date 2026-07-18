"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  Users, CheckCircle2, XCircle, ArrowRight, Shield, 
  DollarSign, BarChart3, Settings, Percent, Layers, Trash2, Mail
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  name: string;
  email: string;
  password?: string;
  country: string;
  website: string;
  strategy: string;
  audienceSize: string;
  experience: string;
  status: string;
  appliedDate: string;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  password?: string;
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

export default function AffiliateAdminPage() {
  const [isDark, setIsDark] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"applications" | "affiliates" | "payouts" | "settings">("applications");

  // State
  const [applications, setApplications] = useState<Application[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [firstTimeRate, setFirstTimeRate] = useState(30);
  const [recurringRate, setRecurringRate] = useState(15);
  const [sentEmails, setSentEmails] = useState<{to: string, subject: string, body: string, date: string}[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmails = window.sessionStorage.getItem("solospider_simulated_emails");
      if (storedEmails) {
        setSentEmails(JSON.parse(storedEmails));
      }
    }
  }, []);

  const addSimulatedEmail = (email: {to: string, subject: string, body: string, date: string}) => {
    setSentEmails(prev => {
      const next = [email, ...prev];
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("solospider_simulated_emails", JSON.stringify(next));
      }
      return next;
    });
  };

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
      
      const isAuth = window.sessionStorage.getItem("solospider_admin_authenticated") === "true";
      if (isAuth) {
        setIsAdminAuthenticated(true);
      } else {
        const checkUser = async () => {
          try {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email === "info@solospider.ai") {
              setIsAdminAuthenticated(true);
            } else {
              setIsAdminAuthenticated(false);
            }
          } catch {
            setIsAdminAuthenticated(false);
          }
        };
        checkUser();
      }
    }
  }, []);

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "info@solospider.ai" && adminPassword === "123456") {
      setIsAdminAuthenticated(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("solospider_admin_authenticated", "true");
      }
      toast.success("Welcome back, Admin!");
    } else {
      toast.error("Invalid administrator email or password.");
    }
  };

  const loadState = async () => {
    let supabaseApps: Application[] = [];
    let supabaseAffiliates: Affiliate[] = [];
    let supabasePayouts: PayoutRequest[] = [];
    let usingSupabase = false;

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch applications
      const { data: appData, error: appError } = await supabase
        .from("affiliate_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      supabaseApps = (appData || []).map((app: any) => ({
        id: app.id,
        name: app.name,
        email: app.email,
        country: app.country,
        website: app.website || "",
        strategy: app.strategy,
        audienceSize: app.audience_size,
        experience: app.experience,
        status: app.status,
        appliedDate: new Date(app.created_at).toISOString().split("T")[0]
      }));

      // Fetch affiliates
      const { data: affData, error: affError } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affError) throw affError;

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

      // Fetch payouts
      const { data: payData, error: payError } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (payError) throw payError;

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
      setApplications(supabaseApps);
      setAffiliates(supabaseAffiliates);
      setPayouts(supabasePayouts);
    } catch (err) {
      console.warn("Supabase fetch failed in admin, fallback to localStorage:", err);
    }

    if (!usingSupabase && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("solospider_affiliate_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        setApplications(parsed.applications || []);
        setAffiliates(parsed.affiliates || []);
        setPayouts(parsed.payouts || []);
        setFirstTimeRate(parsed.firstTimeRate || 30);
        setRecurringRate(parsed.recurringRate || 15);
      } else {
        // Seed default demo data
        const seedApps: Application[] = [
          {
            id: "app-default-1",
            name: "Alex Rivera",
            email: "alex@riveramarketing.co",
            country: "United States",
            website: "https://riveramarketing.co",
            strategy: "We want to write review blogs, make videos comparing SoloSpider with SEMrush and feature it on our podcast.",
            audienceSize: "40k subscribers",
            experience: "4 years running growth marketing agencies",
            status: "pending",
            appliedDate: "2026-07-06"
          },
          {
            id: "app-default-2",
            name: "Priya Sharma",
            email: "priya@seoqueen.in",
            country: "India",
            website: "https://seoqueen.in",
            strategy: "I plan to share my link in my newsletter (12,000 active subscribers) and run webinars on Answer Engine Optimization.",
            audienceSize: "25k combined followers",
            experience: "Freelance SEO specialist & content writer",
            status: "pending",
            appliedDate: "2026-07-07"
          }
        ];

        const seedAffiliates: Affiliate[] = [
          {
            id: "aff-1",
            name: "Jane Doe",
            email: "jane@example.com",
            refId: "janedoe",
            clicks: 1420,
            signups: 89,
            activeCustomers: 12,
            pendingCommission: 240.00,
            paidCommission: 680.00,
            totalEarnings: 920.00,
            balance: 240.00,
            status: "active"
          },
          {
            id: "aff-2",
            name: "Marcus Aurelius",
            email: "marcus@stoicgrowth.com",
            refId: "stoicgrowth",
            clicks: 750,
            signups: 42,
            activeCustomers: 5,
            pendingCommission: 99.00,
            paidCommission: 198.00,
            totalEarnings: 297.00,
            balance: 99.00,
            status: "active"
          }
        ];

        const seedPayouts: PayoutRequest[] = [
          {
            id: "pay-1",
            affiliateId: "aff-1",
            email: "jane@example.com",
            amount: 340.00,
            date: "2026-06-01",
            method: "Bank Transfer",
            status: "paid",
            reference: "TXN98247192"
          },
          {
            id: "pay-2",
            affiliateId: "aff-1",
            email: "jane@example.com",
            amount: 340.00,
            date: "2026-07-01",
            method: "PayPal",
            status: "paid",
            reference: "TXN98351293"
          },
          {
            id: "pay-3",
            affiliateId: "aff-2",
            email: "marcus@stoicgrowth.com",
            amount: 198.00,
            date: "2026-07-03",
            method: "UPI (marcus@upi)",
            status: "pending"
          }
        ];

        setApplications(seedApps);
        setAffiliates(seedAffiliates);
        setPayouts(seedPayouts);
        setFirstTimeRate(30);
        setRecurringRate(15);

        saveState(seedApps, seedAffiliates, seedPayouts, 30, 15);
      }
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const saveState = (
    apps: Application[],
    affs: Affiliate[],
    pays: PayoutRequest[],
    ftRate: number,
    recRate: number
  ) => {
    if (typeof window !== "undefined") {
      const stateObj = {
        applications: apps,
        affiliates: affs,
        payouts: pays,
        firstTimeRate: ftRate,
        recurringRate: recRate
      };
      window.localStorage.setItem("solospider_affiliate_state", JSON.stringify(stateObj));
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



  // Admin Actions
  const handleApprove = async (app: Application) => {
    const refId = app.name.toLowerCase().replace(/\s+/g, "");

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Insert into affiliates
      const { data: affData, error: affErr } = await supabase
        .from("affiliates")
        .insert({
          name: app.name,
          email: app.email,
          ref_id: refId,
          clicks: 0,
          signups: 0,
          active_customers: 0,
          pending_commission: 0.00,
          paid_commission: 0.00,
          total_earnings: 0.00,
          balance: 0.00,
          status: "active",
          password: app.password // Save password to database
        })
        .select()
        .single();

      if (affErr) throw affErr;

      // 2. Update application status
      const { error: appErr } = await supabase
        .from("affiliate_applications")
        .update({ status: "approved" })
        .eq("id", app.id);

      if (appErr) throw appErr;

      toast.success(`🎉 Approved ${app.name} in live database!`);
      loadState();
    } catch (dbError) {
      console.warn("Supabase approval failed, falling back to localStorage:", dbError);
      
      // Local fallback
      const updatedApps = applications.filter((a) => a.id !== app.id);
      const newAffiliate: Affiliate = {
        id: "aff-" + Date.now(),
        name: app.name,
        email: app.email,
        password: app.password, // Copy password
        refId,
        clicks: 0,
        signups: 0,
        activeCustomers: 0,
        pendingCommission: 0.00,
        paidCommission: 0.00,
        totalEarnings: 0.00,
        balance: 0.00,
        status: "active"
      };

      const updatedAffiliates = [newAffiliate, ...affiliates];
      setApplications(updatedApps);
      setAffiliates(updatedAffiliates);
      saveState(updatedApps, updatedAffiliates, payouts, firstTimeRate, recurringRate);
      toast.success(`🎉 Approved ${app.name}! Link ref is ${refId}`);
    }

    // Add Simulated Email welcome notification
    const welcomeEmail = {
      to: app.email,
      subject: "Welcome to SoloSpider Affiliate Program!",
      body: `Hi ${app.name},\n\nYour application has been approved! Your unique affiliate referral code is: ${refId}.\n\nUse this link to refer users and earn 30% first month + 15% recurring commissions:\nhttps://solospider.ai/?ref=${refId}\n\nYou can now log in using your password at: https://solospider.ai/affiliate/login\n\nBest regards,\nSoloSpider Partner Team`,
      date: new Date().toLocaleString()
    };
    addSimulatedEmail(welcomeEmail);
  };

  const handleReject = async (appId: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("affiliate_applications")
        .update({ status: "rejected" })
        .eq("id", appId);

      if (error) throw error;
      toast.info("Rejected in live database.");
      loadState();
    } catch (dbError) {
      console.warn("Supabase rejection failed, falling back to localStorage:", dbError);
      const updatedApps = applications.filter((a) => a.id !== appId);
      setApplications(updatedApps);
      saveState(updatedApps, affiliates, payouts, firstTimeRate, recurringRate);
      toast.error("Application rejected successfully.");
    }
  };

  const handleToggleSuspend = async (affId: string) => {
    const aff = affiliates.find((a) => a.id === affId);
    if (!aff) return;
    const nextStatus = (aff.status === "active" ? "suspended" : "active") as "active" | "suspended";

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("affiliates")
        .update({ status: nextStatus })
        .eq("id", affId);

      if (error) throw error;
      toast.info(`Affiliate status updated to ${nextStatus} in database.`);
      loadState();
    } catch (dbError) {
      console.warn("Supabase suspend failed, falling back to localStorage:", dbError);
      const updatedAffiliates = affiliates.map((a) => {
        if (a.id === affId) {
          toast.info(`Affiliate status updated to ${nextStatus}.`);
          return { ...a, status: nextStatus };
        }
        return a;
      });
      setAffiliates(updatedAffiliates);
      saveState(applications, updatedAffiliates, payouts, firstTimeRate, recurringRate);
    }
  };

  const handleApprovePayout = async (payId: string) => {
    const targetPayout = payouts.find((p) => p.id === payId);
    if (!targetPayout) return;
    const refNumber = "TXN" + Math.floor(10000000 + Math.random() * 90000000);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Update payout status
      const { error: payErr } = await supabase
        .from("affiliate_payouts")
        .update({ status: "paid", reference: refNumber })
        .eq("id", payId);

      if (payErr) throw payErr;

      // 2. Fetch current balance
      const { data: affData, error: fetchErr } = await supabase
        .from("affiliates")
        .select("balance, paid_commission")
        .eq("id", targetPayout.affiliateId)
        .single();

      if (fetchErr) throw fetchErr;

      // 3. Update affiliate balance
      const newBalance = Math.max(0, Number(affData.balance) - targetPayout.amount);
      const newPaid = Number(affData.paid_commission) + targetPayout.amount;

      const { error: affErr } = await supabase
        .from("affiliates")
        .update({ balance: newBalance, paid_commission: newPaid })
        .eq("id", targetPayout.affiliateId);

      if (affErr) throw affErr;

      toast.success(`Payout of $${targetPayout.amount} approved! Txn: ${refNumber}`);
      loadState();
    } catch (dbError) {
      console.warn("Supabase payout approval failed, falling back to localStorage:", dbError);
      const updatedPayouts = payouts.map((p) => {
        if (p.id === payId) {
          return { ...p, status: "paid" as const, reference: refNumber };
        }
        return p;
      });

      const updatedAffiliates = affiliates.map((a) => {
        if (a.email === targetPayout.email) {
          return {
            ...a,
            balance: Math.max(0, a.balance - targetPayout.amount),
            paidCommission: a.paidCommission + targetPayout.amount
          };
        }
        return a;
      });

      setPayouts(updatedPayouts);
      setAffiliates(updatedAffiliates);
      saveState(applications, updatedAffiliates, updatedPayouts, firstTimeRate, recurringRate);
      toast.success(`Payout of $${targetPayout.amount} approved! Txn: ${refNumber}`);
    }
  };

  const handleRejectPayout = async (payId: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("affiliate_payouts")
        .update({ status: "rejected" })
        .eq("id", payId);

      if (error) throw error;
      toast.info("Payout rejected in live database.");
      loadState();
    } catch (dbError) {
      console.warn("Supabase payout reject failed, falling back to localStorage:", dbError);
      const updatedPayouts = payouts.map((p) => {
        if (p.id === payId) {
          return { ...p, status: "rejected" as const };
        }
        return p;
      });
      setPayouts(updatedPayouts);
      saveState(applications, affiliates, updatedPayouts, firstTimeRate, recurringRate);
      toast.error("Payout request rejected.");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveState(applications, affiliates, payouts, firstTimeRate, recurringRate);
    toast.success("Affiliate settings saved successfully!");
  };

  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center text-white">
        <div className="text-sm font-mono tracking-widest animate-pulse">CHECKING ACCESS PRIVILEGES...</div>
      </div>
    );
  }

  if (isAdminAuthenticated === false) {
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
            "--muted": isDark ? "#94a3b8" : "#475569",
          } as React.CSSProperties
        }
      >
        <header className="sticky top-0 z-40 w-full border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md">
          <div className="max-w-[1240px] mx-auto px-7 h-[72px] flex items-center justify-between">
            <Link href="/affiliate" className="flex items-center gap-2.5 font-display font-extrabold text-[20px] tracking-tight shrink-0">
              <img src="/assets/solospider-logo.png" alt="Solo Spider" className={`h-[34px] w-auto block ${isDark ? "brightness-0 invert" : ""}`} />
              <span className="grad-text text-sm font-bold uppercase px-2 py-0.5 rounded-md bg-primary/10 tracking-widest border border-primary/20">Partners</span>
            </Link>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center py-20 px-7">
          <div className="max-w-[440px] w-full bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 md:p-10 shadow-xl text-left">
            <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-red-500 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Access Restricted</span>
            </div>
            <h2 className="text-2xl font-black mb-4">Administrator Only</h2>
            <p className="text-xs text-[var(--muted)] mb-6 leading-relaxed">
              This administrative interface is strictly limited to authorized administrator accounts. 
              To manage applications and payouts, you must be signed in as <strong className="text-[var(--ink)]">info@solospider.ai</strong>.
            </p>

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Admin Email</label>
                <input 
                  type="email" 
                  required 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                  placeholder="info@solospider.ai"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Password</label>
                <input 
                  type="password" 
                  required 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full btn btn-grad py-3 text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer block text-center"
              >
                Access Admin Panel
              </button>
              
              <Link
                href="/affiliate"
                className="w-full bg-[var(--bg-2)] hover:bg-[var(--line)] border border-[var(--line)] text-center py-3 rounded-xl text-xs font-bold transition-all block text-[var(--ink)]"
              >
                Return to Affiliate Portal
              </Link>
            </form>
          </div>
        </main>
        
        <MarketingFooter />
      </div>
    );
  }

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
              className="p-2 rounded-full hover:bg-[var(--bg-2)] text-[var(--ink)] cursor-pointer text-sm font-bold mr-1"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <Link href="/" className="text-sm font-bold text-[var(--ink-2)] hover:text-primary transition-colors">
              Back to Main Site
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-[1240px] mx-auto px-7">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)] mb-10 text-left">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-[11px] uppercase tracking-widest text-primary font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Simulated Control Panel</span>
              </div>
              <h1 className="text-3xl font-black">Affiliate Program Admin</h1>
            </div>
            
            <div className="flex gap-3">
              <Link 
                href="/affiliate/dashboard" 
                className="btn btn-ghost border-[var(--line)] px-5 py-2.5 text-xs font-semibold hover:bg-[var(--panel)] flex items-center gap-1.5 cursor-pointer"
              >
                Go to Affiliate Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {[
              { label: "Total Partners", val: affiliates.length, icon: Users },
              { label: "Pending Apps", val: applications.length, icon: Layers },
              { label: "Payout Requests", val: payouts.filter((p) => p.status === "pending").length, icon: DollarSign },
              { label: "Rates", val: `${firstTimeRate}% / ${recurringRate}%`, icon: Percent }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded-2xl flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{m.label}</h5>
                    <span className="text-lg font-black">{m.val}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-[var(--line)] mb-8 gap-4 overflow-x-auto pb-px">
            {[
              { id: "applications", label: `Applications (${applications.length})` },
              { id: "affiliates", label: `Affiliates (${affiliates.length})` },
              { id: "payouts", label: `Payout Requests (${payouts.filter((p) => p.status === "pending").length})` },
              { id: "settings", label: "Program Settings" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="text-left">
            {activeTab === "applications" && (
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="bg-[var(--panel)] border border-[var(--line)] p-10 rounded-3xl text-center flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                    <h4 className="font-bold text-lg mb-1">No Pending Applications</h4>
                    <p className="text-xs text-[var(--muted)] font-semibold">New affiliate requests will show up here for validation.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-primary/20 transition-all">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg">{app.name}</h3>
                          <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {app.country}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] font-semibold">
                          Email: <span className="text-[var(--ink-2)]">{app.email}</span>
                          {app.website && <> • Website: <a href={app.website} target="_blank" className="text-primary hover:underline">{app.website}</a></>}
                          {` • Applied: ${app.appliedDate}`}
                        </p>
                        <p className="text-xs font-semibold text-[var(--ink-2)] bg-[var(--bg-2)] p-4 rounded-xl border border-[var(--line)] leading-relaxed">
                          <strong>Strategy:</strong> {app.strategy}
                        </p>
                        <p className="text-xs text-[var(--muted)] font-semibold">
                          <strong>Audience Size:</strong> {app.audienceSize} • <strong>Experience:</strong> {app.experience}
                        </p>
                      </div>

                      <div className="flex md:flex-col justify-end gap-3 shrink-0">
                        <button
                          onClick={() => handleApprove(app)}
                          className="btn btn-grad px-5 py-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="btn btn-ghost border-red-500/30 text-red-500 hover:bg-red-500/10 px-5 py-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Simulated Welcome Email Logs section */}
                <div className="pt-8 border-t border-[var(--line)] space-y-4 mt-8">
                  <h3 className="font-display text-lg font-black flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Simulated Welcome Email Outbox Logs</span>
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-semibold">
                    Simulated email transmissions triggered upon partner approval. Verify contents here for testing.
                  </p>
                  
                  <div className="space-y-4">
                    {sentEmails.length === 0 ? (
                      <div className="bg-[var(--panel)] border border-[var(--line)] border-dashed p-6 rounded-2xl text-center text-xs text-[var(--muted)] font-semibold">
                        No emails sent yet. Approve a partner application to trigger simulated welcome email.
                      </div>
                    ) : (
                      sentEmails.map((email, idx) => (
                        <div key={idx} className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl p-5 space-y-3">
                          <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-[var(--line)]/50">
                            <div>
                              <div className="text-xs font-semibold text-[var(--muted)]">To: <span className="text-[var(--ink-2)] font-bold">{email.to}</span></div>
                              <div className="text-xs font-semibold text-[var(--muted)] mt-1">Subject: <span className="text-[var(--ink)] font-bold">{email.subject}</span></div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[var(--muted)]">{email.date}</span>
                          </div>
                          <pre className="text-xs font-mono text-[var(--ink-2)] bg-[var(--bg-2)] p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {email.body}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "affiliates" && (
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-semibold">
                    <thead className="bg-[var(--bg-2)] border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--ink)] text-left">
                      <tr>
                        <th className="px-6 py-4">Affiliate</th>
                        <th className="px-6 py-4">Ref ID</th>
                        <th className="px-6 py-4 text-center">Clicks</th>
                        <th className="px-6 py-4 text-center">Signups</th>
                        <th className="px-6 py-4 text-center">Customers</th>
                        <th className="px-6 py-4 text-right">Earning</th>
                        <th className="px-6 py-4 text-right">Balance</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-left">
                      {affiliates.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-10 text-center text-xs text-[var(--muted)] font-semibold">
                            No approved partners registered.
                          </td>
                        </tr>
                      ) : (
                        affiliates.map((aff) => (
                          <tr key={aff.id} className="hover:bg-[var(--bg-2)]/30">
                            <td className="px-6 py-4">
                              <div className="font-bold text-[var(--ink)]">{aff.name}</div>
                              <div className="text-xs text-[var(--muted)] font-medium">{aff.email}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{aff.refId}</td>
                            <td className="px-6 py-4 text-center font-bold">{aff.clicks}</td>
                            <td className="px-6 py-4 text-center font-bold">{aff.signups}</td>
                            <td className="px-6 py-4 text-center font-bold">{aff.activeCustomers}</td>
                            <td className="px-6 py-4 text-right font-extrabold text-primary">${aff.totalEarnings.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-extrabold text-emerald-500">${aff.balance.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                aff.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {aff.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleToggleSuspend(aff.id)}
                                className={`text-xs font-bold hover:underline cursor-pointer ${
                                  aff.status === 'active' ? 'text-red-500' : 'text-emerald-500'
                                }`}
                              >
                                {aff.status === 'active' ? "Suspend" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "payouts" && (
              <div className="space-y-4">
                {payouts.filter((p) => p.status === "pending").length === 0 ? (
                  <div className="bg-[var(--panel)] border border-[var(--line)] p-10 rounded-3xl text-center flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                    <h4 className="font-bold text-lg mb-1">No Pending Payout Requests</h4>
                    <p className="text-xs text-[var(--muted)] font-semibold">Affiliate payout request tickets will appear here.</p>
                  </div>
                ) : (
                  payouts.filter((p) => p.status === "pending").map((pay) => (
                    <div key={pay.id} className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-primary/20 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg">Payout Requested</h3>
                          <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Pending Approval
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] font-semibold">
                          Affiliate Email: <span className="text-[var(--ink-2)]">{pay.email}</span> • Method: <span className="text-[var(--ink-2)]">{pay.method}</span> • Date: {pay.date}
                        </p>
                        <h4 className="text-2xl font-black text-primary">${pay.amount.toFixed(2)}</h4>
                      </div>

                      <div className="flex md:flex-col justify-end gap-3 shrink-0">
                        <button
                          onClick={() => handleApprovePayout(pay.id)}
                          className="btn btn-grad px-5 py-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Payout
                        </button>
                        <button
                          onClick={() => handleRejectPayout(pay.id)}
                          className="btn btn-ghost border-red-500/30 text-red-500 hover:bg-red-500/10 px-5 py-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" /> Reject Request
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Payout History */}
                <div className="pt-8">
                  <h3 className="font-display text-lg font-black mb-4">Completed Payout History</h3>
                  <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-semibold">
                        <thead className="bg-[var(--bg-2)] border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--ink)] text-left">
                          <tr>
                            <th className="px-6 py-4">Affiliate Email</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Payment Method</th>
                            <th className="px-6 py-4">Reference ID</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)] text-left">
                          {payouts.filter((p) => p.status !== "pending").length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-xs text-[var(--muted)] font-semibold">
                                No completed payouts to display.
                              </td>
                            </tr>
                          ) : (
                            payouts.filter((p) => p.status !== "pending").map((p) => (
                              <tr key={p.id} className="hover:bg-[var(--bg-2)]/30">
                                <td className="px-6 py-4">{p.email}</td>
                                <td className="px-6 py-4">{p.date}</td>
                                <td className="px-6 py-4 font-bold">${p.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-xs font-semibold">{p.method}</td>
                                <td className="px-6 py-4 font-mono text-xs text-[var(--muted)]">{p.reference || "—"}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                    p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-8 max-w-2xl">
                <h3 className="font-display text-xl font-extrabold mb-6">Program Configuration</h3>
                
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">First-Time Commission (%)</label>
                      <div className="flex gap-3">
                        <input 
                          type="number" 
                          required 
                          value={firstTimeRate}
                          onChange={(e) => setFirstTimeRate(Number(e.target.value))}
                          className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                          min="1"
                          max="100"
                        />
                        <span className="flex items-center justify-center font-bold px-4 bg-[var(--bg-2)] border border-[var(--line)] rounded-xl">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-2 font-semibold">Applied to the first month of a referred sale.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Recurring Commission (%)</label>
                      <div className="flex gap-3">
                        <input 
                          type="number" 
                          required 
                          value={recurringRate}
                          onChange={(e) => setRecurringRate(Number(e.target.value))}
                          className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:border-primary transition-colors"
                          min="1"
                          max="100"
                        />
                        <span className="flex items-center justify-center font-bold px-4 bg-[var(--bg-2)] border border-[var(--line)] rounded-xl">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-2 font-semibold">Applied to all subsequent monthly renewals.</p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-2)] p-4 rounded-xl border border-[var(--line)] text-xs text-[var(--muted)] font-semibold leading-relaxed">
                    These rates are flat and the same for all affiliates regardless of plan tier. First-time rate applies to new customer acquisitions; recurring rate applies from month 2 onwards.
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-grad px-8 py-3 text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
