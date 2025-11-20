import { GeoMap } from '../components/GeoMap';
import { Card } from '../components/Card';
import styles from './GeoPage.module.scss';

export const GeoPage = () => {
  return (
    <div className={styles.geo}>
      <h1 className={styles.title}>Геоаналитика</h1>
      <Card>
        <GeoMap />
      </Card>
    </div>
  );
};

