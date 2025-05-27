"use client";

import { useState } from "react";
import { Camera, Mail, Phone } from "lucide-react";
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
      {/* Cover Background */}
      <div className="h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 left-8 w-20 h-20 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-8 right-8 w-16 h-16 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full"></div>
        </div>

        <div className="absolute bottom-4 right-6">
          <div className="text-white text-sm font-medium bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
            Last login: 2 hours ago
          </div>
        </div>
      </div>

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
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
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
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {personalInfo.firstName} {personalInfo.lastName}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <p className="text-xl font-semibold text-blue-600">
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
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Active Employee
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {personalInfo.bio && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-100">
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
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Mail className="h-5 w-5 text-blue-600" />
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

          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Phone Number
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {personalInfo.phone}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
