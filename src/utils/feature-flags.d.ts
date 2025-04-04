export interface FeatureFlags {
    USE_ENHANCED_MEETUP_CARD: boolean;
    USE_UNIFIED_CARD: boolean;
    ENABLE_ANIMATIONS: boolean;
    VERBOSE_LOGGING: boolean;
    MOCK_API: boolean;
}
export declare const getFeatureFlags: () => FeatureFlags;
export declare const getFeatureFlag: <K extends keyof FeatureFlags>(flag: K) => FeatureFlags[K];
export declare const setFeatureFlag: <K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]) => void;
export declare const resetFeatureFlags: () => void;
