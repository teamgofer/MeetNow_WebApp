import { Post, ApiResponse, Location } from '../types';
import { get, post, put, del } from './api';

export async function createPost(content: string, location: Location, restriction: Post['restriction']): Promise<ApiResponse<Post>> {
  return post<Post>('/posts', { content, location, restriction });
}

export async function getPosts(location?: Location, radius?: number): Promise<ApiResponse<Post[]>> {
  const params = new URLSearchParams();
  if (location) {
    params.append('lat', location.lat.toString());
    params.append('lng', location.lng.toString());
  }
  if (radius) {
    params.append('radius', radius.toString());
  }
  return get<Post[]>(`/posts?${params.toString()}`);
}

export async function getPost(id: number): Promise<ApiResponse<Post>> {
  return get<Post>(`/posts/${id}`);
}

export async function updatePost(id: number, data: Partial<Post>): Promise<ApiResponse<Post>> {
  return put<Post>(`/posts/${id}`, data);
}

export async function deletePost(id: number): Promise<ApiResponse<void>> {
  return del<void>(`/posts/${id}`);
}

export async function getReplies(postId: number): Promise<ApiResponse<Post[]>> {
  return get<Post[]>(`/posts/${postId}/replies`);
} 