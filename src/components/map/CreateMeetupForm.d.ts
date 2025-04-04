import React from 'react';
import type { IMeetupData } from '@/types/meetup';
interface ICreateMeetupFormProps {
  location: {
    lat: number;
    lng: number;
    display_name?: string;
    address?: string;
  };
  onSubmit: (meetup: IMeetupData) => void;
  className?: string;
}
declare const CreateMeetupForm: React.FC<ICreateMeetupFormProps>;
export default CreateMeetupForm;
