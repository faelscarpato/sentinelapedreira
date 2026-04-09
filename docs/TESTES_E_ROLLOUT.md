# Testes, Rollout e Riscos

## Pipeline de validação local

```bash
npm install
npm run ci:check-vite-secrets
npm run ci:check-public-rls
npm run lint
npm run typecheck
npm run test
npm run build
```

## Testes funcionais críticos

## 1) Auth e papéis

1. Login em `/entrar`.
2. Conferir perfil em `/minha-conta`.
3. Confirmar bloqueio de rota editorial para usuário sem papel.

## 2) Denúncia com protocolo

1. Enviar denúncia anônima.
2. Enviar denúncia identificada.
3. Validar protocolo retornado.
4. Validar histórico/eventos no banco.

## 3) Diário Oficial

1. Rodar `diario-oficial-sync`.
2. Confirmar novas linhas em `documents` com categoria `Diário Oficial`.
3. Abrir `/diario-oficial` e navegar para `/documentos/:slug`.

## 4) Contas Públicas TCE

1. Executar `tce-import` para mês/ano alvo.
2. Validar `tce_import_jobs`, `tce_receitas`, `tce_despesas`.
3. Filtrar em `/contas-publicas` por ano/mês/órgão/fornecedor.

## 5) Segurança e abuso

1. Stressar `legal-assistant` para validar resposta `429`.
2. Stressar `complaint-submit` para validar resposta `429`.
3. Validar headers `Retry-After` e `X-RateLimit-*`.

## Riscos de rollout

- Bloqueio anti-bot da origem do Diário Oficial pode exigir modo `items` (ingestão assistida).
- API do TCE pode alterar payload sem versionamento explícito.
- Fallback local ainda existe em módulos legados (migração incremental).
- `migrations-smoke` com Supabase CLI depende de ambiente com Docker.

## Mitigações

1. Monitoramento de logs por função (status e latência).
2. Job TCE com `dryRun` antes do primeiro import produtivo.
3. Rollout gradual por módulo e validação diária de dados.
4. Alertas operacionais para falha de cron/ingestão.
