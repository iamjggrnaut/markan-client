import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api.client';
import styles from './AdminPage.module.scss';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalOrganizations: number;
  totalIntegrations: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  usersByPlan: Record<string, number>;
  recentActivity: any[];
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'activity' | 'payments'>('stats');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    plan: '',
    isActive: '',
  });
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Получение статистики
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/admin/stats');
      return response.data;
    },
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  // Получение списка пользователей
  const { data: usersData, isLoading: usersLoading } = useQuery<{
    users: User[];
    total: number;
  }>({
    queryKey: ['admin', 'users', page, searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.role && { role: filters.role }),
        ...(filters.plan && { plan: filters.plan }),
        ...(filters.isActive && { isActive: filters.isActive }),
      });
      const response = await apiClient.instance.get(`/admin/users?${params}`);
      return response.data;
    },
  });

  // Получение активности пользователя
  const { data: userActivity } = useQuery({
    queryKey: ['admin', 'user-activity', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const response = await apiClient.instance.get(`/admin/users/${selectedUserId}/activity`);
      return response.data;
    },
    enabled: !!selectedUserId,
  });

  // Обновление пользователя
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await apiClient.instance.put(`/admin/users/${userId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  // Удаление пользователя
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.instance.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const handleUpdateUser = (userId: string, updates: any) => {
    if (window.confirm('Вы уверены, что хотите обновить данные пользователя?')) {
      updateUserMutation.mutate({ userId, updates });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя? Это действие нельзя отменить.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.content}>
        <div className={styles.header}>
        <h1>Панель администратора</h1>
        <div className={styles.tabs}>
          <button
            className={activeTab === 'stats' ? styles.active : ''}
            onClick={() => setActiveTab('stats')}
          >
            Статистика
          </button>
          <button
            className={activeTab === 'users' ? styles.active : ''}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button
            className={activeTab === 'activity' ? styles.active : ''}
            onClick={() => setActiveTab('activity')}
          >
            Активность
          </button>
          <button
            className={activeTab === 'payments' ? styles.active : ''}
            onClick={() => setActiveTab('payments')}
          >
            Платежи
          </button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className={styles.statsSection}>
          {statsLoading ? (
            <div className={styles.loading}>Загрузка статистики...</div>
          ) : stats ? (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Всего пользователей</div>
                  <div className={styles.statValue}>{stats.totalUsers}</div>
                  <div className={styles.statSubtext}>
                    Активных: {stats.activeUsers}
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Новые пользователи</div>
                  <div className={styles.statValue}>{stats.newUsersToday}</div>
                  <div className={styles.statSubtext}>
                    Сегодня / {stats.newUsersThisWeek} за неделю / {stats.newUsersThisMonth} за месяц
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Организации</div>
                  <div className={styles.statValue}>{stats.totalOrganizations}</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Интеграции</div>
                  <div className={styles.statValue}>{stats.totalIntegrations}</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Товары</div>
                  <div className={styles.statValue}>{stats.totalProducts.toLocaleString()}</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Продажи</div>
                  <div className={styles.statValue}>{stats.totalSales.toLocaleString()}</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Выручка</div>
                  <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>

              <div className={styles.usersByPlan}>
                <h2>Пользователи по тарифам</h2>
                <div className={styles.planStats}>
                  {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                    <div key={plan} className={styles.planStat}>
                      <span className={styles.planName}>{plan}</span>
                      <span className={styles.planCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.recentActivity}>
                <h2>Последняя активность</h2>
                <div className={styles.activityList}>
                  {stats.recentActivity.slice(0, 20).map((activity: any, index: number) => (
                    <div key={index} className={styles.activityItem}>
                      <div className={styles.activityUser}>
                        {activity.user?.email || 'Unknown'}
                      </div>
                      <div className={styles.activityAction}>{activity.description}</div>
                      <div className={styles.activityTime}>
                        {new Date(activity.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'users' && (
        <div className={styles.usersSection}>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Поиск по email, имени..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
            <select
              value={filters.role}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value });
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Все роли</option>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
            <select
              value={filters.plan}
              onChange={(e) => {
                setFilters({ ...filters, plan: e.target.value });
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Все тарифы</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={filters.isActive}
              onChange={(e) => {
                setFilters({ ...filters, isActive: e.target.value });
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>

          {usersLoading ? (
            <div className={styles.loading}>Загрузка пользователей...</div>
          ) : usersData ? (
            <>
              <div className={styles.usersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Имя</th>
                      <th>Роль</th>
                      <th>Тариф</th>
                      <th>Статус</th>
                      <th>Дата регистрации</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : '-'}
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateUser(user.id, { role: e.target.value })
                            }
                            className={styles.roleSelect}
                          >
                            <option value="user">Пользователь</option>
                            <option value="admin">Администратор</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={user.plan}
                            onChange={(e) =>
                              handleUpdateUser(user.id, { plan: e.target.value })
                            }
                            className={styles.planSelect}
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={user.isActive}
                              onChange={(e) =>
                                handleUpdateUser(user.id, { isActive: e.target.checked })
                              }
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className={styles.btnView}
                          >
                            Активность
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className={styles.btnDelete}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Назад
                </button>
                <span>
                  Страница {page} из {Math.ceil(usersData.total / 50)}
                </span>
                <button
                  disabled={page >= Math.ceil(usersData.total / 50)}
                  onClick={() => setPage(page + 1)}
                >
                  Вперед
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'activity' && selectedUserId && userActivity && (
        <div className={styles.activitySection}>
          <div className={styles.activityHeader}>
            <h2>Активность пользователя: {userActivity.userEmail}</h2>
            <button onClick={() => setSelectedUserId(null)}>Назад</button>
          </div>
          <div className={styles.activityStats}>
            <div className={styles.activityStat}>
              <div className={styles.statLabel}>Входов в систему</div>
              <div className={styles.statValue}>{userActivity.loginCount}</div>
            </div>
            <div className={styles.activityStat}>
              <div className={styles.statLabel}>Последний вход</div>
              <div className={styles.statValue}>
                {userActivity.lastLoginAt
                  ? new Date(userActivity.lastLoginAt).toLocaleString('ru-RU')
                  : 'Никогда'}
              </div>
            </div>
            <div className={styles.activityStat}>
              <div className={styles.statLabel}>Всего действий</div>
              <div className={styles.statValue}>{userActivity.totalActions}</div>
            </div>
          </div>
          <div className={styles.activityList}>
            <h3>История активности</h3>
            {userActivity.activities.map((activity: any, index: number) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityAction}>{activity.description}</div>
                <div className={styles.activityTime}>
                  {new Date(activity.createdAt).toLocaleString('ru-RU')}
                </div>
                {activity.metadata && (
                  <div className={styles.activityMetadata}>
                    {JSON.stringify(activity.metadata, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && !selectedUserId && (
        <div className={styles.activitySection}>
          <p>Выберите пользователя на вкладке "Пользователи" для просмотра активности</p>
        </div>
      )}
    </div>
  );
};

