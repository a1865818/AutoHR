// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Login/Auth related interfaces (existing)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userCategory: string;
  userType?: string;
  companyId?: string;
  bio?: string;
  linkedinUrl?: string;
  location?: any;
  preferences?: any;
}

export interface ApplicationUserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userCategory: string;
  userType?: string;
  companyId?: string;
  tokenExpiresAt: string;
}

export interface ApplicationUserLoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tokenExpiresAt: string;
} 