import { HttpError } from "./errors.ts";
import { getServiceClient } from "./supabase.ts";

interface RateLimitOptions {
  scope: string;
  key: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
}

export function extractClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  if (!options.scope || !options.key) {
    throw new HttpError(500, "rate_limit_invalid_key", "Configuração inválida de rate limit.");
  }

  const normalizedLimit = Math.max(1, Math.floor(options.limit));
  const normalizedWindow = Math.max(1, Math.floor(options.windowSeconds));
  const actorKeyHash = await sha256Hex(options.key);

  const service = getServiceClient();
  const { data, error } = await service.rpc("check_rate_limit", {
    p_scope: options.scope,
    p_actor_key: actorKeyHash,
    p_limit: normalizedLimit,
    p_window_seconds: normalizedWindow,
  });

  if (error) {
    throw new HttpError(500, "rate_limit_check_failed", "Falha ao validar limite de requisições.", error);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    throw new HttpError(500, "rate_limit_invalid_response", "Resposta inválida do controle de rate limit.");
  }

  return {
    allowed: Boolean(row.allowed),
    currentCount: Number(row.current_count ?? 0),
    remaining: Number(row.remaining ?? 0),
    resetAt: String(row.reset_at ?? new Date().toISOString()),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
  };
}
