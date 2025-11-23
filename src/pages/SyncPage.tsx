import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button, Select } from '../components/Form';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import { FaSync, FaCheckCircle, FaTimesCircle, FaClock, FaRedo } from 'react-icons/fa';
import styles from './SyncPage.module.scss';

export const SyncPage = () => {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Получаем список интеграций
  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/integrations');
      return response.data;
    },
  });

  // Получаем задачи синхронизации для выбранного аккаунта
  const { data: syncJobs, isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ['sync-jobs', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      const response = await apiClient.instance.get(`/sync/accounts/${selectedAccountId}/jobs`, {
        params: { limit: 50 },
      });
      return response.data;
    },
    enabled: !!selectedAccountId,
    refetchInterval: 5000, // Обновляем каждые 5 секунд для активных задач
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки задач синхронизации');
    },
  });

  // Получаем статистику синхронизации
  const { data: syncStatistics, isError: statisticsError } = useQuery({
    queryKey: ['sync-statistics', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      const response = await apiClient.instance.get(`/sync/accounts/${selectedAccountId}/statistics`);
      return response.data;
    },
    enabled: !!selectedAccountId,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки статистики синхронизации');
    },
  });

  // Мутация для запуска синхронизации
  const startSyncMutation = useMutation({
    mutationFn: async ({ accountId, type }: { accountId: string; type: string }) => {
      const response = await apiClient.instance.post(`/sync/accounts/${accountId}`, {
        type: type || 'FULL',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-statistics'] });
      toast.success('Синхронизация запущена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при запуске синхронизации');
    },
  });

  // Мутация для повтора задачи
  const retryJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiClient.instance.post(`/sync/jobs/${jobId}/retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
      toast.success('Задача перезапущена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при перезапуске задачи');
    },
  });

  const handleStartSync = (type: string = 'FULL') => {
    if (!selectedAccountId) {
      toast.warning('Выберите интеграцию');
      return;
    }
    if (confirm(`Запустить синхронизацию типа "${type}"?`)) {
      startSyncMutation.mutate({ accountId: selectedAccountId, type });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return <FaCheckCircle className={styles.statusIconSuccess} />;
      case 'FAILED':
      case 'ERROR':
        return <FaTimesCircle className={styles.statusIconError} />;
      case 'RUNNING':
      case 'IN_PROGRESS':
        return <FaSync className={styles.statusIconRunning} />;
      default:
        return <FaClock className={styles.statusIconPending} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'Завершено';
      case 'FAILED':
      case 'ERROR':
        return 'Ошибка';
      case 'RUNNING':
      case 'IN_PROGRESS':
        return 'Выполняется';
      case 'PENDING':
        return 'Ожидание';
      default:
        return status || 'Неизвестно';
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Тип',
      render: (item: any) => item.type || 'FULL',
    },
    {
      key: 'status',
      header: 'Статус',
      render: (item: any) => (
        <div className={styles.statusCell}>
          {getStatusIcon(item.status)}
          <span>{getStatusLabel(item.status)}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Создано',
      render: (item: any) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleString('ru-RU')
          : '-',
    },
    {
      key: 'completedAt',
      header: 'Завершено',
      render: (item: any) =>
        item.completedAt
          ? new Date(item.completedAt).toLocaleString('ru-RU')
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className={styles.actionsCell}>
          {item.status === 'FAILED' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => retryJobMutation.mutate(item.id)}
              disabled={retryJobMutation.isPending}
            >
              <FaRedo /> Повторить
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.sync}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Синхронизация данных</h1>
          <p className={styles.subtitle}>
            Управление синхронизацией данных с маркетплейсами
          </p>
        </div>

        <Card className={styles.controlsCard}>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Интеграция</label>
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={[
                  { value: '', label: 'Выберите интеграцию' },
                  ...(integrations?.map((integration: any) => ({
                    value: integration.id,
                    label: `${integration.accountName || integration.marketplaceType} (${integration.marketplaceType})`,
                  })) || []),
                ]}
                style={{ minWidth: '300px' }}
              />
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Тип синхронизации</label>
              <Select
                value="FULL"
                onChange={() => {}}
                options={[
                  { value: 'FULL', label: 'Полная синхронизация' },
                  { value: 'PRODUCTS', label: 'Только товары' },
                  { value: 'SALES', label: 'Только продажи' },
                  { value: 'STOCK', label: 'Только остатки' },
                ]}
                style={{ minWidth: '200px' }}
              />
            </div>

            <div className={styles.controlGroup}>
              <Button
                onClick={() => handleStartSync('FULL')}
                disabled={!selectedAccountId || startSyncMutation.isPending}
              >
                <FaSync /> {startSyncMutation.isPending ? 'Запуск...' : 'Запустить синхронизацию'}
              </Button>
            </div>
          </div>
        </Card>

        {selectedAccountId && syncStatistics && (
          <Card className={styles.statsCard}>
            <h3 className={styles.statsTitle}>Статистика синхронизации</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Последняя синхронизация:</span>
                <span className={styles.statValue}>
                  {syncStatistics.lastSyncAt
                    ? new Date(syncStatistics.lastSyncAt).toLocaleString('ru-RU')
                    : 'Никогда'}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Статус:</span>
                <span className={styles.statValue}>
                  {syncStatistics.lastSyncStatus || 'Неизвестно'}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Всего задач:</span>
                <span className={styles.statValue}>
                  {syncStatistics.totalJobs || 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Успешных:</span>
                <span className={styles.statValue}>
                  {syncStatistics.successfulJobs || 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Неудачных:</span>
                <span className={styles.statValue}>
                  {syncStatistics.failedJobs || 0}
                </span>
              </div>
            </div>
          </Card>
        )}

        {selectedAccountId && (
          <Card className={styles.jobsCard}>
            <h3 className={styles.jobsTitle}>История синхронизаций</h3>
            <Table
              columns={columns}
              data={syncJobs || []}
              loading={jobsLoading}
              emptyMessage="Нет задач синхронизации"
            />
          </Card>
        )}
      </div>
    </div>
  );
};

