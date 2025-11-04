"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient, authService } from '@/lib/supabase';

interface AuthContextType {
  user: any;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getSessionToken: () => Promise<string | null>; // ✅ SECURITY: Method to get auth token
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
        
        if (data.session) {
          const userProfile = await authService.getUserProfile(data.session.user.id);
          // Only update if user data actually changed
          setUser((prevUser: any) => {
            const newUserStr = JSON.stringify(userProfile);
            const prevUserStr = JSON.stringify(prevUser);
            return newUserStr !== prevUserStr ? userProfile : prevUser;
          });
          setIsAdmin(userProfile?.role === "admin");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, [initialized]);

  const refreshUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        return;
      }
      const userProfile = await authService.getUserProfile(authUser.id);
      setUser(userProfile);
      setIsLoggedIn(true);
      setIsAdmin(userProfile?.role === 'admin');
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const getSessionToken = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    isAdmin,
    loading,
    signOut,
    refreshUser,
    getSessionToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
