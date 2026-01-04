import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { routes } from './routes/index.js';

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

export { app };
