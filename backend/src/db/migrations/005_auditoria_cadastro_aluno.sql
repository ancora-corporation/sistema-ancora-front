ALTER TABLE ALUNO
  ADD COLUMN IF NOT EXISTS bairro_aluno TEXT,
  ADD COLUMN IF NOT EXISTS renda_familiar NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS situacao_aluno TEXT NOT NULL DEFAULT 'matriculado',
  ADD COLUMN IF NOT EXISTS data_saida DATE,
  ADD COLUMN IF NOT EXISTS atualizado_por UUID REFERENCES USUARIO(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'aluno_renda_familiar_nao_negativa'
      AND conrelid = 'aluno'::regclass
  ) THEN
    ALTER TABLE ALUNO ADD CONSTRAINT aluno_renda_familiar_nao_negativa
      CHECK (renda_familiar IS NULL OR renda_familiar >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'aluno_situacao_valida'
      AND conrelid = 'aluno'::regclass
  ) THEN
    ALTER TABLE ALUNO ADD CONSTRAINT aluno_situacao_valida
      CHECK (situacao_aluno IN ('matriculado', 'transferido', 'concluido', 'evadido', 'inativo'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS AUDITORIA_ALUNO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno UUID NOT NULL REFERENCES ALUNO(id) ON DELETE CASCADE,
  id_usuario UUID NOT NULL REFERENCES USUARIO(id) ON DELETE RESTRICT,
  campo TEXT NOT NULL,
  valor_anterior JSONB,
  valor_novo JSONB,
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS indice_auditoria_aluno_data
  ON AUDITORIA_ALUNO (id_aluno, alterado_em DESC);
CREATE INDEX IF NOT EXISTS indice_auditoria_usuario_data
  ON AUDITORIA_ALUNO (id_usuario, alterado_em DESC);
