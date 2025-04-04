import { jsx as _jsx } from "react/jsx-runtime";
const Spinner = ({ size = 'md', color = 'text-blue-500', className = '', }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
    };
    return (_jsx("div", { className: `${sizeClasses[size]} ${color} ${className} rounded-full border-solid border-t-transparent animate-spin`, role: "status", "aria-label": "Loading" }));
};
export default Spinner;
//# sourceMappingURL=LoadingSpinner.js.map