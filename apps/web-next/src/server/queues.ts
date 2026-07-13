import { Queue } from "bullmq";
import Redis from "ioredis";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import { getServerEnv } from "@/server/env";

export interface CrawlJobData {
  project_id: string;
  website: string;
  max_pages?: number;
  run_id?: string;
}

export interface PromptScanJobData {
  project_id: string;
  brand_name: string;
  models: string[];
  competitors?: string[];
  prompt_ids?: string[];
  run_id?: string;
}

export interface ScoringJobData {
  project_id: string;
  brand_name: string;
}

export interface PublishJobData {
  post_id: string;
}

const globalForQueues = globalThis as unknown as {
  solospiderRedis?: Redis;
  solospiderQueues?: {
    crawlQueue: Queue<CrawlJobData>;
    promptScanQueue: Queue<PromptScanJobData>;
    scoringQueue: Queue<ScoringJobData>;
    publishQueue: Queue<PublishJobData>;
  };
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

export function getRedisConnection() {
  if (!globalForQueues.solospiderRedis) {
    const env = getServerEnv();
    globalForQueues.solospiderRedis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
    });
  }

  return globalForQueues.solospiderRedis;
}

export function getQueues() {
  const env = getServerEnv();
  const prefix = env.NODE_ENV === "development" ? "dev" : "bull";

  if (globalForQueues.solospiderQueues) {
    const existingPrefix = globalForQueues.solospiderQueues.crawlQueue.opts.prefix;
    if (existingPrefix !== prefix) {
      console.log(`[Queues] Queue prefix mismatch detected (expected: ${prefix}, existing: ${existingPrefix}). Recreating queues...`);
      Object.values(globalForQueues.solospiderQueues).forEach(q => q.close().catch(() => {}));
      globalForQueues.solospiderQueues = undefined;
    }
  }

  if (!globalForQueues.solospiderQueues) {
    const connection = getRedisConnection();
    globalForQueues.solospiderQueues = {
      crawlQueue: new Queue<CrawlJobData>("crawl", { connection, prefix, defaultJobOptions }),
      promptScanQueue: new Queue<PromptScanJobData>("prompt-scan", {
        connection,
        prefix,
        defaultJobOptions: { ...defaultJobOptions, attempts: 2 },
      }),
      scoringQueue: new Queue<ScoringJobData>("scoring", { connection, prefix, defaultJobOptions }),
      publishQueue: new Queue<PublishJobData>("publish", { connection, prefix, defaultJobOptions }),
    };
  }

  return globalForQueues.solospiderQueues;
}
