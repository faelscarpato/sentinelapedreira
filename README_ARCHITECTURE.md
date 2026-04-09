# README_ARCHITECTURE

## Visão Geral

Sentinela Pedreira foi refatorado para arquitetura cívica com Supabase como backbone:

- Auth: Supabase Auth
- Dados: Supabase Postgres + RLS
- Arquivos: Supabase Storage
- IA/Back-end: Supabase Edge Functions
- RAG base: `document_chunks` + `embeddings` (pgvector)
- Auditoria: `audit_logs` + tabelas de eventos de domínio

## Camadas

## Frontend (React + TS + Vite)

- Renderização e UX
- Guard de rota (`RequireAuth`, `RequireRoles`)
- Consumo via `supabase-js` com `anon key`
- Sem segredos no cliente
- Rota de detalhe por slug: `/documentos/:slug`
- Sanitização de markdown com hardening de links externos

## Banco (Postgres + RLS)

Domínios principais:

- Identidade e acesso
- Acervo documental
- Análises
- Denúncias
- Produto e retenção
- IA / RAG

RLS garante:

- público vê apenas conteúdo publicado
- usuário comum só acessa seus registros privados
- editor/reviewer/admin com escopo de governança
- auditor/admin com leitura de trilha de atividades

## Storage

Buckets:

- `public-documents`
- `complaint-attachments`
- `editorial-assets`
- `exports`
- `temp-processing`

## Edge Functions

- `legal-assistant`: assistente jurídico com recuperação de contexto
- `financial-traceability`: análise financeira estruturada
- `embeddings-chunking`: chunking + embeddings
- `webhooks`: entrada de eventos externos
- `notifications-automation`: geração/entrega de notificações
- `ai-provider-gateway`: camada unificada para providers de IA
- `diario-oficial-sync`: ingestão automática do Diário Oficial
- `complaint-submit`: endpoint público de denúncia com protocolo
- `tce-import`: ingestão oficial via API do TCE-SP (municípios/receitas/despesas)

## Fluxos críticos

## Denúncia

1. Frontend valida formulário
2. Insere `complaints`
3. Trigger gera protocolo real
4. Trigger registra evento/histórico
5. (Opcional) upload de anexos em `complaint-attachments`

## Workflow editorial

1. Conteúdo nasce em `draft`
2. Revisão em `in_review`
3. Publicação em `published`
4. Eventos e auditoria registrados

## Assistente/RAG

1. Query entra em Edge Function
2. Busca server-side em documentos publicados
3. Modelo responde com contexto
4. Sessão/mensagens/log de recuperação são persistidos

## Pipeline TCE-SP

1. Edge Function `tce-import` coleta:
   - `/api/json/municipios`
   - `/api/json/receitas/{municipio}/{exercicio}/{mes}`
   - `/api/json/despesas/{municipio}/{exercicio}/{mes}`
2. Normaliza e persiste em:
   - `tce_import_jobs`
   - `tce_receitas`
   - `tce_despesas`
3. Idempotência por hash (`row_hash`) e chave de período (`idempotency_key`)
4. Frontend de Contas Públicas lê do banco com filtros por período, órgão e fornecedor

## Princípios de segurança aplicados

- `service_role` nunca no browser
- segredos só em Edge Function env
- validação de payload com `zod`
- logs estruturados + auditoria persistida

## Limites atuais e próximos passos

- páginas públicas ainda possuem fallback em dataset local
- necessário migrar acervo legado completo para Postgres
- necessário evoluir notificações externas (email/webhook real)
- necessário automatizar import TCE recorrente com credenciais operacionais de produção
