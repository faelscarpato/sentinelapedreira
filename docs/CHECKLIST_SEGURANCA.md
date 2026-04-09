# Checklist de Segurança

## Chaves e segredos

- [x] `SUPABASE_SERVICE_ROLE_KEY` não é usado no frontend
- [x] Chaves de IA ficam apenas no server-side (Edge Functions)
- [x] `VITE_*` restrito a valores públicos
- [x] CI com verificação de segredos em `VITE_*` (`scripts/check-vite-secrets.mjs`)

## Banco e autorização

- [x] RLS habilitado em todas as tabelas públicas modeladas
- [x] Rotina de verificação de RLS (`scripts/check-public-rls.mjs`)
- [x] Políticas públicas limitadas a conteúdo publicado
- [x] Registros privados limitados ao dono/papéis autorizados
- [x] Trilha de auditoria (`audit_logs` + eventos de domínio)

## Edge Functions

- [x] `supabase/config.toml` com `verify_jwt=false` apenas para automações necessárias
- [x] Funções internas mantidas com JWT obrigatório e validação por papel
- [x] Validação de payload com `zod`
- [x] Tratamento de erro e status HTTP explícito
- [x] Logs estruturados
- [x] Rate limiting anti-abuso:
  - `legal-assistant`
  - `complaint-submit`

## Conteúdo e frontend

- [x] Sanitização robusta de markdown (`SafeMarkdown`)
- [x] Links externos forçados com `noopener noreferrer nofollow`
- [x] Busca server-side navegando para detalhe por slug
- [x] Tela de detalhe com fonte oficial, datas e origem

## Dados oficiais

- [x] Diário Oficial com pipeline de ingestão dedicado
- [x] TCE-SP com pipeline oficial via API (sem scraping)
- [x] Idempotência de import no TCE (`idempotency_key` + `row_hash`)

## Pendências de hardening (próxima iteração)

- [ ] Integração SIEM/alertas de segurança centralizados
- [ ] Testes E2E completos de autorização por papel
- [ ] WAF/CDN rules específicas para picos de abuso em produção
