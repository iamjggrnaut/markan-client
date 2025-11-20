import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.title}>Nebula Markan</h3>
            <p className={styles.description}>
              Единая платформа для аналитики продаж на всех маркетплейсах
            </p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.subtitle}>Юридические документы</h4>
            <ul className={styles.links}>
              <li>
                <Link to="/terms" className={styles.link}>
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={styles.link}>
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/refund" className={styles.link}>
                  Политика возврата средств
                </Link>
              </li>
              <li>
                <Link to="/api-policy" className={styles.link}>
                  Политика использования API
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h4 className={styles.subtitle}>Поддержка</h4>
            <ul className={styles.links}>
              <li>
                <a href="mailto:support@nebula-markan.com" className={styles.link}>
                  support@nebula-markan.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} Nebula Markan. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

