import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDistDir = path.join(__dirname, "dist");
const webIndexFile = path.join(webDistDir, "index.html");

const state = {
  apiLoaded: false,
  apiError: null,
};

function ensureBuildExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[startup] ${label} não encontrado: ${filePath}`);
    console.error('[startup] Rode `npm run build` para gerar os artefatos.');
    return false;
  }
  return true;
}

async function loadApiApp() {
  const apiBuildAbsPath = path.join(__dirname, 'apps', 'api', 'dist', 'index.js');

  if (!ensureBuildExists(apiBuildAbsPath, 'Build da API (apps/api/dist/index.js)')) {
    state.apiError = 'API build ausente';
    console.error('[startup] API falhou (build ausente). Web seguirá online.');
    return null;
  }

  try {
    const apiUrl = pathToFileURL(apiBuildAbsPath).href;
    const mod = await import(apiUrl);
    const apiApp = mod.app ?? mod.default;
    if (!apiApp) {
      throw new Error('API build carregou, mas não exporta `app` nem `default` (apps/api/src/index.ts)');
    }
    state.apiLoaded = true;
    state.apiError = null;
    console.log('[startup] API carregada com sucesso.');
    return apiApp;
  } catch (error) {
    state.apiError = error instanceof Error ? error.message : String(error);
    console.error(`[startup] API falhou ao carregar, web seguirá online: ${state.apiError}`);
    return null;
  }
}

async function start() {
  // Verifica build do web
  if (!ensureBuildExists(webDistDir, 'Pasta do build WEB')) {
    // segue rodando para servir health, mas avisando que o build não existe
  }
  if (fs.existsSync(webDistDir) && !ensureBuildExists(webIndexFile, 'WEB index.html')) {
    // segue rodando
  }

  const server = express();
  server.disable('x-powered-by');

  // Health check (sem tocar no banco)
  server.get('/health', (_req, res) => {
    res.json({
      ok: true,
      apiLoaded: state.apiLoaded,
      apiError: state.apiError,
      nodeVersion: process.version,
    });
  });

  // API (tenta carregar; se falhar, não derruba o processo)
  const apiApp = await loadApiApp();
  if (apiApp) {
    server.use(apiApp);
  }

  // Frontend estático
  server.use(express.static(webDistDir));

  // SPA fallback
  server.get('*', (_req, res) => {
    if (fs.existsSync(webIndexFile)) {
      res.sendFile(webIndexFile);
      return;
    }
    res.status(500).type('text').send('WEB build não encontrado. Execute `npm run build`.');
  });

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[web+api] rodando na porta ${PORT}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

start().catch((error) => {
  console.error('[startup] Erro fatal', error);
  process.exit(1);
});
