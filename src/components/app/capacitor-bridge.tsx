'use client';

import { useEffect } from 'react';

/**
 * Capacitor Native Bridge — initializes native plugins when running inside
 * a Capacitor native shell (iOS/Android). On web, this is a no-op.
 *
 * - Status bar: green (#059669) with white text
 * - Splash screen: auto-hide after 2s
 * - Keyboard: resize body on mobile
 * - App: handle back button on Android
 * - Haptics: available for feedback (vibration)
 */
export function CapacitorBridge() {
  useEffect(() => {
    // Only run in native environment
    if (typeof window === 'undefined') return;

    // Check if Capacitor is available (native bridge injected)
    const capacitor = (window as any).Capacitor;
    if (!capacitor?.isNativePlatform?.()) return;

    const platform = capacitor.getPlatform?.();

    (async () => {
      try {
        // Status bar
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        if (platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#059669' });
        }

        // Splash screen
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();

        // Keyboard
        if (platform === 'ios') {
          const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
          Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        }

        // App — handle Android back button
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (err) {
        // Plugins not available — running on web
        console.log('[Capacitor] Running on web, native plugins skipped');
      }
    })();
  }, []);

  return null;
}
