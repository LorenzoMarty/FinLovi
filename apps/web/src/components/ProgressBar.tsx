import styles from './ProgressBar.module.css';

type Props = {
  value: number;
  tone?: 'positive' | 'neutral' | 'negative';
};

export default function ProgressBar({ value, tone = 'neutral' }: Props) {
  const percent = Math.max(0, Math.min(1, value));
  return (
    <div className={`${styles.track} ${styles[tone]}`}>
      <span className={styles.fill} style={{ width: `${percent * 100}%` }} />
    </div>
  );
}
