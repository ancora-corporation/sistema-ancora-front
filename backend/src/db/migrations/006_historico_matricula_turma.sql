ALTER TABLE ALUNO_TURMA
  ADD COLUMN IF NOT EXISTS data_saida DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'aluno_turma_data_saida_valida'
      AND conrelid = 'aluno_turma'::regclass
  ) THEN
    ALTER TABLE ALUNO_TURMA ADD CONSTRAINT aluno_turma_data_saida_valida
      CHECK (data_saida IS NULL OR data_saida >= data_matricula);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS indice_aluno_turma_matricula_ativa
  ON ALUNO_TURMA (aluno_id, turma_id) WHERE data_saida IS NULL;

CREATE TABLE IF NOT EXISTS HISTORICO_MATRICULA_TURMA (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES TURMA(id) ON DELETE RESTRICT,
  aluno_id UUID NOT NULL REFERENCES ALUNO(id) ON DELETE RESTRICT,
  data_matricula DATE NOT NULL,
  data_saida DATE NOT NULL,
  arquivada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (data_saida >= data_matricula)
);

CREATE INDEX IF NOT EXISTS indice_historico_matricula_aluno
  ON HISTORICO_MATRICULA_TURMA (aluno_id, data_saida DESC);
