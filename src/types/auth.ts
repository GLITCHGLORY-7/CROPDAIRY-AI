// CropDiary AI — Auth Type Definitions
import { Profile } from './database';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  user: User;
  expires_at?: number;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
}
