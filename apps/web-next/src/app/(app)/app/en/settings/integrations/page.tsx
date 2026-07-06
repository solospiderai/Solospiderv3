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
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FolderKanban,
  RefreshCw,
  Info,
  ChevronDown
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

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="5" fill="#24292e" />
    <path d="M12 5c-3.87 0-7 3.13-7 7 0 3.09 2 5.71 4.77 6.64.35.06.48-.15.48-.34v-1.2c-1.95.42-2.36-.94-2.36-.94-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.73 1.07.73.63 1.08 1.65.77 2.05.59.06-.46.25-.77.45-.95-1.55-.18-3.18-.78-3.18-3.47 0-.76.27-1.39.72-1.88-.07-.18-.31-.89.07-1.86 0 0 .59-.19 1.93.72a6.7 6.7 0 0 1 3.5 0c1.34-.91 1.93-.72 1.93-.72.38.97.14 1.68.07 1.86.45.49.72 1.12.72 1.88 0 2.7-1.63 3.29-3.19 3.46.25.22.48.65.48 1.32v1.96c0 .19.13.41.49.34C17 17.71 19 15.09 19 12c0-3.87-3.13-7-7-7z" fill="white" />
  </svg>
);

export default function IntegrationsSettingsPage() {
  const { activeProject, isLoading: isProjectLoading } = useProjects();
  const { user, loading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // Active form view: "wordpress" | "shopify" | "magento" | "meta_ads" | "google_ads" | "google_search_console" | "github" | null
  const [activeForm, setActiveForm] = useState<"wordpress" | "shopify" | "magento" | "meta_ads" | "google_ads" | "google_search_console" | "github" | null>(null);
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

  // GitHub form states
  const [githubToken, setGithubToken] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");

  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    const cleanUrl = url.trim().replace(/\.git$/, "");
    const httpsMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i);
    if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };
    const sshMatch = cleanUrl.match(/git@github\.com:([^\/]+)\/([^\/]+)/i);
    if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };
    const parts = cleanUrl.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) return { owner: parts[0], repo: parts[1] };
    return null;
  };

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

  // Meta Ads form states
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");

  // Google Ads form states
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");

  // Google Search Console form states
  const [gscClientId, setGscClientId] = useState("");
  const [gscClientSecret, setGscClientSecret] = useState("");
  const [gscRefreshToken, setGscRefreshToken] = useState("");
  const [showGscGuide, setShowGscGuide] = useState(false);

  // Verification states
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

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

  // General Add Integration mutation
  const addIntegrationMutation = useMutation({
    mutationFn: async (payload: { platform: string; credentials: any }) => {
      if (!user) throw new Error("Not authenticated");
      
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
      setMetaAdAccountId("");
      setMetaAccessToken("");
      setGoogleCustomerId("");
      setGoogleDeveloperToken("");
      setGoogleClientId("");
      setGoogleClientSecret("");
      setGoogleRefreshToken("");
      setGscClientId("");
      setGscClientSecret("");
      setGscRefreshToken("");

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

  const handleAddGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !githubUrl) {
      toast.error("Please fill in both GitHub Token and Repository URL.");
      return;
    }
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      toast.error("Invalid GitHub URL. Use format: https://github.com/owner/repo");
      return;
    }
    const creds = {
      token: githubToken.trim(),
      owner: parsed.owner,
      repo: parsed.repo,
      branch: githubBranch.trim() || "main"
    };

    const result = await verifyCredentials("github", creds);
    if (!result.ok) {
      toast.error("GitHub verification failed", { description: result.error });
      return;
    }

    addIntegrationMutation.mutate({ platform: "github", credentials: creds });
  };

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
    let cleanShop = shopifyShopName.trim().replace(/https?:\/\//, "").replace(/\/$/, "");
    if (!cleanShop.includes(".myshopify.com")) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }
    const creds = {
      shopName: cleanShop.replace(".myshopify.com", ""),
      accessToken: shopifyAccessToken.trim()
    };

    const result = await verifyCredentials("shopify", creds);
    if (!result.ok) {
      toast.error("Shopify verification failed", { description: result.error });
      return;
    }

    addIntegrationMutation.mutate({ platform: "shopify", credentials: creds });
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

  const handleAddMetaAds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaAdAccountId || !metaAccessToken) {
      toast.error("Please fill in both Ad Account ID and Access Token.");
      return;
    }
    const creds = {
      adAccountId: metaAdAccountId.trim(),
      accessToken: metaAccessToken.trim()
    };
    addIntegrationMutation.mutate({ platform: "meta_ads", credentials: creds });
  };

  const handleAddGoogleAds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleCustomerId || !googleDeveloperToken || !googleClientId || !googleClientSecret || !googleRefreshToken) {
      toast.error("Please fill in all Google Ads fields.");
      return;
    }
    const creds = {
      customerId: googleCustomerId.trim(),
      developerToken: googleDeveloperToken.trim(),
      clientId: googleClientId.trim(),
      clientSecret: googleClientSecret.trim(),
      refreshToken: googleRefreshToken.trim()
    };
    addIntegrationMutation.mutate({ platform: "google_ads", credentials: creds });
  };

  const handleSocialConnect = (platform: string) => {
    if (!activeProject) {
      toast.error("Please select a project from the dashboard before connecting social accounts.");
      return;
    }
    
    const oauthWindow = window.open(
      `/api/social/connect/${platform}?projectId=${activeProject.id}`,
      "_blank"
    );

    const checkTimer = setInterval(() => {
      if (!oauthWindow || oauthWindow.closed) {
        clearInterval(checkTimer);
        queryClient.invalidateQueries({ queryKey: ["social_accounts_settings", activeProject.id] });
        toast.info(`Refreshed connected ${platform} profiles.`);
      }
    }, 1000);
  };

  const handleAddGoogleSearchConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gscClientId || !gscClientSecret || !gscRefreshToken) {
      toast.error("Please fill in all Google Search Console credential fields.");
      return;
    }
    const creds = {
      clientId: gscClientId.trim(),
      clientSecret: gscClientSecret.trim(),
      refreshToken: gscRefreshToken.trim(),
    };

    const result = await verifyCredentials("google_search_console", creds);
    if (!result.ok) {
      toast.error("Google Search Console verification failed", { description: result.error });
      return;
    }

    addIntegrationMutation.mutate({ platform: "google_search_console", credentials: creds });
    setActiveForm(null);
  };

  const handleEditIntegration = (integration: any) => {
    setEditingIntegrationId(integration.id);
    setVerificationResult(null);
    
    if (integration.platform === "wordpress") {
      setWpUrl(integration.credentials?.siteUrl || "");
      setWpUsername(integration.credentials?.username || "");
      setWpPassword("");
      setActiveForm("wordpress");
    } else if (integration.platform === "shopify") {
      setShopifyShopName(integration.credentials?.shopName || "");
      setShopifyAccessToken("");
      setActiveForm("shopify");
    } else if (integration.platform === "magento") {
      setMagentoUrl(integration.credentials?.siteUrl || "");
      setMagentoToken("");
      setActiveForm("magento");
    } else if (integration.platform === "google_search_console") {
      setGscClientId(integration.credentials?.clientId || "");
      setGscClientSecret("");
      setGscRefreshToken("");
      setActiveForm("google_search_console");
    }
  };

  const isPageLoading = isProjectLoading || isAuthLoading;
  const allConnectedIntegrations = cmsIntegrationsQuery.data || [];
  const connectedIntegrations = allConnectedIntegrations.filter((int: any) => ["wordpress", "shopify", "magento"].includes(int.platform));
  const connectedAdsIntegrations = allConnectedIntegrations.filter((int: any) => ["meta_ads", "google_ads"].includes(int.platform));
  const connectedSocials = socialAccountsQuery.data || [];

  if (isPageLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-655" />
      </div>
    );
  }

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

  const isPlatformConnected = (platform: string) => {
    return allConnectedIntegrations.some((int: any) => int.platform === platform);
  };

  const getPlatformDetails = (platform: string) => {
    return allConnectedIntegrations.find((int: any) => int.platform === platform);
  };

  const quickViewPlatforms = [
    { id: "wordpress", name: "WordPress", icon: WordPressIcon },
    { id: "shopify", name: "Shopify", icon: ShopifyIcon },
    { id: "magento", name: "Magento", icon: MagentoIcon },
    { id: "github", name: "GitHub", icon: GitHubIcon },
    { id: "google_search_console", name: "Search Console", icon: (props: any) => (
      <svg className="w-5 h-5 text-blue-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 animate-slide-in">
      
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Plug className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-100 text-violet-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-violet-200">
                Setup Integrations
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Connections & Integrations</h1>
            <p className="mt-1.5 max-w-2xl text-xs font-semibold text-slate-500 leading-normal">
              Direct connection interface for all store channels, paid advertisements, search console tracking, and social media posting.
            </p>
          </div>
        </div>
      </header>

      {/* Quick View Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {quickViewPlatforms.map((p) => {
          const connected = isPlatformConnected(p.id);
          const details = getPlatformDetails(p.id);
          const Icon = p.icon;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActiveForm(activeForm === p.id ? null : (p.id as any));
              }}
              className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                connected 
                  ? "bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-200 shadow-sm" 
                  : "bg-white hover:bg-slate-50/60 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className={`text-[8px] font-black uppercase tracking-wider ${connected ? "text-emerald-700" : "text-slate-400"}`}>
                    {connected ? "Active" : "Offline"}
                  </span>
                </div>
              </div>
              <p className="mt-3.5 text-xs font-black text-slate-800">{p.name}</p>
              <p className="text-[9px] text-slate-450 font-bold truncate w-full mt-0.5">
                {connected 
                  ? (p.id === "wordpress" ? details?.credentials?.siteUrl 
                     : p.id === "shopify" ? `${details?.credentials?.shopName}.myshopify.com` 
                     : p.id === "github" ? `${details?.credentials?.owner}/${details?.credentials?.repo}` 
                     : "Verified & Connected")
                  : "Setup Integration"
                }
              </p>
            </button>
          );
        })}
      </div>

      {/* Pending SEO Fix Action Banner */}
      {pendingFix && (
        <div className="bg-indigo-50 border border-indigo-250 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in shadow-sm">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 tracking-widest">
              <AlertCircle className="w-4 h-4 text-indigo-605 animate-pulse" /> Pending SEO Fix Action
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1">
              Connect WordPress, Shopify, or GitHub to automatically sync the SEO fix to: <span className="font-mono text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded text-xs select-all">{pendingFix.pageUrl}</span>
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
            className="text-slate-450 hover:text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 transition-colors cursor-pointer"
          >
            Cancel Fix
          </button>
        </div>
      )}

      {/* Unified Screen Workspace Grid */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">

        {/* Column 1: Store Integrations & Paid Campaigns */}
        <div className="space-y-8">
          
          {/* Card 1: CMS & Store Fronts */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">CMS & Stores</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Publish generated drafts and sync products directly.</p>
            </div>

            {/* Platform Selection Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setActiveForm(activeForm === "wordpress" ? null : "wordpress")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "wordpress" ? "border-[#21759B] bg-[#21759B]/5 text-[#1e6180]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <WordPressIcon className="w-5 h-5" />
                WordPress
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "shopify" ? null : "shopify")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "shopify" ? "border-[#96BF48] bg-[#96BF48]/5 text-[#5e8e3e]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <ShopifyIcon className="w-5 h-5" />
                Shopify
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "magento" ? null : "magento")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "magento" ? "border-[#EE672F] bg-[#EE672F]/5 text-[#c65120]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <MagentoIcon className="w-5 h-5" />
                Magento
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "github" ? null : "github")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "github" ? "border-slate-800 bg-slate-900/5 text-slate-850" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <GitHubIcon className="w-5 h-5" />
                GitHub
              </button>
            </div>

            {/* WordPress Form */}
            {activeForm === "wordpress" && (
              <form onSubmit={handleAddWordPress} className="bg-slate-50/50 rounded-2xl p-4 border border-indigo-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">WordPress Setup</h4>
                
                {/* Embedded WordPress Step-by-Step Guide */}
                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5 text-[11px]">
                  <p className="font-extrabold text-indigo-700 uppercase tracking-wide text-[9px]">How to connect:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-500 font-medium leading-relaxed">
                    <li>Log in to your WordPress dashboard.</li>
                    <li>Go to <strong className="text-slate-700">Users &rarr; Profile</strong> in the left-hand menu.</li>
                    <li>Scroll to the bottom, type a name (e.g. <code className="bg-slate-100 px-1 rounded">SoloSpider</code>) and click <strong className="text-slate-700">Add New Application Password</strong>.</li>
                    <li>Copy the 24-character password and paste it below with your URL and login username.</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="WordPress Site URL (https://myblogsite.com)"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="WP Admin Username"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                  <input
                    type="password"
                    placeholder="Application Password (xxxx xxxx xxxx xxxx)"
                    value={wpPassword}
                    onChange={(e) => setWpPassword(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending || isVerifying}
                  className="w-full bg-[#21759B] hover:bg-[#1a5b78] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {(addIntegrationMutation.isPending || isVerifying) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isVerifying ? "Verifying..." : "Verify & Save Connection"}
                </button>
              </form>
            )}

            {/* Shopify Form */}
            {activeForm === "shopify" && (
              <form onSubmit={handleAddShopify} className="bg-slate-50/50 rounded-2xl p-4 border border-lime-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">Shopify Custom App</h4>

                {/* Embedded Shopify Custom App Guide */}
                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5 text-[11px]">
                  <p className="font-extrabold text-lime-700 uppercase tracking-wide text-[9px]">How to connect:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-500 font-medium leading-relaxed">
                    <li>In Shopify, go to <strong className="text-slate-700">Settings &rarr; Apps and sales channels &rarr; Develop apps</strong>.</li>
                    <li>Click <strong className="text-slate-700">Create an app</strong>, configure scopes for <code className="bg-slate-100 px-1 rounded">write_content</code>, and install it.</li>
                    <li>Copy the revealed <strong className="text-slate-700">Admin API access token</strong> (starts with <code className="bg-slate-100 px-1 rounded">shpat_</code>) and paste below.</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="shopify-store-handle"
                      value={shopifyShopName}
                      onChange={(e) => setShopifyShopName(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                    />
                    <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200">.myshopify.com</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Admin API Access Token (shpat_...)"
                    value={shopifyAccessToken}
                    onChange={(e) => setShopifyAccessToken(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-[#96BF48] rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending || isVerifying}
                  className="w-full bg-[#96BF48] hover:bg-[#83aa3d] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {(addIntegrationMutation.isPending || isVerifying) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isVerifying ? "Verifying..." : "Verify & Save Shopify"}
                </button>
              </form>
            )}

            {/* Magento Form */}
            {activeForm === "magento" && (
              <form onSubmit={handleAddMagento} className="bg-slate-50/50 rounded-2xl p-4 border border-orange-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">Magento Setup</h4>
                
                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 text-[11px]">
                  <p className="font-extrabold text-orange-700 uppercase tracking-wide text-[9px]">How to connect:</p>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Create an integration in Magento panel under <strong className="text-slate-700">System &rarr; Extensions &rarr; Integrations</strong>, authorize it, and copy the access token below.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Magento Store Endpoint URL"
                    value={magentoUrl}
                    onChange={(e) => setMagentoUrl(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-[#EE672F] rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                  <input
                    type="password"
                    placeholder="Magento Access Token"
                    value={magentoToken}
                    onChange={(e) => setMagentoToken(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-[#EE672F] rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#EE672F] hover:bg-[#d65a25] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Verify & Save Magento
                </button>
              </form>
            )}

            {/* GitHub Form */}
            {activeForm === "github" && (
              <form onSubmit={handleAddGitHub} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-300 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">GitHub Repository Sync</h4>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-[11.5px] text-slate-600">
                  <p className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    🔑 How to get your GitHub Personal Access Token (PAT):
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-1.5 font-medium leading-relaxed">
                    <li>Go to <strong className="text-slate-800">github.com</strong> &rarr; click your profile picture (top-right) &rarr; <strong className="text-slate-800">Settings</strong>.</li>
                    <li>On the far left sidebar, scroll down to the bottom and click <strong className="text-slate-800">Developer settings</strong>.</li>
                    <li>Click <strong className="text-slate-800">Personal access tokens</strong> &rarr; select <strong className="text-slate-800">Tokens (classic)</strong>.</li>
                    <li>Click <strong className="text-slate-800">Generate new token</strong> &rarr; <strong className="text-slate-850">Generate new token (classic)</strong>.</li>
                    <li>Enter a name (e.g. <code>Solo Spider</code>), check the <code className="bg-slate-100 px-1 rounded">repo</code> scope box, scroll down and click <strong className="text-slate-800">Generate token</strong>.</li>
                    <li>Copy your token (starts with <code>ghp_</code>) and paste it below.</li>
                  </ol>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="password"
                    placeholder="GitHub Personal Access Token (ghp_...)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-slate-800 rounded-xl p-3 outline-none font-semibold text-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="GitHub Repository URL (e.g. https://github.com/my-org/my-website-repo)"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-slate-800 rounded-xl p-3 outline-none font-semibold text-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Branch (default: main)"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-slate-800 rounded-xl p-3 outline-none font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending || isVerifying}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {(addIntegrationMutation.isPending || isVerifying) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isVerifying ? "Verifying..." : "Verify & Save GitHub"}
                </button>
              </form>
            )}

            {/* List Connected CMS / Store Integrations */}
            {connectedIntegrations && connectedIntegrations.length > 0 ? (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {connectedIntegrations.map((int: any) => {
                  const isWp = int.platform === "wordpress";
                  const isShopify = int.platform === "shopify";
                  const isGithub = int.platform === "github";

                  return (
                    <div key={int.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/30 gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          {isWp ? (
                            <WordPressIcon className="w-8 h-8 rounded-lg shadow-sm" />
                          ) : isShopify ? (
                            <ShopifyIcon className="w-8 h-8 rounded-lg shadow-sm" />
                          ) : isGithub ? (
                            <GitHubIcon className="w-8 h-8 rounded-lg shadow-sm" />
                          ) : (
                            <MagentoIcon className="w-8 h-8 rounded-lg shadow-sm" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-800 capitalize leading-none">{int.platform}</p>
                          <p className="text-[9px] text-slate-450 font-semibold truncate mt-1">
                            {isWp
                              ? int.credentials?.siteUrl
                              : isShopify
                              ? `${int.credentials?.shopName}.myshopify.com`
                              : isGithub
                              ? `${int.credentials?.owner}/${int.credentials?.repo} (${int.credentials?.branch || "main"})`
                              : "Magento Store Connected"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditIntegration(int)}
                          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-semibold p-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to disconnect this ${int.platform} integration?`)) {
                              disconnectCmsMutation.mutate(int.id);
                            }
                          }}
                          className="border border-slate-200 bg-white hover:border-red-200 hover:text-red-650 text-slate-500 font-semibold p-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Disconnect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Card 2: Google Search Console */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Google Search Console</h3>
              <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Sync search volume, impressions, keywords, and backlinks.</p>
            </div>

            {/* GSC Form and Collapsible Guide */}
            {activeForm === "google_search_console" && (
              <div className="space-y-4 animate-in slide-in-from-top-3 duration-200 bg-slate-50/40 p-4 border border-slate-200/60 rounded-2xl">
                <h4 className="text-[11px] font-black uppercase text-slate-700">Google Search Console Setup</h4>

                {/* Collapsible Guide Trigger */}
                <button
                  type="button"
                  onClick={() => setShowGscGuide(!showGscGuide)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-750 font-bold text-[10px] rounded-lg transition-all cursor-pointer border-0"
                >
                  📖 {showGscGuide ? "Hide Connection Guide" : "Show Setup Guide"}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showGscGuide ? "rotate-180" : ""}`} />
                </button>

                {/* Collapsible Step-by-Step Guide */}
                {showGscGuide && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-[11px] text-slate-600 animate-in fade-in duration-200">
                    <p className="font-extrabold text-blue-700 uppercase tracking-wide text-[9px]">GSC Connection Steps:</p>
                    <ol className="list-decimal pl-4.5 space-y-1.5 font-medium leading-relaxed">
                      <li>Make sure your website domain is verified on <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-blue-650 underline font-bold">Google Search Console</a>.</li>
                      <li>Open the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-blue-650 underline font-bold">OAuth Consent Screen</a> in Google Cloud. Choose <strong className="text-slate-700">External</strong>, fill in the details, and add the Search Console Google email under <strong className="text-slate-700">Test Users</strong>.</li>
                      <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-650 underline font-bold">Credentials Page</a>, create an OAuth client ID for Web App, and add <code className="bg-slate-100 px-1 rounded text-slate-700">https://developers.google.com/oauthplayground</code> under Redirect URIs.</li>
                      <li>Open <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-blue-650 underline font-bold">OAuth Playground</a>, check use own credentials, select Webmasters API, authorize, and exchange the code to get your Refresh Token.</li>
                    </ol>
                  </div>
                )}

                <form onSubmit={handleAddGoogleSearchConsole} className="space-y-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Client ID (from Google Cloud Console)"
                      value={gscClientId}
                      onChange={(e) => setGscClientId(e.target.value)}
                      className="w-full text-[11px] font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Client Secret"
                      value={gscClientSecret}
                      onChange={(e) => setGscClientSecret(e.target.value)}
                      className="w-full text-[11px] font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Refresh Token"
                      value={gscRefreshToken}
                      onChange={(e) => setGscRefreshToken(e.target.value)}
                      className="w-full text-[11px] font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  {verificationResult && (
                    <div className={`p-2.5 rounded-xl border text-[10px] font-bold flex gap-2 items-center ${
                      verificationResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                      {verificationResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{verificationResult.message || verificationResult.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifying || addIntegrationMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {(isVerifying || addIntegrationMutation.isPending) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Connection...
                      </>
                    ) : (
                      "Save & Connect"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* GSC Actions / Status */}
            {(() => {
              const gsc = allConnectedIntegrations.find((int: any) => int.platform === "google_search_console");
              return (
                <div className="flex items-center justify-between border-t border-slate-150 pt-3.5">
                  {gsc ? (
                    <>
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditIntegration(gsc)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to disconnect Google Search Console?")) {
                              disconnectCmsMutation.mutate(gsc.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200/50 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Not Connected
                      </span>
                      <button
                        onClick={() => setActiveForm(activeForm === "google_search_console" ? null : "google_search_console")}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        {activeForm === "google_search_console" ? "Close Setup" : "Connect Search Console"}
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

        </div>

        {/* Column 2: Paid Campaigns & Social Channels */}
        <div className="space-y-8">
          
          {/* Card 3: Paid Ads (Google & Meta) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Paid Campaigns</h3>
              <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Optimize copy, track conversion statistics, and deploy campaigns.</p>
            </div>

            {/* Selection buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveForm(activeForm === "meta_ads" ? null : "meta_ads")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "meta_ads" ? "border-[#0064E0] bg-[#0064E0]/5 text-[#0064E0]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                Meta Ads
              </button>
              <button
                onClick={() => setActiveForm(activeForm === "google_ads" ? null : "google_ads")}
                className={`flex flex-col items-center gap-2 p-2.5 border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                  activeForm === "google_ads" ? "border-[#FFCC00] bg-[#FFCC00]/5 text-[#9e7a00]" : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                Google Ads
              </button>
            </div>

            {/* Meta Ads Form */}
            {activeForm === "meta_ads" && (
              <form onSubmit={handleAddMetaAds} className="bg-slate-50/50 rounded-2xl p-4 border border-blue-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">Meta Ads Config</h4>

                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5 text-[11px]">
                  <p className="font-extrabold text-blue-750 uppercase tracking-wide text-[9px]">Meta Connection Steps:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-500 font-medium leading-relaxed">
                    <li>Find your Ad Account ID in Meta Ads Manager dashboard.</li>
                    <li>Generate a User / System access token under Developer Apps in <strong className="text-slate-700">developers.facebook.com</strong> with scopes: <code className="bg-slate-100 px-0.5">ads_management</code>, <code className="bg-slate-100 px-0.5">ads_read</code>.</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Meta Ad Account ID (act_xxxxxxxxxxxx)"
                    value={metaAdAccountId}
                    onChange={(e) => setMetaAdAccountId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                  <input
                    type="password"
                    placeholder="System User Access Token"
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#0064E0] hover:bg-[#0052b4] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Save Meta Ads
                </button>
              </form>
            )}

            {/* Google Ads Form */}
            {activeForm === "google_ads" && (
              <form onSubmit={handleAddGoogleAds} className="bg-slate-50/50 rounded-2xl p-4 border border-yellow-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <h4 className="text-[11px] font-black uppercase text-slate-700">Google Ads Credentials</h4>

                <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-1 text-[10px] text-slate-550 font-medium leading-relaxed">
                  <p className="font-extrabold text-[#9e7a00] uppercase tracking-wide text-[9px] mb-1">Google API Keys:</p>
                  <p>Customer ID: Your 10-digit Google Ads Account number.</p>
                  <p>Developer Token: Obtained from Google Ads API Center.</p>
                  <p>Client ID / Secret: Created in Google Cloud Console Credentials.</p>
                  <p>Refresh Token: Obtained via OAuth consent authorization flow.</p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Customer ID"
                      value={googleCustomerId}
                      onChange={(e) => setGoogleCustomerId(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-yellow-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                    />
                    <input
                      type="password"
                      placeholder="Developer Token"
                      value={googleDeveloperToken}
                      onChange={(e) => setGoogleDeveloperToken(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-yellow-500 rounded-xl p-2.5 outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Client ID"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-yellow-500 rounded-xl p-2.5 outline-none font-semibold text-slate-880"
                  />
                  <input
                    type="password"
                    placeholder="Client Secret"
                    value={googleClientSecret}
                    onChange={(e) => setGoogleClientSecret(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-yellow-500 rounded-xl p-2.5 outline-none font-semibold text-slate-880"
                  />
                  <input
                    type="password"
                    placeholder="Refresh Token"
                    value={googleRefreshToken}
                    onChange={(e) => setGoogleRefreshToken(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 focus:border-yellow-500 rounded-xl p-2.5 outline-none font-semibold text-slate-880"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addIntegrationMutation.isPending}
                  className="w-full bg-[#FFCC00] hover:bg-[#e6b800] text-slate-900 text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Save Google Ads
                </button>
              </form>
            )}

            {/* Connected Ads Integrations list */}
            {connectedAdsIntegrations && connectedAdsIntegrations.length > 0 ? (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                {connectedAdsIntegrations.map((int: any) => {
                  const isMeta = int.platform === "meta_ads";
                  return (
                    <div key={int.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/30 gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-850 capitalize leading-none">{isMeta ? "Meta Ads Connection" : "Google Ads Connection"}</p>
                          <p className="text-[9px] text-slate-450 font-semibold truncate mt-1">
                            {isMeta ? `Ad Account: ${int.credentials?.adAccountId}` : `Customer ID: ${int.credentials?.customerId}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to disconnect this ads integration?`)) {
                            disconnectCmsMutation.mutate(int.id);
                          }
                        }}
                        className="border border-slate-200 bg-white hover:border-red-200 hover:text-red-600 text-slate-500 font-semibold p-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Card 4: Social Channels */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Social Channels</h3>
              <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Auto-schedule posts and track engagement stats across handles.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "linkedin", name: "LinkedIn Profile", desc: "Share updates and articles", customIcon: LinkedInIcon },
                { id: "twitter", name: "X (Twitter) Profile", desc: "Share tweets and threads", customIcon: XIcon },
                { id: "instagram", name: "Instagram Profile", desc: "Auto-share carousel updates", customIcon: InstagramIcon },
                { id: "facebook", name: "Facebook Page", desc: "Share campaign announcements", customIcon: FacebookIcon },
                { id: "pinterest", name: "Pinterest Board", desc: "Auto-pin graphics and links", customIcon: PinterestIcon }
              ].map((plat) => {
                const connectedAccount = connectedSocials.find((acc: any) => acc.platform === plat.id);
                const isConnected = Boolean(connectedAccount);
                const BrandIcon = plat.customIcon;

                return (
                  <div key={plat.id} className="p-3.5 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          <BrandIcon className="w-8 h-8 rounded-lg shadow-sm" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-slate-800 block truncate">{plat.name}</span>
                          <p className="text-[9px] text-slate-450 font-semibold truncate leading-none mt-1">{plat.desc}</p>
                        </div>
                      </div>

                      {isConnected ? (
                        <div className="flex items-center gap-1">
                          {renderStatusBadge(connectedAccount)}
                          <button
                            onClick={() => handleSocialConnect(plat.id)}
                            className="p-1 border border-slate-200 rounded-lg hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-pointer text-slate-450"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to disconnect this ${plat.name} account?`)) {
                                disconnectSocialMutation.mutate(connectedAccount.id);
                              }
                            }}
                            className="p-1 border border-slate-200 rounded-lg hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer text-slate-450"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSocialConnect(plat.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                        >
                          Connect
                        </button>
                      )}
                    </div>

                    {isConnected && (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-2 text-[9px] font-semibold text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">
                          {connectedAccount?.access_token?.includes("stub") || connectedAccount?.access_token?.includes("mock")
                            ? "Sandbox Mode"
                            : `Account: ${connectedAccount?.handle}`}
                        </span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> API Ready
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
