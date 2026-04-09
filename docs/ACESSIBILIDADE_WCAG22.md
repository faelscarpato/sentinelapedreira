# Checklist de Acessibilidade (WCAG 2.2 + eMAG)

Fluxos críticos revisados:

- Login (`/entrar`)
- Denúncia (`/denuncia`)
- Busca global no header
- Detalhe de documento (`/documentos/:slug`)
- Contas Públicas (filtros + abas TCE)

## Conformidade aplicada nesta etapa

- [x] Formulários críticos com labels e mensagens textuais de erro
- [x] Estados explícitos de `loading`, `error`, `empty`, `success`
- [x] Navegação por teclado nos componentes críticos de filtro e busca
- [x] Botões com texto descritivo (sem dependência exclusiva de ícone)
- [x] Contraste AA nos componentes principais dos fluxos críticos
- [x] Links externos abrem em nova aba com semântica segura

## Requisitos WCAG/eMAG verificados por fluxo

## Login e sessão

- WCAG 3.3.1 (Error Identification): erros de autenticação exibidos em texto.
- WCAG 2.4.3 (Focus Order): ordem de foco linear nos campos.
- eMAG 3.4 (Formulários): rótulos visíveis e instruções claras.

## Denúncia

- WCAG 3.3.2 (Labels or Instructions): instruções para denúncia anônima/não anônima.
- WCAG 1.3.1 (Info and Relationships): agrupamento semântico de campos.
- eMAG 3.6 (Mensagens): retorno de protocolo textual após envio.

## Busca e navegação

- WCAG 2.1.1 (Keyboard): busca operável por teclado.
- WCAG 2.4.7 (Focus Visible): foco visível nos elementos interativos.
- eMAG 2.2 (Navegação consistente): comportamento uniforme entre desktop/mobile.

## Próximos ajustes recomendados

1. Adicionar skip-link para pular direto ao conteúdo principal.
2. Executar auditoria automatizada com `axe-core` no pipeline CI.
3. Validar reflow/zoom 200% em todas as páginas de dados tabulares.
4. Revisar landmarks (`header`, `nav`, `main`, `footer`) em todas as telas.
