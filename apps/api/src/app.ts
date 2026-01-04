import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { routes } from './routes/index.js';
import { db } from './config/db.js';

const app = express();

app.use(
  cors({
    origin: env.WEB_ORIGIN === '*' ? true : env.WEB_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX,
  }),
);
app.use(pinoHttp());

app.use('/api', routes);

app.use(errorHandler);

// Tenta conectar ao banco na inicialização; se falhar, apenas registra e continua.
async function warmupDb() {
  try {
    await db.query('SELECT 1');
    console.log('[db] conexão OK');
  } catch (err) {
    console.warn('[db] falha na conexão inicial (continua rodando)', err instanceof Error ? err.message : err);
  }
}
void warmupDb();

export { app };
