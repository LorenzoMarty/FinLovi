import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function findWebDist() {
  // Candidatos comuns em Hostinger/cPanel e em monorepo
  const candidates = [
    // 1) ao lado do server.js (recomendado)
    path.join(__dirname, "dist"),
    // 2) monorepo padrão
    path.join(__dirname, "apps", "web", "dist"),
    // 3) relativo ao diretório de execução do processo
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "apps", "web", "dist"),
    // 4) alguns ambientes executam dentro de public_html
    path.join(process.cwd(), "public_html", "dist"),
    path.join(process.cwd(), "public_html", "apps", "web", "dist"),
  ];

  for (const dir of candidates) {
    const indexFile = path.join(dir, "index.html");
    if (exists(indexFile)) {
      return { dir, indexFile };
    }
  }

  // log detalhado para diagnosticar
  console.error("[startup] WEB build não encontrado. Candidatos tentados:");
  for (const dir of candidates) console.error(" -", path.join(dir, "index.html"));
  console.error("[startup] __dirname =", __dirname);
  console.error("[startup] process.cwd() =", process.cwd());

  return { dir: null, indexFile: null };
}

async function start() {
  const server = express();
  server.disable("x-powered-by");

  // Endpoint de diagnóstico do caminho
  server.get("/health", (_req, res) => {
    const web = findWebDist();
    res.json({
      ok: true,
      node: process.version,
      cwd: process.cwd(),
      dirname: __dirname,
      webDist: web.dir,
      webIndex: web.indexFile,
      webFound: Boolean(web.indexFile),
    });
  });

  const web = findWebDist();

  if (web.dir && web.indexFile) {
    server.use(express.static(web.dir));
    server.get("*", (_req, res) => res.sendFile(web.indexFile));
  } else {
    server.get("*", (_req, res) =>
      res.status(500).type("text").send("WEB build não encontrado. Execute `npm run build`.")
    );
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[web] rodando na porta ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[startup] Erro fatal", err);
  process.exit(1);
});
