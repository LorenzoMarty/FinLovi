import { usePeriod } from '../context/PeriodContext';
import styles from './Topbar.module.css';

type Props = {
  title: string;
};

const periodOptions = [
  { value: 'current', label: 'Mês atual' },
  { value: 'previous', label: 'Mês anterior' },
  { value: 'last3', label: 'Últimos 3 meses' },
];

export default function Topbar({ title }: Props) {
  const { period, setPeriod } = usePeriod();

  return (
    <header className={styles.topbar}>
      <div>
        <h1>{title}</h1>
        <p className="muted">Finanças do casal com clareza diária.</p>
      </div>
      <div className={styles.actions}>
        <div className={styles.toggle} role="group" aria-label="Selecionar período">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={period === option.value ? styles.active : ''}
              onClick={() => setPeriod(option.value as 'current' | 'previous' | 'last3')}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => window.dispatchEvent(new CustomEvent('finlovi:open-drawer'))}
        >
          Adicionar lançamento
        </button>
      </div>
    </header>
  );
}
