import { getSupabaseClient } from '../../supabase';

import { handleMeetupError } from './error-handling';

export const getServerTime = async (): Promise<Date | null> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('get_server_time');

    if (error) {
      throw error;
    }

    return new Date(data);
  } catch (error) {
    const handledError = handleMeetupError(error as Error, 'get server time');
    throw new Error(handledError.message);
  }
};
