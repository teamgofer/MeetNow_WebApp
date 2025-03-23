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