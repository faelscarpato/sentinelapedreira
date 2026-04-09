import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError, HttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { resolveAuthContext, ensureRole } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const schema = z.object({
  eventType: z.string().min(3).max(120),
  payload: z.record(z.string(), z.unknown()),
  source: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
});

async function verifySignature(rawBody: string, signature: string | null) {
  const secret = Deno.env.get("WEBHOOK_SHARED_SECRET");
  if (!secret) return false;
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const validSignature = await verifySignature(rawBody, signature);

    if (!validSignature) {
      const auth = await resolveAuthContext(req.headers.get("Authorization"), true);
      ensureRole(auth, ["editor", "admin"]);
    }

    const body = schema.parse(JSON.parse(rawBody));
    const service = getServiceClient();

    if (body.eventType === "document.published") {
      const documentId = body.payload.documentId as string | undefined;
      if (!documentId) throw new HttpError(422, "invalid_payload", "documentId é obrigatório para document.published");

      const { error } = await service.from("documents").update({
        status: "published",
        published_at: body.occurredAt ?? new Date().toISOString(),
      }).eq("id", documentId);
      if (error) throw error;
    } else if (body.eventType === "complaint.status_changed") {
      const complaintId = body.payload.complaintId as string | undefined;
      const status = body.payload.status as string | undefined;
      if (!complaintId || !status) {
        throw new HttpError(422, "invalid_payload", "complaintId e status são obrigatórios para complaint.status_changed");
      }

      const { error } = await service.from("complaints").update({ status }).eq("id", complaintId);
      if (error) throw error;
    } else if (body.eventType === "source.sync_completed") {
      const sourceId = body.payload.sourceId as string | undefined;
      if (!sourceId) throw new HttpError(422, "invalid_payload", "sourceId é obrigatório para source.sync_completed");

      const { error } = await service.from("sources").update({
        ingestion_status: "active",
        last_synced_at: body.occurredAt ?? new Date().toISOString(),
      }).eq("id", sourceId);
      if (error) throw error;
    }

    const { error: auditError } = await service.from("audit_logs").insert({
      action: `webhook.${body.eventType}`,
      entity_type: "webhook_event",
      metadata: {
        requestId,
        source: body.source ?? "external",
        payload: body.payload,
      },
      request_id: requestId,
    });
    if (auditError) throw auditError;

    logInfo("webhooks.success", {
      requestId,
      eventType: body.eventType,
      source: body.source ?? null,
      signatureValidated: validSignature,
    });

    return jsonResponse({ requestId, ok: true });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("webhooks.error", {
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
