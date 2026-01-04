  import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDistDir = path.join(__dirname, 'apps', 'web', 'dist');
const webIndexFile = path.join(webDistDir, 'index.html');

async function loadApiApp() {
  const apiBuildPath = './apps/api/dist/index.js';
  try {
    const { app } = await import(apiBuildPath);
    return app;
  } catch (error) {
    console.error('[startup] Falha ao carregar API build. Rode `npm run build` antes de iniciar.', error);
    throw error;
  }
}

async function start() {
  const server = express();
  server.disable('x-powered-by');

  const apiApp = await loadApiApp();
  server.use(apiApp);

  server.use(express.static(webDistDir));

  server.get('*', (_req, res, next) => {
    res.sendFile(webIndexFile, (err) => {
      if (err) next();
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[web+api] rodando na porta ${PORT}`);
  });
}

start().catch((error) => {
  console.error('[startup] Erro fatal', error);
  process.exit(1);
});
