import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_DEMO: z.string().default('false'),
  ML_SERVICE_URL: z.string().url().optional().or(z.literal('')),
  ML_SERVICE_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Configuração inválida:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
