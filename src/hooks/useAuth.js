import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';
import { handleAuthError } from '../utils/error-handler';
import { ensureProfile, updateProfile as updateUserProfile } from '../utils/auth';
import logger from '../utils/Logger';
export const useAuth = () => {
    const [state, setState] = useState('idle');
    const [data, setData] = useState({
        user: null,
        isAuthenticated: false,
    });
    const [error, setError] = useState();
    const updateState = useCallback((newState, newData, newError) => {
        setState(newState);
        if (newData !== undefined)
            setData(newData);
        setError(newError);
    }, []);
    const signIn = useCallback(async (email, password) => {
        try {
            updateState('loading');
            const supabase = await getSupabase();
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error)
                throw error;
            if (!data?.user)
                throw new Error('No user data received');
            await ensureProfile();
            updateState('success', { user: data.user, isAuthenticated: true });
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            updateState('error', { user: null, isAuthenticated: false }, error);
            throw error;
        }
    }, [updateState]);
    const signUp = useCallback(async (email, password) => {
        try {
            updateState('loading');
            const supabase = await getSupabase();
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error)
                throw error;
            if (!data?.user)
                throw new Error('No user data received');
            await ensureProfile();
            updateState('success', { user: data.user, isAuthenticated: true });
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            updateState('error', { user: null, isAuthenticated: false }, error);
            throw error;
        }
    }, [updateState]);
    const signOut = useCallback(async () => {
        try {
            updateState('loading');
            const supabase = await getSupabase();
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            updateState('success', { user: null, isAuthenticated: false });
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            updateState('error', undefined, error);
            throw error;
        }
    }, [updateState]);
    const resetPassword = useCallback(async (email) => {
        try {
            updateState('loading');
            const supabase = await getSupabase();
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error)
                throw error;
            updateState('success');
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            updateState('error', undefined, error);
            throw error;
        }
    }, [updateState]);
    const updateProfile = useCallback(async (profileData) => {
        try {
            updateState('loading');
            const updatedUser = await updateUserProfile(profileData);
            updateState('success', { user: updatedUser, isAuthenticated: true });
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            updateState('error', undefined, error);
            throw error;
        }
    }, [updateState]);
    const initializeAuth = useCallback(async () => {
        try {
            updateState('loading');
            const supabase = await getSupabase();
            const { data: { session }, error, } = await supabase.auth.getSession();
            if (error)
                throw error;
            if (session?.user) {
                await ensureProfile();
                updateState('success', { user: session.user, isAuthenticated: true });
            }
            else {
                updateState('success', { user: null, isAuthenticated: false });
            }
        }
        catch (err) {
            const error = await handleAuthError(err instanceof Error ? err : new Error(String(err)));
            logger.error('Failed to initialize auth:', error);
            updateState('error', { user: null, isAuthenticated: false }, error);
        }
    }, [updateState]);
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);
    useEffect(() => {
        let subscription;
        const setupAuthListener = async () => {
            try {
                const supabase = await getSupabase();
                const { data: { subscription: sub }, } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session?.user) {
                        await ensureProfile();
                        updateState('success', { user: session.user, isAuthenticated: true });
                    }
                    else if (event === 'SIGNED_OUT') {
                        updateState('success', { user: null, isAuthenticated: false });
                    }
                });
                subscription = sub;
            }
            catch (err) {
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
//# sourceMappingURL=useAuth.js.map