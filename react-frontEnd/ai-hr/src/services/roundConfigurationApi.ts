import { Question } from "@/components/interview_pipeline/rounds/shared/QuestionBuilder";
import { ScoringCriteria } from "@/components/interview_pipeline/rounds/shared/ScoringMatrix";
import { Interviewer } from "@/components/interview_pipeline/rounds/shared/InterviewerSelector";
import {
  TimeSlot,
  ScheduleConfig,
} from "@/components/interview_pipeline/rounds/shared/TimeSlotPicker";
import { cleanJsonObject } from "@/utils/jsonUtils";

// Meeting data interface
export interface MeetingData {
  meetLink?: string;
  eventId?: string;
  calendarEventId?: string;
  applicationId?: string;
  summary?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  attendees?: string[];
  status: string;
}

// Base configuration interface
export interface BaseRoundConfiguration {
  id: string;
  jobId: string;
  roundId: string;
  roundType: string;
  name: string;
  description: string;
  duration: number;
  status: "draft" | "configured" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  
  // Meeting information
  meetingScheduled?: boolean;
  meetingData?: MeetingData;
}

// Phone Screening Configuration
export interface PhoneScreeningConfiguration extends BaseRoundConfiguration {
  questions: Question[];
  scoringCriteria: ScoringCriteria[];
  callSettings: {
    duration: number;
    bufferTime: number;
    autoScheduling: boolean;
    recordCall: boolean;
    requirePhone: boolean;
  };
  interviewerGuidelines: string;
  candidateInstructions: string;
  schedule: ScheduleConfig;
}

// Video Interview Configuration
export interface VideoInterviewConfiguration extends BaseRoundConfiguration {
  platform: "zoom" | "teams" | "meet" | "custom";
  questions: Question[];
  scoringCriteria: ScoringCriteria[];
  meetingSettings: {
    duration: number;
    bufferTime: number;
    autoScheduling: boolean;
    recordMeeting: boolean;
    requireCamera: boolean;
    allowScreenShare: boolean;
    waitingRoom: boolean;
  };
  techCheck: {
    required: boolean;
    duration: number;
    instructions: string;
  };
  interviewerGuidelines: string;
  candidateInstructions: string;
  schedule: ScheduleConfig;
}

// Technical Assessment Configuration
export interface TechnicalAssessmentConfiguration
  extends BaseRoundConfiguration {
  testStructure: {
    multipleChoiceCount: number;
    codingQuestionCount: number;
    theoreticalQuestionCount: number;
    totalQuestions: number;
    timeLimit: number;
  };
  questionLibrary: Question[];
  scoringCriteria: ScoringCriteria[];
  gradingSystem: {
    correctnessWeight: number;
    performanceWeight: number;
    codeQualityWeight: number;
    passingScore: number;
  };
  programmingEnvironment: {
    allowedLanguages: string[];
    codeEditor: boolean;
    testCases: boolean;
    debugging: boolean;
  };
  schedule: ScheduleConfig;
}

// Coding Challenge Configuration
export interface CodingChallengeConfiguration extends BaseRoundConfiguration {
  challengeProblem: {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    estimatedTime: number;
    constraints: string[];
    examples: {
      input: string;
      output: string;
      explanation: string;
    }[];
  };
  testCases: {
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    weight: number;
  }[];
  submissionSettings: {
    allowedLanguages: string[];
    maxSubmissions: number;
    timeLimit: number;
    deadline: number; // hours
  };
  gradingCriteria: ScoringCriteria[];
  schedule: ScheduleConfig;
}
// Final Interview Configuration
export interface FinalInterviewConfiguration extends BaseRoundConfiguration {
  decisionCriteria: ScoringCriteria[];
  executiveInvolvement: {
    required: boolean;
    roles: string[];
    approvalLevel: number;
  };
  offerParameters: {
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    benefits: string[];
    negotiationGuidelines: string;
    approvalWorkflow: {
      level: number;
      approver: string;
      maxAmount: number;
    }[];
  };
  approvalWorkflow: {
    steps: {
      stepNumber: number;
      approverRole: string;
      required: boolean;
      timeLimit: number; // hours
    }[];
  };
  schedule: ScheduleConfig;
}

// Union type for all configurations
export type RoundConfiguration =
  | PhoneScreeningConfiguration
  | VideoInterviewConfiguration
  | TechnicalAssessmentConfiguration
  | CodingChallengeConfiguration
  | FinalInterviewConfiguration;

// API Response types
export interface ConfigurationResponse<T = RoundConfiguration> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ConfigurationListResponse {
  success: boolean;
  data: RoundConfiguration[];
  total: number;
  page: number;
  limit: number;
}

export interface DefaultConfigurationResponse {
  success: boolean;
  data: Partial<RoundConfiguration>;
  message?: string;
}

// API Service Class
export class RoundConfigurationAPI {
  private baseUrl: string;

  constructor(
    baseUrl: string = (process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5189") + "/api"
  ) {
    this.baseUrl = baseUrl;
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HeadersInit {
    let token: string | null = null;
    let fromCookie = false;
    if (typeof window !== "undefined") {
      // Try to get from cookies first
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf("authToken=") === 0) {
          token = decodeURIComponent(
            cookie.substring("authToken=".length, cookie.length)
          );
          fromCookie = true;
          break;
        }
      }
    }
    // Fallback to localStorage/sessionStorage
    if (!token) {
      token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
    }
    if (typeof window !== "undefined") {
      console.log("[RoundConfigurationAPI] Token source:", {
        fromCookie,
        fromStorage: !fromCookie && !!token,
        hasToken: !!token,
        tokenLength: token?.length || 0,
      });
    }
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Get round configuration
  async getConfiguration(
    jobId: string,
    roundId: string
  ): Promise<ConfigurationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // If the configuration doesn't exist, fetch the default configuration
          // based on the round type by getting the round first
          console.log(
            "Configuration not found, will use default configuration"
          );
          return this.getDefaultForRound(jobId, roundId);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Failed to get round configuration:", error);
      throw error;
    }
  }

  // Helper method to fetch default configuration for a round when none exists
  private async getDefaultForRound(
    jobId: string,
    roundId: string
  ): Promise<ConfigurationResponse> {
    try {
      // First, get the round to determine its type
      const roundResponse = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!roundResponse.ok) {
        throw new Error(
          `Error ${roundResponse.status}: ${roundResponse.statusText}`
        );
      }

      const roundData = await roundResponse.json();
      const roundType = roundData.data?.type || "unknown";

      // Now get default config for this round type
      const defaultResponse = await this.getDefaultConfiguration(roundType);

      // Create a properly structured response with the default configuration
      return {
        success: true,
        data: {
          id: "",
          jobId: jobId,
          roundId: roundId,
          roundType: roundType,
          name: `${roundType
            .replace("_", " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase())} Configuration`,
          description: `Configuration for ${roundType.replace("_", " ")} round`,
          duration: 60,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "",
          lastModifiedBy: "",
          version: 1,
          // Properly include configuration data as an object that will be serialized
          configurationData: defaultResponse.data as any,
          questions: [],
          scoringCriteria: [],
        } as any, // Type assertion since our response might not match exactly
      };
    } catch (error: any) {
      console.error("Failed to get default configuration for round:", error);
      // Return basic default if we can't get anything else
      return {
        success: true,
        data: {
          id: "",
          jobId: jobId,
          roundId: roundId,
          roundType: "unknown",
          name: "New Round Configuration",
          description: "Default configuration",
          duration: 60,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "",
          lastModifiedBy: "",
          version: 1,
          // Properly include configuration data as an empty object
          configurationData: {} as any,
          questions: [],
          scoringCriteria: [],
        } as any, // Type assertion since our response might not match exactly
      };
    }
  }

  // Save round configuration
  async saveConfiguration(
    jobId: string,
    roundId: string,
    configuration: any // Use any here to accommodate the configurationData property
  ): Promise<ConfigurationResponse> {
    try {
      // Ensure we have valid configurationData to send
      // This is critical - we need to make sure the configurationData field is
      // not lost or overwritten in the process
      const backendPayload = {
        name:
          configuration.name ||
          `${
            configuration.roundType?.replace("_", " ") || "Round"
          } Configuration`,
        description: configuration.description || "",
        duration: configuration.duration || 30,
        status: configuration.status || "draft",
        configurationData: configuration.configurationData
          ? cleanJsonObject(configuration.configurationData)
          : this.transformToBackendFormat(configuration),
      };

      console.log("Payload being sent to backend:", backendPayload);

      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(backendPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const responseData = await response.json();

      // Clean the response data before returning it
      if (responseData.data && responseData.data.configurationData) {
        responseData.data.configurationData = cleanJsonObject(
          responseData.data.configurationData
        );
      }

      return responseData;
    } catch (error) {
      console.error("Error saving round configuration:", error);
      throw error;
    }
  }

  // Transform frontend configuration to backend format
  private transformToBackendFormat(
    config: Partial<RoundConfiguration> | any
  ): any {
    // If the config has a configurationData property, that's what we should use
    if (config.configurationData) {
      return config.configurationData;
    }

    // Otherwise, remove metadata fields that shouldn't be in configurationData
    // IMPORTANT: Do NOT remove the questions property as it's needed for the backend
    const {
      id,
      jobId,
      roundId,
      roundType,
      name,
      description,
      duration,
      status,
      createdAt,
      updatedAt,
      createdBy,
      lastModifiedBy,
      version,
      ...configData
    } = config;

    // Make sure questions are included
    if (config.questions && !configData.questions) {
      configData.questions = config.questions;
    }

    return configData;
  }

  // Get default configuration for round type
  async getDefaultConfiguration(
    roundType: string
  ): Promise<DefaultConfigurationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/interview-templates/rounds/${roundType}/defaults`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No default found, return basic default
          return {
            success: true,
            data: this.getBasicDefault(roundType),
            message: "Using basic default configuration",
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching default configuration:", error);
      // Fallback to hardcoded defaults
      return {
        success: true,
        data: this.getBasicDefault(roundType),
        message: "Using fallback default configuration",
      };
    }
  }

  // Get basic default configuration for round types
  private getBasicDefault(roundType: string): Partial<RoundConfiguration> {
    const defaults =
      DEFAULT_CONFIGURATIONS[roundType as keyof typeof DEFAULT_CONFIGURATIONS];
    return defaults ? { ...defaults, roundType } : { roundType, duration: 30 };
  }

  // Save questions for a round
  async saveQuestions(
    jobId: string,
    roundId: string,
    questions: Question[]
  ): Promise<ConfigurationResponse<Question[]>> {
    try {
      // Transform questions to backend format
      const backendQuestions = questions.map((q, index) => ({
        questionText: q.text,
        questionType: q.type,
        category: q.category,
        isRequired: q.required,
        orderIndex: index + 1,
        metadata: q.options ? { options: q.options } : undefined,
      }));

      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/questions`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ questions: backendQuestions }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving questions:", error);
      throw error;
    }
  }

  // Clone configuration from another job/round
  async cloneConfiguration(
    sourceJobId: string,
    sourceRoundId: string,
    targetJobId: string,
    targetRoundId: string
  ): Promise<ConfigurationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${targetJobId}/rounds/${targetRoundId}/configuration/clone`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            sourceJobId,
            sourceRoundId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error cloning configuration:", error);
      throw error;
    }
  }

  // Get all configurations for a job
  async getJobConfigurations(
    jobId: string
  ): Promise<ConfigurationListResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/configurations`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching job configurations:", error);
      throw error;
    }
  }

  // Validate configuration
  async validateConfiguration(
    jobId: string,
    roundId: string,
    configuration: Partial<RoundConfiguration>
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration/validate`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(configuration),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error validating configuration:", error);
      throw error;
    }
  }

  // Get configuration history
  async getConfigurationHistory(
    jobId: string,
    roundId: string,
    limit: number = 10
  ): Promise<ConfigurationListResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration/history?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching configuration history:", error);
      throw error;
    }
  }

  // Export configuration
  async exportConfiguration(jobId: string, roundId: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration/export`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting configuration:", error);
      throw error;
    }
  }

  // Generate Google Meet link
  async generateMeetLink(
    jobId: string,
    roundId: string
  ): Promise<ConfigurationResponse<{ meetLink: string; eventId: string; calendarEventId: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration/generate-meet-link`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating Google Meet link:", error);
      throw error;
    }
  }

  // Schedule a meeting
  async scheduleMeeting(
    jobId: string,
    roundId: string,
    title: string,
    date: string,
    time: string,
    duration: number,
    attendeeEmail?: string,
    applicationId?: string
  ): Promise<ConfigurationResponse<{
    meetLink: string;
    eventId: string;
    calendarEventId: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingDuration: number;
    startTime: string;
    endTime: string;
    timezone: string;
    applicationId?: string;
    scheduledAt: string;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/create-event`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            jobId,
            roundId,
            applicationId,
            title,
            date,
            time,
            duration,
            attendeeEmail,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      throw error;
    }
  }

  // Update a meeting
  async updateMeeting(
    jobId: string,
    roundId: string,
    eventId: string,
    title: string,
    date: string,
    time: string,
    duration: number,
    attendeeEmail?: string
  ): Promise<ConfigurationResponse<{ meetLink: string; eventId: string; calendarEventId: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/google-calendar/update-event`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            jobId,
            roundId,
            eventId,
            title,
            description: `Updated meeting: ${title}`,
            date,
            time,
            duration,
            attendeeEmail,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating meeting:", error);
      throw error;
    }
  }

  // Import configuration
  async importConfiguration(
    jobId: string,
    roundId: string,
    file: File
  ): Promise<ConfigurationResponse> {
    try {
      const formData = new FormData();
      formData.append("configuration", file);

      // Get auth token separately since FormData needs different headers
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken") ||
            sessionStorage.getItem("authToken")
          : null;

      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/configuration/import`,
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // Don't set Content-Type for FormData - browser will set it with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error importing configuration:", error);
      throw error;
    }
  }

  async checkMeetingStatus(
    jobId: string,
    roundId: string,
    applicationId: string
  ): Promise<{
    success: boolean;
    data: {
      hasMeeting: boolean;
      meetLink?: string;
      startTime?: string;
      endTime?: string;
      summary?: string;
    };
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/candidates/${applicationId}/meeting-status`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to check meeting status: ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking meeting status:", error);
      throw error;
    }
  }

  async getMeetingDetails(
    jobId: string,
    roundId: string,
    applicationId: string
  ): Promise<{
    success: boolean;
    data: MeetingData;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/jobs/${jobId}/rounds/${roundId}/candidates/${applicationId}/meeting-details`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get meeting details: ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting meeting details:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const roundConfigurationAPI = new RoundConfigurationAPI();

// Hook for using the API with React
export function useRoundConfigurationAPI() {
  return roundConfigurationAPI;
}

// Default configurations for each round type
export const DEFAULT_CONFIGURATIONS = {
  phone_screening: {
    roundType: "phone_screening",
    name: "Phone Screening Configuration",
    description: "Default configuration for phone screening round",
    duration: 30,
    callSettings: {
      duration: 30,
      bufferTime: 15,
      autoScheduling: true,
      recordCall: false,
      requirePhone: true,
    },
    questions: [
      {
        id: "q1",
        text: "Tell me about yourself and your background",
        type: "open",
        category: "Background",
        required: true,
      },
      {
        id: "q2",
        text: "Why are you interested in this position?",
        type: "open",
        category: "Motivation",
        required: true,
      },
    ],
    scoringCriteria: [
      {
        id: "c1",
        name: "Communication Skills",
        description: "Clarity and effectiveness of communication",
        weight: 8,
        maxScore: 100,
        type: "numeric",
        required: true,
      },
    ],
  },
  video_interview: {
    roundType: "video_interview",
    name: "Video Interview Configuration",
    description: "Default configuration for video interview round",
    duration: 45,
    platform: "zoom",
    meetingSettings: {
      duration: 45,
      bufferTime: 15,
      autoScheduling: true,
      recordMeeting: true,
      requireCamera: true,
      allowScreenShare: false,
      waitingRoom: true,
    },
    techCheck: {
      required: true,
      duration: 5,
      instructions:
        "Please test your camera and microphone before the interview",
    },
  },
  technical_assessment: {
    roundType: "technical_assessment",
    name: "Technical Assessment Configuration",
    description: "Default configuration for technical assessment round",
    duration: 90,
    testStructure: {
      multipleChoiceCount: 10,
      codingQuestionCount: 3,
      theoreticalQuestionCount: 5,
      totalQuestions: 18,
      timeLimit: 90,
    },
    gradingSystem: {
      correctnessWeight: 60,
      performanceWeight: 25,
      codeQualityWeight: 15,
      passingScore: 70,
    },
    programmingEnvironment: {
      allowedLanguages: ["javascript", "python", "java", "go"],
      codeEditor: true,
      testCases: true,
      debugging: true,
    },
  },
  coding_challenge: {
    roundType: "coding_challenge",
    name: "Coding Challenge Configuration",
    description: "Default configuration for coding challenge round",
    duration: 120,
    challengeProblem: {
      title: "Algorithm Challenge",
      description: "Solve the given programming problem",
      difficulty: "medium",
      estimatedTime: 90,
      constraints: ["Time limit: 2 hours", "Memory limit: 256MB"],
      examples: [],
    },
    submissionSettings: {
      allowedLanguages: ["javascript", "python", "java", "cpp"],
      maxSubmissions: 3,
      timeLimit: 120,
      deadline: 24,
    },
  },
  final_interview: {
    roundType: "final_interview",
    name: "Final Interview Configuration",
    description: "Default configuration for final interview round",
    duration: 60,
    executiveInvolvement: {
      required: true,
      roles: ["VP Engineering", "CTO"],
      approvalLevel: 2,
    },
    offerParameters: {
      salaryRange: {
        min: 80000,
        max: 120000,
        currency: "USD",
      },
      benefits: ["Health Insurance", "401k", "PTO"],
      negotiationGuidelines: "Standard negotiation process",
      approvalWorkflow: [],
    },
    approvalWorkflow: {
      steps: [
        {
          stepNumber: 1,
          approverRole: "Hiring Manager",
          required: true,
          timeLimit: 24,
        },
        {
          stepNumber: 2,
          approverRole: "VP Engineering",
          required: true,
          timeLimit: 48,
        },
      ],
    },
  },
  culture_fit: {
    roundType: "culture_fit",
    name: "Culture Fit Configuration",
    description: "Default configuration for culture fit assessment round",
    duration: 45,
    questions: [
      {
        id: "cf1",
        text: "How do you handle feedback and criticism?",
        type: "open",
        category: "Growth Mindset",
        required: true,
      },
      {
        id: "cf2",
        text: "Describe a time when you had to work with a difficult team member.",
        type: "open",
        category: "Collaboration",
        required: true,
      },
    ],
    scoringCriteria: [
      {
        id: "cf_c1",
        name: "Cultural Alignment",
        description: "How well the candidate aligns with company values",
        weight: 10,
        maxScore: 100,
        type: "numeric",
        required: true,
      },
      {
        id: "cf_c2",
        name: "Team Collaboration",
        description: "Ability to work effectively with others",
        weight: 8,
        maxScore: 100,
        type: "numeric",
        required: true,
      },
    ],
  },
} as const;
