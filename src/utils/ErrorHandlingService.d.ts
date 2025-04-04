import { ErrorTypes, IApplicationError } from './error-types';
declare const errorHandlingService: {
    handleError: (error: IApplicationError) => Promise<boolean>;
    registerRecoveryStrategy: (category: ErrorTypes, strategy: (error: Error) => Promise<unknown>) => void;
    errorCategories: {
        NETWORK: ErrorTypes;
        AUTH: ErrorTypes;
        LOCATION: ErrorTypes;
        VALIDATION: ErrorTypes;
        API: ErrorTypes;
        DATABASE: ErrorTypes;
        UNKNOWN: ErrorTypes;
    };
};
export default errorHandlingService;
