create index if not exists ix_documents_diario_oficial_publication_date
  on public.documents (publication_date desc, published_at desc)
  where deleted_at is null and status = 'published' and category = 'Diário Oficial';

create or replace function public.list_diario_oficial_documents(
  p_numero_edicao integer default null,
  p_data_de date default null,
  p_data_ate date default null,
  p_palavra_chave text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  publication_date date,
  published_at timestamptz,
  category text,
  subtype text,
  original_url text,
  edition_number integer,
  source_name text,
  total_count bigint
)
language sql
stable
as $$
  with filtered as (
    select
      d.id,
      d.slug,
      d.title,
      d.summary,
      d.publication_date,
      d.published_at,
      d.category,
      d.subtype,
      nullif(d.metadata ->> 'original_url', '') as original_url,
      case
        when coalesce(d.metadata ->> 'edition_number', '') ~ '^[0-9]+$'
          then (d.metadata ->> 'edition_number')::integer
        else null
      end as edition_number,
      coalesce(s.name, 'Prefeitura Municipal de Pedreira') as source_name
    from public.documents d
    left join public.sources s on s.id = d.source_id
    where d.deleted_at is null
      and d.status = 'published'
      and d.category = 'Diário Oficial'
      and (
        p_numero_edicao is null
        or (
          coalesce(d.metadata ->> 'edition_number', '') ~ '^[0-9]+$'
          and (d.metadata ->> 'edition_number')::integer = p_numero_edicao
        )
      )
      and (p_data_de is null or d.publication_date >= p_data_de)
      and (p_data_ate is null or d.publication_date <= p_data_ate)
      and (
        p_palavra_chave is null
        or length(trim(p_palavra_chave)) = 0
        or d.search_vector @@ websearch_to_tsquery('portuguese', p_palavra_chave)
        or d.title ilike ('%' || p_palavra_chave || '%')
        or coalesce(d.summary, '') ilike ('%' || p_palavra_chave || '%')
      )
  )
  select
    f.id,
    f.slug,
    f.title,
    f.summary,
    f.publication_date,
    f.published_at,
    f.category,
    f.subtype,
    f.original_url,
    f.edition_number,
    f.source_name,
    count(*) over() as total_count
  from filtered f
  order by f.publication_date desc nulls last, f.edition_number desc nulls last, f.published_at desc nulls last
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.list_diario_oficial_documents(integer, date, date, text, integer, integer) to anon;
grant execute on function public.list_diario_oficial_documents(integer, date, date, text, integer, integer) to authenticated;
