import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // Устанавливаем темную тему по умолчанию
  useEffect(() => {
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <div className={styles.layout}>
      <Header />
      <Navigation />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
};

