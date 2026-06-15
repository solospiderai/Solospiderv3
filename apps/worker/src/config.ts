import "dotenv/config";
import { z } from "zod";
import Redis from "ioredis";

// ── Env validation ──────────────────────────────────────────────────────────
const EnvSchema = z.object({
  NODE_ENV:                 z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL:             z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY:z.string().min(10),
  REDIS_URL:                z.string().default("redis://localhost:6379"),
  OPENROUTER_API_KEY:       z.string().min(10),
  WORKER_SECRET:            z.string().default("dev-secret"),
  LINKEDIN_CLIENT_ID:       z.string().optional(),
  LINKEDIN_CLIENT_SECRET:   z.string().optional(),
  LINKEDIN_REDIRECT_URI:    z.string().optional(),
  TWITTER_CLIENT_ID:        z.string().optional(),
  TWITTER_CLIENT_SECRET:    z.string().optional(),
  TWITTER_REDIRECT_URI:     z.string().optional(),
  META_APP_ID:              z.string().optional(),
  META_APP_SECRET:          z.string().optional(),
});

function loadEnv() {
  // Fallback parsing: copy NEXT_PUBLIC_SUPABASE_URL to SUPABASE_URL if missing
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach(i => console.error(` • ${i.path.join(".")}: ${i.message}`));
    
    // Log masked environment keys
    console.log("Environment keys status:");
    const sensitiveKeys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "REDIS_URL", "OPENROUTER_API_KEY"];
    sensitiveKeys.forEach(key => {
      const val = process.env[key];
      if (val) {
        const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : "****";
        console.log(` • ${key}: Present (${masked})`);
      } else {
        console.log(` • ${key}: Missing`);
      }
    });

    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️ Production environment validation failed! Bypassing exit to maintain container resilience.");
      return {
        NODE_ENV: "production",
        SUPABASE_URL: process.env.SUPABASE_URL || "https://placeholder-supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key-role",
        REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "placeholder-openrouter-key",
        WORKER_SECRET: process.env.WORKER_SECRET || "dev-secret",
      } as any;
    } else {
      process.exit(1);
    }
  }
  return result.data;
}

export const env = loadEnv();

// ── Redis client (shared across workers) ───────────────────────────────────
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err: any) => console.error("Redis error:", err.message));
