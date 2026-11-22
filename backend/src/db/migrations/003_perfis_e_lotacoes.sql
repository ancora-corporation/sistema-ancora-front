-- Perfis especializados vinculados ao cadastro único de USUARIO.
CREATE TABLE IF NOT EXISTS ADMINISTRADOR (
  id_usuario UUID PRIMARY KEY REFERENCES USUARIO(id) ON DELETE CASCADE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS DIRETOR (
  id_usuario UUID PRIMARY KEY REFERENCES USUARIO(id) ON DELETE CASCADE,
  id_escola UUID NOT NULL REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS PROFESSOR (
  id_usuario UUID PRIMARY KEY REFERENCES USUARIO(id) ON DELETE CASCADE,
  id_escola UUID NOT NULL REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  registro_funcional TEXT,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ASSISTENTE_SOCIAL (
  id_usuario UUID PRIMARY KEY REFERENCES USUARIO(id) ON DELETE CASCADE,
  id_escola UUID NOT NULL REFERENCES ESCOLA(id) ON DELETE RESTRICT,
  registro_profissional TEXT,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS indice_diretor_escola ON DIRETOR (id_escola);
CREATE INDEX IF NOT EXISTS indice_professor_escola ON PROFESSOR (id_escola);
CREATE INDEX IF NOT EXISTS indice_assistente_escola ON ASSISTENTE_SOCIAL (id_escola);
CREATE UNIQUE INDEX IF NOT EXISTS indice_professor_registro_funcional
  ON PROFESSOR (registro_funcional) WHERE registro_funcional IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS indice_assistente_registro_profissional
  ON ASSISTENTE_SOCIAL (registro_profissional) WHERE registro_profissional IS NOT NULL;

CREATE OR REPLACE FUNCTION validar_perfil_usuario_unico() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF upper(TG_TABLE_NAME) <> 'ADMINISTRADOR' AND EXISTS (SELECT 1 FROM ADMINISTRADOR WHERE id_usuario = NEW.id_usuario) THEN
    RAISE EXCEPTION 'O usuário já possui outro perfil especializado.' USING ERRCODE = '23505';
  END IF;
  IF upper(TG_TABLE_NAME) <> 'DIRETOR' AND EXISTS (SELECT 1 FROM DIRETOR WHERE id_usuario = NEW.id_usuario) THEN
    RAISE EXCEPTION 'O usuário já possui outro perfil especializado.' USING ERRCODE = '23505';
  END IF;
  IF upper(TG_TABLE_NAME) <> 'PROFESSOR' AND EXISTS (SELECT 1 FROM PROFESSOR WHERE id_usuario = NEW.id_usuario) THEN
    RAISE EXCEPTION 'O usuário já possui outro perfil especializado.' USING ERRCODE = '23505';
  END IF;
  IF upper(TG_TABLE_NAME) <> 'ASSISTENTE_SOCIAL' AND EXISTS (SELECT 1 FROM ASSISTENTE_SOCIAL WHERE id_usuario = NEW.id_usuario) THEN
    RAISE EXCEPTION 'O usuário já possui outro perfil especializado.' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validar_perfil_administrador
  BEFORE INSERT OR UPDATE ON ADMINISTRADOR FOR EACH ROW EXECUTE FUNCTION validar_perfil_usuario_unico();
CREATE TRIGGER validar_perfil_diretor
  BEFORE INSERT OR UPDATE ON DIRETOR FOR EACH ROW EXECUTE FUNCTION validar_perfil_usuario_unico();
CREATE TRIGGER validar_perfil_professor
  BEFORE INSERT OR UPDATE ON PROFESSOR FOR EACH ROW EXECUTE FUNCTION validar_perfil_usuario_unico();
CREATE TRIGGER validar_perfil_assistente_social
  BEFORE INSERT OR UPDATE ON ASSISTENTE_SOCIAL FOR EACH ROW EXECUTE FUNCTION validar_perfil_usuario_unico();

-- Migra as contas existentes para as entidades especializadas.
INSERT INTO ADMINISTRADOR (id_usuario)
SELECT id FROM USUARIO WHERE perfil = 'administrador'
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO DIRETOR (id_usuario, id_escola)
SELECT id, escola_id FROM USUARIO WHERE perfil = 'diretor' AND escola_id IS NOT NULL
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO PROFESSOR (id_usuario, id_escola, registro_funcional)
SELECT id, escola_id, numero_registro FROM USUARIO WHERE perfil = 'professor' AND escola_id IS NOT NULL
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO ASSISTENTE_SOCIAL (id_usuario, id_escola, registro_profissional)
SELECT id, escola_id, numero_registro FROM USUARIO WHERE perfil = 'assistente_social' AND escola_id IS NOT NULL
ON CONFLICT (id_usuario) DO NOTHING;

CREATE TABLE IF NOT EXISTS DISCIPLINA (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO DISCIPLINA (nome)
SELECT DISTINCT btrim(disciplina)
FROM TURMA_DISCIPLINA_PROFESSOR
WHERE btrim(disciplina) <> ''
ON CONFLICT (nome) DO NOTHING;

CREATE TABLE IF NOT EXISTS LOTACAO (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_professor UUID NOT NULL REFERENCES PROFESSOR(id_usuario) ON DELETE RESTRICT,
  id_turma UUID NOT NULL REFERENCES TURMA(id) ON DELETE CASCADE,
  id_disciplina UUID NOT NULL REFERENCES DISCIPLINA(id) ON DELETE RESTRICT,
  ano_letivo SMALLINT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_professor, id_turma, id_disciplina, ano_letivo)
);

INSERT INTO LOTACAO (id_professor, id_turma, id_disciplina, ano_letivo)
SELECT legado.professor_id, legado.turma_id, d.id, t.ano_letivo
FROM TURMA_DISCIPLINA_PROFESSOR legado
JOIN TURMA t ON t.id = legado.turma_id
JOIN PROFESSOR p ON p.id_usuario = legado.professor_id AND p.id_escola = t.escola_id
JOIN DISCIPLINA d ON d.nome = btrim(legado.disciplina)
ON CONFLICT (id_professor, id_turma, id_disciplina, ano_letivo) DO NOTHING;

CREATE INDEX IF NOT EXISTS indice_lotacao_professor ON LOTACAO (id_professor, ativa, ano_letivo);
CREATE INDEX IF NOT EXISTS indice_lotacao_turma ON LOTACAO (id_turma, ativa);

-- Novos registros de chamada e nota apontam à lotação específica.
ALTER TABLE CHAMADA ADD COLUMN IF NOT EXISTS id_lotacao UUID REFERENCES LOTACAO(id) ON DELETE RESTRICT;
ALTER TABLE NOTA ADD COLUMN IF NOT EXISTS id_lotacao UUID REFERENCES LOTACAO(id) ON DELETE RESTRICT;

UPDATE CHAMADA c SET id_lotacao = l.id
FROM LOTACAO l
WHERE c.id_lotacao IS NULL AND l.id_turma = c.turma_id
  AND (l.id_professor = c.registrada_por OR NOT EXISTS (
    SELECT 1 FROM LOTACAO preferida
    WHERE preferida.id_turma = c.turma_id AND preferida.id_professor = c.registrada_por
  ))
  AND l.id = (
    SELECT primeira.id FROM LOTACAO primeira
    WHERE primeira.id_turma = c.turma_id
      AND (primeira.id_professor = c.registrada_por OR NOT EXISTS (
        SELECT 1 FROM LOTACAO preferida
        WHERE preferida.id_turma = c.turma_id AND preferida.id_professor = c.registrada_por
      ))
    ORDER BY primeira.id LIMIT 1
  );

UPDATE NOTA n SET id_lotacao = l.id
FROM LOTACAO l JOIN DISCIPLINA d ON d.id = l.id_disciplina
WHERE n.id_lotacao IS NULL AND l.id_turma = n.turma_id AND d.nome = n.disciplina
  AND (l.id_professor = n.registrada_por OR NOT EXISTS (
    SELECT 1 FROM LOTACAO preferida
    WHERE preferida.id_turma = n.turma_id AND preferida.id_professor = n.registrada_por
      AND preferida.id_disciplina = l.id_disciplina
  ))
  AND l.id = (
    SELECT primeira.id FROM LOTACAO primeira
    JOIN DISCIPLINA primeira_disciplina ON primeira_disciplina.id = primeira.id_disciplina
    WHERE primeira.id_turma = n.turma_id AND primeira_disciplina.nome = n.disciplina
      AND (primeira.id_professor = n.registrada_por OR NOT EXISTS (
        SELECT 1 FROM LOTACAO preferida
        WHERE preferida.id_turma = n.turma_id AND preferida.id_professor = n.registrada_por
          AND preferida.id_disciplina = primeira.id_disciplina
      ))
    ORDER BY primeira.id LIMIT 1
  );

ALTER TABLE CHAMADA DROP CONSTRAINT IF EXISTS chamada_turma_id_data_aula_key;
CREATE UNIQUE INDEX IF NOT EXISTS indice_chamada_lotacao_data
  ON CHAMADA (id_lotacao, data_aula) WHERE id_lotacao IS NOT NULL;

CREATE INDEX IF NOT EXISTS indice_nota_lotacao_periodo ON NOTA (id_lotacao, periodo);

-- Remove o vínculo antigo professor/turma/texto após a migração para LOTACAO.
DROP TABLE IF EXISTS TURMA_DISCIPLINA_PROFESSOR;

-- As entidades especializadas passam a ser a fonte única para papel e escola do usuário.
ALTER TABLE USUARIO DROP CONSTRAINT IF EXISTS usuario_check;
ALTER TABLE USUARIO DROP CONSTRAINT IF EXISTS usuario_check1;
ALTER TABLE USUARIO DROP COLUMN IF EXISTS perfil;
ALTER TABLE USUARIO DROP COLUMN IF EXISTS escola_id;
ALTER TABLE USUARIO DROP COLUMN IF EXISTS numero_registro;
