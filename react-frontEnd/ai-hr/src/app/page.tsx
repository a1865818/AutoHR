import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome to AI HR Recruitment Platform
        </h1>
        <p className="text-gray-600 mt-2">
          Streamline your hiring process with AI-powered tools
        </p>
      </div>

      {/* Add TestComponent to verify Tailwind is working */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Create a New Job
          </h2>
          <p className="text-gray-600 mb-6">
            Generate job descriptions and start accepting applications
          </p>
          <Link
            href="/create-job"
            className="flex items-center justify-center border border-primary bg-primary text-black rounded-md px-4 py-2 font-medium hover:bg-blue-50 transition-colors"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Job
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Manage Candidates
          </h2>
          <p className="text-gray-600 mb-6">
            Review applications and select the best candidates
          </p>
          <Link
            href="/candidates"
            className="flex items-center justify-center border border-primary text-primary rounded-md px-4 py-2 font-medium hover:bg-blue-50 transition-colors"
          >
            View Candidates
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-gray-800">
              New applicant for{" "}
              <span className="font-medium">Frontend Developer</span>
            </p>
            <p className="text-sm text-gray-500">2 hours ago</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-gray-800">
              Job description generated for{" "}
              <span className="font-medium">UX Designer</span>
            </p>
            <p className="text-sm text-gray-500">Yesterday</p>
          </div>
          <div>
            <p className="text-gray-800">
              Interview scheduled with{" "}
              <span className="font-medium">John Doe</span>
            </p>
            <p className="text-sm text-gray-500">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
