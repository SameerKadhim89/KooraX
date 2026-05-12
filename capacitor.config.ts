import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.koorax.app',
  appName: 'KooraX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-2757007936976677~8210759591' // Replace with your actual AdMob App ID
    }
  }
};

export default config;
