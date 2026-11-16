# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:
Interface web do Sistema Âncora, sistema voltado ao acompanhamento da frequência escolar para identificar e prevenir a evasão de forma automatizada e preventiva. O front-end permite que a direção e a assistência social visualizem os alertas gerados pelo Modelo de ML e acompanhem a situação dos alunos.

**Status:** projeto em fase de protótipo.

O front-end é React/Vite. A API está no pacote independente `backend/`; o serviço do modelo de ML continua desacoplado e pode ser conectado por HTTP.

## API local

Uma implementação inicial da API está em `backend/`, mantendo-se como pacote Node independente. Veja [backend/README.md](backend/README.md) para iniciar o PostgreSQL, aplicar a migração, carregar dados fictícios e executar a API. O login do front e os fluxos do professor usam `VITE_API_URL` para se conectar a ela.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
