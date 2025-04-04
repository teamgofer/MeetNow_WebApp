import React from 'react';
interface MeetupImageUploaderProps {
    onImageUploaded: (path: string, signedUrl: string) => void;
    meetupId?: string;
    className?: string;
    isAnonymous?: boolean;
}
declare const MeetupImageUploader: React.FC<MeetupImageUploaderProps>;
export default MeetupImageUploader;
