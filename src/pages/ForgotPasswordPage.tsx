import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import { Input, Button } from '../components/Form';
import { apiClient } from '../services/api.client';
import styles from './ForgotPasswordPage.module.scss';

export const ForgotPasswordPage = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm(
    { email: '' },
    {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value) => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Неверный формат email';
          }
          return null;
        },
      },
    },
  );

  const onSubmit = async (formValues: { email: string }) => {
    setError('');
    setLoading(true);

    try {
      await apiClient.instance.post('/auth/forgot-password', {
        email: formValues.email,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Ошибка отправки. Попробуйте еще раз.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Проверьте почту</h1>
          <p className={styles.message}>
            Мы отправили инструкции по восстановлению пароля на{' '}
            <strong>{values.email}</strong>
          </p>
          <Link to="/login" className={styles.link}>
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Восстановление пароля</h1>
        <p className={styles.subtitle}>
          Введите email, и мы отправим инструкции по восстановлению
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <Input
            label="Email"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            placeholder="your@email.com"
            required
          />

          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Отправка...' : 'Отправить'}
          </Button>
        </form>

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>
            Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
};

