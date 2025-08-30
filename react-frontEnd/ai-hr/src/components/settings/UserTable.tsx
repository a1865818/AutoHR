import { Edit, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  avatar?: string;
  // Additional fields from backend
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string;
  userType?: string;
  companyId?: string;
  bio?: string;
  linkedinUrl?: string;
  location?: any;
  preferences?: any;
  createdAt?: string;
}

interface UserTableProps {
  users: User[];
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  currentUserRole?: string | undefined;
}

export function UserTable({
  users,
  onEditUser,
  onDeleteUser,
  currentUserRole,
}: UserTableProps) {
  console.log("🔍 UserTable - currentUserRole:", currentUserRole);

  const getStatusColor = (user: User) => {
    // Use isActive field if available, otherwise fall back to status field
    const isActive =
      user.isActive !== undefined ? user.isActive : user.status === "active";

    if (isActive) {
      return "bg-green-100 text-green-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  const getStatusText = (user: User) => {
    // Use isActive field if available, otherwise fall back to status field
    const isActive =
      user.isActive !== undefined ? user.isActive : user.status === "active";

    return isActive ? "active" : "inactive";
  };

  const getRoleText = (user: User) => {
    // Use roles field if available, otherwise fall back to role field
    return user.roles || user.role || "User";
  };

  const isCurrentUserAdmin = () => {
    // If currentUserRole is undefined, it means we're still loading user data
    return currentUserRole === "Admin";
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {isCurrentUserAdmin() && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[#066046]/15 text-[#066046] border border-[#066046]/20 capitalize">
                    {getRoleText(user)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      user
                    )}`}
                  >
                    {getStatusText(user)}
                  </span>
                </td>
                {isCurrentUserAdmin() && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditUser(user.id);
                      }}
                      className="text-[#066046] hover:text-[#267a54] mr-2"
                      type="button"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteUser(user.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
