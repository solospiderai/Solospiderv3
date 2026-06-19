"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Plug, 
  Globe, 
  Trash2, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FolderKanban,
  FileCode2,
  RefreshCw
} from "lucide-react";

// Official High-Fidelity Brand SVG Icons
const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="5" fill="#0A66C2" />
    <path d="M8.5 19v-9h-3v9h3zm-1.5-10.3a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM19 19v-5.2c0-2.6-1.4-3.8-3.2-3.8-1.5 0-2.1.8-2.5 1.4V10h-3v9h3v-4.9c0-.3 0-.5.1-.7.2-.5.6-1 1.4-1 1 0 1.4.8 1.4 1.9V19h3z" fill="white" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="5" fill="#000000" />
    <path d="M17.16 5h2.17l-4.75 5.43L20 19h-4.38l-3.43-4.48L8.27 19H6.1l5.09-5.81L5 5h4.5l3.1 4.1L17.16 5zm-.76 12.7h1.21L9.22 6.2H7.93l8.47 11.5z" fill="white" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f9ce34" />
        <stop offset="40%" stopColor="#ee2a7b" />
        <stop offset="100%" stopColor="#6228d7" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5" fill="url(#ig-gradient)" />
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2c-1.77 0-3.2-1.43-3.2-3.2s1.43-3.2 3.2-3.2 3.2 1.43 3.2 3.2-1.43 3.2-3.2 3.2z" fill="white" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="white" />
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" stroke="white" strokeWidth="1.5" fill="none" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="5" fill="#1877F2" />
    <path d="M15.5 12.5h-2.5v9h-3.5v-9h-1.8v-3h1.8v-2c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2 .1 2.3.1v2.7h-1.6c-1.2 0-1.4.6-1.4 1.4v1.7h3l-.4 3z" fill="white" />
  </svg>
);

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="12" fill="#E60023" />
    <path d="M12.2 4c-4.4 0-8 3.6-8 8 0 3.4 2.1 6.3 5.1 7.4-.1-.6-.2-1.6 0-2.3l1-4.2s-.3-.5-.3-1.3c0-1.2.7-2.1 1.6-2.1.8 0 1.1.6 1.1 1.3 0 .8-.5 1.9-.8 3-.2.9.4 1.6 1.3 1.6 1.6 0 2.8-1.7 2.8-4.1 0-2.1-1.5-3.6-3.7-3.6-2.5 0-4 1.9-4 3.8 0 .8.3 1.6.7 2.1.1.1.1.2 0 .3l-.3 1.1c0 .1-.1.2-.2.1-1.2-.5-1.9-2.2-1.9-3.6 0-2.9 2.1-5.6 6.1-5.6 3.2 0 5.7 2.3 5.7 5.3 0 3.2-2 5.7-4.8 5.7-.9 0-1.8-.5-2.1-1.1l-.6 2.2c-.2.8-.8 1.8-1.2 2.4.8.2 1.6.4 2.5.4 4.4 0 8-3.6 8-8s-3.6-8-8-8z" fill="white" />
  </svg>
);

const WordPressIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="5" fill="#21759B" />
    <path d="M12.1 4.5c4.1 0 7.4 3.3 7.4 7.4 0 1.2-.3 2.3-.8 3.3l-3.2-8.8c.6-.2 1.1-.3 1.5-.3.2 0 .4-.1.4-.3 0-.2-.3-.3-.8-.3h-2.3c-.5 0-.8.1-.8.3 0 .2.2.3.4.3.4 0 .7.1.9.3l-1.9 5.2-1.5-4.4c.2 0 .4-.1.4-.3 0-.2-.3-.3-.8-.3H8.3c-.5 0-.8.1-.8.3 0 .2.2.3.4.3.4 0 .6.1.8.3l1.8 5L8.7 18.2C7.3 17 6.5 15.2 6.5 13.2l2.3-6.4c.3-.8.6-1.1.9-1.2.1-.1.2-.2.2-.4 0-.2-.3-.3-.8-.3H6.8c.2-.2.4-.3.6-.3zm.9 9.3l1.9-5.5 1.9 5.5h-3.8zm1.5 4.3l.9-2.7 2.1-5.9c.7 1.2 1.1 2.5 1.1 4 0 2-.8 3.8-2.1 5.1l-2-5.5zm-5.1-.3c-1.3-1.3-2.1-3.1-2.1-5.1 0-1 .2-2 .6-2.9l3.2 8.7-1.7-.7zm1.7 2.1c-.2.1-.5.1-.7.1-1.7 0-3.3-.6-4.5-1.7l1.7-.7 1.8 5c.4.1.8.2 1.3.2 1 0 1.9-.3 2.7-.7l-2.3-2.9z" fill="white" />
  </svg>
);

const ShopifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18.77 8.36c-.14-.82-.69-1.12-1.39-.94l-3.37.87L11.76 1.94c-.21-.53-.64-.82-1.11-.82-.43 0-.84.25-.19.73L7.49 6l-3.07.79c-.69.18-1.14.64-.97 1.58l2.13 12.02c.16.89.92 1.38 1.64 1.38l10.37-.84a1.69 1.69 0 0 0 1.54-1.49l.94-10.42c.01-.06.01-.12.01-.18 0-.39-.19-.72-.49-.94z" fill="#96BF48" />
    <path d="M10.38 2.87l1.64 4.95-3.53.91-1.14-3.43 3.03-2.43z" fill="#5E8E3E" />
    <path d="M4.15 9.24L18.62 8.3c-.03-.19.05-.27.18-.3l2.85-.73 1.91 5.78-3.36.86-2.13-5.46z" fill="#96BF48" opacity="0.15" />
  </svg>
);

const MagentoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 2L2 7.8v11.6l10 5.8 10-5.8V7.8L12 2z" fill="#EE672F" />
    <path d="M12 4.4L4.3 8.9v8.9l7.7 4.5 7.7-4.5V8.9L12 4.4z" fill="white" />
    <path d="M12 6.5l5.5 3.2v6.4l-2.2 1.3V11l-3.3-1.9L8.7 11v6.4l-2.2-1.3v-6.4l5.5-3.2z" fill="#EE672F" />
  </svg>
);

export default function IntegrationsSettingsPage() {
  const { activeProject, isLoading: isProjectLoading } = useProjects();
  const { user, loading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // Active form view: "wordpress" | "shopify" | "magento" | null
  const [activeForm, setActiveForm] = useState<"wordpress" | "shopify" | "magento" | null>(null);

  // WordPress form states
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");

  // Shopify form states
  const [shopifyShopName, setShopifyShopName] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");

  // Magento form states
  const [magentoUrl, setMagentoUrl] = useState("");
  const [magentoToken, setMagentoToken] = useState("");

  // Fetch connected CMS & Store integrations
  const cmsIntegrationsQuery = useQuery({
    queryKey: ["cms_integrations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_integrations")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch connected Social Media accounts
  const socialAccountsQuery = useQuery({
    queryKey: ["social_accounts_settings", activeProject?.id],
    enabled: Boolean(activeProject?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("project_id", activeProject!.id);
      if (error) throw error;
      return data || [];
    }
  });

  // General Add Integration mutation (WordPress, Shopify, Magento)
  const addIntegrationMutation = useMutation({
    mutationFn: async (payload: { platform: string; credentials: any }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("workspace_integrations")
        .insert({
          user_id: user.id,
          platform: payload.platform,
          credentials: payload.credentials,
          is_active: true
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cms_integrations", user?.id] });
      const platformLabel = variables.platform.charAt(0).toUpperCase() + variables.platform.slice(1);
      toast.success(`${platformLabel} integration connected successfully!`);
      setActiveForm(null);
      
      // Reset forms
      setWpUrl("");
      setWpUsername("");
      setWpPassword("");
      setShopifyShopName("");
      setShopifyAccessToken("");
      setMagentoUrl("");
      setMagentoToken("");
    },
    onError: (err: any, variables) => {
      const platformLabel = variables.platform.charAt(0).toUpperCase() + variables.platform.slice(1);
      toast.error(`Failed to add ${platformLabel} integration`, { description: err.message });
    }
  });

  // Disconnect CMS / Store Integration mutation
  const disconnectCmsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workspace_integrations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms_integrations", user?.id] });
      toast.success("Integration disconnected successfully.");
    },
    onError: (err: any) => {
      toast.error("Failed to disconnect", { description: err.message });
    }
  });

  // Disconnect Social Account mutation
  const disconnectSocialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social_accounts_settings", activeProject?.id] });
      toast.success("Social account disconnected.");
    },
    onError: (err: any) => {
      toast.error("Failed to disconnect account", { description: err.message });
    }
  });

  const handleAddWordPress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error("Please fill in all WordPress credentials fields.");
      return;
    }
    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    addIntegrationMutation.mutate({
      platform: "wordpress",
      credentials: {
        siteUrl: cleanUrl,
        username: wpUsername.trim(),
        appPassword: wpPassword.trim()
      }
    });
  };

  const handleAddShopify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyShopName || !shopifyAccessToken) {
      toast.error("Please fill in all Shopify credentials fields.");
      return;
    }
    let cleanShop = shopifyShopName.trim();
    if (!cleanShop.includes("myshopify.com") && !cleanShop.startsWith("http")) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }
    cleanShop = cleanShop.replace(/https?:\/\//, "");

    addIntegrationMutation.mutate({
      platform: "shopify",
      credentials: {
        shopName: cleanShop,
        accessToken: shopifyAccessToken.trim()
      }
    });
  };

  const handleAddMagento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magentoUrl || !magentoToken) {
      toast.error("Please fill in all Magento credentials fields.");
      return;
    }
    let cleanUrl = magentoUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    addIntegrationMutation.mutate({
      platform: "magento",
      credentials: {
        siteUrl: cleanUrl,
        accessToken: magentoToken.trim()
      }
    });
  };

  const handleSocialConnect = (platform: string) => {
    if (!activeProject) {
      toast.error("Please select a project from the dashboard before connecting social accounts.");
      return;
    }
    
    const width = 600;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Open OAuth process in a secure popup window
    const oauthWindow = window.open(
      `/api/social/connect/${platform}?projectId=${activeProject.id}`,
      `Connect ${platform}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    // Watch the popup to refresh active accounts list when authorization completes
    const checkTimer = setInterval(() => {
      if (!oauthWindow || oauthWindow.closed) {
        clearInterval(checkTimer);
        queryClient.invalidateQueries({ queryKey: ["social_accounts_settings", activeProject.id] });
        toast.info(`Refreshed connected ${platform} profiles.`);
      }
    }, 1000);
  };

  const isPageLoading = isProjectLoading || isAuthLoading;
  const connectedIntegrations = cmsIntegrationsQuery.data || [];
  const connectedSocials = socialAccountsQuery.data || [];

  if (isPageLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Helper to render connection status badge
  const renderStatusBadge = () => (
    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
      Connected
    </span>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 animate-slide-in">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Plug className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-violet-200">
                Integrations Workspace
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Integrations & Channels</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-semibold text-slate-500 leading-normal">
              Connect external CMS and store platforms for synchronization, and authorize social API channels for automated scheduling and publication.
            </p>
          </div>
        </div>
      </header>

      {/* Top HUD Cards (Metrics) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Project Target */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <FolderKanban className="w-14 h-14 text-violet-600" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FolderKanban className="h-4 w-4 text-violet-500" />
            Active Project Target
          </div>
          <p className="mt-3 text-lg font-black text-slate-900 truncate">
            {activeProject?.brand_name || activeProject?.name || "No project selected"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400 truncate">
            {activeProject?.domain || "Select website to proceed"}
          </p>
        </div>

        {/* CMS & Stores Metric Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Globe className="w-14 h-14 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Globe className="h-4 w-4 text-indigo-500" />
            Connected Platforms & Stores
          </div>
          <p className="mt-3 text-lg font-black text-slate-900">{connectedIntegrations.length}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">WordPress, Shopify, Magento active</p>
        </div>

        {/* Social Accounts Metric Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Plug className="w-14 h-14 text-pink-600" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Plug className="h-4 w-4 text-pink-500" />
            Active Social Channels
          </div>
          <p className="mt-3 text-lg font-black text-slate-900">{connectedSocials.length} connected</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Ready for automated sharing</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Column: CMS & Store Connections (Shopify, Magento, WordPress) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-950">CMS & E-Commerce Connections</h3>
              <p className="text-xs text-slate-400 font-semibold">Publish generated drafts, products, and articles to your store or blog.</p>
            </div>

            {/* Platform Selection Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveForm(activeForm === "wordpress" ? null : "wordpress")}
                className={`flex flex-col items-center gap-2.5 p-3 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  activeForm === "wordpress" ? "border-[#21759B] bg-[#21759B]/5 text-[#1e6180]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <WordPressIcon className="w-6 h-6" />
                WordPress
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "shopify" ? null : "shopify")}
                className={`flex flex-col items-center gap-2.5 p-3 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  activeForm === "shopify" ? "border-[#96BF48] bg-[#96BF48]/5 text-[#5e8e3e]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <ShopifyIcon className="w-6 h-6" />
                Shopify
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "magento" ? null : "magento")}
                className={`flex flex-col items-center gap-2.5 p-3 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                  activeForm === "magento" ? "border-[#EE672F] bg-[#EE672F]/5 text-[#c65120]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <MagentoIcon className="w-6 h-6" />
                Magento
              </button>
            </div>

            {/* WordPress Form */}
            {activeForm === "wordpress" && (
              <form onSubmit={handleAddWordPress} className="bg-slate-50/50 rounded-2xl p-5 border border-indigo-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <WordPressIcon className="w-5 h-5" />
                    Configure WordPress Site
                  </h4>
                  <button type="button" onClick={() => setActiveForm(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">WordPress Site URL</label>
                    <input
                      type="text"
                      placeholder="https://myblogsite.com"
                      value={wpUrl}
                      onChange={(e) => setWpUrl(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">WP Admin Username</label>
                      <input
                        type="text"
                        placeholder="admin"
                        value={wpUsername}
                        onChange={(e) => setWpUsername(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Application Password</label>
                      <input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={wpPassword}
                        onChange={(e) => setWpPassword(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    WordPress restricts API publishing via standard passwords. Create a specialized **Application Password** inside your WP site under **Users &gt; Profile &gt; Application Passwords** to proceed.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#21759B] hover:bg-[#1a5b79] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {addIntegrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify & Save WordPress Connection
                </button>
              </form>
            )}

            {/* Shopify Form */}
            {activeForm === "shopify" && (
              <form onSubmit={handleAddShopify} className="bg-slate-50/50 rounded-2xl p-5 border border-emerald-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShopifyIcon className="w-5 h-5" />
                    Configure Shopify Store
                  </h4>
                  <button type="button" onClick={() => setActiveForm(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Shopify URL / Store Name</label>
                    <input
                      type="text"
                      placeholder="my-awesome-store.myshopify.com"
                      value={shopifyShopName}
                      onChange={(e) => setShopifyShopName(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-3 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Admin API Access Token</label>
                    <input
                      type="password"
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={shopifyAccessToken}
                      onChange={(e) => setShopifyAccessToken(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-3 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    Install a custom app in your Shopify Admin panel under **Settings &gt; App and sales channels &gt; Develop apps** and generate an Admin API Access Token with write privileges.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#96BF48] hover:bg-[#83aa3d] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {addIntegrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify & Save Shopify Connection
                </button>
              </form>
            )}

            {/* Magento Form */}
            {activeForm === "magento" && (
              <form onSubmit={handleAddMagento} className="bg-slate-50/50 rounded-2xl p-5 border border-orange-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <MagentoIcon className="w-5 h-5" />
                    Configure Magento Site
                  </h4>
                  <button type="button" onClick={() => setActiveForm(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Magento Store Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="https://magentostore.com"
                      value={magentoUrl}
                      onChange={(e) => setMagentoUrl(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-[#EE672F] rounded-xl p-3 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Integration / Access Token</label>
                    <input
                      type="password"
                      placeholder="magento_integration_access_token_xyz"
                      value={magentoToken}
                      onChange={(e) => setMagentoToken(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-[#EE672F] rounded-xl p-3 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    Create an integration in Magento Admin panel under **System &gt; Extensions &gt; Integrations**, activate it, and paste the Access Token here.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#EE672F] hover:bg-[#d65a25] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {addIntegrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify & Save Magento Connection
                </button>
              </form>
            )}

            {/* List Connected CMS / Store Integrations */}
            {connectedIntegrations && connectedIntegrations.length > 0 ? (
              <div className="space-y-3">
                {connectedIntegrations.map((int: any) => {
                  const isWp = int.platform === "wordpress";
                  const isShopify = int.platform === "shopify";
                  const isMagento = int.platform === "magento";

                  return (
                    <div key={int.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-150 rounded-2xl bg-slate-50/20 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                          {isWp ? <WordPressIcon className="w-10 h-10 rounded-xl shadow-sm" /> : isShopify ? <ShopifyIcon className="w-10 h-10 rounded-xl shadow-sm" /> : <MagentoIcon className="w-10 h-10 rounded-xl shadow-sm" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                            {isWp ? int.credentials?.siteUrl : isShopify ? int.credentials?.shopName : int.credentials?.siteUrl}
                            <span className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/10 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Active
                            </span>
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                            Platform: <span className="font-extrabold uppercase">{int.platform}</span> 
                            {isWp && ` | User: ${int.credentials?.username || "admin"}`}
                            {!isWp && ` | Credentials Secured`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to disconnect this ${int.platform} integration?`)) {
                            disconnectCmsMutation.mutate(int.id);
                          }
                        }}
                        className="border border-slate-200 bg-white hover:border-red-200 hover:text-red-600 text-slate-500 font-semibold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer self-end sm:self-auto shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Disconnect
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Globe className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No stores or sites connected</p>
                <p className="text-[10px] text-slate-400 font-semibold max-w-sm">
                  Connecting WordPress, Shopify, or Magento allows SoloSpider to deploy products and articles directly to your digital storefront.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Social Channels Connection (LinkedIn, Twitter, Instagram, Facebook, Pinterest) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950">Social Media API Channels</h3>
              <p className="text-xs text-slate-400 font-semibold">Schedule publishing across connected social networks.</p>
            </div>

            <div className="space-y-4">
              {/* SOCIAL PLATFORMS LIST */}
              {[
                {
                  id: "linkedin",
                  name: "LinkedIn Profile",
                  desc: "Publish updates and articles",
                  customIcon: LinkedInIcon
                },
                {
                  id: "twitter",
                  name: "X (Twitter) Profile",
                  desc: "Publish tweets and threads",
                  customIcon: XIcon
                },
                {
                  id: "instagram",
                  name: "Instagram Profile",
                  desc: "Schedule carousel and image posts",
                  customIcon: InstagramIcon
                },
                {
                  id: "facebook",
                  name: "Facebook Page",
                  desc: "Publish articles and campaign updates",
                  customIcon: FacebookIcon
                },
                {
                  id: "pinterest",
                  name: "Pinterest Board",
                  desc: "Schedule image pins and links",
                  customIcon: PinterestIcon
                }
              ].map((plat) => {
                const connectedAccount = connectedSocials.find((acc: any) => acc.platform === plat.id);
                const isConnected = Boolean(connectedAccount);
                const BrandIcon = plat.customIcon;

                return (
                  <div key={plat.id} className="p-4 border border-slate-200 rounded-2xl space-y-3.5 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                          <BrandIcon className="w-9 h-9 rounded-xl shadow-sm" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800">{plat.name}</span>
                          <p className="text-[9px] text-slate-400 font-semibold">{plat.desc}</p>
                        </div>
                      </div>

                      {/* Connect / Connected + Edit buttons */}
                      {isConnected ? (
                        <div className="flex items-center gap-1.5">
                          {renderStatusBadge()}
                          
                          {/* Change Account / Edit Button */}
                          <button
                            onClick={() => handleSocialConnect(plat.id)}
                            className="p-2 border border-slate-150 rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors cursor-pointer text-slate-500 shadow-sm"
                            title="Change Account / Re-authenticate"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Disconnect Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to disconnect this ${plat.name} account?`)) {
                                disconnectSocialMutation.mutate(connectedAccount.id);
                              }
                            }}
                            className="p-2 border border-slate-150 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50/30 transition-colors cursor-pointer text-slate-500 shadow-sm"
                            title="Disconnect Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSocialConnect(plat.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          Connect
                        </button>
                      )}
                    </div>

                    {/* Account Handle Info Card */}
                    {isConnected && (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-semibold text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">Account: {connectedAccount?.handle}</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> API Ready
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
