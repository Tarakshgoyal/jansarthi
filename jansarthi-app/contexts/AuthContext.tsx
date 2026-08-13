import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  apiService,
  User,
  SignupRequest,
  LoginRequest,
  VerifyOTPRequest,
  OTPResponse,
  clearTokens,
  getUserData,
  getAccessToken,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signup: (data: SignupRequest) => Promise<OTPResponse>;
  login: (data: LoginRequest) => Promise<OTPResponse>;
  verifyOTP: (data: VerifyOTPRequest) => Promise<void>;
  resendOTP: (mobileNumber: string) => Promise<OTPResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsInitializing(true);
      const token = await getAccessToken();
      
      if (token) {
        // Try to get user data from secure storage first
        const cachedUser = await getUserData();
        if (cachedUser) {
          setUser(cachedUser);
        }
        
        // Fetch fresh user data from API
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          // If API call fails, try to refresh token
          const refreshed = await apiService.refreshToken();
          if (refreshed) {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
          } else {
            // Token refresh failed, clear auth state
            await clearTokens();
            setUser(null);
          }
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      await clearTokens();
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const signup = async (data: SignupRequest): Promise<OTPResponse> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.signup(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest): Promise<OTPResponse> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.login(data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: VerifyOTPRequest): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.verifyOTP(data);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (mobileNumber: string): Promise<OTPResponse> => {
    try {
      setError(null);
      const response = await apiService.resendOTP(mobileNumber);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await clearTokens();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        isAuthenticated,
        error,
        signup,
        login,
        verifyOTP,
        resendOTP,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
