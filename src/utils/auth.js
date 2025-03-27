import supabase from '../supabase';

/**
 * Ensures a user profile exists for the current authenticated user
 * @param {Object} userData - Optional user data to set in the profile
 * @returns {Promise<Object>} The user profile object
 */
export const ensureProfile = async (userData = {}) => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Not authenticated');
    }
    
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }
    
    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create a new profile
    const defaultUsername = userData.username || `user_${Math.floor(Math.random() * 10000)}`;
    const newProfile = {
      id: user.id,
      username: defaultUsername,
      full_name: userData.full_name || user.user_metadata?.full_name || null,
      avatar_url: userData.avatar_url || user.user_metadata?.avatar_url || null,
    };
    
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw insertError;
    }
    
    console.log('Created new user profile:', profile);
    return profile;
  } catch (error) {
    console.error('Profile creation error:', error);
    throw error;
  }
};

/**
 * Updates the current user's profile
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} The updated profile
 */
export const updateProfile = async (profileData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
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
      throw updateError;
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Register an auth state change listener to ensure profile exists
 * This should be called when your app initializes
 */
export const setupProfileSync = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await ensureProfile();
        } catch (error) {
          console.error('Error during profile sync:', error);
        }
      }
    }
  );
  
  return () => {
    // Cleanup function to unsubscribe
    subscription?.unsubscribe();
  };
};

/**
 * Comprehensive logout function that clears all auth tokens and sessions
 * @returns {Promise<{success: boolean, error?: string}>} Result of the logout operation
 */
export const logoutCompletely = async () => {
  try {
    console.log("Starting complete logout process...");
    
    // 1. Sign out from Supabase with global scope (invalidates all sessions)
    const { error } = await supabase.auth.signOut({
      scope: 'global'
    });
    
    if (error) {
      console.error("Error during Supabase signOut:", error);
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
      console.log(`Removing localStorage key: ${key}`);
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
      console.log(`Removing sessionStorage key: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    // 4. Clear cookies related to authentication
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token'))) {
        console.log(`Clearing cookie: ${name}`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    console.log("Logout complete - all auth tokens and sessions cleared");
    
    return { success: true };
  } catch (err) {
    console.error("Unexpected error during logout:", err);
    return { success: false, error: err.message };
  }
}; 