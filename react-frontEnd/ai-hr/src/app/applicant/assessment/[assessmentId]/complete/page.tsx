"use client";

import React from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Clock, FileText } from "lucide-react";

export default function AssessmentCompletePage() {
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Assessment Completed!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for completing the culture fit assessment. Your responses have been submitted successfully.
          </p>

          {/* Assessment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Submitted at</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Assessment ID</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">Status</span>
              </div>
              <div className="text-gray-900 font-medium">
                {new Date().toLocaleString()}
              </div>
              <div className="text-gray-900 font-medium">
                {assessmentId}
              </div>
              <div className="text-green-600 font-medium">
                Completed
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-blue-900 mb-3">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-2 text-left">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span>Your responses will be reviewed by our hiring team</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span>You'll receive an email with next steps within 2-3 business days</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span>If selected, you'll be invited to the next round of interviews</span>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="text-sm text-gray-500">
            <p>If you have any questions about your assessment, please contact us at:</p>
            <p className="font-medium text-gray-700 mt-1">recruiting@company.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
