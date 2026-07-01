// Shared plan configuration used by frontend & backend
export type PlanKey = "free" | "growth" | "scale" | "custom";

export interface PlanConfig {
  name: string;
  price: number | null;       // USD per month, null = custom
  credits: number | null;
  projects: number | null;
  models: number | null;
  razorpayEnvKey: string | null; // env variable name holding the Razorpay plan_id
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    name: "Starter",
    price: 0,
    credits: 50,
    projects: 1,
    models: 1,
    razorpayEnvKey: null,
  },
  growth: {
    name: "Growth",
    price: 199,
    credits: 500,
    projects: 5,
    models: 4,
    razorpayEnvKey: "RAZORPAY_PLAN_GROWTH",
  },
  scale: {
    name: "Scale",
    price: 699,
    credits: 2000,
    projects: 10,
    models: 7,
    razorpayEnvKey: "RAZORPAY_PLAN_SCALE",
  },
  custom: {
    name: "Custom",
    price: null,
    credits: null,
    projects: null,
    models: null,
    razorpayEnvKey: null,
  },
};

/** Map a Razorpay plan_id back to our PlanKey */
export function planKeyFromRazorpayPlanId(rpPlanId: string): PlanKey | null {
  if (rpPlanId === process.env.RAZORPAY_PLAN_GROWTH) return "growth";
  if (rpPlanId === process.env.RAZORPAY_PLAN_SCALE) return "scale";
  return null;
}
