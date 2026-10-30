import { User, Session } from '@/types/auth';
import { Profile } from '@/types/database';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { storageAdapter } from './storageAdapter';

const LOCAL_AUTH_USER_KEY = 'cropdiary_auth_current_user';
const LOCAL_AUTH_USERS_STORE = 'cropdiary_registered_users';

interface LocalStoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  created_at: string;
}

export const authService = {
  async getInitialSession(): Promise<{ user: User | null; profile: Profile | null; session: Session | null }> {
    if (isSupabaseConfigured() && supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return { user: null, profile: null, session: null };
      
      const user: User = {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        created_at: session.user.created_at,
      };

      const profile = await storageAdapter.getProfile(user.id);
      const appSession: Session = {
        access_token: session.access_token,
        user,
        expires_at: session.expires_at,
      };

      return { user, profile, session: appSession };
    }

    // Local Development Mode
    try {
      const savedUserJson = localStorage.getItem(LOCAL_AUTH_USER_KEY);
      if (!savedUserJson) return { user: null, profile: null, session: null };

      const user: User = JSON.parse(savedUserJson);
      const profile = await storageAdapter.getProfile(user.id);
      const session: Session = {
        access_token: 'local-dev-mock-token',
        user,
        expires_at: Date.now() + 86400000,
      };

      return { user, profile, session };
    } catch {
      return { user: null, profile: null, session: null };
    }
  },

  async signUp(email: string, password: string, fullName: string, preferredLanguage: 'en' | 'ta' | 'hi' = 'en'): Promise<{ user: User | null; profile: Profile | null; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName,
            preferred_language: preferredLanguage,
          },
        },
      });

      if (error) return { user: null, profile: null, error: error.message };
      if (!data.user) return { user: null, profile: null, error: 'Registration failed. Please try again.' };

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      };

      let profile: Profile | null = null;
      if (data.session) {
        try {
          profile = await storageAdapter.upsertProfile({
            id: user.id,
            display_name: fullName,
            preferred_language: preferredLanguage,
            country: 'India',
            state: '',
            district: '',
            preferred_area_unit: 'Acres',
          });
        } catch {
          profile = await storageAdapter.getProfile(user.id);
        }
      } else {
        // When email confirmation is pending, session is null and RLS blocks client cloud write.
        // Save to resilient local storage immediately so onboarding operates seamlessly without RLS errors.
        profile = await storageAdapter.upsertProfile({
          id: user.id,
          display_name: fullName,
          preferred_language: preferredLanguage,
          country: 'India',
          state: '',
          district: '',
          preferred_area_unit: 'Acres',
        });
      }

      return { user, profile };
    }

    // Local Development Mode
    try {
      const usersJson = localStorage.getItem(LOCAL_AUTH_USERS_STORE);
      const users: LocalStoredUser[] = usersJson ? JSON.parse(usersJson) : [];

      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, profile: null, error: 'A user with this email already exists.' };
      }

      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;
      const now = new Date().toISOString();

      const newUser: LocalStoredUser = {
        id,
        email: email.toLowerCase(),
        passwordHash: btoa(password), // Simple encoding for local dev mode
        fullName,
        created_at: now,
      };

      users.push(newUser);
      localStorage.setItem(LOCAL_AUTH_USERS_STORE, JSON.stringify(users));

      const appUser: User = { id, email: newUser.email, created_at: now };
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(appUser));

      const profile = await storageAdapter.upsertProfile({
        id,
        display_name: fullName,
        preferred_language: preferredLanguage,
        country: 'India',
        state: '',
        district: '',
        preferred_area_unit: 'Acres',
      });

      return { user: appUser, profile };
    } catch (err: any) {
      return { user: null, profile: null, error: err.message || 'Registration failed' };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; profile: Profile | null; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, profile: null, error: error.message };
      if (!data.user) return { user: null, profile: null, error: 'Login failed. Please check credentials.' };

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      };

      let profile = await storageAdapter.getProfile(user.id);
      if (!profile) {
        profile = await storageAdapter.upsertProfile({
          id: user.id,
          display_name: user.email?.split('@')[0] || 'Farmer',
          preferred_language: 'en',
          country: 'India',
          state: '',
          district: '',
          preferred_area_unit: 'Acres',
        });
      }

      return { user, profile };
    }

    // Local Development Mode
    try {
      const usersJson = localStorage.getItem(LOCAL_AUTH_USERS_STORE);
      const users: LocalStoredUser[] = usersJson ? JSON.parse(usersJson) : [];

      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === btoa(password)
      );

      if (!found) {
        // If this is the very first time and demo user, initialize demo account
        if (email.toLowerCase() === 'farmer@cropdiary.ai' && password === 'farmer123') {
          return this.signUp(email, password, 'Kaveri Farmer', 'en');
        }
        return { user: null, profile: null, error: 'Invalid email or password.' };
      }

      const user: User = {
        id: found.id,
        email: found.email,
        created_at: found.created_at,
      };

      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
      const profile = await storageAdapter.getProfile(user.id);

      return { user, profile };
    } catch (err: any) {
      return { user: null, profile: null, error: err.message || 'Login failed' };
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Local Development Mode
    const usersJson = localStorage.getItem(LOCAL_AUTH_USERS_STORE);
    const users: LocalStoredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!exists) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    return { success: true };
  },
};
