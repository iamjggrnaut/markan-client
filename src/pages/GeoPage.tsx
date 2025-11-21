import { useState } from 'react';
import { GeoMap } from '../components/GeoMap';
import { Card } from '../components/Card';
import { Filters } from '../components/Filters';
import { Table } from '../components/Table';
import styles from './GeoPage.module.scss';

export const GeoPage = () => {
  const [period, setPeriod] = useState('week');
  const [source, setSource] = useState('marketplace');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Пример данных для таблиц (в реальности будут из API)
  const ordersData = [
    { region: 'Название Региона', quantity: '259 шт.', amount: '259 000 Р.', share: '25%' },
    { region: 'Название Региона', quantity: '259 шт.', amount: '259 000 Р.', share: '25%' },
    { region: 'Название Региона', quantity: '259 шт.', amount: '259 000 Р.', share: '25%' },
    { region: 'Название Региона', quantity: '259 шт.', amount: '259 000 Р.', share: '25%' },
    { region: 'Название Региона', quantity: '259 шт.', amount: '259 000 Р.', share: '25%' },
  ];

  const salesData = [
    { region: 'Название Региона', total: '259 шт. 0.45%', totalShare: '25%', byWarehouse: '25%' },
    { region: 'Название Региона', total: '259 шт. 0.45%', totalShare: '25%', byWarehouse: '25%' },
    { region: 'Название Региона', total: '259 шт. 0.45%', totalShare: '25%', byWarehouse: '25%' },
    { region: 'Название Региона', total: '259 шт. 0.45%', totalShare: '25%', byWarehouse: '25%' },
    { region: 'Название Региона', total: '259 шт. 0.45%', totalShare: '25%', byWarehouse: '25%' },
  ];

  const ordersColumns = [
    { key: 'region', header: 'Регион' },
    { key: 'quantity', header: 'Количество' },
    { key: 'amount', header: 'Сумма' },
    { key: 'share', header: 'Доля' },
  ];

  const salesColumns = [
    { key: 'region', header: 'Регион' },
    { key: 'total', header: 'Всего' },
    { key: 'totalShare', header: 'Общая доля' },
    { key: 'byWarehouse', header: 'По складу' },
  ];

  return (
    <div className={styles.geo}>
      <Filters
        selectedPeriod={period}
        selectedSource={source}
        selectedRegion={selectedRegion}
        onPeriodChange={setPeriod}
        onSourceChange={setSource}
        onRegionChange={setSelectedRegion}
        showRegions={true}
        regions={[
          { value: 'russia', label: 'Российская Федерация' },
          { value: 'kaliningrad', label: 'Калининградская область' },
        ]}
      />

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <Card className={styles.mapCard}>
            <GeoMap />
          </Card>
        </div>

        <div className={styles.tablesGrid}>
          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Заказы - ТОП-5 регионов</h3>
              <div className={styles.tableIcons}>
                <button className={styles.tableIcon} title="Гистограмма">
                  <span>📊</span>
                </button>
                <button className={styles.tableIcon} title="График">
                  <span>📈</span>
                </button>
                <button className={styles.tableIcon} title="Таблица">
                  <span>📋</span>
                </button>
              </div>
            </div>
            <Table data={ordersData} columns={ordersColumns} />
          </Card>

          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Продажи - ТОП-5 регионов</h3>
              <div className={styles.tableIcons}>
                <button className={styles.tableIcon} title="Гистограмма">
                  <span>📊</span>
                </button>
                <button className={styles.tableIcon} title="График">
                  <span>📈</span>
                </button>
                <button className={styles.tableIcon} title="Таблица">
                  <span>📋</span>
                </button>
              </div>
            </div>
            <Table data={salesData} columns={salesColumns} />
          </Card>
        </div>
      </div>
    </div>
  );
};

