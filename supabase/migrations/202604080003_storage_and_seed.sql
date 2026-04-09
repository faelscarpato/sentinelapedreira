insert into public.roles (key, name, description, is_system)
values
  ('public', 'Publico', 'Visitante nao autenticado', true),
  ('authenticated_user', 'Usuario autenticado', 'Usuario padrao autenticado', true),
  ('editor', 'Editor', 'Gerencia publicacao e acervo documental', true),
  ('reviewer', 'Revisor', 'Revisa analises e fluxo editorial', true),
  ('admin', 'Administrador', 'Controle total da plataforma', true),
  ('auditor', 'Auditor', 'Leitura de trilhas e evidencias', true)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc'::text, now());

insert into public.profiles (id, full_name, display_name)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  coalesce(u.raw_user_meta_data ->> 'display_name', u.email)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_roles (user_id, role_id, granted_by, is_active)
select
  u.id,
  r.id,
  u.id,
  true
from auth.users u
join public.roles r on r.key = 'authenticated_user'
left join public.user_roles ur
  on ur.user_id = u.id
 and ur.role_id = r.id
 and ur.is_active = true
where ur.id is null;

create or replace function public.path_segment(path text, segment_index integer)
returns text
language plpgsql
stable
as $$
begin
  if path is null or length(trim(path)) = 0 then
    return null;
  end if;
  return nullif(split_part(path, '/', segment_index), '');
end;
$$;

create or replace function public.path_segment_as_uuid(path text, segment_index integer)
returns uuid
language plpgsql
stable
as $$
declare
  segment text;
begin
  segment := public.path_segment(path, segment_index);
  if segment is null then
    return null;
  end if;

  if segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return segment::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.user_owns_complaint_storage_object(path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with complaint_ref as (
    select public.path_segment_as_uuid(path, 1) as complaint_id
  )
  select exists (
    select 1
    from complaint_ref cr
    join public.complaints c on c.id = cr.complaint_id
    where c.created_by = auth.uid()
      and c.deleted_at is null
  );
$$;

create or replace function public.user_owns_export_storage_object(path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.path_segment(path, 1) = auth.uid()::text;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-documents', 'public-documents', true, 104857600, array['application/pdf', 'text/markdown', 'text/plain']),
  ('complaint-attachments', 'complaint-attachments', false, 52428800, array['application/pdf', 'image/png', 'image/jpeg', 'application/zip']),
  ('editorial-assets', 'editorial-assets', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('exports', 'exports', false, 104857600, array['application/pdf', 'application/json', 'text/csv', 'application/zip']),
  ('temp-processing', 'temp-processing', false, 52428800, array['application/json', 'text/plain', 'application/octet-stream'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_public_documents_read on storage.objects;
create policy storage_public_documents_read
on storage.objects for select
using (bucket_id = 'public-documents');

drop policy if exists storage_public_documents_write on storage.objects;
create policy storage_public_documents_write
on storage.objects for all
using (
  bucket_id = 'public-documents'
  and public.can_manage_editorial()
)
with check (
  bucket_id = 'public-documents'
  and public.can_manage_editorial()
);

drop policy if exists storage_complaints_read on storage.objects;
create policy storage_complaints_read
on storage.objects for select
using (
  bucket_id = 'complaint-attachments'
  and (
    public.user_owns_complaint_storage_object(name)
    or public.can_manage_editorial()
    or public.can_review_editorial()
    or public.can_read_audit()
  )
);

drop policy if exists storage_complaints_insert on storage.objects;
create policy storage_complaints_insert
on storage.objects for insert
with check (
  bucket_id = 'complaint-attachments'
  and (
    public.user_owns_complaint_storage_object(name)
    or public.can_manage_editorial()
    or public.can_review_editorial()
    or auth.role() = 'service_role'
  )
);

drop policy if exists storage_complaints_update_delete on storage.objects;
create policy storage_complaints_update_delete
on storage.objects for update
using (
  bucket_id = 'complaint-attachments'
  and (
    public.user_owns_complaint_storage_object(name)
    or public.can_manage_editorial()
    or public.can_review_editorial()
  )
)
with check (
  bucket_id = 'complaint-attachments'
  and (
    public.user_owns_complaint_storage_object(name)
    or public.can_manage_editorial()
    or public.can_review_editorial()
  )
);

drop policy if exists storage_complaints_delete on storage.objects;
create policy storage_complaints_delete
on storage.objects for delete
using (
  bucket_id = 'complaint-attachments'
  and (
    public.user_owns_complaint_storage_object(name)
    or public.can_manage_editorial()
    or public.can_review_editorial()
  )
);

drop policy if exists storage_editorial_assets_read on storage.objects;
create policy storage_editorial_assets_read
on storage.objects for select
using (
  bucket_id = 'editorial-assets'
  and (
    public.can_manage_editorial()
    or public.can_review_editorial()
    or public.can_read_audit()
  )
);

drop policy if exists storage_editorial_assets_write on storage.objects;
create policy storage_editorial_assets_write
on storage.objects for all
using (bucket_id = 'editorial-assets' and public.can_manage_editorial())
with check (bucket_id = 'editorial-assets' and public.can_manage_editorial());

drop policy if exists storage_exports_select on storage.objects;
create policy storage_exports_select
on storage.objects for select
using (
  bucket_id = 'exports'
  and (
    public.user_owns_export_storage_object(name)
    or public.can_manage_editorial()
    or public.can_read_audit()
  )
);

drop policy if exists storage_exports_insert on storage.objects;
create policy storage_exports_insert
on storage.objects for insert
with check (
  bucket_id = 'exports'
  and (
    public.user_owns_export_storage_object(name)
    or public.can_manage_editorial()
    or auth.role() = 'service_role'
  )
);

drop policy if exists storage_exports_update_delete on storage.objects;
create policy storage_exports_update_delete
on storage.objects for all
using (
  bucket_id = 'exports'
  and (
    public.user_owns_export_storage_object(name)
    or public.can_manage_editorial()
  )
)
with check (
  bucket_id = 'exports'
  and (
    public.user_owns_export_storage_object(name)
    or public.can_manage_editorial()
  )
);

drop policy if exists storage_temp_processing_read on storage.objects;
create policy storage_temp_processing_read
on storage.objects for select
using (
  bucket_id = 'temp-processing'
  and (
    public.can_manage_editorial()
    or public.can_review_editorial()
    or auth.role() = 'service_role'
  )
);

drop policy if exists storage_temp_processing_write on storage.objects;
create policy storage_temp_processing_write
on storage.objects for all
using (
  bucket_id = 'temp-processing'
  and (
    public.can_manage_editorial()
    or public.can_review_editorial()
    or auth.role() = 'service_role'
  )
)
with check (
  bucket_id = 'temp-processing'
  and (
    public.can_manage_editorial()
    or public.can_review_editorial()
    or auth.role() = 'service_role'
  )
);
