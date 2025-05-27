import { Users, Crown, Mail } from "lucide-react";
import { RoleInfo } from "@/interfaces";

interface RolePermissionsProps {
  roleInfo: RoleInfo;
}

export function RolePermissions({ roleInfo }: RolePermissionsProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Users className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Role & Permissions
          </h3>
          <p className="text-sm text-gray-600">
            View your role, team structure, and access permissions
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Role */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Crown className="h-5 w-5 text-yellow-500 mr-2" />
            Current Role
          </h4>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h5 className="text-lg font-bold text-gray-900">
              {roleInfo.currentRole}
            </h5>
            <p className="text-gray-600 mt-1">{roleInfo.department}</p>
            <p className="text-sm text-gray-600 mt-2">
              {roleInfo.roleDescription}
            </p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3 ${
                roleInfo.accessLevel === "admin"
                  ? "bg-red-100 text-red-700"
                  : roleInfo.accessLevel === "advanced"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {roleInfo.accessLevel.charAt(0).toUpperCase() +
                roleInfo.accessLevel.slice(1)}{" "}
              Access
            </span>
          </div>
        </div>

        {/* Manager Info */}
        {roleInfo.manager && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Reports To</h4>
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {roleInfo.manager.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">
                  {roleInfo.manager.name}
                </h5>
                <p className="text-sm text-gray-600">
                  {roleInfo.manager.jobTitle}
                </p>
                <a
                  href={`mailto:${roleInfo.manager.email}`}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                >
                  <Mail className="h-3 w-3" />
                  {roleInfo.manager.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Permissions */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Permissions</h4>
          <div className="space-y-3">
            {roleInfo.permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div>
                  <p className="font-medium text-gray-900">{permission.name}</p>
                  <p className="text-sm text-gray-600">
                    {permission.description}
                  </p>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                    {permission.category}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full ${
                    permission.granted ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
