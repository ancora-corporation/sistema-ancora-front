# API do Sistema Âncora

API REST em Node.js e Express 5, com PostgreSQL, autenticação JWT, validação de entrada e permissões por perfil. O esquema mantém as entidades escolares separadas de previsões do modelo para permitir introduzir ou trocar o serviço de ML sem acoplar a aplicação ao framework do modelo. A API usa roteamento e middleware Express documentados oficialmente e o pool de conexões do `pg` para PostgreSQL. ([Express 5](https://expressjs.com/en/5x/guide/routing/), [middleware Express](https://expressjs.com/en/5x/guide/using-middleware/), [pool do node-postgres](https://node-postgres.com/features/pooling))

## Requisitos

- Node.js 22 ou superior
- Docker Desktop com Compose, ou PostgreSQL 15 ou superior já instalado

## Iniciar localmente (PowerShell)

```powershell
Copy-Item .env.example .env
# Gere um JWT_SECRET aleatório com pelo menos 32 caracteres e grave em .env
docker compose up -d db
npm install
npm run db:setup
npm run dev
```

A API responde em `http://localhost:3001`; verificação de conexão: `GET /health`. No front, configure `VITE_API_URL=http://localhost:3001/api/v1` em `.env.local` e execute `npm run dev` na raiz do front.

## Perfis e acesso

| Perfil | Papel da API | Escopo |
| --- | --- | --- |
| Administrador | `admin` | Rede inteira, contas, unidades e execuções de ML |
| Direção | `director` | Dados da escola vinculada; consulta, status de alertas e registra acompanhamentos |
| Assistência social | `social` | Alunos e alertas da escola; registra intervenções |
| Professor | `teacher` | Apenas turmas atribuídas; registra chamada e notas |

Todas as rotas de negócio exigem `Authorization: Bearer <token>`. O servidor recarrega o estado do usuário no banco a cada requisição, então contas desativadas perdem acesso sem aguardar o token expirar.

## Rotas principais

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET /api/v1/schools`, `GET/POST /api/v1/users`, `PATCH /api/v1/users/:id/status`
- `GET /api/v1/classes`, `GET /api/v1/classes/:id/alunos`
- `GET/POST /api/v1/students`, `GET /api/v1/students/:id`
- `GET /api/v1/attendance`, `PUT /api/v1/attendance`
- `GET /api/v1/grades`, `PUT /api/v1/grades`
- `GET /api/v1/alerts`, `PATCH /api/v1/alerts/:id/status`
- `GET/POST /api/v1/interventions`
- `GET/POST /api/v1/ml/runs`

## PostgreSQL e dados demonstrativos

As migrações versionadas ficam em `src/db/migrations`. Para aplicar mudanças, acrescente uma nova migração numerada e registre sua execução no script `src/db/migrate.js`. `npm run db:seed` só funciona com `SEED_DEMO=true` e fora de produção. As contas demonstrativas compartilham a senha `123456`; use somente localmente e nunca reutilize em produção.

## Integração do modelo de ML

Configure `ML_SERVICE_URL` e opcionalmente `ML_SERVICE_TOKEN` quando o serviço estiver pronto. A API envia identificadores opacos e atributos agregados de frequência e notas para `POST {ML_SERVICE_URL}/predict`. A resposta deve ter este formato:

```json
{
  "modelVersion": "1.0.0",
  "predictions": [
    { "studentId": "uuid", "score": 0.82, "riskLevel": "high", "summary": "Sinais de baixa frequência" }
  ]
}
```

Versões, estado da execução e previsões ficam registrados em `model_runs` e `alerts`. Sem `ML_SERVICE_URL`, a rota informa que o modelo ainda não está configurado e não fabrica previsões.

## Limites do protótipo

As credenciais de demonstração e os dados fictícios servem apenas ao desenvolvimento local. Configure TLS, segredo JWT forte, backup e restauração do banco, política de retenção, logging apropriado e validação de permissões antes de produção. As regras de perfil existem no servidor; não dependa apenas das proteções do React.
