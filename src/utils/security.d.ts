export interface ISecuritySettings {
    maxContentLength: number;
    maxPayloadItems: number;
    maxStringLength: number;
    forbiddenCharacters: RegExp;
    suspiciousPatterns: RegExp[];
}
export interface IValidationOptions {
    maxLength?: number;
    allowHTML?: boolean;
    allowSpecialChars?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
    required?: boolean;
}
export declare const validateInput: (input: unknown, options?: ValidationOptions) => unknown;
export declare const sanitizeString: (input: unknown) => string;
export declare const sanitizeForDatabase: (input: unknown) => string;
export declare const generateCSRFToken: (actionId: string) => string;
export declare const validateCSRFToken: (token: string, actionId: string) => boolean;
export declare const validateAuthToken: (token: string) => boolean;
export declare const secureStoreData: (key: string, data: unknown) => boolean;
export declare const secureRetrieveData: (key: string) => string | null;
export declare const isSecureEnvironment: () => boolean;
export interface IUser {
    id: string;
    [key: string]: unknown;
}
export interface IResource {
    user_id: string;
    id: string;
    [key: string]: unknown;
}
export declare const validatePermission: (user: User | null, action: string, resource: Resource | null) => boolean;
