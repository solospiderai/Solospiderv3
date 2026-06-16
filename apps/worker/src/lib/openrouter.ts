import { env } from "../config.js";

const BASE_URL = "https://openrouter.ai/api/v1";

export const MODEL_MAP: Record<string, string> = {
  chatgpt:    "openai/gpt-4o-mini",
  gemini:     "google/gemini-2.5-flash",
  claude:     "anthropic/claude-3-haiku",
  perplexity: "perplexity/sonar",
  grok:       "x-ai/grok-3-mini-beta",
  deepseek:   "deepseek/deepseek-chat",
};

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // Retry on rate limit (429) or server error (5xx)
    if (!res.ok && (res.status === 429 || res.status >= 500) && retries > 0) {
      console.warn(`[OpenRouter] HTTP ${res.status}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[OpenRouter] Request failed: ${err instanceof Error ? err.message : String(err)}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, delay));
      
      // Recreate options with a fresh timeout signal if abort signal was used
      const newOptions = { ...options };
      newOptions.signal = AbortSignal.timeout(20000);
      
      return fetchWithRetry(url, newOptions, retries - 1, delay * 2);
    }
    throw err;
  }
}

export async function queryModel(
  modelKey: string,
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number
): Promise<{ text: string; latencyMs: number }> {
  const modelId = MODEL_MAP[modelKey];
  if (!modelId) throw new Error(`Unknown model key: ${modelKey}`);

  const start = Date.now();
  const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://solospider.ai",
      "X-Title": "SoloSpider Worker",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt ?? "You are a helpful assistant. Answer the question comprehensively. Mention specific products, tools, companies, and brand names where relevant." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens ?? 800,
      temperature: 0.3,
    }),
  });

  const latencyMs = Date.now() - start;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${modelId} → ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { text, latencyMs };
}
