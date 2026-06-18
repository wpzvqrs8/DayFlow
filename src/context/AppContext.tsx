'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalDateString } from '@/lib/utils';

interface AppContextProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize selectedDate on the client to avoid SSR mismatch
    setSelectedDate(getLocalDateString());

    // Check if user has an active session cookie
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        const data = await res.json();
        
        // If GET /api/auth/verify returns needsSetup, we are not authenticated yet but setup is needed
        // If there's an active session, middleware handles the auth redirection on pages,
        // but client context needs to know.
        // Let's do a simple check by calling a protected metadata endpoint, or checking status.
        // Actually, if we fetch any protected api and get 401, we are unauthenticated.
        // Let's check status:
        const testRes = await fetch('/api/tasks?date=' + getLocalDateString());
        if (testRes.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        isAuthenticated,
        setIsAuthenticated,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
