import * as React from 'react';

import { cn } from '@/lib/utils';

export interface ISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, ISelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'bg-white text-sm',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
