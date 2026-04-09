import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { ensureRole, resolveAuthContext } from "../_shared/auth.ts";
import { runChatCompletion, runEmbeddings } from "../_shared/ai-provider.ts";

const chatSchema = z.object({
  task: z.literal("chat"),
  provider: z.enum(["openai", "groq", "nvidia"]).optional(),
  model: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
});

const embeddingSchema = z.object({
  task: z.literal("embedding"),
  provider: z.enum(["openai", "groq", "nvidia"]).optional(),
  model: z.string().min(1),
  input: z.array(z.string().min(1)).min(1).max(128),
});

const requestSchema = z.discriminatedUnion("task", [chatSchema, embeddingSchema]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const ctx = await resolveAuthContext(req.headers.get("Authorization"), true);
    ensureRole(ctx, ["editor", "reviewer", "admin"]);

    const payload = requestSchema.parse(await req.json());

    if (payload.task === "embedding") {
      const result = await runEmbeddings({
        provider: payload.provider,
        model: payload.model,
        input: payload.input,
      });

      logInfo("ai-provider-gateway.embedding.success", { requestId, provider: result.provider, model: result.model });
      return jsonResponse({
        requestId,
        task: "embedding",
        provider: result.provider,
        model: result.model,
        vectors: result.vectors,
      });
    }

    const result = await runChatCompletion({
      provider: payload.provider,
      model: payload.model,
      messages: payload.messages,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
    });

    logInfo("ai-provider-gateway.chat.success", { requestId, provider: result.provider, model: result.model });
    return jsonResponse({
      requestId,
      task: "chat",
      provider: result.provider,
      model: result.model,
      content: result.content,
      usage: result.usage,
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("ai-provider-gateway.error", {
      requestId,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });

    return jsonResponse({
      requestId,
      error: normalized.code,
      message: normalized.message,
      details: normalized.details,
    }, normalized.status);
  }
});
