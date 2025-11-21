import { ReactNode } from 'react';
import styles from './Table.module.scss';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Нет данных',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Загрузка...</span>
      </div>
    );
  }

  // Проверяем, что data - это массив
  if (!Array.isArray(data)) {
    return <div className={styles.empty}>Ошибка: данные не являются массивом</div>;
  }

  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={styles.th}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className={onRowClick ? styles.clickable : ''}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className={styles.td}>
                  {column.render
                    ? column.render(item)
                    : item[column.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

