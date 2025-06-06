"use client";

import React from "react";
import {
  Search,
  FileText,
  TrendingUp,
  User,
  Heart,
  MapPin,
  Clock,
  Star,
  Briefcase,
  Target,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ApplicantDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-semibold text-gray-800">
            Welcome to AutoHR Platform
          </h2>
          <p className="mt-2 text-gray-600">
            Please log in to access your job search dashboard
          </p>
        </div>
      </div>
    );
  }

  const recentApplications = [
    {
      id: 1,
      jobTitle: "Frontend Developer",
      company: "TechCorp Inc.",
      appliedDate: "2 hours ago",
      status: "Under Review",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: 2,
      jobTitle: "UX Designer",
      company: "Design Studio",
      appliedDate: "1 day ago",
      status: "Interview Scheduled",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      id: 3,
      jobTitle: "Product Manager",
      company: "StartupXYZ",
      appliedDate: "3 days ago",
      status: "Application Sent",
      statusColor: "bg-blue-100 text-blue-800",
    },
  ];

  const recommendedJobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "InnovateTech",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$120k - $150k",
      postedDate: "2 days ago",
      matchScore: 95,
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "CloudSoft",
      location: "Remote",
      type: "Full-time",
      salary: "$100k - $130k",
      postedDate: "1 day ago",
      matchScore: 88,
    },
    {
      id: 3,
      title: "Frontend Lead",
      company: "Digital Solutions",
      location: "New York, NY",
      type: "Full-time",
      salary: "$130k - $160k",
      postedDate: "3 hours ago",
      matchScore: 92,
    },
  ];

  const profileCompletionScore = 75;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user.firstName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                Welcome back, {user.firstName}!
              </h2>
              <p className="mt-1 text-blue-100 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>AutoHR</span>
                <span>•</span>
                <span>{user.email}</span>
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-blue-100">Profile Completion</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-24 bg-white bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletionScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {profileCompletionScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/applicant/jobs"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
                Browse Jobs
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Discover new opportunities that match your skills
              </p>
            </div>
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <span>500+ new jobs this week</span>
            <TrendingUp className="w-4 h-4 ml-1" />
          </div>
        </Link>

        <Link
          href="/applicant/applications"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600">
                My Applications
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Track the status of your job applications
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span>{recentApplications.length} active applications</span>
          </div>
        </Link>

        <Link
          href="/applicant/profile"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600">
                Complete Profile
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Boost your visibility to employers
              </p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <span>{100 - profileCompletionScore}% remaining</span>
            <Target className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Recent Applications
            </h3>
            <Link
              href="/applicant/applications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentApplications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                    {application.jobTitle}
                  </h4>
                  <p className="text-xs text-gray-600 flex items-center mt-1">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {application.company}
                    <span className="mx-2">•</span>
                    <Clock className="w-3 h-3 mr-1" />
                    {application.appliedDate}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${application.statusColor}`}
                >
                  {application.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Strength */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Strength
          </h4>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Basic Info</span>
              <span className="text-green-600 font-medium">Complete</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Work Experience</span>
              <span className="text-green-600 font-medium">Complete</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Skills</span>
              <span className="text-yellow-600 font-medium">Partial</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Portfolio</span>
              <span className="text-gray-400 font-medium">Missing</span>
            </div>
          </div>
          <Link
            href="/applicant/profile"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Improve Profile
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Profile Views</span>
              <span className="font-medium">24 this week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Saved Jobs</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Applications</span>
              <span className="font-medium">{recentApplications.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Interviews</span>
              <span className="font-medium text-green-600">2 scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Recommended for You
          </h3>
          <Link
            href="/applicant/jobs?recommended=true"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all recommendations
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedJobs.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 line-clamp-1">
                    {job.title}
                  </h4>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <Star className="w-3 h-3" />
                  <span>{job.matchScore}%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {job.salary}
                  </span>
                  <span className="text-xs text-gray-500">
                    {job.postedDate}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors">
                  Apply Now
                </button>
                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  <Heart className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
