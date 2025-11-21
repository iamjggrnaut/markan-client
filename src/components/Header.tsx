import { Link } from 'react-router-dom';
import { FaBell, FaBars, FaCog } from 'react-icons/fa';
import { FaChartLine } from 'react-icons/fa';
import { useAuthStore } from '../store/auth.store';
import styles from './Header.module.scss';

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Link to="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <FaChartLine />
            </div>
            <span className={styles.logoText}>MarkAn</span>
          </Link>
        </div>

        <div className={styles.rightSection}>
          <Link to="/settings" className={styles.iconButton} title="Уведомления">
            <FaBell />
          </Link>
          <button className={styles.iconButton} title="Меню" aria-label="Меню">
            <FaBars />
          </button>
          <Link to="/settings" className={styles.iconButton} title="Настройки">
            <FaCog />
          </Link>
          <div className={styles.separator}></div>
          <div className={styles.userSection}>
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
            <div className={styles.userAvatar}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

