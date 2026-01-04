import styles from './KpiCard.module.css';

type Trend = {
  value: string;
  direction: 'up' | 'down' | 'flat';
};

type Props = {
  label: string;
  value: string;
  meta?: string;
  tone?: 'positive' | 'negative' | 'neutral';
  trend?: Trend;
};

export default function KpiCard({ label, value, meta, tone = 'neutral', trend }: Props) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.footer}>
        {meta && <span className={styles.meta}>{meta}</span>}
        {trend && (
          <span className={`${styles.trend} ${styles[trend.direction]}`}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.direction === 'flat' && '→'}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
