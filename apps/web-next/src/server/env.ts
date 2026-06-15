import { z } from "zod";

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  WORKER_SECRET: z.string().default("dev-secret"),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_REDIRECT_URI: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  TWITTER_REDIRECT_URI: z.string().optional(),
});

export function getServerEnv() {
  const cleanEnv: Record<string, string> = {};
  for (const rawKey of Object.keys(process.env)) {
    const cleanKey = rawKey.trim();
    const rawVal = process.env[rawKey];
    if (rawVal !== undefined) {
      cleanEnv[cleanKey] = rawVal.trim();
    }
  }

  const parsed = ServerEnvSchema.safeParse(cleanEnv);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid server environment: ${message}`);
  }

  for (const key of Object.keys(cleanEnv)) {
    process.env[key] = cleanEnv[key];
  }

  return parsed.data;
}
