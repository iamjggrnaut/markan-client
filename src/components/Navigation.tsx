import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  FaChartBar, 
  FaBox, 
  FaChartLine, 
  FaMapMarkedAlt, 
  FaFileAlt, 
  FaCog, 
  FaBolt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useAuthStore } from '../store/auth.store';
import styles from './Navigation.module.scss';

export const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Маппинг путей для соответствия новым названиям
  const navItems = [
    { path: '/dashboard', label: 'Сводка продаж', icon: FaChartBar },
    { path: '/products', label: 'Расчет поставок', icon: FaBox },
    { path: '/geo', label: 'География заказов', icon: FaMapMarkedAlt },
    { path: '/analytics', label: 'Товарная аналитика', icon: FaChartLine },
    { path: '/orders', label: 'Лента заказов', icon: FaBox },
    { path: '/reports', label: 'Еженедельные отчеты', icon: FaFileAlt },
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

  // Закрываем мобильное меню при изменении маршрута
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Закрываем мобильное меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest(`.${styles.nav}`)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className={styles.nav}>
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Меню"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <ul className={`${styles.menu} ${isMobileMenuOpen ? styles.menuOpen : ''}`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`${styles.link} ${
                    activePath === item.path ? styles.active : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.rightSection}>
          <Link to="/optimization" className={styles.optimization}>
            <FaBolt className={styles.optimizationIcon} />
            <span>Оптимизация</span>
          </Link>
          <Link to="/settings" className={styles.iconButton} title="Настройки">
            <FaCog />
          </Link>
          <div className={styles.userSection}>
            <div className={styles.userAvatar}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName[0]}.` 
                  : user?.firstName || user?.email || 'Пользователь'}
              </span>
              <button onClick={logout} className={styles.logoutBtn}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

