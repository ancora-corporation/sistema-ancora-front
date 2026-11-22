CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ESCOLA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_escola TEXT NOT NULL,
  codigo_escola TEXT NOT NULL UNIQUE,
  bairro_escola TEXT NOT NULL,
  status_escola BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS USUARIO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  nome_usuario TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  numero_registro TEXT UNIQUE,
  telefone TEXT,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL
    CHECK (perfil IN ('administrador', 'diretor', 'assistente_social', 'professor')),
  status_usuario BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (perfil = 'administrador' OR escola_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS TURMA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  nome_turma TEXT NOT NULL,
  ano_serie TEXT NOT NULL,
  turno TEXT NOT NULL
    CHECK (turno IN ('manha', 'tarde', 'noite')),
  ano_letivo SMALLINT NOT NULL,
  status_turma BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (escola_id, nome_turma, ano_letivo)
);

CREATE TABLE IF NOT EXISTS ALUNO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  matricula BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  nome_aluno TEXT NOT NULL,
  data_nascimento DATE,
  status_aluno BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ALUNO_TURMA (
  turma_id UUID NOT NULL REFERENCES TURMA(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (turma_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS TURMA_DISCIPLINA_PROFESSOR (
  turma_id UUID NOT NULL REFERENCES TURMA(id) ON DELETE CASCADE,
  disciplina TEXT NOT NULL,
  professor_id UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
  PRIMARY KEY (turma_id, disciplina, professor_id)
);

CREATE TABLE IF NOT EXISTS CHAMADA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES TURMA(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  registrada_por UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turma_id, data_aula)
);

CREATE TABLE IF NOT EXISTS REGISTRO_CHAMADA (
  chamada_id UUID NOT NULL REFERENCES CHAMADA(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  situacao TEXT NOT NULL
    CHECK (situacao IN ('presente', 'ausente', 'falta_justificada')),
  observacao TEXT,
  marcado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chamada_id, aluno_id)
);

CREATE TABLE IF NOT EXISTS NOTA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES TURMA(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  disciplina TEXT NOT NULL,
  avaliacao TEXT NOT NULL,
  periodo TEXT NOT NULL,
  valor NUMERIC(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 10),
  registrada_por UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turma_id, aluno_id, disciplina, avaliacao, periodo)
);

CREATE TABLE IF NOT EXISTS EXECUCAO_MODELO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_modelo TEXT NOT NULL,
  versao_modelo TEXT,
  situacao TEXT NOT NULL
    CHECK (situacao IN ('na_fila', 'em_execucao', 'concluida', 'falhou')),
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizada_em TIMESTAMPTZ,
  resumo_entrada JSONB NOT NULL DEFAULT '{}'::jsonb,
  resumo_saida JSONB NOT NULL DEFAULT '{}'::jsonb,
  mensagem_erro TEXT
);

CREATE TABLE IF NOT EXISTS ALERTA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('frequencia', 'nota', 'combinado', 'manual')),
  situacao TEXT NOT NULL DEFAULT 'novo'
    CHECK (situacao IN ('novo', 'em_acompanhamento', 'resolvido', 'atrasado')),
  nivel_risco TEXT NOT NULL
    CHECK (nivel_risco IN ('baixo', 'medio', 'alto')),
  pontuacao_risco NUMERIC(5,4)
    CHECK (pontuacao_risco >= 0 AND pontuacao_risco <= 1),
  origem TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('manual', 'modelo_ml')),
  versao_modelo TEXT,
  resumo TEXT NOT NULL,
  prazo DATE,
  execucao_modelo_id UUID
    REFERENCES EXECUCAO_MODELO(id) ON DELETE SET NULL,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS INTERVENCAO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id UUID REFERENCES ALERTA(id) ON DELETE SET NULL,
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  registrada_por UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
  data_ocorrencia DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  resultado TEXT,
  data_retorno DATE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS indice_aluno_escola_status
  ON ALUNO (escola_id, status_aluno);

CREATE INDEX IF NOT EXISTS indice_turma_status
  ON TURMA (status_turma);

CREATE INDEX IF NOT EXISTS indice_turma_professor
  ON TURMA_DISCIPLINA_PROFESSOR (professor_id, turma_id);

CREATE INDEX IF NOT EXISTS indice_chamada_data_turma
  ON CHAMADA (data_aula DESC, turma_id);

CREATE INDEX IF NOT EXISTS indice_alerta_situacao_registro
  ON ALERTA (situacao, registro DESC);

CREATE INDEX IF NOT EXISTS indice_alerta_aluno
  ON ALERTA (aluno_id, registro DESC);

CREATE INDEX IF NOT EXISTS indice_alerta_execucao_modelo
  ON ALERTA (execucao_modelo_id)
  WHERE execucao_modelo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS indice_intervencao_aluno
  ON INTERVENCAO (aluno_id, registro DESC);

CREATE TABLE IF NOT EXISTS MIGRACAO_ESQUEMA (
  versao TEXT PRIMARY KEY,
  aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
