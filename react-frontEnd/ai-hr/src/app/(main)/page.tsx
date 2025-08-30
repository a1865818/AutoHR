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
      <div className="bg-gradient-to-r from-primary to-accent rounded-xl  p-6 mb-8 text-white">
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
            <p className="mt-1 text-white/80 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{user.role}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                Hiring Manager
              </span>
            </p>
            {user.companyId && (
              <p className="mt-1 text-white/70 flex items-center space-x-1">
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
              <p className="text-sm font-medium text-foreground/70">
                Active Jobs
              </p>
              <p className="text-2xl font-bold text-foreground">
                {recruitmentStats.activeJobs}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-secondary">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/70">
                Total Candidates
              </p>
              <p className="text-2xl font-bold text-foreground">
                {recruitmentStats.totalCandidates}
              </p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-full">
              <Users className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-secondary">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+15 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/70">
                New Applications
              </p>
              <p className="text-2xl font-bold text-foreground">
                {recruitmentStats.newApplications}
              </p>
            </div>
            <div className="p-3 bg-accent/10 rounded-full">
              <Eye className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-accent">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Needs review</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/70">
                Interviews
              </p>
              <p className="text-2xl font-bold text-foreground">
                {recruitmentStats.interviewsScheduled}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>This week</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/create-job"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group flex flex-col h-full"
        >
          <div className="flex items-center justify-between flex-1">
            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                Create New Job
              </h3>
              <p className="mt-2 text-foreground/70 text-sm">
                Generate job descriptions and start accepting applications
              </p>
            </div>
            <PlusCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="mt-4 bg-primary hover:bg-accent text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </div>
        </Link>

        <Link
          href="/candidates"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group flex flex-col h-full"
        >
          <div className="flex items-center justify-between flex-1">
            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-secondary">
                Manage Candidates
              </h3>
              <p className="mt-2 text-foreground/70 text-sm">
                Review applications and select the best candidates
              </p>
            </div>
            <Users className="w-8 h-8 text-secondary" />
          </div>
          <div className="mt-4 bg-secondary hover:bg-accent text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors">
            <Users className="mr-2 h-4 w-4" />
            View Candidates
          </div>
        </Link>

        <Link
          href="/jobs"
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow group flex flex-col h-full"
        >
          <div className="flex items-center justify-between flex-1">
            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                Active Jobs
              </h3>
              <p className="mt-2 text-foreground/70 text-sm">
                Monitor your current job postings and applications
              </p>
            </div>
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <div className="mt-4 bg-primary hover:bg-accent text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors">
            <Briefcase className="mr-2 h-4 w-4" />
            View Jobs
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <Link
              href="/activity"
              className="text-primary hover:text-accent text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${activity.bgColor
                      .replace("blue-100", "primary/10")
                      .replace("green-100", "secondary/10")
                      .replace("yellow-100", "accent/10")}`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${activity.iconColor
                        .replace("text-blue-600", "text-primary")
                        .replace("text-green-600", "text-secondary")
                        .replace("text-yellow-600", "text-accent")}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm line-clamp-2">
                      {activity.message}
                    </p>
                    <p className="text-xs text-foreground/60 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <h4 className="font-semibold text-foreground mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Urgent Tasks
          </h4>
          <div className="space-y-3 flex-1">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="border-l-4 border-orange-400 pl-3 py-2"
              >
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {task.task}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </span>
                  <span className="text-xs text-foreground/60">
                    {task.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/tasks"
            className="mt-4 w-full bg-secondary hover:bg-accent text-white py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            View All Tasks
          </Link>
        </div>

        {/* Quick Analytics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col h-full">
          <h4 className="font-semibold text-foreground mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Quick Analytics
          </h4>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-sm">
                Avg. Time to Hire
              </span>
              <span className="font-medium">18 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-sm">
                Application Rate
              </span>
              <span className="font-medium text-secondary">+12%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-sm">
                Interview Success
              </span>
              <span className="font-medium">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/70 text-sm">
                Offer Acceptance
              </span>
              <span className="font-medium text-secondary">85%</span>
            </div>
          </div>
          <Link
            href="/analytics"
            className="mt-4 w-full bg-primary hover:bg-accent text-white py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Full Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
