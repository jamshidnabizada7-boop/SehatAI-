import type { CapacitorConfig } from '@capacitor/cli';

// Plugin string values match Capacitor's enum values at runtime; the config
// is asserted because the CLI types them as enum objects rather than unions.
const config = {
  appId: 'pk.sehatai.app',
  appName: 'SehatAI',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#059669',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#059669',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development: uncomment to point to dev server
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config as CapacitorConfig;
