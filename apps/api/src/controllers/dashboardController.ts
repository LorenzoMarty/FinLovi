import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { getPeriodRange } from '../utils/dates.js';
import { fail, ok } from '../utils/response.js';

export async function summary(req: Request, res: Response) {
  try {
    const period = String(req.query.period || 'current');
    const { start, end } = getPeriodRange(period);

    const [rows] = await db.execute<{
      total_income: number;
      total_expense: number;
      income_count: number;
      expense_count: number;
    }[]>(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
        SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) AS income_count,
        SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expense_count
       FROM transactions
       WHERE date BETWEEN ? AND ?`,
      [start, end],
    );

    const totals = rows?.[0] || {
      total_income: 0,
      total_expense: 0,
      income_count: 0,
      expense_count: 0,
    };

    const [topRows] = await db.execute<{ category: string; total: number }[]>(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [start, end],
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
        top_category: topCategory,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao calcular dashboard';
    res.status(503).json(fail('Erro ao calcular dashboard', 'DB_ERROR', message));
  }
}
