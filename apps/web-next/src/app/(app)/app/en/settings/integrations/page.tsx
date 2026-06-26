"use client";

import { useState, useEffect } from "react";
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
  RefreshCw,
  BookOpen,
  X,
  ExternalLink
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
  const [pendingFix, setPendingFix] = useState<{ issueId: string; pageUrl: string; suggestedValue: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = window.localStorage.getItem("solospider.pending_fix");
      if (pending) {
        try {
          setPendingFix(JSON.parse(pending));
        } catch {}
      }
    }
  }, []);

  // Shopify OAuth Callback Handshake
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const urlParams = new URLSearchParams(window.location.search);
    const shopifyCode = urlParams.get("shopify_code");
    const shopParam = urlParams.get("shop");

    if (shopifyCode && shopParam) {
      const processExchange = async () => {
        setIsConnectingShopifyOAuth(true);
        try {
          const tempAuth = window.localStorage.getItem("solospider.shopify_auth_temp");
          if (!tempAuth) {
            toast.error("Shopify OAuth session expired. Please connect again.");
            return;
          }
          const { shopName, clientId, clientSecret } = JSON.parse(tempAuth);
          
          let cleanShopParam = shopParam.trim().replace(/https?:\/\//, "").replace(/\/$/, "");
          let cleanShopName = shopName.trim().replace(/https?:\/\//, "").replace(/\/$/, "");
          if (!cleanShopName.includes(".myshopify.com")) {
            cleanShopName = `${cleanShopName}.myshopify.com`;
          }
          if (!cleanShopParam.includes(".myshopify.com")) {
            cleanShopParam = `${cleanShopParam}.myshopify.com`;
          }

          toast.loading("Exchanging Shopify authorization code...", { id: "shopify-oauth" });

          const response = await fetch("/api/seo/shopify-token-exchange", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: shopifyCode,
              shopName: cleanShopParam,
              clientId,
              clientSecret,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Token exchange failed");
          }

          toast.success("Shopify connected successfully!", { id: "shopify-oauth" });
          window.localStorage.removeItem("solospider.shopify_auth_temp");
          queryClient.invalidateQueries({ queryKey: ["cms_integrations", user.id] });

          const pending = window.localStorage.getItem("solospider.pending_fix");
          if (pending) {
            toast.success("Redirecting back to SEO workspace to complete your fix...");
            setTimeout(() => {
              window.location.href = "/app/en/seo";
            }, 1500);
          }
        } catch (err: any) {
          console.error("[ShopifyOAuth] Exchange error:", err);
          toast.error(`Shopify OAuth failed: ${err.message}`, { id: "shopify-oauth" });
        } finally {
          setIsConnectingShopifyOAuth(false);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      };

      processExchange();
    }
  }, [user, queryClient]);

  // WordPress form states
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");

  // Shopify form states
  const [shopifyShopName, setShopifyShopName] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");
  const [shopifyClientId, setShopifyClientId] = useState("");
  const [shopifyClientSecret, setShopifyClientSecret] = useState("");
  const [shopifyConnectMethod, setShopifyConnectMethod] = useState<"oauth" | "manual">("oauth");
  const [isConnectingShopifyOAuth, setIsConnectingShopifyOAuth] = useState(false);

  // Magento form states
  const [magentoUrl, setMagentoUrl] = useState("");
  const [magentoToken, setMagentoToken] = useState("");

  // Editing / Verification states
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

  // Setup Guide modal states
  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<"wordpress" | "shopify">("wordpress");
  const [wpGuideTab, setWpGuideTab] = useState<"org" | "com">("org");
  const [shopifyGuideTab, setShopifyGuideTab] = useState<"standard" | "partner">("standard");

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

  // Verify credentials before saving
  const verifyCredentials = async (platform: string, credentials: any): Promise<{ ok: boolean; message?: string; error?: string }> => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch("/api/jobs/verify-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials }),
      });
      const data = await res.json();
      setVerificationResult(data);
      return data;
    } catch (e: any) {
      const result = { ok: false, error: e.message || "Verification failed" };
      setVerificationResult(result);
      return result;
    } finally {
      setIsVerifying(false);
    }
  };

  // General Add Integration mutation (WordPress, Shopify, Magento)
  const addIntegrationMutation = useMutation({
    mutationFn: async (payload: { platform: string; credentials: any }) => {
      if (!user) throw new Error("Not authenticated");
      
      // If editing existing integration, update instead of insert
      if (editingIntegrationId) {
        const { data, error } = await supabase
          .from("workspace_integrations")
          .update({
            credentials: payload.credentials,
            is_active: true
          })
          .eq("id", editingIntegrationId)
          .select();
        if (error) throw error;
        return data;
      }

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
      const action = editingIntegrationId ? "updated" : "connected";
      toast.success(`${platformLabel} integration ${action} successfully!`);
      setActiveForm(null);
      setEditingIntegrationId(null);
      setVerificationResult(null);
      
      // Reset forms
      setWpUrl("");
      setWpUsername("");
      setWpPassword("");
      setShopifyShopName("");
      setShopifyAccessToken("");
      setMagentoUrl("");
      setMagentoToken("");

      // Redirect back if pending fix exists
      if (typeof window !== "undefined") {
        const pending = window.localStorage.getItem("solospider.pending_fix");
        if (pending) {
          toast.success("Redirecting back to SEO workspace to complete your fix...");
          setTimeout(() => {
            window.location.href = "/app/en/seo";
          }, 1500);
        }
      }
    },
    onError: (err: any, variables) => {
      const platformLabel = variables.platform.charAt(0).toUpperCase() + variables.platform.slice(1);
      toast.error(`Failed to save ${platformLabel} integration`, { description: err.message });
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

  const handleAddWordPress = async (e: React.FormEvent) => {
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
    const creds = {
      siteUrl: cleanUrl,
      username: wpUsername.trim(),
      appPassword: wpPassword.trim()
    };

    // Verify first
    const result = await verifyCredentials("wordpress", creds);
    if (!result.ok) {
      toast.error("WordPress verification failed", { description: result.error });
      return;
    }

    addIntegrationMutation.mutate({ platform: "wordpress", credentials: creds });
  };

  const handleAddShopify = async (e: React.FormEvent) => {
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
    const creds = {
      shopName: cleanShop,
      accessToken: shopifyAccessToken.trim()
    };

    // Verify first
    const result = await verifyCredentials("shopify", creds);
    if (!result.ok) {
      toast.error("Shopify verification failed", { description: result.error });
      return;
    }

    addIntegrationMutation.mutate({ platform: "shopify", credentials: creds });
  };

  const handleConnectShopifyOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyShopName || !shopifyClientId || !shopifyClientSecret) {
      toast.error("Please fill in Shop Domain, Client ID, and Client Secret.");
      return;
    }

    let cleanShop = shopifyShopName.trim();
    if (!cleanShop.includes("myshopify.com") && !cleanShop.startsWith("http")) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }
    cleanShop = cleanShop.replace(/https?:\/\//, "").replace(/\/$/, "");

    // Save temp auth parameters to trade code later
    const tempAuth = {
      shopName: cleanShop,
      clientId: shopifyClientId.trim(),
      clientSecret: shopifyClientSecret.trim()
    };
    window.localStorage.setItem("solospider.shopify_auth_temp", JSON.stringify(tempAuth));

    // Redirect merchant to Shopify App Installation page
    const scopes = "read_content,write_content,read_online_store_pages,write_online_store_pages";
    const redirectUri = `${window.location.origin}/api/seo/shopify-callback`;
    const authorizeUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${shopifyClientId.trim()}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log("[ShopifyOAuth] Redirecting merchant to:", authorizeUrl);
    window.location.href = authorizeUrl;
  };

  const handleEditIntegration = (integration: any) => {
    setEditingIntegrationId(integration.id);
    setVerificationResult(null);
    if (integration.platform === "wordpress") {
      setWpUrl(integration.credentials?.siteUrl || "");
      setWpUsername(integration.credentials?.username || "");
      setWpPassword(integration.credentials?.appPassword || "");
      setActiveForm("wordpress");
    } else if (integration.platform === "shopify") {
      setShopifyShopName(integration.credentials?.shopName || "");
      setShopifyAccessToken(""); // Don't pre-fill token for security
      setActiveForm("shopify");
    } else if (integration.platform === "magento") {
      setMagentoUrl(integration.credentials?.siteUrl || "");
      setMagentoToken("");
      setActiveForm("magento");
    }
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
    
    // Open OAuth process in a new tab so Twitter renders the full desktop layout (with account switching)
    const oauthWindow = window.open(
      `/api/social/connect/${platform}?projectId=${activeProject.id}`,
      "_blank"
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

  // Helper to render connection status badge - shows Sandbox for stub tokens, Connected for real
  const renderStatusBadge = (account: any) => {
    const isSandbox = !account?.access_token || 
      account.access_token.includes("stub") || 
      account.access_token.includes("mock");
    return isSandbox ? (
      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
        Sandbox
      </span>
    ) : (
      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
        Connected
      </span>
    );
  };

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

      {/* Pending SEO Fix action banner */}
      {pendingFix && (
        <div className="bg-indigo-50 border border-indigo-250 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-widest">
              <AlertCircle className="w-4 h-4 text-indigo-600 animate-pulse" /> Pending SEO Fix Action
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1">
              Connect your CMS platform to sync the SEO fix to: <span className="font-mono text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded text-xs select-all">{pendingFix.pageUrl}</span>
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Select WordPress or Shopify below, enter your credentials, and click Connect. Once successful, SoloSpider will automatically return you to the workspace to complete the fix.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("solospider.pending_fix");
                setPendingFix(null);
              }
            }}
            className="text-slate-400 hover:text-red-500 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Cancel Fix
          </button>
        </div>
      )}

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
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950">CMS & E-Commerce Connections</h3>
                <p className="text-xs text-slate-400 font-semibold">Publish generated drafts, products, and articles to your store or blog.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGuidePlatform("wordpress");
                  setShowGuide(true);
                }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-indigo-100 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" /> Setup Guide
              </button>
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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGuidePlatform("wordpress");
                        setShowGuide(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Setup Guide
                    </button>
                    <button type="button" onClick={() => setActiveForm(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
                  </div>
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
                    {wpUrl.toLowerCase().includes(".wordpress.com")
                      ? <>For WordPress.com sites, generate an <strong>Application Password</strong> at <a href="https://wordpress.com/me/security/application-passwords" target="_blank" rel="noopener" className="text-indigo-600 underline">wordpress.com/me/security</a>. Do NOT use your login password.</>
                      : <>Create an <strong>Application Password</strong> in your WP Admin under <strong>Users → Profile → Application Passwords</strong>. Do NOT use your login password.</>}
                  </p>
                </div>
                {verificationResult && (
                  <div className={`rounded-xl p-3 flex items-start gap-2.5 text-[10px] font-semibold ${
                    verificationResult.ok
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {verificationResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <p>{verificationResult.ok ? verificationResult.message : verificationResult.error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending || isVerifying}
                  className="w-full bg-[#21759B] hover:bg-[#1a5b79] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {(addIntegrationMutation.isPending || isVerifying) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isVerifying ? "Verifying..." : editingIntegrationId ? "Verify & Update" : "Verify & Save WordPress Connection"}
                </button>
              </form>
            )}

            {/* Shopify Form */}
            {activeForm === "shopify" && (
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-emerald-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShopifyIcon className="w-5 h-5" />
                    Configure Shopify Store
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGuidePlatform("shopify");
                        setShowGuide(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Setup Guide
                    </button>
                    <button type="button" onClick={() => setActiveForm(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setShopifyConnectMethod("oauth")}
                    className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      shopifyConnectMethod === "oauth" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Auto-Connect (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopifyConnectMethod("manual")}
                    className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      shopifyConnectMethod === "manual" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Manual Access Token
                  </button>
                </div>

                {shopifyConnectMethod === "oauth" ? (
                  /* Auto-Connect Form */
                  <form onSubmit={handleConnectShopifyOAuth} className="space-y-4">
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
                        <label className="text-[10px] font-black uppercase text-slate-400">Client ID (from Shopify Partner / Developer App)</label>
                        <input
                          type="text"
                          placeholder="hex string e.g. b6bab3e7..."
                          value={shopifyClientId}
                          onChange={(e) => setShopifyClientId(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-3 outline-none font-semibold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Client Secret</label>
                        <input
                          type="password"
                          placeholder="shpss_xxxxxxxxxxxxxxxx"
                          value={shopifyClientSecret}
                          onChange={(e) => setShopifyClientSecret(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-3 outline-none font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-slate-600 font-medium leading-relaxed">
                        <p className="font-bold text-slate-800 mb-1">Pre-requisite (App Settings):</p>
                        <p>
                          Ensure your Developer App settings whitelists the redirect URI:<br/>
                          <code className="bg-slate-100 p-0.5 px-1 rounded font-mono text-[9px] text-[#96BF48]">
                            {typeof window !== "undefined" ? `${window.location.origin}/api/seo/shopify-callback` : "http://localhost:3000/api/seo/shopify-callback"}
                          </code>
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isConnectingShopifyOAuth}
                      className="w-full bg-[#96BF48] hover:bg-[#83aa3d] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {isConnectingShopifyOAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {isConnectingShopifyOAuth ? "Connecting to Shopify..." : "Auto-Connect to Shopify"}
                    </button>
                  </form>
                ) : (
                  /* Manual Form */
                  <form onSubmit={handleAddShopify} className="space-y-4">
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
                        In Shopify Admin &rarr; <strong>Settings &rarr; Apps and sales channels &rarr; Develop apps</strong>, configure <strong>write_content</strong> and <strong>write_online_store_pages</strong> API scopes, install the app, then paste the <strong>Admin API access token</strong> (starts with <code>shpat_</code>).
                      </p>
                    </div>

                    {verificationResult && activeForm === "shopify" && (
                      <div className={`rounded-xl p-3 flex items-start gap-2.5 text-[10px] font-semibold ${
                        verificationResult.ok
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          : "bg-red-50 border border-red-200 text-red-700"
                      }`}>
                        {verificationResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <p>{verificationResult.ok ? verificationResult.message : verificationResult.error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={addIntegrationMutation.isPending || isVerifying}
                      className="w-full bg-[#96BF48] hover:bg-[#83aa3d] text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {(addIntegrationMutation.isPending || isVerifying) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {isVerifying ? "Verifying..." : editingIntegrationId ? "Verify & Update" : "Verify & Save Shopify Connection"}
                    </button>
                  </form>
                )}
              </div>
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
                    <div key={int.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-2xl bg-slate-50/20 gap-4 min-w-0 w-full overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                          {isWp ? <WordPressIcon className="w-10 h-10 rounded-xl shadow-sm" /> : isShopify ? <ShopifyIcon className="w-10 h-10 rounded-xl shadow-sm" /> : <MagentoIcon className="w-10 h-10 rounded-xl shadow-sm" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 min-w-0 w-full">
                            <span className="truncate block flex-1 min-w-0">{isWp ? int.credentials?.siteUrl : isShopify ? int.credentials?.shopName : int.credentials?.siteUrl}</span>
                            <span className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/10 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
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

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleEditIntegration(int)}
                          className="border border-slate-200 bg-white hover:border-indigo-200 hover:text-indigo-600 text-slate-500 font-semibold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to disconnect this ${int.platform} integration?`)) {
                              disconnectCmsMutation.mutate(int.id);
                            }
                          }}
                          className="border border-slate-200 bg-white hover:border-red-200 hover:text-red-600 text-slate-500 font-semibold p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Disconnect
                        </button>
                      </div>
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
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950">Social Media API Channels</h3>
                <p className="text-xs text-slate-400 font-semibold">Schedule publishing across connected social networks.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGuidePlatform("wordpress");
                  setShowGuide(true);
                }}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-indigo-100 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" /> Setup Guide
              </button>
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
                    <div className="flex items-center justify-between min-w-0 w-full gap-4">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                          <BrandIcon className="w-9 h-9 rounded-xl shadow-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-black text-slate-800 block truncate">{plat.name}</span>
                          <p className="text-[9px] text-slate-400 font-semibold truncate">{plat.desc}</p>
                        </div>
                      </div>

                      {/* Connect / Connected + Edit buttons */}
                      {isConnected ? (
                        <div className="flex items-center gap-1.5">
                          {renderStatusBadge(connectedAccount)}
                          
                          {/* Change Account / Edit Button */}
                          <button
                            onClick={() => handleSocialConnect(plat.id)}
                            className="p-2 border border-slate-200 rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors cursor-pointer text-slate-500 shadow-sm"
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
                            className="p-2 border border-slate-200 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50/30 transition-colors cursor-pointer text-slate-500 shadow-sm"
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
                        <span className="truncate max-w-[200px]">
                          {connectedAccount?.access_token?.includes("stub") || connectedAccount?.access_token?.includes("mock")
                            ? "Sandbox Mode — no real API calls"
                            : `Account: ${connectedAccount?.handle}`}
                        </span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 
                          {connectedAccount?.access_token?.includes("stub") || connectedAccount?.access_token?.includes("mock")
                            ? "Simulated"
                            : "API Ready"}
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

      {/* Setup Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full border border-slate-100 shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Integration Setup Guide</h3>
                <p className="text-xs text-slate-500 font-semibold">Step-by-step instructions to connect your external platforms</p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex border-b border-slate-100 mt-4">
              <button
                onClick={() => setGuidePlatform("wordpress")}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guidePlatform === "wordpress"
                    ? "border-[#21759B] text-[#21759B]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <WordPressIcon className="w-5 h-5" />
                WordPress
              </button>
              <button
                onClick={() => setGuidePlatform("shopify")}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  guidePlatform === "shopify"
                    ? "border-[#96BF48] text-[#96BF48]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShopifyIcon className="w-5 h-5" />
                Shopify
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4 max-h-[50vh]">
              {guidePlatform === "wordpress" ? (
                <>
                  {/* WordPress Subtabs */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setWpGuideTab("org")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        wpGuideTab === "org"
                          ? "bg-white text-[#21759B] shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Self-Hosted (.org)
                    </button>
                    <button
                      onClick={() => setWpGuideTab("com")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        wpGuideTab === "com"
                          ? "bg-white text-[#21759B] shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Hosted (WordPress.com)
                    </button>
                  </div>

                  {/* WordPress Warning Alert */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                      <span className="font-bold text-amber-700">Important Security Requirement:</span> You must use an <strong>Application Password</strong> instead of your regular site account password. Main logins will fail verification for security reasons.
                    </div>
                  </div>

                  {wpGuideTab === "org" ? (
                    // WordPress.org Steps
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">1</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Log in to WP Admin</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Navigate to your WordPress dashboard (e.g. <code>https://your-site.com/wp-admin</code>) and sign in.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">2</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Go to your Profile settings</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">In the left-hand sidebar menu, click on <strong>Users</strong> → <strong>Profile</strong> (or edit the user profile you plan to publish with).</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">3</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Generate Application Password</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Scroll to the bottom of the page to find the <strong>Application Passwords</strong> section. Enter a name (e.g., <code>SoloSpider</code>) and click <strong>Add New Application Password</strong>.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">4</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Copy the password</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Copy the newly generated 24-character password (separated by spaces, e.g. <code>xxxx xxxx xxxx xxxx xxxx xxxx</code>). Keep it safe as you will not see it again.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">5</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Save connection in SoloSpider</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Enter your website base URL, your WordPress username (or admin email), and paste the copied Application Password. Click <strong>Verify & Save Connection</strong>.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // WordPress.com Steps
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">1</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Log in & Go to Security Settings</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Log in to WordPress.com and navigate to the <strong>Two-Step Authentication</strong> page: <a href="https://wordpress.com/me/security/two-step" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">wordpress.com/me/security/two-step <ExternalLink className="w-3 h-3" /></a></p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">2</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Enable Two-Step Authentication (2FA)</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">WordPress.com requires 2FA to be active to use application passwords. If not enabled, turn on 2FA using your mobile number or authenticator app.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">3</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Generate WordPress.com App Password</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Once 2FA is active, navigate to the <strong>Application Passwords</strong> page: <a href="https://wordpress.com/me/security/application-passwords" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">wordpress.com/me/security/application-passwords <ExternalLink className="w-3 h-3" /></a></p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">4</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Name and generate password</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Enter an application name (e.g. <code>SoloSpider</code>) and click <strong>Generate Password</strong>. Copy the 16-character string immediately.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">5</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Save connection in SoloSpider</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Enter your blog site URL (e.g. <code>https://solospiderai.wordpress.com</code>), your WordPress.com email address/username, and paste the 16-character generated password.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Shopify Subtabs */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setShopifyGuideTab("standard")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        shopifyGuideTab === "standard"
                          ? "bg-white text-[#96BF48] shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Merchant Store (Custom App)
                    </button>
                    <button
                      onClick={() => setShopifyGuideTab("partner")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        shopifyGuideTab === "partner"
                          ? "bg-white text-[#96BF48] shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Developer Partners (App Dashboard)
                    </button>
                  </div>

                  {/* Shopify Warning Alert */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                      <span className="font-bold text-amber-700">Important Credentials Note:</span> In SoloSpider, you must enter the **Admin API Access Token** (starts with <code>shpat_</code>). Do <strong>NOT</strong> enter your Shopify API Client Secret or API Key.
                    </div>
                  </div>

                  {shopifyGuideTab === "standard" ? (
                    // Shopify Custom App steps
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">1</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Log in to Shopify Store Admin</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Log in to your store admin panel at <code>admin.shopify.com</code>.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">2</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Navigate to Custom App settings</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Click on <strong>Settings</strong> (bottom left gear) → <strong>Apps and sales channels</strong> → <strong>Develop apps</strong> (top right), then click <strong>Create an app</strong>.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">3</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Configure Scopes</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Click **Configure Admin API scopes**. Scroll down and check <strong>write_content</strong> and <strong>read_content</strong> permissions, then click <strong>Save</strong>.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">4</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Install Custom App</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Go to the **API credentials** tab, and click **Install app** (confirm the installation popup).</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">5</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Copy Admin API access token</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Under **Admin API access token**, click **Reveal token once** and copy it (it starts with <code>shpat_</code>). Keep it safe as Shopify only displays it once.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">6</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Save connection in SoloSpider</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Enter your store URL (e.g. <code>my-store.myshopify.com</code>) and paste the token. Click **Verify & Save Shopify Connection**.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Shopify Partner Store steps
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">1</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Log in to Shopify Dev Dashboard</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Navigate to Shopify Dev Dashboard: <a href="https://dev.shopify.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">dev.shopify.com <ExternalLink className="w-3 h-3" /></a>, log in, and go to **Apps** → click **Create app**.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">2</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Set Allowed URLs</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Under **Client credentials**, set **App URL** to <code>https://example.com</code> and **Allowed redirection URLs** to <code>https://example.com/auth/callback</code>.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">3</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Configure Scopes</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Under **API Access** or **Versions/Scopes**, select the scopes: <code>write_content</code> and <code>read_content</code>, then click save.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">4</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Perform App Authorization</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Visit this URL in a new browser tab to trigger the installation flow:</p>
                          <pre className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-[9px] font-mono whitespace-pre-wrap break-all mt-1 select-all">
                            {"https://{your-store}.myshopify.com/admin/oauth/authorize?client_id={client_id}&scope=write_content,read_content&redirect_uri=https://example.com/auth/callback"}
                          </pre>
                          <p className="text-[9px] text-slate-400 font-medium mt-1">Replace <code>{`{your-store}`}</code> with store handle (e.g. <code>uw0abf-vd</code>) and <code>{`{client_id}`}</code> with Client ID from App settings.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center mt-0.5">5</div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Retrieve code and exchange</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">After hitting Install, copy the authorization code from the redirected browser URL parameter (e.g. <code>?code=CODE</code>) and exchange it to retrieve the permanent Admin API access token (starts with <code>shpat_</code>).</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
