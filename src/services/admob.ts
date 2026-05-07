import { AdMob, InterstitialAdPluginEvents, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const AD_IDS = {
  appId: 'ca-app-pub-2757007936976677~8210759591',
  banner: 'ca-app-pub-2757007936976677/1623886086',
  interstitial: 'ca-app-pub-2757007936976677/2712010583',
  native: 'ca-app-pub-2757007936976677/1492024149'
};

export async function initializeAdMob() {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.initialize();
}

export async function showInterstitial() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const options = {
      adId: AD_IDS.interstitial,
      isTesting: false
    };

    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  } catch (error) {
    console.error('Error showing interstitial ad:', error);
  }
}
