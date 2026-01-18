import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  documentTheme: DocumentTheme;
  setDocumentTheme: (theme: DocumentTheme) => void;
  monthlyGoal: number;
  setMonthlyGoal: (goal: number) => void;
}

export interface DocumentTheme {
  primaryColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'right';
}

const defaultDocumentTheme: DocumentTheme = {
  primaryColor: '#000000',
  fontFamily: 'default',
  logoPosition: 'right',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('invoice-app-darkmode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [documentTheme, setDocumentThemeState] = useState<DocumentTheme>(() => {
    const saved = localStorage.getItem('invoice-app-document-theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultDocumentTheme;
      }
    }
    return defaultDocumentTheme;
  });

  const [monthlyGoal, setMonthlyGoalState] = useState(() => {
    const saved = localStorage.getItem('invoice-app-monthly-goal');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('invoice-app-darkmode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('invoice-app-document-theme', JSON.stringify(documentTheme));
  }, [documentTheme]);

  useEffect(() => {
    localStorage.setItem('invoice-app-monthly-goal', String(monthlyGoal));
  }, [monthlyGoal]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const setDocumentTheme = useCallback((theme: DocumentTheme) => {
    setDocumentThemeState(theme);
  }, []);

  const setMonthlyGoal = useCallback((goal: number) => {
    setMonthlyGoalState(goal);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        documentTheme,
        setDocumentTheme,
        monthlyGoal,
        setMonthlyGoal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
