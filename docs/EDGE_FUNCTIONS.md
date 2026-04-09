# Edge Functions Implementadas

## 1) `legal-assistant`

- Entrada validada com `zod`
- Auth opcional (anônimo permitido)
- Recupera contexto via RPC `search_public_documents`
- Persiste sessão/mensagens/logs quando usuário autenticado
- Retorna conteúdo + citações

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

## Segurança comum

- Segredos apenas em environment server-side
- Logs estruturados de sucesso/erro
- Respostas padronizadas em JSON
- Tratamento explícito de status HTTP
