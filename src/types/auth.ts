export interface LoginRequest {
  username: string; // Backend uses username field for email
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  role: string;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  role: UserRole;
}
