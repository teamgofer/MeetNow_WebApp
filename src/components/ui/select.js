import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
const Select = React.forwardRef(({ className, children, ...props }, ref) => {
    return (_jsx("select", { className: cn('w-full px-3 py-2 border border-gray-300 rounded-md', 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent', 'bg-white text-sm', className), ref: ref, ...props, children: children }));
});
Select.displayName = 'Select';
export { Select };
//# sourceMappingURL=select.js.map