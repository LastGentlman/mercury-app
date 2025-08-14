import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import type { User } from '../types/index.ts';

export const useSentryUser = (user: User) => {
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        business_id: user.businessId
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);
};