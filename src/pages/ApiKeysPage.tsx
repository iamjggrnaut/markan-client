import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import { FaKey, FaPlus, FaTrash, FaCopy } from 'react-icons/fa';
import styles from './ApiKeysPage.module.scss';

export const ApiKeysPage = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Получаем список API ключей
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/api-keys');
      return response.data;
    },
  });

  // Мутация для создания API ключа
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.instance.post('/api-keys', { name });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsCreateModalOpen(false);
      setCreatedKey(data.key || data.apiKey);
      setNewKeyName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании ключа');
    },
  });

  // Мутация для удаления ключа
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiClient.instance.delete(`/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('Ключ удален!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении ключа');
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.warning('Введите название ключа');
      return;
    }
    createKeyMutation.mutate(newKeyName);
  };

  const handleDeleteKey = (keyId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот ключ?')) {
      deleteKeyMutation.mutate(keyId);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Ключ скопирован в буфер обмена!');
  };

  const columns = [
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'key',
      header: 'Ключ',
      render: (item: any) => {
        const keyValue = item.key || item.apiKey || '***';
        const maskedKey = keyValue.length > 20 
          ? `${keyValue.substring(0, 8)}...${keyValue.substring(keyValue.length - 8)}`
          : '***';
        return (
          <div className={styles.keyCell}>
            <span className={styles.maskedKey}>{maskedKey}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCopyKey(keyValue)}
              title="Копировать"
            >
              <FaCopy />
            </Button>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (item: any) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('ru-RU')
          : '-',
    },
    {
      key: 'lastUsedAt',
      header: 'Последнее использование',
      render: (item: any) =>
        item.lastUsedAt
          ? new Date(item.lastUsedAt).toLocaleDateString('ru-RU')
          : 'Никогда',
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDeleteKey(item.id)}
          disabled={deleteKeyMutation.isPending}
        >
          <FaTrash /> Удалить
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.apiKeys}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FaKey className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>API Ключи</h1>
              <p className={styles.subtitle}>
                Управление API ключами для доступа к API
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FaPlus /> Создать ключ
          </Button>
        </div>

        <Card className={styles.keysCard}>
          <Table
            columns={columns}
            data={apiKeys || []}
            loading={isLoading}
            emptyMessage="API ключи не найдены"
          />
        </Card>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewKeyName('');
          setCreatedKey(null);
        }}
        title="Создать API ключ"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewKeyName('');
                setCreatedKey(null);
              }}
            >
              Закрыть
            </Button>
            {!createdKey && (
              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
              >
                {createKeyMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            )}
          </>
        }
      >
        <div className={styles.keyForm}>
          {!createdKey ? (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Название ключа *</label>
                <Input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Например: Production API Key"
                  style={{ width: '100%' }}
                />
              </div>
              <p className={styles.warning}>
                ⚠️ Сохраните ключ сразу после создания! Он больше не будет показан.
              </p>
            </>
          ) : (
            <div className={styles.createdKey}>
              <h3 className={styles.createdKeyTitle}>Ключ создан!</h3>
              <div className={styles.keyDisplay}>
                <code className={styles.keyValue}>{createdKey}</code>
                <Button
                  onClick={() => handleCopyKey(createdKey)}
                  variant="primary"
                >
                  <FaCopy /> Копировать
                </Button>
              </div>
              <p className={styles.warning}>
                ⚠️ Сохраните этот ключ в безопасном месте. Он больше не будет показан.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

