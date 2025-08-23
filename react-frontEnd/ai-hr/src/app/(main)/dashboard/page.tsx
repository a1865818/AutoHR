"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Users,
  Briefcase,
  User,
  Building,
  BarChart3,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

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

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadCompany = async () => {
      if (!user?.companyId) return;
      try {
        setIsLoadingCompany(true);
        const company = await apiService.getCompanyById(user.companyId);
        if (isMounted) setCompanyName(company?.name || null);
      } catch (e) {
        if (isMounted) setCompanyName(null);
      } finally {
        if (isMounted) setIsLoadingCompany(false);
      }
    };
    loadCompany();
    return () => {
      isMounted = false;
    };
  }, [user?.companyId]);

  const StatCard = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50">
          <Icon className="w-6 h-6 text-gray-500" />
        </div>
      </div>
    </div>
  );

  const SectionCard = ({
    title,
    action,
    children,
  }: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">
                {user.firstName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Welcome back</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.firstName}
              </h2>
              <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{user.role}</span>
                {(companyName || isLoadingCompany) && (
                  <span className="text-gray-400">·</span>
                )}
                {(companyName || isLoadingCompany) && (
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {isLoadingCompany ? "Loading company..." : companyName}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/create-job"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create job
            </Link>
            <Link
              href="/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Review candidates
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4" />
              View analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Active jobs"
          value={recruitmentStats.activeJobs}
          icon={Briefcase}
        />
        <StatCard
          label="Total candidates"
          value={recruitmentStats.totalCandidates}
          icon={Users}
        />
        <StatCard
          label="New applications"
          value={recruitmentStats.newApplications}
          icon={Eye}
        />
        <StatCard
          label="Interviews scheduled"
          value={recruitmentStats.interviewsScheduled}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <SectionCard
            title="Recent activity"
            action={
              <Link
                href="/activity"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all
              </Link>
            }
          >
            <div className="divide-y divide-gray-200">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="py-3 flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-9 h-9 ${activity.bgColor} rounded-full flex items-center justify-center`}
                  >
                    <activity.icon
                      className={`w-5 h-5 ${activity.iconColor}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
