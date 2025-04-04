import type { ILocation } from '../types/common';
import type { IMeetupCreateData } from '../types/meetup';
interface MeetupFormData {
  title: string;
  description: string;
  location: ILocation | null;
  date: string;
  time: string;
  duration: string;
  maxParticipants: string;
  isPublic?: boolean;
}
type FormField = keyof MeetupFormData;
type FormErrors = {
  [K in FormField]?: string;
};
declare const useMeetupForm: () => {
  formData: MeetupFormData;
  errors: FormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleLocationSelect: (location: ILocation | null) => void;
  validateForm: () => boolean;
  clearForm: () => void;
  getFormData: () => IMeetupCreateData;
  setIsSubmitting: import('react').Dispatch<import('react').SetStateAction<boolean>>;
};
export default useMeetupForm;
interface MeetupFormData {
  title: string;
  description: string;
  location: ILocation | null;
  date: string;
  time: string;
  duration: string;
  maxParticipants: string;
  isPublic?: boolean;
}
export default useMeetupForm;
