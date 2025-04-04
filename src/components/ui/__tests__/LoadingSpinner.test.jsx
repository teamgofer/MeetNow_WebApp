import React from 'react';

import { render, screen } from '../../../test/utils/test-utils';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="medium" />);
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8');

    rerender(<LoadingSpinner size="large" />);
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12');
  });

  it('applies correct color classes', () => {
    const { rerender } = render(<LoadingSpinner color="blue" />);
    expect(screen.getByRole('status')).toHaveClass('text-blue-500');

    rerender(<LoadingSpinner color="white" />);
    expect(screen.getByRole('status')).toHaveClass('text-white');

    rerender(<LoadingSpinner color="gray" />);
    expect(screen.getByRole('status')).toHaveClass('text-gray-500');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('status').parentElement).toHaveClass('custom-class');
  });

  it('uses correct ARIA label', () => {
    render(<LoadingSpinner ariaLabel="Custom loading text" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Custom loading text');
  });
});
