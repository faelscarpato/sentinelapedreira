# Revisão de Acessibilidade (WCAG 2.2)

Escopo revisado nesta entrega:

- `Entrar`
- `Denuncia`
- `MinhaConta`
- `PainelEditorial`
- `Header` (navegação e busca)

## Resultado atual

- Navegação por teclado: **parcialmente atendida**
- Estados visuais (loading/erro/sucesso): **atendida**
- Labels e campos de formulário essenciais: **atendida**
- Mensagens de erro/sucesso textuais (não apenas cor): **atendida**
- Controle de foco em componentes dinâmicos: **parcialmente atendida**
- Contraste de cores nos fluxos críticos: **atendida**

## Evidências implementadas

- Campos de login/denúncia possuem labels visíveis e placeholders.
- Botões críticos possuem texto explícito (`ENVIAR`, `PUBLICAR`, `SAIR`).
- Telas críticas mostram estados de carregamento e erro com texto.
- Guardas de rota exibem mensagens de acesso restrito sem bloquear leitura por leitor de tela.

## Lacunas para produção

1. Adicionar skip link para conteúdo principal no layout base.
2. Revisar ordem de foco e armadilha de foco no menu mobile e busca expandida.
3. Adicionar testes E2E com `axe-core` para rotas críticas.
4. Validar zoom 200% e reflow para painéis (`MinhaConta`, `PainelEditorial`).
5. Revisar linguagem/semântica de landmarks (`main`, `nav`, `aside`, `footer`) em todas as páginas.

## Critério de aceite WCAG 2.2 (mínimo operacional)

1. Todos os fluxos críticos funcionam apenas com teclado.
2. Erros de formulário são anunciados de forma textual e contextual.
3. Contraste mínimo AA em componentes críticos.
4. Sem bloqueio de foco em modais/dropdowns.
5. Execução de varredura automatizada (axe) sem falhas críticas.
