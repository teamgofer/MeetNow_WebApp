export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  store_credit: number;
  created_at: Date;
}

export interface Post {
  id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  restriction: 'public' | 'private' | 'group' | 'premium';
  created_at: Date;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: 'purchase' | 'spend';
  created_at: Date;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 