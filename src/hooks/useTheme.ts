import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verifica se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('autogestor-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Se não há tema salvo, usa o padrão do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove a classe anterior
    root.classList.remove('light', 'dark');
    
    // Adiciona a nova classe
    root.classList.add(theme);
    
    // Salva no localStorage
    localStorage.setItem('autogestor-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    setTheme
  };
}