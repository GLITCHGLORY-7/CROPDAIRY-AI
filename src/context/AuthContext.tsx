import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@/types/auth';
import { Profile } from '@/types/database';
import { authService } from '@/services/authService';
import { storageAdapter } from '@/services/storageAdapter';
import { isSupabaseConfigured, supabase } from '@/services/supabaseClient';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, language?: 'en' | 'ta' | 'hi') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const isConfigured = isSupabaseConfigured();

  const loadInitialSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const initial = await authService.getInitialSession();
      setUser(initial.user);
      setProfile(initial.profile);
      setSession(initial.session);
    } catch (err) {
      console.error('Session initialization error:', err);
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialSession();

    // Listen to Supabase auth state change if configured
    if (isConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user) {
          const authUser: User = {
            id: newSession.user.id,
            email: newSession.user.email,
            phone: newSession.user.phone,
            created_at: newSession.user.created_at,
          };
          setUser(authUser);
          const p = await storageAdapter.getProfile(authUser.id);
          setProfile(p);
          setSession({
            access_token: newSession.access_token,
            user: authUser,
            expires_at: newSession.expires_at,
          });
        } else {
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadInitialSession, isConfigured]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.error || !res.user) {
        showToast('error', 'Login Failed', res.error || 'Please check your credentials');
        return { success: false, error: res.error };
      }
      setUser(res.user);
      setProfile(res.profile);
      showToast('success', 'Welcome Back', `Logged in as ${res.profile?.display_name || res.user.email}`);
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Login Error', err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, language: 'en' | 'ta' | 'hi' = 'en') => {
    setIsLoading(true);
    try {
      const res = await authService.signUp(email, password, fullName, language);
      if (res.error || !res.user) {
        showToast('error', 'Registration Failed', res.error || 'Unable to register account');
        return { success: false, error: res.error };
      }
      setUser(res.user);
      setProfile(res.profile);
      showToast('success', 'Account Created', `Welcome to CropDiary AI, ${fullName}!`);
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Registration Error', err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      showToast('info', 'Signed Out', 'You have been safely signed out.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const res = await authService.resetPassword(email);
    if (res.success) {
      showToast('success', 'Reset Link Sent', 'Instructions have been dispatched to your email.');
    } else {
      showToast('error', 'Reset Failed', res.error || 'Could not send reset link.');
    }
    return res;
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
    if (!user) return null;
    try {
      const updated = await storageAdapter.upsertProfile({
        ...updates,
        id: user.id,
      });
      setProfile(updated);
      showToast('success', 'Profile Updated', 'Your farmer preferences have been saved.');
      return updated;
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update profile');
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await storageAdapter.getProfile(user.id);
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isSupabaseConfigured: isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
