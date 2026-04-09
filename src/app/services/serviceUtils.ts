import { requireSupabaseClient } from "../../lib/supabase/client";

export interface ServiceError {
  code?: string;
  message: string;
  details?: unknown;
}

export function toServiceError(error: unknown): ServiceError {
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    const maybeCode = (error as { code?: unknown }).code;
    return {
      message: typeof maybeMessage === "string" ? maybeMessage : "Erro inesperado.",
      code: typeof maybeCode === "string" ? maybeCode : undefined,
      details: error,
    };
  }

  return {
    message: "Erro inesperado.",
    details: error,
  };
}

export function getClient() {
  return requireSupabaseClient();
}
