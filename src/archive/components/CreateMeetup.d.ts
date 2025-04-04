import React from 'react';
import './CreateMeetup.css';
interface ICreateMeetupProps {
    onClose: (meetup?: any) => void;
    initialLocation?: any | null;
}
declare const CreateMeetup: React.FC<ICreateMeetupProps>;
export default CreateMeetup;
