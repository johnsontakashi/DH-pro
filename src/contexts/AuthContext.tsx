import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to map backend role to frontend role
const mapRole = (backendRole: string): UserRole => {
  const roleLower = backendRole.toLowerCase();
  if (roleLower === 'teacher' || roleLower === 'instructor') return 'teacher';
  if (roleLower === 'admin' || roleLower === 'administrator') return 'admin';
  return 'student';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session and token
    const initAuth = async () => {
      const storedUser = localStorage.getItem('stemmentorat_user');
      const token = localStorage.getItem('access_token');

      if (storedUser && token) {
        try {
          // Verify token is still valid by fetching current user
          const userResponse = await authService.getCurrentUser();
          const mappedUser: User = {
            id: userResponse.id.toString(),
            email: userResponse.email,
            name: userResponse.name || `${userResponse.first_name || ''} ${userResponse.last_name || ''}`.trim() || userResponse.email.split('@')[0],
            role: mapRole(userResponse.role),
          };
          setUser(mappedUser);
          localStorage.setItem('stemmentorat_user', JSON.stringify(mappedUser));
        } catch (error) {
          // Token invalid, clear storage
          console.error('Failed to restore session:', error);
          localStorage.removeItem('stemmentorat_user');
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { token, user: userResponse } = await authService.login(email, password);

      const mappedUser: User = {
        id: userResponse.id.toString(),
        email: userResponse.email,
        name: userResponse.name || `${userResponse.first_name || ''} ${userResponse.last_name || ''}`.trim() || userResponse.email.split('@')[0],
        role: mapRole(userResponse.role),
      };

      setUser(mappedUser);
      localStorage.setItem('stemmentorat_user', JSON.stringify(mappedUser));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};