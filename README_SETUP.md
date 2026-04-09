# README_SETUP

## Pré-requisitos

- Node.js 20+
- npm 10+
- Conta Supabase com projeto criado
- Supabase CLI (`supabase`) instalado

## 1) Configurar variáveis de ambiente (frontend)

Crie `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Preencha:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BASE_URL`

## 2) Aplicar migrations

No Supabase SQL Editor (ou via CLI), aplicar em ordem:

1. `supabase/migrations/202604080001_core_schema.sql`
2. `supabase/migrations/202604080002_rls_policies.sql`
3. `supabase/migrations/202604080003_storage_and_seed.sql`
4. `supabase/migrations/202604080004_diario_oficial_sync.sql`
5. `supabase/migrations/202604090005_security_rate_limit.sql`
6. `supabase/migrations/202604090006_tce_pipeline.sql`

## 3) Configurar secrets das Edge Functions

Defina no Supabase:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` e/ou `GROQ_API_KEY` e/ou `NVIDIA_API_KEY`
- `DEFAULT_AI_PROVIDER` (`openai`, `groq` ou `nvidia`)
- `WEBHOOK_SHARED_SECRET`
- `DIARIO_SYNC_SECRET` (segredo para automação do Diário Oficial)
- `AUTOMATION_SECRET` (segredo para automações agendadas)
- `RATE_LIMIT_LEGAL_ASSISTANT_ANON_MAX` (opcional, padrão `12`)
- `RATE_LIMIT_LEGAL_ASSISTANT_USER_MAX` (opcional, padrão `40`)
- `RATE_LIMIT_LEGAL_ASSISTANT_WINDOW_SECONDS` (opcional, padrão `60`)
- `RATE_LIMIT_COMPLAINT_ANON_MAX` (opcional, padrão `5`)
- `RATE_LIMIT_COMPLAINT_USER_MAX` (opcional, padrão `15`)
- `RATE_LIMIT_COMPLAINT_WINDOW_SECONDS` (opcional, padrão `3600`)

## 4) Configurar `supabase/config.toml` (JWT por função)

Este projeto versiona `supabase/config.toml` com política explícita:

- `verify_jwt=false` para endpoints públicos/controlados:
  - `legal-assistant`
  - `complaint-submit`
  - `diario-oficial-sync`
  - `webhooks`
  - `notifications-automation`
- Demais funções mantêm JWT obrigatório.

Antes do deploy, revise o arquivo:

```bash
cat supabase/config.toml
```

## 5) Deploy das Edge Functions

Funções incluídas:

- `legal-assistant`
- `financial-traceability`
- `embeddings-chunking`
- `webhooks`
- `notifications-automation`
- `ai-provider-gateway`
- `diario-oficial-sync`
- `complaint-submit`
- `tce-import`

Exemplo de deploy:

```bash
supabase functions deploy legal-assistant
supabase functions deploy financial-traceability
supabase functions deploy embeddings-chunking
supabase functions deploy webhooks
supabase functions deploy notifications-automation
supabase functions deploy ai-provider-gateway
supabase functions deploy diario-oficial-sync
supabase functions deploy complaint-submit
supabase functions deploy tce-import
```

## 5.1) Agendar atualização diária do Diário Oficial

Opção A (recomendada): Dashboard `Integrations -> Cron` e criar job HTTP diário para:

- URL: `https://<project-ref>.supabase.co/functions/v1/diario-oficial-sync`
- Método: `POST`
- Header: `x-sync-secret: <DIARIO_SYNC_SECRET>`
- Body:

```json
{
  "mode": "incremental",
  "maxPages": 3
}
```

Opção B (SQL via `pg_cron` + `pg_net`):

```sql
select cron.schedule(
  'diario-oficial-sync-daily',
  '0 7 * * *',
  $$
    select
      net.http_post(
        url := 'https://<project-ref>.supabase.co/functions/v1/diario-oficial-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', '<DIARIO_SYNC_SECRET>'
        ),
        body := '{"mode":"incremental","maxPages":3}'::jsonb
      );
  $$
);
```

## 6) Instalar dependências e rodar app

```bash
npm install
npm run lint
npm run check
npm run test
npm run build
npm run dev
```

## 7) Pipeline local de qualidade (mesma base da CI)

```bash
npm run ci:validate
```

## 8) Teste rápido funcional

1. Acesse `/entrar` e faça login por magic link
2. Crie denúncia em `/denuncia`
3. Veja central em `/minha-conta`
4. Teste busca no header
5. Teste painel editorial em `/painel-editorial` (papel necessário)
6. Teste rastreabilidade em `/rastreabilidade` (papel necessário)

## Notas de segurança

- Não use `service_role` no frontend
- Não coloque chaves de IA em `VITE_*`
- Toda chamada de IA deve passar por Edge Function
- Funções públicas devem ter rate limiting + logs de abuso
- Guia de deploy completo: `docs/DEPLOY_PRODUCAO.md`
