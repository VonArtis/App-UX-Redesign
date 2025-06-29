import { useEffect, useState } from 'react';

// Telegram WebApp Hook for VonVault
export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Check if running in Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      setIsTelegram(true);

      // Initialize WebApp
      tg.ready();
      tg.expand();
      
      // Set VonVault theme colors
      tg.setHeaderColor('#000000'); // Black header to match VonVault
      tg.setBackgroundColor('#000000');
      
      // Enable closing confirmation
      tg.enableClosingConfirmation();

      // Get user data
      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          first_name: tg.initDataUnsafe.user.first_name,
          last_name: tg.initDataUnsafe.user.last_name,
          username: tg.initDataUnsafe.user.username,
          language_code: tg.initDataUnsafe.user.language_code,
          photo_url: tg.initDataUnsafe.user.photo_url,
        });
      }
    }
  }, []);

  const showMainButton = (text, onClick) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const showBackButton = (onClick) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  const sendData = (data) => {
    if (webApp) {
      webApp.sendData(JSON.stringify(data));
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  const hapticFeedback = (type = 'impact', style = 'medium') => {
    if (webApp?.HapticFeedback) {
      if (type === 'impact') {
        webApp.HapticFeedback.impactOccurred(style);
      } else if (type === 'notification') {
        webApp.HapticFeedback.notificationOccurred(style);
      } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      }
    }
  };

  return {
    webApp,
    user,
    isTelegram,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    sendData,
    close,
    hapticFeedback,
  };
};