import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold text-gray-800">
        Welcome to AI HR Recruitment Platform
      </h2>
      <p className="mt-2 text-gray-600">
        Streamline your hiring process with AI-powered tools
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            Create a New Job
          </h3>
          <p className="mt-2 text-gray-600">
            Generate job descriptions and start accepting applications
          </p>
          <Link
            href="/create-job"
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Job
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            Manage Candidates
          </h3>
          <p className="mt-2 text-gray-600">
            Review applications and select the best candidates
          </p>
          <Link
            href="/candidates"
            className="mt-6 w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            View Candidates
          </Link>
        </div>
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Recent Activity
        </h3>
        <div className="space-y-6">
          <div className="pb-6 border-b border-gray-200">
            <p className="font-medium text-gray-700">
              New applicant for Frontend Developer
            </p>
            <p className="text-sm text-gray-500 mt-1">2 hours ago</p>
          </div>
          <div className="pb-6 border-b border-gray-200">
            <p className="font-medium text-gray-700">
              Job description generated for UX Designer
            </p>
            <p className="text-sm text-gray-500 mt-1">Yesterday</p>
          </div>
          <div className="pb-6">
            <p className="font-medium text-gray-700">
              Interview scheduled with John Doe
            </p>
            <p className="text-sm text-gray-500 mt-1">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
