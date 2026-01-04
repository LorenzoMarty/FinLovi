import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
server.disable("x-powered-by");

const webDistDir = path.join(__dirname, "apps", "web", "dist");
const webIndexFile = path.join(webDistDir, "index.html");

server.get("/health", (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    cwd: process.cwd(),
    dirname: __dirname,
    hasWebDist: fs.existsSync(webDistDir),
    hasIndex: fs.existsSync(webIndexFile),
    envPort: process.env.PORT ?? null,
  });
});

server.use(express.static(webDistDir));

server.get("*", (_req, res) => {
  if (fs.existsSync(webIndexFile)) return res.sendFile(webIndexFile);
  return res.status(500).type("text").send("WEB dist/index.html não encontrado.");
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`[web-only] ${PORT}`));
