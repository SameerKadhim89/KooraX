import React, { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
  adId?: string; // Optional: custom ad unit id
}

export function AdBanner({ adId }: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Only initialize AdMob if we are running in a native platform (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      initializeAdMob();
    } else {
      // In PWA/Web, we simulate the ad space or show AdSense (if configured)
      console.log('AdMob skipped: Running in web browser (PWA).');
      setIsAdLoaded(true);
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        AdMob.hideBanner().catch(console.error);
        AdMob.removeBanner().catch(console.error);
      }
    };
  }, []);

  const initializeAdMob = async () => {
    try {
      await AdMob.initialize();
      showBanner();
    } catch (error) {
      console.error('Failed to initialize AdMob', error);
    }
  };

  const showBanner = async () => {
    try {
      const defaultAdId = Capacitor.getPlatform() === 'ios'
        ? 'ca-app-pub-2757007936976677/1623886086' // Update iOS if available, using Android for now
        : 'ca-app-pub-2757007936976677/1623886086'; // Production Android Banner

      await AdMob.showBanner({
        adId: adId || defaultAdId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false, // Set to false in production!
      });
      setIsAdLoaded(true);
    } catch (error) {
      console.error('Failed to show banner', error);
    }
  };

  // If we are on the web, let's just show a placeholder ad block (e.g. for testing or AdSense fallback)
  if (!Capacitor.isNativePlatform() && isAdLoaded) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-4 my-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="w-full max-w-[320px] h-[50px] bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded text-slate-400 font-bold text-sm">
          مساحة إعلانية
        </div>
      </div>
    );
  }

  // Native banner floats above UI, so we just render an empty spacer so content isn't hidden
  return <div className="w-full h-[60px]" aria-hidden="true" />;
}
