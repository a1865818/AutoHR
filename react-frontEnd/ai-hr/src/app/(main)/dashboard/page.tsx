"use client";

import React from "react";
import {
  PlusCircle,
  Users,
  Briefcase,
  TrendingUp,
  User,
  Building,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HiringDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-semibold text-gray-800">
            Welcome to AI HR Recruitment Platform
          </h2>
          <p className="mt-2 text-gray-600">
            Please log in to access your recruitment dashboard
          </p>
        </div>
      </div>
    );
  }

  const recentActivity = [
    {
      id: 1,
      type: "application",
      message: "New applicant for Frontend Developer",
      time: "2 hours ago",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: 2,
      type: "job",
      message: "Job description generated for UX Designer",
      time: "Yesterday",
      icon: PlusCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: 3,
      type: "interview",
      message: "Interview scheduled with John Doe",
      time: "2 days ago",
      icon: Clock,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const recruitmentStats = {
    activeJobs: 12,
    totalCandidates: 124,
    newApplications: 18,
    interviewsScheduled: 6,
  };

  const urgentTasks = [
    {
      id: 1,
      task: "Review 5 new applications for Senior Developer",
      priority: "high",
      dueDate: "Today",
    },
    {
      id: 2,
      task: "Schedule interview with Sarah Johnson",
      priority: "medium",
      dueDate: "Tomorrow",
    },
    {
      id: 3,
      task: "Update job description for Marketing Manager",
      priority: "low",
      dueDate: "This week",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
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
            <p className="mt-1 text-indigo-100 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{user.role}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                Hiring Manager
              </span>
            </p>
            {user.companyId && (
              <p className="mt-1 text-indigo-200 flex items-center space-x-1">
                <Building className="w-4 h-4" />
                <span>Company ID: {user.companyId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {recruitmentStats.activeJobs}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Candidates
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {recruitmentStats.totalCandidates}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 w-4 mr-1" />
            <span>+15 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                New Applications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {recruitmentStats.newApplications}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Eye className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Review needed</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Interviews Scheduled
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {recruitmentStats.interviewsScheduled}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>This week</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <Link
                href="/candidates"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center`}
                  >
                    <activity.icon
                      className={`w-5 h-5 ${activity.iconColor}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  More activities available
                </span>
                <Link
                  href="/activity"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View activity log →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Urgent Tasks */}
        <div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Urgent Tasks
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {urgentTasks.filter((task) => task.priority === "high").length}{" "}
                High Priority
              </span>
            </div>

            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {task.dueDate}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/tasks"
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View all tasks
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/create-job"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <PlusCircle className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                  Create New Job
                </h4>
                <p className="text-xs text-gray-500">
                  Post a new position with AI assistance
                </p>
              </div>
            </Link>

            <Link
              href="/candidates"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <Users className="w-8 h-8 text-gray-400 group-hover:text-green-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-900">
                  Review Candidates
                </h4>
                <p className="text-xs text-gray-500">
                  Review and manage applications
                </p>
              </div>
            </Link>

            <Link
              href="/jobs"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <BarChart3 className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-purple-900">
                  View Analytics
                </h4>
                <p className="text-xs text-gray-500">
                  Analyze recruitment performance
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
