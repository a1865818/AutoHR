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

// Company registration interfaces
export interface CompanyRegisterRequest {
  name: string;
  industry: string;
  companySize: string;
  website: string;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
  email: string;
  description: string;
  logoUrl?: string;
}

export interface CompanyRegisterResponse {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  website: string;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
  email: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
}

// Enhanced user registration for hiring users with company data
export interface HiringUserRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  userType: "hiring";
  companyId?: string | number;
  companyData?: CompanyRegisterRequest;
}

// Application user registration (enhanced)
export interface ApplicationUserRegisterRequestEnhanced {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "application";
} 