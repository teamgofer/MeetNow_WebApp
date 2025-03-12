import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loading({ className, ...props }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        className
      )}
      {...props}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
} 