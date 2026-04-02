Perfeito. Vamos fechar isso como **plano de produto + plano de front + plano de dados + plano de implementação**, bem específico, para depois virar um **Master Prompt cirúrgico para o Codex**.

Vou preservar a direção da UI atual:

* **limpa**
* **institucional moderna**
* **sem cara de mock gerado por IA**
* mas com melhorias de estrutura, consistência e densidade editorial

---

# Plano completo do front do Fiscaliza Pedreira

## 1. Princípio do produto

O Fiscaliza Pedreira deve ser um **portal público de inteligência cívica municipal**, com quatro funções principais:

1. **Informar**

   * mostrar documentos públicos e conteúdos institucionais organizados

2. **Explicar**

   * exibir análises, contexto legal e assistente jurídico municipal

3. **Fiscalizar**

   * destacar alertas, inconsistências, riscos e documentos faltantes

4. **Receber participação**

   * denúncia pública, contato e interação do cidadão

---

# 2. Direção visual

## O que manter da UI atual

Manter:

* base limpa
* composição sóbria
* legibilidade
* sensação de produto real
* interface editorial sem exagero

## O que melhorar

Melhorar:

* consistência entre seções
* ritmo visual da home
* padronização de cards
* hierarquia de informação
* visualização de PDF
* filtros e diretórios
* badges e metadados
* densidade controlada no desktop
* melhor responsividade mobile-first

## Princípios visuais

* claro, confiável, público
* editorial, não burocrático
* forte, mas sem poluição
* sempre separar:

  * documento original
  * análise
  * resumo
  * metadados

---

# 3. Mapa principal do site

## Navegação principal

* Início
* Diário Oficial
* Câmara Legislativa
* Contas Públicas
* Controle Externo
* Relatórios
* Documentos Faltantes
* Denúncia
* Assistente Jurídico

## Navegação secundária

* Sobre a Plataforma
* Base Legal
* Política de Privacidade
* Contato / Sugestões
* Termos e Avisos Legais

---

# 4. Splash animada

## Objetivo

A splash não deve ser decorativa apenas.
Ela serve para:

* carregar shell da aplicação
* pré-carregar destaques da home
* carregar categorias principais
* iniciar cache de itens recentes

## Conteúdo

* logotipo animado
* frase curta:

  * “Organizando dados públicos”
  * “Carregando documentos e análises”
* barra ou loader discreto

## Regras

* duração curta
* pular automaticamente ao concluir
* fallback para skeletons
* nunca bloquear excessivamente a navegação

## Critério de aceite

* splash aparece apenas no primeiro carregamento ou quando necessário
* não gera sensação de lentidão artificial
* transição suave para a home

---

# 5. Home

A home deve ser uma **central pública de leitura e descoberta**.

## 5.1 Header

### Estrutura

* logotipo
* menu
* busca global
* botão “Fazer denúncia”
* botão “Assistente jurídico”

### Comportamento

* sticky no desktop
* colapsável no mobile
* acesso rápido às áreas críticas

## 5.2 Hero principal

### Objetivo

Destacar conteúdo quente e recente.

### Conteúdo do carrossel

Cada slide deve poder representar:

* último Diário Oficial
* projeto de lei novo
* notícia institucional relevante
* análise recém-publicada
* alerta ou instrução do TCE
* documento faltante importante

### Cada slide deve conter

* categoria
* título
* data
* resumo curto
* CTA 1: Ver original
* CTA 2: Ler análise

### Critério de aceite

* funciona no desktop e mobile
* texto legível
* CTA visível
* não depender de imagem para comunicar

## 5.3 Bloco “Sobre a plataforma”

### Conteúdo

Texto curto e autoexplicativo:

* o que a plataforma faz
* qual problema resolve
* que tipo de informação organiza
* como o cidadão pode usar

### Critério de aceite

* leitura rápida
* linguagem clara
* não parecer manifesto abstrato

## 5.4 Bloco jurídico-institucional

Esse bloco é estratégico e deve existir mesmo.

### Conteúdo

* base em transparência pública
* LAI
* interesse público
* proteção de dados
* justificativa para divulgação de nomes de agentes públicos e figuras políticas em contexto de controle social
* caráter informativo e fiscalizatório da plataforma
* aviso de que análises automatizadas são apoio técnico e não parecer jurídico oficial

### Objetivo

* proteção institucional
* clareza jurídica
* credibilidade

### Critério de aceite

* linguagem técnica, mas compreensível
* não excessivamente longa
* fácil de localizar depois

## 5.5 Containers de conteúdo por categoria

Cada categoria deve ter:

* título
* subtítulo curto
* lista de cards
* link “ver tudo”

### Categorias recomendadas na home

* Diário Oficial
* Câmara Legislativa
* Contas Públicas
* Controle Externo
* Relatórios Recentes
* Documentos Faltantes
* Notícias Capturadas
* Áreas críticas

### Critério de aceite

* no desktop: grid claro e equilibrado
* no mobile: blocos empilhados
* cards consistentes entre si

## 5.6 Bloco do Assistente Jurídico

### Objetivo

Dar entrada rápida para perguntas públicas.

### Conteúdo

* título
* texto curto
* campo de pergunta
* exemplos clicáveis

### Exemplos

* “Qual é a lei sobre uso da rua?”
* “Existe projeto sobre este tema?”
* “Onde encontro o Diário Oficial?”
* “O que é LOA?”

### Critério de aceite

* não parecer chat invasivo
* fácil de usar
* claramente delimitado como assistente informativo municipal

---

# 6. Páginas diretório

Essas páginas são essenciais e devem compartilhar uma estrutura-base.

## Estrutura comum do diretório

* título da seção
* descrição curta
* busca
* filtros
* alternância de visualização
* grid/lista de cards
* paginação ou carregamento incremental
* modal para PDF
* ação “ver análise”

---

# 7. Página Diário Oficial

## Objetivo

Organizar diários por data e facilitar acesso ao original e à análise.

## Recursos

* busca por data
* filtro por período
* filtro por tema
* ordenação por mais recente
* card com:

  * data
  * edição
  * fonte
  * resumo
  * botão ver original
  * botão ver análise

## Extras

* bloco “Informativos importantes do dia”
* destaque para diário do dia
* indicador se já foi analisado

## Critério de aceite

* diário do dia facilmente encontrável
* PDF abre em modal
* link de download disponível
* análise acessível em 1 clique

---

# 8. Página Câmara Legislativa

## Objetivo

Organizar projetos e documentos legislativos.

## Tipos a suportar

* PLO
* LO
* PLC
* requerimentos
* moções
* indicações
* outros documentos da Câmara

## Recursos

* busca por número, data, assunto
* filtros por tipo
* filtros por ano
* cards com:

  * número
  * tipo
  * data
  * assunto
  * ver original
  * ver análise

## Critério de aceite

* estrutura flexível para crescer
* sem necessidade de mudar layout a cada novo tipo

---

# 9. Página Contas Públicas

## Objetivo

Organizar os documentos contábeis, fiscais e orçamentários.

## Subcategorias

* LOA
* LDO
* PPA
* RREO
* RGF
* balancetes
* balanços
* prestação de contas
* pareceres TCESP
* terceiro setor
* PCA
* repasses

## Recursos

* filtros por subtipo
* busca por ano/período
* cards ou visualização em lista
* modal de PDF
* botão de análise

## Critério de aceite

* o usuário entende rapidamente a diferença entre os grupos
* navegação por subtipo não confunde

---

# 10. Página Controle Externo

## Objetivo

Concentrar material do TCE, TCU e outros órgãos de controle.

## Conteúdo

* relatórios de alerta
* relatórios de instrução
* painéis do TCE
* achados críticos
* publicações técnicas
* alertas fiscais e administrativos

## Recursos

* filtros por órgão
* filtros por ano
* filtros por tipo
* cards com:

  * órgão
  * tipo
  * ano
  * ver original
  * ver análise

## Critério de aceite

* área com identidade própria
* parecer área de controle e não simples repositório

---

# 11. Página Relatórios

## Objetivo

Exibir relatórios publicados em formato renderizado.

## Estrutura

* listagem de relatórios
* filtros por categoria
* busca
* status de confiança / nível de análise
* página interna do relatório com renderização Markdown

## Na listagem

cada card deve ter:

* título
* categoria
* data
* resumo
* tags
* botão ler relatório

## Na página do relatório

* título
* resumo executivo
* metadados
* corpo Markdown renderizado
* links para documentos originais
* bloco de base legal consultada
* botão compartilhar
* botão baixar, se existir

## Critério de aceite

* markdown bem renderizado
* sem HTML cru inseguro
* layout de leitura agradável

---

# 12. Página Documentos Faltantes

## Objetivo

Mostrar documentos esperados que não foram localizados.

## Estrutura

* explicação da lógica
* filtros por categoria
* filtros por período
* cards ou tabela

## Cada item deve conter

* tipo de documento
* período esperado
* base legal ou obrigação contextual
* status:

  * não localizado
  * pendente de verificação
  * localizado posteriormente
* observação
* se houver, análise ou nota explicativa

## Critério de aceite

* linguagem prudente
* nada acusatório sem base
* visual de radar de transparência

---

# 13. Página de denúncia pública

## Objetivo

Receber denúncias e gerar protocolo.

## Estrutura

* explicação inicial
* aviso sobre dados e confidencialidade
* formulário
* protocolo após envio
* link para rastreio

## Campos sugeridos

* nome
* e-mail
* telefone
* assunto
* categoria
* descrição
* anexos
* opção de privacidade, conforme estratégia do produto

## Pós-envio

* mensagem clara
* protocolo
* instrução de acompanhamento

## Critério de aceite

* formulário fácil em mobile
* sem poluição
* linguagem séria e acolhedora

---

# 14. Assistente Jurídico público

## Objetivo

Responder dúvidas informativas sobre:

* leis municipais
* projetos em andamento
* documentos públicos
* transparência e organização institucional

## Restrições

* não dar parecer definitivo
* não acusar
* não fazer juízo conclusivo sem base

## Interface

* chat limpo
* respostas curtas e objetivas
* base legal citada
* sugestão de documentos relacionados

## Critério de aceite

* escopo controlado
* respostas com prudência
* boa experiência em mobile

---

# 15. Modal de visualização de PDF

## Objetivo

Permitir leitura do documento sem sair da página.

## Estrutura

* título do documento
* data
* fonte
* botão download
* botão abrir em nova aba
* botão “ver análise”
* viewer embutido

## Fallback

Se o PDF não carregar:

* mostrar botão de download
* mostrar botão abrir em nova aba

## Critério de aceite

* não prender o usuário em tela ruim
* fechar e voltar facilmente para listagem

---

# 16. Sistema de cards

Todos os cards do sistema devem derivar de um mesmo padrão visual.

## Campos visuais possíveis

* badge de categoria
* título
* subtítulo ou resumo
* data
* órgão/fonte
* tags
* risco/relevância
* ações

## Ações principais

* Ver original
* Ver análise

## Tipos de badge

* Diário
* Projeto de Lei
* Alerta TCE
* Contas Públicas
* Relatório
* Documento faltante
* Crítico
* Novo

## Critério de aceite

* todos os diretórios usam a mesma gramática visual

---

# 17. Busca global

## Deve buscar em

* título
* categoria
* tipo
* órgão
* data
* descrição curta
* tags

## Em fase posterior

* conteúdo textual
* trecho indexado de PDFs
* relatórios Markdown
* análises publicadas

## Critério de aceite

* busca rápida
* resultados agrupados por tipo

---

# 18. Modelo de dados do front

Todo item visualizável no sistema deve seguir um contrato único.

## Campos recomendados

* id
* source
* domain
* category
* subtype
* title
* summary
* date
* year
* month
* tags
* sourceEntity
* originalUrl
* analysisUrl
* hasAnalysis
* previewMode
* riskLevel
* isFeatured
* status
* legalContextAvailable

## Benefício

Isso permite usar o mesmo card para:

* diário
* projeto
* alerta
* balancete
* relatório
* documento faltante

---

# 19. Camada de ingestão e normalização

## Problema identificado

Os CSVs brutos têm:

* links úteis
* navegação inútil
* duplicatas
* conteúdo institucional genérico
* links de share/social

## Solução obrigatória

Criar uma camada intermediária antes do front.

## Etapas

1. coleta bruta
2. limpeza
3. deduplicação
4. classificação
5. enriquecimento
6. publicação para front

## Critério de aceite

* o front nunca consome CSV cru diretamente
* somente dados normalizados

---

# 20. Estrutura de componentes do front

## Base

* AppShell
* SplashScreen
* Header
* Footer
* GlobalSearch
* SectionHeader
* EmptyState
* ErrorState
* LoadingState

## Conteúdo

* HighlightCarousel
* CategorySection
* DocumentCard
* ReportCard
* MissingDocumentCard
* Tag
* Badge
* FilterBar
* SortControl
* ViewModeToggle
* Pagination

## Documento

* PdfViewerModal
* SourceMeta
* OriginalDocumentActions
* AnalysisLink

## Relatórios

* MarkdownRenderer
* ReportMetaBar
* LegalBasisPanel
* ReportActions

## Assistente

* PublicLegalChat
* SuggestedQuestions
* ResponseCard
* LegalSourceCitation

## Denúncia

* ComplaintForm
* ProtocolSuccessCard
* PrivacyNotice

---

# 21. Mobile-first

## Diretriz

O site precisa nascer pensando em celular.

## Ajustes por área

### Header

* menu colapsado
* busca compacta
* CTA prioritário

### Hero

* carrossel vertical mais limpo
* CTAs empilhados

### Cards

* largura total
* ações claras
* menos ruído

### Diretórios

* filtros recolhíveis
* alternância grid/lista opcional
* cards empilhados

### Modal PDF

* full-screen no mobile

### Chat

* campo fixo confortável
* rolagem estável

### Relatórios

* tipografia confortável
* largura ideal de leitura
* tabelas com overflow controlado

## Critério de aceite

* o produto não parecer desktop espremido

---

# 22. Painel de publicação de relatórios

Como já alinhamos, o relatório ideal vem em Markdown.

## Tela admin de publicação

* upload de `.md`
* área de cola
* leitura de frontmatter
* preview renderizado
* edição de metadados
* botão salvar rascunho
* botão publicar

## Campos

* título
* slug
* categoria
* status
* resumo
* tags
* data
* confiança
* fontes

## Critério de aceite

* você não precisa editar HTML
* publicação simples e robusta

---

# 23. Segurança jurídica e comunicacional

## O site precisa ter blocos claros de proteção

* política de privacidade
* aviso legal da plataforma
* finalidade pública e informativa
* explicação do tratamento de nomes públicos
* aviso sobre análises automatizadas
* canal de contato ou contestação, se quiser

## Critério de aceite

* esses avisos estão integrados ao produto, não escondidos

---

# 24. Prioridade de implementação

## Fase 1 — Base estrutural

* AppShell
* Header
* Footer
* Splash
* Home base
* busca global básica
* sistema de cards
* modal de PDF

## Fase 2 — Diretórios principais

* Diário Oficial
* Câmara Legislativa
* Contas Públicas
* Controle Externo
* Relatórios
* Documentos Faltantes

## Fase 3 — Interação pública

* denúncia
* rastreio
* contato
* assistente jurídico

## Fase 4 — Publicação

* importação Markdown
* preview
* renderização pública

## Fase 5 — Refinamento

* filtros avançados
* busca expandida
* melhor organização de dados
* performance
* detalhes mobile-first

---

# 25. Critérios de aceite gerais

O front só deve ser considerado entregue quando:

* a UI atual foi preservada e melhorada, não descaracterizada
* a home está editorialmente forte
* os diretórios por assunto funcionam
* os cards seguem padrão único
* PDFs abrem em modal
* há botão “ver original” e “ver análise”
* a página de relatórios renderiza Markdown corretamente
* existe a página de documentos faltantes
* existe denúncia pública
* existe chat jurídico público
* tudo funciona bem no mobile e no desktop
* os dados entram por camada normalizada, não direto do CSV cru

---

# 26. O que o Codex não deve fazer

Para evitar enrolação depois, isso precisa entrar no prompt futuro:

* não redesenhar a UI do zero
* não trocar a identidade visual limpa atual por algo espalhafatoso
* não deixar páginas mockadas
* não criar somente layout sem fluxo real
* não adiar diretórios por assunto
* não ignorar modal de PDF
* não ignorar a página de documentos faltantes
* não depender de CSV cru na UI
* não tratar o chat como feature sem guardrails
* não entregar só a home e prometer o resto

---

# 27. O próximo passo correto

Agora o melhor próximo passo é:

## transformar esse plano em um Master Prompt cirúrgico para o Codex

com:

* páginas exatas
* componentes exatos
* estrutura de dados
* ordem de implementação
* definição de pronto
* o que ele deve e o que não deve deixar incompleto

Esse prompt precisa obrigar o Codex a entregar:

* **arquitetura real**
* **front real**
* **fluxos reais**
* **sem procrastinar em “foundation” infinita**

Se você quiser, eu já faço agora essa próxima etapa e te entrego o **Master Prompt definitivo para o Codex**, baseado exatamente neste plano.
