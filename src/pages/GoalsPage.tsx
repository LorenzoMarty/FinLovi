import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, createGoal } from '../services/goals';
import { formatCurrency, formatLongDate } from '../lib/format';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import styles from './GoalsPage.module.css';

function monthsBetween(start: Date, end: Date) {
  return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}

function estimateCompletion(createdAt?: string, saved = 0, target = 0) {
  if (!createdAt || saved <= 0 || target <= 0) return null;
  const start = new Date(createdAt);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return null;
  const elapsed = monthsBetween(start, now);
  const monthly = saved / elapsed;
  if (monthly <= 0) return null;
  const remaining = target - saved;
  if (remaining <= 0) return null;
  const monthsLeft = Math.ceil(remaining / monthly);
  const estimate = new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(estimate);
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    saved_amount: '',
    deadline: '',
  });
  const [error, setError] = useState<string | null>(null);

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const mutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setForm({ name: '', target_amount: '', saved_amount: '', deadline: '' });
      setError(null);
    },
    onError: () => setError('Não foi possível salvar a meta.'),
  });

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const target = Number(form.target_amount);
    const saved = Number(form.saved_amount || 0);
    if (!form.name.trim() || target <= 0) {
      setError('Informe o objetivo e uma meta maior que zero.');
      return;
    }
    if (saved < 0) {
      setError('O valor já acumulado não pode ser negativo.');
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      target_amount: target,
      saved_amount: saved,
      deadline: form.deadline || null,
    });
  };

  const sortedGoals = useMemo(() => goalsQuery.data || [], [goalsQuery.data]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Metas de aquisição</h2>
          <p className="muted">Planeje sonhos compartilhados com progresso visível.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Metas em andamento</h3>
          {goalsQuery.isLoading && <div className={styles.skeleton} />}
          {!goalsQuery.isLoading && !sortedGoals.length && (
            <EmptyState title="Sem metas cadastradas" description="Crie uma meta para começar." />
          )}
          <div className={styles.list}>
            {sortedGoals.map((goal) => {
              const progress = goal.target_amount ? goal.saved_amount / goal.target_amount : 0;
              const deadline = goal.deadline ? new Date(goal.deadline) : null;
              const status = goal.saved_amount >= goal.target_amount
                ? 'Concluída'
                : deadline && deadline < new Date()
                ? 'Atrasada'
                : progress > 0.8
                ? 'Quase lá'
                : 'Em andamento';
              const forecast = estimateCompletion(goal.created_at, goal.saved_amount, goal.target_amount);
              return (
                <div key={goal.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <div>
                      <strong>{goal.name}</strong>
                      <span className={styles.meta}>{status}</span>
                    </div>
                    <span className={styles.amount}>
                      {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <ProgressBar value={progress} tone={status === 'Atrasada' ? 'negative' : 'neutral'} />
                  <div className={styles.footer}>
                    <span>Prazo: {formatLongDate(goal.deadline)}</span>
                    <span>{forecast ? `Conclusão estimada: ${forecast}` : 'Sem previsão de ritmo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Nova meta</h3>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span>Objetivo</span>
              <input value={form.name} onChange={handleChange('name')} />
            </label>
            <label>
              <span>Meta total</span>
              <input type="number" min="0" step="0.01" value={form.target_amount} onChange={handleChange('target_amount')} />
            </label>
            <label>
              <span>Já guardado</span>
              <input type="number" min="0" step="0.01" value={form.saved_amount} onChange={handleChange('saved_amount')} />
            </label>
            <label>
              <span>Prazo (opcional)</span>
              <input type="date" value={form.deadline} onChange={handleChange('deadline')} />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primary} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Adicionar meta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
