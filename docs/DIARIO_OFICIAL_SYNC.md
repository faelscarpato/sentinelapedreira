# Diário Oficial — Sincronização Operacional

## Resumo

O projeto já está preparado para consumir Diário Oficial do Supabase (`documents` + RPC `list_diario_oficial_documents`), sem dependência de `.json` local.

## Fonte oficial

- Página: `https://www.pedreira.sp.gov.br/diario-oficial`
- Campos extraídos:
  - número da edição
  - data (`dd/mm/yyyy`)
  - URL do PDF (domínio `ecrie.com.br`)

## Problema real encontrado

No runtime da Supabase Edge Function, a origem oficial responde `403` (WAF/antibot), então a coleta direta server-side pode falhar mesmo com parser correto.

## Estratégia operacional (recomendada)

1. Coletar HTML fora do runtime da Supabase (ambiente local/servidor seu).
2. Enviar os itens coletados para `diario-oficial-sync`.
3. A Edge Function faz upsert em `documents`, atualiza `sources.last_synced_at` e escreve `audit_logs`.

## Edge Function `diario-oficial-sync`

Entrada aceita:

- `mode`: `incremental` | `backfill`
- `startPage`: página inicial
- `maxPages`: quantidade máxima de páginas
- `dryRun`: sem persistir
- `items` (opcional): lista já coletada externamente

Quando `items` é enviado, a função não precisa buscar HTML na origem.

## Runner externo

Script local:

- `scripts/diario-oficial-sync-runner.mjs`
- comando: `npm run sync:diario-oficial`

Variáveis necessárias no ambiente do runner:

- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `DIARIO_SYNC_SECRET=<segredo configurado na Edge Function>`
- opcional: `SUPABASE_FUNCTION_URL` (se quiser sobrescrever URL padrão)

Exemplos:

```bash
npm run sync:diario-oficial
npm run sync:diario-oficial -- --mode backfill --max-pages 166
npm run sync:diario-oficial -- --mode incremental --max-pages 3
```

## Agendamento (07:00 e 17:00)

Como a origem bloqueia o runtime da Supabase em alguns cenários, o agendamento deve rodar no mesmo ambiente que coleta com sucesso (seu servidor/PC/CI), não via `pg_cron`.

Exemplo de cron Linux:

```cron
0 7,17 * * * cd /caminho/do/projeto && SUPABASE_URL=... DIARIO_SYNC_SECRET=... npm run sync:diario-oficial -- --mode incremental --max-pages 3 >> /var/log/diario-sync.log 2>&1
```

## Carga imediata (popular agora)

Se precisar popular imediatamente, execute:

```bash
npm run sync:diario-oficial -- --mode incremental --max-pages 5
```

## Validação rápida

```sql
select slug, ingestion_status, last_synced_at
from public.sources
where slug = 'prefeitura-pedreira-diario-oficial';

select count(*) as total
from public.documents
where category = 'Diário Oficial'
  and status = 'published'
  and deleted_at is null;

select
  title,
  publication_date,
  metadata->>'edition_number' as edition_number,
  metadata->>'original_url' as original_url
from public.documents
where category = 'Diário Oficial'
  and status = 'published'
  and deleted_at is null
order by publication_date desc, created_at desc
limit 20;
```
