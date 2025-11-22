import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { Input, Button } from '../components/Form';
import { Card } from '../components/Card';
import { apiClient } from '../services/api.client';
import { useAuthStore } from '../store/auth.store';
import styles from './ProfilePage.module.scss';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user, login } = useAuthStore();
  const [success, setSuccess] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/users/profile');
      return response.data;
    },
  });

  const { values, errors, handleChange, handleBlur, handleSubmit, setValue } =
    useForm(
      {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: profile?.email || user?.email || '',
      },
      {
        firstName: { maxLength: 50 },
        lastName: { maxLength: 50 },
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
    );

  // Обновляем значения формы при загрузке профиля
  if (profile && !values.firstName && profile.firstName) {
    setValue('firstName', profile.firstName);
    setValue('lastName', profile.lastName || '');
    setValue('email', profile.email);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.instance.patch('/users/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      if (data.email !== user?.email) {
        const state = useAuthStore.getState();
        login(
          { ...user!, email: data.email },
          state.token!,
          state.refreshToken!,
        );
      }
      setSuccess('Профиль успешно обновлен');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      const response = await apiClient.instance.post('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Пароль успешно изменен');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }
    passwordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.content}>
        <h1 className={styles.title}>Профиль</h1>

        {success && <div className={styles.success}>{success}</div>}

      <div className={styles.grid}>
        <Card title="Личная информация">
          <form
            onSubmit={handleSubmit((formValues) =>
              updateMutation.mutate(formValues),
            )}
            className={styles.form}
          >
            <Input
              label="Имя"
              name="firstName"
              value={values.firstName}
              onChange={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
              error={errors.firstName}
            />

            <Input
              label="Фамилия"
              name="lastName"
              value={values.lastName}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              error={errors.lastName}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              required
            />

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              fullWidth
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </form>
        </Card>

        <Card title="Смена пароля">
          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <Input
              label="Текущий пароль"
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  oldPassword: e.target.value,
                })
              }
            />

            <Input
              label="Новый пароль"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />

            <Input
              label="Подтвердите пароль"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              error={
                passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword
                  ? 'Пароли не совпадают'
                  : undefined
              }
            />

            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              fullWidth
            >
              {passwordMutation.isPending ? 'Изменение...' : 'Изменить пароль'}
            </Button>
          </form>
        </Card>
      </div>
      </div>
    </div>
  );
};

