# FinLovi (Monorepo)

Migração do FinLovi para uma arquitetura moderna, preservando o banco e as regras atuais.

- Frontend: React + Vite (SPA)
- Backend: Node.js + Express (API REST)
- Banco: MySQL/MariaDB existente

## Estrutura

```
/apps/web       # React + Vite
/apps/api       # Express API
/packages/shared # Tipos/validators compartilhados (zod)
```

## Requisitos

- Node.js 18+
- npm
- MySQL/MariaDB em execução

## Setup local

1) Instale dependências na raiz:

```
npm install
```

2) Configure variáveis de ambiente:

```
# API
copy apps\api\.env.example apps\api\.env
# ou defina um `.env` na raiz (usado pelo server.js em produ‡Æo)

# Web
copy apps\web\.env.example apps\web\.env
```

Preencha as credenciais do banco no `apps/api/.env`.
Se você já tem o FinLovi em PHP, use os dados de `app/config.php` como referência.

3) (Opcional) Migration de categorias

Por padrão, o sistema usa categorias padrão. Para CRUD completo de categorias, aplique:

```
mysql -u <usuario> -p < apps/api/migrations/001_create_categories.sql
```

4) Rode o projeto:

```
npm run dev
# Produ‡Æo local (API + Web na mesma porta): npm start
```

- API: `http://localhost:4000/api`
- Web: `http://localhost:5173`
  - Em modo produ‡Æo (npm start), tudo roda em `http://localhost:3000` e o front usa `/api` por padrÆo.

## Scripts

- `npm run dev` - API + Web
- `npm run build` - build API + Web
- `npm run start` - start API + preview Web
- `npm test` - testes da API

## Variáveis de ambiente (API)

```
NODE_ENV=development
PORT=4000
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASS=
WEB_ORIGIN=http://localhost:5173

# Auth opcional
AUTH_ENABLED=false
AUTH_EMAIL=
AUTH_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=

RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

## Variáveis de ambiente (Web)

```
VITE_API_URL=http://localhost:4000/api
```

## API Endpoints

Base: `/api`

### Auth (opcional)
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Transactions
- `GET /transactions` (filtros: `page`, `limit`, `type`, `category`, `from`, `to`)
- `GET /transactions/:id`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`

### Categories
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### Goals
- `GET /goals`
- `GET /goals/:id`
- `POST /goals`
- `PUT /goals/:id`
- `DELETE /goals/:id`

### Fixed Expenses
- `GET /fixed-expenses`
- `GET /fixed-expenses/upcoming?days=7`
- `GET /fixed-expenses/:id`
- `POST /fixed-expenses`
- `PUT /fixed-expenses/:id`
- `DELETE /fixed-expenses/:id`

### Dashboard
- `GET /dashboard/summary?period=current|previous|last3`

### Reports
- `GET /reports/monthly?from=YYYY-MM&to=YYYY-MM`

## Deploy

### API (Render/Railway)
- Root: `apps/api`
- Build: `npm install && npm run build`
- Start: `npm run start`
- Configure variáveis de ambiente do banco e `WEB_ORIGIN`.

### Web (static)
- Root: `apps/web`
- Build: `npm install && npm run build`
- Output: `apps/web/dist`
- Configure `VITE_API_URL` para apontar para a API em produção.

### Hostinger (Web App - Express)
- Preset: Express
- Arquivo de entrada: `server.js` (raiz do repo)
- Comando de start: `npm start` (executa `npm run build` antes de subir)
- API e Web rodam na mesma porta; configure as vari veis do banco/JWT no painel. `VITE_API_URL` pode ficar em branco (usa `/api` em produ‡Æo).

## Notas

- O banco atual é reutilizado sem alterar tabelas existentes.
- Login só é exigido se `AUTH_ENABLED=true` e credenciais forem configuradas.
