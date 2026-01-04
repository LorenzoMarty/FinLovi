// src/config/env.ts
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";
var cwd = process.cwd();
var envFiles = [
  process.env.API_ENV_FILE,
  path.resolve(cwd, "apps/api/.env"),
  path.resolve(cwd, ".env")
].filter(Boolean);
for (const file of envFiles) {
  dotenv.config({ path: file });
}
var envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4e3),
  DB_HOST: z.string().default(""),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default(""),
  DB_USER: z.string().default(""),
  DB_PASS: z.string().default(""),
  WEB_ORIGIN: z.string().default("*"),
  AUTH_ENABLED: z.string().default("false"),
  AUTH_EMAIL: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  RATE_LIMIT_WINDOW: z.coerce.number().default(6e4),
  RATE_LIMIT_MAX: z.coerce.number().default(100)
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn("[env] Vari\xE1veis inv\xE1lidas, usando defaults:", parsed.error.errors);
}
var data = parsed.success ? parsed.data : envSchema.parse({});
var env = {
  ...data,
  AUTH_ENABLED: data.AUTH_ENABLED === "true"
};

// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

// src/utils/response.ts
function ok(data2) {
  return { ok: true, data: data2 };
}
function fail(message, code, details) {
  const error = { message, code, details };
  return { ok: false, error };
}

// src/middlewares/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  const message = err instanceof Error ? err.message : "Erro interno";
  res.status(500).json(fail(message));
}

// src/routes/index.ts
import { Router as Router8 } from "express";

// src/routes/auth.ts
import { Router } from "express";
import { loginSchema } from "@finlovi/shared";

// src/middlewares/validate.ts
function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json(fail("Dados inv\xE1lidos", "VALIDATION_ERROR", result.error.flatten()));
    }
    req[target] = result.data;
    return next();
  };
}

// src/controllers/authController.ts
import jwt from "jsonwebtoken";
function ensureAuthConfig(res) {
  if (!env.AUTH_ENABLED) {
    res.status(501).json(fail("Autentica\xE7\xE3o desabilitada", "AUTH_DISABLED"));
    return false;
  }
  if (!env.JWT_SECRET || !env.AUTH_EMAIL || !env.AUTH_PASSWORD) {
    res.status(500).json(fail("Configura\xE7\xE3o de autentica\xE7\xE3o incompleta", "AUTH_CONFIG"));
    return false;
  }
  return true;
}
function login(req, res) {
  if (!ensureAuthConfig(res)) return;
  const { email, password } = req.body;
  if (email !== env.AUTH_EMAIL || password !== env.AUTH_PASSWORD) {
    res.status(401).json(fail("Credenciais inv\xE1lidas", "UNAUTHORIZED"));
    return;
  }
  const accessToken = jwt.sign({ email }, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = env.JWT_REFRESH_SECRET ? jwt.sign({ email }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" }) : null;
  res.json(ok({ accessToken, refreshToken }));
}
function refresh(req, res) {
  if (!ensureAuthConfig(res)) return;
  if (!env.JWT_REFRESH_SECRET) {
    res.status(501).json(fail("Refresh token desabilitado", "REFRESH_DISABLED"));
    return;
  }
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json(fail("Refresh token ausente", "VALIDATION_ERROR"));
    return;
  }
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ email: payload.email }, env.JWT_SECRET || "changeme", { expiresIn: "15m" });
    res.json(ok({ accessToken }));
  } catch (_err) {
    res.status(401).json(fail("Refresh token inv\xE1lido", "UNAUTHORIZED"));
  }
}
function logout(_req, res) {
  if (!env.AUTH_ENABLED) {
    res.json(ok({ message: "Logout n\xE3o necess\xE1rio" }));
    return;
  }
  res.json(ok({ message: "Logout efetuado" }));
}
function me(_req, res) {
  if (!env.AUTH_ENABLED) {
    res.json(ok({ enabled: false }));
    return;
  }
  res.json(ok({ enabled: true, email: env.AUTH_EMAIL }));
}

// src/utils/asyncHandler.ts
function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// src/routes/auth.ts
var authRoutes = Router();
authRoutes.post("/login", validate(loginSchema), asyncHandler(login));
authRoutes.post("/refresh", asyncHandler(refresh));
authRoutes.post("/logout", asyncHandler(logout));
authRoutes.get("/me", asyncHandler(me));

// src/routes/transactions.ts
import { Router as Router2 } from "express";
import { z as z2 } from "zod";
import { transactionCreateSchema, transactionTypeSchema } from "@finlovi/shared";

// src/middlewares/auth.ts
import jwt2 from "jsonwebtoken";
function requireAuth(req, res, next) {
  if (!env.AUTH_ENABLED) {
    return next();
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json(fail("Token ausente", "UNAUTHORIZED"));
  }
  const token = header.replace("Bearer ", "").trim();
  try {
    const payload = jwt2.verify(token, env.JWT_SECRET || "changeme");
    req.user = payload;
    return next();
  } catch (_err) {
    return res.status(401).json(fail("Token inv\xE1lido", "UNAUTHORIZED"));
  }
}

// src/db/pool.ts
import mysql from "mysql2/promise";
var requiredKeys = ["DB_HOST", "DB_NAME", "DB_USER"];
var missing = requiredKeys.filter((key) => !String(env[key] ?? "").trim());
if (missing.length) {
  console.warn(`[db] variaveis ausentes: ${missing.join(", ")} (conexao pode falhar)`);
}
var pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 1e4,
  decimalNumbers: true,
  charset: "utf8mb4_general_ci"
});
pool.on("error", (err) => {
  console.error("[db] pool error", err.message);
});
async function pingDb() {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: message,
      host: env.DB_HOST,
      database: env.DB_NAME
    };
  }
}

// src/utils/pagination.ts
function getPagination(page, limit) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
}

// src/repositories/transactionsRepo.ts
async function listTransactions(db, filters, limit, offset) {
  const conditions = [];
  const params = [];
  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.from) {
    conditions.push("date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push("date <= ?");
    params.push(filters.to);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total FROM transactions ${where}`,
    params
  );
  const total = countRows[0]?.total || 0;
  const [rows] = await db.execute(
    `SELECT id, description, amount, category, type, date
     FROM transactions ${where}
     ORDER BY date DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { rows, total };
}
async function getTransaction(db, id) {
  const [rows] = await db.execute(
    "SELECT id, description, amount, category, type, date FROM transactions WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}
async function createTransaction(db, payload) {
  const { description, amount, category, type, date } = payload;
  await db.execute(
    "INSERT INTO transactions (description, amount, category, type, date) VALUES (?, ?, ?, ?, ?)",
    [description, amount, category, type, date]
  );
}
async function updateTransaction(db, id, payload) {
  const { description, amount, category, type, date } = payload;
  await db.execute(
    "UPDATE transactions SET description = ?, amount = ?, category = ?, type = ?, date = ? WHERE id = ?",
    [description, amount, category, type, date, id]
  );
}
async function deleteTransaction(db, id) {
  await db.execute("DELETE FROM transactions WHERE id = ?", [id]);
}

// src/controllers/transactionsController.ts
async function list(req, res) {
  try {
    const { page, limit, type, category, from, to } = req.query;
    const { page: safePage, limit: safeLimit, offset } = getPagination(
      Number(page || 1),
      Number(limit || 20)
    );
    const { rows, total } = await listTransactions(
      pool,
      { type, category, from, to },
      safeLimit,
      offset
    );
    res.json(ok({ items: rows, total, page: safePage, limit: safeLimit }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar transacoes";
    res.status(503).json(fail("Erro ao listar transacoes", "DB_ERROR", message));
  }
}
async function get(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await getTransaction(pool, id);
    if (!row) {
      res.status(404).json(fail("Lancamento nao encontrado", "NOT_FOUND"));
      return;
    }
    res.json(ok(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar transacao";
    res.status(503).json(fail("Erro ao buscar transacao", "DB_ERROR", message));
  }
}
async function create(req, res) {
  try {
    await createTransaction(pool, req.body);
    res.status(201).json(ok({ message: "Lancamento criado" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar transacao";
    res.status(503).json(fail("Erro ao criar transacao", "DB_ERROR", message));
  }
}
async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await getTransaction(pool, id);
    if (!existing) {
      res.status(404).json(fail("Lancamento nao encontrado", "NOT_FOUND"));
      return;
    }
    await updateTransaction(pool, id, req.body);
    res.json(ok({ message: "Lancamento atualizado" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar transacao";
    res.status(503).json(fail("Erro ao atualizar transacao", "DB_ERROR", message));
  }
}
async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    await deleteTransaction(pool, id);
    res.json(ok({ message: "Lancamento removido" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover transacao";
    res.status(503).json(fail("Erro ao remover transacao", "DB_ERROR", message));
  }
}

// src/routes/transactions.ts
var querySchema = z2.object({
  page: z2.coerce.number().int().min(1).default(1),
  limit: z2.coerce.number().int().min(1).max(100).default(20),
  type: transactionTypeSchema.optional(),
  category: z2.string().optional(),
  from: z2.string().optional(),
  to: z2.string().optional()
});
var idSchema = z2.object({ id: z2.coerce.number().int().positive() });
var transactionRoutes = Router2();
transactionRoutes.get("/", requireAuth, validate(querySchema, "query"), asyncHandler(list));
transactionRoutes.get("/:id", requireAuth, validate(idSchema, "params"), asyncHandler(get));
transactionRoutes.post("/", requireAuth, validate(transactionCreateSchema), asyncHandler(create));
transactionRoutes.put(
  "/:id",
  requireAuth,
  validate(idSchema, "params"),
  validate(transactionCreateSchema),
  asyncHandler(update)
);
transactionRoutes.delete("/:id", requireAuth, validate(idSchema, "params"), asyncHandler(remove));

// src/routes/categories.ts
import { Router as Router3 } from "express";
import { z as z3 } from "zod";
import { categoryCreateSchema } from "@finlovi/shared";

// src/controllers/categoriesController.ts
import { defaultCategories } from "@finlovi/shared";

// src/repositories/categoriesRepo.ts
async function listCategories(db) {
  const [rows] = await db.execute("SELECT id, name FROM categories ORDER BY name ASC");
  return rows;
}
async function createCategory(db, payload) {
  await db.execute("INSERT INTO categories (name) VALUES (?)", [payload.name]);
}
async function updateCategory(db, id, payload) {
  await db.execute("UPDATE categories SET name = ? WHERE id = ?", [payload.name, id]);
}
async function deleteCategory(db, id) {
  await db.execute("DELETE FROM categories WHERE id = ?", [id]);
}

// src/controllers/categoriesController.ts
function isMissingTable(error) {
  return error instanceof Error && error.message.includes("categories");
}
async function list2(req, res) {
  try {
    const rows = await listCategories(pool);
    res.json(ok(rows));
  } catch (err) {
    if (isMissingTable(err)) {
      const fallback = defaultCategories.map((name, index) => ({ id: index + 1, name }));
      res.json(ok(fallback));
      return;
    }
    res.status(500).json(fail("Erro ao listar categorias"));
  }
}
async function create2(req, res) {
  try {
    await createCategory(pool, req.body);
    res.status(201).json(ok({ message: "Categoria criada" }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail("Categorias requerem migration", "MIGRATION_REQUIRED"));
      return;
    }
    res.status(500).json(fail("Erro ao criar categoria"));
  }
}
async function update2(req, res) {
  try {
    await updateCategory(pool, Number(req.params.id), req.body);
    res.json(ok({ message: "Categoria atualizada" }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail("Categorias requerem migration", "MIGRATION_REQUIRED"));
      return;
    }
    res.status(500).json(fail("Erro ao atualizar categoria"));
  }
}
async function remove2(req, res) {
  try {
    await deleteCategory(pool, Number(req.params.id));
    res.json(ok({ message: "Categoria removida" }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail("Categorias requerem migration", "MIGRATION_REQUIRED"));
      return;
    }
    res.status(500).json(fail("Erro ao remover categoria"));
  }
}

// src/routes/categories.ts
var idSchema2 = z3.object({ id: z3.coerce.number().int().positive() });
var categoryRoutes = Router3();
categoryRoutes.get("/", requireAuth, asyncHandler(list2));
categoryRoutes.post("/", requireAuth, validate(categoryCreateSchema), asyncHandler(create2));
categoryRoutes.put(
  "/:id",
  requireAuth,
  validate(idSchema2, "params"),
  validate(categoryCreateSchema),
  asyncHandler(update2)
);
categoryRoutes.delete("/:id", requireAuth, validate(idSchema2, "params"), asyncHandler(remove2));

// src/routes/fixedExpenses.ts
import { Router as Router4 } from "express";
import { z as z4 } from "zod";
import { fixedExpenseCreateSchema } from "@finlovi/shared";

// src/repositories/fixedExpensesRepo.ts
async function listFixedExpenses(db) {
  const [rows] = await db.execute(
    "SELECT id, description, amount, category, due_day FROM fixed_expenses ORDER BY due_day ASC, id DESC"
  );
  return rows;
}
async function getFixedExpense(db, id) {
  const [rows] = await db.execute(
    "SELECT id, description, amount, category, due_day FROM fixed_expenses WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}
async function createFixedExpense(db, payload) {
  const { description, amount, category, due_day } = payload;
  await db.execute(
    "INSERT INTO fixed_expenses (description, amount, category, due_day) VALUES (?, ?, ?, ?)",
    [description, amount, category, due_day]
  );
}
async function updateFixedExpense(db, id, payload) {
  const { description, amount, category, due_day } = payload;
  await db.execute(
    "UPDATE fixed_expenses SET description = ?, amount = ?, category = ?, due_day = ? WHERE id = ?",
    [description, amount, category, due_day, id]
  );
}
async function deleteFixedExpense(db, id) {
  await db.execute("DELETE FROM fixed_expenses WHERE id = ?", [id]);
}

// src/controllers/fixedExpensesController.ts
function daysUntilDue(dueDay) {
  const today = /* @__PURE__ */ new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1e3 * 60 * 60 * 24));
}
async function list3(_req, res) {
  try {
    const rows = await listFixedExpenses(pool);
    res.json(ok(rows));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar gastos fixos";
    res.status(503).json(fail("Erro ao listar gastos fixos", "DB_ERROR", message));
  }
}
async function upcoming(req, res) {
  try {
    const days = Number(req.query.days || 7);
    const rows = await listFixedExpenses(pool);
    const upcomingRows = rows.map((row) => ({ ...row, days_until_due: daysUntilDue(Number(row.due_day)) })).filter((row) => row.days_until_due <= days).sort((a, b) => a.days_until_due - b.days_until_due);
    res.json(ok(upcomingRows));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar pr\xF3ximos vencimentos";
    res.status(503).json(fail("Erro ao listar pr\xF3ximos vencimentos", "DB_ERROR", message));
  }
}
async function get2(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await getFixedExpense(pool, id);
    if (!row) {
      res.status(404).json(fail("Gasto fixo n\xE3o encontrado", "NOT_FOUND"));
      return;
    }
    res.json(ok(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar gasto fixo";
    res.status(503).json(fail("Erro ao buscar gasto fixo", "DB_ERROR", message));
  }
}
async function create3(req, res) {
  try {
    await createFixedExpense(pool, req.body);
    res.status(201).json(ok({ message: "Gasto fixo criado" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar gasto fixo";
    res.status(503).json(fail("Erro ao criar gasto fixo", "DB_ERROR", message));
  }
}
async function update3(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await getFixedExpense(pool, id);
    if (!existing) {
      res.status(404).json(fail("Gasto fixo n\xE3o encontrado", "NOT_FOUND"));
      return;
    }
    await updateFixedExpense(pool, id, req.body);
    res.json(ok({ message: "Gasto fixo atualizado" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar gasto fixo";
    res.status(503).json(fail("Erro ao atualizar gasto fixo", "DB_ERROR", message));
  }
}
async function remove3(req, res) {
  try {
    const id = Number(req.params.id);
    await deleteFixedExpense(pool, id);
    res.json(ok({ message: "Gasto fixo removido" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover gasto fixo";
    res.status(503).json(fail("Erro ao remover gasto fixo", "DB_ERROR", message));
  }
}

// src/routes/fixedExpenses.ts
var idSchema3 = z4.object({ id: z4.coerce.number().int().positive() });
var fixedExpenseRoutes = Router4();
fixedExpenseRoutes.get("/", requireAuth, asyncHandler(list3));
fixedExpenseRoutes.get("/upcoming", requireAuth, asyncHandler(upcoming));
fixedExpenseRoutes.get("/:id", requireAuth, validate(idSchema3, "params"), asyncHandler(get2));
fixedExpenseRoutes.post("/", requireAuth, validate(fixedExpenseCreateSchema), asyncHandler(create3));
fixedExpenseRoutes.put(
  "/:id",
  requireAuth,
  validate(idSchema3, "params"),
  validate(fixedExpenseCreateSchema),
  asyncHandler(update3)
);
fixedExpenseRoutes.delete("/:id", requireAuth, validate(idSchema3, "params"), asyncHandler(remove3));

// src/routes/goals.ts
import { Router as Router5 } from "express";
import { z as z5 } from "zod";
import { goalCreateSchema } from "@finlovi/shared";

// src/repositories/goalsRepo.ts
async function listGoals(db) {
  const [rows] = await db.execute(
    "SELECT id, name, target_amount, saved_amount, deadline, created_at FROM acquisition_goals ORDER BY deadline IS NULL, deadline ASC, id DESC"
  );
  return rows.map((row) => ({ ...row, deadline: row.deadline ?? null }));
}
async function getGoal(db, id) {
  const [rows] = await db.execute(
    "SELECT id, name, target_amount, saved_amount, deadline, created_at FROM acquisition_goals WHERE id = ?",
    [id]
  );
  const row = rows[0];
  return row ? { ...row, deadline: row.deadline ?? null } : null;
}
async function createGoal(db, payload) {
  const { name, target_amount, saved_amount, deadline } = payload;
  await db.execute(
    "INSERT INTO acquisition_goals (name, target_amount, saved_amount, deadline) VALUES (?, ?, ?, ?)",
    [name, target_amount, saved_amount, deadline]
  );
}
async function updateGoal(db, id, payload) {
  const { name, target_amount, saved_amount, deadline } = payload;
  await db.execute(
    "UPDATE acquisition_goals SET name = ?, target_amount = ?, saved_amount = ?, deadline = ? WHERE id = ?",
    [name, target_amount, saved_amount, deadline, id]
  );
}
async function deleteGoal(db, id) {
  await db.execute("DELETE FROM acquisition_goals WHERE id = ?", [id]);
}

// src/controllers/goalsController.ts
async function list4(_req, res) {
  try {
    const rows = await listGoals(pool);
    const enriched = rows.map((row) => ({
      ...row,
      progress: row.target_amount > 0 ? Math.min(100, Math.round(row.saved_amount / row.target_amount * 100)) : 0
    }));
    res.json(ok(enriched));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar metas";
    res.status(503).json(fail("Erro ao listar metas", "DB_ERROR", message));
  }
}
async function get3(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await getGoal(pool, id);
    if (!row) {
      res.status(404).json(fail("Meta n\xE3o encontrada", "NOT_FOUND"));
      return;
    }
    res.json(ok(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar meta";
    res.status(503).json(fail("Erro ao buscar meta", "DB_ERROR", message));
  }
}
async function create4(req, res) {
  try {
    await createGoal(pool, req.body);
    res.status(201).json(ok({ message: "Meta criada" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar meta";
    res.status(503).json(fail("Erro ao criar meta", "DB_ERROR", message));
  }
}
async function update4(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await getGoal(pool, id);
    if (!existing) {
      res.status(404).json(fail("Meta n\xE3o encontrada", "NOT_FOUND"));
      return;
    }
    await updateGoal(pool, id, req.body);
    res.json(ok({ message: "Meta atualizada" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar meta";
    res.status(503).json(fail("Erro ao atualizar meta", "DB_ERROR", message));
  }
}
async function remove4(req, res) {
  try {
    await deleteGoal(pool, Number(req.params.id));
    res.json(ok({ message: "Meta removida" }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover meta";
    res.status(503).json(fail("Erro ao remover meta", "DB_ERROR", message));
  }
}

// src/routes/goals.ts
var idSchema4 = z5.object({ id: z5.coerce.number().int().positive() });
var goalRoutes = Router5();
goalRoutes.get("/", requireAuth, asyncHandler(list4));
goalRoutes.get("/:id", requireAuth, validate(idSchema4, "params"), asyncHandler(get3));
goalRoutes.post("/", requireAuth, validate(goalCreateSchema), asyncHandler(create4));
goalRoutes.put("/:id", requireAuth, validate(idSchema4, "params"), validate(goalCreateSchema), asyncHandler(update4));
goalRoutes.delete("/:id", requireAuth, validate(idSchema4, "params"), asyncHandler(remove4));

// src/routes/dashboard.ts
import { Router as Router6 } from "express";

// src/utils/dates.ts
function getPeriodRange(period) {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (period === "previous") {
    start.setMonth(start.getMonth() - 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (period === "last3") {
    start.setMonth(start.getMonth() - 2);
  }
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

// src/controllers/dashboardController.ts
async function summary(req, res) {
  try {
    const period = String(req.query.period || "current");
    const { start, end } = getPeriodRange(period);
    const [rows] = await pool.execute(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
        SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) AS income_count,
        SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expense_count
       FROM transactions
       WHERE date BETWEEN ? AND ?`,
      [start, end]
    );
    const totals = rows?.[0] || {
      total_income: 0,
      total_expense: 0,
      income_count: 0,
      expense_count: 0
    };
    const [topRows] = await pool.execute(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [start, end]
    );
    const topCategory = topRows?.[0] || null;
    res.json(
      ok({
        period: { start, end },
        total_income: totals.total_income || 0,
        total_expense: totals.total_expense || 0,
        net: (totals.total_income || 0) - (totals.total_expense || 0),
        income_count: totals.income_count || 0,
        expense_count: totals.expense_count || 0,
        top_category: topCategory
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao calcular dashboard";
    res.status(503).json(fail("Erro ao calcular dashboard", "DB_ERROR", message));
  }
}

// src/routes/dashboard.ts
var dashboardRoutes = Router6();
dashboardRoutes.get("/summary", requireAuth, asyncHandler(summary));

// src/routes/reports.ts
import { Router as Router7 } from "express";

// src/controllers/reportsController.ts
function getDefaultRange() {
  const now = /* @__PURE__ */ new Date();
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}
async function monthly(req, res) {
  try {
    const queryFrom = req.query.from ? `${req.query.from}-01` : void 0;
    const queryTo = req.query.to ? getMonthEnd(String(req.query.to)) : void 0;
    const range = getDefaultRange();
    const from = queryFrom || range.from;
    const to = queryTo || range.to;
    const [rows] = await pool.execute(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
       FROM transactions
       WHERE date BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month ASC`,
      [from, to]
    );
    res.json(ok(rows));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar relat\xF3rio";
    res.status(503).json(fail("Erro ao gerar relat\xF3rio", "DB_ERROR", message));
  }
}
function getMonthEnd(value) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return `${value}-31`;
  const end = new Date(year, month, 0);
  return end.toISOString().slice(0, 10);
}

// src/routes/reports.ts
var reportRoutes = Router7();
reportRoutes.get("/monthly", requireAuth, asyncHandler(monthly));

// src/routes/index.ts
var routes = Router8();
routes.get("/health", asyncHandler(async (_req, res) => {
  const dbStatus = await pingDb();
  res.json({ ok: true, db: dbStatus.ok ? "up" : "down", dbError: dbStatus.ok ? void 0 : dbStatus.error });
}));
routes.use("/auth", authRoutes);
routes.use("/transactions", transactionRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/fixed-expenses", fixedExpenseRoutes);
routes.use("/goals", goalRoutes);
routes.use("/acquisition-goals", goalRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/reports", reportRoutes);

// src/app.ts
var app = express();
app.use(
  cors({
    origin: env.WEB_ORIGIN === "*" ? true : env.WEB_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX
  })
);
app.use(pinoHttp());
app.use("/api", routes);
app.use(errorHandler);
async function warmupDb() {
  try {
    await pool.query("SELECT 1");
    console.log("[db] conex\xE3o OK");
  } catch (err) {
    console.warn("[db] falha na conex\xE3o inicial (continua rodando)", err instanceof Error ? err.message : err);
  }
}
void warmupDb();

export {
  env,
  app
};
