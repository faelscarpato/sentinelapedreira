# Plano de Migração — Sentinela Pedreira para Supabase

## Arquitetura-alvo (obrigatória)

- Frontend: React + TypeScript + Vite
- Auth: Supabase Auth
- Banco: Supabase Postgres
- Autorização: RLS por papel
- Storage: Supabase Storage
- Server-side: Supabase Edge Functions
- Vetores: pgvector
- Auditoria: tabelas de domínio + `audit_logs`

## O que fica no Frontend

- Renderização da UI, navegação, formulários e estados de UX
- Consumo de dados via Supabase Client (anon key + RLS)
- Guards de rota por autenticação/papel

## O que vai para Postgres

- Identidade/acesso: `profiles`, `roles`, `user_roles`
- Conteúdo: `sources`, `documents`, `document_*`
- Análises: `analyses`, `analysis_*`
- Denúncias: `complaints`, `complaint_*`
- Produto: `favorites`, `saved_filters`, `subscriptions`, `notifications`
- IA/RAG: `document_chunks`, `embeddings`, `chat_*`, `retrieval_logs`

## O que vai para Storage

- `public-documents`: documentos públicos publicados
- `complaint-attachments`: anexos de denúncias com política de dono/papel
- `editorial-assets`: arquivos do workflow editorial
- `exports`: exportações por usuário/processo
- `temp-processing`: artefatos temporários de IA/ingestão

## O que vai para Edge Functions

- `legal-assistant`: resposta jurídica com recuperação de contexto
- `financial-traceability`: análise estruturada de rastreabilidade
- `embeddings-chunking`: chunking + embeddings
- `webhooks`: integração inbound com assinatura
- `notifications-automation`: alertas/entregas
- `ai-provider-gateway`: normalização de providers IA

## O que precisa virar tabela

- Tudo que hoje é efêmero ou estático sensível:
  - denúncias e protocolo
  - histórico de status/eventos
  - versões editoriais e revisões
  - auditoria de ações
  - preferências de usuário
  - logs de recuperação RAG

## O que precisa virar workflow

- Workflow editorial: `draft -> in_review -> published/rejected`
- Workflow de denúncia: `submitted -> triage -> in_review -> resolved/rejected`
- Workflow de notificações: `pending -> sent/failed`

## O que pode ficar mock temporariamente

- Catálogo antigo em `src/app/data/generated/*` durante transição
- alguns painéis públicos ainda alimentados pelo dataset legado (até ingestão completa no Postgres)

## Ordem exata de migração (sem quebrar projeto)

1. Criar schema SQL + RLS + buckets + triggers
2. Habilitar Auth + perfis + papéis + guards
3. Migrar IA (chat/rastreabilidade) para Edge Functions
4. Migrar denúncia para persistência real + protocolo + eventos
5. Ligar busca server-side (RPC)
6. Ligar painel editorial (fila, revisão, publicação)
7. Ligar favoritos/filtros/notificações na área autenticada
8. Migrar progressivamente páginas públicas para dados do Postgres
9. Descomissionar datasets locais gigantes
