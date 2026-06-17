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
  Linkedin, 
  Twitter, 
  FolderKanban,
  FileCode2,
  ExternalLink
} from "lucide-react";

export default function IntegrationsSettingsPage() {
  const { activeProject, isLoading: isProjectLoading } = useProjects();
  const { user, loading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // WordPress form states
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [isAddingWp, setIsAddingWp] = useState(false);

  // Fetch connected CMS/WordPress integrations
  const cmsIntegrationsQuery = useQuery({
    queryKey: ["cms_integrations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_integrations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("platform", "wordpress");
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

  // Add WordPress Integration mutation
  const addWpMutation = useMutation({
    mutationFn: async (payload: { url: string; username: string; appPassword: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Basic sanitization
      let cleanUrl = payload.url.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      if (cleanUrl.endsWith("/")) {
        cleanUrl = cleanUrl.slice(0, -1);
      }

      const { data, error } = await supabase
        .from("workspace_integrations")
        .insert({
          user_id: user.id,
          platform: "wordpress",
          credentials: {
            siteUrl: cleanUrl,
            username: payload.username.trim(),
            appPassword: payload.appPassword.trim()
          },
          is_active: true
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms_integrations", user?.id] });
      toast.success("WordPress integration connected successfully!");
      setWpUrl("");
      setWpUsername("");
      setWpPassword("");
      setIsAddingWp(false);
    },
    onError: (err: any) => {
      toast.error("Failed to add WordPress integration", { description: err.message });
    }
  });

  // Disconnect CMS Integration mutation
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
    addWpMutation.mutate({ url: wpUrl, username: wpUsername, appPassword: wpPassword });
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
        toast.info("Refreshed connected social profiles.");
      }
    }, 1000);
  };

  const isPageLoading = isProjectLoading || isAuthLoading;
  const connectedCmsCount = cmsIntegrationsQuery.data?.length || 0;
  const connectedSocials = socialAccountsQuery.data || [];

  if (isPageLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
              Connect external CMS networks for long-form publishing, and authorize social API channels for scheduling updates.
            </p>
          </div>
        </div>
      </header>

      {/* Top HUD Cards (Metrics) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Project Card */}
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

        {/* CMS Integrations Metric Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Globe className="w-14 h-14 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Globe className="h-4 w-4 text-indigo-500" />
            Connected CMS Networks
          </div>
          <p className="mt-3 text-lg font-black text-slate-900">{connectedCmsCount}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">WordPress endpoints active</p>
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
        
        {/* Left Column: CMS Connections & WordPress Setup Forms (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-950">CMS Content Publishing</h3>
                <p className="text-xs text-slate-400 font-semibold">Publish generated drafts straight to your blog.</p>
              </div>
              {!isAddingWp && (
                <button
                  onClick={() => setIsAddingWp(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" /> Connect WordPress
                </button>
              )}
            </div>

            {/* Connection Form Inline Drawer */}
            {isAddingWp && (
              <form onSubmit={handleAddWordPress} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 space-y-4 animate-in slide-in-from-top-3 duration-250">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-indigo-500" />
                    Configure WordPress site
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingWp(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">WordPress Site URL</label>
                    <input
                      type="text"
                      placeholder="https://myblogsite.com"
                      value={wpUrl}
                      onChange={(e) => setWpUrl(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none"
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
                        className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Application Password</label>
                      <input
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={wpPassword}
                        onChange={(e) => setWpPassword(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none"
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
                  disabled={addWpMutation.isPending}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {addWpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Verify & Save Connection
                </button>
              </form>
            )}

            {/* List connected WordPress CMS integrations */}
            {cmsIntegrationsQuery.data && cmsIntegrationsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {cmsIntegrationsQuery.data.map((int: any) => (
                  <div key={int.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-150 rounded-2xl bg-slate-50/20 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-800 truncate flex items-center gap-1">
                          {int.credentials?.siteUrl || "WordPress Blog"}
                          <span className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/10 text-[9px] px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                          Authorized user: {int.credentials?.username || "admin"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to disconnect this WordPress site?")) {
                          disconnectCmsMutation.mutate(int.id);
                        }
                      }}
                      className="border border-slate-200 bg-white hover:border-red-200 hover:text-red-600 text-slate-500 font-semibold p-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer self-end sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Disconnect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Globe className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No WordPress site connected</p>
                <p className="text-[10px] text-slate-400 font-semibold max-w-sm">
                  Connecting a WordPress endpoint allows SoloSpider to send generated content briefs directly to your site as publication drafts.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Social Channels Connection (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-950">Social Media API Channels</h3>
              <p className="text-xs text-slate-400 font-semibold">Schedule publishing across connected social networks.</p>
            </div>

            <div className="space-y-4">
              {/* LinkedIn platform connection */}
              <div className="p-4 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#0A66C2] rounded-xl flex items-center justify-center text-white">
                      <Linkedin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800">LinkedIn Profile</span>
                      <p className="text-[9px] text-slate-400 font-semibold">Publish updates and articles</p>
                    </div>
                  </div>

                  {/* Active/Disconnect states */}
                  {connectedSocials.some((acc: any) => acc.platform === "linkedin") ? (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Connected
                      </span>
                      <button
                        onClick={() => {
                          const item = connectedSocials.find((acc: any) => acc.platform === "linkedin");
                          if (item) disconnectSocialMutation.mutate(item.id);
                        }}
                        className="p-2 border border-slate-150 rounded-xl hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
                        title="Disconnect Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSocialConnect("linkedin")}
                      className="bg-[#0A66C2] hover:bg-[#084e91] text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Show profile metadata details if connected */}
                {connectedSocials.some((acc: any) => acc.platform === "linkedin") && (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Account: {connectedSocials.find((acc: any) => acc.platform === "linkedin")?.handle}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Twitter connection */}
              <div className="p-4 border border-slate-200 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                      <Twitter className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800">X (Twitter) Profile</span>
                      <p className="text-[9px] text-slate-400 font-semibold">Publish tweets and threads</p>
                    </div>
                  </div>

                  {/* Active/Disconnect states */}
                  {connectedSocials.some((acc: any) => acc.platform === "twitter") ? (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Connected
                      </span>
                      <button
                        onClick={() => {
                          const item = connectedSocials.find((acc: any) => acc.platform === "twitter");
                          if (item) disconnectSocialMutation.mutate(item.id);
                        }}
                        className="p-2 border border-slate-150 rounded-xl hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
                        title="Disconnect Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSocialConnect("twitter")}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Show profile details */}
                {connectedSocials.some((acc: any) => acc.platform === "twitter") && (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Account: {connectedSocials.find((acc: any) => acc.platform === "twitter")?.handle}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API Ready
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
