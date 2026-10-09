'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CapacitorBackButton() {
  const router = useRouter();

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return;

    let appPlugin: any = null;
    let backButtonListener: any = null;

    const setupCapacitor = async () => {
      try {
        const { App } = await import('@capacitor/app');
        appPlugin = App;

        backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            router.back();
          } else {
            App.exitApp();
          }
        });
      } catch (err) {
        console.warn('Capacitor App plugin not available, likely running in browser:', err);
      }
    };

    setupCapacitor();

    return () => {
      if (backButtonListener && backButtonListener.remove) {
        backButtonListener.remove();
      }
    };
  }, [router]);

  return null;
}
