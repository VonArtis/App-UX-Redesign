import React from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

interface TelegramProviderProps {
  children: React.ReactNode;
}

interface TelegramContextType {
  webApp: any;
  user: any;
  isTelegram: boolean;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  sendData: (data: any) => void;
  close: () => void;
  hapticFeedback: (type?: string, style?: string) => void;
}

const TelegramContext = React.createContext<TelegramContextType | null>(null);

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const telegramData = useTelegramWebApp();

  return (
    <TelegramContext.Provider value={telegramData}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = React.useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};