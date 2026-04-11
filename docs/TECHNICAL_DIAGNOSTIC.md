# TECHNICAL_DIAGNOSTIC — Sentinela Pedreira

## Resumo Executivo

Sentinela Pedreira está em uma fase de transição de portal cívico com base estática para plataforma híbrida (dados oficiais + trilha editorial + operações internas + IA auditável com Supabase).

Diagnóstico consolidado:

- **Versão-base técnica recomendada:** `sentinelaV3` (equivalente ao estado atual do repositório local).
- **Versão histórica comparativa:** `sentinelapedreira.zip` (baseline anterior).
- **Snapshot `sentinelaV2`:** **não encontrado** como pasta/zip independente no workspace atual (até 09/04/2026).
- **Base visual recomendada:** Redesign opção 2 (Transparent Monolith), com absorção pontual da opção 1 para fluxos internos de operação editorial.

---

## 1) Entendimento do Produto e Fluxos

## Natureza do produto

- Portal público de transparência e controle social.
- Camada interna de operação editorial/auditoria.
- Exploração de documentos oficiais por domínio cívico.
- Rastreabilidade financeira e assistente jurídico com IA.

## Perfis de usuário

- Cidadão/controle social: consulta documentos, finanças públicas, denúncias.
- Editor/Revisor/Admin: governança de conteúdo, fila editorial, rastreabilidade.

## Fluxos centrais mapeados

1. Descoberta pública (Home -> módulos -> detalhe de documento).
2. Consulta de Diário Oficial e acervo temático.
3. Contas públicas (TCE + acervo local).
4. Denúncia com protocolo.
5. Minha conta (denúncias/favoritos/filtros/notificações).
6. Painel editorial (revisão/publicação).
7. Rastreabilidade financeira (Edge Function + histórico em `analyses`).
8. Assistente jurídico (Edge Function com citações).

---

## 2) Arquitetura Atual

## Frontend

- Stack: React + TypeScript + Vite + Tailwind.
- Roteamento: `src/app/routes.tsx` (rotas públicas + protegidas por `RequireAuth`/`RequireRoles`).
- Shell global: `src/app/Root.tsx`, `Header`, `Footer`, `AssistantChatWidget`.
- Primitives de layout consolidadas: `src/app/components/layout/PagePrimitives.tsx`.

## Módulos por página (estado atual)

- Home
- Diário Oficial
- Câmara Legislativa + detalhe de análise
- Documento detalhe por slug
- Contas públicas
- Controle externo
- Repasses
- Terceiro setor
- Relatórios + detalhe
- Denúncia
- Assistente jurídico
- Entrar/autenticação
- Minha conta
- Painel editorial
- Rastreabilidade

## Dados e serviços

- Camada estática principal: `src/app/data/realData.ts` + `generated/*`.
- Camada dinâmica via Supabase:
  - `diarioOficialService.ts`
  - `tceService.ts`
  - `documentDetailsService.ts`
  - `documentsService.ts`
  - `complaintsService.ts`
  - `assistantService.ts`
  - `traceabilityService.ts`
  - `userDataService.ts`
- Novo serviço de datasets adicionais: `portalTransparencyService.ts`.

## Backend/Infra (preparação)

- Supabase (Auth, Postgres+RLS, Storage, Edge Functions).
- Migrations versionadas em `supabase/migrations`.
- Edge Functions previstas e documentadas (assistente, rastreabilidade, ingestões).

---

## 3) Comparação Entre Versões Disponíveis

Comparação real realizada entre:

- `current` (repositório local atual)
- `tmp_versions/sentinelaV3` (extraído de `sentinelaV3.zip`)
- `tmp_versions/sentinelapedreira_zip` (extraído de `sentinelapedreira.zip`)

## Quadro comparativo

| Critério | current / sentinelaV3 | sentinelapedreira.zip (baseline) |
|---|---|---|
| Páginas | 19 | 13 |
| Rotas protegidas (auth/roles) | Sim | Não |
| Documento por slug (`/documentos/:slug`) | Sim | Não |
| Módulos internos (Minha Conta, Painel Editorial, Rastreabilidade) | Sim | Não |
| Supabase folder + migrações | Sim | Não |
| README de arquitetura/setup | Sim | Não |
| Scripts de qualidade (lint/typecheck/test/ci) | Sim | Não (apenas build/dev) |
| Maturidade de produto | Alta (em evolução para produção) | Inicial/protótipo |
| Risco de regressão ao adotar como base | Baixo | Alto |

## Decisão

- **Base principal:** `sentinelaV3` / estado atual.
- **Reaproveitamento do baseline histórico:** apenas referência de contexto legado.
- **Descartado como base:** `sentinelapedreira.zip`, por lacunas de módulos e ausência de arquitetura de produção.

---

## 4) Comparação das Duas Opções de Redesign

## Opção 1 (`redesign_sentinela_opcao_1`)

Pontos fortes:

- Cobertura de fluxos internos (fila editorial, scorecard, operação).
- Boa aderência a telas densas de governança.
- Boa orientação para estados operacionais.

Pontos fracos:

- Visual mais pesado em alguns cenários públicos.
- Menor sofisticação editorial em páginas de descoberta.

## Opção 2 (`redesign_sentinela_opcao_2`)

Pontos fortes:

- Linguagem institucional/editorial mais coesa para o portal público.
- Melhor hierarquia de leitura e separação tonal.
- Direção visual forte para Home, Diário, Documento detalhe e Contas.

Pontos fracos:

- Menor cobertura nativa de telas internas densas.

## Decisão de design

- **Base visual principal:** opção 2.
- **Absorção da opção 1:** padrões operacionais para módulos internos (editorial/rastreabilidade).
- **Descartes:** mistura de padrões que gere produto “colado”.

---

## 5) TOP 10 Problemas Críticos (Atualizados)

1. **Dados adicionais fora da UX principal** (antes desta implementação): licitações/patrimônio/convênios não eram materializados no produto.
2. **`realData.ts` com regras temporárias que anulam análise** (`analysisUrl` e `reports` zerados), reduzindo o valor editorial.
3. **Acoplamento alto em `realData.ts`** (normalização, deduplicação, fallback e estratégia de produto no mesmo arquivo).
4. **Fonte híbrida sem camada unificada de consulta** (local + Supabase + Edge) com semântica de fallback distribuída por página.
5. **Dependência forte de dataset estático gigante no cliente** para alguns fluxos.
6. **Ausência de pipeline idempotente de ingestão para arquivos CSV/TXT adicionais** (até esta entrega, sem automação).
7. **Qualidade heterogênea dos dados públicos** (encoding, tipos, campos inconsistentes).
8. **Risco de crescimento de bundle e payload** (chunk JS principal alto + dataset grande de licitações).
9. **Cobertura de testes limitada** para fluxos de dados e integração (teste atual é pontual de sanitização).
10. **Observabilidade de ingestão e qualidade ainda incipiente** para evolução contínua de dados públicos.

---

## 6) Matriz Impacto x Esforço

| Item | Impacto | Esforço | Prioridade |
|---|---|---|---|
| Integração dos datasets adicionais no produto | Alto | Médio | P0 |
| Normalização automatizada CSV/TXT -> JSON versionado | Alto | Médio | P0 |
| Reativar trilha editorial de análises em `realData.ts` com fonte robusta | Alto | Médio | P0 |
| Consolidação de camada de dados (Gateway único por domínio) | Alto | Médio/Alto | P1 |
| Migração progressiva dos datasets para Supabase tabelado | Alto | Alto | P1 |
| Otimização de payload/chunks (lazy load e code split) | Médio/Alto | Médio | P1 |
| Testes de integração por serviço (TCE/DO/denúncia/editorial) | Médio | Médio | P1 |
| Observabilidade de ingestão (logs, erro por linha, dedupe) | Alto | Médio | P1 |
| Catálogo semântico de dados públicos (data dictionary) | Médio | Médio | P2 |
| Scorecards e alertas automáticos de anomalia | Alto | Alto | P2 |

---

## 7) Riscos de Escalabilidade Futura

- Crescimento não controlado de payloads estáticos sem particionamento.
- Duplicação de regra de domínio entre frontend e pipelines.
- Dependência excessiva do cliente para regras críticas de transformação.
- Risco de inconsistência temporal sem versionamento formal por snapshot de dados.
- Custos de manutenção elevados sem padronização de ingestão e quality gates.

---

## 8) O Que Falta Para “Produto Real Necessário”

1. Pipeline operacional recorrente de ingestão dos novos domínios (além de Diário/TCE).
2. Camada de busca unificada cruzando documentos + datasets financeiros/patrimoniais.
3. Reativação controlada das análises publicadas no acervo.
4. Scorecards e alertas com explicabilidade por fonte/linha de dado.
5. QA e observabilidade contínua em produção (data quality + UX/performance).

---

## 9) Dependências e Pontos de Atenção

- Dependência de qualidade de origem dos portais públicos.
- Estratégia de storage e versionamento dos snapshots.
- Priorização de schema no Supabase para domínios recém-incorporados.
- Controle de crescimento do bundle e carregamento incremental por rota.

