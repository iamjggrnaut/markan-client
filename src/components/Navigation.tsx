import { Link, useLocation } from 'react-router-dom';
import { 
  FaChartBar, 
  FaBox, 
  FaChartLine, 
  FaMapMarkedAlt, 
  FaUsers, 
  FaFileAlt, 
  FaCog, 
  FaLock 
} from 'react-icons/fa';
import { useAuthStore } from '../store/auth.store';
import { ThemeToggle } from './ThemeToggle/ThemeToggle';
import styles from './Navigation.module.scss';

export const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: FaChartBar },
    { path: '/products', label: 'Товары', icon: FaBox },
    { path: '/analytics', label: 'Аналитика', icon: FaChartLine },
    { path: '/geo', label: 'Геоаналитика', icon: FaMapMarkedAlt },
    { path: '/competitors', label: 'Конкуренты', icon: FaUsers },
    { path: '/reports', label: 'Отчеты', icon: FaFileAlt },
    { path: '/customers', label: 'Клиенты', icon: FaUsers },
    { path: '/settings', label: 'Настройки', icon: FaCog },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Админка', icon: FaLock }] : []),
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.header}>
        <h1 className={styles.logo}>Nebula Markan</h1>
        <ThemeToggle />
      </div>

      <ul className={styles.menu}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`${styles.link} ${
                location.pathname === item.path ? styles.active : ''
              }`}
            >
              <span className={styles.icon}>
                <item.icon />
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.userName}>
            {user?.firstName || user?.email}
          </span>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Выйти
        </button>
      </div>
    </nav>
  );
};

