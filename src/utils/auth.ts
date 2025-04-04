import supabase from '../supabase';

import logger from './Logger';

interface IUserData {
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface IProfileData {
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

interface IProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  [key: string]: unknown;
}

/**
 * Refreshes the authentication token if it's expired or about to expire
 * @returns Promise<void>
 */
export const refreshTokenIfNeeded = async (): Promise<void> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error('Auth', 'Error getting session', { error: error.message });
      throw error;
    }

    if (!session) {
      logger.warn('Auth', 'No active session found');
      return;
    }

    // Check if token is expired or about to expire (within 5 minutes)
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
  } catch (error) {
    logger.error('Auth', 'Error in refreshTokenIfNeeded', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Ensures a user profile exists for the current authenticated user
 * @param userData - Optional user data to set in the profile
 * @returns Promise<Profile> The user profile object
 */
export const ensureProfile = async (userData: IUserData = {}): Promise<IProfile> => {
  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError ?? !user) {
      logger.error('Auth', 'Authentication error', { error: userError?.message });
      throw new Error('Not authenticated');
    }

    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Auth', 'Error fetching profile', { error: profileError.message });
      throw profileError;
    }

    // If profile exists, return it
    if (existingProfile) {
      return existingProfile as IProfile;
    }

    // Create a new profile
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
    return profile as IProfile;
  } catch (error) {
    logger.error('Auth', 'Profile creation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Updates the current user's profile
 * @param profileData - The profile data to update
 * @returns Promise<Profile> The updated profile
 */
export const updateProfile = async (profileData: IProfileData): Promise<IProfile> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError ?? !user) {
      throw new Error('Not authenticated');
    }

    // First ensure profile exists
    await ensureProfile();

    // Update profile
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

    return updatedProfile as IProfile;
  } catch (error) {
    logger.error('Auth', 'Error updating profile', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Register an auth state change listener to ensure profile exists
 * This should be called when your app initializes
 * @returns Function to unsubscribe from auth state changes
 */
export const setupProfileSync = (): (() => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        await ensureProfile();
      } catch (error) {
        logger.error('Auth', 'Error during profile sync', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  return () => {
    // Cleanup function to unsubscribe
    subscription.unsubscribe();
  };
};

/**
 * Comprehensive logout function that clears all auth tokens and sessions
 * @returns Promise<{success: boolean, error?: string}> Result of the logout operation
 */
export const logoutCompletely = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Auth', 'Starting complete logout process');

    // 1. Sign out from Supabase with global scope (invalidates all sessions)
    const { error } = await supabase.auth.signOut({
      scope: 'global',
    });

    if (error) {
      logger.error('Auth', 'Error during Supabase signOut', { error: error.message });
    }

    // 2. Clear localStorage tokens
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

    // 3. Clear sessionStorage tokens
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

    // 4. Clear cookies related to authentication
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token'))) {
        logger.debug('Auth', `Clearing cookie: ${name}`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    logger.info('Auth', 'Logout complete - all auth tokens and sessions cleared');

    return { success: true };
  } catch (err) {
    logger.error('Auth', 'Unexpected error during logout', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
