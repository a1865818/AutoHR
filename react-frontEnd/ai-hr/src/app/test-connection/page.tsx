"use client";

import { useState } from "react";

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function TestConnection() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Get API URL from environment variables
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5189";

  // Form states
  const [userId, setUserId] = useState<string>("1");
  const [userData, setUserData] = useState<UserData>({
    email: "test@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
  });

  const testGetUser = async () => {
    if (!userId.trim()) {
      setResult("❌ Please enter a User ID");
      return;
    }

    setLoading(true);
    try {
      // Test direct connection to backend using env variable
      const response = await fetch(`${API_URL}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setResult(
          "✅ User retrieved successfully!\n" + JSON.stringify(data, null, 2)
        );
      } else {
        setResult(
          `❌ Get user failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Connection error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testCreateUser = async () => {
    if (
      !userData.email.trim() ||
      !userData.firstName.trim() ||
      !userData.lastName.trim()
    ) {
      setResult(
        "❌ Please fill in all required fields (email, firstName, lastName)"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(
          "✅ User created successfully!\n" + JSON.stringify(data, null, 2)
        );
        // Update the userId field with the newly created user's ID for easy testing
        if (data.id) {
          setUserId(data.id.toString());
        }
      } else {
        const errorText = await response.text();
        setResult(`❌ Create user failed: ${response.status}\n${errorText}`);
      }
    } catch (error) {
      setResult("❌ Create user error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testDeleteUser = async () => {
    if (!userId.trim()) {
      setResult("❌ Please enter a User ID to delete");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setResult(`✅ User with ID ${userId} deleted successfully!`);
      } else {
        setResult(
          `❌ Delete user failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Delete user error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testProxyConnection = async () => {
    if (!userId.trim()) {
      setResult("❌ Please enter a User ID");
      return;
    }

    setLoading(true);
    try {
      // Test connection through Next.js proxy
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setResult(
          "✅ Proxy connection successful!\n" + JSON.stringify(data, null, 2)
        );
      } else {
        setResult(
          `❌ Proxy connection failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Proxy connection error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>

      {/* Environment Info */}
      <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-semibold mb-1">
          Environment Configuration:
        </h3>
        <p className="text-xs text-gray-600">API URL: {API_URL}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Forms */}
        <div className="space-y-6">
          {/* User ID Input */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Get/Delete User</h3>
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User ID
              </label>
              <input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter user ID"
              />
            </div>
          </div>

          {/* Create User Form */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Create New User</h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) =>
                    handleUserDataChange("email", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={(e) =>
                    handleUserDataChange("password", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={userData.firstName}
                    onChange={(e) =>
                      handleUserDataChange("firstName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={userData.lastName}
                    onChange={(e) =>
                      handleUserDataChange("lastName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Operations</h3>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={testGetUser}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 transition-colors"
            >
              {loading ? "Testing..." : "🔍 Get User (Direct)"}
            </button>

            <button
              onClick={testProxyConnection}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 transition-colors"
            >
              {loading ? "Testing..." : "🔗 Get User (Proxy)"}
            </button>

            <button
              onClick={testCreateUser}
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "➕ Create User"}
            </button>

            <button
              onClick={testDeleteUser}
              disabled={loading}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting..." : "🗑️ Delete User"}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Quick Actions</h4>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => {
                  setUserData({
                    email: `user${Date.now()}@example.com`,
                    password: "password123",
                    firstName: "Test",
                    lastName: "User",
                  });
                }}
                className="block w-full text-left px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                🎲 Generate Random User
              </button>
              <button
                onClick={() => setResult("")}
                className="block w-full text-left px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                🧹 Clear Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-3 rounded border overflow-x-auto">
            {result}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Make sure your .NET backend is running</li>
            <li>Fill in the form fields with your test data</li>
            <li>Click the test buttons to verify operations</li>
            <li>
              Use "Create User" first, then test "Get" and "Delete" with the
              returned ID
            </li>
          </ol>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Backend URLs:</h2>
          <ul className="space-y-1 text-sm">
            <li>
              • Backend:{" "}
              <a
                href={API_URL}
                target="_blank"
                className="text-blue-600 underline"
              >
                {API_URL}
              </a>
            </li>
            <li>
              • Swagger:{" "}
              <a
                href={`${API_URL}/swagger`}
                target="_blank"
                className="text-blue-600 underline"
              >
                {API_URL}/swagger
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
