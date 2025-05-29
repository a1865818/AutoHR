"use client";

import { useState } from "react";

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface ApplicationDetailData {
  jobId: string;
  candidateUserId: string;
  resumeUrl?: string;
  coverLetterText?: string;
  expectedSalary?: number;
  availabilityDate?: string;
  jobSource?: string;
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

  // Application Detail states
  const [applicationDetailId, setApplicationDetailId] = useState<string>("");
  const [applicationData, setApplicationData] = useState<ApplicationDetailData>(
    {
      jobId: "00000000-0000-0000-0000-000000000001",
      candidateUserId: "00000000-0000-0000-0000-000000000001",
      resumeUrl: "https://example.com/resume.pdf",
      coverLetterText: "I am excited to apply for this position...",
      expectedSalary: 75000,
      availabilityDate: new Date().toISOString().split("T")[0],
      jobSource: "LinkedIn",
    }
  );

  // User API Tests
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
        setResult("✅ User created successfully!");
        // Check if there's a location header to get the new ID
        const location = response.headers.get("Location");
        if (location) {
          const newId = location.split("/").pop();
          if (newId) {
            setUserId(newId);
            setResult((prev) => prev + `\nNew user ID: ${newId}`);
          }
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

  // Application Detail API Tests
  const testCreateApplicationDetail = async () => {
    if (!applicationData.jobId || !applicationData.candidateUserId) {
      setResult("❌ Please enter required Job ID and Candidate User ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/applicationdetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        setResult("✅ Application detail created successfully!");
        // Check if there's a location header to get the new ID
        const location = response.headers.get("Location");
        if (location) {
          const newId = location.split("/").pop();
          if (newId) {
            setApplicationDetailId(newId);
            setResult((prev) => prev + `\nNew application detail ID: ${newId}`);
          }
        }
      } else {
        const errorText = await response.text();
        setResult(
          `❌ Create application detail failed: ${response.status}\n${errorText}`
        );
      }
    } catch (error) {
      setResult(
        "❌ Create application detail error: " + (error as Error).message
      );
    }
    setLoading(false);
  };

  const testGetApplicationDetail = async () => {
    if (!applicationDetailId.trim()) {
      setResult("❌ Please enter an Application Detail ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/applicationdetails/${applicationDetailId}`
      );
      if (response.ok) {
        setResult("✅ Application detail retrieved successfully!");
      } else {
        setResult(
          `❌ Get application detail failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Connection error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testGetApplicationDetailsByJob = async () => {
    if (!applicationData.jobId.trim()) {
      setResult("❌ Please enter a Job ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/applicationdetails/job/${applicationData.jobId}`
      );
      if (response.ok) {
        setResult("✅ Application details for job retrieved successfully!");
      } else {
        setResult(
          `❌ Get application details by job failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Connection error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testGetApplicationDetailsByCandidate = async () => {
    if (!applicationData.candidateUserId.trim()) {
      setResult("❌ Please enter a Candidate User ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/applicationdetails/candidate/${applicationData.candidateUserId}`
      );
      if (response.ok) {
        setResult(
          "✅ Application details for candidate retrieved successfully!"
        );
      } else {
        setResult(
          `❌ Get application details by candidate failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult("❌ Connection error: " + (error as Error).message);
    }
    setLoading(false);
  };

  const testDeleteApplicationDetail = async () => {
    if (!applicationDetailId.trim()) {
      setResult("❌ Please enter an Application Detail ID to delete");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/applicationdetails/${applicationDetailId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setResult(
          `✅ Application detail with ID ${applicationDetailId} deleted successfully!`
        );
      } else {
        setResult(
          `❌ Delete application detail failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      setResult(
        "❌ Delete application detail error: " + (error as Error).message
      );
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

  const handleApplicationDataChange = (
    field: keyof ApplicationDetailData,
    value: string | number
  ) => {
    setApplicationData((prev) => ({
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
        {/* User Operations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">User Operations</h2>

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
            <div className="mt-3 flex space-x-2">
              <button
                onClick={testGetUser}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
              >
                🔍 Get User
              </button>
              <button
                onClick={testDeleteUser}
                disabled={loading}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
              >
                🗑️ Delete User
              </button>
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
              <button
                onClick={testCreateUser}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm mt-2"
              >
                ➕ Create User
              </button>
            </div>
          </div>
        </div>

        {/* Application Detail Operations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Application Detail Operations</h2>

          {/* Application Detail ID Input */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              Get/Delete Application Detail
            </h3>
            <div>
              <label
                htmlFor="applicationDetailId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Application Detail ID
              </label>
              <input
                id="applicationDetailId"
                type="text"
                value={applicationDetailId}
                onChange={(e) => setApplicationDetailId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter application detail ID (UUID)"
              />
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={testGetApplicationDetail}
                disabled={loading}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
              >
                🔍 Get Detail
              </button>
              <button
                onClick={testDeleteApplicationDetail}
                disabled={loading}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
              >
                🗑️ Delete Detail
              </button>
            </div>
          </div>

          {/* Create Application Detail Form */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              Create Application Detail
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="jobId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job ID *
                  </label>
                  <input
                    id="jobId"
                    type="text"
                    value={applicationData.jobId}
                    onChange={(e) =>
                      handleApplicationDataChange("jobId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="UUID format"
                  />
                </div>
                <div>
                  <label
                    htmlFor="candidateUserId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Candidate ID *
                  </label>
                  <input
                    id="candidateUserId"
                    type="text"
                    value={applicationData.candidateUserId}
                    onChange={(e) =>
                      handleApplicationDataChange(
                        "candidateUserId",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="UUID format"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="resumeUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resume URL
                </label>
                <input
                  id="resumeUrl"
                  type="text"
                  value={applicationData.resumeUrl}
                  onChange={(e) =>
                    handleApplicationDataChange("resumeUrl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/resume.pdf"
                />
              </div>

              <div>
                <label
                  htmlFor="coverLetterText"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cover Letter
                </label>
                <textarea
                  id="coverLetterText"
                  value={applicationData.coverLetterText}
                  onChange={(e) =>
                    handleApplicationDataChange(
                      "coverLetterText",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Cover letter content..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="expectedSalary"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expected Salary
                  </label>
                  <input
                    id="expectedSalary"
                    type="number"
                    value={applicationData.expectedSalary}
                    onChange={(e) =>
                      handleApplicationDataChange(
                        "expectedSalary",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="75000"
                  />
                </div>
                <div>
                  <label
                    htmlFor="jobSource"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job Source
                  </label>
                  <input
                    id="jobSource"
                    type="text"
                    value={applicationData.jobSource}
                    onChange={(e) =>
                      handleApplicationDataChange("jobSource", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="LinkedIn, Website, etc."
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="availabilityDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Availability Date
                </label>
                <input
                  id="availabilityDate"
                  type="date"
                  value={applicationData.availabilityDate}
                  onChange={(e) =>
                    handleApplicationDataChange(
                      "availabilityDate",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={testCreateApplicationDetail}
                  disabled={loading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
                >
                  ➕ Create Application
                </button>
              </div>

              <div className="flex space-x-2 mt-2">
                <button
                  onClick={testGetApplicationDetailsByJob}
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
                >
                  🔍 Get By Job ID
                </button>
                <button
                  onClick={testGetApplicationDetailsByCandidate}
                  disabled={loading}
                  className="flex-1 bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors text-sm"
                >
                  🔍 Get By Candidate ID
                </button>
              </div>
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
          <button
            onClick={() => setResult("")}
            className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            🧹 Clear Results
          </button>
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
              Create users and application details first, then test retrieval
              and deletion
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
