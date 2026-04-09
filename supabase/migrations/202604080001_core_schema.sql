create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists vector;

do $$
begin
  create type public.profile_status as enum ('active', 'suspended', 'deleted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.source_type as enum ('official_portal', 'official_gazette', 'legislative_portal', 'oversight_portal', 'uploaded', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.source_ingestion_status as enum ('pending', 'active', 'error', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_status as enum ('draft', 'in_review', 'published', 'archived', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.risk_level as enum ('critical', 'high', 'medium', 'low');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.analysis_status as enum ('draft', 'in_review', 'published', 'archived', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_decision as enum ('pending', 'approved', 'rejected', 'changes_requested');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.complaint_status as enum ('submitted', 'triage', 'in_review', 'awaiting_info', 'resolved', 'rejected', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.complaint_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_channel as enum ('in_app', 'email', 'webhook');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('system', 'complaint_update', 'editorial', 'alert', 'digest');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.delivery_status as enum ('pending', 'sent', 'failed', 'retrying');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.chat_session_status as enum ('active', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.chat_message_role as enum ('system', 'user', 'assistant', 'tool');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('public', 'authenticated_user', 'editor', 'reviewer', 'admin', 'auditor')),
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger trg_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  bio text,
  status public.profile_status not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  scope_type text not null default 'global' check (scope_type in ('global', 'category', 'document', 'analysis', 'complaint')),
  scope_id uuid,
  granted_by uuid references auth.users(id),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_user_roles_active_scope
  on public.user_roles (user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_active = true;

create index if not exists ix_user_roles_user_id on public.user_roles (user_id);
create index if not exists ix_user_roles_role_id on public.user_roles (role_id);

create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_updated_at();

create or replace function public.current_role_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.key order by r.key), '{}')
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid()
    and ur.is_active = true
    and (ur.expires_at is null or ur.expires_at > timezone('utc'::text, now()));
$$;

create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select role_key = any(public.current_role_keys());
$$;

create or replace function public.has_any_role(role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_keys() && coalesce(role_keys, '{}'::text[]);
$$;

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_user_id uuid references auth.users(id),
  actor_roles text[] not null default '{}',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_audit_logs_actor_user_id on public.audit_logs (actor_user_id);
create index if not exists ix_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index if not exists ix_audit_logs_created_at on public.audit_logs (created_at desc);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text,
  source_type public.source_type not null default 'other',
  is_official boolean not null default false,
  ingestion_status public.source_ingestion_status not null default 'pending',
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz
);

create trigger trg_sources_updated_at
before update on public.sources
for each row
execute function public.set_updated_at();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  external_ref text,
  slug text not null unique,
  title text not null,
  summary text,
  body_markdown text,
  category text not null,
  subtype text,
  status public.document_status not null default 'draft',
  publication_date date,
  published_at timestamptz,
  published_by uuid references auth.users(id),
  risk_level public.risk_level not null default 'low',
  language_code text not null default 'pt-BR',
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(body_markdown, '')), 'C')
  ) stored,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz
);

create index if not exists ix_documents_status on public.documents (status);
create index if not exists ix_documents_published_at on public.documents (published_at desc);
create index if not exists ix_documents_category on public.documents (category);
create index if not exists ix_documents_source on public.documents (source_id);
create index if not exists ix_documents_search_vector on public.documents using gin (search_vector);

create trigger trg_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create table if not exists public.document_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  is_primary boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_document_files_document_path on public.document_files (document_id, path);
create index if not exists ix_document_files_document_id on public.document_files (document_id);

create trigger trg_document_files_updated_at
before update on public.document_files
for each row
execute function public.set_updated_at();

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null,
  summary text,
  body_markdown text,
  change_reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_document_versions on public.document_versions (document_id, version_number);
create index if not exists ix_document_versions_document_id on public.document_versions (document_id);

create table if not exists public.document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  event_type text not null,
  from_status public.document_status,
  to_status public.document_status,
  note text,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_document_events_document_id on public.document_events (document_id, created_at desc);

create table if not exists public.document_tags (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'topic' check (tag_type in ('topic', 'entity', 'jurisdiction', 'alert')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_document_tags on public.document_tags (document_id, tag, tag_type);
create index if not exists ix_document_tags_tag on public.document_tags (tag);

create table if not exists public.document_relations (
  id uuid primary key default gen_random_uuid(),
  from_document_id uuid not null references public.documents(id) on delete cascade,
  to_document_id uuid not null references public.documents(id) on delete cascade,
  relation_type text not null check (relation_type in ('references', 'supersedes', 'related', 'cites', 'duplicates')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint ck_document_relations_distinct check (from_document_id <> to_document_id)
);

create unique index if not exists uq_document_relations on public.document_relations (from_document_id, to_document_id, relation_type);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete set null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_count integer check (token_count is null or token_count >= 0),
  visibility text not null default 'published_only' check (visibility in ('published_only', 'internal_only')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_document_chunks_idx on public.document_chunks (document_id, chunk_index);
create index if not exists ix_document_chunks_document_id on public.document_chunks (document_id);
create index if not exists ix_document_chunks_content_trgm on public.document_chunks using gin (content gin_trgm_ops);

create trigger trg_document_chunks_updated_at
before update on public.document_chunks
for each row
execute function public.set_updated_at();

create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null unique references public.document_chunks(id) on delete cascade,
  provider text not null,
  model text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_embeddings_vector
  on public.embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete set null,
  analysis_type text not null check (analysis_type in ('legal_assistant', 'financial_traceability', 'editorial_summary', 'rag_answer', 'other')),
  title text not null,
  status public.analysis_status not null default 'draft',
  summary text,
  content_markdown text,
  confidence_score numeric(5, 2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz
);

create index if not exists ix_analyses_status on public.analyses (status);
create index if not exists ix_analyses_document_id on public.analyses (document_id);
create index if not exists ix_analyses_published_at on public.analyses (published_at desc);

create trigger trg_analyses_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

create table if not exists public.analysis_versions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  summary text,
  content_markdown text,
  change_reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_analysis_versions on public.analysis_versions (analysis_id, version_number);
create index if not exists ix_analysis_versions_analysis_id on public.analysis_versions (analysis_id);

create table if not exists public.analysis_reviews (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id),
  decision public.review_decision not null default 'pending',
  comments text,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_analysis_reviews_analysis_id on public.analysis_reviews (analysis_id);
create index if not exists ix_analysis_reviews_reviewer on public.analysis_reviews (reviewer_user_id);

create trigger trg_analysis_reviews_updated_at
before update on public.analysis_reviews
for each row
execute function public.set_updated_at();

create table if not exists public.analysis_citations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  source_document_id uuid not null references public.documents(id) on delete cascade,
  source_chunk_id uuid references public.document_chunks(id) on delete set null,
  quote text,
  excerpt text,
  start_offset integer,
  end_offset integer,
  confidence_score numeric(5, 2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint ck_analysis_citations_offsets check (
    (start_offset is null and end_offset is null) or
    (start_offset is not null and end_offset is not null and start_offset >= 0 and end_offset >= start_offset)
  )
);

create index if not exists ix_analysis_citations_analysis_id on public.analysis_citations (analysis_id);
create index if not exists ix_analysis_citations_document_id on public.analysis_citations (source_document_id);

create table if not exists public.analysis_flags (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  flag_type text not null,
  severity public.risk_level not null default 'medium',
  message text not null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_analysis_flags_analysis_id on public.analysis_flags (analysis_id);
create index if not exists ix_analysis_flags_resolved_at on public.analysis_flags (resolved_at);

create trigger trg_analysis_flags_updated_at
before update on public.analysis_flags
for each row
execute function public.set_updated_at();

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  is_anonymous boolean not null default false,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  category text not null,
  subject text not null,
  description text not null,
  status public.complaint_status not null default 'submitted',
  priority public.complaint_priority not null default 'medium',
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_summary text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,
  constraint ck_complaints_identity check (
    (is_anonymous = true and reporter_name is null and reporter_email is null and reporter_phone is null) or
    (is_anonymous = false)
  )
);

create index if not exists ix_complaints_created_by on public.complaints (created_by);
create index if not exists ix_complaints_status on public.complaints (status);
create index if not exists ix_complaints_created_at on public.complaints (created_at desc);

create trigger trg_complaints_updated_at
before update on public.complaints
for each row
execute function public.set_updated_at();

create table if not exists public.complaint_attachments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_complaint_attachments on public.complaint_attachments (complaint_id, path);
create index if not exists ix_complaint_attachments_complaint_id on public.complaint_attachments (complaint_id);

create table if not exists public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  event_type text not null,
  from_status public.complaint_status,
  to_status public.complaint_status,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_complaint_events_complaint on public.complaint_events (complaint_id, created_at desc);

create table if not exists public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status public.complaint_status not null,
  reason text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_complaint_status_history on public.complaint_status_history (complaint_id, changed_at desc);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint ck_favorites_single_target check (num_nonnulls(document_id, analysis_id) = 1)
);

create unique index if not exists uq_favorites_document on public.favorites (user_id, document_id) where document_id is not null;
create unique index if not exists uq_favorites_analysis on public.favorites (user_id, analysis_id) where analysis_id is not null;
create index if not exists ix_favorites_user on public.favorites (user_id);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('documents', 'analyses', 'complaints')),
  name text not null,
  filter_json jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_saved_filters_name on public.saved_filters (user_id, target, name);
create index if not exists ix_saved_filters_user on public.saved_filters (user_id);

create trigger trg_saved_filters_updated_at
before update on public.saved_filters
for each row
execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel public.subscription_channel not null,
  topic text not null,
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_subscriptions_topic on public.subscriptions (user_id, channel, topic);
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type public.notification_type not null default 'system',
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists ix_notifications_unread on public.notifications (user_id) where is_read = false;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel public.subscription_channel not null,
  status public.delivery_status not null default 'pending',
  provider text,
  provider_message_id text,
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_notification_deliveries on public.notification_deliveries (notification_id, channel);
create index if not exists ix_notification_deliveries_status on public.notification_deliveries (status);

create trigger trg_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row
execute function public.set_updated_at();

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  status public.chat_session_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_chat_sessions_user on public.chat_sessions (user_id, created_at desc);

create trigger trg_chat_sessions_updated_at
before update on public.chat_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role public.chat_message_role not null,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  confidence_score numeric(5, 2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  model_provider text,
  model_name text,
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_chat_messages_session on public.chat_messages (session_id, created_at asc);

create table if not exists public.retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete set null,
  query text not null,
  top_k integer not null default 5 check (top_k > 0),
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0 check (result_count >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  retrieved_chunks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_retrieval_logs_session on public.retrieval_logs (session_id, created_at desc);

create or replace function public.generate_complaint_protocol()
returns text
language plpgsql
as $$
declare
  generated text;
begin
  generated := 'DEN-' || to_char(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
  return generated;
end;
$$;

create or replace function public.handle_complaint_protocol()
returns trigger
language plpgsql
as $$
begin
  if new.protocol is null or length(trim(new.protocol)) = 0 then
    new.protocol := public.generate_complaint_protocol();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_complaints_protocol on public.complaints;
create trigger trg_complaints_protocol
before insert on public.complaints
for each row
execute function public.handle_complaint_protocol();

create or replace function public.track_complaint_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.complaint_status_history (complaint_id, status, reason, changed_by, changed_at)
    values (new.id, new.status, 'initial_status', auth.uid(), timezone('utc'::text, now()));

    insert into public.complaint_events (complaint_id, event_type, to_status, note, actor_user_id)
    values (new.id, 'complaint_created', new.status, 'Denúncia registrada', auth.uid());
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.complaint_status_history (complaint_id, status, reason, changed_by, changed_at)
    values (new.id, new.status, 'status_changed', auth.uid(), timezone('utc'::text, now()));

    insert into public.complaint_events (complaint_id, event_type, from_status, to_status, note, actor_user_id)
    values (new.id, 'status_changed', old.status, new.status, 'Status atualizado', auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_complaints_status_tracking on public.complaints;
create trigger trg_complaints_status_tracking
after insert or update of status on public.complaints
for each row
execute function public.track_complaint_status();

create or replace function public.track_document_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.document_events (document_id, event_type, to_status, note, actor_user_id)
    values (new.id, 'document_created', new.status, 'Documento criado', auth.uid());
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.document_events (document_id, event_type, from_status, to_status, note, actor_user_id)
    values (new.id, 'status_changed', old.status, new.status, 'Status atualizado', auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_documents_status_tracking on public.documents;
create trigger trg_documents_status_tracking
after insert or update of status on public.documents
for each row
execute function public.track_document_status();

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    actor_user_id,
    actor_roles,
    action,
    entity_type,
    entity_id,
    metadata,
    request_id
  )
  values (
    auth.uid(),
    public.current_role_keys(),
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb),
    p_request_id
  );
end;
$$;

create or replace function public.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_uuid uuid;
  payload jsonb;
begin
  if tg_op = 'DELETE' then
    entity_uuid := old.id;
    payload := jsonb_build_object('old', to_jsonb(old));
  elsif tg_op = 'UPDATE' then
    entity_uuid := new.id;
    payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    entity_uuid := new.id;
    payload := jsonb_build_object('new', to_jsonb(new));
  end if;

  perform public.write_audit_log(
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    entity_uuid,
    payload
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_documents on public.documents;
create trigger trg_audit_documents
after insert or update or delete on public.documents
for each row execute function public.audit_row_changes();

drop trigger if exists trg_audit_analyses on public.analyses;
create trigger trg_audit_analyses
after insert or update or delete on public.analyses
for each row execute function public.audit_row_changes();

drop trigger if exists trg_audit_complaints on public.complaints;
create trigger trg_audit_complaints
after insert or update or delete on public.complaints
for each row execute function public.audit_row_changes();

drop trigger if exists trg_audit_user_roles on public.user_roles;
create trigger trg_audit_user_roles
after insert or update or delete on public.user_roles
for each row execute function public.audit_row_changes();

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
begin
  insert into public.profiles (id, full_name, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  )
  on conflict (id) do nothing;

  select id into default_role_id
  from public.roles
  where key = 'authenticated_user'
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id, granted_by, is_active)
    values (new.id, default_role_id, new.id, true)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

create or replace function public.search_public_documents(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  category text,
  subtype text,
  published_at timestamptz,
  rank real
)
language sql
stable
as $$
  with ranked as (
    select
      d.id,
      d.slug,
      d.title,
      d.summary,
      d.category,
      d.subtype,
      d.published_at,
      case
        when p_query is null or length(trim(p_query)) = 0 then 0::real
        else ts_rank_cd(d.search_vector, websearch_to_tsquery('portuguese', p_query))
      end as rank_score
    from public.documents d
    where d.deleted_at is null
      and d.status = 'published'
      and d.published_at is not null
      and (
        p_query is null
        or length(trim(p_query)) = 0
        or d.search_vector @@ websearch_to_tsquery('portuguese', p_query)
      )
  )
  select
    ranked.id,
    ranked.slug,
    ranked.title,
    ranked.summary,
    ranked.category,
    ranked.subtype,
    ranked.published_at,
    ranked.rank_score as rank
  from ranked
  order by ranked.rank_score desc, ranked.published_at desc nulls last, ranked.title asc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;
