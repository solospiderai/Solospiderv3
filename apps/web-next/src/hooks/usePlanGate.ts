"use client";

import { useRouter, usePathname } from "next/navigation";
import { useProjects } from "./useProjects";
import { getPlanConfig } from "@/lib/services/projects";
import { toast } from "sonner";
import type { PlanConfig, PlanTier } from "@/types/project";

export function usePlanGate() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { projects, currentPlan, canAddProject, projectLimit } = useProjects();

  const plan = currentPlan as PlanTier;
  const config: PlanConfig = getPlanConfig(plan);

  const redirectToPricing = (reason?: string) => {
    if (reason) toast.error(reason);
    router.push(`/pricing?redirectedFrom=${encodeURIComponent(pathname)}`);
  };

  const checkProjectLimit = (): boolean => {
    if (projects.length >= config.projectLimit) {
      if (config.extraProjectPrice > 0) {
        toast.error(
          `Your ${config.label} plan allows ${config.projectLimit} projects. Add extra projects for $${config.extraProjectPrice}/each or upgrade your plan.`
        );
      } else {
        toast.error(
          `Your ${config.label} plan allows ${config.projectLimit} project. Upgrade to add more.`
        );
      }
      router.push(`/pricing?redirectedFrom=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  };

  const checkBlogLimit = (usedThisMonth: number): boolean => {
    if (config.blogsPerMonth !== Infinity && usedThisMonth >= config.blogsPerMonth) {
      redirectToPricing(
        `You've used all ${config.blogsPerMonth} blog posts for this month. Upgrade to generate more.`
      );
      return false;
    }
    return true;
  };

  const checkSocialScheduleLimit = (usedThisMonth: number): boolean => {
    if (
      config.socialSchedulePerMonth !== Infinity &&
      usedThisMonth >= config.socialSchedulePerMonth
    ) {
      redirectToPricing(
        `You've used all ${config.socialSchedulePerMonth} scheduled posts for this month. Upgrade for more.`
      );
      return false;
    }
    return true;
  };

  return {
    plan,
    config,
    canAddProject,
    projectLimit,
    checkProjectLimit,
    checkBlogLimit,
    checkSocialScheduleLimit,
    redirectToPricing,
  };
}
