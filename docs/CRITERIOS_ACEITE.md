# Critérios de Aceite por Módulo

## Auth e Acesso

- Login por magic link funciona
- `profiles` criado automaticamente no primeiro login
- `user_roles` possui `authenticated_user` por padrão
- Rotas protegidas bloqueiam usuários sem sessão

## Autorização (RLS)

- Usuário comum não lê dados privados de terceiros
- Conteúdo público só aparece quando `status = published`
- Editor/Revisor/Admin conseguem acessar workflow editorial
- Auditor/Admin conseguem consultar `audit_logs`

## Denúncias

- Criação retorna `protocol` único
- `complaint_events` e `complaint_status_history` registram mudanças
- Usuário autenticado visualiza apenas denúncias próprias
- Anexo só é aceito com autenticação e política de bucket válida

## Acervo Documental

- Tabelas de documentos/versionamento/eventos criadas
- Publicação atualiza `status`, `published_at`, `published_by`
- Busca RPC retorna apenas documentos publicados

## IA e RAG Base

- Edge Functions recebem input validado
- Nenhuma chave de provedor é exposta no cliente
- Função de chunking cria `document_chunks` e `embeddings`
- Logs de recuperação (`retrieval_logs`) são persistidos

## Editorial

- Painel lista filas de documentos e análises
- Revisor consegue registrar decisão em `analysis_reviews`
- Editor/Admin conseguem publicar

## Produto

- Favoritos persistem por usuário
- Filtros salvos persistem por usuário
- Notificações exibem e permitem marcar como lida

## Segurança

- `service_role` não aparece em frontend
- Variáveis `VITE_*` não contêm segredos sensíveis
- Buckets possuem políticas por papel/dono

## Acessibilidade (WCAG 2.2)

- Fluxos críticos executáveis por teclado
- Formulários com labels e mensagens de erro textuais
- Sem bloqueio de foco em componentes dinâmicos
- Contraste AA nas ações críticas
