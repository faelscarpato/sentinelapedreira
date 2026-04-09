do $$
begin
  create type public.tce_import_status as enum ('queued', 'running', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tce_import_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'tce-sp-api' check (source = 'tce-sp-api'),
  municipio_codigo text not null,
  municipio_nome text,
  exercicio integer not null check (exercicio between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  status public.tce_import_status not null default 'queued',
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  receitas_count integer not null default 0 check (receitas_count >= 0),
  despesas_count integer not null default 0 check (despesas_count >= 0),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ix_tce_import_jobs_period
  on public.tce_import_jobs (municipio_codigo, exercicio desc, mes desc);

drop trigger if exists trg_tce_import_jobs_updated_at on public.tce_import_jobs;
create trigger trg_tce_import_jobs_updated_at
before update on public.tce_import_jobs
for each row
execute function public.set_updated_at();

create table if not exists public.tce_receitas (
  id bigserial primary key,
  job_id uuid references public.tce_import_jobs(id) on delete set null,
  municipio_codigo text not null,
  municipio_nome text,
  exercicio integer not null check (exercicio between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  orgao text,
  conta text,
  categoria text,
  descricao text,
  fornecedor text,
  valor numeric(18, 2) not null default 0,
  valor_previsto numeric(18, 2),
  data_competencia date,
  external_id text,
  row_hash text not null,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_tce_receitas_idempotency
  on public.tce_receitas (municipio_codigo, exercicio, mes, row_hash);

create index if not exists ix_tce_receitas_period
  on public.tce_receitas (exercicio desc, mes desc);

create index if not exists ix_tce_receitas_orgao
  on public.tce_receitas (orgao);

create index if not exists ix_tce_receitas_fornecedor
  on public.tce_receitas (fornecedor);

drop trigger if exists trg_tce_receitas_updated_at on public.tce_receitas;
create trigger trg_tce_receitas_updated_at
before update on public.tce_receitas
for each row
execute function public.set_updated_at();

create table if not exists public.tce_despesas (
  id bigserial primary key,
  job_id uuid references public.tce_import_jobs(id) on delete set null,
  municipio_codigo text not null,
  municipio_nome text,
  exercicio integer not null check (exercicio between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  orgao text,
  conta text,
  categoria text,
  descricao text,
  fornecedor text,
  valor numeric(18, 2) not null default 0,
  valor_empenhado numeric(18, 2),
  valor_liquidado numeric(18, 2),
  valor_pago numeric(18, 2),
  data_competencia date,
  external_id text,
  row_hash text not null,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists uq_tce_despesas_idempotency
  on public.tce_despesas (municipio_codigo, exercicio, mes, row_hash);

create index if not exists ix_tce_despesas_period
  on public.tce_despesas (exercicio desc, mes desc);

create index if not exists ix_tce_despesas_orgao
  on public.tce_despesas (orgao);

create index if not exists ix_tce_despesas_fornecedor
  on public.tce_despesas (fornecedor);

drop trigger if exists trg_tce_despesas_updated_at on public.tce_despesas;
create trigger trg_tce_despesas_updated_at
before update on public.tce_despesas
for each row
execute function public.set_updated_at();

alter table public.tce_import_jobs enable row level security;
alter table public.tce_receitas enable row level security;
alter table public.tce_despesas enable row level security;

drop policy if exists tce_import_jobs_select_policy on public.tce_import_jobs;
create policy tce_import_jobs_select_policy
on public.tce_import_jobs
for select
using (public.can_manage_editorial() or public.can_read_audit() or auth.role() = 'service_role');

drop policy if exists tce_import_jobs_write_policy on public.tce_import_jobs;
create policy tce_import_jobs_write_policy
on public.tce_import_jobs
for all
using (public.can_manage_editorial() or auth.role() = 'service_role')
with check (public.can_manage_editorial() or auth.role() = 'service_role');

drop policy if exists tce_receitas_select_policy on public.tce_receitas;
create policy tce_receitas_select_policy
on public.tce_receitas
for select
using (true);

drop policy if exists tce_receitas_write_policy on public.tce_receitas;
create policy tce_receitas_write_policy
on public.tce_receitas
for all
using (public.can_manage_editorial() or auth.role() = 'service_role')
with check (public.can_manage_editorial() or auth.role() = 'service_role');

drop policy if exists tce_despesas_select_policy on public.tce_despesas;
create policy tce_despesas_select_policy
on public.tce_despesas
for select
using (true);

drop policy if exists tce_despesas_write_policy on public.tce_despesas;
create policy tce_despesas_write_policy
on public.tce_despesas
for all
using (public.can_manage_editorial() or auth.role() = 'service_role')
with check (public.can_manage_editorial() or auth.role() = 'service_role');

grant select on public.tce_receitas to anon, authenticated;
grant select on public.tce_despesas to anon, authenticated;
grant select on public.tce_import_jobs to authenticated;
grant insert, update, delete on public.tce_import_jobs to authenticated;
grant insert, update, delete on public.tce_receitas to authenticated;
grant insert, update, delete on public.tce_despesas to authenticated;
grant usage, select on sequence public.tce_receitas_id_seq to authenticated;
grant usage, select on sequence public.tce_despesas_id_seq to authenticated;
