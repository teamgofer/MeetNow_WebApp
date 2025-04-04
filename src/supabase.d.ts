export function isSupabaseReady(): boolean;
export function createNewMeetup({ location, address }: { location: any; address: any }): Promise<
  | {
      success: boolean;
      meetup: any;
      error?: never;
    }
  | {
      success: boolean;
      error: any;
      meetup?: never;
    }
>;
export function getNearbyMeetups(
  latitude: any,
  longitude: any,
  radius?: number
): Promise<
  | {
      success: boolean;
      meetups: any[];
      error?: never;
    }
  | {
      success: boolean;
      error: any;
      meetups?: never;
    }
>;
export function getMeetupById(id: any): Promise<
  | {
      success: boolean;
      meetup: {
        id: any;
        location: any;
        address: any;
        created_at: any;
        expires_at: any;
        status: any;
      };
      error?: never;
    }
  | {
      success: boolean;
      error: any;
      meetup?: never;
    }
>;
export function cancelMeetup(id: any): Promise<
  | {
      success: boolean;
      meetup: {
        id: any;
        location: any;
        address: any;
        created_at: any;
        expires_at: any;
        status: any;
      };
      error?: never;
    }
  | {
      success: boolean;
      error: any;
      meetup?: never;
    }
>;
export function getSupabaseClient(): import('@supabase/supabase-js').SupabaseClient<
  any,
  'public',
  any
>;
export default supabase;
export namespace database {
  export function get(table: any, query?: {}): Promise<any[]>;
  export function insert(table: any, data: any): Promise<any>;
  export function update(table: any, query: any, updates: any): Promise<any[]>;
  export function _delete(table: any, query: any): Promise<boolean>;
  export { _delete as delete };
  export function subscribe(table: any, callback: any): () => void;
}
declare const supabase: import('@supabase/supabase-js').SupabaseClient<any, 'public', any>;
