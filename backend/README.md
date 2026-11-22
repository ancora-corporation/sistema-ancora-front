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
docker compose build api
docker compose run --rm api npm run db:setup
docker compose up -d api
```

A API responde em `http://localhost:3001`; verificação de conexão: `GET /health`. O serviço da API usa o endereço interno `db` para acessar o PostgreSQL no Compose. No front, configure `VITE_API_URL=http://localhost:3001/api/v1` em `.env.local` e execute `npm run dev` na raiz do front. Para ver os logs da API, use `docker compose logs -f api`; para pará-la, use `docker compose stop api`.

## Perfis e acesso

| Perfil | Papel da API | Escopo |
| --- | --- | --- |
| Administrador | `admin` | Rede inteira, contas, unidades e execuções de ML |
| Direção | `director` | Dados da escola vinculada; consulta, status de alertas e registra acompanhamentos |
| Assistência social | `social` | Alunos e alertas da escola; registra intervenções |
| Professor | `teacher` | Apenas turmas atribuídas; registra chamada e notas |

Todas as rotas de negócio exigem `Authorization: Bearer <token>`. O servidor recarrega o estado do usuário no banco a cada requisição, então contas desativadas perdem acesso sem aguardar o token expirar.

## Rotas principais

- `POST /api/v1/auth/login`, `GET/PATCH /api/v1/auth/me`
- `GET /api/v1/schools`, `GET/POST /api/v1/users`, `PATCH /api/v1/users/:id/status`
- `GET/POST /api/v1/classes`, `PATCH /api/v1/classes/:id/status`, `GET /api/v1/classes/:id/alunos`
- `POST /api/v1/classes/:id/alunos`, `DELETE /api/v1/classes/:id/alunos/:studentId` (encerra a matrícula sem apagar chamadas ou notas)
- `GET /api/v1/classes/:id/matriculas` (matrículas atuais e períodos encerrados; administrador e direção)
- `POST /api/v1/classes/:id/lotacoes`, `PATCH /api/v1/classes/:id/lotacoes/:lotacaoId/status`
- `GET/POST /api/v1/students`, `GET /api/v1/students/:id`
- `GET /api/v1/students/:id/historico-academico` (notas agrupadas por matéria e ano, médias das quatro avaliações e frequência consolidada)
- `PATCH /api/v1/students/:id`, `GET /api/v1/students/:id/auditoria`
- `GET/POST /api/v1/students/:id/responsaveis`, `PATCH/DELETE /api/v1/students/:id/responsaveis/:responsavelId`
- `GET /api/v1/attendance`, `PUT /api/v1/attendance` (exige chamada completa da turma e não permite datas futuras)
- `GET /api/v1/grades`, `PUT/DELETE /api/v1/grades` (quatro avaliações fixas; consulta também retorna média parcial, quantidade de avaliações e média final após a quarta nota)
- `GET /api/v1/alerts`, `PATCH /api/v1/alerts/:id/status`
- `GET/POST /api/v1/interventions`
- `GET/POST /api/v1/ml/runs`

## PostgreSQL e dados demonstrativos

As migrações versionadas ficam em `src/db/migrations`. O cadastro comum fica em `USUARIO`; `ADMINISTRADOR`, `DIRETOR`, `PROFESSOR` e `ASSISTENTE_SOCIAL` guardam os perfis e vínculos específicos. `DISCIPLINA` cataloga disciplinas e `LOTACAO` relaciona professor, turma, disciplina e ano letivo. `RESPONSAVEL` e `ALUNO_RESPONSAVEL` mantêm os contatos e o parentesco dos responsáveis vinculados aos alunos. `AUDITORIA_ALUNO` registra alterações no cadastro. `ALUNO_TURMA.data_saida` encerra uma matrícula sem apagar dados escolares; quando o aluno volta à mesma turma, a matrícula encerrada é copiada para `HISTORICO_MATRICULA_TURMA` antes de reativar o vínculo atual. A migração `006_historico_matricula_turma.sql` adiciona esse histórico. Chamada e nota continuam preservadas. No SQL do projeto, tabelas e colunas são escritas em português e maiúsculo sem aspas. O PostgreSQL normaliza identificadores sem aspas para minúsculas internamente. O histórico de versões fica em `MIGRACAO_ESQUEMA`. Para aplicar mudanças, acrescente uma migração numerada em `src/db/migrations`; o script `src/db/migrate.js` aplica os arquivos em ordem. `npm run db:seed` só funciona com `SEED_DEMO=true` e fora de produção. As contas demonstrativas compartilham a senha `123456`; use somente localmente e nunca reutilize em produção.

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

Versões, estado da execução e previsões ficam registrados em `EXECUCAO_MODELO` e `ALERTA`. Sem `ML_SERVICE_URL`, a rota informa que o modelo ainda não está configurado e não fabrica previsões. A API mantém nomes em inglês no contrato HTTP para compatibilidade com o front-end e converte esses valores para o esquema físico em português.

## Limites do protótipo

As credenciais de demonstração e os dados fictícios servem apenas ao desenvolvimento local. Configure TLS, segredo JWT forte, backup e restauração do banco, política de retenção, logging apropriado e validação de permissões antes de produção. As regras de perfil existem no servidor; não dependa apenas das proteções do React.
