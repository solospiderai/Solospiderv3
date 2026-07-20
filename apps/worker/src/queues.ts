import { Queue } from "bullmq";
import { redis, env } from "./config.js";

const prefix = env.NODE_ENV === "development" ? "dev" : "bull";

// ── Job payload types ───────────────────────────────────────────────────────

export interface CrawlJobData {
  project_id: string;
  website: string;
  max_pages?: number;
  run_id?: string;         // crawl_runs.id if already created
}

export interface PromptScanJobData {
  project_id: string;
  brand_name: string;
  models: string[];
  competitors?: string[];
  prompt_ids?: string[];   // null = all active prompts
  run_id?: string;         // prompt_scan_runs.id if already created
}

export interface ScoringJobData {
  project_id: string;
  brand_name: string;
}

export interface PublishJobData {
  post_id: string;
}

// ── Backlinks Job Payload Types ──────────────────────────────────────────────

export interface BacklinkCrawlJobData {
  backlink_project_id: string;
  website: string;
}

export interface DiscoverProspectsJobData {
  backlink_project_id: string;
  keywords: string[];
  competitors?: string[];
}

export interface DiscoverContactsJobData {
  prospect_id: string;
  website: string;
}

export interface AnalyzeProspectJobData {
  prospect_id: string;
  website: string;
}

export interface GenerateEmailsJobData {
  campaign_id: string;
  prospect_id: string;
  contact_id?: string;
  target_page_url: string;
}

export interface SendEmailJobData {
  campaign_message_id: string;
}

export interface FollowUpJobData {
  campaign_id: string;
}

export interface VerifyBacklinkJobData {
  verified_backlink_id?: string;
  referring_url: string;
  target_url: string;
  backlink_project_id: string;
}

export interface MonitorBacklinksJobData {
  backlink_project_id?: string;
}

export interface SummarizeReplyJobData {
  reply_id: string;
}

// ── Queue definitions ────────────────────────────────────────────────────────

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50 },
};

export const crawlQueue = new Queue<CrawlJobData>("crawl", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const promptScanQueue = new Queue<PromptScanJobData>("prompt-scan", {
  connection: redis as any,
  prefix,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2, // AI calls can be expensive, limit retries
  },
});

export const scoringQueue = new Queue<ScoringJobData>("scoring", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const publishQueue = new Queue<PublishJobData>("publish", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

// ── Backlink Queues ──────────────────────────────────────────────────────────

export const crawlWebsiteQueue = new Queue<BacklinkCrawlJobData>("crawl-website", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const discoverProspectsQueue = new Queue<DiscoverProspectsJobData>("discover-prospects", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const discoverContactsQueue = new Queue<DiscoverContactsJobData>("discover-contacts", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const analyzeProspectQueue = new Queue<AnalyzeProspectJobData>("analyze-prospect", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const generateEmailsQueue = new Queue<GenerateEmailsJobData>("generate-emails", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const sendEmailsQueue = new Queue<SendEmailJobData>("send-emails", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const followUpsQueue = new Queue<FollowUpJobData>("follow-ups", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const verifyBacklinksQueue = new Queue<VerifyBacklinkJobData>("verify-backlinks", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const monitorBacklinksQueue = new Queue<MonitorBacklinksJobData>("monitor-backlinks", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

export const summarizeRepliesQueue = new Queue<SummarizeReplyJobData>("summarize-replies", {
  connection: redis as any,
  prefix,
  defaultJobOptions,
});

