# DATA_INTEGRATION_PLAN — Sentinela Pedreira

## 1) Inventário dos Arquivos Adicionais

Origem local analisada: `data/`

Arquivos priorizados e integrados na etapa inicial:

1. `Portal Transp. Convênios ou Termos de Repasse ao TS.csv`
2. `Portal Transp. Convenios.csv`
3. `Portal Transp. Emendas Impositivas (art. 166-A da CF) - Exercício 2026.csv`
4. `Portal Transp. Licitações.txt.txt`
5. `Portal Transp. Transferências entre Entidades - Exercício 2026.csv`
6. `Portal Transparencia Relação de Bens Imóveis do Patrimônio.csv`
7. `Portal Transparencia Relação de bens Intangíveis do Patrimônio.csv`
8. `Portal Transparencia Relação de Veículos do Patrimônio.csv`
9. `repasses pedreira completo.xlsx`

---

## 2) Schema Inferido e Domínio

| Dataset | Formato | Linhas (normalizadas) | Domínio | Chaves inferidas | Frequência provável |
|---|---|---:|---|---|---|
| convênios TS | CSV `;` | 65 | terceiro setor | `numero`, `convenio`, `cnpj_favorecido` | mensal/trimestral |
| convênios gerais | CSV `;` | 22 | terceiro setor | `numero`, `convenio`, `cnpj_favorecido` | mensal |
| emendas impositivas 2026 | CSV `;` | 3 | contas públicas | `tipo_transferencia` | mensal |
| licitações | TXT delimitado `;` | 11.833 | contas públicas | `proc_licitatorio`, `proc_administrativo`, `n_mod` | diário/semanal |
| transferências entre entidades | CSV `;` | 8 | repasses | `mes`, `entidade_pagadora`, `entidade_recebedora` | mensal |
| patrimônio imóveis | CSV `;` | 454 | patrimônio | `codigo`, `grupo_chapa` | eventual |
| patrimônio intangíveis | CSV `;` | 2 | patrimônio | `grupo_chapa` | eventual |
| patrimônio veículos | CSV `;` | 169 | patrimônio | `grupo_chapa`, `placa` | eventual |
| repasses pedreira completo | XLSX | 1.974 | repasses/TCE | `cnpj`, `exercicio`, `orgao`, `tipo_de_repasse` | mensal |

---

## 3) Estratégia de Ingestão Definida

## Fase implementada agora (estática versionada)

- Parser local de normalização:
  - `scripts/build-portal-transparency-datasets.mjs`
- Saída versionada para consumo frontend:
- `public/data/portal-transparencia/*.json`
- `public/data/portal-transparencia/manifest.json`
- Script npm:
  - `npm run data:build:portal-transparencia`

Inclui geração de dataset normalizado:

- `public/data/portal-transparencia/repasses-pedreira-completo.json`

## Decisão técnica desta fase

- **Destino atual:** static source versionado em `public/` (baixo risco e implantação imediata).
- **Motivo:** permite integração no produto sem bloquear por modelagem completa no banco.

---

## 4) Destino Técnico Futuro (Evolução)

## Alvo recomendado no Supabase

- Tabelas por domínio:
  - `portal_licitacoes`
  - `portal_transferencias_entidades`
  - `portal_convenios`
  - `portal_emendas_impositivas`
  - `portal_patrimonio_imoveis`
  - `portal_patrimonio_veiculos`
  - `portal_patrimonio_intangiveis`
  - `portal_import_jobs` (controle operacional)

## Pipeline

1. ingestão idempotente por hash de linha (`row_hash`)
2. dedupe por chave natural + período
3. upsert transacional
4. log por lote (`job_id`, `source_file`, `rows_read`, `rows_upserted`, `rows_error`)

---

## 5) Riscos de Qualidade de Dados

1. Encoding heterogêneo (UTF-8/Latin1).
2. Campos monetários em formato BR (`1.234,56`).
3. Datas em formatos mistos (`dd/mm/yyyy`, com/sem hora).
4. Arquivo de licitações volumoso e sujeito a ruído textual.
5. Potenciais quebras de schema entre exportações futuras do portal.

---

## 6) Critérios de Robustez

- idempotência por hash e chave estável;
- deduplicação por domínio;
- validação de schema por dataset;
- trilha de execução por import job;
- tolerância a campos nulos/incompletos;
- fallback seguro no frontend quando dataset falhar.

---

## 7) Exposição no Produto (Implementada)

- **Contas Públicas**
  - Painel TCE-SP agora baseado no XLSX de repasses (`repasses pedreira completo.xlsx`)
  - gráficos e tabela com filtros por exercício, tipo e função
- **Repasses**
  - painel dedicado com gráficos (distribuição e top órgãos) + tabela paginada
- **Terceiro Setor**
  - tabela de convênios/termos + KPIs

Serviço de leitura no frontend:

- `src/app/services/portalTransparencyService.ts`

---

## 8) Priorização de Próximos Datasets

P0:

1. licitações
2. transferências entre entidades
3. convênios/termos de repasse

P1:

1. patrimônio imóveis/veículos/intangíveis
2. emendas impositivas

P2:

1. cruzamentos com denúncias, editorial e scorecards de risco
2. alertas automáticos por variação anômala
