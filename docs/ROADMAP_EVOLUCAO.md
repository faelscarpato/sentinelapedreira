# ROADMAP_EVOLUCAO — Sentinela Pedreira

## Curto Prazo (0–30 dias)

| Frente | Entrega | Impacto | Esforço | Responsável sugerido | Dependências |
|---|---|---|---|---|---|
| UX/UI | estabilização final da nova linguagem em todas as rotas públicas/internas | Alto | Médio | Frontend Lead | QA visual e acessibilidade |
| Dados | automação do build de datasets adicionais no fluxo de release (`data:build:portal-transparencia`) | Alto | Baixo/Médio | Data Engineer + Frontend | padronização de source files |
| Produto | validação funcional dos módulos críticos (denúncia, editorial, rastreabilidade, contas) | Alto | Médio | Product + QA | ambiente com Supabase configurado |
| Qualidade | cobertura mínima de testes por serviço crítico | Médio | Médio | Eng Team | definição de cenários |

---

## Médio Prazo (30–90 dias)

| Frente | Entrega | Impacto | Esforço | Responsável sugerido | Dependências |
|---|---|---|---|---|---|
| Dados | migração de datasets estáticos para tabelas Supabase com ingestão idempotente | Alto | Alto | Data/Backend Lead | modelagem de schema + RLS |
| Busca | busca unificada entre documentos, licitações, convênios e patrimônio | Alto | Médio/Alto | Full Stack Engineer | indexação + API de busca |
| Governança | observabilidade de import jobs e qualidade de dados | Alto | Médio | Backend/Data | pipeline de logs |
| Performance | code splitting por rota/domínio e redução de payload inicial | Médio/Alto | Médio | Frontend Lead | análise de bundle |

---

## Longo Prazo (90–180 dias)

| Frente | Entrega | Impacto | Esforço | Responsável sugerido | Dependências |
|---|---|---|---|---|---|
| Inteligência cívica | scorecards automáticos de transparência por domínio com explicabilidade | Alto | Alto | Product + Data Science | base histórica consistente |
| Alertas | detecção de anomalias e alertas de fiscalização com trilha auditável | Alto | Alto | Backend/Data | motor de regras |
| Ecossistema | APIs públicas para consumo externo (cidadãos/imprensa/controle) | Alto | Alto | Platform Team | segurança + governança de API |
| Engajamento | personalização de acompanhamento por tema/órgão + notificações multicanal | Médio/Alto | Médio | Product + Full Stack | maturidade de eventos |

---

## Priorização Geral

1. estabilizar a base visual e técnica já migrada;
2. consolidar ingestão de dados adicionais com pipeline confiável;
3. unificar busca e leitura cruzada entre módulos;
4. escalar para analytics, alertas e APIs públicas.

