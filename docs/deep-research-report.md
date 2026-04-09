# Auditoria técnica e plano de evolução do Sentinela Pedreira V2 com Supabase

## Resumo executivo e entendimento do projeto

**1. RESUMO EXECUTIVO**

O Sentinela Pedreira (V2, conforme ZIP enviado) já evoluiu de um “frontend demonstrativo” para um **produto com fundação real de backend**: há schema de banco (Postgres), políticas de Row Level Security (RLS), buckets de Storage e um conjunto inicial de Edge Functions para IA, sincronização do Diário Oficial e automação. Essa direção está alinhada com o que a plataforma **Supabase** incentiva: usar Postgres+RLS para autorização granular e Edge Functions para integrações/segredos, mantendo o frontend com a `anon key` e políticas bem definidas. citeturn6search3turn6search12turn6search2

O gargalo principal deixou de ser “falta de stack” e passou a ser **maturidade operacional e completude do domínio**: parte do site ainda depende de datasets locais grandes (dados gerados) e alguns fluxos críticos para produção (especialmente invocação pública de Edge Functions sem JWT, rate limiting, anti-abuso e observabilidade) ainda não estão fechados. citeturn14search0turn8search4

---

**2. ENTENDIMENTO DO PROJETO**

### Objetivo principal (inferido com base no repositório + fontes oficiais)
Construir uma plataforma cívica para o município de entity["city","Pedreira","sao paulo, brazil"] focada em:

- **Transparência ativa** (Diário Oficial, contas públicas, repasses, terceiro setor, controle externo).
- **Curadoria e leitura assistida** de documentos com IA, com rastreabilidade e citações.
- **Canal de denúncia / manifestação** com protocolo e acompanhamento (semelhante à lógica de ouvidoria).
- **Camada editorial** para revisar/publicar análises e scorecards.

Essa proposta conversa diretamente com o cenário de transparência pública no Brasil (LRF/LC 101 e LC 131; LAI; pressão por dados “em tempo real”) e com práticas de portais de controle (por exemplo, TCE-SP expõe APIs para receitas/despesas e lista de municípios). citeturn4search0turn4search3turn4search8turn10view0

### Perfil de usuários (personas operacionais)
- **Cidadão/munícipe**: busca documentos, entende gastos, usa assistente, acompanha temas, envia denúncia.
- **Editor**: importa documentos, rascunha análises, organiza acervo.
- **Revisor**: aprova/rejeita/publica análises, controla qualidade e risco.
- **Admin**: define papéis, configura fontes, governa RLS/segurança/parametrização.
- **Auditor**: consulta trilhas, logs e evidências.

Esse modelo se justifica por dois fatos do ecossistema local:
- O portal de entity["organization","Prefeitura Municipal de Pedreira","pedreira, sp, brazil"] expõe serviços externos que já segmentam casos de uso (e-SIC, eOuve, “Consulta de Protocolos”, etc.), indicando que “cidadão vs operação interna” é uma separação real. citeturn11view0
- O próprio Supabase orienta o uso de autorização granular por RLS e, quando necessário, apoio de funções `security definer` fora de esquemas expostos. citeturn6search3

### Fluxos principais (estado atual)
- **Navegação pública** por seções (Diário Oficial; Câmara; Contas Públicas; etc.)
- **Busca** (híbrida: RPC server-side quando Supabase está configurado; fallback local quando não está).
- **Assistente jurídico** (invoca Edge Function; fornece resposta e lista de citações).
- **Denúncia** (formulário → persistência em banco → protocolo → anexos → timeline).
- **Rastreabilidade financeira** (área restrita por papéis → IA → grava análise em banco).
- **Painel editorial** (área interna para fluxo de análises e publicação; base já prevista em schema).

### Fontes e integrações externas relevantes já mapeadas
- Diário Oficial municipal: página lista edições e links de download (os arquivos saem, na prática, via `ecrie.com.br`). citeturn11view0
- Serviços do município (links no próprio portal): e-SIC, eOuve, consulta de protocolos e sistemas fiscais internos aparecem como integrações/links potenciais (não necessariamente integráveis por API). citeturn11view0
- Controle externo/SP: entity["organization","Tribunal de Contas do Estado de São Paulo","tce-sp, brazil"] mantém o Portal da Transparência Municipal com **API pública** (despesas, receitas, municípios) — oportunidade grande para ingestão via API em vez de scraping. citeturn10view0
- Transparência nacional: entity["organization","Atricon","brazil courts of accounts"] mantém o Radar Nacional do PNTP para comparação de conformidade/nível de transparência. citeturn13search0turn13search2

### Matriz de entendimento (fase 1)

| Área | O que existe hoje | Problemas percebidos | Impacto |
|---|---|---|---|
| Produto (macro) | Seções de transparência + IA + denúncia + editorial | Parte do produto ainda “híbrido” (banco + dataset local); risco de divergência | Confiança e consistência do usuário |
| Dados | Postgres + RLS + Storage + RPCs + seeds (no repo), ingestão parcial | Pipeline completo de ingestão e atualização ainda não cobre todos os domínios | Escala do acervo e atualidade |
| Diário Oficial | Fonte oficial listada e acessível; sync function existe | Automação pública pode falhar se Edge Function exigir JWT; scraping exige tolerância a mudanças HTML | Atualização diária, confiabilidade |
| Contas públicas / despesas | Há dataset local e sinais de coleta; existe fonte TCE com API | Integração por API ainda não implementada como pipeline oficial versionado | Valor do produto aumenta muito se automatizar |
| Auth/RBAC | Auth no frontend + papéis (seed) + guards | Endurecimento (MFA, auditoria, revisão de políticas) e testes e2e de autorização | Segurança e governança |
| IA | Gateway e funções específicas; segredos fora do browser | Falta rate limit/anti-abuso e políticas por fluxo sensível | Custo e risco de abuso (API4/API6) citeturn8search4 |
| Infra/Deploy | Estrutura para build estático (dist) e possível Pages | CI/CD e observabilidade ainda não formalizadas; ambientes não explicitados | Velocidade de entrega e confiabilidade |
| Acessibilidade | UI moderna; há preocupação com A11y no contexto local | Precisa de checklist WCAG/eMAG aplicado de forma sistemática e testada | Inclusão, conformidade e UX citeturn5search0turn5search4 |

### INFORMAÇÕES NECESSÁRIAS AINDA NÃO FORNECIDAS
- Volume esperado de documentos (Diário Oficial + anexos + PDFs de contas/contratos), e projeção em 6–12 meses (impacta custo de Storage/índices/vetores).
- Regras de negócio “oficiais”: o que será considerado “publicado”, “confiável” e “auditável” (critério editorial) e quando a IA pode atuar sem revisão humana.
- Política de privacidade/termos do Sentinela (especialmente por conter denúncia e dados pessoais; LGPD) e o nível de anonimato permitido. citeturn4search7
- Quem operará papéis internos (quantas pessoas, capacidade, SLA de triagem/revisão).
- Onde será hospedado o frontend (ex.: Pages) e estratégia de ambiente (dev/staging/prod).
- Estratégia de conformidade com acessibilidade (eMAG/WCAG): escopo mínimo e auditoria interna. citeturn5search4turn5search0

## Arquitetura atual

**3. ARQUITETURA ATUAL**

### Visão de alto nível (como está no repositório, em termos práticos)

- **Frontend**: SPA React/TypeScript/Vite com UI modularizada e componentes estilo shadcn/radix.
- **Backend** (no Supabase):
  - Postgres com extensões (`pg_trgm` + `vector`) para busca e embeddings (estrutura compatível com o guia do pgvector na documentação). citeturn6search0
  - RLS habilitado para tabelas; policies por papel e por dono de registro (alinhado às recomendações da própria Supabase de “RLS em tudo no schema exposto”). citeturn6search3turn6search15
  - Storage com buckets e limites de tamanho/mime types (padrão de segregação por finalidade).
  - Edge Functions para IA, sync, embeddings, notificações e webhooks.

### Fontes “de verdade” para o Sentinela (o que o sistema deve tratar como ground truth)

O próprio portal municipal já explicita:
- Diário Oficial com edições e download; há paginação extensa e links de arquivo externos (ecrie). citeturn11view0
- Links de serviços oficiais (e-SIC, eOuve, protocolos, ISS/ITBI/SIA e outros). citeturn11view0

O ecossistema de controle oferece APIs reutilizáveis:
- O Portal da Transparência Municipal do TCE-SP expõe API para despesas e receitas e endpoint de municípios, com estrutura de campos e exemplos. citeturn10view0

### Arquitetura proposta de referência para deploy do frontend em Pages
Se o frontend for hospedado em infraestrutura estática de entity["company","Cloudflare","internet infrastructure company"]:
- Em Pages, a recomendação típica para React é build `npm run build` e diretório `dist`, e o sistema entrega um subdomínio `*.pages.dev`. citeturn9search6turn9search1
- Para SPA, Pages faz fallback de rotas para `/` por padrão (evita 404 em rotas internas do React Router). citeturn9search10

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["Supabase Postgres RLS architecture diagram","Supabase Edge Functions architecture diagram","Cloudflare Pages React Vite deployment diagram","PostgreSQL pgvector index diagram"],"num_per_query":1}

## Diagnóstico técnico

**4. DIAGNÓSTICO TÉCNICO**

### Backend e dados

- **Autorização e exposição de dados**: a estratégia correta em Supabase é permitir `anon key` no cliente **somente** com RLS bem configurado, e jamais expor a `service_role` (ela bypassa RLS). citeturn6search12turn6search2  
  Diagnóstico: a base no repo segue a direção certa, mas a arquitetura precisa de “cerca elétrica” de processo: teste automatizado de RLS, revisão de policies e uma regra de governança para qualquer nova tabela/coluna.

- **Uso de `security definer`**: Supabase alerta que funções `security definer` são poderosas e exigem cuidado; em especial, recomenda não criá-las em schema exposto (“Exposed schemas”). citeturn6search3turn6search8  
  Diagnóstico: qualquer função de papéis/admin/auditoria deveria migrar para um schema “privado” (ex.: `private`), reduzindo superfície do Data API.

- **Busca**: o uso de tsvector + `websearch_to_tsquery` e `pg_trgm` é um caminho sólido para “busca por palavras” e ranking. Esse desenho é compatível com o que o mercado faz em portais com grande volumetria: primeiro full-text search, depois (opcionalmente) semântica híbrida. citeturn6search14

- **Vetores/embeddings**: a documentação da Supabase incentiva `pgvector` e descreve o uso de dimensões compatíveis com modelos de embedding e indexação. citeturn6search0turn6search5  
  Diagnóstico: o pipeline de embeddings existe, mas falta governança de custos e critérios de quando “embedar” (apenas publicado? apenas documentos acima de um limiar?).

### Edge Functions

- **JWT por padrão**: por padrão, Edge Functions exigem JWT válido no header Authorization; isso é explicitado pela documentação de configuração. citeturn14search0turn14search4  
  Diagnóstico crítico: funções pensadas para automação externa (ex.: sync via segredo) precisam de `supabase/config.toml` com `verify_jwt = false` nessas funções, ou o mecanismo atual não sustentará chamadas sem token.

- **Segredos**: Supabase define secrets padrão e reforça que `SUPABASE_SERVICE_ROLE_KEY` é permitido em Edge Functions e proibido no browser. citeturn6search2turn6search12  
  Diagnóstico: direction correta. Falta agora padronizar “contratos” por função (versão de payload, idempotência, rate limit).

### Frontend, UX, UI e acessibilidade

- **Proteção de segredos**: Vite deixa claro que variáveis prefixadas com `VITE_` são expostas ao bundle cliente; segredos não devem estar ali. citeturn7search0  
  Diagnóstico: o repos já sinaliza essa preocupação; precisa consolidar “zero segredo em cliente” como rule de CI.

- **Acessibilidade como requisito real**: o portal municipal declara aderência a WCAG e eMAG e uso de VLibras. citeturn12view0  
  O eMAG é um modelo oficial do governo brasileiro (com histórico e institucionalização por Portaria nº 3/2007). citeturn5search4turn5search47  
  WCAG 2.2 é recomendação formal do entity["organization","W3C","web standards consortium"] e adiciona critérios relevantes para mobile, foco, autenticação acessível e formulários. citeturn5search0turn5search10  
  Diagnóstico: para “denúncia” e “busca”, A11y não pode ser “nice-to-have”; precisa de checklists e testes.

### Infra, deploy e observabilidade

- **Deploy**: Cloudflare Pages provê deploy contínuo e preview deployments; bom para ciclo editorial e releases graduais. citeturn9search14turn9search6  
- **Observabilidade**: Supabase fornece logs de invocações; mas o produto precisa de correlação por `requestId`, dashboards e alarmes internos. citeturn6search1

### Diagnóstico por módulos (fase 2, por domínio)

A seguir, “módulos” no sentido de seções/fluxos do produto (não apenas pastas).

**Diário Oficial**
- O que faz: lista e permite navegar edições, com busca por data/edição; base para rastreabilidade e citações.
- Dependências: fonte oficial do portal municipal (edições e PDFs). citeturn11view0
- Fragilidades: scraping HTML é frágil a mudanças; ideal ter fallback e cache; risco de bloqueio por tráfego.
- Dívida técnica: padronizar ingestão incremental + idempotência.
- Escalabilidade: alto volume de PDFs; precisa política de storage/caching.
- Segurança: função pública precisa anti-abuso e rate limit (API4/API6). citeturn8search4
- UX: filtros por ano/edição ok; faltam “coleções”, alertas, assinatura e “novo desde X”.

**Denúncia**
- O que faz: cria registro com protocolo, anexos e timeline; parte mais sensível do produto.
- Dependências: LGPD + necessidade de proteção de dados pessoais. citeturn4search7
- Fragilidades: risco de spam/abuso e envio de malware em anexos; necessidade de validação de tipo, antivírus (futuro), limites e moderação.
- Segurança: fluxo sensível (API6); precisa rate limit, CAPTCHA/Turnstile e revisão. citeturn8search4
- UX: deve suportar anonimato real e “seguimento” via protocolo sem expor dados.

**Assistente jurídico**
- O que faz: responde com base em documentos publicados; ideal com citações e trilha.
- Dependências: dataset publicado + busca; uso de Edge Functions e secrets. citeturn6search2turn6search14
- Fragilidades: alucinação/erro; precisa “citações obrigatórias”, aviso de limitação e revisão humana para saídas críticas.
- Segurança/custo: endpoint público de IA é alvo de abuso (API4) e precisa rate limit. citeturn8search4

**Rastreabilidade financeira**
- O que faz: gera análises estruturadas, salvando resultados e recomendações; área restrita.
- Dependências: papéis editor/reviewer/admin; integração robusta com fontes financeiras.
- Fragilidades: risco reputacional se score/risco errar; exige “metodologia e fontes”.
- Escalabilidade: custo de LLM; demanda batch/offline para grandes análises.

**Painel editorial**
- O que faz: gerir versões, revisões e status de publicação.
- Dependências: governança e papéis; trilha de auditoria.
- Fragilidades: sem critérios de aceite editoriais e SLA, vira fila caótica.

**Câmara, Contas Públicas, Controle Externo, Repasses, Terceiro Setor, Relatórios**
- Estado atual: parte ainda depende de datasets locais/gerados (transição).
- Oportunidade: migrar para pipelines alimentados por API e/ou crawling governado.
- Fontes importantes do mercado:
  - API do Portal de Transparência Municipal TCE-SP para despesas/receitas. citeturn10view0
  - Contexto do AUDESP como iniciativa de coleta e disponibilização de dados de fiscalização. citeturn3search1
  - Mudanças recentes e obrigações (ex.: Fase IV do AUDESP para municípios com datas e documentos obrigatórios; e Fase V para repasses do terceiro setor). citeturn3search14turn3search18

## Problemas críticos

**5. PROBLEMAS CRÍTICOS**

### TOP 10 PROBLEMAS MAIS CRÍTICOS (fase 2)

| Problema | Severidade | Impacto | Esforço para corrigir | Prioridade |
|---|---|---|---|---|
| Edge Functions exigem JWT por padrão; automações “por segredo” podem falhar sem `verify_jwt=false` por função | Crítica | Funcionalidades-chave (sync/webhook) quebram em produção | Baixo–Médio | Crítica citeturn14search0turn14search4 |
| Falta de rate limiting e anti-abuso em endpoints públicos (IA/denúncia) | Crítica | Explode custo e abre DoS/abuso de fluxo sensível | Médio | Crítica citeturn8search4 |
| Estratégia híbrida (dataset local + Postgres) causa divergência de verdade/fonte | Alta | Perda de confiança e bugs de consistência | Médio | Alta |
| Scraping do Diário Oficial é frágil; mudança de HTML/anti-bot pode derrubar ingestão | Alta | Desatualização do produto | Médio | Alta citeturn11view0 |
| Funções `security definer` e superfícies no schema exposto exigem governança (risco de erro de permissões) | Alta | Vazamento/escala de privilégio | Médio | Alta citeturn6search3turn6search8 |
| Pipeline para TCE-SP ainda não aproveita API oficial (receitas/despesas/municípios) | Alta | Produto perde “atualidade automática” e confiabilidade | Médio | Alta citeturn10view0 |
| Observabilidade insuficiente (sem SLOs, alarmes, correlação de incidentes) | Alta | Incidentes passam despercebidos; debugging caro | Médio | Alta citeturn6search1 |
| Conteúdo gerado por IA pode introduzir XSS/markdown perigoso se renderizado sem sanitização rigorosa | Alta | Risco de segurança no cliente | Médio | Alta citeturn8search4 |
| Falta de CI/CD formal (migrations, políticas, functions, checks de segurança) | Média | Regressões e drift entre ambientes | Médio | Média |
| Acessibilidade não testada sistematicamente (WCAG/eMAG) em fluxos críticos (denúncia, login, busca) | Média | Barreiras reais de uso; risco de não conformidade | Médio | Média citeturn12view0turn5search4turn5search0 |

## Oportunidades de melhoria

**6. OPORTUNIDADES DE MELHORIA**

1) **Trocar scraping por API sempre que existir**. O Portal da Transparência Municipal do TCE-SP documenta endpoints; isso deve virar pipeline oficial com cache e normalização. citeturn10view0

2) **Transformar “conformidade” em feature**: usar o PNTP/Radar como referência de critérios de transparência, e criar scorecards internos de cumprimento por domínio (diário, receitas, despesas, contratos). citeturn13search0turn13search2

3) **Governança de dados e rastreabilidade**: publicar sempre com “fonte, data de captura, hash do arquivo, versão do parser” — especialmente em Diário Oficial (onde o arquivo vem de host externo). citeturn11view0

4) **Acessibilidade como default**: alinhar UI a eMAG + WCAG 2.2; especialmente critérios novos que afetam toque, foco, autenticação e formulários. citeturn5search4turn5search0

5) **Hardening de segurança** pelo recorte OWASP para APIs: BOLA/BFLA, consumo de recursos (rate limit), SSRF em webhooks, inventário de endpoints e versões. citeturn8search4turn8search0

## Novas funcionalidades

**7. NOVAS FUNCIONALIDADES (fase 4)**  
Abaixo seguem 15 entregas (5 pequenas, 5 médias, 5 estratégicas), todas justificadas por lacunas detectadas e benchmark de fontes oficiais.

### Melhorias pequenas

FUNCIONALIDADE: Sanitização robusta de Markdown e bloqueio de HTML perigoso

Objetivo: Garantir que conteúdo renderizado (inclusive gerado por IA) não execute scripts ou HTML malicioso.

Problema que resolve: Risco de XSS e injeção de conteúdo em respostas do assistente e análises editoriais.

Como deve funcionar: Toda renderização de markdown passa por pipeline de sanitização; tags/atributos perigosos são removidos; links externos recebem `rel="noopener noreferrer"`.

Fluxo do usuário: Usuário lê resposta/análise normalmente; nenhum comportamento muda, apenas segurança.

Requisitos técnicos: Sanitizer no frontend; validação de payload na Edge Function; testes básicos de XSS.

Banco de dados: Nenhuma mudança obrigatória.

APIs necessárias: Nenhuma.

Mudanças no frontend: Adicionar sanitização no componente que renderiza markdown.

Mudanças no backend: Opcional: validar/limitar markdown gerado antes de salvar.

Riscos: Quebra de formatação em casos raros.

Complexidade: baixa

Impacto esperado: Redução de risco crítico em conteúdo dinâmico.

Prioridade: alta



FUNCIONALIDADE: Página de detalhe de documento por `slug` com “fonte + data + download”

Objetivo: Transformar listagens em navegação consistente (SEO e UX) e permitir citações clicáveis.

Problema que resolve: Usuário encontra um documento na busca/lista, mas não tem um “hub” único com metadados e ações.

Como deve funcionar: Rota `/documentos/:slug` busca no Postgres pelo slug e mostra metadados, status, links, anexos e histórico.

Fluxo do usuário: Listagem → clicar no card → detalhe → abrir PDF / ver fontes → copiar link.

Requisitos técnicos: Query pelo slug, RLS para publicado, fallback 404.

Banco de dados: Garantir índice/unique em `slug` (já existe) e campos de fonte/URL.

APIs necessárias: `select` em `documents` + `document_files` ou RPC.

Mudanças no frontend: Nova página e ajuste de rotas/click nos cards.

Mudanças no backend: Opcional: RPC otimizada.

Riscos: Conflitos de slug legados.

Complexidade: baixa

Impacto esperado: Melhora grande de UX e rastreabilidade.

Prioridade: alta



FUNCIONALIDADE: Rate limit simples por IP/usuário nas Edge Functions públicas

Objetivo: Conter abuso e custo, especialmente em IA e denúncia.

Problema que resolve: OWASP destaca consumo irrestrito de recursos e acesso irrestrito a fluxos sensíveis como riscos relevantes em APIs. citeturn8search4

Como deve funcionar: Antes de processar, a função checa contadores por janela (ex.: 1 min/10 min) e bloqueia acima do limite.

Fluxo do usuário: Uso normal permanece; abuso recebe 429 com mensagem clara.

Requisitos técnicos: Tabela de rate-limit (ou KV/Cache), chave por IP (com cuidado) e/ou `auth.uid()`.

Banco de dados: Nova tabela `rate_limits` (se for via Postgres).

APIs necessárias: Inserção/consulta em rate-limit; logs.

Mudanças no frontend: Tratar erro 429 e exibir feedback.

Mudanças no backend: Middleware compartilhado nas funções públicas.

Riscos: Bloqueio indevido em NAT; precisa tolerância.

Complexidade: baixa

Impacto esperado: Reduz risco de custo e indisponibilidade.

Prioridade: crítica



FUNCIONALIDADE: “Assinar busca” (filtro salvo) em 1 clique

Objetivo: Converter navegação casual em retenção.

Problema que resolve: Usuário precisa refazer filtro/pesquisa sempre; perde contexto.

Como deve funcionar: Botão “Salvar filtro”; cria registro em `saved_filters` com tipo/página/parâmetros; aparece em “Minha conta”.

Fluxo do usuário: Filtra → salva → depois reabre em “Minha conta”.

Requisitos técnicos: Serialização segura dos filtros; validação.

Banco de dados: Usar `saved_filters` (já previsto).

APIs necessárias: CRUD em `saved_filters`.

Mudanças no frontend: Botão + lista em “Minha conta”.

Mudanças no backend: Nenhuma além das policies.

Riscos: Compatibilidade de versões de filtros.

Complexidade: baixa

Impacto esperado: Aumenta retorno e hábito.

Prioridade: média



FUNCIONALIDADE: Indicador de “origem oficial” em cards e detalhes

Objetivo: Aumentar confiança e reduzir ambiguidade.

Problema que resolve: Usuário não sabe se a fonte veio do portal oficial, do TCE, ou de upload manual.

Como deve funcionar: Badge “Fonte: Prefeitura / TCE-SP / Outro”, com data de captura e link.

Fluxo do usuário: Navega e entende origem.

Requisitos técnicos: Mapear `sources` e relacionar ao documento.

Banco de dados: Garantir `source_id` e metadados.

APIs necessárias: select join `documents` + `sources`.

Mudanças no frontend: Badge e layout.

Mudanças no backend: Nenhuma além de preencher `sources`.

Riscos: Metadado incompleto em migração.

Complexidade: baixa

Impacto esperado: Aumenta confiança e transparência interna.

Prioridade: alta



### Melhorias médias

FUNCIONALIDADE: Pipeline TCE-SP por API para receitas e despesas

Objetivo: Ingerir dados financeiros automaticamente com confiabilidade.

Problema que resolve: Hoje a integração tende a ser manual/por scraping; existe API documentada com estrutura e endpoints. citeturn10view0

Como deve funcionar: Job periódico (Edge Function + cron externo ou scheduler) baixa receitas/despesas por município/competência; normaliza; salva em tabelas próprias.

Fluxo do usuário: Usuário abre “Contas Públicas” e vê dados atualizados, com fonte e competência.

Requisitos técnicos: Client HTTP, cache, paginação se houver, normalização e deduplicação.

Banco de dados: Criar tabelas `tce_receitas`, `tce_despesas`, `tce_import_jobs` + índices.

APIs necessárias: GET receitas/despesas/municípios do TCE.

Mudanças no frontend: Nova visualização (tabelas + gráficos) alimentada por DB.

Mudanças no backend: Edge Function de ingestão + auditoria.

Riscos: Mudança de formato/limitação de período; tratar “2014–2019” conforme doc e planejar alternativas. citeturn10view0

Complexidade: média

Impacto esperado: Eleva o produto para “atualização automática” e valor público real.

Prioridade: crítica



FUNCIONALIDADE: Configuração `supabase/config.toml` por função (verify_jwt)

Objetivo: Tornar invocações públicas/automação compatíveis com o runtime padrão.

Problema que resolve: Por padrão Edge Functions exigem JWT; automações externas (sync/webhook) falham sem configuração. citeturn14search0turn14search4

Como deve funcionar: Criar `supabase/config.toml` e marcar funções específicas com `verify_jwt=false` (ex.: diario-oficial-sync, webhooks). Endpoints que exigem login continuam com JWT.

Fluxo do usuário: Invisível; aumenta confiabilidade.

Requisitos técnicos: Arquivo config + ajuste de deploy e review.

Banco de dados: Nenhuma.

APIs necessárias: Nenhuma.

Mudanças no frontend: Nenhuma.

Mudanças no backend: Config + documentação e testes.

Riscos: Expor função pública sem proteção adicional; precisa segredo + rate limit.

Complexidade: média

Impacto esperado: Evita falha estrutural em produção.

Prioridade: crítica



FUNCIONALIDADE: Workflow editorial completo com SLA e fila

Objetivo: Organizar análise, revisão, publicação e auditoria.

Problema que resolve: Sem fila e SLA, publica-se pouco, revisa-se mal e perde-se governança.

Como deve funcionar: Estados claros (draft → in_review → published/rejected); fila por prioridade; comentários e histórico; auditoria automática.

Fluxo do usuário: Editor cria → envia para revisão → revisor aprova/rejeita → publicado aparece ao público.

Requisitos técnicos: Policies por papel; triggers de histórico; UI no painel.

Banco de dados: Usar `analyses`, `analysis_versions`, `analysis_reviews`.

APIs necessárias: CRUD + ações de transição.

Mudanças no frontend: Páginas de fila, detalhe, revisão, diff.

Mudanças no backend: Regras de transição e auditoria.

Riscos: Complexidade de UX; precisa design de fluxo.

Complexidade: média

Impacto esperado: Produto ganha credibilidade e cadência editorial.

Prioridade: alta



FUNCIONALIDADE: Centro de notificações + entregas (in-app) com retry

Objetivo: Dar retorno para usuários (alertas, mudanças, publicações).

Problema que resolve: “Acompanhar tema” sem avisos perde valor.

Como deve funcionar: Notificações in-app com status e retry; futuras integrações por e-mail/webhook.

Fluxo do usuário: Usuário cria alerta → sistema entrega notificação ao ocorrer evento.

Requisitos técnicos: Worker/Edge Function para processar fila.

Banco de dados: `notifications`, `notification_deliveries` (já previstos).

APIs necessárias: Inserção e processamento.

Mudanças no frontend: Inbox + badges.

Mudanças no backend: Automação de deliveries; estratégia de backoff.

Riscos: Volume; precisa limites.

Complexidade: média

Impacto esperado: Retenção cresce.

Prioridade: média



FUNCIONALIDADE: “Coleções” públicas e curadoria temática

Objetivo: Facilitar descoberta e narrativa (ex.: “Ponto facultativo 2026”, “Licitações”, “Repasses”).

Problema que resolve: Sem curadoria, portais viram “arquivo morto”.

Como deve funcionar: Editor cria coleção com descrição e lista de documentos; público acessa coleção com timeline.

Fluxo do usuário: Home → coleção → documentos relacionados.

Requisitos técnicos: Tabela `collections` + `collection_items`.

Banco de dados: Novas tabelas com RLS (public read se publicada).

APIs necessárias: CRUD.

Mudanças no frontend: Página de coleção e cards.

Mudanças no backend: Policies e seed.

Riscos: Curadoria vira trabalho manual; mitigar com sugestões automáticas.

Complexidade: média

Impacto esperado: UX e engajamento aumentam.

Prioridade: alta



### Funcionalidades estratégicas de alto impacto

FUNCIONALIDADE: Scorecard de transparência alinhado ao PNTP (Radar)

Objetivo: Medir e exibir “quão transparente” o município está por critérios.

Problema que resolve: Transparência vira binária (“tem/não tem”); PNTP fornece lógica de avaliação e benchmarking nacional. citeturn13search0turn13search2

Como deve funcionar: Definir matriz de critérios (inspirada no PNTP), calcular percentual por domínio e exibir evolução mensal.

Fluxo do usuário: Painel “Transparência” → score → ver critérios cumpridos/faltantes.

Requisitos técnicos: Motor de regras, coleta de evidências, histórico.

Banco de dados: `transparency_scores`, `transparency_criteria`, `transparency_evidence`.

APIs necessárias: Jobs internos + ingestão de evidências.

Mudanças no frontend: Painel com gráficos e drill-down.

Mudanças no backend: Função de cálculo, agendamento, auditoria.

Riscos: Interpretar critérios errado; precisa validação e transparência metodológica.

Complexidade: alta

Impacto esperado: Diferencial forte, vira “produto” por si.

Prioridade: crítica



FUNCIONALIDADE: RAG híbrida (full-text + embeddings) com citações verificáveis

Objetivo: Melhorar qualidade das respostas do assistente com rastreabilidade.

Problema que resolve: IA sem fontes é frágil; a própria Supabase incentiva uso de pgvector e RAG. citeturn6search0turn6search14

Como deve funcionar: Recuperação híbrida: tsvector filtra candidatos + embedding ranqueia; resposta sempre devolve citações (slug + trecho + link).

Fluxo do usuário: Pergunta → recebe resposta + lista de “trechos citados”.

Requisitos técnicos: Chunking, embeddings, índices (HNSW/IVF), query híbrida.

Banco de dados: `document_chunks`, `embeddings`, `retrieval_logs` (já previstos) + índices recomendados.

APIs necessárias: Edge Function `legal-assistant` evolui para retrieval híbrido.

Mudanças no frontend: Exibir citações com preview do trecho.

Mudanças no backend: Indexação incremental, controle de custos.

Riscos: Custo; qualidade; necessidade de “não responder” se não há fonte.

Complexidade: alta

Impacto esperado: IA vira diferencial confiável.

Prioridade: crítica



FUNCIONALIDADE: Linha do tempo legislativa e financeiro-orçamentária com “eventos explicáveis”

Objetivo: Conectar Diário Oficial, atos, despesas/repasses e eventos em timeline compreensível.

Problema que resolve: Dados soltos não explicam “o que aconteceu”.

Como deve funcionar: Timeline unificada com eventos (publicação, empenho, pagamento, repasse, contrato) e explicações.

Fluxo do usuário: Tema → timeline → documentos e valores relacionados.

Requisitos técnicos: Normalização por “entidades” (fornecedor, órgão, programa) e eventos.

Banco de dados: `entity_registry`, `entity_events`, `document_relations`.

APIs necessárias: Importadores + regras de vinculação.

Mudanças no frontend: Página de timeline com filtros.

Mudanças no backend: Jobs de linking e dedupe.

Riscos: Vinculação errada gera desinformação; precisa revisão.

Complexidade: alta

Impacto esperado: Torna dados acionáveis.

Prioridade: alta



FUNCIONALIDADE: Canal de denúncia com triagem, anonimato forte e integração com protocolos

Objetivo: Transformar denúncia em fluxo institucional robusto.

Problema que resolve: Denúncia sem triagem e governança vira spam ou risco legal (LGPD). citeturn4search7

Como deve funcionar: Triagem (categoria, severidade, status), anonimato opcional forte, anexos verificados, trilha completa e prazos.

Fluxo do usuário: Denuncia → recebe protocolo → acompanha status sem expor identidade.

Requisitos técnicos: Criptografia de campos sensíveis; separação de identidade; RBAC forte; rate limit.

Banco de dados: Evoluir `complaints` para separar PII em tabela protegida (`complaint_private`).

APIs necessárias: Funções de triagem e auditoria.

Mudanças no frontend: Tela de acompanhamento por protocolo.

Mudanças no backend: Policies avançadas; logs e monitoramento.

Riscos: Responsabilidade institucional; precisa termos e governança.

Complexidade: alta

Impacto esperado: Alto valor social e de produto.

Prioridade: crítica



FUNCIONALIDADE: Auditoria e “prova de integridade” (hash de PDFs e cadeia de evidência)

Objetivo: Garantir que documentos/arquivos exibidos não foram alterados e são rastreáveis.

Problema que resolve: Desconfiança sobre autenticidade; necessidade de evidência em auditoria.

Como deve funcionar: Ao importar PDF, calcular hash (SHA-256) e salvar; exibir hash e metadata; registrar cadeia de auditoria.

Fluxo do usuário: No detalhe do documento, ver “integridade verificada” e hash.

Requisitos técnicos: Hashing em Edge Function no upload/import; logs.

Banco de dados: Coluna `file_hash`, `hash_algo`, `captured_at`.

APIs necessárias: Endpoint de import/upload.

Mudanças no frontend: Exibir hash e origem.

Mudanças no backend: Função de ingestão e validação.

Riscos: Performance em arquivos grandes; requer streaming.

Complexidade: alta

Impacto esperado: Diferencial de confiança e auditabilidade.

Prioridade: alta



## Roadmap e plano de implementação

**8. ROADMAP (fase 5)**

| Etapa | Ação | Objetivo | Responsável | Esforço | Dependências |
|---|---|---|---|---|---|
| Curto prazo (0–30 dias) | Criar `supabase/config.toml` e marcar funções públicas/automação com `verify_jwt=false` | Tornar sync/webhooks executáveis sem JWT | Backend/DevOps | M | Deploy de functions citeturn14search0turn14search4 |
| Curto prazo (0–30 dias) | Rate limit e anti-abuso (IA + denúncia) | Conter custo e DoS | Backend/Sec | M | Tabela/Cache + middleware citeturn8search4 |
| Curto prazo (0–30 dias) | Página de detalhe por slug + navegação consistente | Melhorar UX e rastreabilidade | Frontend | M | APIs/queries |
| Curto prazo (0–30 dias) | Sanitização de markdown | Mitigar XSS e conteúdo perigoso | Frontend/Sec | P | Biblioteca de sanitização |
| Médio prazo (30–90 dias) | Pipeline TCE-SP por API (despesas/receitas/municípios) | Atualização automática de contas | Backend/Data | G | API TCE citeturn10view0 |
| Médio prazo (30–90 dias) | Workflow editorial completo | Governança e qualidade de publicação | Produto+Eng | G | RBAC + UI |
| Médio prazo (30–90 dias) | Centro de notificações in-app | Retenção e acompanhamento | Full stack | M | Tabelas já existem |
| Longo prazo (90–180 dias) | RAG híbrida com citações verificáveis | IA confiável baseada em acervo | Full stack + IA | G | Embeddings + índices citeturn6search0turn6search14 |
| Longo prazo (90–180 dias) | Scorecard PNTP-like | Diferencial de valor e benchmark | Produto+Data | G | Matriz e evidências citeturn13search0 |
| Longo prazo (90–180 dias) | Linha do tempo unificada | Explicar eventos e vincular dados | Data+Frontend | G | Normalização de entidades |

## Plano de implementação

**9. PLANO DE IMPLEMENTAÇÃO**

IMPLEMENTAÇÃO: `supabase/config.toml` e `verify_jwt=false` por função  
1. O que deve ser feito: criar `supabase/config.toml`; definir `verify_jwt=false` para funções de automação (sync/webhooks) e manter `true` para funções internas. citeturn14search0turn14search4  
2. Arquivos/módulos impactados: `supabase/config.toml`; docs de deployment.  
3. Ordem correta: (a) criar config → (b) ajustar deploy local (`supabase functions serve`) → (c) deploy prod. citeturn14search3  
4. Possíveis riscos: expor endpoint sem JWT; mitigar com segredo + rate limit.  
5. Como testar: chamada sem Authorization deve chegar na função; chamadas com JWT inválido não devem bloquear rotas que não o exigem.  
6. Critérios de aceite: sync funciona via segredo sem login; funções internas continuam exigindo papéis.  
7. Métricas de sucesso: 0 falhas de auth em sync; logs consistentes por execução.

IMPLEMENTAÇÃO: Rate limit e anti-abuso em IA e denúncia  
1. O que deve ser feito: implementar middleware de rate limit; aplicar em endpoints públicos; retornar 429 e logar.  
2. Arquivos/módulos impactados: Edge Functions públicas; tabelas auxiliares.  
3. Ordem correta: definir limites → implementar middleware → ativar em produção → monitorar.  
4. Possíveis riscos: falso positivo em NAT; ajustar limites e usar `auth.uid()` quando disponível.  
5. Como testar: testes de carga; bursts simulados.  
6. Critérios de aceite: abuso bloqueado; uso normal sem fricção.  
7. Métricas de sucesso: queda de erros por consumo; custo de IA previsível (API4). citeturn8search4

IMPLEMENTAÇÃO: Detalhe por slug  
1. O que deve ser feito: criar rota e página; buscar doc + arquivos; exibir fonte, data e download.  
2. Arquivos/módulos impactados: rotas, componente de card, página nova.  
3. Ordem correta: API/query → UI → links a partir de listagem e busca.  
4. Possíveis riscos: slugs duplicados ou não migrados.  
5. Como testar: casos publicados/não publicados; 404; permissão.  
6. Critérios de aceite: qualquer documento publicado abre em detalhe com fonte e link.  
7. Métricas de sucesso: aumento de tempo de sessão e menor bounce em busca.

IMPLEMENTAÇÃO: Pipeline TCE-SP via API  
1. O que deve ser feito: implementar ingestão por competência; armazenar bruto+normalizado; auditar import. citeturn10view0  
2. Arquivos/módulos impactados: nova Edge Function, novas tabelas, UI de contas públicas.  
3. Ordem correta: municípios → receitas/despesas → normalização → UI.  
4. Possíveis riscos: limites de período (doc menciona exercícios 2014–2019); planejar estratégia complementar. citeturn10view0  
5. Como testar: comparar amostras com o portal; validar dedupe e consistência.  
6. Critérios de aceite: dados por mês aparecem com fonte e competência; import idempotente.  
7. Métricas de sucesso: cobertura de meses; latência de atualização.

IMPLEMENTAÇÃO: Workflow editorial  
1. O que deve ser feito: definir estados; UI de fila; revisão com comentários; publicação.  
2. Arquivos/módulos impactados: tabelas de análise; painel editorial; policies.  
3. Ordem correta: estados → policies → UI (fila → detalhe → revisão).  
4. Possíveis riscos: conflitos editoriais; precisa trilha e permissão clara.  
5. Como testar: suíte por papel (editor/reviewer/admin).  
6. Critérios de aceite: fluxo completo e auditável.  
7. Métricas de sucesso: tempo médio de revisão; taxa de publicação.

IMPLEMENTAÇÃO: RAG híbrida com citações  
1. O que deve ser feito: chunking + embeddings; índices; retrieval híbrido; respostas com citações. citeturn6search0turn6search5turn6search14  
2. Arquivos/módulos impactados: Edge Functions IA; tabelas chunks/embeddings/logs; frontend de citações.  
3. Ordem correta: ingestão → embeddings → índice → retrieval → UI.  
4. Possíveis riscos: custo; relevância; precisa “não responder” sem fonte.  
5. Como testar: conjunto de perguntas; medir “citações corretas” por amostra humana.  
6. Critérios de aceite: 100% das respostas exibem fontes ou recusam resposta.  
7. Métricas de sucesso: satisfação; redução de alucinações reportadas.

## Riscos e dependências

**10. RISCOS E DEPENDÊNCIAS**

- **Dependência de fontes externas**: Diário Oficial depende de portal e host de PDFs; mudanças quebram scraping. citeturn11view0
- **Dependência de APIs de terceiros**: integração com TCE exige estabilidade do endpoint e compliance com limites/formatos. citeturn10view0
- **Risco legal e reputacional**: denúncia envolve dados pessoais (LGPD) e precisa governança. citeturn4search7
- **Risco de custo**: IA e ingestão podem sofrer abuso; OWASP destaca consumo irrestrito e fluxos sensíveis. citeturn8search4
- **Risco de acessibilidade**: contexto local já assume WCAG/eMAG; o Sentinela deve manter padrão equivalente, especialmente em denúncia e autenticação. citeturn12view0turn5search4turn5search0

## Métricas de sucesso

**11. MÉTRICAS DE SUCESSO**

- Atualidade do Diário Oficial: tempo entre publicação no portal e indexação no Sentinela (SLO).
- Cobertura financeira: % de meses ingeridos por receitas/despesas (por fonte).
- Segurança/custo: custo por 1.000 chamadas de IA e taxa de bloqueio por rate limit.
- Governança: tempo médio de revisão editorial e % de análises publicadas com citações.
- Acessibilidade: checklist WCAG 2.2/eMAG concluído e auditado nos fluxos críticos. citeturn5search0turn5search4

## Próximos passos

**12. PRÓXIMOS PASSOS**

1) Fechar a lacuna estrutural de Edge Functions (JWT por padrão) com `config.toml` e `verify_jwt=false` onde necessário. citeturn14search0turn14search4  
2) Implementar rate limit/anti-abuso para IA e denúncia como requisito de produção. citeturn8search4  
3) Migrar Contas Públicas para ingestão via API do TCE-SP (primeiro grande salto de valor). citeturn10view0  
4) Consolidar “fonte e integridade” em todo documento exibido (origem, data, hash).  
5) Executar ciclo de acessibilidade eMAG/WCAG 2.2 focado em denúncia, busca, login e navegação. citeturn5search4turn5search0  

## Prompt definitivo para Codex CLI executar a evolução completa

**PROMPT MESTRE (cole exatamente no Codex CLI):**

```text
Você é um Principal Engineer (Full Stack + Security + DevOps) responsável por tornar o projeto “Sentinela Pedreira V2” pronto para produção com Supabase.

Contexto:
- O repositório já contém: frontend React+TS+Vite, supabase/migrations, supabase/functions e documentação em /docs.
- O produto é uma plataforma cívica com: Diário Oficial, Contas Públicas, Controle Externo, Repasses, Terceiro Setor, Assistente Jurídico (IA), Denúncia com protocolo e Painel Editorial.
- Fontes principais de dados: pedreira.sp.gov.br (Diário Oficial com PDFs via ecrie), e transparência.tce.sp.gov.br (APIs oficiais de despesas/receitas/municípios), além de referência de transparência PNTP (Atricon).

Objetivo:
Executar as ENTREGAS CRÍTICAS para produção e completar as migrações prioritárias.

Regras obrigatórias:
1) NUNCA expor SUPABASE_SERVICE_ROLE_KEY no frontend. Use apenas anon key + RLS.
2) VITE_* é público no bundle; jamais guardar segredos em VITE_*. (Vite expõe VITE_* no cliente.)
3) Edge Functions por padrão exigem JWT. Você deve criar e configurar supabase/config.toml para tornar funções de automação públicas via verify_jwt=false (ex.: diario-oficial-sync e webhooks), mantendo funções internas protegidas.
4) Implementar rate limiting / anti-abuso em endpoints públicos (IA e denúncia).
5) Garantir sanitização segura do conteúdo markdown exibido.
6) Criar CI mínimo (lint/typecheck/build + smoke de migrations + verificação de “no secrets in VITE_*”).
7) Preferir API oficial (TCE-SP) a scraping sempre que possível.
8) Usar RLS em todas as tabelas do schema público. Criar rotina/teste para impedir tabela sem RLS.
9) Acessibilidade: aplicar checklist WCAG 2.2 / eMAG aos fluxos críticos (denúncia, login, busca, header).

Tarefas (execute em ordem, criando commits pequenos e bem descritos):
A) Edge Functions e config
- Criar supabase/config.toml.
- Marcar verify_jwt=false para as funções que precisam aceitar requisições sem Authorization (diario-oficial-sync, webhooks e quaisquer automações).
- Garantir que funções internas continuem exigindo JWT e papel.
- Atualizar documentação de deploy e scripts.

B) Segurança de abuso/custo
- Implementar middleware compartilhado de rate limit (por IP e/ou auth.uid quando existir).
- Aplicar em legal-assistant e endpoints públicos.
- Adicionar logs estruturados e retorno 429.

C) UX e rastreabilidade de documentos
- Implementar rota/página de detalhe de documento por slug (/documentos/:slug).
- Fazer DocumentCard e buscas navegarem para o detalhe.
- Exibir fonte oficial, data de captura/publicação e link de download.
- Adicionar badge de “origem” (Prefeitura, TCE-SP, upload, etc.).

D) Pipeline TCE-SP por API
- Implementar Edge Function de ingestão usando endpoints documentados:
  - /api/json/municipios
  - /api/json/receitas/{municipio}/{exercicio}/{mes}
  - /api/json/despesas/{municipio}/{exercicio}/{mes}
- Criar tabelas tce_receitas, tce_despesas, tce_import_jobs com índices.
- Implementar idempotência (não duplicar import).
- Criar página/abas em Contas Públicas usando dados do banco, com filtros por mês/ano, órgão e fornecedor.

E) Sanitização de markdown
- Adicionar sanitização robusta ao renderer markdown do frontend.
- Garantir que links externos tenham rel noopener/noreferrer e target seguro.
- Criar testes de regressão simples.

F) CI/CD e deploy
- Adicionar GitHub Actions (ou equivalente) para: install, typecheck, lint, build.
- Adicionar job opcional para validar migrations (pelo menos SQL lint ou execução local com supabase start).
- Adicionar check que falha se existir segredo em VITE_* além do esperado (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).

Saídas obrigatórias:
1) Commits separados por A/B/C/D/E/F.
2) Atualizar /docs com:
   - Guia de deploy (Cloudflare Pages para frontend + supabase deploy para backend)
   - Checklist de segurança (incluindo rate limit)
   - Checklist de acessibilidade (WCAG 2.2 / eMAG nos fluxos críticos)
3) No final: imprimir um “Release Notes” com o que foi feito e como testar.

Restrições:
- Não inventar endpoints sem documentar.
- Não criar “backend próprio” fora do Supabase.
- Não remover módulos existentes; migrar incrementalmente com fallback.
- Quando houver dúvida, documentar decisão no /docs/DECISOES.md.

Agora implemente.
```