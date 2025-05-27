// Company Settings Types
export interface CompanyData {
  name: string;
  website: string;
  industry: string;
  size: string;
  description: string;
  logo: string;
}

// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  avatar?: string;
}

// Recruitment Settings Types
export interface RecruitmentConfig {
  autoScreening: boolean;
  emailConfirmations: boolean;
  minimumScore: number;
  autoRejectBelow: number;
}

// Notification Settings Types
export interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
}

// Integration Types
export interface Integration {
  id: string;
  title: string;
  description: string;
  status: "connected" | "not-connected";
  provider: string;
}

// Security Settings Types
export interface SecurityConfig {
  twoFactorEnabled: boolean;
  dataRetentionMonths: number;
  accessLogs: AccessLog[];
}

export interface AccessLog {
  browser: string;
  ip: string;
  time: string;
}

// Billing Types
export interface BillingPlan {
  name: string;
  price: string;
  billingCycle: string;
  features: PlanFeature[];
}

export interface PlanFeature {
  name: string;
  value: string;
  type: "limit" | "unlimited" | "boolean";
}

export interface PaymentMethod {
  type: string;
  last4: string;
  expiryDate: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "overdue";
}

// Main Settings Data Structure
export interface SettingsData {
  company: CompanyData;
  users: User[];
  recruitment: RecruitmentConfig;
  notifications: NotificationSetting[];
  integrations: Integration[];
  security: SecurityConfig;
  billing: {
    plan: BillingPlan;
    paymentMethod: PaymentMethod;
    invoices: Invoice[];
  };
} 