export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
  jobTitle: string;
  department: string;
  bio: string;
  profilePicture: string;
  timezone: string;
  language: string;
  startDate: string;
  employeeId: string;
}

export interface SecuritySettings {
  passwordLastChanged: Date;
  twoFactorEnabled: boolean;
  trustedDevices: Device[];
  loginHistory: LoginEvent[];
  activeSessions: Session[];
  securityScore: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastUsed: Date;
  location: string;
  browser: string;
  trusted: boolean;
}

export interface LoginEvent {
  id: string;
  timestamp: Date;
  device: string;
  location: string;
  ipAddress: string;
  success: boolean;
  browser: string;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  startTime: Date;
  lastActivity: Date;
  current: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreference[];
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'never';
  autoSave: boolean;
}

export interface NotificationPreference {
  id: string;
  category: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface RoleInfo {
  currentRole: string;
  department: string;
  manager: ProfileUser | null;
  directReports: ProfileUser[];
  permissions: Permission[];
  accessLevel: 'basic' | 'advanced' | 'admin';
  roleDescription: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  category: string;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  profilePicture?: string;
  department: string;
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  category: 'login' | 'profile' | 'settings' | 'data' | 'security';
  details?: string;
}

export interface ActivityData {
  recentActions: Activity[];
  loginStats: LoginStats;
  featureUsage: FeatureUsage[];
  timeSpent: TimeSpentData;
}

export interface LoginStats {
  totalLogins: number;
  lastWeek: number;
  averageSessionDuration: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: Date;
  timeSpent: number;
}

export interface TimeSpentData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  averageDaily: number;
}

export interface ConnectedIntegration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'social' | 'productivity' | 'other';
  connected: boolean;
  connectedAt?: Date;
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error';
  icon: string;
  description: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  activityVisibility: 'public' | 'team' | 'private';
  contactInfoVisibility: 'public' | 'team' | 'private';
  dataRetention: number; // months
  allowAnalytics: boolean;
  allowMarketing: boolean;
  allowThirdParty: boolean;
}

export interface UserProfile {
  personalInfo: PersonalInfo;
  securitySettings: SecuritySettings;
  preferences: UserPreferences;
  roleInfo: RoleInfo;
  activityData: ActivityData;
  connectedIntegrations: ConnectedIntegration[];
  privacySettings: PrivacySettings;
} 