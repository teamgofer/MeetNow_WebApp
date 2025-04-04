/**
 * Audio utilities for proximity chat notifications
 * Handles playing notification sounds and managing audio preferences
 */

// Preload audio files for better performance
const audioFiles = {
  newMessage: new Audio('/assets/sounds/notification-message.mp3'),
  userNearby: new Audio('/assets/sounds/notification-nearby.mp3'),
  messageSent: new Audio('/assets/sounds/notification-sent.mp3'),
  typing: new Audio('/assets/sounds/notification-typing.mp3'),
  connected: new Audio('/assets/sounds/notification-connected.mp3'),
  disconnected: new Audio('/assets/sounds/notification-disconnected.mp3'),
};

// Set default volume
Object.values(audioFiles).forEach(audio => {
  audio.volume = 0.5;
});

// Default audio preferences
const defaultAudioPreferences = {
  masterEnabled: true,
  newMessage: true,
  userNearby: true,
  messageSent: false,
  typing: false,
  connected: true,
  disconnected: true,
  volume: 0.5,
};

/**
 * Get audio preferences from local storage or use defaults
 * @returns {Object} Current audio preferences
 */
export const getAudioPreferences = () => {
  try {
    const savedPreferences = localStorage.getItem('proximityChat.audioPreferences');
    return savedPreferences ? JSON.parse(savedPreferences) : defaultAudioPreferences;
  } catch (error) {
    console.error('Error loading audio preferences:', error);
    return defaultAudioPreferences;
  }
};

/**
 * Save audio preferences to local storage
 * @param {Object} preferences - Audio preferences to save
 */
export const saveAudioPreferences = preferences => {
  try {
    localStorage.setItem(
      'proximityChat.audioPreferences',
      JSON.stringify({
        ...getAudioPreferences(),
        ...preferences,
      })
    );
  } catch (error) {
    console.error('Error saving audio preferences:', error);
  }
};

/**
 * Play notification sound if enabled in preferences
 * @param {string} soundType - Type of sound to play (newMessage, userNearby, etc.)
 * @param {Object} [customPreferences] - Optional custom preferences to use instead of stored preferences
 * @returns {boolean} Whether the sound was played
 */
export const playNotificationSound = (soundType, customPreferences = null) => {
  const preferences = customPreferences || getAudioPreferences();

  // Check if sound should be played based on preferences
  if (!preferences.masterEnabled || !preferences[soundType]) {
    return false;
  }

  // Get the audio file for this sound type
  const audio = audioFiles[soundType];
  if (!audio) {
    console.error(`Sound type "${soundType}" not found`);
    return false;
  }

  // Set volume from preferences
  audio.volume = preferences.volume;

  // Stop and reset audio before playing (in case it's already playing)
  audio.pause();
  audio.currentTime = 0;

  // Play the sound
  try {
    const playPromise = audio.play();

    // Handle promise rejection (happens in some browsers if user hasn't interacted with page)
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Audio playback prevented:', error);
      });
    }

    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};

/**
 * Set master volume for all notification sounds
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export const setNotificationVolume = volume => {
  // Ensure volume is between 0 and 1
  const normalizedVolume = Math.max(0, Math.min(1, volume));

  // Update volume for all audio files
  Object.values(audioFiles).forEach(audio => {
    audio.volume = normalizedVolume;
  });

  // Save to preferences
  saveAudioPreferences({ volume: normalizedVolume });

  return normalizedVolume;
};

/**
 * Toggle master sound on/off
 * @param {boolean} [enabled] - If provided, set to this value; otherwise toggle
 * @returns {boolean} New state of master sound setting
 */
export const toggleMasterSound = (enabled = null) => {
  const preferences = getAudioPreferences();
  const newState = enabled !== null ? enabled : !preferences.masterEnabled;

  saveAudioPreferences({ masterEnabled: newState });
  return newState;
};

/**
 * Toggle individual sound type on/off
 * @param {string} soundType - Type of sound to toggle
 * @param {boolean} [enabled] - If provided, set to this value; otherwise toggle
 * @returns {boolean} New state of the sound type setting
 */
export const toggleSoundType = (soundType, enabled = null) => {
  if (!audioFiles[soundType]) {
    console.error(`Sound type "${soundType}" not found`);
    return false;
  }

  const preferences = getAudioPreferences();
  const newState = enabled !== null ? enabled : !preferences[soundType];

  // Create an object with just the changed property
  const update = { [soundType]: newState };
  saveAudioPreferences(update);

  return newState;
};

/**
 * Test play a notification sound without checking preferences
 * @param {string} soundType - Type of sound to play
 * @param {number} [volume] - Optional volume to use for test
 * @returns {boolean} Whether the sound was played
 */
export const testNotificationSound = (soundType, volume = null) => {
  const audio = audioFiles[soundType];
  if (!audio) {
    console.error(`Sound type "${soundType}" not found`);
    return false;
  }

  // Use specified volume if provided
  if (volume !== null) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }

  // Stop and reset audio before playing
  audio.pause();
  audio.currentTime = 0;

  // Play the sound
  try {
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Audio playback prevented:', error);
      });
    }

    return true;
  } catch (error) {
    console.error('Error playing test notification sound:', error);
    return false;
  }
};

/**
 * Reset audio preferences to defaults
 * @returns {Object} Default audio preferences
 */
export const resetAudioPreferences = () => {
  saveAudioPreferences(defaultAudioPreferences);
  return defaultAudioPreferences;
};

export default {
  playNotificationSound,
  getAudioPreferences,
  saveAudioPreferences,
  setNotificationVolume,
  toggleMasterSound,
  toggleSoundType,
  testNotificationSound,
  resetAudioPreferences,
  soundTypes: Object.keys(audioFiles),
};
