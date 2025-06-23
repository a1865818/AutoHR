// Interface for ApplicationUser data from backend
export interface ApplicationUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  createdAt: string;
  passwordLastChanged?: string;
  twoFactorEnabled?: boolean;
  totalLogins?: number;
  socialLink?: {
    linkedin?: string;
  };
  location?: {
    timezone?: string;
  };
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    emailDigest?: string;
    autoSave?: boolean;
  };
  privacySettings?: {
    profileVisibility?: string;
    activityVisibility?: string;
    contactInfoVisibility?: string;
    dataRetention?: number;
    allowAnalytics?: boolean;
    allowMarketing?: boolean;
    allowThirdParty?: boolean;
  };
  connectedIntegrations?: any[];
  education?: any[];
  experiences?: any[];
  skills?: any[];
  resumeList?: any[];
}
