import styles from './EmptyState.module.css';

type Props = {
  title: string;
  description?: string;
};

export default function EmptyState({ title, description }: Props) {
  return (
    <div className={styles.empty}>
      <div className={styles.dot} />
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
