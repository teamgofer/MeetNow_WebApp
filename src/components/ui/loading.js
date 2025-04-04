import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import LoadingSpinner from './LoadingSpinner';
const Loading = ({ text = 'Loading...', className = '' }) => {
    return (_jsxs("div", { className: `flex flex-col items-center justify-center p-4 ${className}`, children: [_jsx(LoadingSpinner, { size: "large", color: "blue" }), text && _jsx("p", { className: "mt-2 text-gray-600 text-sm", children: text })] }));
};
export default Loading;
//# sourceMappingURL=loading.js.map