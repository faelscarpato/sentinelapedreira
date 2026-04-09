# Testes, Rollout e Riscos

## Testes recomendados

## 1) Banco e RLS

1. Executar migrations na ordem:
   1. `202604080001_core_schema.sql`
   2. `202604080002_rls_policies.sql`
   3. `202604080003_storage_and_seed.sql`
2. Validar papéis seed em `roles`
3. Validar trigger de profile com novo usuário
4. Validar políticas de leitura pública vs privada

## 2) Frontend

1. `npm install`
2. `npm run check`
3. `npm run build`
4. Fluxo manual:
   1. Login magic link
   2. Criar denúncia (com e sem anexos)
   3. Abrir central do usuário
   4. Testar busca no header
   5. Testar assistente jurídico
   6. Testar rastreabilidade (papel editor/reviewer/admin)

## 3) Edge Functions

1. Definir secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` e/ou `GROQ_API_KEY` e/ou `NVIDIA_API_KEY`
   - `WEBHOOK_SHARED_SECRET`
2. Deploy de funções
3. Testar cada endpoint com payload válido e inválido
4. Validar timeout, logs e tratamento de erro

## Riscos de rollout

- Dados legados ainda em arquivos estáticos: páginas públicas podem divergir do banco até migração completa
- Busca server-side sem detalhe por slug: navegação ainda retorna para páginas de categoria
- `notifications-automation` sem provider externo configurado para e-mail/webhook (atualmente marca falha controlada)
- Dependência de secrets corretas para IA

## Mitigação recomendada

1. Fazer rollout por feature flag (`VITE_SUPABASE_ENABLED` opcional)
2. Migrar por domínio (denúncias, depois editorial, depois acervo público)
3. Habilitar monitoramento de erro por função
4. Validar performance de busca e custo de embeddings por lote
