import { useState, useEffect } from 'react';

interface AppState {
  lastRoute: string;
  wasAuthenticated: boolean;
  timestamp: number;
}

const APP_STATE_KEY = 'autogestor_app_state';
const STATE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function useAppState() {
  const [appState, setAppState] = useState<AppState | null>(null);

  // Load app state on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(APP_STATE_KEY);
      if (stored) {
        const parsed: AppState = JSON.parse(stored);
        
        // Check if state is still valid (not expired)
        if (Date.now() - parsed.timestamp < STATE_EXPIRY) {
          setAppState(parsed);
        } else {
          // State expired, remove it
          sessionStorage.removeItem(APP_STATE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load app state:', error);
      sessionStorage.removeItem(APP_STATE_KEY);
    }
  }, []);

  // Save app state
  const saveAppState = (route: string, authenticated: boolean) => {
    const state: AppState = {
      lastRoute: route,
      wasAuthenticated: authenticated,
      timestamp: Date.now()
    };
    
    try {
      sessionStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
      setAppState(state);
    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  };

  // Clear app state
  const clearAppState = () => {
    try {
      sessionStorage.removeItem(APP_STATE_KEY);
      setAppState(null);
    } catch (error) {
      console.warn('Failed to clear app state:', error);
    }
  };

  // Check if user was recently authenticated
  const wasRecentlyAuthenticated = () => {
    return appState?.wasAuthenticated && 
           appState.timestamp && 
           (Date.now() - appState.timestamp < STATE_EXPIRY);
  };

  return {
    appState,
    saveAppState,
    clearAppState,
    wasRecentlyAuthenticated
  };
}