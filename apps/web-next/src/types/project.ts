export type Project = {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  brand_name?: string | null;
  brand_tagline?: string | null;
  brand_description?: string | null;
  brand_logo_url?: string | null;
  og_image_url?: string | null;
  favicon_url?: string | null;
  created_at?: string;
};

export type PlanTier = "free" | "growth" | "scale" | "custom";

export type UserSubscription = {
  plan: PlanTier;
};

export type PlanConfig = {
  label: string;
  price: string;
  projectLimit: number;          // max projects (Infinity for unlimited)
  extraProjectPrice: number;     // $/extra project (0 = not allowed)
  modelLimit: number;            // included AI models
  extraModelPrice: number;       // $/extra model
  blogsPerMonth: number;         // Infinity = unlimited
  socialSchedulePerMonth: number;// Infinity = unlimited
  socialGenerateEnabled: boolean;// can AI-generate social posts?
  mediaStudioAiPerMonth: number; // AI media gen cap (0 = disabled)
  seoAuditPolicy: "once" | "weekly" | "unlimited";
  seoAiFixEnabled: boolean;
  aeoGeoEnabled: boolean;
  socialConnections: number;
  reportBranding: "solospider" | "website"; // whose logo/URL in reports
  apiAccess: "none" | "coming_soon" | "full";
  support: string;
};
