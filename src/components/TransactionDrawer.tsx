import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransaction } from '../services/transactions';
import { fetchCategories } from '../services/categories';
import styles from './TransactionDrawer.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionDrawer() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'expense',
    description: '',
    amount: '',
    category: '',
    date: today(),
  });

  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const defaultCategory = useMemo(() => {
    if (!categories.length) return 'Outros';
    return categories[0].name;
  }, [categories]);

  useEffect(() => {
    if (!form.category) {
      setForm((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [defaultCategory, form.category]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('finlovi:open-drawer', handler);
    return () => window.removeEventListener('finlovi:open-drawer', handler);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setError(null);
      setForm({
        type: 'expense',
        description: '',
        amount: '',
        category: defaultCategory,
        date: today(),
      });
      setOpen(false);
    },
    onError: () => {
      setError('Não foi possível salvar. Tente novamente.');
    },
  });

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    if (!form.description.trim() || amount <= 0) {
      setError('Preencha a descrição e informe um valor maior que zero.');
      return;
    }

    mutation.mutate({
      description: form.description.trim(),
      amount,
      category: form.category || defaultCategory,
      type: form.type === 'income' ? 'income' : 'expense',
      date: form.date || today(),
    });
  };

  return (
    <div className={`${styles.wrapper} ${open ? styles.open : ''}`}>
      <div className={styles.backdrop} onClick={() => setOpen(false)} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Adicionar lançamento">
        <div className={styles.header}>
          <div>
            <h2>Novo lançamento</h2>
            <p className="muted">Registre entradas ou gastos rapidamente.</p>
          </div>
          <button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Fechar">
            ×
          </button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Tipo</span>
            <select value={form.type} onChange={handleChange('type')}>
              <option value="expense">Gasto</option>
              <option value="income">Entrada</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Descrição</span>
            <input value={form.description} onChange={handleChange('description')} placeholder="Ex: Supermercado" />
          </label>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange('amount')}
              />
            </label>
            <label className={styles.field}>
              <span>Data</span>
              <input type="date" value={form.date} onChange={handleChange('date')} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Categoria</span>
            <select value={form.category} onChange={handleChange('category')}>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
              {!categories.length && <option value="Outros">Outros</option>}
            </select>
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={styles.primary} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
