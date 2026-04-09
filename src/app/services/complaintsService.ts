import type { ComplaintFormInput } from "../../features/complaints/schema";
import { getClient } from "./serviceUtils";

export interface ComplaintRecord {
  id: string;
  protocol: string;
  status: string;
  category: string;
  subject: string;
  description: string;
  created_at: string;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function submitComplaint(input: ComplaintFormInput, files: File[] = [], userId?: string) {
  const client = getClient();

  if (files.length > 0 && !userId) {
    throw new Error("Anexos exigem autenticação para garantir rastreabilidade segura.");
  }

  const payload = {
    created_by: input.anonymous ? null : userId ?? null,
    is_anonymous: input.anonymous,
    reporter_name: input.anonymous ? null : input.name || null,
    reporter_email: input.anonymous ? null : input.email || null,
    reporter_phone: input.anonymous ? null : input.phone || null,
    category: input.category,
    subject: input.subject,
    description: input.description,
    metadata: {
      source: "sentinela-web",
      has_attachments: files.length > 0,
    },
  };

  const { data: complaint, error } = await client
    .from("complaints")
    .insert(payload)
    .select("id, protocol, status, category, subject, description, created_at")
    .single();

  if (error || !complaint) {
    throw new Error(error?.message ?? "Falha ao registrar denúncia.");
  }

  if (files.length > 0) {
    for (const file of files) {
      const path = `${complaint.id}/${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await client.storage
        .from("complaint-attachments")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        throw new Error(`Falha ao enviar anexo \"${file.name}\": ${uploadError.message}`);
      }

      const { error: attachmentError } = await client.from("complaint_attachments").insert({
        complaint_id: complaint.id,
        bucket: "complaint-attachments",
        path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: userId,
      });

      if (attachmentError) {
        throw new Error(`Falha ao persistir metadados do anexo \"${file.name}\".`);
      }
    }
  }

  return complaint as ComplaintRecord;
}

export async function fetchMyComplaints(userId: string) {
  const client = getClient();
  const { data, error } = await client
    .from("complaints")
    .select("id, protocol, status, category, subject, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchComplaintTimeline(complaintId: string) {
  const client = getClient();
  const { data, error } = await client
    .from("complaint_events")
    .select("id, event_type, from_status, to_status, note, created_at")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
