import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx(FaExclamationTriangle, { className: "mx-auto h-12 w-12 text-red-500" }), _jsx("h2", { className: "mt-6 text-3xl font-extrabold text-gray-900", children: "Something went wrong" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "We apologize for the inconvenience. Please try refreshing the page." })] }), _jsxs("div", { className: "mt-8 space-y-6", children: [_jsx("button", { onClick: () => window.location.reload(), className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Refresh Page" }), process.env.NODE_ENV === 'development' && (_jsxs("div", { className: "mt-4 p-4 bg-red-50 rounded-md", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error Details:" }), _jsx("pre", { className: "mt-2 text-sm text-red-700 overflow-auto", children: this.state.error?.toString() })] }))] })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.js.map