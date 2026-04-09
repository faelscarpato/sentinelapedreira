export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof Error) {
    return new HttpError(500, "internal_error", error.message);
  }
  return new HttpError(500, "internal_error", "Erro interno inesperado.");
}
