import { getClient } from "./serviceUtils";
import { resolveDocumentOriginLabel } from "../lib/documentOrigin";

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  source_type: string;
  is_official: boolean;
  last_synced_at: string | null;
}

interface DocumentRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  category: string;
  subtype: string | null;
  publication_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
  sources: SourceRow | null;
}

interface TagRow {
  tag: string;
  tag_type: string;
}

export interface PublicDocumentDetail {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMarkdown: string | null;
  category: string;
  subtype: string | null;
  publicationDate: string | null;
  publishedAt: string | null;
  capturedAt: string | null;
  originalUrl: string | null;
  sourceName: string;
  sourceSlug: string | null;
  sourceDomain: string | null;
  sourceType: string | null;
  sourceIsOfficial: boolean;
  tags: Array<{ value: string; type: string }>;
  metadata: Record<string, unknown>;
  originLabel: string;
}

export async function fetchPublicDocumentBySlug(slug: string): Promise<PublicDocumentDetail | null> {
  const client = getClient();
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const { data: row, error } = await client
    .from("documents")
    .select(`
      id,
      slug,
      title,
      summary,
      body_markdown,
      category,
      subtype,
      publication_date,
      published_at,
      created_at,
      updated_at,
      metadata,
      sources:source_id (
        id,
        slug,
        name,
        domain,
        source_type,
        is_official,
        last_synced_at
      )
    `)
    .eq("slug", normalizedSlug)
    .is("deleted_at", null)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row) {
    return null;
  }

  const typedRow = row as unknown as DocumentRow;

  const { data: tagRows, error: tagError } = await client
    .from("document_tags")
    .select("tag, tag_type")
    .eq("document_id", typedRow.id)
    .order("tag", { ascending: true });

  if (tagError) {
    throw new Error(tagError.message);
  }

  const metadata = typedRow.metadata ?? {};
  const source = typedRow.sources;
  const sourceName = source?.name ?? "Fonte oficial";
  const sourceDomain = source?.domain ?? null;
  const originalUrl = typeof metadata.original_url === "string" ? metadata.original_url : null;
  const capturedAt = typeof metadata.synced_at === "string"
    ? metadata.synced_at
    : source?.last_synced_at ?? null;
  const tags = ((tagRows ?? []) as TagRow[]).map((item) => ({
    value: item.tag,
    type: item.tag_type,
  }));

  return {
    id: typedRow.id,
    slug: typedRow.slug,
    title: typedRow.title,
    summary: typedRow.summary,
    bodyMarkdown: typedRow.body_markdown,
    category: typedRow.category,
    subtype: typedRow.subtype,
    publicationDate: typedRow.publication_date,
    publishedAt: typedRow.published_at,
    capturedAt,
    originalUrl,
    sourceName,
    sourceSlug: source?.slug ?? null,
    sourceDomain,
    sourceType: source?.source_type ?? null,
    sourceIsOfficial: source?.is_official ?? false,
    tags,
    metadata,
    originLabel: resolveDocumentOriginLabel({
      source: source?.slug ?? undefined,
      sourceEntity: sourceName,
      domain: sourceDomain ?? undefined,
      metadata,
    }),
  };
}
