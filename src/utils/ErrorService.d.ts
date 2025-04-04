export declare const errorService: {
    handleError: (error: import("./error-types").IApplicationError) => Promise<boolean>;
    registerRecoveryStrategy: (category: import("./error-types").ErrorTypes, strategy: (error: Error) => Promise<unknown>) => void;
    errorCategories: {
        NETWORK: import("./error-types").ErrorTypes;
        AUTH: import("./error-types").ErrorTypes;
        LOCATION: import("./error-types").ErrorTypes;
        VALIDATION: import("./error-types").ErrorTypes;
        API: import("./error-types").ErrorTypes;
        DATABASE: import("./error-types").ErrorTypes;
        UNKNOWN: import("./error-types").ErrorTypes;
    };
};
