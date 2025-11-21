import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../services/api.client';
import styles from './LoginPage.module.scss';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.instance.post('/auth/login', {
        email,
        password,
      });

      login(
        { id: response.data.user.id, email: response.data.user.email },
        response.data.access_token,
        response.data.refresh_token,
      );

      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Ошибка входа. Проверьте данные.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nebula Markan</h1>
        <p className={styles.subtitle}>Вход в систему</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className={styles.footer}>
          <a href="/forgot-password" className={styles.link}>
            Забыли пароль?
          </a>
          <br />
          Нет аккаунта?{' '}
          <a href="/register" className={styles.link}>
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
};

