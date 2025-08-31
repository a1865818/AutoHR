"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, FileText, ArrowLeft } from "lucide-react";
import { applicationService } from "@/services/applyService";

export default function AssessmentCompletePage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;
  const jobId = params.id as string;

  // Validate assessment ID format
  const isValidAssessmentId = () => {
    const parts = assessmentId.split('-');
    return parts.length >= 7;
  };

  const handleBackToApplication = async () => {
    // Parse assessment ID to get user ID using the new format
    // Format: {roundId}-{userId}-{timestamp}
    const parts = assessmentId.split('-');
    
    if (parts.length < 7) {
      console.error('Invalid assessment ID format in complete page');
      // Fallback to application success page without applicationId
      router.push(`/applicant/jobs/${jobId}/application-success`);
      return;
    }
    
    // userId is the next 5 parts (another GUID)
    const userId = parts.slice(5, 10).join('-');
    
    try {
      console.log('🔍 Fetching application ID for candidate:', userId, 'and job:', jobId);
      
      // Get the correct application ID for this candidate and job
      const applicationDetail = await applicationService.getApplicationIdByCandidateAndJob(userId, jobId);
      
      console.log('✅ Got application detail:', applicationDetail);
      
      // Redirect to application success page with the correct application ID
      router.push(`/applicant/jobs/${jobId}/application-success?applicationId=${applicationDetail.id}`);
    } catch (error) {
      console.error('❌ Failed to get application ID:', error);
      // Fallback to application success page without applicationId
      router.push(`/applicant/jobs/${jobId}/application-success`);
    }
  };

  // If assessment ID is invalid, show error
  if (!isValidAssessmentId()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Assessment
            </h1>
            <p className="text-gray-600 mb-8">
              The assessment ID is invalid. Please return to your application.
            </p>
            <button
              onClick={() => router.push(`/applicant/jobs/${jobId}/application-success`)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Back to Application
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Back to Application Button */}
          <button
            onClick={handleBackToApplication}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Application
          </button>

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

