import { getClient } from "./serviceUtils";

export async function listFavorites(userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from("favorites")
    .select("id, document_id, analysis_id, created_at, documents(title,slug), analyses(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function toggleDocumentFavorite(userId: string, documentId: string) {
  const client = getClient();

  const { data: existing, error: existingError } = await client
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .limit(1);

  if (existingError) throw new Error(existingError.message);

  if (existing && existing.length > 0) {
    const { error: removeError } = await client.from("favorites").delete().eq("id", existing[0].id);
    if (removeError) throw new Error(removeError.message);
    return false;
  }

  const { error: addError } = await client.from("favorites").insert({
    user_id: userId,
    document_id: documentId,
  });
  if (addError) throw new Error(addError.message);

  return true;
}

export async function listSavedFilters(userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from("saved_filters")
    .select("id, target, name, filter_json, is_default, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveFilter(userId: string, target: "documents" | "analyses" | "complaints", name: string, filterJson: Record<string, unknown>) {
  const client = getClient();
  const { data, error } = await client
    .from("saved_filters")
    .insert({
      user_id: userId,
      target,
      name,
      filter_json: filterJson,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function listNotifications(userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from("notifications")
    .select("id, title, body, notification_type, is_read, created_at, data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationAsRead(notificationId: string) {
  const client = getClient();
  const { error } = await client
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
}
