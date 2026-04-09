# Decisões Técnicas

## 2026-04-09 — Política de JWT em Edge Functions

- Mantido `verify_jwt=true` por padrão para funções internas:
  - `financial-traceability`
  - `embeddings-chunking`
  - `ai-provider-gateway`
- Definido `verify_jwt=false` para endpoints públicos/controlados:
  - `legal-assistant`
  - `complaint-submit`
  - `diario-oficial-sync`
  - `webhooks`
  - `notifications-automation`
- Justificativa:
  - cron/webhook externos podem não enviar JWT Supabase válido;
  - o acesso continua protegido por segredo de cabeçalho (`x-sync-secret`, `x-webhook-signature` ou `x-automation-secret`) e validação de papel quando houver JWT.

## 2026-04-09 — Repositório sem `.git` nesta cópia de trabalho

- Esta pasta foi recebida como snapshot sem histórico Git.
- As mudanças foram separadas por blocos A/B/C/D/E/F em arquivos e documentação.
- Os comandos de commit foram preparados para execução no repositório Git oficial do projeto.

## 2026-04-09 — Detalhe de documento por slug com fallback

- Implementada rota canônica `/documentos/:slug`.
- Quando Supabase está disponível, o detalhe vem de `documents` + `sources` + `document_tags`.
- Em ambiente sem backend configurado, há fallback para o acervo local com slug derivado.
- Justificativa: manter rollout incremental sem quebrar navegação em ambientes parciais.

## 2026-04-09 — Pipeline TCE-SP com API oficial

- Ingestão criada via Edge Function `tce-import` usando endpoints oficiais:
  - `/api/json/municipios`
  - `/api/json/receitas/{municipio}/{exercicio}/{mes}`
  - `/api/json/despesas/{municipio}/{exercicio}/{mes}`
- Tabelas dedicadas:
  - `tce_import_jobs`
  - `tce_receitas`
  - `tce_despesas`
- Idempotência por `idempotency_key` (job) + `row_hash` (linha).
- Decisão de default operacional:
  - município Pedreira (IBGE `3537108`), com filtros de período no frontend.
