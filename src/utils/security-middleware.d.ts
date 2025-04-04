export interface ISecurityHeaders {
    [key: string]: string;
}
export interface IUser {
    id: string;
    [key: string]: unknown;
}
export interface IResource {
    user_id: string;
    [key: string]: unknown;
}
export interface IRequest {
    method: string;
    path: string;
    headers: {
        [key: string]: string | undefined;
        'x-csrf-token'?: string;
        'x-action-id'?: string;
        'content-type'?: string;
    };
    query: {
        [key: string]: string | string[] | undefined;
    };
    body: unknown;
    ip: string;
}
export interface IResponse {
    set: (header: string, value: string) => void;
    status: (code: number) => Response;
    json: (data: unknown) => void;
}
export type TNextFunction = (error?: Error) => void;
export type TApiHandler = (req: Request, res: Response) => Promise<void>;
export declare const applySecurityHeaders: (res: Response) => void;
export declare const secureApiRoute: (handler: ApiHandler) => ApiHandler;
export declare const useProtectedRoute: (user: User | null, navigate: ((path: string, options?: {
    state: {
        from: string;
        message: string;
    };
}) => void) | null, redirectTo?: string) => boolean;
export declare const usePermissionCheck: (user: User | null, _permission: string, resource: Resource | null) => boolean;
export declare const generateNonce: () => string;
export declare const sanitizeRequestParams: (req: Request, _res: Response, next: NextFunction) => void;
export declare const securityHeaders: SecurityHeaders;
