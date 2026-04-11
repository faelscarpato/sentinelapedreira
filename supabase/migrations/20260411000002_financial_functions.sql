-- ============================================================================
-- FASE 1.2: Funções PL/pgSQL para Normalização e Rastreabilidade
-- Arquivo: supabase/migrations/20260411000002_financial_functions.sql
-- Data: 2026-04-11
-- Descrição: 4 funções essenciais para rastreabilidade financeira:
--   - normalize_cnpj(): Normalizar CNPJ para char(14)
--   - normalize_processo(): Normalizar número de processo
--   - upsert_entidade(): Inserir ou atualizar entidade por CNPJ
--   - calc_rastreabilidade(): Calcular score de risco e agregações
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO: normalize_cnpj()
-- Remove não-dígitos e retorna char(14) ou null
-- Útil para padronizar CNPJs de diferentes fontes antes de inserir/buscar
-- ============================================================================

create or replace function public.normalize_cnpj(raw text)
returns char(14) language sql immutable as $$
  select case
    when raw is null then null
    when length(regexp_replace(raw, '\D', '', 'g')) = 14 
      then regexp_replace(raw, '\D', '', 'g')::char(14)
    else null
  end;
$$;

comment on function public.normalize_cnpj(text) is 
  'Normaliza CNPJ removendo non-dígitos. Retorna char(14) se válido, null caso contrário.
  Exemplo: normalize_cnpj("11.222.333/0001-81") -> "11222333000181"';

-- ============================================================================
-- 2. FUNÇÃO: normalize_processo()
-- Remove separadores, converte para lowercase
-- Utílizado para comparação de números de processo que vêm com variações
-- ============================================================================

create or replace function public.normalize_processo(raw text)
returns text language sql immutable as $$
  select lower(regexp_replace(coalesce(raw,''), '[^a-zA-Z0-9]', '', 'g'));
$$;

comment on function public.normalize_processo(text) is 
  'Normaliza número de processo removendo separadores e convertendo para lowercase.
  Exemplo: normalize_processo("2026.0000.123.456-78") -> "202600001234678"';

-- ============================================================================
-- 3. FUNÇÃO: upsert_entidade()
-- Inserir ou atualizar entidade por CNPJ (idempotente)
-- Retorna UUID da entidade para vincular em outras tabelas
-- 
-- Parâmetros:
--   p_cnpj: CNPJ bruto (pode vir com separadores)
--   p_nome: Razão social da entidade
--   p_tipo: Tipo de entidade (prefeitura, autarquia, fundacao, osc, empresa, pf, outro)
--   p_municipio_id: UUID do município (normalmente Pedreira)
--
-- Exemplo de uso em Edge Function:
--   select public.upsert_entidade('11.222.333/0001-81', 'Empresa XYZ', 'empresa', municipio_id)
-- ============================================================================

create or replace function public.upsert_entidade(
  p_cnpj text,
  p_nome text,
  p_tipo text,
  p_municipio_id uuid
) returns uuid language plpgsql as $$
declare
  v_cnpj char(14) := public.normalize_cnpj(p_cnpj);
  v_id   uuid;
begin
  -- Se CNPJ inválido, retornar null (evita inserir lixo)
  if v_cnpj is null then
    raise notice 'upsert_entidade: CNPJ inválido: %', p_cnpj;
    return null;
  end if;

  -- Tentar INSERT, se duplicate key (unique constraint) fazer UPDATE
  insert into public.entidades (cnpj_norm, nome, tipo, municipio_id, metadata)
  values (v_cnpj, p_nome, p_tipo, p_municipio_id, '{}'::jsonb)
  on conflict (cnpj_norm) do update 
  set 
    nome = excluded.nome,
    tipo = case when excluded.tipo != 'outro' then excluded.tipo else entidades.tipo end,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.upsert_entidade(text, text, text, uuid) is 
  'Insere ou atualiza entidade por CNPJ. Idempotente.
  Retorna UUID da entidade para vincular em contratos, empenhos, etc.';

-- ============================================================================
-- 4. FUNÇÃO: calc_rastreabilidade()
-- Calcula e atualiza cache de rastreabilidade para um CNPJ+exercício
--
-- Lógica:
--   1. Buscar entidade pelo CNPJ normalizado
--   2. Somar todos empenhos fase 3 (pagamentos) no exercício
--   3. Contar divergências: fase 3 sem contrato nem convênio
--   4. Calcular score_risco = (divergências / total) * 100
--   5. Upsert em rastreabilidade_financeira
--
-- Parâmetros:
--   p_cnpj: CNPJ normalizado (já char(14)) ou bruto (será normalizado)
--   p_exercicio: Ano (ex: 2025, 2026)
--   p_municipio_id: UUID do município
--
-- Exemplo de uso após importar dados TCE:
--   select public.calc_rastreabilidade('11222333000181'::char(14), 2026, municipio_id)
--   from public.municipios where cod_ibge = '3537107' limit 1;
-- ============================================================================

create or replace function public.calc_rastreabilidade(
  p_cnpj char(14),
  p_exercicio smallint,
  p_municipio_id uuid
) returns void language plpgsql as $$
declare
  v_entidade_id    uuid;
  v_valor_total    numeric(15,2) := 0;
  v_qtd_docs       integer := 0;
  v_qtd_div        integer := 0;
  v_score          numeric(5,2);
begin
  -- Buscar ID da entidade pelo CNPJ
  select id into v_entidade_id 
  from public.entidades 
  where cnpj_norm = p_cnpj 
  limit 1;

  -- Se entidade não existe, sair silenciosamente (será criada no futuro)
  if v_entidade_id is null then
    raise notice 'calc_rastreabilidade: entidade não encontrada para CNPJ %', p_cnpj;
    return;
  end if;

  -- Somar todos empenhos FASE 3 (pagamentos) para este CNPJ no exercício
  select
    coalesce(sum(valor), 0::numeric),
    count(*)
  into v_valor_total, v_qtd_docs
  from public.empenhos
  where entidade_id = v_entidade_id
    and fase = 3
    and extract(year from data_emissao)::smallint = p_exercicio
    and municipio_id = p_municipio_id;

  -- Contar DIVERGÊNCIAS: empenhos fase 3 SEM contrato e SEM convênio
  -- Indica pagamentos que não foram vinculados a nenhuma autorização legal
  select count(*)
  into v_qtd_div
  from public.empenhos
  where entidade_id = v_entidade_id
    and fase = 3
    and contrato_id is null
    and convenio_id is null
    and extract(year from data_emissao)::smallint = p_exercicio
    and municipio_id = p_municipio_id;

  -- Calcular SCORE DE RISCO: 0 (sem risco) a 100 (100% divergente)
  -- score = (divergências / total_docs) * 100
  -- Se total_docs = 0, score = 0 (nenhum pagamento = nenhum risco)
  v_score := case 
    when v_qtd_docs > 0 
      then least((v_qtd_div::numeric / v_qtd_docs::numeric) * 100, 100)
    else 0::numeric
  end;

  -- UPSERT em rastreabilidade_financeira (cache materializado)
  insert into public.rastreabilidade_financeira (
    municipio_id,
    entidade_id,
    cnpj,
    exercicio,
    mes,
    tipo_fluxo,
    valor_total,
    qtd_documentos,
    qtd_divergencias,
    score_risco,
    calculado_at
  ) values (
    p_municipio_id,
    v_entidade_id,
    p_cnpj,
    p_exercicio,
    null,
    'consolidado',
    v_valor_total,
    v_qtd_docs,
    v_qtd_div,
    v_score,
    now()
  )
  on conflict (municipio_id, entidade_id, exercicio) 
  do update set
    cnpj              = excluded.cnpj,
    valor_total       = excluded.valor_total,
    qtd_documentos    = excluded.qtd_documentos,
    qtd_divergencias  = excluded.qtd_divergencias,
    score_risco       = excluded.score_risco,
    calculado_at      = now(),
    updated_at        = now();

  raise notice 'calc_rastreabilidade OK: CNPJ %, exercicio %, valor_total: %, qtd_docs: %, divergencias: %, score: %',
    p_cnpj, p_exercicio, v_valor_total, v_qtd_docs, v_qtd_div, v_score;
end;
$$;

comment on function public.calc_rastreabilidade(char, smallint, uuid) is 
  'Calcula cache de rastreabilidade (valor total, divergências, score de risco).
  Chamada automaticamente após importação de dados TCE ou via Edge Functions.
  Score de risco: 0-100, onde 100 = todos os pagamentos divergentes (sem contrato/convênio).';

-- ============================================================================
-- FUNÇÃO HELPER: calc_rastreabilidade_all()
-- Recalcula rastreabilidade para TODOS os CNPJs de um município/exercício
-- Útil para regenerar cache após importação em lote
-- ============================================================================

create or replace function public.calc_rastreabilidade_all(
  p_municipio_id uuid,
  p_exercicio smallint
) returns table(cnpj_processado char(14), score_risco numeric(5,2)) language plpgsql as $$
declare
  rec record;
begin
  -- Buscar todos CNPJs distintos com empenhos no período
  for rec in
    select distinct normalize_cnpj(e.origem::text) as cnpj
    from public.empenhos e
    where e.municipio_id = p_municipio_id
      and extract(year from e.data_emissao)::smallint = p_exercicio
      and e.entidade_id is not null
  loop
    perform public.calc_rastreabilidade(rec.cnpj::char(14), p_exercicio, p_municipio_id);
  end loop;

  -- Retornar scores calculados
  return query
    select rf.cnpj, rf.score_risco
    from public.rastreabilidade_financeira rf
    where rf.municipio_id = p_municipio_id
      and rf.exercicio = p_exercicio
    order by rf.score_risco desc;
end;
$$;

comment on function public.calc_rastreabilidade_all(uuid, smallint) is 
  'Recalcula rastreabilidade para todos os CNPJs de um município/exercício.
  Útil após importação em lote (TCE, API Federal, etc).';

-- ============================================================================
-- FUNÇÃO: get_rastreabilidade_summary()
-- Query helper que retorna resumo de rastreabilidade para um CNPJ
-- Usado por financial-traceability Edge Function
-- ============================================================================

create or replace function public.get_rastreabilidade_summary(
  p_cnpj char(14),
  p_exercicio smallint,
  p_municipio_id uuid
) returns jsonb language plpgsql as $$
declare
  v_entidade_id uuid;
  v_result jsonb;
begin
  select id into v_entidade_id
  from public.entidades
  where cnpj_norm = p_cnpj
  limit 1;

  if v_entidade_id is null then
    return jsonb_build_object(
      'erro', 'Entidade não encontrada para CNPJ ' || p_cnpj
    );
  end if;

  select jsonb_build_object(
    'cnpj', e.cnpj_norm,
    'nome', e.nome,
    'tipo', e.tipo,
    'exercicio', rf.exercicio,
    'valor_total', rf.valor_total,
    'qtd_documentos', rf.qtd_documentos,
    'qtd_divergencias', rf.qtd_divergencias,
    'score_risco', rf.score_risco,
    'risco_nivel', case
      when rf.score_risco is null then 'pendente'
      when rf.score_risco < 10 then 'baixo'
      when rf.score_risco < 30 then 'medio'
      when rf.score_risco < 60 then 'alto'
      else 'critico'
    end
  ) into v_result
  from public.rastreabilidade_financeira rf
  join public.entidades e on rf.entidade_id = e.id
  where rf.cnpj = p_cnpj
    and rf.exercicio = p_exercicio
    and rf.municipio_id = p_municipio_id;

  return coalesce(v_result, jsonb_build_object(
    'erro', 'Rastreabilidade não calculada. Execute calc_rastreabilidade() primeiro.'
  ));
end;
$$;

comment on function public.get_rastreabilidade_summary(char, smallint, uuid) is 
  'Retorna resumo JSON de rastreabilidade para um CNPJ (usado por financial-traceability).';

-- ============================================================================
-- AUDITORIA: Logar chamadas das funções principais
-- ============================================================================

create or replace function public.audit_upsert_entidade()
returns trigger language plpgsql security definer as $$
begin
  insert into public.audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data
  ) values (
    'entidades',
    new.id,
    case when TG_OP = 'INSERT' then 'insert' else 'update' end,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists tr_audit_upsert_entidade on public.entidades;
create trigger tr_audit_upsert_entidade after insert or update on public.entidades
  for each row execute function public.audit_upsert_entidade();

-- ============================================================================
-- VALIDAÇÃO: Constraints e comentários explicativos
-- ============================================================================

-- Comment explicando score de risco
comment on column public.rastreabilidade_financeira.score_risco is 
  'Score de risco: 0-100. 
   0 = todos os pagamentos vinculados a contrato/convênio (sem divergências)
   50 = metade dos pagamentos divergentes
   100 = todos os pagamentos sem vinculação legal (alto risco de irregularidade)
   NULL = ainda não calculado';

comment on column public.empenhos.fase is 
  'Fase do empenho:
   1 = Empenho (comprometimento de crédito)
   2 = Liquidação (verificação de entrega)
   3 = Pagamento (transferência efetiva de recursos)';

comment on column public.empenhos.codigo_documento is 
  'Chave única do documento no Portal Federal.
   Formato: UG + gestão + numero (ex: 02000000000001)
   Junto com fase (1,2,3) forma chave única para idempotência.';

comment on column public.entidades.cnpj_norm is 
  'CNPJ normalizado: 14 dígitos sem separadores.
   Sempre usar normalize_cnpj() antes de inserir/buscar.
   Exemplo: "11222333000181" (não "11.222.333/0001-81")';

-- ============================================================================
-- FIM DA MIGRATION 2: Funções PL/pgSQL criadas com sucesso
-- Próximo passo: Executar FASE 2 (Edge Functions Deno/TypeScript)
-- ============================================================================
