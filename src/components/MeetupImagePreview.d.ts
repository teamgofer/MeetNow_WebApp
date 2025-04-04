import React from 'react';
interface MeetupImagePreviewProps {
    onImageSelected: (file: File | null) => void;
    className?: string;
}
declare const MeetupImagePreview: React.FC<MeetupImagePreviewProps>;
export default MeetupImagePreview;
