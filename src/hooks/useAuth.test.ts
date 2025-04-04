import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { getSupabase } from '../lib/supabase';
import { handleAuthError } from '../utils/error-handler';
import { ensureProfile, updateProfile as updateUserProfile } from '../utils/auth';
import { TLoadingState } from '../types/common';
import type { User } from '@supabase/supabase-js';
import type { IStandardizedError } from '../utils/error-handler';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('../utils/error-handler');
jest.mock('../utils/auth');
jest.mock('../utils/Logger');

describe('useAuth', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    user_metadata: {},
  };

  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  };

  const mockStandardizedError: IStandardizedError = {
    type: 'AUTHENTICATION',
    message: 'Authentication error',
    severity: 'error',
    context: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabase as jest.Mock).mockResolvedValue(mockSupabase);
    (handleAuthError as jest.Mock).mockResolvedValue(mockStandardizedError);
    (ensureProfile as jest.Mock).mockResolvedValue(mockUser);
    (updateUserProfile as jest.Mock).mockResolvedValue(mockUser);
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.state).toBe<TLoadingState>('idle');
    expect(result.current.data).toEqual({ user: null, isAuthenticated: false });
    expect(result.current.error).toBeUndefined();
  });

  it('should handle successful sign in', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: mockUser, isAuthenticated: true });
    expect(result.current.error).toBeUndefined();
    expect(ensureProfile).toHaveBeenCalled();
  });

  it('should handle sign in error', async () => {
    const error = new Error('Invalid credentials');
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrong-password');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe<TLoadingState>('error');
    expect(result.current.data).toEqual({ user: null, isAuthenticated: false });
    expect(result.current.error).toBe(mockStandardizedError);
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  it('should handle successful sign up', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp('test@example.com', 'password');
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: mockUser, isAuthenticated: true });
    expect(result.current.error).toBeUndefined();
    expect(ensureProfile).toHaveBeenCalled();
  });

  it('should handle sign up error', async () => {
    const error = new Error('Email already registered');
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp('test@example.com', 'password');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe<TLoadingState>('error');
    expect(result.current.data).toEqual({ user: null, isAuthenticated: false });
    expect(result.current.error).toBe(mockStandardizedError);
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  it('should handle successful sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: null, isAuthenticated: false });
    expect(result.current.error).toBeUndefined();
  });

  it('should handle sign out error', async () => {
    const error = new Error('Network error');
    mockSupabase.auth.signOut.mockResolvedValue({ error });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signOut();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe<TLoadingState>('error');
    expect(result.current.error).toBe(mockStandardizedError);
  });

  it('should handle successful password reset', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.error).toBeUndefined();
  });

  it('should handle password reset error', async () => {
    const error = new Error('Invalid email');
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.resetPassword('invalid@example.com');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe<TLoadingState>('error');
    expect(result.current.error).toBe(mockStandardizedError);
  });

  it('should handle successful profile update', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.updateProfile({ email: 'new@example.com' });
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: mockUser, isAuthenticated: true });
    expect(result.current.error).toBeUndefined();
    expect(updateUserProfile).toHaveBeenCalledWith({ email: 'new@example.com' });
  });

  it('should handle profile update error', async () => {
    const error = new Error('Update failed');
    (updateUserProfile as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.updateProfile({ email: 'new@example.com' });
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.state).toBe<TLoadingState>('error');
    expect(result.current.error).toBe(mockStandardizedError);
  });

  it('should initialize with existing session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: mockUser, isAuthenticated: true });
    expect(result.current.error).toBeUndefined();
    expect(ensureProfile).toHaveBeenCalled();
  });

  it('should handle auth state changes', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate auth state change subscription
    const subscription = {
      unsubscribe: jest.fn(),
    };
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription },
    });

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate sign in event
    const signInCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
    await act(async () => {
      await signInCallback('SIGNED_IN', { user: mockUser });
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: mockUser, isAuthenticated: true });
    expect(result.current.error).toBeUndefined();

    // Simulate sign out event
    await act(async () => {
      await signInCallback('SIGNED_OUT', null);
    });

    expect(result.current.state).toBe<TLoadingState>('success');
    expect(result.current.data).toEqual({ user: null, isAuthenticated: false });
    expect(result.current.error).toBeUndefined();

    // Verify cleanup
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
