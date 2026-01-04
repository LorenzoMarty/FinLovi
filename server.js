import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDistDir = path.join(__dirname, "apps", "web", "dist");
const webIndexFile = path.join(webDistDir, "index.html");

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[startup] ${label} não encontrado: ${filePath}`);
    console.error(
      "[startup] Verifique se o build rodou com sucesso: `npm run build`"
    );
    return false;
  }
  return true;
}

async function loadApiApp() {
  // Resolve caminho absoluto e importa via file:// para evitar problemas no deploy (Linux/Hostinger)
  const apiBuildAbsPath = path.join(__dirname, "apps", "api", "dist", "index.js");

  if (!assertFileExists(apiBuildAbsPath, "Build da API (apps/api/dist/index.js)")) {
    throw new Error("Build da API ausente");
  }

  try {
    const apiUrl = pathToFileURL(apiBuildAbsPath).href;
    const mod = await import(apiUrl);

    const apiApp = mod.app ?? mod.default;
    if (!apiApp) {
      throw new Error(
        "API build carregou, mas não exporta `app` nem `default` (verifique apps/api/src/index.ts)"
      );
    }

    return apiApp;
  } catch (error) {
    console.error(
      "[startup] Falha ao carregar API build (apps/api/dist/index.js).",
      error
    );
    throw error;
  }
}

async function start() {
  // Valida web build antes de subir
  if (!fs.existsSync(webDistDir)) {
    console.error(`[startup] Pasta do build WEB não encontrada: ${webDistDir}`);
    console.error("[startup] Rode `npm run build` e garanta que o Vite gerou /dist.");
  } else if (!fs.existsSync(webIndexFile)) {
    console.error(`[startup] index.html do build WEB não encontrado: ${webIndexFile}`);
    console.error("[startup] Rode `npm run build:web` ou `npm run build`.");
  }

  const server = express();
  server.disable("x-powered-by");

  // Health check simples (sem tocar em banco) para a plataforma
  server.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // API primeiro (para rotas /api etc)
  const apiApp = await loadApiApp();
  server.use(apiApp);

  // Arquivos estáticos do front
  server.use(express.static(webDistDir));

  // SPA fallback
  server.get("*", (_req, res) => {
    if (fs.existsSync(webIndexFile)) {
      res.sendFile(webIndexFile);
      return;
    }
    // Se não existe build do web, ao menos responda algo (evita 503 por erro de sendFile)
    res
      .status(500)
      .type("text")
      .send("WEB build não encontrado. Execute `npm run build`.");
  });

  const PORT = Number(process.env.PORT) || 3000;

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[web+api] rodando na porta ${PORT}`);
  });
}

start().catch((error) => {
  console.error("[startup] Erro fatal", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
