# Sistema Âncora (Front-end)

Interface web do **Sistema Âncora**, sistema voltado ao acompanhamento da frequência escolar para identificar e prevenir a evasão de forma automatizada e preventiva. O front-end permite que a direção e a assistência social visualizem os alertas gerados pelo Modelo de ML e acompanhem a situação dos alunos.

> Status: projeto em fase de protótipo.

## Supervisão

Este repositório é supervisionado por **Matheus Washington**

Combinados para quem for desenvolver:

- Não envie código direto para a branch `main`. Crie uma branch para cada tarefa e abra um Pull Request.
- Todo Pull Request passa por revisão do supervisor antes do merge.
- Dúvidas de escopo, layout ou regra de negócio devem ser alinhadas com o supervisor antes de implementar.
- Registre tarefas e bugs em Issues, para manter o histórico do que foi feito.

## Tecnologias

- [React](https://react.dev/) para a construção da interface
- [Bootstrap 5](https://getbootstrap.com/docs/5.3/) para layout, grid e componentes

## Identidade visual

Fonte: **Raleway** ("SISTEMA" em peso fino e "ÂNCORA" em negrito, no logo).

| Cor | Uso | HEX |
|---|---|---|
| Azul claro | Fundo das telas | `#D3E3FA` |
| Azul-marinho | Logo e destaques | `#0B2A5B` |
| Azul vivo | Botões principais | `#0A4FD6` |
| Azul de link | Links e ações secundárias | `#1D4ED8` |
| Vermelho | Alertas de frequência | `#DC2626` |
| Amarelo | Alertas de notas | `#FACC15` |

Sugestão para aplicar as cores no Bootstrap 5, em um arquivo `src/styles/custom.css`:

```css
::root {
  --ancora-fundo: #D3E3FA;
  --ancora-azul-marinho: #0B2A5B;
  --ancora-azul-vivo: #0A4FD6;
  --ancora-link: #1D4ED8;
  --ancora-texto: #111827;
  --ancora-alerta-vermelho: #DC2626;
  --ancora-alerta-amarelo: #FACC15;

  --bs-primary: var(--ancora-azul-vivo);
  --bs-primary-rgb: 10, 79, 214;
  --bs-body-bg: var(--ancora-fundo);
  --bs-body-color: var(--ancora-texto);
  --bs-link-color: var(--ancora-link);
  --bs-danger: var(--ancora-alerta-vermelho);
  --bs-warning: var(--ancora-alerta-amarelo);
}
body {
  font-family: "Raleway", sans-serif;
}
```

## Como rodar o projeto

Pré-requisitos: Node.js (versão LTS) e npm.

```bash
# clonar o repositório
git clone https://github.com/<organizacao>/sistema-ancora-front.git
cd sistema-ancora-front

# instalar as dependências
npm install

# rodar em ambiente de desenvolvimento
npm start
```

## Estrutura sugerida

```
src/
  components/   componentes reutilizáveis
  pages/        telas (login, painel de alertas, lista de alunos)
  services/     chamadas à API
  styles/       estilos globais e variáveis de cor
  assets/       logo e imagens
```

## Fluxo de trabalho com Git

1. Atualize sua `main` local: `git pull origin main`
2. Crie uma branch: `git checkout -b feature/nome-da-tarefa`
3. Faça commits pequenos e com mensagens claras (ex.: `feat: adiciona tela de alertas`)
4. Envie a branch: `git push origin feature/nome-da-tarefa`
5. Abra um Pull Request e aguarde a revisão do supervisor

## Contato

Supervisor: Matheus Washington
