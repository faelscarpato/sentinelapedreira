# Análise de Uso — `data/reports`

Data da análise: 2026-04-09

## Escopo
Foram avaliados todos os arquivos `*.report.md` da pasta `data/reports` para decidir o que pode ser usado no produto e o que deve ser descartado ou tratado com cautela.

## Inventário rápido
- Total de arquivos: 357
- Tipo de arquivo: 100% Markdown (`.md`)
- Tamanho total aproximado: 868 KB
- Status no frontmatter:
  - `PENDING_REVIEW`: 357

Distribuição por `tipo`:
- `DIARIO`: 72
- `IND`: 67
- `MOC`: 47
- `OUTROS`: 43
- `PLO`: 37
- `REQ`: 31
- `CONTAS`: 30
- `ATA`: 14
- `DECRETO`: 4
- `LEI_ORGANICA`: 4
- `TERCEIRO_SETOR`: 4
- `PLC`: 3
- `REPASSE`: 1

Distribuição de origem (`url_origem`):
- `www.camarapedreira.sp.gov.br`: 196
- `ecrie.com.br`: 145
- `www.pedreira.sp.gov.br`: 5
- caminho local (`/documentos/...`): 4
- outros domínios: 7

## Qualidade estrutural
- Seções obrigatórias presentes em todos os 357:
  - `## Resumo Executivo`
  - `## Análise Jurídica`
  - `## Impacto Fiscal`
  - `## Rastreabilidade`
- `url_origem` ausente: 0
- `tamanho_chars = 0`: 15
- `tamanho_chars < 500`: 50

Observação crítica:
- Todos os arquivos estão como `PENDING_REVIEW`, então nenhum relatório deve ser tratado como “parecer final” sem validação humana.

## Critério de classificação aplicado
Regra prática para uso no produto:
- `usar`:
  - `tamanho_chars >= 500`
  - sem sufixo técnico de duplicata (`_ETA_...` ou `__YYYY_YYYY_MM_DD`)
- `usar_com_ressalvas`:
  - `1 <= tamanho_chars < 500`
  - sem sufixo técnico de duplicata
- `nao_usar`:
  - `tamanho_chars = 0`
  - ou arquivo variante técnica/duplicada com sufixo `_ETA_...`
  - ou arquivo com sufixo duplicado de data `__YYYY_YYYY_MM_DD`

Resultado:
- `usar`: 298
- `usar_com_ressalvas`: 35
- `nao_usar`: 24

## Arquivos classificados como `nao_usar`
Motivo: `tamanho_chars=0` ou variação técnica duplicada.

- `CONTAS_001_2026.report.md` (0)
- `CONTAS_005_2026.report.md` (0)
- `CONTAS_007_2026.report.md` (0)
- `CONTAS_012_2026.report.md` (0)
- `CONTAS_026_2026.report.md` (0)
- `LEI_ORGANICA_1765_2026_CA_ORD_1765_1994.report.md` (0)
- `LEI_ORGANICA_1765_2026.report.md` (0)
- `LEI_ORGANICA_260_2026.report.md` (0)
- `LEI_ORGANICA_551_2026.report.md` (0)
- `MOC_016_2026.report.md` (0)
- `OUTROS_005_2026.report.md` (0)
- `OUTROS_011_2026.report.md` (0)
- `REQ_022_2026.report.md` (0)
- `REQ_029_2026.report.md` (0)
- `REQ_030_2026__2026_2026_03_31.report.md` (0, variante duplicada)
- `DIARIO_014_2020_ETA_BF968BF42B52.report.md` (variante `_ETA_`)
- `DIARIO_014_2020_ETA_CDFD2BE4353F.report.md` (variante `_ETA_`)
- `DIARIO_101_2000_ETA_C80CC731C504.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_28E913D46AC2.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_6D14111E7ECE.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_C45285B93811.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_D3A3232BCB2F.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_D860D510A735.report.md` (variante `_ETA_`)
- `OUTROS_101_2000_ETA_F862FDCCD486.report.md` (variante `_ETA_`)

## Arquivos `usar_com_ressalvas` (conteúdo curto)
Motivo principal: texto extraído insuficiente (`tamanho_chars < 500`), útil para rastreabilidade mas fraco para análise automática.

- `CONTAS_009_2026.report.md` (234)
- `CONTAS_013_2026.report.md` (450)
- `CONTAS_016_2026.report.md` (199)
- `CONTAS_021_2026.report.md` (234)
- `CONTAS_025_2026.report.md` (450)
- `IND_013_2026.report.md` (4)
- `IND_014_2026.report.md` (2)
- `IND_019_2026.report.md` (1)
- `IND_026_2026.report.md` (2)
- `IND_060_2026.report.md` (2)
- `IND_061_2026.report.md` (1)
- `IND_063_2026.report.md` (51)
- `IND_066_2026.report.md` (1)
- `OUTROS_001_2026.report.md` (10)
- `OUTROS_008_2026.report.md` (499)
- `OUTROS_017_2026.report.md` (280)
- `OUTROS_021_2026.report.md` (6)
- `OUTROS_027_2026.report.md` (280)
- `OUTROS_029_2026.report.md` (10)
- `OUTROS_031_2026.report.md` (10)
- `OUTROS_032_2026.report.md` (1)
- `OUTROS_033_2026.report.md` (499)
- `OUTROS_035_2026.report.md` (209)
- `PLC_003_2026.report.md` (3)
- `PLO_004_2026.report.md` (1)
- `PLO_023_2026.report.md` (4)
- `PLO_024_2026.report.md` (4)
- `PLO_025_2026.report.md` (2)
- `REQ_004_2026.report.md` (2)
- `REQ_013_2026.report.md` (1)
- `REQ_018_2026.report.md` (2)
- `REQ_019_2026.report.md` (1)
- `REQ_021_2026.report.md` (1)
- `REQ_023_2026.report.md` (2)
- `REQ_030_2026.report.md` (2)

## O que podemos usar no produto
- Pode usar:
  - os 298 arquivos classificados como `usar` para indexação, busca semântica, timeline documental e painéis de rastreabilidade.
- Pode usar com filtro:
  - os 35 arquivos `usar_com_ressalvas` para trilha de auditoria e navegação, mas sem confiar no resumo/extração para decisão automática.
- Não usar:
  - os 24 arquivos `nao_usar` em fluxos analíticos e métricas.

## Recomendação operacional
- Etapa 1:
  - excluir de indexação analítica os 24 `nao_usar`.
- Etapa 2:
  - manter os 35 `usar_com_ressalvas` apenas em camada de referência.
- Etapa 3:
  - para os 50 arquivos com `<500 chars`, reprocessar OCR/extrator e substituir o relatório.
- Etapa 4:
  - promover `status` para algo além de `PENDING_REVIEW` após validação humana mínima.
