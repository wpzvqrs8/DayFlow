import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const {
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
  } = useApp();
  
  const router = useRouter();

  const checkSetupNeeded = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      return data.needsSetup;
    } catch {
      return true;
    }
  };

  const login = async (password: string, isSetup = false) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, isSetup }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed', cooldown: data.cooldown };
      }

      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkSetupNeeded,
  };
}
