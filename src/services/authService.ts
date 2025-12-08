import api from './api';
import { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '@/types/auth';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: UserResponse }> {
    // Backend uses OAuth2PasswordRequestForm which expects username field
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const token = response.data.access_token;

    // Store token
    localStorage.setItem('access_token', token);

    // Get user info
    const userResponse = await api.get<UserResponse>('/auth/me');

    return {
      token,
      user: userResponse.data,
    };
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('stemmentorat_user');
  },
};

// Named exports for convenience
export const login = authService.login.bind(authService);
export const register = authService.register.bind(authService);
export const getCurrentUser = authService.getCurrentUser.bind(authService);
export const logout = authService.logout.bind(authService);
