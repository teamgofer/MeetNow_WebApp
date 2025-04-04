export declare const getMeetupImageUploadUrl: (meetupId: string, contentType: string, fileName: string, isPublic?: boolean) => Promise<{
    uploadUrl: string;
    path: string;
}>;
export declare const updateMeetupImage: (meetupId: string, imageUrl: string, imagePath?: string) => Promise<void>;
export declare const refreshMeetupImageUrl: (meetupId: string) => Promise<void>;
