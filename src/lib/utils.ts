import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally join CSS class names
 * Uses clsx and tailwind-merge for intelligent class merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Export explicity to avoid ambiguity
export default {
  cn,
};
