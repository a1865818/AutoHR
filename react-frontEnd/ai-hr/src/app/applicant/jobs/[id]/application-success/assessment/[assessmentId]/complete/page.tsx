"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, FileText, ArrowLeft } from "lucide-react";
import { applicationService } from "@/services/applyService";
import { useAuth } from "@/contexts/AuthContext";

export default function AssessmentCompletePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const assessmentId = params.assessmentId as string;
  const jobId = params.id as string;

 

  // Validate assessment ID format
  const isValidAssessmentId = () => {
    const parts = assessmentId.split('-');
    // Should have at least 11 parts: 5 for first GUID + 5 for second GUID + 1 for timestamp
    return parts.length >= 11;
  };

  const handleBackToApplication = async () => {
    // Parse assessment ID to get user ID
    // Format: {roundId}-{userId}-{timestamp}
    // Example: 983756cb-7232-4a56-a702-af4d8b1ef515-8a2e8a34-caca-4781-8e25-16ad14484f95-1758438967326
    const parts = assessmentId.split('-');
    
    console.log('🔍 Complete page - Assessment ID:', assessmentId);
    console.log('🔍 Complete page - Parts:', parts);
    console.log('🔍 Complete page - Parts length:', parts.length);
    console.log('🔍 Complete page - Job ID:', jobId);
    console.log('🔍 Complete page - Current authenticated user:', user);
    console.log('🔍 Complete page - Authenticated user ID:', user?.id);
    
    if (parts.length < 11) {
      console.error('Invalid assessment ID format in complete page');
      // Fallback to application success page without applicationId
      router.push(`/applicant/jobs/${jobId}/application-success`);
      return;
    }
    
    // Extract the second GUID (userId) - parts 5-9 (indices 5-9)
    // First GUID: parts 0-4, Second GUID: parts 5-9, timestamp: parts 10+
    const extractedUserId = parts.slice(5, 10).join('-');
    const roundId = parts.slice(0, 5).join('-');
    const timestamp = parts.slice(10).join('-');
    
    // Use the authenticated user ID if available, otherwise use the extracted one
    const userId = user?.id || extractedUserId;
    
    console.log('🔍 Complete page - Extracted userId from assessment ID:', extractedUserId);
    console.log('🔍 Complete page - Authenticated user ID:', user?.id);
    console.log('🔍 Complete page - Final userId to use:', userId);
    console.log('🔍 Complete page - Extracted roundId:', roundId);
    console.log('🔍 Complete page - Extracted timestamp:', timestamp);
    console.log('🔍 Complete page - userId length:', userId.length);
    console.log('🔍 Complete page - userId format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId));
    console.log('🔍 Complete page - userId matches authenticated user ID:', userId === user?.id);
    
    try {
      // Try the direct method first
      console.log('🔍 Complete page - Trying getApplicationIdByCandidateAndJob with:', { userId, jobId });
      console.log('🔍 Complete page - Authenticated user for comparison:', { 
        authenticatedUserId: user?.id, 
        extractedUserId: userId, 
        userMatch: userId === user?.id,
        userCategory: user?.userCategory 
      });
      
      try {
        const applicationDetail = await applicationService.getApplicationIdByCandidateAndJob(userId, jobId, true);
        console.log('🔍 Complete page - Application detail received:', applicationDetail);
        
        // Redirect to application success page with the correct application ID
        const redirectUrl = `/applicant/jobs/${jobId}/application-success?applicationId=${applicationDetail.id}`;
        console.log('🔍 Complete page - Redirecting to:', redirectUrl);
        router.push(redirectUrl);
        return;
      } catch (directError) {
        console.warn('🔍 Complete page - Direct method failed, trying alternative:', directError);
        
        // Alternative method: Get all user applications and find the one for this job
        console.log('🔍 Complete page - Trying getUserApplications as fallback');
        const userApplications = await applicationService.getUserApplications();
        console.log('🔍 Complete page - User applications received:', userApplications);
        
        const applicationForJob = userApplications.find(app => app.jobId === jobId);
        if (applicationForJob) {
          console.log('🔍 Complete page - Found application for job:', applicationForJob);
          const redirectUrl = `/applicant/jobs/${jobId}/application-success?applicationId=${applicationForJob.id}`;
          console.log('🔍 Complete page - Redirecting to:', redirectUrl);
          router.push(redirectUrl);
          return;
        } else {
          console.warn('🔍 Complete page - No application found for job in user applications');
        }
      }
    } catch (error) {
      console.error('Failed to get application ID:', error);
      console.log('🔍 Complete page - Error details:', error);
    }
    
    // Final fallback to application success page without applicationId
    // The application success page will try to load the application data using other methods
    const fallbackUrl = `/applicant/jobs/${jobId}/application-success`;
    console.log('🔍 Complete page - Falling back to:', fallbackUrl);
    router.push(fallbackUrl);
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

