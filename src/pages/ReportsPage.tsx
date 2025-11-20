import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table } from '../components/Table';
import { Card } from '../components/Card';
import { Button, Select, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import styles from './ReportsPage.module.scss';

export const ReportsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/reports');
      return response.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.instance.post('/reports/generate', data);
      return response.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      // Invalidate queries to refresh list
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiClient.instance.get(
        `/reports/${reportId}/download`,
        { responseType: 'blob' },
      );
      return response.data;
    },
    onSuccess: (blob, reportId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'type',
      header: 'Тип',
    },
    {
      key: 'format',
      header: 'Формат',
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (item: any) =>
        new Date(item.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (item: any) => (
        <span
          className={`${styles.status} ${
            item.status === 'completed' ? styles.completed : styles.pending
          }`}
        >
          {item.status === 'completed' ? 'Готов' : 'В процессе'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className={styles.actions}>
          {item.status === 'completed' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadMutation.mutate(item.id)}
            >
              Скачать
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleGenerate = () => {
    generateMutation.mutate({
      type: reportType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <h1 className={styles.title}>Отчеты</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Создать отчет
        </Button>
      </div>

      <Card title="Список отчетов">
        <Table
          columns={columns}
          data={reports || []}
          loading={isLoading}
          emptyMessage="Отчеты не найдены"
        />
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать отчет"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <Select
            label="Тип отчета"
            options={[
              { value: 'daily', label: 'Ежедневный' },
              { value: 'weekly', label: 'Еженедельный' },
              { value: 'monthly', label: 'Ежемесячный' },
              { value: 'custom', label: 'Произвольный период' },
            ]}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          />

          {reportType === 'custom' && (
            <>
              <Input
                label="Начальная дата"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Конечная дата"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

