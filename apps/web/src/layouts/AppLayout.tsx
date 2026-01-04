import { Outlet, useLocation } from 'react-router-dom';
import SidebarRail from '../components/SidebarRail';
import Topbar from '../components/Topbar';
import TransactionDrawer from '../components/TransactionDrawer';
import { PeriodProvider } from '../context/PeriodContext';
import styles from './AppLayout.module.css';

const titles: Record<string, string> = {
  '/': 'Resumo',
  '/lancamentos': 'Lançamentos',
  '/categorias': 'Categorias',
  '/fixos': 'Fixos',
  '/metas': 'Metas',
  '/relatorios': 'Relatórios',
};

export default function AppLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || 'FinLovi';

  return (
    <PeriodProvider>
      <div className={styles.layout}>
        <SidebarRail />
        <div className={styles.content}>
          <Topbar title={title} />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
        <TransactionDrawer />
      </div>
    </PeriodProvider>
  );
}
