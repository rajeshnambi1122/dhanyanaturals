"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, authService } from '@/lib/supabase';

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

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't fetch user profile again if we're just getting the initial session
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      setIsLoggedIn(!!session);
      if (session) {
        try {
          const userProfile = await authService.getUserProfile(session.user.id);
          // Only update if user data actually changed
          setUser((prevUser: any) => {
            const newUserStr = JSON.stringify(userProfile);
            const prevUserStr = JSON.stringify(prevUser);
            return newUserStr !== prevUserStr ? userProfile : prevUser;
          });
          setIsAdmin(userProfile?.role === "admin");
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const authUser = await authService.getCurrentUser();
      if (authUser) {
        const userProfile = await authService.getUserProfile(authUser.id);
        // Only update if user data actually changed
        setUser((prevUser: any) => {
          const newUserStr = JSON.stringify(userProfile);
          const prevUserStr = JSON.stringify(prevUser);
          return newUserStr !== prevUserStr ? userProfile : prevUser;
        });
        setIsLoggedIn(true);
        setIsAdmin(userProfile?.role === 'admin');
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // ✅ SECURITY: Get the current session token for API calls
  const getSessionToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      console.error('Error getting session token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAdmin, loading, signOut, refreshUser, getSessionToken }}>
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
