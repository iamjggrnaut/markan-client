import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button, Input, Select } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import { FaUsers, FaChartLine, FaPlus } from 'react-icons/fa';
import styles from './CustomersPage.module.scss';

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [isCreateSegmentModalOpen, setIsCreateSegmentModalOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    criteria: {},
  });

  // Получаем сегменты клиентов
  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/customers/segments');
      return response.data;
    },
  });

  // Получаем клиентов выбранного сегмента
  const { data: segmentMembers, isLoading: membersLoading, isError: membersError } = useQuery({
    queryKey: ['segment-members', selectedSegment],
    queryFn: async () => {
      if (!selectedSegment) return [];
      const response = await apiClient.instance.get(`/customers/segments/${selectedSegment}/members`);
      return response.data;
    },
    enabled: !!selectedSegment,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки клиентов сегмента');
    },
  });

  // Получаем анализ повторных покупок
  const { data: repeatPurchaseAnalysis, isError: repeatPurchaseError } = useQuery({
    queryKey: ['repeat-purchase-analysis'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/customers/repeat-purchase');
      return response.data;
    },
    onError: (error: any) => {
      console.error('Ошибка загрузки анализа повторных покупок:', error);
    },
  });

  // Получаем воронку продаж
  const { data: salesFunnel, isError: funnelError } = useQuery({
    queryKey: ['sales-funnel'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/customers/funnel');
      return response.data;
    },
    onError: (error: any) => {
      console.error('Ошибка загрузки воронки продаж:', error);
    },
  });

  // Мутация для создания сегмента
  const createSegmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.instance.post('/customers/segments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      setIsCreateSegmentModalOpen(false);
      setNewSegment({ name: '', description: '', criteria: {} });
      toast.success('Сегмент создан!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании сегмента');
    },
  });

  const handleCreateSegment = () => {
    if (!newSegment.name) {
      toast.warning('Введите название сегмента');
      return;
    }
    createSegmentMutation.mutate(newSegment);
  };

  const segmentColumns = [
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'description',
      header: 'Описание',
    },
    {
      key: 'membersCount',
      header: 'Клиентов',
      render: (item: any) => item.membersCount || 0,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSelectedSegment(item.id)}
        >
          Просмотр
        </Button>
      ),
    },
  ];

  const memberColumns = [
    {
      key: 'customerId',
      header: 'ID клиента',
    },
    {
      key: 'totalOrders',
      header: 'Заказов',
      render: (item: any) => item.totalOrders || 0,
    },
    {
      key: 'totalRevenue',
      header: 'Выручка',
      render: (item: any) => `${(item.totalRevenue || 0).toLocaleString('ru-RU')} ₽`,
    },
    {
      key: 'lastOrderDate',
      header: 'Последний заказ',
      render: (item: any) =>
        item.lastOrderDate
          ? new Date(item.lastOrderDate).toLocaleDateString('ru-RU')
          : '-',
    },
  ];

  return (
    <div className={styles.customers}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FaUsers className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Клиенты</h1>
              <p className={styles.subtitle}>
                Сегментация клиентов и анализ покупательского поведения
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateSegmentModalOpen(true)}
          >
            <FaPlus /> Создать сегмент
          </Button>
        </div>

        <div className={styles.grid}>
          <div className={styles.main}>
            <Card className={styles.segmentsCard}>
              <h2 className={styles.cardTitle}>Сегменты клиентов</h2>
              <Table
                columns={segmentColumns}
                data={segments || []}
                loading={segmentsLoading}
                emptyMessage="Сегменты не найдены"
              />
            </Card>

            {selectedSegment && (
              <Card className={styles.membersCard}>
                <h2 className={styles.cardTitle}>Клиенты сегмента</h2>
                <Table
                  columns={memberColumns}
                  data={segmentMembers || []}
                  loading={membersLoading}
                  emptyMessage="Клиенты не найдены"
                />
              </Card>
            )}
          </div>

          <div className={styles.sidebar}>
            {repeatPurchaseAnalysis && (
              <Card className={styles.analysisCard}>
                <h3 className={styles.sidebarTitle}>
                  <FaChartLine /> Анализ повторных покупок
                </h3>
                <div className={styles.analysisContent}>
                  <div className={styles.analysisItem}>
                    <span className={styles.analysisLabel}>Повторные клиенты:</span>
                    <span className={styles.analysisValue}>
                      {repeatPurchaseAnalysis.repeatCustomers || 0}
                    </span>
                  </div>
                  <div className={styles.analysisItem}>
                    <span className={styles.analysisLabel}>Процент повторных:</span>
                    <span className={styles.analysisValue}>
                      {((repeatPurchaseAnalysis.repeatCustomers || 0) /
                        (repeatPurchaseAnalysis.totalCustomers || 1) *
                        100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {salesFunnel && (
              <Card className={styles.funnelCard}>
                <h3 className={styles.sidebarTitle}>Воронка продаж</h3>
                <div className={styles.funnelContent}>
                  {salesFunnel.stages?.map((stage: any, index: number) => (
                    <div key={index} className={styles.funnelStage}>
                      <div className={styles.funnelStageName}>{stage.name}</div>
                      <div className={styles.funnelStageValue}>{stage.value || 0}</div>
                      {stage.conversionRate && (
                        <div className={styles.funnelConversion}>
                          {stage.conversionRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateSegmentModalOpen}
        onClose={() => setIsCreateSegmentModalOpen(false)}
        title="Создать сегмент клиентов"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateSegmentModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateSegment}
              disabled={createSegmentMutation.isPending}
            >
              {createSegmentMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <div className={styles.segmentForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Название *</label>
            <Input
              type="text"
              value={newSegment.name}
              onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
              placeholder="Например: VIP клиенты"
              style={{ width: '100%' }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <Input
              type="text"
              value={newSegment.description}
              onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
              placeholder="Описание сегмента"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

