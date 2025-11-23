import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button, Input, Select } from '../components/Form';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/api.client';
import { toast } from '../utils/toast';
import { FaBuilding, FaUsers, FaPlus, FaUserPlus } from 'react-icons/fa';
import styles from './OrganizationsPage.module.scss';

export const OrganizationsPage = () => {
  const queryClient = useQueryClient();
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    description: '',
  });
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'MEMBER' as 'OWNER' | 'ADMIN' | 'MEMBER',
  });

  // Получаем список организаций
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiClient.instance.get('/organizations');
      return response.data;
    },
  });

  // Получаем членов выбранной организации
  const { data: members, isLoading: membersLoading, isError: membersError } = useQuery({
    queryKey: ['organization-members', selectedOrganization],
    queryFn: async () => {
      if (!selectedOrganization) return [];
      const response = await apiClient.instance.get(`/organizations/${selectedOrganization}/members`);
      return response.data;
    },
    enabled: !!selectedOrganization,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки членов организации');
    },
  });

  // Мутация для создания организации
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.instance.post('/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreateModalOpen(false);
      setNewOrganization({ name: '', description: '' });
      toast.success('Организация создана!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании организации');
    },
  });

  // Мутация для добавления члена
  const addMemberMutation = useMutation({
    mutationFn: async ({ orgId, data }: { orgId: string; data: any }) => {
      const response = await apiClient.instance.post(`/organizations/${orgId}/members`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      setIsAddMemberModalOpen(false);
      setNewMember({ email: '', role: 'MEMBER' });
      toast.success('Член добавлен!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при добавлении члена');
    },
  });

  const handleCreateOrganization = () => {
    if (!newOrganization.name) {
      toast.warning('Введите название организации');
      return;
    }
    createOrganizationMutation.mutate(newOrganization);
  };

  const handleAddMember = () => {
    if (!selectedOrganization) {
      toast.warning('Выберите организацию');
      return;
    }
    if (!newMember.email) {
      toast.warning('Введите email');
      return;
    }
    addMemberMutation.mutate({ orgId: selectedOrganization, data: newMember });
  };

  const organizationColumns = [
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
      header: 'Членов',
      render: (item: any) => item.membersCount || 0,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSelectedOrganization(item.id)}
        >
          Управление
        </Button>
      ),
    },
  ];

  const memberColumns = [
    {
      key: 'email',
      header: 'Email',
      render: (item: any) => item.user?.email || item.email || '-',
    },
    {
      key: 'name',
      header: 'Имя',
      render: (item: any) =>
        item.user
          ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || '-'
          : '-',
    },
    {
      key: 'role',
      header: 'Роль',
      render: (item: any) => {
        const roleMap: Record<string, string> = {
          OWNER: 'Владелец',
          ADMIN: 'Администратор',
          MEMBER: 'Участник',
        };
        return roleMap[item.role] || item.role;
      },
    },
  ];

  return (
    <div className={styles.organizations}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FaBuilding className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Организации</h1>
              <p className={styles.subtitle}>
                Управление организациями и их членами
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FaPlus /> Создать организацию
          </Button>
        </div>

        <div className={styles.grid}>
          <div className={styles.main}>
            <Card className={styles.orgsCard}>
              <h2 className={styles.cardTitle}>Мои организации</h2>
              <Table
                columns={organizationColumns}
                data={organizations || []}
                loading={orgsLoading}
                emptyMessage="Организации не найдены"
              />
            </Card>

            {selectedOrganization && (
              <Card className={styles.membersCard}>
                <div className={styles.membersHeader}>
                  <h2 className={styles.cardTitle}>
                    <FaUsers /> Члены организации
                  </h2>
                  <Button
                    size="sm"
                    onClick={() => setIsAddMemberModalOpen(true)}
                  >
                    <FaUserPlus /> Добавить члена
                  </Button>
                </div>
                <Table
                  columns={memberColumns}
                  data={members || []}
                  loading={membersLoading}
                  emptyMessage="Члены не найдены"
                />
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать организацию"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={createOrganizationMutation.isPending}
            >
              {createOrganizationMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </>
        }
      >
        <div className={styles.orgForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Название *</label>
            <Input
              type="text"
              value={newOrganization.name}
              onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
              placeholder="Название организации"
              style={{ width: '100%' }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <Input
              type="text"
              value={newOrganization.description}
              onChange={(e) => setNewOrganization({ ...newOrganization, description: e.target.value })}
              placeholder="Описание организации"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Добавить члена"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsAddMemberModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? 'Добавление...' : 'Добавить'}
            </Button>
          </>
        }
      >
        <div className={styles.memberForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email *</label>
            <Input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="email@example.com"
              style={{ width: '100%' }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Роль *</label>
            <Select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
              options={[
                { value: 'MEMBER', label: 'Участник' },
                { value: 'ADMIN', label: 'Администратор' },
                { value: 'OWNER', label: 'Владелец' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

