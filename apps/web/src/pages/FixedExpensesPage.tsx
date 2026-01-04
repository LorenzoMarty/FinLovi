import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFixedExpenses, createFixedExpense } from '../services/fixedExpenses';
import { fetchCategories } from '../services/categories';
import { formatCurrency, formatPercent } from '../lib/format';
import EmptyState from '../components/EmptyState';
import styles from './FixedExpensesPage.module.css';

function daysUntilDue(dueDay: number) {
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function FixedExpensesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: '',
    due_day: '1',
  });
  const [error, setError] = useState<string | null>(null);

  const fixedQuery = useQuery({
    queryKey: ['fixed-expenses'],
    queryFn: fetchFixedExpenses,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const totalFixed = useMemo(
    () => (fixedQuery.data || []).reduce((sum, item) => sum + item.amount, 0),
    [fixedQuery.data],
  );

  const mutation = useMutation({
    mutationFn: createFixedExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      setForm({ description: '', amount: '', category: '', due_day: '1' });
      setError(null);
    },
    onError: () => setError('Não foi possível salvar o gasto fixo.'),
  });

  const handleChange =
    (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const amount = Number(form.amount);
    const dueDay = Number(form.due_day) || 1;
    if (!form.description.trim() || amount <= 0) {
      setError('Descreva o gasto fixo e informe um valor maior que zero.');
      return;
    }
    mutation.mutate({
      description: form.description.trim(),
      amount,
      category: form.category || 'Essenciais',
      due_day: Math.min(31, Math.max(1, dueDay)),
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Gastos fixos</h2>
          <p className="muted">Mantenha o mês previsível com fixos organizados.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Lista mensal</h3>
          {fixedQuery.isLoading && <div className={styles.skeleton} />}
          {!fixedQuery.isLoading && !(fixedQuery.data || []).length && (
            <EmptyState title="Sem gastos fixos" description="Adicione contas recorrentes." />
          )}
          <div className={styles.list}>
            {(fixedQuery.data || []).map((item) => {
              const days = daysUntilDue(item.due_day);
              const impact = totalFixed ? formatPercent((item.amount / totalFixed) * 100, false) : null;
              return (
                <div key={item.id} className={styles.item}>
                  <div>
                    <strong>{item.description}</strong>
                    <span className={styles.meta}>Categoria: {item.category}</span>
                    {impact && <span className={styles.meta}>Impacto: {impact}</span>}
                  </div>
                  <div className={styles.right}>
                    <span className={styles.amount}>{formatCurrency(item.amount)}</span>
                    <span className={`${styles.status} ${days <= 3 ? styles.alert : ''}`}>
                      {days <= 0 ? 'Vence hoje' : `Vence em ${days} dias`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Novo gasto fixo</h3>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span>Descrição</span>
              <input value={form.description} onChange={handleChange('description')} />
            </label>
            <label>
              <span>Valor</span>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={handleChange('amount')} />
            </label>
            <label>
              <span>Categoria</span>
              <select value={form.category} onChange={handleChange('category')}>
                <option value="">Essenciais</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Dia de vencimento</span>
              <input type="number" min="1" max="31" value={form.due_day} onChange={handleChange('due_day')} />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primary} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Adicionar fixo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
