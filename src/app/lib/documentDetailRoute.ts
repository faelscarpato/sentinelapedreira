import type { Document } from "../data/realData";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function deriveDocumentSlug(document: Pick<Document, "id" | "title" | "slug">) {
  if (document.slug && document.slug.trim().length > 0) {
    return document.slug.trim();
  }

  const titlePart = slugify(document.title).slice(0, 64);
  const idPart = slugify(document.id).slice(0, 48);
  const fallback = [titlePart, idPart].filter(Boolean).join("-");

  return fallback.length > 0 ? fallback : slugify(document.id);
}

export function getDocumentDetailHref(document: Pick<Document, "id" | "title" | "slug">) {
  return `/documentos/${deriveDocumentSlug(document)}`;
}
