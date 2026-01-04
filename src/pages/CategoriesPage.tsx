import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCategories, createCategory } from '../services/categories';
import EmptyState from '../components/EmptyState';
import styles from './CategoriesPage.module.css';

const palette = ['#6DAEDB', '#4E9F8A', '#E07A5F', '#8FA3AD', '#B8B2A7'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      setError(null);
      setNotice(null);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.error?.code;
        if (code === 'MIGRATION_REQUIRED') {
          setNotice('Para editar categorias, aplique a migration 001_create_categories.sql.');
          return;
        }
      }
      setError('Não foi possível salvar a categoria.');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Informe um nome para a categoria.');
      return;
    }
    mutation.mutate({ name: name.trim() });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Categorias</h2>
          <p className="muted">Organize os lançamentos por temas claros.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Lista atual</h3>
          {query.isLoading && <div className={styles.skeleton} />}
          {!query.isLoading && !(query.data || []).length && (
            <EmptyState title="Sem categorias" description="Adicione a primeira categoria." />
          )}
          <div className={styles.list}>
            {(query.data || []).map((category, index) => (
              <div key={category.id} className={styles.item}>
                <span className={styles.dot} style={{ background: palette[index % palette.length] }} />
                <span>{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Nova categoria</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              <span>Nome</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            {notice && <p className={styles.notice}>{notice}</p>}
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primary} disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
