import React from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import { TelegramProvider } from './context/TelegramContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppComponent from './AppComponent';

function App() {
  return (
    <ThemeProvider>
      <TelegramProvider>
        <AppProvider>
          <AppComponent />
        </AppProvider>
      </TelegramProvider>
    </ThemeProvider>
  );
}

export default App;
