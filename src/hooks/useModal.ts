import { useState, useCallback } from 'react';

/**
 * Interface for modal options
 */
export interface IModalOptions {
  /** Initial open state of the modal */
  initialState?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
}

/**
 * Interface for modal state and control functions
 */
export interface IModalState {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Whether the modal is currently animating */
  isAnimating: boolean;
  /** Function to open the modal */
  open: () => void;
  /** Function to close the modal */
  close: () => void;
  /** Function to toggle the modal state */
  toggle: () => void;
  /** Animation duration in milliseconds */
  animationDuration: number;
}

/**
 * Custom hook for managing modal state and animations
 * @param options - Modal options
 * @returns Modal state and control functions
 */
const useModal = ({
  initialState = false,
  animationDuration = 300,
}: IModalOptions = {}): IModalState => {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const open = useCallback((): void => {
    setIsOpen(true);
    setIsAnimating(true);
  }, []);

  const close = useCallback((): void => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, animationDuration);
  }, [animationDuration]);

  const toggle = useCallback((): void => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    isAnimating,
    open,
    close,
    toggle,
    animationDuration,
  };
};

export default useModal;
