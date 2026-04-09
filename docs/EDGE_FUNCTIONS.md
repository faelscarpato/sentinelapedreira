# Edge Functions Implementadas

## Política JWT por função

- Configuração central em `supabase/config.toml`.
- `verify_jwt=false` para endpoints públicos/controlados:
  - `legal-assistant`
  - `complaint-submit`
  - `diario-oficial-sync`
  - `webhooks`
  - `notifications-automation`
- Funções internas permanecem com JWT obrigatório + checagem de papel.

## 1) `legal-assistant`

- Entrada validada com `zod`
- Auth opcional (anônimo permitido)
- Recupera contexto via RPC `search_public_documents`
- Persiste sessão/mensagens/logs quando usuário autenticado
- Retorna conteúdo + citações
- Rate limiting por IP/usuário:
  - `RATE_LIMIT_LEGAL_ASSISTANT_ANON_MAX`
  - `RATE_LIMIT_LEGAL_ASSISTANT_USER_MAX`
  - `RATE_LIMIT_LEGAL_ASSISTANT_WINDOW_SECONDS`
- Resposta 429 com `Retry-After` e headers `X-RateLimit-*`

## 2) `financial-traceability`

- Entrada validada com `zod`
- Auth obrigatório
- Papel obrigatório: `editor`, `reviewer` ou `admin`
- Chama provider de IA via camada normalizada
- Persiste análise estruturada em `analyses` + `analysis_versions` + `analysis_flags`

## 3) `embeddings-chunking`

- Entrada validada com `zod`
- Auth obrigatório
- Papel obrigatório: `editor` ou `admin`
- Segmenta texto em chunks
- Persiste `document_chunks` + `embeddings`

## 4) `webhooks`

- Aceita eventos com assinatura HMAC (`WEBHOOK_SHARED_SECRET`)
- Fallback: acesso autenticado com papel editorial/admin
- Atualiza entidades por tipo de evento
- Registra auditoria

## 5) `notifications-automation`

- Gera alertas simples de mudança de status de denúncias
- Processa entregas pendentes (`notification_deliveries`)
- Auth: `editor`/`admin` ou service context

## 6) `ai-provider-gateway`

- Interface unificada para `chat` e `embedding`
- Valida input e aplica timeout
- Auth obrigatório com papel privilegiado
- Centraliza provedores e evita acoplamento no cliente

## 7) `diario-oficial-sync`

- Coleta automática da página oficial `https://www.pedreira.sp.gov.br/diario-oficial`
- Suporta paginação `?pagina=` e modos:
  - `incremental` (páginas iniciais)
  - `backfill` (histórico completo)
- Também aceita `items` no payload (edições já coletadas externamente), para contornar bloqueio de origem (`403`) no runtime da Supabase
- Extrai:
  - número da edição
  - data de publicação
  - link de download do PDF
- Faz upsert em `documents` com categoria `Diário Oficial`
- Atualiza `sources.last_synced_at` e escreve auditoria em `audit_logs`
- Segurança:
  - `x-sync-secret` (`DIARIO_SYNC_SECRET`) para automação
  - fallback com auth + papel `editor/admin` para execução manual

## 8) `complaint-submit`

- Endpoint público (via `anon key`) para submissão de denúncia
- Validação de payload com `zod`
- Aplica rate limiting por IP/usuário (429 em abuso)
- Registra denúncia com protocolo real em `complaints`
- Escreve auditoria em `audit_logs`
- Upload de anexos permanece no fluxo autenticado do frontend (bucket `complaint-attachments`)

## 9) `tce-import`

- Ingestão oficial da API do TCE-SP (sem scraping):
  - `/api/json/municipios`
  - `/api/json/receitas/{municipio}/{exercicio}/{mes}`
  - `/api/json/despesas/{municipio}/{exercicio}/{mes}`
- Auth obrigatório com papel `editor` ou `admin`
- Persiste `tce_import_jobs`, `tce_receitas`, `tce_despesas`
- Idempotência por:
  - `idempotency_key` no job (município/ano/mês)
  - `row_hash` por registro (não duplica linhas)
- Suporta:
  - `force`: reexecutar período já importado
  - `replaceMonth`: limpar período antes de persistir
  - `dryRun`: validar sem gravar linhas

## Segurança comum

- Segredos apenas em environment server-side
- Logs estruturados de sucesso/erro
- Respostas padronizadas em JSON
- Tratamento explícito de status HTTP
- Funções públicas com proteção anti-abuso (rate limit + headers)
