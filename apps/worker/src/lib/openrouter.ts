import { env } from "../config.js";

const BASE_URL = "https://openrouter.ai/api/v1";

export const MODEL_MAP: Record<string, string> = {
  chatgpt:       "openai/gpt-4o-mini:online",
  gemini:        "google/gemini-2.5-flash:online",
  claude:        "anthropic/claude-3.5-haiku:online",
  perplexity:    "perplexity/sonar",
  grok:          "x-ai/grok-2-1212",
  deepseek:      "deepseek/deepseek-chat",
  claude_sonnet: "anthropic/claude-3.5-sonnet",
  claude_opus:   "anthropic/claude-3-opus",
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
  maxTokens?: number,
  enableWebSearch: boolean = true
): Promise<{ 
  text: string; 
  latencyMs: number; 
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  citations?: string[];
}> {
  let modelId = MODEL_MAP[modelKey] || MODEL_MAP["chatgpt"];

  const start = Date.now();
  const requestBody: Record<string, any> = {
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt ?? "You are a live search engine assistant. Provide accurate, real-time up-to-date search results, citing specific brand names, products, and web domain URLs." },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens ?? 800,
    temperature: 0.3,
  };

  if (enableWebSearch && !modelId.includes(":online") && !modelId.startsWith("perplexity/")) {
    requestBody.plugins = [{ id: "web" }];
  }

  const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://solospider.ai",
      "X-Title": "SoloSpider Worker",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(requestBody),
  });

  const latencyMs = Date.now() - start;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${modelId} → ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json() as { 
    choices: Array<{ message: { content: string; citations?: string[] } }>;
    citations?: string[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  
  const usage = data?.usage;
  if (usage) {
    console.log(`[OpenRouter Usage] ${modelId} — Prompt: ${usage.prompt_tokens} tokens | Completion: ${usage.completion_tokens} tokens | Total: ${usage.total_tokens} tokens`);
  } else {
    console.log(`[OpenRouter Usage] ${modelId} — No usage metadata available.`);
  }

  const text = data?.choices?.[0]?.message?.content ?? "";
  const citations = data?.citations || data?.choices?.[0]?.message?.citations || [];

  return { 
    text, 
    latencyMs,
    usage: usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    citations
  };
}

export async function callOpenRouter(
  messagesOrModelKey: Array<{ role: string; content: string }> | string,
  modelOrPrompt?: string,
  systemPrompt?: string,
  maxTokens?: number
): Promise<any> {
  if (Array.isArray(messagesOrModelKey)) {
    const messages = messagesOrModelKey;
    const modelId = modelOrPrompt || "google/gemini-2.5-flash";
    const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://solospider.ai",
        "X-Title": "SoloSpider Worker",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: maxTokens ?? 1000,
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter ${modelId} → ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data?.choices?.[0]?.message?.content ?? "";
  } else {
    return queryModel(messagesOrModelKey, modelOrPrompt ?? "", systemPrompt, maxTokens);
  }
}
