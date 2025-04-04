export declare function verifyEnvironmentVariables(): {
    isValid: boolean;
    missing: string[];
    optional: string[];
    message: string;
};
export declare function printEnvironmentVerification(): void;
export default verifyEnvironmentVariables;
