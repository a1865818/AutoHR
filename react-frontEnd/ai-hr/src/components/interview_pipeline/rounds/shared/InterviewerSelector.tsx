"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Star,
  Building,
} from "lucide-react";

export interface Interviewer {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  availability: {
    dayOfWeek: number; // 0-6 (Sun-Sat)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }[];
  expertiseAreas: string[];
  interviewTypes: string[];
  rating: number; // 1-5
  totalInterviews: number;
  status: "available" | "busy" | "unavailable";
  isLead?: boolean;
  notes?: string;
}

interface InterviewerSelectorProps {
  selectedInterviewers: Interviewer[];
  onInterviewersChange: (interviewers: Interviewer[]) => void;
  roundType?: string;
  maxInterviewers?: number;
  requireLead?: boolean;
  allowMultiple?: boolean;
  filterByExpertise?: string[];
  filterByAvailability?: boolean;
}

export function InterviewerSelector({
  selectedInterviewers,
  onInterviewersChange,
  roundType,
  maxInterviewers = 5,
  requireLead = false,
  allowMultiple = true,
  filterByExpertise = [],
  filterByAvailability = true,
}: InterviewerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isAddingInterviewer, setIsAddingInterviewer] = useState(false);

  // Mock data - in real app, this would come from API
  const [allInterviewers] = useState<Interviewer[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      title: "Senior Software Engineer",
      department: "Engineering",
      phone: "+1 (555) 123-4567",
      timezone: "America/New_York",
      availability: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
      ],
      expertiseAreas: ["React", "Node.js", "Python", "System Design"],
      interviewTypes: ["technical_assessment", "coding_challenge"],
      rating: 4.8,
      totalInterviews: 47,
      status: "available",
      isLead: true,
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@company.com",
      title: "Product Manager",
      department: "Product",
      timezone: "America/Los_Angeles",
      availability: [
        { dayOfWeek: 1, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: 2, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: 3, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: 4, startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: 5, startTime: "10:00", endTime: "18:00" },
      ],
      expertiseAreas: ["Product Strategy", "User Research", "Analytics"],
      interviewTypes: ["final_interview", "culture_fit"],
      rating: 4.6,
      totalInterviews: 32,
      status: "available",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@company.com",
      title: "HR Business Partner",
      department: "Human Resources",
      timezone: "America/New_York",
      availability: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "16:00" },
        { dayOfWeek: 2, startTime: "08:00", endTime: "16:00" },
        { dayOfWeek: 3, startTime: "08:00", endTime: "16:00" },
        { dayOfWeek: 4, startTime: "08:00", endTime: "16:00" },
        { dayOfWeek: 5, startTime: "08:00", endTime: "16:00" },
      ],
      expertiseAreas: ["Culture Fit", "Compensation"],
      interviewTypes: ["phone_screening", "culture_fit"],
      rating: 4.9,
      totalInterviews: 89,
      status: "busy",
    },
    {
      id: "4",
      name: "David Kim",
      email: "david.kim@company.com",
      title: "Engineering Manager",
      department: "Engineering",
      timezone: "America/New_York",
      availability: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
      ],
      expertiseAreas: [
        "Leadership",
        "Team Management",
        "Technical Architecture",
      ],
      interviewTypes: ["final_interview"],
      rating: 4.7,
      totalInterviews: 56,
      status: "available",
      isLead: true,
    },
  ]);

  const departments = [
    "all",
    ...Array.from(new Set(allInterviewers.map((i) => i.department))),
  ];

  const filteredInterviewers = allInterviewers.filter((interviewer) => {
    // Search filter
    if (
      searchQuery &&
      !interviewer.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !interviewer.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !interviewer.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Department filter
    if (
      selectedDepartment !== "all" &&
      interviewer.department !== selectedDepartment
    ) {
      return false;
    }

    // Availability filter
    if (showAvailableOnly && interviewer.status !== "available") {
      return false;
    }

    // Round type filter
    if (roundType && !interviewer.interviewTypes.includes(roundType)) {
      return false;
    }

    // Expertise filter
    if (
      filterByExpertise.length > 0 &&
      !filterByExpertise.some((expertise) =>
        interviewer.expertiseAreas.includes(expertise)
      )
    ) {
      return false;
    }

    return true;
  });

  const addInterviewer = (interviewer: Interviewer) => {
    if (!allowMultiple && selectedInterviewers.length >= 1) return;
    if (maxInterviewers && selectedInterviewers.length >= maxInterviewers)
      return;
    if (selectedInterviewers.find((i) => i.id === interviewer.id)) return;

    onInterviewersChange([...selectedInterviewers, interviewer]);
  };

  const removeInterviewer = (interviewerId: string) => {
    onInterviewersChange(
      selectedInterviewers.filter((i) => i.id !== interviewerId)
    );
  };

  const setLeadInterviewer = (interviewerId: string) => {
    onInterviewersChange(
      selectedInterviewers.map((i) => ({
        ...i,
        isLead: i.id === interviewerId,
      }))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return CheckCircle;
      case "busy":
        return AlertCircle;
      case "unavailable":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const formatAvailability = (availability: Interviewer["availability"]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return availability
      .map(
        (slot) => `${days[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}`
      )
      .join(", ");
  };

  const hasLeadInterviewer = selectedInterviewers.some((i) => i.isLead);

  return (
    <div className="space-y-6">
      {/* Selected Interviewers */}
      {selectedInterviewers.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Interviewers ({selectedInterviewers.length}
              {maxInterviewers && `/${maxInterviewers}`})
            </h3>
            {requireLead && !hasLeadInterviewer && (
              <div className="flex items-center text-sm text-amber-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Lead interviewer required
              </div>
            )}
          </div>

          <div className="space-y-3">
            {selectedInterviewers.map((interviewer) => (
              <div
                key={interviewer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      {interviewer.avatar ? (
                        <img
                          src={interviewer.avatar}
                          alt={interviewer.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    {interviewer.isLead && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Crown className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {interviewer.name}
                      </h4>
                      {interviewer.isLead && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          Lead
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{interviewer.title}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{interviewer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{interviewer.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!interviewer.isLead && requireLead && (
                    <button
                      onClick={() => setLeadInterviewer(interviewer.id)}
                      className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                      Set as Lead
                    </button>
                  )}
                  <button
                    onClick={() => removeInterviewer(interviewer.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Interviewers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search interviewers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "all" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Available only</span>
            </label>
          </div>
        </div>

        {/* Interviewer List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredInterviewers.map((interviewer) => {
            const StatusIcon = getStatusIcon(interviewer.status);
            const isSelected = selectedInterviewers.find(
              (i) => i.id === interviewer.id
            );
            const canAdd =
              !isSelected &&
              (allowMultiple || selectedInterviewers.length === 0) &&
              (!maxInterviewers ||
                selectedInterviewers.length < maxInterviewers);

            return (
              <div
                key={interviewer.id}
                className={`border rounded-lg p-4 transition-all ${
                  isSelected
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        {interviewer.avatar ? (
                          <img
                            src={interviewer.avatar}
                            alt={interviewer.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(
                          interviewer.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {interviewer.name}
                        </h4>
                        {interviewer.isLead && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            interviewer.status
                          )}`}
                        >
                          {interviewer.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {interviewer.title}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span>{interviewer.department}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>
                            {interviewer.rating}/5 (
                            {interviewer.totalInterviews} interviews)
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{interviewer.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{interviewer.timezone}</span>
                        </div>
                      </div>

                      {/* Expertise Areas */}
                      {interviewer.expertiseAreas.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Expertise:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {interviewer.expertiseAreas
                              .slice(0, 3)
                              .map((area) => (
                                <span
                                  key={area}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {area}
                                </span>
                              ))}
                            {interviewer.expertiseAreas.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{interviewer.expertiseAreas.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Availability */}
                      {interviewer.availability.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Availability:
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatAvailability(interviewer.availability)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {isSelected ? (
                      <div className="flex items-center text-indigo-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => addInterviewer(interviewer)}
                        disabled={!canAdd}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInterviewers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No interviewers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {maxInterviewers && selectedInterviewers.length >= maxInterviewers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">
              Maximum number of interviewers reached ({maxInterviewers})
            </span>
          </div>
        </div>
      )}

      {requireLead &&
        selectedInterviewers.length > 0 &&
        !hasLeadInterviewer && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center text-amber-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">
                Please designate a lead interviewer for this round
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
