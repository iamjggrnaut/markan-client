import { Link, useLocation } from 'react-router-dom';
import { 
  // FaChartBar, FaBox, FaChartLine, FaMapMarkedAlt, FaFileAlt, 
  FaBolt } from 'react-icons/fa';
import styles from './Navigation.module.scss';

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Сводка продаж' },
    { path: '/products', label: 'Расчет поставок' },
    { path: '/geo', label: 'География заказов' },
    { path: '/analytics', label: 'Товарная аналитика' },
    { path: '/orders', label: 'Лента заказов' },
    { path: '/reports', label: 'Еженедельные отчеты' },
  ];

  const getActivePath = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return '/dashboard';
    if (path.startsWith('/geo')) return '/geo';
    if (path.startsWith('/analytics')) return '/analytics';
    if (path.startsWith('/products')) return '/products';
    if (path.startsWith('/orders')) return '/orders';
    if (path.startsWith('/reports')) return '/reports';
    return path;
  };

  const activePath = getActivePath();

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        <div className={styles.leftSection}>
          <ul className={styles.menu}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`${styles.link} ${
                    activePath === item.path ? styles.active : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.rightSection}>
          <Link to="/optimization" className={styles.optimization}>
            <span>Оптимизация</span>
            <FaBolt className={styles.optimizationIcon} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

