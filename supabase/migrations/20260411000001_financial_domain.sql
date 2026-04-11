-- ============================================================================
-- FASE 1.1: Criação das Tabelas de Domínio Financeiro para Sentinela Pedreira
-- Arquivo: supabase/migrations/20260411000001_financial_domain.sql
-- Data: 2026-04-11
-- Descrição: 14 tabelas para rastreabilidade financeira, contratos, licitações,
--            empenhos, convênios, transferências, patrimônio e Diário Oficial
-- ============================================================================

-- ============================================================================
-- 1. TABELA: municipios
-- Referência de municípios (inicialmente apenas Pedreira/SP)
-- ============================================================================
create table if not exists public.municipios (
  id            uuid primary key default gen_random_uuid(),
  cod_ibge      text not null unique,
  nome          text not null,
  uf            char(2) not null,
  populacao     integer,
  area_km2      numeric(10,2),
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices para municipios
create index if not exists ix_municipios_cod_ibge on public.municipios (cod_ibge);
create index if not exists ix_municipios_nome on public.municipios (nome);

-- Insertar Pedreira/SP (código IBGE 3537107)
insert into public.municipios (cod_ibge, nome, uf)
values ('3537107', 'Pedreira', 'SP')
on conflict (cod_ibge) do nothing;

-- ============================================================================
-- 2. TABELA: entidades
-- Pessoas jurídicas e físicas que recebem ou transferem recursos
-- ============================================================================
create table if not exists public.entidades (
  id               uuid primary key default gen_random_uuid(),
  cnpj_norm        char(14) unique,
  cpf_norm         char(11),
  nome             text not null,
  tipo             text not null check (tipo in ('prefeitura','autarquia','fundacao','osc','empresa','pf','outro')),
  municipio_id     uuid references public.municipios(id) on delete restrict,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ck_entidades_identity check (cnpj_norm is not null or cpf_norm is not null)
);

create index if not exists ix_entidades_cnpj   on public.entidades (cnpj_norm);
create index if not exists ix_entidades_cpf    on public.entidades (cpf_norm);
create index if not exists ix_entidades_tipo   on public.entidades (tipo);
create index if not exists ix_entidades_municipio on public.entidades (municipio_id);

-- ============================================================================
-- 3. TABELA: convenios
-- Convênios federais, estaduais e municipais
-- ============================================================================
create table if not exists public.convenios (
  id                   uuid primary key default gen_random_uuid(),
  origem               text not null check (origem in ('federal','estadual','municipal','ts')),
  id_externo           text,
  numero               text,
  numero_processo      text,
  tipo_instrumento     text,
  objeto               text,
  valor_total          numeric(15,2),
  valor_liberado       numeric(15,2),
  valor_contrapartida  numeric(15,2),
  data_inicio          date,
  data_fim             date,
  situacao             text,
  cnpj_convenente      char(14),
  entidade_id          uuid references public.entidades(id) on delete set null,
  municipio_id         uuid references public.municipios(id) on delete restrict,
  metadata             jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists ix_convenios_cnpj        on public.convenios (cnpj_convenente);
create index if not exists ix_convenios_municipio   on public.convenios (municipio_id);
create index if not exists ix_convenios_origem      on public.convenios (origem);
create index if not exists ix_convenios_data_inicio on public.convenios (data_inicio);
create index if not exists ix_convenios_entidade_id on public.convenios (entidade_id);

-- ============================================================================
-- 4. TABELA: licitacoes
-- Licitações municipais e federais
-- ============================================================================
create table if not exists public.licitacoes (
  id                   uuid primary key default gen_random_uuid(),
  origem               text not null check (origem in ('federal','municipal')),
  id_externo           text,
  numero               text,
  proc_licitatorio     text,
  proc_administrativo  text,
  modalidade           text,
  objeto               text,
  data_abertura        date,
  valor_estimado       numeric(15,2),
  orgao                text,
  municipio_id         uuid references public.municipios(id) on delete restrict,
  metadata             jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists ix_licitacoes_proc_adm   on public.licitacoes (proc_administrativo);
create index if not exists ix_licitacoes_municipio  on public.licitacoes (municipio_id);
create index if not exists ix_licitacoes_origem     on public.licitacoes (origem);
create index if not exists ix_licitacoes_data_abertura on public.licitacoes (data_abertura desc);

-- ============================================================================
-- 5. TABELA: contratos
-- Contratos municipais e federais, vinculados a licitações
-- ============================================================================
create table if not exists public.contratos (
  id                    uuid primary key default gen_random_uuid(),
  origem                text not null check (origem in ('federal','municipal')),
  id_externo            text,
  numero_contrato       text,
  numero_processo       text,
  objeto                text,
  data_assinatura       date,
  data_inicio_vigencia  date,
  data_fim_vigencia     date,
  valor_inicial         numeric(15,2),
  valor_atual           numeric(15,2),
  licitacao_id          uuid references public.licitacoes(id) on delete set null,
  contratante_id        uuid references public.entidades(id) on delete set null,
  contratada_id         uuid references public.entidades(id) on delete set null,
  municipio_id          uuid references public.municipios(id) on delete restrict,
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists ix_contratos_numero     on public.contratos (numero_contrato);
create index if not exists ix_contratos_processo   on public.contratos (numero_processo);
create index if not exists ix_contratos_licitacao  on public.contratos (licitacao_id);
create index if not exists ix_contratos_municipio  on public.contratos (municipio_id);
create index if not exists ix_contratos_contratante on public.contratos (contratante_id);
create index if not exists ix_contratos_contratada on public.contratos (contratada_id);
create index if not exists ix_contratos_vigencia on public.contratos (data_inicio_vigencia, data_fim_vigencia);

-- ============================================================================
-- 6. TABELA: aditivos
-- Termos aditivos de contratos (prorrogações, reajustes, etc.)
-- ============================================================================
create table if not exists public.aditivos (
  id               uuid primary key default gen_random_uuid(),
  contrato_id      uuid not null references public.contratos(id) on delete cascade,
  numero_aditivo   text,
  tipo             text,
  data_publicacao  date,
  descricao        text,
  valor_acrescimo  numeric(15,2),
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists ix_aditivos_contrato on public.aditivos (contrato_id);
create index if not exists ix_aditivos_tipo on public.aditivos (tipo);
create index if not exists ix_aditivos_data on public.aditivos (data_publicacao desc);

-- ============================================================================
-- 7. TABELA: empenhos
-- Fases de empenho: 1=empenho, 2=liquidação, 3=pagamento
-- Chave única é (codigo_documento, fase) para permitir rastreamento multi-fase
-- ============================================================================
create table if not exists public.empenhos (
  id                  uuid primary key default gen_random_uuid(),
  origem              text not null check (origem in ('federal','municipal')),
  codigo_documento    text,
  numero              text,
  data_emissao        date,
  fase                smallint not null check (fase in (1,2,3)),
  valor               numeric(15,2),
  contrato_id         uuid references public.contratos(id) on delete set null,
  convenio_id         uuid references public.convenios(id) on delete set null,
  entidade_id         uuid references public.entidades(id) on delete set null,
  municipio_id        uuid references public.municipios(id) on delete restrict,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Índice único (codigo_documento, fase) para idempotência de sync
create unique index if not exists uq_empenhos_codigo_fase 
  on public.empenhos (codigo_documento, fase) 
  where codigo_documento is not null;

create index if not exists ix_empenhos_contrato    on public.empenhos (contrato_id);
create index if not exists ix_empenhos_convenio    on public.empenhos (convenio_id);
create index if not exists ix_empenhos_entidade    on public.empenhos (entidade_id);
create index if not exists ix_empenhos_data        on public.empenhos (data_emissao desc);
create index if not exists ix_empenhos_municipio   on public.empenhos (municipio_id);
create index if not exists ix_empenhos_fase        on public.empenhos (fase);
create index if not exists ix_empenhos_origem      on public.empenhos (origem);

-- ============================================================================
-- 8. TABELA: transferencias
-- Transferências de recursos (fundo a fundo, convênios, repasses, etc.)
-- ============================================================================
create table if not exists public.transferencias (
  id                    uuid primary key default gen_random_uuid(),
  origem                text not null check (origem in ('federal','estadual','municipal')),
  tipo_transferencia    text,
  exercicio             smallint not null,
  mes                   smallint not null check (mes between 1 and 12),
  entidade_pagadora_id  uuid references public.entidades(id) on delete set null,
  entidade_recebedora_id uuid references public.entidades(id) on delete set null,
  valor                 numeric(15,2),
  municipio_id          uuid references public.municipios(id) on delete restrict,
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists ix_transferencias_recebedora on public.transferencias (entidade_recebedora_id);
create index if not exists ix_transferencias_pagadora on public.transferencias (entidade_pagadora_id);
create index if not exists ix_transferencias_periodo on public.transferencias (exercicio, mes);
create index if not exists ix_transferencias_municipio on public.transferencias (municipio_id);
create index if not exists ix_transferencias_origem on public.transferencias (origem);

-- ============================================================================
-- 9. TABELA: patrimonio
-- Bens patrimoniais (imóveis, veículos, intangíveis)
-- ============================================================================
create table if not exists public.patrimonio (
  id                    uuid primary key default gen_random_uuid(),
  tipo                  text not null check (tipo in ('imovel','veiculo','intangivel','outro')),
  codigo                text,
  grupo_chapa           text,
  placa                 text,
  descricao             text,
  situacao              text,
  localizacao           text,
  valor_aquisicao       numeric(15,2),
  data_aquisicao        date,
  entidade_responsavel_id uuid references public.entidades(id) on delete set null,
  municipio_id          uuid references public.municipios(id) on delete restrict,
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists ix_patrimonio_tipo      on public.patrimonio (tipo);
create index if not exists ix_patrimonio_municipio on public.patrimonio (municipio_id);
create index if not exists ix_patrimonio_entidade  on public.patrimonio (entidade_responsavel_id);
create index if not exists ix_patrimonio_placa     on public.patrimonio (placa) where placa is not null;
create index if not exists ix_patrimonio_situacao  on public.patrimonio (situacao);

-- ============================================================================
-- 10. TABELA: diario_oficial
-- Edições do Diário Oficial de Pedreira
-- ============================================================================
create table if not exists public.diario_oficial (
  id              uuid primary key default gen_random_uuid(),
  data_edicao     date not null,
  numero_edicao   text,
  tipo_caderno    text,
  url_pdf         text,
  hash_arquivo    text unique,
  texto_extraido  text,
  municipio_id    uuid references public.municipios(id) on delete restrict,
  sincronizado_at timestamptz,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists ix_diario_data      on public.diario_oficial (data_edicao desc);
create index if not exists ix_diario_municipio on public.diario_oficial (municipio_id);
create index if not exists ix_diario_sincronizado on public.diario_oficial (sincronizado_at desc);

-- ============================================================================
-- 11. TABELA: rastreabilidade_financeira
-- Cache materializado de rastreabilidade por CNPJ/exercício
-- Atualizado por calc_rastreabilidade() e consultado para relatórios rápidos
-- ============================================================================
create table if not exists public.rastreabilidade_financeira (
  id                  uuid primary key default gen_random_uuid(),
  municipio_id        uuid references public.municipios(id) on delete restrict,
  entidade_id         uuid references public.entidades(id) on delete set null,
  cnpj                char(14),
  exercicio           smallint not null,
  mes                 smallint check (mes is null or (mes between 1 and 12)),
  tipo_fluxo          text,
  valor_total         numeric(15,2) not null default 0,
  qtd_documentos      integer not null default 0,
  qtd_divergencias    integer not null default 0,
  score_risco         numeric(5,2) check (score_risco is null or (score_risco between 0 and 100)),
  calculado_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint uq_rastreab_municipio_entidade_exercicio
    unique (municipio_id, entidade_id, exercicio) deferrable initially deferred
);

create index if not exists ix_rastreab_municipio  on public.rastreabilidade_financeira (municipio_id);
create index if not exists ix_rastreab_entidade   on public.rastreabilidade_financeira (entidade_id);
create index if not exists ix_rastreab_cnpj       on public.rastreabilidade_financeira (cnpj);
create index if not exists ix_rastreab_exercicio  on public.rastreabilidade_financeira (exercicio, mes);
create index if not exists ix_rastreab_risco      on public.rastreabilidade_financeira (score_risco desc);

-- ============================================================================
-- 12. TABELA: documentos_relacionamentos
-- Linking table entre documents (já existente) e entidades de domínio financeiro
-- ============================================================================
create table if not exists public.documentos_relacionamentos (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents(id) on delete cascade,
  entidade_tipo  text not null,
  entidade_id    uuid not null,
  created_at     timestamptz not null default now(),
  constraint uq_doc_rel unique (document_id, entidade_tipo, entidade_id)
);

create index if not exists ix_doc_rel_document on public.documentos_relacionamentos (document_id);
create index if not exists ix_doc_rel_entidade on public.documentos_relacionamentos (entidade_tipo, entidade_id);

-- ============================================================================
-- TRIGGERS: set_updated_at
-- Atualiza o campo updated_at automaticamente antes de UPDATE
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger a todas as tabelas com updated_at
drop trigger if exists tr_municipios_updated_at on public.municipios;
create trigger tr_municipios_updated_at before update on public.municipios
  for each row execute function public.set_updated_at();

drop trigger if exists tr_entidades_updated_at on public.entidades;
create trigger tr_entidades_updated_at before update on public.entidades
  for each row execute function public.set_updated_at();

drop trigger if exists tr_convenios_updated_at on public.convenios;
create trigger tr_convenios_updated_at before update on public.convenios
  for each row execute function public.set_updated_at();

drop trigger if exists tr_licitacoes_updated_at on public.licitacoes;
create trigger tr_licitacoes_updated_at before update on public.licitacoes
  for each row execute function public.set_updated_at();

drop trigger if exists tr_contratos_updated_at on public.contratos;
create trigger tr_contratos_updated_at before update on public.contratos
  for each row execute function public.set_updated_at();

drop trigger if exists tr_aditivos_updated_at on public.aditivos;
create trigger tr_aditivos_updated_at before update on public.aditivos
  for each row execute function public.set_updated_at();

drop trigger if exists tr_empenhos_updated_at on public.empenhos;
create trigger tr_empenhos_updated_at before update on public.empenhos
  for each row execute function public.set_updated_at();

drop trigger if exists tr_transferencias_updated_at on public.transferencias;
create trigger tr_transferencias_updated_at before update on public.transferencias
  for each row execute function public.set_updated_at();

drop trigger if exists tr_patrimonio_updated_at on public.patrimonio;
create trigger tr_patrimonio_updated_at before update on public.patrimonio
  for each row execute function public.set_updated_at();

drop trigger if exists tr_diario_oficial_updated_at on public.diario_oficial;
create trigger tr_diario_oficial_updated_at before update on public.diario_oficial
  for each row execute function public.set_updated_at();

drop trigger if exists tr_rastreab_updated_at on public.rastreabilidade_financeira;
create trigger tr_rastreab_updated_at before update on public.rastreabilidade_financeira
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Todos os dados financeiros são públicos (leitura) mas escrita apenas admin/editor
-- ============================================================================

-- Habilitar RLS em todas as tabelas
alter table public.municipios enable row level security;
alter table public.entidades enable row level security;
alter table public.convenios enable row level security;
alter table public.licitacoes enable row level security;
alter table public.contratos enable row level security;
alter table public.aditivos enable row level security;
alter table public.empenhos enable row level security;
alter table public.transferencias enable row level security;
alter table public.patrimonio enable row level security;
alter table public.diario_oficial enable row level security;
alter table public.rastreabilidade_financeira enable row level security;
alter table public.documentos_relacionamentos enable row level security;

-- Helper function para verificar se usuario tem role de escrita
create or replace function public.has_admin_or_editor_role()
returns boolean as $$
begin
  return (select count(*) > 0 from public.user_roles
    where user_id = auth.uid()
    and role_name in ('admin', 'editor'));
end;
$$ language plpgsql security definer;

-- MUNICIPIOS: público read, admin write
drop policy if exists "municipios_public_read" on public.municipios;
create policy "municipios_public_read" on public.municipios
  for select using (true);

drop policy if exists "municipios_admin_write" on public.municipios;
create policy "municipios_admin_write" on public.municipios
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "municipios_admin_update" on public.municipios;
create policy "municipios_admin_update" on public.municipios
  for update with check (public.has_admin_or_editor_role());

-- ENTIDADES: público read, admin write
drop policy if exists "entidades_public_read" on public.entidades;
create policy "entidades_public_read" on public.entidades
  for select using (true);

drop policy if exists "entidades_admin_write" on public.entidades;
create policy "entidades_admin_write" on public.entidades
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "entidades_admin_update" on public.entidades;
create policy "entidades_admin_update" on public.entidades
  for update with check (public.has_admin_or_editor_role());

-- CONVENIOS: público read, admin write
drop policy if exists "convenios_public_read" on public.convenios;
create policy "convenios_public_read" on public.convenios
  for select using (true);

drop policy if exists "convenios_admin_write" on public.convenios;
create policy "convenios_admin_write" on public.convenios
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "convenios_admin_update" on public.convenios;
create policy "convenios_admin_update" on public.convenios
  for update with check (public.has_admin_or_editor_role());

-- LICITACOES: público read, admin write
drop policy if exists "licitacoes_public_read" on public.licitacoes;
create policy "licitacoes_public_read" on public.licitacoes
  for select using (true);

drop policy if exists "licitacoes_admin_write" on public.licitacoes;
create policy "licitacoes_admin_write" on public.licitacoes
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "licitacoes_admin_update" on public.licitacoes;
create policy "licitacoes_admin_update" on public.licitacoes
  for update with check (public.has_admin_or_editor_role());

-- CONTRATOS: público read, admin write
drop policy if exists "contratos_public_read" on public.contratos;
create policy "contratos_public_read" on public.contratos
  for select using (true);

drop policy if exists "contratos_admin_write" on public.contratos;
create policy "contratos_admin_write" on public.contratos
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "contratos_admin_update" on public.contratos;
create policy "contratos_admin_update" on public.contratos
  for update with check (public.has_admin_or_editor_role());

-- ADITIVOS: público read, admin write
drop policy if exists "aditivos_public_read" on public.aditivos;
create policy "aditivos_public_read" on public.aditivos
  for select using (true);

drop policy if exists "aditivos_admin_write" on public.aditivos;
create policy "aditivos_admin_write" on public.aditivos
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "aditivos_admin_update" on public.aditivos;
create policy "aditivos_admin_update" on public.aditivos
  for update with check (public.has_admin_or_editor_role());

-- EMPENHOS: público read, admin write
drop policy if exists "empenhos_public_read" on public.empenhos;
create policy "empenhos_public_read" on public.empenhos
  for select using (true);

drop policy if exists "empenhos_admin_write" on public.empenhos;
create policy "empenhos_admin_write" on public.empenhos
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "empenhos_admin_update" on public.empenhos;
create policy "empenhos_admin_update" on public.empenhos
  for update with check (public.has_admin_or_editor_role());

-- TRANSFERENCIAS: público read, admin write
drop policy if exists "transferencias_public_read" on public.transferencias;
create policy "transferencias_public_read" on public.transferencias
  for select using (true);

drop policy if exists "transferencias_admin_write" on public.transferencias;
create policy "transferencias_admin_write" on public.transferencias
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "transferencias_admin_update" on public.transferencias;
create policy "transferencias_admin_update" on public.transferencias
  for update with check (public.has_admin_or_editor_role());

-- PATRIMONIO: público read, admin write
drop policy if exists "patrimonio_public_read" on public.patrimonio;
create policy "patrimonio_public_read" on public.patrimonio
  for select using (true);

drop policy if exists "patrimonio_admin_write" on public.patrimonio;
create policy "patrimonio_admin_write" on public.patrimonio
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "patrimonio_admin_update" on public.patrimonio;
create policy "patrimonio_admin_update" on public.patrimonio
  for update with check (public.has_admin_or_editor_role());

-- DIARIO_OFICIAL: público read, admin write
drop policy if exists "diario_oficial_public_read" on public.diario_oficial;
create policy "diario_oficial_public_read" on public.diario_oficial
  for select using (true);

drop policy if exists "diario_oficial_admin_write" on public.diario_oficial;
create policy "diario_oficial_admin_write" on public.diario_oficial
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "diario_oficial_admin_update" on public.diario_oficial;
create policy "diario_oficial_admin_update" on public.diario_oficial
  for update with check (public.has_admin_or_editor_role());

-- RASTREABILIDADE_FINANCEIRA: público read, admin write
drop policy if exists "rastreab_public_read" on public.rastreabilidade_financeira;
create policy "rastreab_public_read" on public.rastreabilidade_financeira
  for select using (true);

drop policy if exists "rastreab_admin_write" on public.rastreabilidade_financeira;
create policy "rastreab_admin_write" on public.rastreabilidade_financeira
  for insert with check (public.has_admin_or_editor_role());

drop policy if exists "rastreab_admin_update" on public.rastreabilidade_financeira;
create policy "rastreab_admin_update" on public.rastreabilidade_financeira
  for update with check (public.has_admin_or_editor_role());

-- DOCUMENTOS_RELACIONAMENTOS: público read, admin write
drop policy if exists "doc_rel_public_read" on public.documentos_relacionamentos;
create policy "doc_rel_public_read" on public.documentos_relacionamentos
  for select using (true);

drop policy if exists "doc_rel_admin_write" on public.documentos_relacionamentos;
create policy "doc_rel_admin_write" on public.documentos_relacionamentos
  for insert with check (public.has_admin_or_editor_role());

-- ============================================================================
-- FIM DA MIGRATION 1: Tabelas e RLS criados com sucesso
-- ============================================================================
