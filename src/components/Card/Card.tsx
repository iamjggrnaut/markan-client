import { ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Card = ({ title, children, footer, className }: CardProps) => {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {title && <div className={styles.header}>{title}</div>}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

