import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import GoalsPage from './pages/GoalsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="lancamentos" element={<TransactionsPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="fixos" element={<FixedExpensesPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
