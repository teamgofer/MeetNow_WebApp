interface IUserData {
    username?: string;
    full_name?: string | null;
    avatar_url?: string | null;
}
interface IProfileData {
    username?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
}
interface IProfile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    [key: string]: unknown;
}
export declare const refreshTokenIfNeeded: () => Promise<void>;
export declare const ensureProfile: (userData?: IUserData) => Promise<IProfile>;
export declare const updateProfile: (profileData: IProfileData) => Promise<IProfile>;
export declare const setupProfileSync: () => (() => void);
export declare const logoutCompletely: () => Promise<{
    success: boolean;
    error?: string;
}>;
export {};
