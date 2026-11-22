ALTER TABLE ESCOLA
  ADD COLUMN IF NOT EXISTS diretor_responsavel_id UUID
  REFERENCES USUARIO(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS indice_escola_diretor
  ON ESCOLA (diretor_responsavel_id)
  WHERE diretor_responsavel_id IS NOT NULL;
