import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';
import { handleAuthError } from '../utils/error-handler';
import { ensureProfile, updateProfile as updateUserProfile } from '../utils/auth';
import { IUseAuthResult } from '../types/hooks';
import { TLoadingState } from '../types/common';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { IStandardizedError } from '../utils/error-handler';
import logger from '../utils/Logger';

/**
 * Custom hook for managing authentication state and operations
 * @returns {IUseAuthResult} Authentication state and methods
 */
export const useAuth = (): IUseAuthResult => {
  const [state, setState] = useState<TLoadingState>('idle');
  const [data, setData] = useState<{ user: User | null; isAuthenticated: boolean }>({
    user: null,
    isAuthenticated: false,
  });
  const [error, setError] = useState<IStandardizedError | undefined>();

  /**
   * Updates the auth state with new values
   */
  const updateState = useCallback(
    (newState: TLoadingState, newData?: typeof data, newError?: IStandardizedError) => {
      setState(newState);
      if (newData !== undefined) setData(newData);
      setError(newError);
    },
    []
  );

  /**
   * Signs in a user with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        updateState('loading');
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error('No user data received');

        await ensureProfile();
        updateState('success', { user: data.user, isAuthenticated: true });
      } catch (err) {
        const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
        updateState('error', { user: null, isAuthenticated: false }, error);
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Signs up a new user with email and password
   */
  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        updateState('loading');
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error('No user data received');

        await ensureProfile();
        updateState('success', { user: data.user, isAuthenticated: true });
      } catch (err) {
        const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
        updateState('error', { user: null, isAuthenticated: false }, error);
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Signs out the current user
   */
  const signOut = useCallback(async () => {
    try {
      updateState('loading');
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      updateState('success', { user: null, isAuthenticated: false });
    } catch (err) {
      const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
      updateState('error', undefined, error);
      throw error;
    }
  }, [updateState]);

  /**
   * Resets the password for a user
   */
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        updateState('loading');
        const supabase = await getSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;

        updateState('success');
      } catch (err) {
        const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
        updateState('error', undefined, error);
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Updates the current user's profile
   */
  const updateProfile = useCallback(
    async (profileData: Partial<User>) => {
      try {
        updateState('loading');
        const updatedUser = await updateUserProfile(profileData);
        updateState('success', { user: updatedUser, isAuthenticated: true });
      } catch (err) {
        const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
        updateState('error', undefined, error);
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Initializes auth state and sets up auth state change listener
   */
  const initializeAuth = useCallback(async () => {
    try {
      updateState('loading');
      const supabase = await getSupabase();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        await ensureProfile();
        updateState('success', { user: session.user, isAuthenticated: true });
      } else {
        updateState('success', { user: null, isAuthenticated: false });
      }
    } catch (err) {
      const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
      logger.error('Failed to initialize auth:', error);
      updateState('error', { user: null, isAuthenticated: false }, error);
    }
  }, [updateState]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    const setupAuthListener = async () => {
      try {
        const supabase = await getSupabase();
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_IN' && session?.user) {
              await ensureProfile();
              updateState('success', { user: session.user, isAuthenticated: true });
            } else if (event === 'SIGNED_OUT') {
              updateState('success', { user: null, isAuthenticated: false });
            }
          }
        );
        subscription = sub;
      } catch (err) {
        logger.error('Failed to setup auth listener:', err);
      }
    };

    setupAuthListener();

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateState]);

  return {
    state,
    data,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
};
