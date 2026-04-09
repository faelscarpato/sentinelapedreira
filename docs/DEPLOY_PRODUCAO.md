# Guia de Deploy em Produção

## Arquitetura de deploy

- Frontend: Cloudflare Pages (build do Vite)
- Banco/Auth/Storage/Edge: Supabase
- Jobs automáticos: Supabase Cron + Edge Functions

## 1) Backend (Supabase)

1. Aplicar migrations em ordem:
   1. `202604080001_core_schema.sql`
   2. `202604080002_rls_policies.sql`
   3. `202604080003_storage_and_seed.sql`
   4. `202604080004_diario_oficial_sync.sql`
   5. `202604090005_security_rate_limit.sql`
   6. `202604090006_tce_pipeline.sql`
2. Validar RLS:
   - `select * from public.assert_public_tables_have_rls();`
   - deve retornar zero linhas.
3. Configurar secrets no projeto Supabase:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` e/ou `GROQ_API_KEY` e/ou `NVIDIA_API_KEY`
   - `DEFAULT_AI_PROVIDER`
   - `WEBHOOK_SHARED_SECRET`
   - `DIARIO_SYNC_SECRET`
   - `AUTOMATION_SECRET`
   - `RATE_LIMIT_LEGAL_ASSISTANT_ANON_MAX`
   - `RATE_LIMIT_LEGAL_ASSISTANT_USER_MAX`
   - `RATE_LIMIT_LEGAL_ASSISTANT_WINDOW_SECONDS`
   - `RATE_LIMIT_COMPLAINT_ANON_MAX`
   - `RATE_LIMIT_COMPLAINT_USER_MAX`
   - `RATE_LIMIT_COMPLAINT_WINDOW_SECONDS`

## 2) Deploy de Edge Functions

Executar:

```bash
supabase functions deploy legal-assistant
supabase functions deploy financial-traceability
supabase functions deploy embeddings-chunking
supabase functions deploy ai-provider-gateway
supabase functions deploy complaint-submit
supabase functions deploy diario-oficial-sync
supabase functions deploy webhooks
supabase functions deploy notifications-automation
supabase functions deploy tce-import
```

Política JWT por função (via `supabase/config.toml`):

- `verify_jwt=false`:
  - `legal-assistant`
  - `complaint-submit`
  - `diario-oficial-sync`
  - `webhooks`
  - `notifications-automation`
- Demais funções: JWT obrigatório.

## 3) Agendamentos (Cron)

- Diário Oficial: executar às 07:00 e 17:00 (`America/Sao_Paulo`) chamando `diario-oficial-sync` com `x-sync-secret`.
- Notificações: executar a cada 15 min chamando `notifications-automation` com `x-automation-secret`.
- Importação TCE-SP: job administrativo (manual ou agendado) chamando `tce-import` com JWT de editor/admin.

## 4) Frontend (Cloudflare Pages)

1. Conectar repositório no Cloudflare Pages.
2. Configurar build:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Definir variáveis públicas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_BASE_URL`
4. Não definir segredos em `VITE_*`.

## 5) Checklist pós-deploy

1. Login e sessão em `/entrar`.
2. Denúncia com protocolo em `/denuncia`.
3. Busca por slug no header abrindo `/documentos/:slug`.
4. Contas Públicas com dados TCE por ano/mês/órgão/fornecedor.
5. Assistente jurídico retornando 429 sob abuso.
6. Cron do Diário Oficial gerando novos documentos publicados.
