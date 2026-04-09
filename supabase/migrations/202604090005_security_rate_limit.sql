create table if not exists public.rate_limit_counters (
  scope text not null,
  actor_key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (scope, actor_key, window_start)
);

create index if not exists ix_rate_limit_counters_updated_at
  on public.rate_limit_counters (updated_at desc);

drop trigger if exists trg_rate_limit_counters_updated_at on public.rate_limit_counters;
create trigger trg_rate_limit_counters_updated_at
before update on public.rate_limit_counters
for each row
execute function public.set_updated_at();

alter table public.rate_limit_counters enable row level security;

drop policy if exists rate_limit_counters_service_only on public.rate_limit_counters;
create policy rate_limit_counters_service_only
on public.rate_limit_counters
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.check_rate_limit(
  p_scope text,
  p_actor_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  current_count integer,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz;
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_count integer;
begin
  if p_scope is null or length(trim(p_scope)) = 0 then
    raise exception 'p_scope is required';
  end if;

  if p_actor_key is null or length(trim(p_actor_key)) = 0 then
    raise exception 'p_actor_key is required';
  end if;

  if p_limit is null or p_limit <= 0 then
    raise exception 'p_limit must be > 0';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;

  v_now := timezone('utc'::text, now());
  v_window_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  insert into public.rate_limit_counters (scope, actor_key, window_start, hit_count)
  values (p_scope, p_actor_key, v_window_start, 1)
  on conflict (scope, actor_key, window_start)
  do update
    set hit_count = public.rate_limit_counters.hit_count + 1,
        updated_at = timezone('utc'::text, now())
  returning hit_count into v_count;

  return query
  select
    (v_count <= p_limit) as allowed,
    v_count as current_count,
    greatest(p_limit - v_count, 0) as remaining,
    v_reset_at as reset_at,
    case
      when v_count <= p_limit then 0
      else greatest(ceil(extract(epoch from (v_reset_at - v_now)))::integer, 1)
    end as retry_after_seconds;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.cleanup_rate_limit_counters(p_keep_seconds integer default 86400)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limit_counters
  where updated_at < timezone('utc'::text, now()) - make_interval(secs => greatest(p_keep_seconds, 60));

  get diagnostics v_deleted = row_count;
  return coalesce(v_deleted, 0);
end;
$$;

revoke all on function public.cleanup_rate_limit_counters(integer) from public;
grant execute on function public.cleanup_rate_limit_counters(integer) to service_role;

create or replace function public.assert_public_tables_have_rls()
returns table (table_name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.relname::text as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname not like 'pg_%'
    and c.relpersistence <> 't'
    and c.relrowsecurity = false
  order by c.relname;
$$;

revoke all on function public.assert_public_tables_have_rls() from public;
grant execute on function public.assert_public_tables_have_rls() to authenticated, service_role;
