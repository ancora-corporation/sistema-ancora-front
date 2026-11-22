CREATE TABLE IF NOT EXISTS RESPONSAVEL (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  possui_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ALUNO_RESPONSAVEL (
  id_aluno UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  id_responsavel UUID NOT NULL REFERENCES RESPONSAVEL(id) ON DELETE CASCADE,
  parentesco TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_aluno, id_responsavel),
  CONSTRAINT aluno_responsavel_parentesco_nao_vazio CHECK (btrim(parentesco) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS indice_aluno_um_responsavel_principal
  ON ALUNO_RESPONSAVEL (id_aluno) WHERE principal;
CREATE INDEX IF NOT EXISTS indice_aluno_responsavel_responsavel
  ON ALUNO_RESPONSAVEL (id_responsavel, id_aluno);
