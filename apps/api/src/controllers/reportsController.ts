import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { ok } from '../utils/response.js';

function getDefaultRange() {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export async function monthly(req: Request, res: Response) {
  const queryFrom = req.query.from ? `${req.query.from}-01` : undefined;
  const queryTo = req.query.to ? getMonthEnd(String(req.query.to)) : undefined;
  const range = getDefaultRange();
  const from = queryFrom || range.from;
  const to = queryTo || range.to;

  const [rows] = await db.execute<{
    month: string;
    total_income: number;
    total_expense: number;
  }[]>(
    `SELECT DATE_FORMAT(date, '%Y-%m') AS month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
     FROM transactions
     WHERE date BETWEEN ? AND ?
     GROUP BY DATE_FORMAT(date, '%Y-%m')
     ORDER BY month ASC`,
    [from, to],
  );

  res.json(ok(rows));
}

function getMonthEnd(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return `${value}-31`;
  const end = new Date(year, month, 0);
  return end.toISOString().slice(0, 10);
}
