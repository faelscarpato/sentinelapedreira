import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { HttpError, toHttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { resolveAuthContext } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { checkRateLimit, extractClientIp } from "../_shared/rate-limit.ts";

const complaintCategories = [
  "licitacao",
  "obras",
  "recursos",
  "patrimonio",
  "pessoal",
  "servicos",
  "outro",
] as const;

const schema = z.object({
  name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  category: z.enum(complaintCategories),
  subject: z.string().min(8).max(180),
  description: z.string().min(50).max(10000),
  anonymous: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.anonymous) {
    return;
  }

  if (!value.email && !value.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Informe e-mail ou telefone para acompanhamento da denúncia.",
    });
  }
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

    const auth = await resolveAuthContext(req.headers.get("Authorization"), false);
    const clientIp = extractClientIp(req);
    const payload = schema.parse(await req.json());

    const rateLimit = await checkRateLimit({
      scope: "complaint.submit",
      key: auth.user?.id ? `user:${auth.user.id}` : `ip:${clientIp}`,
      limit: auth.user
        ? Number(Deno.env.get("RATE_LIMIT_COMPLAINT_USER_MAX") ?? "15")
        : Number(Deno.env.get("RATE_LIMIT_COMPLAINT_ANON_MAX") ?? "5"),
      windowSeconds: Number(Deno.env.get("RATE_LIMIT_COMPLAINT_WINDOW_SECONDS") ?? "3600"),
    });

    if (!rateLimit.allowed) {
      logInfo("complaint-submit.rate_limited", {
        requestId,
        userId: auth.user?.id ?? null,
        clientIp,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });

      return jsonResponse({
        requestId,
        error: "rate_limited",
        message: "Muitas denúncias enviadas em curto intervalo. Tente novamente mais tarde.",
        details: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          resetAt: rateLimit.resetAt,
        },
      }, 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt,
      });
    }

    if (!payload.anonymous && !auth.user && !payload.email && !payload.phone) {
      throw new HttpError(422, "missing_contact", "Denúncia não anônima exige e-mail ou telefone.");
    }

    const service = getServiceClient();
    const userAgent = req.headers.get("user-agent");

    const { data: complaint, error: complaintError } = await service
      .from("complaints")
      .insert({
        created_by: payload.anonymous ? null : auth.user?.id ?? null,
        is_anonymous: payload.anonymous,
        reporter_name: payload.anonymous ? null : payload.name || null,
        reporter_email: payload.anonymous ? null : payload.email || null,
        reporter_phone: payload.anonymous ? null : payload.phone || null,
        category: payload.category,
        subject: payload.subject,
        description: payload.description,
        metadata: {
          source: "sentinela-web",
          channel: "edge-function",
          requestId,
          clientIp,
          userAgent,
        },
      })
      .select("id, protocol, status, category, subject, description, created_at")
      .single();

    if (complaintError || !complaint) {
      throw new HttpError(500, "complaint_insert_failed", "Falha ao registrar denúncia.", complaintError);
    }

    const { error: auditError } = await service.from("audit_logs").insert({
      action: "complaint.submit",
      entity_type: "complaints",
      entity_id: complaint.id,
      request_id: requestId,
      actor_user_id: auth.user?.id ?? null,
      metadata: {
        protocol: complaint.protocol,
        category: complaint.category,
        anonymous: payload.anonymous,
        clientIp,
        userAgent,
      },
    });

    if (auditError) {
      logError("complaint-submit.audit_failed", {
        requestId,
        complaintId: complaint.id,
        message: auditError.message,
      });
    }

    logInfo("complaint-submit.success", {
      requestId,
      complaintId: complaint.id,
      protocol: complaint.protocol,
      userId: auth.user?.id ?? null,
      anonymous: payload.anonymous,
      clientIp,
    });

    return jsonResponse({
      requestId,
      complaint,
    }, 200, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": rateLimit.resetAt,
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("complaint-submit.error", {
      requestId,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });

    const headers = normalized.status === 429
      ? {
        "Retry-After": String((normalized.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 60),
      }
      : {};

    return jsonResponse({
      requestId,
      error: normalized.code,
      message: normalized.message,
      details: normalized.details,
    }, normalized.status, headers);
  }
});
