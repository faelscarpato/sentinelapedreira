# UI_IMPLEMENTATION_PLAN — Sentinela Pedreira

## 1) Base Visual Escolhida

- **Base principal:** `docs/redesign_sentinela_opcao_2` (Transparent Monolith).
- **Elementos absorvidos da opção 1:** padrões de operação para telas internas (fila editorial, rastreabilidade, estados de governança).
- **Descartado:** mistura indiscriminada de padrões que gere quebra de identidade entre módulos.

Racional:

- Opção 2 entrega melhor percepção pública institucional e leitura editorial.
- Opção 1 complementa melhor os fluxos internos de trabalho.

---

## 2) Design System Consolidado

## Tokens e fundações

- Cores institucionais em escala tonal (superfícies e destaque sem ruído).
- Tipografia:
  - headlines: Public Sans
  - corpo: Inter
  - dados técnicos: JetBrains Mono (uso pontual)
- Escala de espaçamento orientada a legibilidade documental.
- Foco visível e contraste de componentes para acessibilidade.

## Primitives de layout

Componentes-base consolidados:

- `PageContainer`
- `PageHero`
- `SectionBlock`
- `SectionHeading`
- `InlineStatus`
- `PageState` (loading/empty/error)
- `StatKpi`
- `AuthBadge`

---

## 3) Ordem de Migração de Páginas

## Prioridade 1 (alto impacto de percepção e uso)

1. Home
2. Documento detalhe
3. Diário Oficial
4. Contas Públicas
5. Denúncia
6. Assistente Jurídico
7. Minha Conta
8. Painel Editorial
9. Rastreabilidade

## Prioridade 2 (coerência transversal)

1. Câmara Legislativa + detalhe de análise
2. Repasses
3. Terceiro Setor
4. Controle Externo
5. Relatórios + detalhe
6. Entrar
7. NotFound

---

## 4) Componentes de Produto (Base)

## Navegação e shell

- Header institucional único
- Footer institucional único
- largura e respiro consistentes

## Blocos de conteúdo

- cards documentais padronizados
- listagens com paginação e filtros uniformes
- tabelas de dados com legibilidade e hierarchy tokens
- estados de loading/empty/error homogêneos

## Padrões de formulários

- labels e campos consistentes
- feedback de erro/sucesso
- foco visível e teclado

---

## 5) Critérios de Acessibilidade

- conformidade prática com WCAG 2.2 AA nas principais telas.
- foco por teclado em todos os elementos interativos.
- contraste mínimo adequado para texto e controles.
- estrutura semântica coerente (`header/main/section`, headings em ordem).
- feedbacks explícitos em estados de erro e carregamento.

---

## 6) Critérios de Responsividade

- desktop e mobile como alvos primários (não fallback tardio).
- grids adaptativos por breakpoint com preservação de hierarquia.
- tabelas com overflow horizontal controlado em telas pequenas.
- CTAs e filtros preservando usabilidade touch.

---

## 7) Regras de Implementação

- Sistema primeiro, páginas depois.
- Evitar duplicação de componentes com mesma responsabilidade.
- Preservar lógica de domínio existente (dados, autenticação, editorial, denúncia).
- Não quebrar rotas.
- Evitar regressão funcional enquanto evolui a linguagem visual.

