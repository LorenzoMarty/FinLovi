import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePeriod } from '../context/PeriodContext';
import { fetchDashboardSummary } from '../services/dashboard';
import { fetchTransactions } from '../services/transactions';
import { fetchUpcomingFixedExpenses } from '../services/fixedExpenses';
import { fetchGoals } from '../services/goals';
import { formatCurrency, formatPercent, formatShortDate } from '../lib/format';
import { getPeriodRange } from '../lib/dates';
import KpiCard from '../components/KpiCard';
import PieChart from '../components/PieChart';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import styles from './DashboardPage.module.css';

const palette = ['#6DAEDB', '#4E9F8A', '#E07A5F', '#8FA3AD', '#B8B2A7', '#C7D3DB', '#E4DCCF'];

type Variation = {
  value: string;
  arrow: '↑' | '↓' | '→';
};

function getVariation(current: number, previous: number): Variation {
  if (previous === 0) {
    return {
      value: current === 0 ? '0,0%' : 'Novo',
      arrow: current > 0 ? '↑' : current < 0 ? '↓' : '→',
    };
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: formatPercent(percent),
    arrow: percent > 0 ? '↑' : percent < 0 ? '↓' : '→',
  };
}

export default function DashboardPage() {
  const { period } = usePeriod();
  const range = getPeriodRange(period);
  const [search, setSearch] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => fetchDashboardSummary(period),
  });

  const previousQuery = useQuery({
    queryKey: ['dashboard', 'previous'],
    queryFn: () => fetchDashboardSummary('previous'),
    enabled: period === 'current',
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', period, range.start, range.end],
    queryFn: () =>
      fetchTransactions({
        page: 1,
        limit: 200,
        from: range.start,
        to: range.end,
      }),
  });

  const fixedQuery = useQuery({
    queryKey: ['fixed-expenses', 'upcoming'],
    queryFn: () => fetchUpcomingFixedExpenses(10),
  });

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const transactions = transactionsQuery.data?.items ?? [];
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const term = search.trim().toLowerCase();
    return transactions.filter((item) =>
      `${item.description} ${item.category}`.toLowerCase().includes(term),
    );
  }, [search, transactions]);

  const recent = filteredTransactions.slice(0, 6);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((item) => {
      if (item.type !== 'expense') return;
      totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
    });
    return Array.from(totals.entries())
      .map(([label, total], index) => ({
        label,
        value: total,
        color: palette[index % palette.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const topRanking = categoryTotals.slice(0, 5);
  const isPartial = (transactionsQuery.data?.total || 0) > (transactionsQuery.data?.limit || 0);

  const summary = summaryQuery.data;
  const previous = previousQuery.data;
  const variation = getVariation(summary?.net || 0, previous?.net || 0);
  const variationLabel = `${variation.arrow} ${variation.value}`.trim();

  return (
    <div className={styles.page}>
      <section className={styles.kpiGrid}>
        <KpiCard
          label="Entradas"
          value={formatCurrency(summary?.total_income || 0)}
          meta={`${summary?.income_count || 0} entradas`}
          tone="positive"
        />
        <KpiCard
          label="Gastos"
          value={formatCurrency(summary?.total_expense || 0)}
          meta={`${summary?.expense_count || 0} gastos`}
          tone="negative"
        />
        <KpiCard
          label="Saldo"
          value={formatCurrency(summary?.net || 0)}
          meta="Saldo do período"
          tone={summary && summary.net < 0 ? 'negative' : 'positive'}
        />
        <KpiCard
          label="Variação"
          value={variationLabel}
          meta="vs mês anterior"
          tone="neutral"
        />
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Últimos lançamentos</h2>
              <p className="muted">Acompanhe o fluxo mais recente do casal.</p>
            </div>
            <input
              className={styles.search}
              type="search"
              placeholder="Buscar descrição ou categoria"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.list}>
            {transactionsQuery.isLoading && <div className={styles.skeleton} />}
            {!transactionsQuery.isLoading && !recent.length && (
              <EmptyState title="Sem lançamentos no período" description="Novos registros aparecem aqui." />
            )}
            {recent.map((item) => (
              <div className={styles.listItem} key={`${item.id}-${item.date}`}>
                <div>
                  <strong>{item.description}</strong>
                  <span className={styles.listMeta}>
                    {formatShortDate(item.date)} · {item.category}
                  </span>
                </div>
                <span
                  className={`${styles.amount} ${
                    item.type === 'income' ? styles.positive : styles.negative
                  }`}
                >
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Distribuição por categoria</h2>
              <p className="muted">Visual macro para entender prioridades.</p>
            </div>
          </div>
          <PieChart data={categoryTotals.slice(0, 8)} />
          <div className={styles.rankBlock}>
            <h3>Ranking de gastos</h3>
            {isPartial && (
              <p className={styles.notice}>Ranking parcial: mostrando os 200 lançamentos mais recentes.</p>
            )}
            {!topRanking.length && (
              <EmptyState title="Sem gastos no período" description="Assim que houver gastos, eles aparecem aqui." />
            )}
            {topRanking.map((item) => (
              <div key={item.label} className={styles.rankItem}>
                <span>{item.label}</span>
                <span>{formatCurrency(item.value)}</span>
                <div className={styles.rankBar}>
                  <span style={{ width: `${(item.value / (topRanking[0]?.value || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Fixos próximos do vencimento</h2>
              <p className="muted">Antecipe pagamentos e mantenha previsibilidade.</p>
            </div>
          </div>
          <div className={styles.list}>
            {fixedQuery.isLoading && <div className={styles.skeleton} />}
            {!fixedQuery.isLoading && !(fixedQuery.data || []).length && (
              <EmptyState title="Nenhum fixo pendente" description="Tudo em dia por aqui." />
            )}
            {(fixedQuery.data || []).slice(0, 4).map((item) => (
              <div className={styles.listItem} key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <span className={styles.listMeta}>Vence em {item.days_until_due} dias</span>
                </div>
                <span className={styles.amount}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Metas em andamento</h2>
              <p className="muted">Planejamento conjunto e progresso visível.</p>
            </div>
          </div>
          <div className={styles.goals}>
            {goalsQuery.isLoading && <div className={styles.skeleton} />}
            {!goalsQuery.isLoading && !(goalsQuery.data || []).length && (
              <EmptyState title="Sem metas cadastradas" description="Crie metas para manter o foco." />
            )}
            {(goalsQuery.data || []).slice(0, 3).map((goal) => {
              const progress = goal.target_amount ? goal.saved_amount / goal.target_amount : 0;
              return (
                <div key={goal.id} className={styles.goalItem}>
                  <div className={styles.goalHeader}>
                    <strong>{goal.name}</strong>
                    <span>{formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <ProgressBar value={progress} tone={progress >= 1 ? 'positive' : 'neutral'} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
