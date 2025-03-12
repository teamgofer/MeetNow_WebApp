import { Group, ApiResponse } from '../types';
import { get, post, put, del } from './api';

export async function createGroup(name: string, description?: string): Promise<ApiResponse<Group>> {
  return post<Group>('/groups', { name, description });
}

export async function getGroups(): Promise<ApiResponse<Group[]>> {
  return get<Group[]>('/groups');
}

export async function getGroup(id: number): Promise<ApiResponse<Group>> {
  return get<Group>(`/groups/${id}`);
}

export async function updateGroup(id: number, data: Partial<Group>): Promise<ApiResponse<Group>> {
  return put<Group>(`/groups/${id}`, data);
}

export async function deleteGroup(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/groups/${id}`);
}

export async function joinGroup(id: number): Promise<ApiResponse<void>> {
  return post<void>(`/groups/${id}/join`, {});
}

export async function leaveGroup(id: number): Promise<ApiResponse<void>> {
  return post<void>(`/groups/${id}/leave`, {});
} 