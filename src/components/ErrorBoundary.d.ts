import React from 'react';
export interface IErrorBoundaryProps {
    children: React.ReactNode;
}
interface IErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
declare class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: IErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): IErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
}
export default ErrorBoundary;
