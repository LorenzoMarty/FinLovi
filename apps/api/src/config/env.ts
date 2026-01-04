import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('4000'),
  DB_HOST: z.string(),
  DB_PORT: z.string().default('3306'),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASS: z.string(),
  WEB_ORIGIN: z.string().default('*'),
  AUTH_ENABLED: z.string().default('false'),
  AUTH_EMAIL: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with a clean message.
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  DB_PORT: Number(parsed.data.DB_PORT),
  AUTH_ENABLED: parsed.data.AUTH_ENABLED === 'true',
  RATE_LIMIT_WINDOW: Number(parsed.data.RATE_LIMIT_WINDOW),
  RATE_LIMIT_MAX: Number(parsed.data.RATE_LIMIT_MAX),
};
