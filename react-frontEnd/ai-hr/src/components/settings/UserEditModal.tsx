import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  avatar?: string;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  isLoading?: boolean;
}

export function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<User>({
    id: "",
    name: "",
    email: "",
    role: "",
    status: "active",
  });

  const [errors, setErrors] = useState<Partial<User>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData(user);
      setErrors({});
    }
  }, [user, isOpen]);

  const handleChange = (field: keyof User, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<User> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      role: "",
      status: "active",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Team Member
              </h3>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading user data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.role ? "border-red-300" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select role</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="hr">HR</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleChange("status", e.target.value as User["status"])
                      }
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
