// components/apply/PersonalInfoForm.tsx
import { PersonalInfoAppliedForm } from "@/interfaces";
import { Search, User } from "lucide-react";
import React from "react";

interface PersonalInfoFormProps {
  personalInfo: PersonalInfoAppliedForm;
  setPersonalInfo: (info: PersonalInfoAppliedForm) => void;
  profileImage: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PersonalInfoForm({
  personalInfo,
  setPersonalInfo,
  profileImage,
  onImageUpload,
}: PersonalInfoFormProps) {
  return (
    <div className="bg-white rounded-lg border p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Personal information
      </h2>
      <p className="text-gray-600 mb-6">Fields marked with * are required.</p>

      {/* Profile Image */}
      <div className="flex items-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            id="profile-image"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
          <label
            htmlFor="profile-image"
            className="absolute -bottom-1 -right-1 bg-gray-800 text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-700"
          >
            <User className="h-3 w-3" />
          </label>
        </div>
      </div>

      {/* Personal Info Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First name*
          </label>
          <input
            type="text"
            value={personalInfo.firstName}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, firstName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last name*
          </label>
          <input
            type="text"
            value={personalInfo.lastName}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, lastName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email*
          </label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, email: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm your email*
          </label>
          <input
            type="email"
            value={personalInfo.confirmEmail}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, confirmEmail: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City*
          </label>
          <div className="relative">
            <input
              type="text"
              value={personalInfo.city}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, city: e.target.value })
              }
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone number*
          </label>
          <div className="flex">
            <select
              value={personalInfo.countryCode}
              onChange={(e) =>
                setPersonalInfo({
                  ...personalInfo,
                  countryCode: e.target.value,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="+1">🇺🇸 +1</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+44">🇬🇧 +44</option>
            </select>
            <input
              type="tel"
              value={personalInfo.phoneNumber}
              onChange={(e) =>
                setPersonalInfo({
                  ...personalInfo,
                  phoneNumber: e.target.value,
                })
              }
              className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
