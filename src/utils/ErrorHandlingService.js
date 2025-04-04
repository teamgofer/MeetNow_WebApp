import { EventEmitter } from './EventEmitter';
import { ErrorTypes } from './error-types';
function createErrorHandler() {
    const errorEmitter = new EventEmitter();
    const recoveryEmitter = new EventEmitter();
    const errorCategories = {
        NETWORK: ErrorTypes.NETWORK_ERROR,
        AUTH: ErrorTypes.AUTHENTICATION_ERROR,
        LOCATION: ErrorTypes.LOCATION_ERROR,
        VALIDATION: ErrorTypes.VALIDATION_ERROR,
        API: ErrorTypes.API_ERROR,
        DATABASE: ErrorTypes.DATABASE_ERROR,
        UNKNOWN: ErrorTypes.UNKNOWN_ERROR,
    };
    async function handleError(error) {
        console.log('Error handled:', error);
        return false;
    }
    function registerRecoveryStrategy(category, strategy) {
    }
    return {
        handleError,
        registerRecoveryStrategy,
        errorCategories,
    };
}
const errorHandlingService = createErrorHandler();
export default errorHandlingService;
//# sourceMappingURL=ErrorHandlingService.js.map