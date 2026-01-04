import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyReport } from '../services/reports';
import { formatCurrency } from '../lib/format';
import { formatMonthLabel } from '../lib/dates';
import EmptyState from '../components/EmptyState';
import styles from './ReportsPage.module.css';

type RangeKey = '6m' | '12m';

function getRange(range: RangeKey) {
  const now = new Date();
  const months = range === '12m' ? 11 : 5;
  const from = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 7),
    to: to.toISOString().slice(0, 7),
  };
}

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('6m');
  const { from, to } = useMemo(() => getRange(range), [range]);

  const reportQuery = useQuery({
    queryKey: ['reports', range],
    queryFn: () => fetchMonthlyReport({ from, to }),
  });

  const rows = reportQuery.data || [];
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [row.total_income, row.total_expense]),
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>Relatórios</h2>
          <p className="muted">Acompanhe a evolução mensal das finanças.</p>
        </div>
        <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
          <option value="6m">Últimos 6 meses</option>
          <option value="12m">Últimos 12 meses</option>
        </select>
      </div>

      <div className={styles.card}>
        <h3>Comparativo mensal</h3>
        {reportQuery.isLoading && <div className={styles.skeleton} />}
        {!reportQuery.isLoading && !rows.length && (
          <EmptyState title="Sem dados para o período" description="Registre lançamentos para gerar relatórios." />
        )}
        <div className={styles.chart}>
          {rows.map((row) => (
            <div key={row.month} className={styles.barGroup}>
              <div className={styles.bars}>
                <span
                  className={styles.income}
                  style={{ height: `${(row.total_income / maxValue) * 100}%` }}
                />
                <span
                  className={styles.expense}
                  style={{ height: `${(row.total_expense / maxValue) * 100}%` }}
                />
              </div>
              <span className={styles.label}>{formatMonthLabel(row.month)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h3>Resumo detalhado</h3>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Mês</span>
            <span>Entradas</span>
            <span>Gastos</span>
            <span>Saldo</span>
          </div>
          {rows.map((row) => (
            <div key={`row-${row.month}`} className={styles.row}>
              <span>{formatMonthLabel(row.month)}</span>
              <span className={styles.positive}>{formatCurrency(row.total_income)}</span>
              <span className={styles.negative}>{formatCurrency(row.total_expense)}</span>
              <span>{formatCurrency(row.total_income - row.total_expense)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
