import supabase from '../supabase';
import logger from './Logger';
export const refreshTokenIfNeeded = async () => {
    try {
        const { data: { session }, error, } = await supabase.auth.getSession();
        if (error) {
            logger.error('Auth', 'Error getting session', { error: error.message });
            throw error;
        }
        if (!session) {
            logger.warn('Auth', 'No active session found');
            return;
        }
        const expiresAt = new Date(session.expires_at ?? 0).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        if (expiresAt - now < fiveMinutes) {
            logger.info('Auth', 'Refreshing token');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                logger.error('Auth', 'Error refreshing session', { error: refreshError.message });
                throw refreshError;
            }
        }
    }
    catch (error) {
        logger.error('Auth', 'Error in refreshTokenIfNeeded', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
export const ensureProfile = async (userData = {}) => {
    try {
        const { data: { user }, error: userError, } = await supabase.auth.getUser();
        if (userError ?? !user) {
            logger.error('Auth', 'Authentication error', { error: userError?.message });
            throw new Error('Not authenticated');
        }
        const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        if (profileError) {
            logger.error('Auth', 'Error fetching profile', { error: profileError.message });
            throw profileError;
        }
        if (existingProfile) {
            return existingProfile;
        }
        const defaultUsername = userData.username ?? `user_${Math.floor(Math.random() * 10000)}`;
        const newProfile = {
            id: user.id,
            username: defaultUsername,
            full_name: (userData.full_name ?? user.user_metadata.full_name) || null,
            avatar_url: userData.avatar_url || user.user_metadata.avatar_url || null,
        };
        const { data: profile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
        if (insertError) {
            logger.error('Auth', 'Error creating profile', { error: insertError.message });
            throw insertError;
        }
        logger.info('Auth', 'Created new user profile', { profile });
        return profile;
    }
    catch (error) {
        logger.error('Auth', 'Profile creation error', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
export const updateProfile = async (profileData) => {
    try {
        const { data: { user }, error: userError, } = await supabase.auth.getUser();
        if (userError ?? !user) {
            throw new Error('Not authenticated');
        }
        await ensureProfile();
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id)
            .select()
            .single();
        if (updateError) {
            logger.error('Auth', 'Error updating profile', { error: updateError.message });
            throw updateError;
        }
        return updatedProfile;
    }
    catch (error) {
        logger.error('Auth', 'Error updating profile', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
export const setupProfileSync = () => {
    const { data: { subscription }, } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            try {
                await ensureProfile();
            }
            catch (error) {
                logger.error('Auth', 'Error during profile sync', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    });
    return () => {
        subscription.unsubscribe();
    };
};
export const logoutCompletely = async () => {
    try {
        logger.info('Auth', 'Starting complete logout process');
        const { error } = await supabase.auth.signOut({
            scope: 'global',
        });
        if (error) {
            logger.error('Auth', 'Error during Supabase signOut', { error: error.message });
        }
        const authKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
                authKeys.push(key);
            }
        }
        authKeys.forEach(key => {
            logger.debug('Auth', `Removing localStorage key: ${key}`);
            localStorage.removeItem(key);
        });
        const sessionAuthKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
                sessionAuthKeys.push(key);
            }
        }
        sessionAuthKeys.forEach(key => {
            logger.debug('Auth', `Removing sessionStorage key: ${key}`);
            sessionStorage.removeItem(key);
        });
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token'))) {
                logger.debug('Auth', `Clearing cookie: ${name}`);
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });
        logger.info('Auth', 'Logout complete - all auth tokens and sessions cleared');
        return { success: true };
    }
    catch (err) {
        logger.error('Auth', 'Unexpected error during logout', {
            error: err instanceof Error ? err.message : String(err),
        });
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
};
//# sourceMappingURL=auth.js.map