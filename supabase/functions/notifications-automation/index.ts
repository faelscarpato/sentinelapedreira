import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { HttpError, toHttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { resolveAuthContext, ensureRole } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const schema = z.object({
  dryRun: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(200).optional().default(50),
  generateComplaintAlerts: z.boolean().optional().default(true),
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

    const authHeader = req.headers.get("Authorization");
    const auth = await resolveAuthContext(authHeader, false);

    if (!auth.user) {
      const automationSecret = Deno.env.get("AUTOMATION_SECRET");
      const incomingSecret = req.headers.get("x-automation-secret");
      if (!automationSecret || incomingSecret !== automationSecret) {
        throw new HttpError(401, "unauthorized", "Chamada não autorizada para automação.");
      }
    } else {
      ensureRole(auth, ["editor", "admin"]);
    }

    const payload = schema.parse(await req.json().catch(() => ({})));
    const service = getServiceClient();

    let generatedAlerts = 0;

    if (payload.generateComplaintAlerts) {
      const { data: events, error: eventsError } = await service
        .from("complaint_events")
        .select("id, complaint_id, to_status, created_at, complaints(created_by, protocol)")
        .eq("event_type", "status_changed")
        .order("created_at", { ascending: false })
        .limit(payload.limit);

      if (eventsError) throw eventsError;

      for (const event of events ?? []) {
        const ownerId = (event.complaints as { created_by?: string | null } | null)?.created_by;
        const protocol = (event.complaints as { protocol?: string | null } | null)?.protocol;
        if (!ownerId) continue;

        const dedupeKey = `${event.id}`;
        const { data: existing, error: existingError } = await service
          .from("notifications")
          .select("id")
          .eq("user_id", ownerId)
          .eq("notification_type", "complaint_update")
          .contains("data", { eventId: dedupeKey })
          .limit(1);

        if (existingError) throw existingError;
        if (existing && existing.length > 0) continue;

        if (!payload.dryRun) {
          const { error: notificationError } = await service.from("notifications").insert({
            user_id: ownerId,
            title: `Atualização da denúncia ${protocol ?? ""}`.trim(),
            body: `Sua denúncia teve mudança de status para ${event.to_status}.`,
            notification_type: "complaint_update",
            data: {
              complaintId: event.complaint_id,
              eventId: dedupeKey,
              status: event.to_status,
            },
          });
          if (notificationError) throw notificationError;
        }

        generatedAlerts += 1;
      }
    }

    const { data: deliveries, error: deliveriesError } = await service
      .from("notification_deliveries")
      .select("id, channel, status, notification_id")
      .eq("status", "pending")
      .limit(payload.limit);

    if (deliveriesError) throw deliveriesError;

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const delivery of deliveries ?? []) {
      processed += 1;

      if (payload.dryRun) continue;

      if (delivery.channel === "in_app") {
        const { error: sentError } = await service
          .from("notification_deliveries")
          .update({ status: "sent", sent_at: new Date().toISOString(), attempts: 1 })
          .eq("id", delivery.id);

        if (sentError) throw sentError;
        sent += 1;
        continue;
      }

      const { error: failError } = await service
        .from("notification_deliveries")
        .update({
          status: "failed",
          error_message: "Canal externo ainda não configurado nesta função.",
          attempts: 1,
        })
        .eq("id", delivery.id);

      if (failError) throw failError;
      failed += 1;
    }

    logInfo("notifications-automation.success", {
      requestId,
      processed,
      sent,
      failed,
      generatedAlerts,
      dryRun: payload.dryRun,
    });

    return jsonResponse({
      requestId,
      dryRun: payload.dryRun,
      generatedAlerts,
      processed,
      sent,
      failed,
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("notifications-automation.error", {
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
