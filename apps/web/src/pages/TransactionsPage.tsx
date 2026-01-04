import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePeriod } from '../context/PeriodContext';
import { fetchTransactions } from '../services/transactions';
import { fetchCategories } from '../services/categories';
import { formatCurrency, formatShortDate } from '../lib/format';
import { getPeriodRange } from '../lib/dates';
import EmptyState from '../components/EmptyState';
import styles from './TransactionsPage.module.css';

export default function TransactionsPage() {
  const { period } = usePeriod();
  const range = getPeriodRange(period);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const query = useQuery({
    queryKey: ['transactions', 'list', period, page, typeFilter, categoryFilter],
    queryFn: () =>
      fetchTransactions({
        page,
        limit: 20,
        from: range.start,
        to: range.end,
        type: typeFilter === 'all' ? undefined : typeFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }),
  });

  useEffect(() => {
    setPage(1);
  }, [period, typeFilter, categoryFilter]);

  const items = query.data?.items ?? [];
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((item) =>
      `${item.description} ${item.category}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / (query.data?.limit || 20)));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Lançamentos</h2>
          <p className="muted">Controle entradas e gastos com clareza.</p>
        </div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => window.dispatchEvent(new CustomEvent('finlovi:open-drawer'))}
        >
          Novo lançamento
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="Buscar descrição ou categoria"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">Todos os tipos</option>
            <option value="income">Entradas</option>
            <option value="expense">Gastos</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Data</span>
            <span>Descrição</span>
            <span>Categoria</span>
            <span>Tipo</span>
            <span>Valor</span>
          </div>
          {query.isLoading && <div className={styles.skeleton} />}
          {!query.isLoading && !filteredItems.length && (
            <EmptyState title="Nenhum lançamento encontrado" description="Adicione um novo lançamento para começar." />
          )}
          {filteredItems.map((item) => (
            <div className={styles.row} key={`${item.id}-${item.date}`}>
              <span>{formatShortDate(item.date)}</span>
              <strong>{item.description}</strong>
              <span>{item.category}</span>
              <span className={`${styles.badge} ${item.type === 'income' ? styles.positive : styles.negative}`}>
                {item.type === 'income' ? 'Entrada' : 'Gasto'}
              </span>
              <span className={item.type === 'income' ? styles.positive : styles.negative}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.pagination}>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
