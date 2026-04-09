import { getClient } from "./serviceUtils";

export interface SearchDocumentResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  subtype: string | null;
  published_at: string;
  rank: number;
}

export async function searchPublicDocuments(query: string, limit = 8) {
  const client = getClient();
  const { data, error } = await client.rpc("search_public_documents", {
    p_query: query,
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SearchDocumentResult[];
}

export async function fetchEditorialDocumentQueue() {
  const client = getClient();
  const { data, error } = await client
    .from("documents")
    .select("id, title, category, status, created_at, updated_at")
    .in("status", ["draft", "in_review"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchEditorialAnalysisQueue() {
  const client = getClient();
  const { data, error } = await client
    .from("analyses")
    .select("id, title, analysis_type, status, created_at, updated_at")
    .in("status", ["draft", "in_review"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function publishDocument(documentId: string, userId: string) {
  const client = getClient();
  const { error } = await client
    .from("documents")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_by: userId,
      updated_by: userId,
    })
    .eq("id", documentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function publishAnalysis(analysisId: string, userId: string) {
  const client = getClient();
  const { error } = await client
    .from("analyses")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_by: userId,
      updated_by: userId,
    })
    .eq("id", analysisId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitAnalysisReview(
  analysisId: string,
  reviewerUserId: string,
  decision: "approved" | "rejected" | "changes_requested",
  comments?: string,
) {
  const client = getClient();
  const { error } = await client.from("analysis_reviews").insert({
    analysis_id: analysisId,
    reviewer_user_id: reviewerUserId,
    decision,
    comments: comments ?? null,
    decided_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  const nextStatus = decision === "approved" ? "in_review" : "draft";
  const { error: statusError } = await client
    .from("analyses")
    .update({ status: nextStatus, updated_by: reviewerUserId })
    .eq("id", analysisId);

  if (statusError) {
    throw new Error(statusError.message);
  }
}
