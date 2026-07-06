import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Project, UserSubscription, PlanTier, PlanConfig } from "@/types/project";
import { mapServiceError } from "./errors";

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    label: "Starter",
    price: "Free",
    projectLimit: 1,
    extraProjectPrice: 0,
    modelLimit: 1,
    extraModelPrice: 50,
    blogsPerMonth: 5,
    socialSchedulePerMonth: 30,
    socialGenerateEnabled: false,
    mediaStudioAiPerMonth: 0,
    seoAuditPolicy: "once",
    seoAiFixEnabled: false,
    aeoGeoEnabled: false,
    socialConnections: 5,
    reportBranding: "solospider",
    apiAccess: "none",
    support: "Community",
  },
  growth: {
    label: "Growth",
    price: "$199/mo",
    projectLimit: 5,
    extraProjectPrice: 50,
    modelLimit: 4,
    extraModelPrice: 50,
    blogsPerMonth: Infinity,
    socialSchedulePerMonth: Infinity,
    socialGenerateEnabled: true,
    mediaStudioAiPerMonth: 30,
    seoAuditPolicy: "weekly",
    seoAiFixEnabled: true,
    aeoGeoEnabled: true,
    socialConnections: 5,
    reportBranding: "solospider",
    apiAccess: "none",
    support: "Priority",
  },
  scale: {
    label: "Scale",
    price: "$699/mo",
    projectLimit: 10,
    extraProjectPrice: 50,
    modelLimit: 7,
    extraModelPrice: 50,
    blogsPerMonth: Infinity,
    socialSchedulePerMonth: Infinity,
    socialGenerateEnabled: true,
    mediaStudioAiPerMonth: 30,
    seoAuditPolicy: "weekly",
    seoAiFixEnabled: true,
    aeoGeoEnabled: true,
    socialConnections: 5,
    reportBranding: "website",
    apiAccess: "coming_soon",
    support: "24/7 Dedicated",
  },
  custom: {
    label: "Custom",
    price: "Custom",
    projectLimit: Infinity,
    extraProjectPrice: 0,
    modelLimit: Infinity,
    extraModelPrice: 0,
    blogsPerMonth: Infinity,
    socialSchedulePerMonth: Infinity,
    socialGenerateEnabled: true,
    mediaStudioAiPerMonth: Infinity,
    seoAuditPolicy: "unlimited",
    seoAiFixEnabled: true,
    aeoGeoEnabled: true,
    socialConnections: Infinity,
    reportBranding: "website",
    apiAccess: "full",
    support: "Dedicated onboarding call",
  },
};

export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLAN_CONFIGS[plan] ?? PLAN_CONFIGS.free;
}

export function getPlanLimit(plan: PlanTier): number {
  return getPlanConfig(plan).projectLimit;
}

export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Project[];
  } catch (err) {
    throw mapServiceError(err);
  }
}

export async function getSubscription(): Promise<UserSubscription> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { plan: "free" };
    }
    if (user.email === "info@solospider.ai") {
      return { plan: "custom" };
    }

    const { data, error } = await supabase
      .from("user_subscriptions" as any)
      .select("plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { plan: "free" };
    }

    const plan = (data?.plan || "free") as PlanTier;
    const validPlans: PlanTier[] = ["free", "growth", "scale", "custom"];
    return { plan: validPlans.includes(plan) ? plan : "free" };
  } catch {
    return { plan: "free" };
  }
}

export async function createProject(input: {
  name: string;
  domain: string;
  brand_name?: string;
  brand_tagline?: string;
  brand_description?: string;
  og_image_url?: string;
}): Promise<Project> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("projects")
      .insert(input as any)
      .select("*")
      .single();

    if (error) throw error;
    return data as Project;
  } catch (err) {
    throw mapServiceError(err);
  }
}
