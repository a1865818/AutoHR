"use client";

import { useState } from "react";
import { CreateJobForm } from "@/components/jobs/CreateJobForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateJobPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
        <p className="mt-2 text-gray-600">
          Create a comprehensive job posting to attract the best candidates
        </p>
      </div>

      {/* Form */}
      <CreateJobForm />
    </div>
  );
}
