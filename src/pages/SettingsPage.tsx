import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Button } from '../components/Form';
import { apiClient } from '../services/api.client';
import { pushNotificationService } from '../utils/push-notifications';
import { usePWA } from '../hooks/usePWA';
import styles from './SettingsPage.module.scss';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'notifications' | 'plan' | 'pwa' | 'legal'>('profile');
  const [pushEnabled, setPushEnabled] = useState(false);
  const { isInstalled, install } = usePWA();

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/integrations/accounts');
      return response.data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/notifications/preferences');
      return response.data;
    },
  });

  const { data: userPlan } = useQuery({
    queryKey: ['user-plan'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/users/profile');
      return response.data.plan;
    },
  });

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/plans/my/trial');
      return response.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/plans');
      return response.data;
    },
  });

  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('annual');

  useEffect(() => {
    // Проверяем статус Push подписки
    pushNotificationService.getSubscription().then((sub) => {
      setPushEnabled(!!sub);
    });
  }, []);

  const handlePushToggle = async () => {
    if (pushEnabled) {
      // Отписываемся
      await pushNotificationService.unsubscribe();
      setPushEnabled(false);
    } else {
      // Подписываемся
      const permission = await pushNotificationService.requestPermission();
      if (permission === 'granted') {
        const subscription = await pushNotificationService.subscribe();
        if (subscription) {
          const subData = pushNotificationService.formatSubscription(subscription);
          // Отправляем подписку на сервер
          try {
            await apiClient.instance.post('/notifications/push/subscribe', subData);
            setPushEnabled(true);
          } catch (error) {
            console.error('Failed to register push subscription:', error);
          }
        }
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'integrations', label: 'Интеграции' },
    { id: 'notifications', label: 'Уведомления' },
    { id: 'plan', label: 'Тариф' },
    { id: 'pwa', label: 'PWA' },
    { id: 'legal', label: 'Юридические документы' },
  ];

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Настройки</h1>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <Card title="Настройки профиля">
            <p>Перейдите в раздел "Профиль" для изменения личных данных.</p>
            <Button variant="secondary" onClick={() => window.location.href = '/profile'}>
              Открыть профиль
            </Button>
          </Card>
        )}

        {activeTab === 'integrations' && (
          <Card title="Интеграции с маркетплейсами">
            {integrations && integrations.length > 0 ? (
              <div className={styles.integrationsList}>
                {integrations.map((integration: any) => (
                  <div key={integration.id} className={styles.integrationItem}>
                    <div>
                      <h3>{integration.marketplace}</h3>
                      <p className={styles.integrationStatus}>
                        {integration.isActive ? 'Активна' : 'Неактивна'}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Настроить
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p>Интеграции не настроены</p>
            )}
            <Button style={{ marginTop: '1rem' }}>
              Добавить интеграцию
            </Button>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card title="Настройки уведомлений">
            {notifications ? (
              <div className={styles.notificationsSettings}>
                <p>Настройки уведомлений будут здесь</p>
              </div>
            ) : (
              <p>Загрузка...</p>
            )}
          </Card>
        )}

        {activeTab === 'plan' && (
          <Card title="Тарифный план">
            <div className={styles.planInfo}>
              <h3>Текущий план: {userPlan?.name || 'Basic'}</h3>
              {trialInfo?.isTrial && (
                <div className={styles.trialInfo} style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9'
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🎉 Пробный период активен
                  </p>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Осталось дней: <strong>{trialInfo.daysRemaining}</strong>
                  </p>
                  {trialInfo.trialEndDate && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Завершится: {new Date(trialInfo.trialEndDate).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Выберите период подписки</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: selectedBillingPeriod === period ? '2px solid #0284c7' : '1px solid #e5e7eb',
                          backgroundColor: selectedBillingPeriod === period ? '#0284c7' : 'white',
                          color: selectedBillingPeriod === period ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontWeight: 'semibold',
                        }}
                      >
                        {labels[period]}
                      </button>
                    );
                  })}
                </div>

                {plans && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {plans.map((plan: any) => {
                      const billingPeriods = plan.billingPeriods || {};
                      const periodData = billingPeriods[selectedBillingPeriod] || { price: plan.price, discount: 0 };
                      const pricePerMonth = selectedBillingPeriod === 'monthly' 
                        ? periodData.price 
                        : Math.round(periodData.price / (selectedBillingPeriod === 'quarterly' ? 3 : selectedBillingPeriod === 'semiAnnual' ? 6 : 12));
                      
                      return (
                        <div
                          key={plan.type}
                          style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            backgroundColor: plan.type === userPlan?.type ? '#f0f9ff' : 'white',
                          }}
                        >
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {plan.name}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                            {plan.description}
                          </p>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                              {periodData.price.toLocaleString('ru-RU')} ₽
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {pricePerMonth.toLocaleString('ru-RU')} ₽/месяц
                              {periodData.discount > 0 && (
                                <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 'semibold' }}>
                                  Экономия {periodData.discount}%
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={plan.type === userPlan?.type ? 'secondary' : 'primary'}
                            onClick={() => {
                              if (plan.type === userPlan?.type) return;
                              // Перенаправляем на страницу оплаты
                              window.location.href = `/payment?plan=${plan.type}&period=${selectedBillingPeriod}`;
                            }}
                            disabled={plan.type === userPlan?.type}
                            style={{ width: '100%' }}
                          >
                            {plan.type === userPlan?.type ? 'Текущий план' : 'Оплатить'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'pwa' && (
          <Card title="PWA настройки">
            <div className={styles.pwaSettings}>
              <div className={styles.pwaItem}>
                <div>
                  <h3>Установка приложения</h3>
                  <p>
                    {isInstalled
                      ? 'Приложение установлено'
                      : 'Установите приложение для работы оффлайн'}
                  </p>
                </div>
                {!isInstalled && (
                  <Button onClick={install} variant="primary">
                    Установить
                  </Button>
                )}
              </div>

              <div className={styles.pwaItem}>
                <div>
                  <h3>Push уведомления</h3>
                  <p>
                    {pushEnabled
                      ? 'Push уведомления включены'
                      : 'Включите push уведомления для получения обновлений'}
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={handlePushToggle}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.pwaItem}>
                <div>
                  <h3>Оффлайн режим</h3>
                  <p>
                    Приложение работает оффлайн благодаря Service Worker
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'legal' && (
          <Card title="Юридические документы">
            <div className={styles.legalDocs}>
              <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                Ознакомьтесь с нашими юридическими документами:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Link 
                  to="/terms" 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#111827',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Пользовательское соглашение
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    Условия использования сервиса Nebula Markan
                  </p>
                </Link>

                <Link 
                  to="/privacy" 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#111827',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Политика конфиденциальности
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    Как мы собираем, используем и защищаем ваши данные
                  </p>
                </Link>

                <Link 
                  to="/refund" 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#111827',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Политика возврата средств
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    Условия и порядок возврата денежных средств
                  </p>
                </Link>

                <Link 
                  to="/api-policy" 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#111827',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                    Политика использования API
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    Условия использования программного интерфейса
                  </p>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

