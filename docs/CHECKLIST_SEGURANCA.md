# Checklist de Segurança

- [x] Nenhuma chave de IA no frontend
- [x] Nenhum uso de `service_role` no browser
- [x] Auth + RLS habilitados para dados sensíveis
- [x] Denúncia com protocolo persistido
- [x] Trilhas de auditoria (`audit_logs`, eventos de domínio)
- [x] Buckets segregados por finalidade e política
- [x] Validação de payload em Edge Functions com `zod`
- [x] Tratamento explícito de erro e timeout nas funções
- [x] Busca pública limitada a conteúdo publicado
- [x] Segredos apenas em environment server-side

## Itens pendentes para produção endurecida

- [ ] Rate limit por IP/usuário para funções públicas
- [ ] WAF e proteção anti-abuso para endpoints de IA
- [ ] Sanitização avançada de conteúdo markdown gerado por IA
- [ ] Alertas de segurança e auditoria centralizada (SIEM)
- [ ] Testes E2E de autorização por papel
