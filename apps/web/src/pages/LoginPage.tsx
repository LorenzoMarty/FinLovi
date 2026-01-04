import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, type ChangeEvent } from 'react';
import api from '../lib/api';
import styles from './LoginPage.module.css';

type AuthStatus = {
  enabled: boolean;
  email?: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken?: string | null;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const authQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data as AuthStatus;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/login', form);
      return res.data.data as LoginResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem('finlovi:token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('finlovi:refresh', data.refreshToken);
      }
      setError(null);
      navigate('/');
    },
    onError: () => setError('Credenciais inválidas. Verifique e tente novamente.'),
  });

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  if (authQuery.isLoading) {
    return <div className={styles.loading}>Carregando autenticação...</div>;
  }

  if (authQuery.data && !authQuery.data.enabled) {
    return (
      <div className={styles.disabled}>
        <h2>Login desativado</h2>
        <p>Este ambiente não exige autenticação. Você já pode acessar o painel.</p>
        <button type="button" onClick={() => navigate('/')}>Ir para o painel</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div>
          <h2>Entrar</h2>
          <p className="muted">Acesse o painel financeiro do casal.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
          className={styles.form}
        >
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={handleChange('email')} />
          </label>
          <label>
            <span>Senha</span>
            <input type="password" value={form.password} onChange={handleChange('password')} />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
