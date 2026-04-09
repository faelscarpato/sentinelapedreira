# Diagnóstico Técnico Atual — Sentinela Pedreira

## 1) Mapa de Estrutura de Pastas

```txt
sentinelapedreira-main/
  data/
  public/
    Documentos camara munucipal 2026/
    icons/
  src/
    app/
      components/
      data/
        generated/
        sources/
      guards/
      lib/
      pages/
      providers/
      services/
      routes.tsx
      Root.tsx
      App.tsx
    features/
      auth/
      assistant/
      complaints/
      documents/
      rastreabilidade/
    lib/
      supabase/
      rastreabilidadeTypes.ts
    styles/
  supabase/
    migrations/
    functions/
```

## 2) Stack Detectada

- Frontend: React 18 + TypeScript + Vite 6
- Roteamento: `react-router`
- UI: Tailwind + componentes utilitários (`src/app/components/ui`)
- Markdown: `react-markdown` + `remark-gfm`
- PDF preview: `pdfjs-dist`
- PWA: `vite-plugin-pwa`
- Estado anterior: dados estáticos em `src/app/data/*` + `public/*`

## 3) Páginas Existentes

- Públicas: `Home`, `DiarioOficial`, `CamaraLegislativa`, `ContasPublicas`, `ControleExterno`, `Repasses`, `TerceiroSetor`, `Relatorios`, `RelatorioDetalhes`, `DocumentosFaltantes`, `Denuncia`, `AssistenteJuridico`
- Interna: `Rastreabilidade`
- Novas (refactor): `Entrar`, `MinhaConta`, `PainelEditorial`

## 4) Componentes Relevantes

- Estrutura: `Header`, `Footer`, `DocumentCard`, `PdfModal`, `AssistantChatWidget`
- UI base: coleção `src/app/components/ui/*`

## 5) Serviços/Integrações Existentes (antes)

- IA no cliente (risco crítico):
  - `src/lib/groqService.ts` (removido)
  - `src/lib/nemotronService.ts` (removido)
- Persistência local temporária:
  - `sessionStorage` em `rastreabilidadeStore` (agora só legado)

## 6) Integrações Externas

- Portais públicos (URLs em JSONs gerados)
- APIs de IA externas (antes diretas do browser; agora migradas para Edge Functions)

## 7) Dados Mockados/Estáticos

- Muito acoplamento em:
  - `src/app/data/generated/fiscalizaData.ts` (~2.49MB)
  - `src/app/data/generated/pipelineReports.ts` (~1.18MB)
  - `src/app/data/realData.ts` (agregação central monolítica)
- Pasta pública com muitos relatórios markdown locais

## 8) Arquivos Gigantes / Acoplamentos Perigosos

- `fiscalizaData.ts` e `pipelineReports.ts` aumentam bundle e tempo de parsing
- `realData.ts` concentra regras de negócio + normalização + roteamento + filtros
- Busca no header dependia de dataset local completo

## 9) Pontos onde o Frontend fazia papel de Backend

- Geração de protocolo de denúncia no browser
- IA (chat e rastreabilidade) com chamadas diretas aos providers no cliente
- Histórico de rastreabilidade sem persistência oficial (sessionStorage)
- Busca e indexação inteiramente client-side

## 10) Riscos Identificados

### Segurança

- Exposição potencial de chaves de IA via `VITE_*` (corrigido na refatoração)
- Ausência de Auth + RLS para dados sensíveis
- Denúncia sem trilha auditável persistida

### UX

- Estado inconsistente entre sessões (dados locais efêmeros)
- Busca degradada com volume de dados grandes
- Falta de área autenticada para acompanhamento do cidadão

### Escalabilidade

- Bundle JS muito grande por dados embutidos
- Sem backend transacional para workflow editorial e denúncias

### Manutenção

- Alta concentração em arquivos monolíticos
- Baixa separação entre domínio/aplicação/apresentação

## 11) Classificação de Ação por Arquivo/Módulo

### Manter

- `src/app/components/ui/*`
- `src/app/components/PdfModal.tsx`, `DocumentCard.tsx`, `Footer.tsx` (com ajustes pontuais)
- Estrutura base de rotas e layout (`Root.tsx`, `App.tsx`)

### Refatorar

- `src/app/components/Header.tsx` (busca server-side + auth)
- `src/app/components/AssistantChatWidget.tsx` (Edge Function)
- `src/app/pages/Denuncia.tsx` (persistência real)
- `src/app/pages/Rastreabilidade.tsx` (Edge Function + histórico persistido)
- `src/app/routes.tsx` (guards e áreas autenticadas)

### Remover

- `src/lib/groqService.ts`
- `src/lib/nemotronService.ts`

### Substituir

- IA cliente -> `supabase/functions/*`
- busca local crítica -> RPC `search_public_documents`
- protocolo local -> trigger SQL + tabela `complaints`

### Rewrite Parcial

- Fluxo de autenticação e autorização no frontend
- fluxo de denúncias com anexos e timeline
- busca do header e navegação autenticada

### Rewrite Total

- Camada de backend inexistente: modelagem SQL, RLS, buckets e Edge Functions
