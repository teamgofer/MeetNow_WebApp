import { useEffect } from 'react';
import Logger from '../utils/Logger';
const useLogger = (componentName) => {
    useEffect(() => {
        const unsubscribe = Logger.subscribe((entry) => {
            console.log(`[${componentName}] Log event:`, entry);
        });
        return () => unsubscribe();
    }, [componentName]);
    return {
        debug: (message, data) => Logger.debug(componentName, message, data),
        info: (message, data) => Logger.info(componentName, message, data),
        warn: (message, data) => Logger.warn(componentName, message, data),
        error: (message, error) => Logger.error(componentName, message, error),
        performance: (operation, duration) => Logger.performance(operation, duration),
        userAction: (action, data) => Logger.userAction(action, data),
    };
};
export default useLogger;
//# sourceMappingURL=useLogger.js.map