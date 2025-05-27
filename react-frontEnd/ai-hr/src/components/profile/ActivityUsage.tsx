import { Activity, Clock, TrendingUp } from "lucide-react";
import { ActivityData } from "@/interfaces";

interface ActivityUsageProps {
  activityData: ActivityData;
}

export function ActivityUsage({ activityData }: ActivityUsageProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Activity className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Activity & Usage
          </h3>
          <p className="text-sm text-gray-600">
            View your login history, feature usage, and time tracking
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(activityData.timeSpent.today)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(activityData.timeSpent.thisWeek)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Logins</p>
                <p className="text-xl font-bold text-gray-900">
                  {activityData.loginStats.totalLogins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 text-orange-500 text-xl">⭐</div>
              <div>
                <p className="text-sm text-gray-600">Most Active</p>
                <p className="text-xl font-bold text-gray-900">
                  {activityData.loginStats.mostActiveDay}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            Recent Activity
          </h4>

          <div className="space-y-3">
            {activityData.recentActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border"
              >
                <div
                  className={`w-3 h-3 rounded-full mt-1 ${
                    action.category === "login"
                      ? "bg-blue-500"
                      : action.category === "profile"
                      ? "bg-green-500"
                      : action.category === "settings"
                      ? "bg-purple-500"
                      : action.category === "data"
                      ? "bg-orange-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.action}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {action.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Feature Usage
          </h4>

          <div className="space-y-3">
            {activityData.featureUsage.map((feature, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">
                    {feature.feature}
                  </h5>
                  <span className="text-sm text-gray-600">
                    {feature.usageCount} times
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Time spent: {formatTime(feature.timeSpent)}</span>
                  <span>
                    Last used: {feature.lastUsed.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
