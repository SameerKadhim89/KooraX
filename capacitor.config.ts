import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.koorax.app',
  appName: 'KooraX',
  webDir: 'dist',
  server: {
    url: 'https://bright-pithivier-bb572c.netlify.app',
    cleartext: true
  }
};

export default config;
