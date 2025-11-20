# PWA Setup Guide

## Иконки приложения

Для полноценной работы PWA необходимо создать иконки приложения:

1. **pwa-192x192.png** - иконка 192x192 пикселей
2. **pwa-512x512.png** - иконка 512x512 пикселей

Поместите эти файлы в директорию `public/`.

## Push Notifications (VAPID Keys)

Для работы Push уведомлений необходимо настроить VAPID ключи:

1. Сгенерируйте VAPID ключи:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

2. Добавьте публичный ключ в `.env`:
```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

3. Добавьте приватный ключ в backend `.env`:
```env
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_PUBLIC_KEY=your_public_key_here
```

## Service Worker

Service Worker автоматически регистрируется при сборке проекта через `vite-plugin-pwa`.

В режиме разработки Service Worker включен через `devOptions.enabled: true`.

## Стратегии кеширования

- **API запросы**: NetworkFirst (1 час)
- **Изображения**: CacheFirst (30 дней)
- **Статические ресурсы**: Кешируются автоматически

## Установка PWA

Пользователи могут установить PWA через:
1. Баннер установки (автоматически появляется в поддерживаемых браузерах)
2. Компонент `PWAInstallPrompt` (показывается внизу экрана)
3. Меню браузера (Chrome: "Установить приложение")

## Оффлайн режим

Приложение работает оффлайн благодаря:
- Кешированию статических ресурсов
- Кешированию API ответов
- Service Worker для обработки запросов

