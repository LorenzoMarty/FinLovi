import { z } from 'zod';

export const defaultCategories = [
  'Mercado',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Restaurantes',
  'Linha de crédito',
  'Entradas',
  'Maya',
  'Outros',
];

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const transactionSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  category: z.string().min(1),
  type: transactionTypeSchema,
  date: z.string().min(8),
});

export const transactionCreateSchema = transactionSchema.omit({ id: true });

export const fixedExpenseSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  category: z.string().min(1),
  due_day: z.number().int().min(1).max(31),
});

export const fixedExpenseCreateSchema = fixedExpenseSchema.omit({ id: true });

export const goalSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  target_amount: z.number().nonnegative(),
  saved_amount: z.number().nonnegative(),
  deadline: z.string().nullable(),
  created_at: z.string().optional(),
});

export const goalCreateSchema = goalSchema.omit({ id: true, created_at: true });

export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

export const categoryCreateSchema = categorySchema.omit({ id: true });

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type FixedExpense = z.infer<typeof fixedExpenseSchema>;
export type FixedExpenseCreate = z.infer<typeof fixedExpenseCreateSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type GoalCreate = z.infer<typeof goalCreateSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: ApiError;
};
