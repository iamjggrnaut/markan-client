import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { Card } from '../components/Card';
import { Button } from '../components/Form';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import styles from './PaymentPage.module.scss';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('annual');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Читаем параметры из URL
  useEffect(() => {
    const planParam = searchParams.get('plan');
    const periodParam = searchParams.get('period');
    if (planParam) {
      setSelectedPlan(planParam);
    }
    if (periodParam) {
      setSelectedBillingPeriod(periodParam);
    }
  }, [searchParams]);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/plans');
      return response.data;
    },
  });

  const { data: payment, refetch: refetchPayment } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      const response = await apiClient.instance.get(`/payments/${paymentId}`);
      return response.data;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Обновляем каждые 10 секунд, если платеж в ожидании
      const payment = query.state.data as any;
      if (payment?.status === 'pending' || payment?.status === 'uploaded') {
        return 10000;
      }
      return false;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async ({ planType, billingPeriod, provider }: { planType: string; billingPeriod: string; provider?: string }) => {
      const response = await apiClient.instance.post('/payments', {
        planType,
        billingPeriod,
        provider,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPaymentId(data.id);
      // Если это ЮКасса и есть paymentUrl, перенаправляем на оплату
      if (data.provider === 'yookassa' && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ paymentId, file }: { paymentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.instance.post(
        `/payments/${paymentId}/receipt`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      refetchPayment();
      toast.success('Квитанция загружена! Ожидайте проверки администратором.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при загрузке квитанции');
    },
  });

  const handleCreatePayment = () => {
    if (!selectedPlan) {
      toast.warning('Выберите тарифный план');
      return;
    }
    createPaymentMutation.mutate({
      planType: selectedPlan,
      billingPeriod: selectedBillingPeriod,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !paymentId) return;

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning('Недопустимый тип файла. Разрешены только изображения и PDF');
      return;
    }

    // Проверяем размер (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Размер файла превышает 10MB');
      return;
    }

    uploadReceiptMutation.mutate({ paymentId, file });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Ожидает оплаты',
      uploaded: 'Квитанция загружена, ожидает проверки',
      verifying: 'Проверяется',
      approved: 'Подтвержден, подписка активирована',
      rejected: 'Отклонен',
      expired: 'Истек срок ожидания',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#f59e0b',
      uploaded: '#3b82f6',
      verifying: '#8b5cf6',
      approved: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280',
    };
    return colorMap[status] || '#6b7280';
  };

  if (payment && payment.status !== 'pending') {
    return (
      <div className={styles.paymentPage}>
        <Card title="Статус оплаты">
          <div className={styles.paymentStatus}>
            <div
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(payment.status) }}
            >
              {getStatusLabel(payment.status)}
            </div>
            {payment.status === 'approved' && (
              <div className={styles.successMessage}>
                <p>
                  <FaCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Ваша подписка активирована!
                </p>
                <p>
                  Подписка действует до:{' '}
                  {new Date(payment.subscriptionEndDate).toLocaleDateString('ru-RU')}
                </p>
                <Button onClick={() => navigate('/dashboard')} variant="primary">
                  Перейти в сервис
                </Button>
              </div>
            )}
            {payment.status === 'rejected' && payment.adminNotes && (
              <div className={styles.rejectionMessage}>
                <p>
                  <FaTimesCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Платеж отклонен
                </p>
                <p>Причина: {payment.adminNotes}</p>
                <Button onClick={() => setPaymentId(null)} variant="primary">
                  Создать новый платеж
                </Button>
              </div>
            )}
            {payment.status === 'expired' && (
              <div className={styles.expiredMessage}>
                <p>
                  <FaClock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Срок ожидания оплаты истек
                </p>
                <Button onClick={() => setPaymentId(null)} variant="primary">
                  Создать новый платеж
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (payment && payment.status === 'pending') {
    const isSBP = payment.provider === 'sbp';
    const isYooKassa = payment.provider === 'yookassa';

    return (
      <div className={styles.paymentPage}>
        <Card title={isSBP ? 'Оплата через СБП' : 'Оплата через ЮКассу'}>
          <div className={styles.paymentInstructions}>
            {isSBP ? (
              <>
                <h3>Инструкция по оплате:</h3>
                <ol>
                  <li>Отсканируйте QR-код ниже или переведите средства на указанные реквизиты</li>
                  <li>
                    В комментарии к переводу обязательно укажите:{' '}
                    <strong>{payment.paymentComment}</strong>
                  </li>
                  <li>После оплаты загрузите квитанцию об оплате</li>
                </ol>

                <div className={styles.qrCodeContainer}>
                  {payment.qrCode && (
                    <img src={payment.qrCode} alt="QR-код для оплаты" className={styles.qrCode} />
                  )}
                </div>
              </>
            ) : isYooKassa ? (
              <>
                <h3>Оплата через ЮКассу</h3>
                <p>Вы будете перенаправлены на страницу оплаты ЮКассы.</p>
                {payment.paymentUrl ? (
                  <div className={styles.paymentUrlContainer}>
                    <Button
                      variant="primary"
                      onClick={() => {
                        window.location.href = payment.paymentUrl;
                      }}
                      style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
                    >
                      Перейти к оплате
                    </Button>
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>
                      Если перенаправление не произошло автоматически, нажмите кнопку выше
                    </p>
                  </div>
                ) : (
                  <p>Ожидание создания платежа...</p>
                )}
              </>
            ) : null}

            <div className={styles.paymentDetails}>
              <div className={styles.detailRow}>
                <span>Сумма к оплате:</span>
                <strong>{payment.amount.toLocaleString('ru-RU')} ₽</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Тариф:</span>
                <strong>{payment.planType}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Период:</span>
                <strong>
                  {payment.billingPeriod === 'monthly'
                    ? '1 месяц'
                    : payment.billingPeriod === 'quarterly'
                    ? '3 месяца'
                    : payment.billingPeriod === 'semiAnnual'
                    ? '6 месяцев'
                    : '12 месяцев'}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Комментарий для перевода:</span>
                <strong className={styles.comment}>{payment.paymentComment}</strong>
              </div>
            </div>

            <div className={styles.uploadSection}>
              <h3>Загрузить квитанцию об оплате</h3>
              <input
                type="file"
                id="receipt-upload"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={uploadReceiptMutation.isPending}
                className={styles.fileInput}
              />
              <label htmlFor="receipt-upload" className={styles.fileLabel}>
                {uploadReceiptMutation.isPending
                  ? 'Загрузка...'
                  : 'Выберите файл квитанции (JPG, PNG, PDF)'}
              </label>
              {payment.receiptFile && (
                <p className={styles.uploadedFile}>
                  <FaCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Квитанция загружена: {payment.receiptFileName}
                </p>
              )}
            </div>

            <div className={styles.expiresInfo}>
              <p>
                <FaClock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Срок ожидания оплаты истекает:{' '}
                {new Date(payment.expiresAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.paymentPage}>
      <Card title="Выберите тарифный план и период подписки">
        <div className={styles.planSelection}>
          <div className={styles.billingPeriodSelector}>
            <h3>Выберите период подписки:</h3>
            <div className={styles.periodButtons}>
              {['monthly', 'quarterly', 'semiAnnual', 'annual'].map((period) => {
                const labels: Record<string, string> = {
                  monthly: '1 месяц',
                  quarterly: '3 месяца (-10%)',
                  semiAnnual: '6 месяцев (-20%)',
                  annual: '12 месяцев (-30%)',
                };
                return (
                  <button
                    key={period}
                    onClick={() => setSelectedBillingPeriod(period)}
                    className={`${styles.periodButton} ${
                      selectedBillingPeriod === period ? styles.active : ''
                    }`}
                  >
                    {labels[period]}
                  </button>
                );
              })}
            </div>
          </div>

          {plans && (
            <div className={styles.plansGrid}>
              {plans.map((plan: any) => {
                const billingPeriods = plan.billingPeriods || {};
                const periodData =
                  billingPeriods[selectedBillingPeriod] || { price: plan.price, discount: 0 };
                const pricePerMonth =
                  selectedBillingPeriod === 'monthly'
                    ? periodData.price
                    : Math.round(
                        periodData.price /
                          (selectedBillingPeriod === 'quarterly'
                            ? 3
                            : selectedBillingPeriod === 'semiAnnual'
                            ? 6
                            : 12),
                      );

                return (
                  <div
                    key={plan.type}
                    className={`${styles.planCard} ${
                      selectedPlan === plan.type ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedPlan(plan.type)}
                  >
                    <h4>{plan.name}</h4>
                    <p className={styles.planDescription}>{plan.description}</p>
                    <div className={styles.planPrice}>
                      <div className={styles.priceMain}>
                        {periodData.price.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className={styles.pricePerMonth}>
                        {pricePerMonth.toLocaleString('ru-RU')} ₽/месяц
                        {periodData.discount > 0 && (
                          <span className={styles.discount}>
                            {' '}
                            (экономия {periodData.discount}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={selectedPlan === plan.type ? 'primary' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan.type);
                      }}
                    >
                      {selectedPlan === plan.type ? 'Выбрано' : 'Выбрать'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleCreatePayment}
              disabled={!selectedPlan || createPaymentMutation.isPending}
              style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
            >
              {createPaymentMutation.isPending ? 'Создание платежа...' : 'Перейти к оплате'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

