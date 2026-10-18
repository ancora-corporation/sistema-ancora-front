# Sistema Âncora (Front-end)

Interface web do Sistema Âncora, sistema voltado ao acompanhamento da frequência escolar para identificar e prevenir a evasão de forma automatizada e preventiva. O front-end permite que a direção e a assistência social visualizem os alertas gerados pelo Modelo de ML e acompanhem a situação dos alunos.

**Status:** projeto em fase de protótipo.

Este repositório contém apenas o front-end. A API (Node) e o Modelo de ML ficam em repositórios separados.

## Supervisão

Este repositório é supervisionado por **Matheus Washington**.

Combinados para quem for desenvolver:

- Não envie código direto para a branch `main`. Crie uma branch para cada tarefa e abra um Pull Request.
- Todo Pull Request passa por revisão do supervisor antes do merge.
- Dúvidas de escopo, layout ou regra de negócio devem ser alinhadas com o supervisor antes de implementar.
- Registre tarefas e bugs em Issues, para manter o histórico do que foi feito.

## Tecnologias e a função de cada uma

| Tecnologia | Função no projeto |
|---|---|
| **Node.js e npm** | O Node executa as ferramentas de desenvolvimento (Vite, instalação de pacotes). O npm baixa e gerencia as dependências listadas no `package.json`. |
| **Vite** | Servidor de desenvolvimento com recarga automática (`npm run dev`) e gerador da versão final (`npm run build`). Também traduz o JSX e os módulos (`import`/`export`) para algo que o navegador entende. |
| **React** | Constrói a interface a partir de **componentes** (funções que devolvem JSX) e **estados** (`useState`). Quando o estado muda, o React atualiza a tela sozinho. |
| **React Router** | Controla as telas e as URLs (`/login`, `/dashboard`) sem recarregar a página. Também permite proteger rotas. |
| **Bootstrap 5** | Cuida da **aparência**: grade responsiva, formulários, botões, alertas e utilitários de espaçamento. Usado apenas pelo CSS (classes), sem o JavaScript do Bootstrap. |
| **Fontsource (Raleway)** | Instala a fonte da identidade visual via npm, sem depender de CDN. |
| **Git e GitHub** | Controle de versão e trabalho em equipe. |

### Como React e Bootstrap se complementam

- O **React** decide **o que aparece e quando** (mostrar o erro, desabilitar o botão, trocar de tela).
- O **Bootstrap** decide **como aparece** (cores, espaçamentos, responsividade).
- Um não substitui o outro: o React não traz estilo, e o Bootstrap não sabe nada de estados ou rotas.

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

Sugestão para aplicar as cores no Bootstrap 5, em `src/styles/custom.css`:

```css
:root {
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
  --bs-link-color-rgb: 29, 78, 216;
  --bs-danger: var(--ancora-alerta-vermelho);
  --bs-warning: var(--ancora-alerta-amarelo);
}

body {
  font-family: "Raleway", sans-serif;
}

/* No Bootstrap 5.3, o botão primário tem as próprias variáveis de cor */
.btn-primary {
  --bs-btn-bg: var(--ancora-azul-vivo);
  --bs-btn-border-color: var(--ancora-azul-vivo);
  --bs-btn-hover-bg: #0839A6;
  --bs-btn-hover-border-color: #0839A6;
  --bs-btn-active-bg: #0839A6;
  --bs-btn-active-border-color: #0839A6;
  --bs-btn-disabled-bg: var(--ancora-azul-vivo);
  --bs-btn-disabled-border-color: var(--ancora-azul-vivo);
}
```

Importe esse arquivo no `src/main.jsx` **depois** do CSS do Bootstrap, para ele poder sobrescrever:

```jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';
```

## Preparar o ambiente (primeira vez)

### 1. Instalar as ferramentas

1. **Git**: https://git-scm.com
2. **Node.js** (versão LTS recente; o projeto foi desenvolvido com a v26.1.0): https://nodejs.org
3. **VS Code** (recomendado): https://code.visualstudio.com

Reabra o terminal e confira:

```bash
git --version
node -v
npm -v
```

Se algum comando não for reconhecido, a ferramenta não foi instalada ou o terminal foi aberto antes da instalação.

### 2. Configurar o Git (uma vez por máquina)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

## Como rodar o projeto

```bash
# clonar o repositório
git clone https://github.com/ancora-corporation/sistema-ancora-front.git
cd sistema-ancora-front

# instalar as dependências
npm install

# rodar em ambiente de desenvolvimento
npm run dev
```

- O `npm install` lê o `package.json` e baixa tudo em `node_modules/` (essa pasta não vai para o Git).
- O `npm run dev` sobe o servidor. Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).
- Login de teste (provisório, até a API ficar pronta): `admin@ancora.com` e `123456`.

### Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Gera a versão final na pasta `dist/` |
| `npm run preview` | Testa localmente a versão gerada pelo build |
| `npm install nome-do-pacote` | Adiciona uma nova dependência |

## Como o projeto foi criado do zero

Esta seção serve para recriar o ambiente ou entender cada peça. Quem apenas clona o repositório pode pular.

```bash
# 1. Vite com React (se a pasta tiver arquivos, escolha "Ignore files and continue")
npm create vite@latest . -- --template react
npm install

# 2. Bibliotecas do projeto
npm install bootstrap react-router-dom @fontsource/raleway

# 3. Pastas
mkdir -p src/components src/pages src/services src/styles src/assets
```

Depois:

- Apague o `src/App.css` (e o import dele) e os estilos de exemplo do `index.css` do template, que atrapalham o layout.
- No `src/main.jsx`, importe o Bootstrap, as fontes e o `custom.css`, e envolva o app com `<BrowserRouter>`:

```jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/raleway/300.css';
import '@fontsource/raleway/700.css';
import './styles/custom.css';
```

- As rotas ficam definidas no `src/App.jsx`.

## Estrutura sugerida

```
src/
  main.jsx      entrada do app (Bootstrap, fonte, estilos e rotas)
  App.jsx       definição das rotas
  components/   componentes reutilizáveis (ex.: RotaProtegida)
  pages/        telas (login, painel de alertas, lista de alunos)
  services/     chamadas à API e autenticação
  styles/       estilos globais e variáveis de cor (custom.css)
  assets/       logo e imagens
```

## Variáveis de ambiente

Quando a API estiver pronta, a URL dela fica num arquivo `.env` na raiz (que não vai para o Git):

```
VITE_API_URL=http://localhost:3000
```

No Vite, só variáveis que começam com `VITE_` ficam disponíveis no código, e são lidas com `import.meta.env.VITE_API_URL`.

## Fluxo de trabalho com Git

1. Atualize sua `main` local: `git pull origin main`
2. Crie uma branch: `git checkout -b feature/nome-da-tarefa`
3. Faça commits pequenos e com mensagens claras, no formato `tipo: descrição` (ex.: `feat: adiciona tela de alertas`, `fix: corrige validação de e-mail`, `chore: atualiza dependências`)
4. Envie a branch: `git push origin feature/nome-da-tarefa`
5. Abra um Pull Request e aguarde a revisão do supervisor

Nunca commitar `node_modules/`, `dist/` ou arquivos `.env`.

## Convenções de código

- No JSX, usar `className` no lugar de `class` e `htmlFor` no lugar de `for`.
- Estilos próprios ficam em `src/styles/custom.css`, usando as variáveis da paleta.
- Chamadas à API ficam em `src/services/`, nunca direto dentro dos componentes.

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm: command not found` | Node.js não instalado, ou terminal aberto antes da instalação | Instale o Node e reabra o terminal |
| `Cannot find module` | Dependências não instaladas | Rode `npm install` |
| Tela abre sem estilo | Bootstrap não importado | Confira os imports no `main.jsx` |
| Cartão de login fora do centro | Sobras de CSS do template do Vite | Limpe o `index.css` e apague o `App.css` |
| Porta 5173 ocupada | Outro servidor rodando | O Vite sugere outra porta, ou encerre o outro processo |
| Página em branco ao abrir uma rota | Faltou o `<BrowserRouter>` no `main.jsx` | Envolva o `<App />` com ele |

## Segurança

- O login atual é **provisório** (credenciais fixas no front) e será substituído pela API em Node.
- O token fica no `localStorage` apenas no protótipo. Com o backend, avaliar cookies `HttpOnly`.
- A proteção de rotas no front é só visual. A proteção real dos dados dos alunos deve ser feita pela API, validando o token em cada requisição.

## Contato

Supervisor: **Matheus Washington**
