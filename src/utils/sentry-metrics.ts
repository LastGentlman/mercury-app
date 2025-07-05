import * as Sentry from '@sentry/react';

export const trackOrderCreated = (orderId: string) => {
  Sentry.addBreadcrumb({
    message: 'Order created',
    level: 'info',
    data: { orderId }
  });
};

export const trackOfflineSync = (itemsCount: number) => {
  Sentry.addBreadcrumb({
    message: 'Offline sync completed',
    level: 'info',
    data: { itemsCount, action: 'sync' }
  });
};

export const trackConflictResolved = (resolution: string) => {
  Sentry.addBreadcrumb({
    message: 'Conflict resolved',
    level: 'info',
    data: { resolution }
  });
};