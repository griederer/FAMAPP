// Theme context for dark/light mode with system preference support
import { createContext, useEffect, useState, ReactNode } from 'react';
import type { Theme } from '@famapp/shared';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // Get system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('famapp-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Calculate resolved theme
  const resolvedTheme = theme === 'system' ? systemPreference : theme;

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.removeAttribute('data-theme');
    root.classList.remove('light', 'dark');
    
    // Apply new theme
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.add(resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        resolvedTheme === 'dark' ? '#020617' : '#ffffff'
      );
    }
  }, [resolvedTheme]);

  // Save theme preference
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('famapp-theme', newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme: updateTheme,
    systemPreference,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook is exported from a separate file to avoid react-refresh warnings