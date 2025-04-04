import React from 'react';
interface ErrorNotificationProps {
    message: string;
    onDismiss?: () => void;
    className?: string;
    type?: 'error' | 'warning' | 'info';
}
declare const ErrorNotification: React.FC<ErrorNotificationProps>;
export default ErrorNotification;
