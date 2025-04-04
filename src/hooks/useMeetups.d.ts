export default useMeetups;
declare function useMeetups(): {
  meetups: never[];
  isLoading: boolean;
  error: null;
  selectedMeetup: null;
  fetchMeetups: (location: any) => Promise<void>;
  createMeetup: (meetupData: any) => Promise<any>;
  updateMeetup: (meetupId: any, updates: any) => Promise<any>;
  deleteMeetup: (meetupId: any) => Promise<void>;
  selectMeetup: (meetup: any) => void;
  clearSelectedMeetup: () => void;
};
