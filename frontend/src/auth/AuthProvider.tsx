import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchWithAuth } from '../lib/api';
import type { UserSession } from './roles';

interface AuthContextType {
  user: User | null;
  session: UserSession | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      // We allow session fetching if firebaseUser is present, OR if we are using mocks, 
      // OR if we have a mock_role stored (to support backend DEV_MODE testing without mocks).
      if (firebaseUser || import.meta.env.VITE_USE_MOCKS === 'true' || localStorage.getItem('mock_role')) {
        try {
          const sessionData = await fetchWithAuth('/auth/session', { method: 'POST' });
          setSession(sessionData);
        } catch (error) {
          console.error("Failed to fetch session:", error);
          const mockRole = localStorage.getItem('mock_role');
          if (mockRole) {
            console.log("Falling back to mock session for role:", mockRole);
            setSession({
              uid: 'mock-user-123',
              role: mockRole as any,
              language: 'en',
              region: 'Patna'
            });
          } else {
            setSession(null);
          }
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
