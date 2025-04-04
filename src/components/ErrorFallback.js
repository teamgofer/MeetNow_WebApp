import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ErrorFallback = () => {
    return (_jsxs("div", { className: "p-4 max-w-md mx-auto mt-8 bg-red-50 rounded-lg border border-red-200", children: [_jsx("h3", { className: "text-lg font-semibold text-red-600 mb-2", children: "Map Loading Issue" }), _jsx("p", { className: "text-red-500 mb-4", children: "Please check:" }), _jsxs("ul", { className: "list-disc pl-6 space-y-2", children: [_jsx("li", { children: "Location permissions in browser settings" }), _jsx("li", { children: "Internet connection" }), _jsx("li", { children: "Ad-blockers or security software" })] }), _jsx("button", { className: "mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700", onClick: () => window.location.reload(), children: "Reload Application" })] }));
};
export default ErrorFallback;
//# sourceMappingURL=ErrorFallback.js.map