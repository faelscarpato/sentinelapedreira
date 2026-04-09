grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

grant execute on function public.search_public_documents(text, integer, integer) to anon, authenticated;
grant execute on function public.current_role_keys() to authenticated;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('editor');
$$;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('reviewer');
$$;

create or replace function public.is_auditor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('auditor');
$$;

create or replace function public.can_manage_editorial()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['editor', 'admin']);
$$;

create or replace function public.can_review_editorial()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['reviewer', 'admin']);
$$;

create or replace function public.can_read_audit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['auditor', 'admin']);
$$;

create or replace function public.user_owns_complaint(complaint_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.complaints c
    where c.id = complaint_uuid
      and c.created_by = auth.uid()
      and c.deleted_at is null
  );
$$;

create or replace function public.user_owns_chat_session(session_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_sessions s
    where s.id = session_uuid
      and s.user_id = auth.uid()
  );
$$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sources enable row level security;
alter table public.documents enable row level security;
alter table public.document_files enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_events enable row level security;
alter table public.document_tags enable row level security;
alter table public.document_relations enable row level security;
alter table public.document_chunks enable row level security;
alter table public.embeddings enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_versions enable row level security;
alter table public.analysis_reviews enable row level security;
alter table public.analysis_citations enable row level security;
alter table public.analysis_flags enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_attachments enable row level security;
alter table public.complaint_events enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_filters enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.retrieval_logs enable row level security;

drop policy if exists roles_select_all on public.roles;
create policy roles_select_all
on public.roles for select
using (true);

drop policy if exists roles_admin_write on public.roles;
create policy roles_admin_write
on public.roles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy
on public.profiles for select
using (auth.uid() = id or public.can_read_audit() or public.can_manage_editorial() or public.can_review_editorial());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles for insert
with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin
on public.profiles for delete
using (public.is_admin());

drop policy if exists user_roles_select_policy on public.user_roles;
create policy user_roles_select_policy
on public.user_roles for select
using (user_id = auth.uid() or public.can_read_audit() or public.is_admin());

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write
on public.user_roles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists audit_logs_read_policy on public.audit_logs;
create policy audit_logs_read_policy
on public.audit_logs for select
using (public.can_read_audit());

drop policy if exists audit_logs_insert_policy on public.audit_logs;
create policy audit_logs_insert_policy
on public.audit_logs for insert
with check (auth.role() = 'service_role' or public.is_admin());

drop policy if exists sources_select_policy on public.sources;
create policy sources_select_policy
on public.sources for select
using (
  deleted_at is null and (
    public.can_manage_editorial()
    or public.can_review_editorial()
    or public.can_read_audit()
    or exists (
      select 1
      from public.documents d
      where d.source_id = sources.id
        and d.status = 'published'
        and d.deleted_at is null
    )
  )
);

drop policy if exists sources_editor_write on public.sources;
create policy sources_editor_write
on public.sources for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists documents_select_policy on public.documents;
create policy documents_select_policy
on public.documents for select
using (
  (
    deleted_at is null
    and status = 'published'
    and published_at is not null
  )
  or (auth.uid() is not null and created_by = auth.uid())
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists documents_editor_insert on public.documents;
create policy documents_editor_insert
on public.documents for insert
with check (public.can_manage_editorial());

drop policy if exists documents_editor_update on public.documents;
create policy documents_editor_update
on public.documents for update
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists documents_admin_delete on public.documents;
create policy documents_admin_delete
on public.documents for delete
using (public.is_admin());

drop policy if exists document_files_select_policy on public.document_files;
create policy document_files_select_policy
on public.document_files for select
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_files.document_id
      and (
        (d.deleted_at is null and d.status = 'published' and d.published_at is not null)
        or (auth.uid() is not null and d.created_by = auth.uid())
        or public.can_manage_editorial()
        or public.can_review_editorial()
        or public.can_read_audit()
      )
  )
);

drop policy if exists document_files_editor_write on public.document_files;
create policy document_files_editor_write
on public.document_files for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists document_versions_select_policy on public.document_versions;
create policy document_versions_select_policy
on public.document_versions for select
using (
  exists (
    select 1 from public.documents d
    where d.id = document_versions.document_id
      and (
        (d.deleted_at is null and d.status = 'published' and d.published_at is not null)
        or public.can_manage_editorial()
        or public.can_review_editorial()
        or public.can_read_audit()
      )
  )
);

drop policy if exists document_versions_editor_write on public.document_versions;
create policy document_versions_editor_write
on public.document_versions for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists document_events_select_policy on public.document_events;
create policy document_events_select_policy
on public.document_events for select
using (public.can_manage_editorial() or public.can_review_editorial() or public.can_read_audit());

drop policy if exists document_events_editor_write on public.document_events;
create policy document_events_editor_write
on public.document_events for insert
with check (public.can_manage_editorial() or public.can_review_editorial() or auth.role() = 'service_role');

drop policy if exists document_tags_select_policy on public.document_tags;
create policy document_tags_select_policy
on public.document_tags for select
using (
  exists (
    select 1 from public.documents d
    where d.id = document_tags.document_id
      and (
        (d.deleted_at is null and d.status = 'published' and d.published_at is not null)
        or public.can_manage_editorial()
        or public.can_review_editorial()
        or public.can_read_audit()
      )
  )
);

drop policy if exists document_tags_editor_write on public.document_tags;
create policy document_tags_editor_write
on public.document_tags for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists document_relations_select_policy on public.document_relations;
create policy document_relations_select_policy
on public.document_relations for select
using (
  public.can_manage_editorial() or public.can_review_editorial() or public.can_read_audit()
  or (
    exists (select 1 from public.documents d1 where d1.id = from_document_id and d1.status = 'published' and d1.deleted_at is null)
    and exists (select 1 from public.documents d2 where d2.id = to_document_id and d2.status = 'published' and d2.deleted_at is null)
  )
);

drop policy if exists document_relations_editor_write on public.document_relations;
create policy document_relations_editor_write
on public.document_relations for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists document_chunks_select_policy on public.document_chunks;
create policy document_chunks_select_policy
on public.document_chunks for select
using (
  public.can_manage_editorial() or public.can_review_editorial() or public.can_read_audit()
  or (
    visibility = 'published_only'
    and exists (
      select 1 from public.documents d
      where d.id = document_chunks.document_id
        and d.status = 'published'
        and d.deleted_at is null
    )
  )
);

drop policy if exists document_chunks_editor_write on public.document_chunks;
create policy document_chunks_editor_write
on public.document_chunks for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists embeddings_select_policy on public.embeddings;
create policy embeddings_select_policy
on public.embeddings for select
using (public.can_manage_editorial() or public.can_review_editorial() or public.can_read_audit());

drop policy if exists embeddings_editor_write on public.embeddings;
create policy embeddings_editor_write
on public.embeddings for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists analyses_select_policy on public.analyses;
create policy analyses_select_policy
on public.analyses for select
using (
  (
    deleted_at is null
    and status = 'published'
    and published_at is not null
  )
  or (auth.uid() is not null and created_by = auth.uid())
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists analyses_editor_insert on public.analyses;
create policy analyses_editor_insert
on public.analyses for insert
with check (public.can_manage_editorial() or auth.role() = 'service_role');

drop policy if exists analyses_editor_update on public.analyses;
create policy analyses_editor_update
on public.analyses for update
using (public.can_manage_editorial() or auth.role() = 'service_role')
with check (public.can_manage_editorial() or auth.role() = 'service_role');

drop policy if exists analyses_admin_delete on public.analyses;
create policy analyses_admin_delete
on public.analyses for delete
using (public.is_admin());

drop policy if exists analysis_versions_select_policy on public.analysis_versions;
create policy analysis_versions_select_policy
on public.analysis_versions for select
using (
  exists (
    select 1 from public.analyses a
    where a.id = analysis_versions.analysis_id
      and (
        (a.deleted_at is null and a.status = 'published' and a.published_at is not null)
        or public.can_manage_editorial()
        or public.can_review_editorial()
        or public.can_read_audit()
      )
  )
);

drop policy if exists analysis_versions_editor_write on public.analysis_versions;
create policy analysis_versions_editor_write
on public.analysis_versions for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists analysis_reviews_select_policy on public.analysis_reviews;
create policy analysis_reviews_select_policy
on public.analysis_reviews for select
using (
  public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
  or reviewer_user_id = auth.uid()
);

drop policy if exists analysis_reviews_insert_policy on public.analysis_reviews;
create policy analysis_reviews_insert_policy
on public.analysis_reviews for insert
with check (public.can_review_editorial());

drop policy if exists analysis_reviews_update_policy on public.analysis_reviews;
create policy analysis_reviews_update_policy
on public.analysis_reviews for update
using (public.can_review_editorial())
with check (public.can_review_editorial());

drop policy if exists analysis_citations_select_policy on public.analysis_citations;
create policy analysis_citations_select_policy
on public.analysis_citations for select
using (
  public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
  or exists (
    select 1 from public.analyses a
    where a.id = analysis_citations.analysis_id
      and a.status = 'published'
      and a.deleted_at is null
  )
);

drop policy if exists analysis_citations_editor_write on public.analysis_citations;
create policy analysis_citations_editor_write
on public.analysis_citations for all
using (public.can_manage_editorial())
with check (public.can_manage_editorial());

drop policy if exists analysis_flags_select_policy on public.analysis_flags;
create policy analysis_flags_select_policy
on public.analysis_flags for select
using (public.can_manage_editorial() or public.can_review_editorial() or public.can_read_audit());

drop policy if exists analysis_flags_write_policy on public.analysis_flags;
create policy analysis_flags_write_policy
on public.analysis_flags for all
using (public.can_manage_editorial() or public.can_review_editorial())
with check (public.can_manage_editorial() or public.can_review_editorial());

drop policy if exists complaints_insert_policy on public.complaints;
create policy complaints_insert_policy
on public.complaints for insert
with check (
  (
    auth.uid() is null and created_by is null
  ) or (
    auth.uid() is not null and (created_by = auth.uid() or created_by is null)
  )
);

drop policy if exists complaints_select_policy on public.complaints;
create policy complaints_select_policy
on public.complaints for select
using (
  (auth.uid() is not null and created_by = auth.uid() and deleted_at is null)
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists complaints_update_policy on public.complaints;
create policy complaints_update_policy
on public.complaints for update
using (public.can_manage_editorial() or public.can_review_editorial())
with check (public.can_manage_editorial() or public.can_review_editorial());

drop policy if exists complaints_delete_policy on public.complaints;
create policy complaints_delete_policy
on public.complaints for delete
using (public.is_admin());

drop policy if exists complaint_attachments_select_policy on public.complaint_attachments;
create policy complaint_attachments_select_policy
on public.complaint_attachments for select
using (
  public.user_owns_complaint(complaint_id)
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists complaint_attachments_insert_policy on public.complaint_attachments;
create policy complaint_attachments_insert_policy
on public.complaint_attachments for insert
with check (
  public.user_owns_complaint(complaint_id)
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or auth.role() = 'service_role'
);

drop policy if exists complaint_attachments_delete_policy on public.complaint_attachments;
create policy complaint_attachments_delete_policy
on public.complaint_attachments for delete
using (
  public.user_owns_complaint(complaint_id)
  or public.can_manage_editorial()
  or public.can_review_editorial()
);

drop policy if exists complaint_events_select_policy on public.complaint_events;
create policy complaint_events_select_policy
on public.complaint_events for select
using (
  public.user_owns_complaint(complaint_id)
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists complaint_events_insert_policy on public.complaint_events;
create policy complaint_events_insert_policy
on public.complaint_events for insert
with check (
  public.can_manage_editorial()
  or public.can_review_editorial()
  or auth.role() = 'service_role'
);

drop policy if exists complaint_status_history_select_policy on public.complaint_status_history;
create policy complaint_status_history_select_policy
on public.complaint_status_history for select
using (
  public.user_owns_complaint(complaint_id)
  or public.can_manage_editorial()
  or public.can_review_editorial()
  or public.can_read_audit()
);

drop policy if exists complaint_status_history_insert_policy on public.complaint_status_history;
create policy complaint_status_history_insert_policy
on public.complaint_status_history for insert
with check (
  public.can_manage_editorial()
  or public.can_review_editorial()
  or auth.role() = 'service_role'
);

drop policy if exists favorites_owner_policy on public.favorites;
create policy favorites_owner_policy
on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists saved_filters_owner_policy on public.saved_filters;
create policy saved_filters_owner_policy
on public.saved_filters for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists subscriptions_owner_policy on public.subscriptions;
create policy subscriptions_owner_policy
on public.subscriptions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notifications_select_policy on public.notifications;
create policy notifications_select_policy
on public.notifications for select
using (user_id = auth.uid() or public.can_read_audit() or public.can_manage_editorial());

drop policy if exists notifications_update_owner on public.notifications;
create policy notifications_update_owner
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notifications_insert_service on public.notifications;
create policy notifications_insert_service
on public.notifications for insert
with check (auth.role() = 'service_role' or public.can_manage_editorial());

drop policy if exists notification_deliveries_select_policy on public.notification_deliveries;
create policy notification_deliveries_select_policy
on public.notification_deliveries for select
using (
  public.can_manage_editorial()
  or public.can_read_audit()
  or exists (
    select 1
    from public.notifications n
    where n.id = notification_deliveries.notification_id
      and n.user_id = auth.uid()
  )
);

drop policy if exists notification_deliveries_write_policy on public.notification_deliveries;
create policy notification_deliveries_write_policy
on public.notification_deliveries for all
using (auth.role() = 'service_role' or public.can_manage_editorial())
with check (auth.role() = 'service_role' or public.can_manage_editorial());

drop policy if exists chat_sessions_owner_policy on public.chat_sessions;
create policy chat_sessions_owner_policy
on public.chat_sessions for all
using (user_id = auth.uid() or public.can_read_audit() or auth.role() = 'service_role')
with check (user_id = auth.uid() or public.can_manage_editorial() or auth.role() = 'service_role');

drop policy if exists chat_messages_owner_policy on public.chat_messages;
create policy chat_messages_owner_policy
on public.chat_messages for all
using (
  public.user_owns_chat_session(session_id)
  or public.can_read_audit()
  or auth.role() = 'service_role'
)
with check (
  public.user_owns_chat_session(session_id)
  or auth.role() = 'service_role'
);

drop policy if exists retrieval_logs_owner_policy on public.retrieval_logs;
create policy retrieval_logs_owner_policy
on public.retrieval_logs for all
using (
  (session_id is null and public.can_read_audit())
  or (session_id is not null and public.user_owns_chat_session(session_id))
  or auth.role() = 'service_role'
  or public.can_read_audit()
)
with check (
  (session_id is not null and public.user_owns_chat_session(session_id))
  or auth.role() = 'service_role'
  or public.can_manage_editorial()
);
