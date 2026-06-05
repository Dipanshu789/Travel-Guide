import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the color palette structure
export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  iconBackground: string;
  error: string;
  errorBackground: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#6C63FF',
  border: '#EEEEEE',
  iconBackground: '#F0F0FF',
  error: '#FF6B6B',
  errorBackground: '#FFF0F0',
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  primary: '#8A84FF',
  border: '#333333',
  iconBackground: '#2A2A35',
  error: '#FF6B6B',
  errorBackground: '#3A1E1E',
};

const ThemeContext = createContext<Theme>({
  mode: 'light',
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme: Theme = {
    mode,
    colors: mode === 'light' ? lightColors : darkColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
