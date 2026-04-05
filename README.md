# Agent.md

## Reconhecimento do projeto

### Stack e execução
- Frontend em React + TypeScript + Vite.
- Roteamento com `react-router` (`src/app/routes.tsx`).
- Estilo com Tailwind/CSS utilitário.
- Markdown renderizado com `react-markdown` + `remark-gfm`.

### Estrutura principal
- `src/app/pages`: páginas da aplicação (home, câmara, relatórios, etc.).
- `src/app/components`: componentes reutilizáveis (`DocumentCard`, `PdfModal`, paginação).
- `src/app/data/realData.ts`: camada central de agregação e normalização dos dados exibidos.
- `src/app/data/generated/*`: dados gerados (`fiscalizaData`, `pipelineReports`).
- `public/`: ativos estáticos, incluindo documentos e relatórios `.md`.

### Fluxo atual de documentos e análises
- A lista de documentos exibida na UI é montada em `realData.ts`.
- A página da Câmara usa `camaraDocuments` e renderiza cards via `DocumentCard`.
- O botão `VER ANÁLISE` depende de `document.hasAnalysis` + `document.analysisUrl`.
- A página `RelatorioDetalhes.tsx` já converte Markdown para HTML (via `ReactMarkdown`), mas com conteúdo vindo da base de relatórios gerados.

## Mapeamento da Câmara Municipal 2026 (public)

Pasta-base identificada:
- `public/Documentos camara munucipal 2026`

Subpastas com `analises/*.md` detectadas:
- `CCJR`, `COFC`, `CPMAUOPS`, `CSECLT`, `IND`, `PLC`, `PLO`, `PR`, `R`, `RQ`.

Situação observada:
- Existem diversos arquivos `.md` prontos para análise legislativa.
- Nem todos os tipos documentais da Câmara têm análise local em `.md` (ex.: `MOC` sem `.md` no estado atual).

## Pontos de extensão implementados

1. Novo utilitário para análise local da Câmara:
- Arquivo: `src/app/lib/camaraAnalysis.ts`
- Responsável por:
  - inferir `tipo/numero/ano` do documento;
  - montar slug/rota da análise;
  - montar caminho do `.md` em `public`;
  - validar se o tipo/faixa possui análise local prevista.

2. Integração na página da Câmara:
- Arquivo: `src/app/pages/CamaraLegislativa.tsx`
- Ajuste: resolução de URL de análise prioriza o relatório local em `.md` quando houver correspondência.
- Fallback preservado: quando não houver `.md` correspondente, mantém a `analysisUrl` já existente.

3. Nova página de visualização da análise local:
- Arquivo: `src/app/pages/CamaraAnaliseDetalhes.tsx`
- Função:
  - carrega `.md` da pasta pública;
  - converte Markdown para HTML estruturado (`ReactMarkdown + GFM`);
  - exibe estados de loading/erro de forma explícita.

4. Nova rota:
- Arquivo: `src/app/routes.tsx`
- Rota adicionada: `/camara/analises/:slug`

## Observações operacionais
- O nome da pasta pública foi mantido exatamente como existente no projeto:
  - `Documentos camara munucipal 2026` (grafia atual no filesystem).
- Para novos lotes de análise local, manter o padrão:
  - `<TIPO>_<NNN>_<ANO>.report.md`
  - dentro de `public/Documentos camara munucipal 2026/<TIPO>/analises/`
