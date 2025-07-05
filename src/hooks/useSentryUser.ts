import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

export const useSentryUser = (user: any) => {
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        business_id: user.current_business_id
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);
};