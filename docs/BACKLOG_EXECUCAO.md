# Backlog Priorizado de Execução

## 1. Auth + Profiles + Papéis

- [x] Contexto de autenticação no frontend
- [x] Rota de login (`/entrar`)
- [x] Área autenticada (`/minha-conta`)
- [x] tabela/trigger de profile automático
- [x] seed de papéis mínimos

## 2. RLS

- [x] policies de leitura pública apenas para conteúdo publicado
- [x] policies de dono para registros privados
- [x] policies por papéis editor/reviewer/admin/auditor

## 3. IA migrada para Edge Functions

- [x] `legal-assistant`
- [x] `financial-traceability`
- [x] `ai-provider-gateway`
- [x] remoção de IA direta no browser

## 4. Denúncia real com protocolo e histórico

- [x] tabela `complaints` com protocolo real
- [x] triggers para `complaint_events` e `complaint_status_history`
- [x] formulário de denúncia persistindo no Supabase
- [x] anexos em storage com política

## 5. Persistência de documentos e eventos

- [x] modelagem `documents`, `document_versions`, `document_events`, `document_files`
- [ ] ingestão de todo acervo legado no banco

## 6. Workflow editorial

- [x] schema e políticas
- [x] painel editorial inicial (`/painel-editorial`)
- [ ] ações avançadas de revisão (diff, rollback, aprovação em lote)

## 7. Favoritos

- [x] schema + service + listagem na central do usuário
- [ ] ação de favoritar diretamente nos cards públicos

## 8. Filtros salvos

- [x] schema + service + cadastro/listagem básica
- [ ] aplicar automaticamente filtros salvos por contexto de página

## 9. Alertas simples

- [x] schema notificações + deliveries
- [x] função `notifications-automation`
- [ ] integração real de e-mail/webhook provider

## 10. Busca server-side básica

- [x] RPC `search_public_documents`
- [x] busca no header com fallback local
- [ ] navegar para detalhe de documento por slug server-side
