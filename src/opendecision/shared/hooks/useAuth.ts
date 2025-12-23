'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    if (!user || !supabase) {
      setIsAdmin(false);
      return;
    }

    try {
      // Check by both user_id and email
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    isAdmin,
    loading,
    signOut,
  };
}