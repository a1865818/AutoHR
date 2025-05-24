interface SecuritySettingsProps {
  onEnable2FA: () => void;
  onDataRetentionChange: (months: number) => void;
  dataRetentionMonths: number;
}

export function SecuritySettings({
  onEnable2FA,
  onDataRetentionChange,
  dataRetentionMonths,
}: SecuritySettingsProps) {
  const accessLogs = [
    {
      browser: "Chrome",
      ip: "192.168.1.100",
      time: "2 hours ago",
    },
    {
      browser: "Safari",
      ip: "192.168.1.101",
      time: "1 day ago",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-4">
            Two-Factor Authentication
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account
          </p>
          <button
            onClick={onEnable2FA}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Enable 2FA
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-4">Data Retention</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Data Retention (months)
              </label>
              <select
                value={dataRetentionMonths}
                onChange={(e) =>
                  onDataRetentionChange(parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-4">Access Logs</h4>
        <div className="space-y-3">
          {accessLogs.map((log, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium">Login from {log.browser}</p>
                <p className="text-xs text-gray-500">IP: {log.ip}</p>
              </div>
              <span className="text-xs text-gray-500">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
