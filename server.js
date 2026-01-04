import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const state = {
  apiLoaded: false,
  apiError: null,
  webPath: null,
};

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function findApiBuild() {
  const candidates = [
    path.join(__dirname, 'api-dist', 'index.js'),
    path.join(__dirname, 'apps', 'api', 'dist', 'index.js'),
    path.join(process.cwd(), 'api-dist', 'index.js'),
    path.join(process.cwd(), 'apps', 'api', 'dist', 'index.js'),
    path.join(process.cwd(), 'public_html', 'api-dist', 'index.js'),
    path.join(process.cwd(), 'public_html', 'apps', 'api', 'dist', 'index.js'),
  ];

  for (const absPath of candidates) {
    if (exists(absPath)) return absPath;
  }
  console.error('[startup] API build não encontrado. Caminhos tentados:');
  candidates.forEach((c) => console.error(' -', c));
  return null;
}

function findWebBuild() {
  const candidates = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'apps', 'web', 'dist', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
    path.join(process.cwd(), 'public_html', 'dist', 'index.html'),
    path.join(process.cwd(), 'public_html', 'apps', 'web', 'dist', 'index.html'),
  ];

  for (const indexFile of candidates) {
    if (exists(indexFile)) {
      return { dir: path.dirname(indexFile), indexFile };
    }
  }

  console.error('[startup] WEB build não encontrado. Caminhos tentados:');
  candidates.forEach((c) => console.error(' -', c));
  return { dir: null, indexFile: null };
}

async function loadApiApp() {
  const apiBuildAbsPath = findApiBuild();
  if (!apiBuildAbsPath) {
    state.apiError = 'API build ausente';
    return null;
  }

  try {
    const apiUrl = pathToFileURL(apiBuildAbsPath).href;
    const mod = await import(apiUrl);
    const apiApp = mod.app ?? mod.default;
    if (!apiApp) {
      throw new Error('API build carregou, mas não exporta `app` nem `default`');
    }
    state.apiLoaded = true;
    state.apiError = null;
    console.log('[startup] API carregada com sucesso de', apiBuildAbsPath);
    return apiApp;
  } catch (error) {
    state.apiError = error instanceof Error ? error.message : String(error);
    console.error(`[startup] API falhou ao carregar, web seguirá online: ${state.apiError}`);
    return null;
  }
}

async function start() {
  const web = findWebBuild();
  if (web.indexFile) {
    state.webPath = web.indexFile;
  }

  const server = express();
  server.disable('x-powered-by');

  server.get('/health', (_req, res) => {
    res.json({
      ok: true,
      apiLoaded: state.apiLoaded,
      apiError: state.apiError,
      nodeVersion: process.version,
      cwd: process.cwd(),
      dirname: __dirname,
      webFound: Boolean(web.indexFile),
      webPath: web.indexFile,
    });
  });

  const apiApp = await loadApiApp();
  if (apiApp) {
    server.use(apiApp);
  }

  if (web.dir && web.indexFile) {
    server.use(express.static(web.dir));
    server.get('*', (_req, res) => {
      res.sendFile(web.indexFile);
    });
  } else {
    server.get('*', (_req, res) => {
      res.status(500).type('text').send('WEB build não encontrado. Execute `npm run build`.');
    });
  }

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
