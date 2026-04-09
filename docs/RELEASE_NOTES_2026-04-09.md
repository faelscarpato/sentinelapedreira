# Release Notes — 2026-04-09

## A) Edge Functions e config

- `supabase/config.toml` versionado com política JWT:
  - públicas/controladas (`verify_jwt=false`): `legal-assistant`, `complaint-submit`, `diario-oficial-sync`, `webhooks`, `notifications-automation`
  - demais funções mantidas com JWT obrigatório
- Documentação de setup/deploy atualizada para esse padrão.

## B) Segurança de abuso/custo

- Middleware de rate limit compartilhado em Edge Functions.
- Aplicado em:
  - `legal-assistant`
  - `complaint-submit`
- Respostas de abuso retornam `429` + `Retry-After` + headers `X-RateLimit-*`.

## C) UX e rastreabilidade de documentos

- Nova rota `/documentos/:slug`.
- Busca global e cards agora navegam para detalhe por slug.
- Detalhe mostra:
  - fonte oficial
  - origem (badge)
  - data de publicação
  - data de captura/sincronização
  - link de download/original

## D) Pipeline TCE-SP por API

- Nova migration com tabelas:
  - `tce_import_jobs`
  - `tce_receitas`
  - `tce_despesas`
- Edge Function `tce-import` usando API oficial do TCE-SP:
  - `/api/json/municipios`
  - `/api/json/receitas/{municipio}/{exercicio}/{mes}`
  - `/api/json/despesas/{municipio}/{exercicio}/{mes}`
- Idempotência por `idempotency_key` + `row_hash`.
- Página `Contas Públicas` com abas Receitas/Despesas e filtros por ano/mês/órgão/fornecedor.

## E) Sanitização de markdown

- Componente único `SafeMarkdown` com:
  - `rehype-sanitize`
  - bloqueio de links inseguros (`javascript:`)
  - hardening de links externos (`noopener noreferrer nofollow`)
- Aplicado em:
  - `AssistantChatWidget`
  - `RelatorioDetalhes`
  - `CamaraAnaliseDetalhes`
  - `DocumentoDetalhe`
- Teste de regressão criado (`SafeMarkdown.test.tsx`).

## F) CI/CD e validações

- Workflow CI em `.github/workflows/ci.yml` com:
  - install
  - check de segredos em `VITE_*`
  - check estático de RLS em tabelas públicas
  - lint
  - typecheck
  - test
  - build
- Job opcional de smoke de migrations via Supabase CLI (`workflow_dispatch`).

## Como testar rapidamente

1. `npm install`
2. `npm run ci:validate`
3. Aplicar migration `202604090006_tce_pipeline.sql`
4. Deploy da function `tce-import`
5. Rodar import TCE para mês/ano corrente e validar `/contas-publicas`
6. Validar `/documentos/:slug` a partir de busca global ou cards
