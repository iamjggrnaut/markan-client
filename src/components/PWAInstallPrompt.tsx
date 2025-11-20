import { usePWA } from '../hooks/usePWA';
import { Button } from './Form/Button';
import styles from './PWAInstallPrompt.module.scss';

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, install } = usePWA();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className={styles.prompt}>
      <div className={styles.content}>
        <h3>Установите Nebula Markan</h3>
        <p>Установите приложение для быстрого доступа и работы оффлайн</p>
      </div>
      <Button onClick={install} variant="primary" size="sm">
        Установить
      </Button>
    </div>
  );
};

