// Простая система toast notifications

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastService {
  private toasts: Toast[] = [];
  private listeners: Array<(toasts: Toast[]) => void> = [];
  private container: HTMLDivElement | null = null;

  init() {
    // Создаем контейнер для toast, если его нет
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
    this.render();
  }

  private render() {
    if (!this.container) return;

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Рендерим каждый toast
    this.toasts.forEach(toast => {
      const toastElement = document.createElement('div');
      toastElement.id = `toast-${toast.id}`;
      toastElement.style.cssText = `
        background-color: ${this.getBackgroundColor(toast.type)};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
      `;

      // Добавляем стили для анимации
      if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      toastElement.textContent = toast.message;
      if (this.container) {
        this.container.appendChild(toastElement);
      }

      // Автоматическое удаление
      const duration = toast.duration || (toast.type === 'error' ? 5000 : 3000);
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    });
  }

  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      case 'warning':
        return '#f59e0b'; // amber
      case 'info':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  }

  show(message: string, type: ToastType = 'info', duration?: number) {
    this.init();
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.notify();
    return id;
  }

  remove(id: string) {
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
      }, 300);
    } else {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.notify();
    }
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }
}

export const toast = new ToastService();

