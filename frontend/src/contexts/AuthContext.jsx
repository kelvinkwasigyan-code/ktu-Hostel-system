// src/contexts/AuthContext.jsx
// Global auth state — provides user, token, login/logout to all components
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import supabase from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchBackendProfile();
        }
      } catch (error) {
        console.error('Error fetching auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!user) { // only fetch if we don't have it, to avoid infinite loops on refresh
          await fetchBackendProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const fetchBackendProfile = async () => {
    try {
      // The API interceptor will automatically attach the Supabase session token
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile from backend', error);
      setUser(null);
    }
  };

  const login = (userData, token) => {
    // This is mostly deprecated as login is now handled by Supabase directly,
    // but we can keep it to manually set state if needed.
    setUser(userData);
  };

  const updateUser = (updatedUserData) => {
    setUser({ ...user, ...updatedUserData });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
