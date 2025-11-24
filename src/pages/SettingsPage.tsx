import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Button, Select, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import { pushNotificationService } from '../utils/push-notifications';
import { toast } from '../utils/toast';
import { usePWA } from '../hooks/usePWA';
import { ROUTES } from '../constants/routes.constants';
import styles from './SettingsPage.module.scss';

export const SettingsPage = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'notifications' | 'plan' | 'pwa' | 'legal' | 'general'>('profile');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isAddIntegrationModalOpen, setIsAddIntegrationModalOpen] = useState(false);
  const [isEditIntegrationModalOpen, setIsEditIntegrationModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [newIntegration, setNewIntegration] = useState({
    marketplaceType: 'wildberries',
    accountName: '',
    apiKey: '',
    apiSecret: '',
    token: '',
  });
  const [editIntegration, setEditIntegration] = useState({
    accountName: '',
    apiKey: '',
    apiSecret: '',
    token: '',
  });
  const { isInstalled, install } = usePWA();

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/integrations');
      return response.data;
    },
  });

  // Получаем задачи синхронизации для всех интеграций
  const [syncStatuses, setSyncStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!integrations || integrations.length === 0) return;

    const fetchSyncStatuses = async () => {
      const statuses: Record<string, any> = {};
      for (const integration of integrations) {
        try {
          const response = await apiClient.instance.get(`/sync/accounts/${integration.id}/statistics`);
          statuses[integration.id] = response.data;
        } catch (error) {
          // Игнорируем ошибки для интеграций без статуса синхронизации
        }
      }
      setSyncStatuses(statuses);
    };

    fetchSyncStatuses();
    const interval = setInterval(fetchSyncStatuses, 10000); // Обновляем каждые 10 секунд
    return () => clearInterval(interval);
  }, [integrations]);

  const { data: notificationsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/notifications/preferences');
      const prefs = response.data || [];
      // Преобразуем массив в объект для удобства
      const prefsMap: Record<string, Record<string, boolean>> = {};
      prefs.forEach((pref: any) => {
        if (!prefsMap[pref.type]) {
          prefsMap[pref.type] = {};
        }
        prefsMap[pref.type][pref.channel] = pref.enabled;
      });
      return prefsMap;
    },
  });

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/users/me/settings');
      return response.data as any;
    },
  });

  const updateNotificationPreference = useMutation({
    mutationFn: async ({ type, channel, enabled }: { type: string; channel: string; enabled: boolean }) => {
      const response = await apiClient.instance.post('/notifications/preferences', {
        type,
        channel,
        enabled,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const updateUserSettings = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiClient.instance.put('/users/me/settings', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });

  const { data: userPlan } = useQuery({
    queryKey: ['user-plan'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/users/me');
      return (response.data as any).plan;
    },
  });

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/plans/my/trial');
      return response.data as any;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/plans');
      return response.data as any[];
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
          } catch (error: any) {
            console.error('Failed to register push subscription:', error);
            // Не блокируем пользователя, если push не работает
            if (error.response?.status !== 404) {
              toast.warning('Не удалось зарегистрировать push-уведомления. Они могут быть недоступны.');
            }
          }
        }
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'general', label: 'Общие настройки' },
    { id: 'integrations', label: 'Интеграции' },
    { id: 'notifications', label: 'Уведомления' },
    { id: 'plan', label: 'Тариф' },
    { id: 'pwa', label: 'PWA' },
    { id: 'legal', label: 'Юридические документы' },
    { id: 'organizations', label: 'Организации', link: '/organizations' },
    { id: 'api-keys', label: 'API Ключи', link: '/api-keys' },
  ];

  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.instance.post('/integrations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsAddIntegrationModalOpen(false);
      setNewIntegration({
        marketplaceType: 'wildberries',
        accountName: '',
        apiKey: '',
        apiSecret: '',
        token: '',
      });
      toast.success('Интеграция успешно добавлена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при добавлении интеграции');
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.instance.patch(`/integrations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setIsEditIntegrationModalOpen(false);
      setEditingIntegration(null);
      setEditIntegration({
        accountName: '',
        apiKey: '',
        apiSecret: '',
        token: '',
      });
      toast.success('Интеграция успешно обновлена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении интеграции');
    },
  });

  // Мутация для запуска синхронизации
  const syncIntegrationMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiClient.instance.post(`/sync/accounts/${accountId}`, {
        type: 'FULL',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success('Синхронизация запущена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при запуске синхронизации');
    },
  });

  const handleSyncIntegration = (integrationId: string) => {
    if (confirm('Запустить синхронизацию данных для этой интеграции?')) {
      syncIntegrationMutation.mutate(integrationId);
    }
  };

  const handleIntegrationConfigure = (integration: any) => {
    setEditingIntegration(integration);
    setEditIntegration({
      accountName: integration.accountName || '',
      apiKey: '', // Не показываем существующий ключ из соображений безопасности
      apiSecret: '',
      token: '',
    });
    setIsEditIntegrationModalOpen(true);
  };

  const handleAddIntegration = () => {
    setIsAddIntegrationModalOpen(true);
  };

  const handleSubmitIntegration = () => {
    if (!newIntegration.accountName || !newIntegration.apiKey) {
      toast.warning('Заполните обязательные поля: название аккаунта и API ключ');
      return;
    }

    const payload: any = {
      marketplaceType: newIntegration.marketplaceType,
      accountName: newIntegration.accountName,
      apiKey: newIntegration.apiKey,
    };

    if (newIntegration.apiSecret) {
      payload.apiSecret = newIntegration.apiSecret;
    }

    if (newIntegration.token) {
      payload.token = newIntegration.token;
    }

    createIntegrationMutation.mutate(payload);
  };

  const handleSubmitEditIntegration = () => {
    if (!editingIntegration) return;

    if (!editIntegration.accountName) {
      toast.warning('Заполните обязательное поле: название аккаунта');
      return;
    }

    // Обновляем только те поля, которые были изменены
    const payload: any = {
      accountName: editIntegration.accountName,
    };

    // Обновляем ключи только если они были введены
    if (editIntegration.apiKey) {
      payload.apiKey = editIntegration.apiKey;
    }

    if (editIntegration.apiSecret) {
      payload.apiSecret = editIntegration.apiSecret;
    }

    if (editIntegration.token) {
      payload.token = editIntegration.token;
    }

    updateIntegrationMutation.mutate({ id: editingIntegration.id, data: payload });
  };

  return (
    <div className={styles.settings}>
      <div className={styles.content}>
        <h1 className={styles.title}>Настройки</h1>

      <div className={styles.tabs}>
        {tabs.map((tab) => {
          if (tab.link) {
            return (
              <Link
                key={tab.id}
                to={tab.link}
                className={`${styles.tab} ${location.pathname === tab.link ? styles.active : ''}`}
              >
                {tab.label}
              </Link>
            );
          }
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <Card title="Настройки профиля">
            <p>Перейдите в раздел "Профиль" для изменения личных данных.</p>
            <Button variant="secondary" onClick={() => window.location.href = ROUTES.PROFILE}>
              Открыть профиль
            </Button>
          </Card>
        )}

        {activeTab === 'general' && (
          <Card title="Общие настройки">
            {userSettings ? (
              <div className={styles.generalSettings}>
                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>Язык интерфейса</label>
                  <Select
                    value={(userSettings as any)?.language || 'ru'}
                    onChange={(e) => {
                      updateUserSettings.mutate({
                        ...userSettings,
                        language: e.target.value,
                      });
                    }}
                    options={[
                      { value: 'ru', label: 'Русский' },
                      { value: 'en', label: 'English' },
                    ]}
                    style={{ width: '200px' }}
                  />
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>Часовой пояс</label>
                  <Select
                    value={(userSettings as any)?.timezone || 'Europe/Moscow'}
                    onChange={(e) => {
                      updateUserSettings.mutate({
                        ...userSettings,
                        timezone: e.target.value,
                      });
                    }}
                    options={[
                      { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
                      { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
                      { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
                      { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
                      { value: 'UTC', label: 'UTC' },
                    ]}
                    style={{ width: '200px' }}
                  />
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={(userSettings as any)?.emailNotifications !== false}
                      onChange={(e) => {
                        updateUserSettings.mutate({
                          ...userSettings,
                          emailNotifications: e.target.checked,
                        });
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Email уведомления
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={(userSettings as any)?.pushNotifications !== false}
                      onChange={(e) => {
                        updateUserSettings.mutate({
                          ...userSettings,
                          pushNotifications: e.target.checked,
                        });
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Push уведомления
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={(userSettings as any)?.telegramNotifications !== false}
                      onChange={(e) => {
                        updateUserSettings.mutate({
                          ...userSettings,
                          telegramNotifications: e.target.checked,
                        });
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Telegram уведомления
                  </label>
                </div>

                {updateUserSettings.isPending && (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                    Сохранение...
                  </p>
                )}
              </div>
            ) : (
              <p>Загрузка...</p>
            )}
          </Card>
        )}

        {activeTab === 'integrations' && (
          <Card title="Интеграции с маркетплейсами">
            {integrations && integrations.length > 0 ? (
              <div className={styles.integrationsList}>
                {integrations.map((integration: any) => {
                  const syncStatus = syncStatuses[integration.id];
                  const lastSync = syncStatus?.lastSyncAt 
                    ? new Date(syncStatus.lastSyncAt).toLocaleString('ru-RU')
                    : integration.lastSyncAt
                    ? new Date(integration.lastSyncAt).toLocaleString('ru-RU')
                    : 'Никогда';
                  
                  return (
                    <div key={integration.id} className={styles.integrationItem}>
                      <div>
                        <h3>{integration.accountName || integration.marketplaceType || integration.marketplace}</h3>
                        <p className={styles.integrationStatus}>
                          Статус: {integration.status === 'ACTIVE' ? 'Активна' : integration.status === 'INACTIVE' ? 'Неактивна' : integration.status || 'Неизвестно'}
                        </p>
                        <p className={styles.integrationSyncStatus}>
                          Последняя синхронизация: {lastSync}
                        </p>
                        {syncStatus?.lastSyncStatus && (
                          <p className={styles.integrationSyncStatus}>
                            Статус: {syncStatus.lastSyncStatus}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={syncIntegrationMutation.isPending}
                        >
                          {syncIntegrationMutation.isPending ? 'Синхронизация...' : 'Синхронизировать'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleIntegrationConfigure(integration)}
                        >
                          Настроить
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Интеграции не настроены</p>
            )}
            <Button 
              style={{ marginTop: '1rem' }}
              onClick={handleAddIntegration}
            >
              Добавить интеграцию
            </Button>
          </Card>
        )}

        <Modal
          isOpen={isAddIntegrationModalOpen}
          onClose={() => setIsAddIntegrationModalOpen(false)}
          title="Добавить интеграцию"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsAddIntegrationModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitIntegration}
                disabled={createIntegrationMutation.isPending}
              >
                {createIntegrationMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </>
          }
        >
          <div className={styles.integrationForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Маркетплейс *</label>
              <Select
                value={newIntegration.marketplaceType}
                onChange={(e) => setNewIntegration({ ...newIntegration, marketplaceType: e.target.value })}
                options={[
                  { value: 'wildberries', label: 'Wildberries' },
                  { value: 'ozon', label: 'Ozon' },
                ]}
                style={{ width: '100%' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Название аккаунта *</label>
              <Input
                type="text"
                value={newIntegration.accountName}
                onChange={(e) => setNewIntegration({ ...newIntegration, accountName: e.target.value })}
                placeholder="Например: Мой аккаунт Wildberries"
                style={{ width: '100%' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>API ключ *</label>
              <Input
                type="password"
                value={newIntegration.apiKey}
                onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
                placeholder="Введите API ключ"
                style={{ width: '100%' }}
              />
            </div>

            {newIntegration.marketplaceType === 'ozon' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>API Secret</label>
                <Input
                  type="password"
                  value={newIntegration.apiSecret}
                  onChange={(e) => setNewIntegration({ ...newIntegration, apiSecret: e.target.value })}
                  placeholder="Введите API Secret (для Ozon)"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Token (опционально)</label>
              <Input
                type="password"
                value={newIntegration.token}
                onChange={(e) => setNewIntegration({ ...newIntegration, token: e.target.value })}
                placeholder="Введите токен, если требуется"
                style={{ width: '100%' }}
              />
            </div>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
              * Обязательные поля
            </p>
          </div>
        </Modal>

        <Modal
          isOpen={isEditIntegrationModalOpen}
          onClose={() => {
            setIsEditIntegrationModalOpen(false);
            setEditingIntegration(null);
            setEditIntegration({
              accountName: '',
              apiKey: '',
              apiSecret: '',
              token: '',
            });
          }}
          title="Настроить интеграцию"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditIntegrationModalOpen(false);
                  setEditingIntegration(null);
                  setEditIntegration({
                    accountName: '',
                    apiKey: '',
                    apiSecret: '',
                    token: '',
                  });
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitEditIntegration}
                disabled={updateIntegrationMutation.isPending}
              >
                {updateIntegrationMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </>
          }
        >
          {editingIntegration && (
            <div className={styles.integrationForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Маркетплейс</label>
                <Input
                  type="text"
                  value={editingIntegration.marketplaceType || editingIntegration.marketplace || ''}
                  disabled
                  style={{ width: '100%', opacity: 0.6 }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Название аккаунта *</label>
                <Input
                  type="text"
                  value={editIntegration.accountName}
                  onChange={(e) => setEditIntegration({ ...editIntegration, accountName: e.target.value })}
                  placeholder="Например: Мой аккаунт Wildberries"
                  style={{ width: '100%' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>API ключ</label>
                <Input
                  type="password"
                  value={editIntegration.apiKey}
                  onChange={(e) => setEditIntegration({ ...editIntegration, apiKey: e.target.value })}
                  placeholder="Введите новый API ключ (оставьте пустым, чтобы не изменять)"
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Оставьте пустым, если не хотите изменять ключ
                </p>
              </div>

              {(editingIntegration.marketplaceType === 'ozon' || editingIntegration.marketplace === 'ozon') && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>API Secret</label>
                  <Input
                    type="password"
                    value={editIntegration.apiSecret}
                    onChange={(e) => setEditIntegration({ ...editIntegration, apiSecret: e.target.value })}
                    placeholder="Введите новый API Secret (оставьте пустым, чтобы не изменять)"
                    style={{ width: '100%' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Оставьте пустым, если не хотите изменять секрет
                  </p>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token (опционально)</label>
                <Input
                  type="password"
                  value={editIntegration.token}
                  onChange={(e) => setEditIntegration({ ...editIntegration, token: e.target.value })}
                  placeholder="Введите новый токен (оставьте пустым, чтобы не изменять)"
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Оставьте пустым, если не хотите изменять токен
                </p>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
                * Обязательные поля. Поля для ключей можно оставить пустыми, если не хотите их изменять.
              </p>
            </div>
          )}
        </Modal>

        {activeTab === 'notifications' && (
          <Card title="Настройки уведомлений">
            {notificationsData ? (
              <div className={styles.notificationsSettings}>
                <div className={styles.notificationSection}>
                  <h3>Типы уведомлений</h3>
                  <div className={styles.notificationTypes}>
                    {[
                      { type: 'new_order', label: 'Новые заказы' },
                      { type: 'low_stock', label: 'Низкий остаток товара' },
                      { type: 'sales_drop', label: 'Падение продаж' },
                      { type: 'price_change', label: 'Изменение цены' },
                      { type: 'competitor_price_change', label: 'Изменение цены конкурента' },
                      { type: 'anomaly_detected', label: 'Обнаружена аномалия' },
                      { type: 'sync_completed', label: 'Синхронизация завершена' },
                      { type: 'sync_failed', label: 'Ошибка синхронизации' },
                      { type: 'report_ready', label: 'Отчет готов' },
                    ].map(({ type, label }) => {
                      const typePrefs = notificationsData[type] || {};
                      return (
                        <div key={type} className={styles.notificationType}>
                          <h4 style={{ marginBottom: '0.5rem' }}>{label}</h4>
                          <div className={styles.channelSettings}>
                            <label className={styles.channelLabel}>
                              <input
                                type="checkbox"
                                checked={typePrefs.email !== false}
                                onChange={(e) => {
                                  updateNotificationPreference.mutate({
                                    type,
                                    channel: 'email',
                                    enabled: e.target.checked,
                                  });
                                }}
                                style={{ marginRight: '0.5rem' }}
                              />
                              Email
                            </label>
                            <label className={styles.channelLabel}>
                              <input
                                type="checkbox"
                                checked={typePrefs.push !== false}
                                onChange={(e) => {
                                  updateNotificationPreference.mutate({
                                    type,
                                    channel: 'push',
                                    enabled: e.target.checked,
                                  });
                                }}
                                style={{ marginRight: '0.5rem' }}
                              />
                              Push
                            </label>
                            <label className={styles.channelLabel}>
                              <input
                                type="checkbox"
                                checked={typePrefs.telegram !== false}
                                onChange={(e) => {
                                  updateNotificationPreference.mutate({
                                    type,
                                    channel: 'telegram',
                                    enabled: e.target.checked,
                                  });
                                }}
                                style={{ marginRight: '0.5rem' }}
                              />
                              Telegram
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {updateNotificationPreference.isPending && (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
                    Сохранение...
                  </p>
                )}
              </div>
            ) : (
              <p>Загрузка...</p>
            )}
          </Card>
        )}

        {activeTab === 'plan' && (
          <Card title="Тарифный план">
            <div className={styles.planInfo}>
              <h3>Текущий план: {(userPlan as any)?.name || 'Basic'}</h3>
              {(trialInfo as any)?.isTrial && (
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
                    Осталось дней: <strong>{(trialInfo as any).daysRemaining}</strong>
                  </p>
                  {(trialInfo as any).trialEndDate && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Завершится: {new Date((trialInfo as any).trialEndDate).toLocaleDateString('ru-RU')}
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

                {plans && Array.isArray(plans) && (
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
                            backgroundColor: plan.type === (userPlan as any)?.type ? '#f0f9ff' : 'white',
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
                            variant={plan.type === (userPlan as any)?.type ? 'secondary' : 'primary'}
                            onClick={() => {
                              if (plan.type === (userPlan as any)?.type) return;
                              // Перенаправляем на страницу оплаты
                              window.location.href = `${ROUTES.PAYMENT}?plan=${plan.type}&period=${selectedBillingPeriod}`;
                            }}
                            disabled={plan.type === (userPlan as any)?.type}
                            style={{ width: '100%' }}
                          >
                            {plan.type === (userPlan as any)?.type ? 'Текущий план' : 'Оплатить'}
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
    </div>
  );
};

