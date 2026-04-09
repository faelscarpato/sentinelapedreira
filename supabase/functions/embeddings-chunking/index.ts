import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError, HttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { ensureRole, resolveAuthContext } from "../_shared/auth.ts";
import { chunkText, runEmbeddings } from "../_shared/ai-provider.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const schema = z.object({
  documentId: z.string().uuid(),
  content: z.string().min(10).max(200000).optional(),
  provider: z.enum(["openai", "groq", "nvidia"]).optional(),
  embeddingModel: z.string().default("text-embedding-3-small"),
  chunkSize: z.number().int().min(300).max(3000).default(1200),
  chunkOverlap: z.number().int().min(20).max(600).default(180),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const auth = await resolveAuthContext(req.headers.get("Authorization"), true);
    ensureRole(auth, ["editor", "admin"]);

    const payload = schema.parse(await req.json());
    const service = getServiceClient();

    let content = payload.content;

    if (!content) {
      const { data: document, error: documentError } = await service
        .from("documents")
        .select("title, summary, body_markdown")
        .eq("id", payload.documentId)
        .single();

      if (documentError || !document) {
        throw new HttpError(404, "document_not_found", "Documento não encontrado.", documentError);
      }

      content = [document.title, document.summary, document.body_markdown]
        .filter((value): value is string => Boolean(value))
        .join("\n\n")
        .trim();
    }

    if (!content || content.length < 10) {
      throw new HttpError(422, "insufficient_content", "Conteúdo insuficiente para gerar embeddings.");
    }

    const chunks = chunkText(content, payload.chunkSize, payload.chunkOverlap);
    if (!chunks.length) {
      throw new HttpError(422, "chunking_failed", "Não foi possível segmentar o conteúdo em chunks válidos.");
    }

    const { data: existingChunks, error: existingChunksError } = await service
      .from("document_chunks")
      .select("id")
      .eq("document_id", payload.documentId);

    if (existingChunksError) throw existingChunksError;

    if (existingChunks && existingChunks.length > 0) {
      const existingIds = existingChunks.map((row) => row.id);
      const { error: embeddingDeleteError } = await service.from("embeddings").delete().in("chunk_id", existingIds);
      if (embeddingDeleteError) throw embeddingDeleteError;

      const { error: chunkDeleteError } = await service.from("document_chunks").delete().eq("document_id", payload.documentId);
      if (chunkDeleteError) throw chunkDeleteError;
    }

    const chunkRows = chunks.map((chunk, index) => ({
      document_id: payload.documentId,
      chunk_index: index,
      content: chunk,
      token_count: Math.ceil(chunk.length / 4),
      visibility: "published_only",
      metadata: {
        requestId,
      },
    }));

    const { data: insertedChunks, error: chunkInsertError } = await service
      .from("document_chunks")
      .insert(chunkRows)
      .select("id, chunk_index, content")
      .order("chunk_index", { ascending: true });

    if (chunkInsertError || !insertedChunks) throw chunkInsertError;

    const batchSize = 32;
    for (let cursor = 0; cursor < insertedChunks.length; cursor += batchSize) {
      const batch = insertedChunks.slice(cursor, cursor + batchSize);
      const embeddingResult = await runEmbeddings({
        provider: payload.provider,
        model: payload.embeddingModel,
        input: batch.map((item) => item.content),
        timeoutMs: 35000,
      });

      const vectors = embeddingResult.vectors;
      if (vectors.length !== batch.length) {
        throw new HttpError(502, "embedding_count_mismatch", "Quantidade de embeddings não corresponde ao lote enviado.");
      }

      const rows = batch.map((item, index) => ({
        chunk_id: item.id,
        provider: embeddingResult.provider,
        model: embeddingResult.model,
        embedding: vectors[index],
      }));

      const { error: embeddingInsertError } = await service.from("embeddings").insert(rows);
      if (embeddingInsertError) throw embeddingInsertError;
    }

    const { error: documentUpdateError } = await service
      .from("documents")
      .update({
        metadata: {
          embeddings_updated_at: new Date().toISOString(),
          embedding_model: payload.embeddingModel,
        },
        updated_by: auth.user?.id,
      })
      .eq("id", payload.documentId);

    if (documentUpdateError) throw documentUpdateError;

    logInfo("embeddings-chunking.success", {
      requestId,
      userId: auth.user?.id,
      documentId: payload.documentId,
      chunks: insertedChunks.length,
      model: payload.embeddingModel,
    });

    return jsonResponse({
      requestId,
      documentId: payload.documentId,
      chunkCount: insertedChunks.length,
      embeddingModel: payload.embeddingModel,
    });
  } catch (error) {
    const normalized = toHttpError(error);

    logError("embeddings-chunking.error", {
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
