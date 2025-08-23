"use client";

import { useState } from "react";
import { Camera, Mail, Linkedin, ExternalLink } from "lucide-react";
import { PersonalInfo } from "@/interfaces";

interface ProfileHeaderProps {
  personalInfo: PersonalInfo;
}

export function ProfileHeader({ personalInfo }: ProfileHeaderProps) {
  const [isImageHovered, setIsImageHovered] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateYearsOfService = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();

    if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
      return years - 1;
    }
    return years;
  };

  const yearsOfService = calculateYearsOfService(personalInfo.startDate);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Cover Background (subtle gray gradient) */}
      <div className="h-40 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 border-b border-gray-300" />

      {/* Profile Content */}
      <div className="px-8 pb-8">
        {/* Profile Picture & Basic Info */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:gap-8 -mt-20 relative z-10">
          {/* Profile Picture */}
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            <div className="w-36 h-36 rounded-full border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {personalInfo.profilePicture ? (
                <img
                  src={personalInfo.profilePicture}
                  alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-700 text-3xl font-bold">
                  {getInitials(personalInfo.firstName, personalInfo.lastName)}
                </div>
              )}
            </div>

            {/* Upload Overlay */}
            <div
              className={`absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center transition-all duration-300 ${
                isImageHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="text-white text-center">
                <Camera className="h-7 w-7 mx-auto mb-2" />
                <div className="text-sm font-medium">Change Photo</div>
              </div>
            </div>
          </div>

          {/* Name & Title */}
          <div className="mt-6 lg:mt-0 flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {personalInfo.firstName} {personalInfo.lastName}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-xl font-semibold text-gray-800">
                    {personalInfo.jobTitle}
                  </p>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <p className="text-lg text-gray-600">
                    {personalInfo.department}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 lg:mt-0">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {personalInfo.bio && (
          <div className="mt-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {personalInfo.bio}
              </p>
            </div>
          </div>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Mail className="h-5 w-5 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {personalInfo.email}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Linkedin className="h-5 w-5 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  LinkedIn Profile
                </div>
                {personalInfo.linkedinUrl ? (
                  <a
                    href={personalInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 underline flex items-center gap-1 transition-colors"
                  >
                    View LinkedIn Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <div className="text-sm text-gray-400">
                    No LinkedIn profile added
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
