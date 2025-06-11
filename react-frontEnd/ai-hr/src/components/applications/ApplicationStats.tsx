import React from "react";
import { ApplicationWithJobDetails } from "@/interfaces/api";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

interface ApplicationStatsProps {
  applications: ApplicationWithJobDetails[];
  isLoading: boolean;
}

export default function ApplicationStats({
  applications,
  isLoading,
}: ApplicationStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate statistics
  const totalApplications = applications.length;

  const statusCounts = applications.reduce((acc, app) => {
    const status = app.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stageCounts = applications.reduce((acc, app) => {
    const stage = app.stage || "unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentApplications = applications.filter(
    (app) => new Date(app.appliedAt) >= sevenDaysAgo
  ).length;

  // Calculate response rate (applications that progressed beyond applied status)
  const applicationsWithResponse = applications.filter(
    (app) =>
      app.status && !["applied", "submitted"].includes(app.status.toLowerCase())
  ).length;
  const responseRate =
    totalApplications > 0
      ? (applicationsWithResponse / totalApplications) * 100
      : 0;

  const stats = [
    {
      name: "Total Applications",
      value: totalApplications.toString(),
      change: `${recentApplications} this week`,
      changeType: recentApplications > 0 ? "positive" : "neutral",
      icon: FileText,
      color: "blue",
    },
    {
      name: "Under Review",
      value: (
        statusCounts.initial_review ||
        0 + statusCounts.under_review ||
        0
      ).toString(),
      change: "Active applications",
      changeType: "neutral",
      icon: Clock,
      color: "yellow",
    },
    {
      name: "Interviews",
      value: (
        stageCounts.interview ||
        0 + statusCounts.interview ||
        0
      ).toString(),
      change: "In progress",
      changeType: statusCounts.interview > 0 ? "positive" : "neutral",
      icon: Phone,
      color: "green",
    },
    {
      name: "Response Rate",
      value: `${Math.round(responseRate)}%`,
      change: `${applicationsWithResponse} of ${totalApplications}`,
      changeType:
        responseRate > 30
          ? "positive"
          : responseRate > 15
          ? "neutral"
          : "negative",
      icon: TrendingUp,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-100",
          icon: "text-blue-600",
          text: "text-blue-700",
        };
      case "yellow":
        return {
          bg: "bg-yellow-100",
          icon: "text-yellow-600",
          text: "text-yellow-700",
        };
      case "green":
        return {
          bg: "bg-green-100",
          icon: "text-green-600",
          text: "text-green-700",
        };
      case "purple":
        return {
          bg: "bg-purple-100",
          icon: "text-purple-600",
          text: "text-purple-700",
        };
      default:
        return {
          bg: "bg-gray-100",
          icon: "text-gray-600",
          text: "text-gray-700",
        };
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color);
        const Icon = stat.icon;

        return (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p
                  className={`text-sm mt-1 ${getChangeColor(stat.changeType)}`}
                >
                  {stat.change}
                </p>
              </div>
              <div className={`${colors.bg} p-3 rounded-full`}>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
