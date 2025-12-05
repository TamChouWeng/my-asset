import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to log user actions
  const logUserAction = async (userId: string, action: string, details: any = null) => {
    try {
      await supabase.from('audit_logs').insert({
        table_name: 'auth',
        record_id: userId,
        action: action,
        new_data: details
      });
    } catch (err) {
      console.error('Failed to log user action:', err);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      if (data) {
        setProfile(data as UserProfile);
      } else {
        const defaultProfile: UserProfile = { id: userId, theme: 'dark', language: 'en' };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      setSession(session);
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
        
        // Log Login Event
        if (event === 'SIGNED_IN') {
           // We check if this is a fresh sign in vs just a token refresh
           // (Simple implementation: just log it. For prod, might want to debounce)
           await logUserAction(currentUser.id, 'LOGIN', { email: currentUser.email });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    const oldProfile = { ...profile };
    // Optimistic update
    setProfile({ ...profile, ...updates });

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Log Profile Update
      await logUserAction(user.id, 'UPDATE_PROFILE', { 
        changes: updates,
        previous: oldProfile
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      // Revert on error
      setProfile(oldProfile);
    }
  };

  const signOut = async () => {
    if (user) {
      await logUserAction(user.id, 'LOGOUT');
    }
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
