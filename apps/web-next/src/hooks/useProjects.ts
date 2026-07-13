"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getPlanLimit, getProjects, getSubscription } from "@/lib/services/projects";
import type { Project, PlanTier } from "@/types/project";

const ACTIVE_PROJECT_KEY = "solospider.next.activeProjectId";

interface ProjectsContextType {
  projects: Project[];
  activeProject: Project;
  activeProjectId: string | null;
  selectActiveProject: (projectId: string) => void;
  isLoading: boolean;
  error: any;
  addProject: any;
  currentPlan: PlanTier;
  projectLimit: number;
  canAddProject: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const value = useProjectsStandalone();
  return React.createElement(ProjectsContext.Provider, { value }, children);
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context !== undefined) {
    return context;
  }
  return useProjectsStandalone();
}

function useProjectsStandalone(): ProjectsContextType {
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    }
    return null;
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscription,
  });

  const addProject = useMutation({
    mutationFn: createProject,
    onSuccess: (created) => {
      setActiveProjectId(created.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_PROJECT_KEY, created.id);
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const projects = (projectsQuery.data || []) as Project[];

  useEffect(() => {
    if (projects.length === 0) return;
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) return;

    const fallback = projects[0]?.id ?? null;
    setActiveProjectId(fallback);
    if (typeof window !== "undefined" && fallback) {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, fallback);
    }
  }, [projects, activeProjectId]);

  const selectActiveProject = (projectId: string) => {
    setActiveProjectId(projectId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    }
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null,
    [projects, activeProjectId],
  );

  const currentPlan = (subscriptionQuery.data?.plan || "free") as PlanTier;
  const projectLimit = getPlanLimit(currentPlan);
  const canAddProject = projects.length < projectLimit;

  return {
    projects,
    activeProject: activeProject as Project,
    activeProjectId,
    selectActiveProject,
    isLoading: projectsQuery.isLoading || subscriptionQuery.isLoading,
    error: projectsQuery.error || subscriptionQuery.error,
    addProject,
    currentPlan,
    projectLimit,
    canAddProject,
  };
}
