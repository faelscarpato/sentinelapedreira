import { HttpError } from "./errors.ts";

export type ProviderName = "openai" | "groq" | "nvidia";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionInput {
  provider?: ProviderName;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface ChatCompletionOutput {
  provider: ProviderName;
  model: string;
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw: unknown;
}

export interface EmbeddingInput {
  provider?: ProviderName;
  model: string;
  input: string[];
  timeoutMs?: number;
}

export interface EmbeddingOutput {
  provider: ProviderName;
  model: string;
  vectors: number[][];
  raw: unknown;
}

interface ProviderConfig {
  provider: ProviderName;
  baseUrl: string;
  apiKey: string;
}

function getProviderConfig(provider: ProviderName): ProviderConfig {
  if (provider === "groq") {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new HttpError(500, "missing_provider_key", "GROQ_API_KEY não configurada.");
    return {
      provider,
      baseUrl: Deno.env.get("GROQ_BASE_URL") ?? "https://api.groq.com/openai/v1",
      apiKey,
    };
  }

  if (provider === "nvidia") {
    const apiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!apiKey) throw new HttpError(500, "missing_provider_key", "NVIDIA_API_KEY não configurada.");
    return {
      provider,
      baseUrl: Deno.env.get("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1",
      apiKey,
    };
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new HttpError(500, "missing_provider_key", "OPENAI_API_KEY não configurada.");
  return {
    provider: "openai",
    baseUrl: Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
    apiKey,
  };
}

function resolveProvider(provider?: ProviderName): ProviderName {
  if (provider) return provider;
  const envProvider = (Deno.env.get("DEFAULT_AI_PROVIDER") ?? "openai").toLowerCase();
  if (envProvider === "groq" || envProvider === "nvidia" || envProvider === "openai") {
    return envProvider;
  }
  return "openai";
}

export function resolveDefaultChatModel(provider: ProviderName) {
  if (provider === "groq") {
    return Deno.env.get("GROQ_CHAT_MODEL") ?? "llama-3.3-70b-versatile";
  }

  if (provider === "nvidia") {
    return Deno.env.get("NVIDIA_CHAT_MODEL") ?? "meta/llama-3.1-70b-instruct";
  }

  return Deno.env.get("OPENAI_CHAT_MODEL") ?? "gpt-5.4-mini";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function runChatCompletion(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
  const provider = resolveProvider(input.provider);
  const cfg = getProviderConfig(provider);
  const timeoutMs = input.timeoutMs ?? 25_000;
  const model = (input.model?.trim() && input.model.trim().length > 0)
    ? input.model.trim()
    : resolveDefaultChatModel(provider);

  const response = await fetchWithTimeout(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 1200,
      response_format: input.responseFormat,
      stream: false,
    }),
  }, timeoutMs);

  const json = await response.json().catch(() => null);

  if (!response.ok || !json) {
    throw new HttpError(response.status || 502, "provider_chat_error", "Falha ao consultar provedor de IA.", {
      provider,
      status: response.status,
      json,
    });
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new HttpError(502, "provider_empty_response", "Provedor retornou conteúdo vazio.", {
      provider,
      json,
    });
  }

  return {
    provider,
    model,
    content,
    usage: json.usage,
    raw: json,
  };
}

export async function runEmbeddings(input: EmbeddingInput): Promise<EmbeddingOutput> {
  const provider = resolveProvider(input.provider);
  const cfg = getProviderConfig(provider);
  const timeoutMs = input.timeoutMs ?? 25_000;

  const response = await fetchWithTimeout(`${cfg.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      input: input.input,
    }),
  }, timeoutMs);

  const json = await response.json().catch(() => null);

  if (!response.ok || !json) {
    throw new HttpError(response.status || 502, "provider_embedding_error", "Falha ao gerar embeddings.", {
      provider,
      status: response.status,
      json,
    });
  }

  const vectors = Array.isArray(json.data)
    ? json.data.map((item: { embedding?: number[] }) => item.embedding ?? [])
    : [];

  if (!vectors.length) {
    throw new HttpError(502, "provider_embedding_empty", "Nenhum embedding retornado pelo provedor.", {
      provider,
      json,
    });
  }

  return {
    provider,
    model: input.model,
    vectors,
    raw: json,
  };
}

export function chunkText(content: string, chunkSize = 1200, overlap = 180) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [] as string[];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + chunkSize);
    const block = normalized.slice(cursor, end).trim();
    if (block) chunks.push(block);

    if (end >= normalized.length) break;
    cursor = Math.max(0, end - overlap);
  }

  return chunks;
}
