# Auditoria de `data/reports`

Data da auditoria: 09/04/2026

## 1. Inventário

- Total de arquivos `.report.md`: **357**
- Distribuição por domínio:
  - `ATA`: 14
  - `CONTAS`: 30
  - `DECRETO`: 4
  - `DIARIO`: 72
  - `IND`: 67
  - `LEI`: 4
  - `MOC`: 47
  - `OUTROS`: 43
  - `PLC`: 3
  - `PLO`: 37
  - `REPASSE`: 1
  - `REQ`: 31
  - `TERCEIRO`: 4

## 2. Qualidade Estrutural

- Arquivos com seção técnica `## Metadados`: **357/357**
- Arquivos sem seção técnica: **0**
- Variações duplicadas com sufixo `_ETA_`: **9**
- Arquivos muito curtos (`< 1400 bytes`): **26**

Conclusão técnica: o conjunto é rico para bootstrap de conteúdo, mas **não está pronto para consumo direto** em todas as telas sem normalização/sanitização.

## 3. O que podemos usar agora

- `IND`, `MOC` e `DIARIO`:
  - Usáveis como fonte primária para gerar relatórios públicos.
  - Exigem sanitização (remoção de bloco técnico) para páginas que bloqueiam metadados.
- `PLO`, `REQ`, `ATA`, `PLC`, `CONTAS`, `OUTROS`:
  - Usáveis para trilha editorial interna e expansão futura de relatórios.
  - Recomendado revisão humana para arquivos curtos ou com OCR degradado.

## 4. O que NÃO usar diretamente (sem tratamento)

- Qualquer arquivo bruto de `data/reports` em rotas que exigem markdown editorial limpo (por conter `## Metadados` e chaves técnicas).
- Variantes `_ETA_` quando existir versão base equivalente (geram duplicidade sem ganho editorial).
- Arquivos curtos/sintéticos como fonte única para parecer final (risco de baixa completude textual).

## 5. Ações implementadas nesta etapa

- Geração incremental de relatórios públicos sanitizados para:
  - `IND` (completado)
  - `MOC` (completado)
  - `DIARIO OFICIAL` (conjunto inicial gerado a partir dos arquivos disponíveis)
- Preservação dos relatórios já existentes (sem sobrescrita dos arquivos antigos).

## 6. Recomendações para próxima rodada

1. Criar score de qualidade por relatório (OCR, tamanho, presença de base legal, presença de valores).
2. Excluir ou versionar formalmente variantes `_ETA_` para reduzir ambiguidade.
3. Marcar arquivos curtos como `confidence = preliminary` com revisão obrigatória.
4. Padronizar pipeline para exportar dois formatos:
   - `raw` (técnico/auditoria)
   - `public` (editorial/sanitizado)
