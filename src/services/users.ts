import { User, ApiResponse, AuthResponse } from '../types';
import { get, post, put } from './api';

export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  return post<AuthResponse>('/auth/login', { email, password });
}

export async function register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  return post<AuthResponse>('/auth/register', { username, email, password });
}

export async function getProfile(): Promise<ApiResponse<User>> {
  return get<User>('/users/profile');
}

export async function updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
  return put<User>('/users/profile', data);
}

export async function getStoreCredit(): Promise<ApiResponse<number>> {
  return get<number>('/users/credit');
} 