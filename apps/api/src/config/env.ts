import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const cwd = process.cwd();
const envFiles = [
  process.env.API_ENV_FILE,
  path.resolve(cwd, 'apps/api/.env'),
  path.resolve(cwd, '.env'),
].filter(Boolean);

for (const file of envFiles) {
  dotenv.config({ path: file });
}

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DB_HOST: z.string().default(''),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default(''),
  DB_USER: z.string().default(''),
  DB_PASS: z.string().default(''),
  WEB_ORIGIN: z.string().default('*'),
  AUTH_ENABLED: z.string().default('false'),
  AUTH_EMAIL: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('[env] Variáveis inválidas, usando defaults:', parsed.error.errors);
}

const data = parsed.success ? parsed.data : envSchema.parse({});

export const env = {
  ...data,
  AUTH_ENABLED: data.AUTH_ENABLED === 'true',
};
