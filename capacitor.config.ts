import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.softia.traduction',
  appName: 'SoftIA Traduction',
  webDir: 'out',
  server: {
    url: 'https://soft-ia-traduction.vercel.app',
    cleartext: true
  }
};

export default config;
