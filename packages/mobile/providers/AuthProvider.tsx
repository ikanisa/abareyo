import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authStorage } from '@/storage/authStorage';

type AuthContextShape = {
  token: string | null;
  loading: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authStorage
      .hydrate()
      .then((value) => {
        if (mounted) {
          setTokenState(value);
        }
      })
      .finally(() => mounted && setLoading(false));

    const unsubscribe = authStorage.subscribe((value) => setTokenState(value));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setToken = useCallback(async (value: string) => {
    await authStorage.save(value);
  }, []);

  const logout = useCallback(async () => {
    await authStorage.clear();
  }, []);

  const contextValue = useMemo(
    () => ({
      token,
      loading,
      setToken,
      logout,
    }),
    [token, loading, setToken, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
