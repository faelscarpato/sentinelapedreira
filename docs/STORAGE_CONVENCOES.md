# Storage — Buckets e Convenções

## Buckets

## 1) `public-documents`

- Uso: PDFs e arquivos públicos publicados
- Visibilidade: pública (leitura)
- Escrita: editor/admin
- Convenção de path: `documents/{document_id}/{yyyy}/{mm}/{arquivo}`

## 2) `complaint-attachments`

- Uso: anexos de denúncia
- Visibilidade: privada
- Leitura: dono da denúncia + papéis privilegiados
- Escrita: dono autenticado + papéis privilegiados
- Convenção de path: `{complaint_id}/{user_id}/{timestamp}-{arquivo}`

## 3) `editorial-assets`

- Uso: artefatos internos de revisão/publicação
- Visibilidade: privada
- Leitura/escrita: editor/reviewer/admin/auditor (leitura)
- Convenção de path: `editorial/{entity}/{entity_id}/{arquivo}`

## 4) `exports`

- Uso: exportações de relatórios e datasets
- Visibilidade: privada
- Leitura/escrita: dono do path + editor/admin
- Convenção de path: `{user_id}/{yyyy}/{mm}/{arquivo}`

## 5) `temp-processing`

- Uso: arquivos transitórios de processamento (chunking, import)
- Visibilidade: privada
- Leitura/escrita: editor/reviewer/admin/service
- Convenção de path: `{job_id}/{arquivo}` ou `{user_id}/{job_id}/{arquivo}`

## Regras obrigatórias

- Não armazenar segredo em arquivo de bucket
- Evitar nomes sem contexto (sempre incluir id e timestamp)
- Limitar tipo MIME e tamanho por bucket
- Excluir artefatos temporários periodicamente (`temp-processing`)
