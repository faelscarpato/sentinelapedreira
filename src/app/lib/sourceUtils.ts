import type { Document } from "../data/mockData";

export function isPdfDocument(document: Pick<Document, "originalUrl" | "previewMode">) {
  if (!document.originalUrl) return false;
  if (document.previewMode === "pdf") return true;
  return /\.pdf(\?|#|$)/i.test(document.originalUrl);
}

export function openExternalSource(url?: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
