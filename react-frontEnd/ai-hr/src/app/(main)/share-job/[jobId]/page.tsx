"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  CheckCircle,
  Share2,
  Linkedin,
  Facebook,
  Twitter,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { jobService } from "@/services/jobService";
import { ApiJob } from "@/interfaces/api";

export default function ShareJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<ApiJob | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socialDraft, setSocialDraft] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;

      setLoading(true);
      try {
        // Fetch job details
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);

        // Fetch company details
        if (jobData.companyId) {
          const companyData = await jobService.getCompanyById(
            jobData.companyId
          );
          setCompany(companyData);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  // Simulate API call to generate AI draft
  const handleGenerateAIDraft = async () => {
    if (!job || !company) {
      console.error("Job or company data not available");
      return;
    }

    setIsGeneratingDraft(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call static function (structured like an API response)
      const draft = await generateAIDraftFromAPI(job, company);
      setSocialDraft(draft);
      setCustomDraft(draft);
    } catch (error) {
      console.error("Error generating AI draft:", error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Static function structured like a backend API call
  const generateAIDraftFromAPI = async (
    jobData: ApiJob,
    companyData: any
  ): Promise<string> => {
    const jobUrl = `${window.location.origin}/public/jobs/${jobData.id}`;

    // Extract location from the locations object
    const location = extractLocationFromObject(jobData.locations);
    const locationString =
      location.city && location.country
        ? `${location.city}, ${location.country}`
        : location.country || location.city || "Remote";

    const companyName = companyData?.name || "our company";

    // Static AI-like response with different variations
    const variations = [
      `🚀 Exciting opportunity alert! We're looking for a talented ${
        jobData.title
      } to join our amazing team at ${companyName}!

💼 What you'll do: Drive innovation and make a real impact in ${
        jobData.department || "our dynamic team"
      }
📍 Location: ${locationString}
💰 Competitive salary and benefits package

Ready to take your career to the next level? Apply now! 👇
${jobUrl}

#Hiring #JobOpportunity #${jobData.title.replace(
        /\s+/g,
        ""
      )} #Career #JoinOurTeam`,

      `🌟 We're hiring! Join ${companyName} as our new ${jobData.title}

Looking for someone who's passionate about making a difference and ready to grow with us. This ${
        jobData.employmentType
      } position in ${locationString} offers incredible opportunities for professional development.

✨ What makes this role special:
• Work with a collaborative and innovative team
• Make a direct impact on our mission
• Competitive compensation and benefits

Interested? Learn more and apply: ${jobUrl}

#NowHiring #CareerOpportunity #${companyName.replace(/\s+/g, "")}Jobs`,

      `💡 Calling all ${jobData.title} professionals! 

${companyName} is expanding our team and we want YOU to be part of our journey. This is more than just a job - it's an opportunity to shape the future with us.

🎯 Perfect for someone who:
• Thrives in a fast-paced environment
• Loves solving complex challenges
• Wants to make a meaningful impact

📍 ${locationString} | ${jobData.employmentType}

Don't miss out - apply today: ${jobUrl}

#Hiring #TechJobs #Innovation #CareerGrowth`,
    ];

    // Return a random variation
    return variations[Math.floor(Math.random() * variations.length)];
  };

  // Helper function to extract location from the locations object
  const extractLocationFromObject = (
    locations: Record<string, any>
  ): { city: string; country: string } => {
    if (!locations) return { city: "", country: "" };

    // Direct city and country fields
    if (locations.city || locations.country) {
      return {
        city: locations.city || "",
        country: locations.country || "",
      };
    }

    // Legacy support: try to extract from address
    if (locations.address && typeof locations.address === "string") {
      const parts = locations.address.split(",").map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || "",
      };
    }

    // Legacy support: try description
    if (locations.description && typeof locations.description === "string") {
      const parts = locations.description
        .split(",")
        .map((p: string) => p.trim());
      return {
        city: parts[0] || "",
        country: parts[1] || "",
      };
    }

    return { city: "", country: "" };
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(customDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const shareToLinkedIn = () => {
    const text = encodeURIComponent(customDraft);
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.origin + "/public/jobs/" + jobId
    )}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      window.location.origin + "/public/jobs/" + jobId
    )}&quote=${encodeURIComponent(customDraft)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(customDraft);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(
      `Check out this job opportunity: ${job?.title} at ${
        company?.name || "our company"
      }`
    );
    const body = encodeURIComponent(customDraft);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-red-700">
            The job you're trying to share could not be found.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Share2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Share Your Job Post
          </h1>
        </div>
        <p className="text-gray-600">
          Share your job posting on social media to reach more qualified
          candidates
        </p>
      </div>

      {/* Job Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {job.title}
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              {company?.name || "Company"}
            </p>
            <p className="text-sm text-gray-500">
              {(() => {
                const location = extractLocationFromObject(job.locations);
                const locationString =
                  location.city && location.country
                    ? `${location.city}, ${location.country}`
                    : location.country || location.city || "Remote";
                return `${locationString} • ${job.employmentType}`;
              })()}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Published
            </div>
          </div>
        </div>
      </div>

      {/* AI Draft Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Social Media Draft
                </p>
                <p className="text-sm text-gray-500">
                  {customDraft
                    ? "Created just now • Customizable"
                    : "Click the button below to generate an engaging social media post"}
                </p>
              </div>
            </div>

            {customDraft && (
              <button
                onClick={handleGenerateAIDraft}
                disabled={isGeneratingDraft}
                className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-700 rounded-lg hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium">Regenerate</span>
                <svg
                  className="ml-2 w-4 h-4 group-hover:rotate-180 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {!customDraft ? (
            <div className="text-center py-10">
              <div className="mb-8">
                {/* Enhanced Empty State Icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center transform rotate-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Share2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs">✨</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Ready to amplify your job posting?
                </h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Our AI will analyze your job details and create a compelling
                  social media post that attracts top talent.
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAIDraft}
                disabled={isGeneratingDraft}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGeneratingDraft ? "Generating..." : "Generate with AI"}
              </button>

              <p className="text-xs text-gray-500 mt-4">
                Powered by advanced AI • Takes 2-3 seconds
              </p>
            </div>
          ) : (
            <>
              {/* Textarea */}
              <div className="relative mt-6">
                <textarea
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  className="w-full h-69 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-gray-50 hover:bg-white"
                  placeholder="Your social media post will appear here..."
                />
              </div>

              {/* Enhanced Footer */}
              <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      {customDraft.length}
                    </span>
                    <span className="text-gray-500"> characters</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Optimal length: 150-280 characters
                  </div>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      <span className="font-medium">Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Share Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Share on Social Media
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Click below to share your job post on your preferred platform
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={shareToLinkedIn}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Linkedin className="mr-3 h-5 w-5" />
              Share on LinkedIn
            </button>

            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
            >
              <Facebook className="mr-3 h-5 w-5" />
              Share on Facebook
            </button>

            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Twitter className="mr-3 h-5 w-5" />
              Share on Twitter
            </button>

            <button
              onClick={shareViaEmail}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail className="mr-3 h-5 w-5" />
              Share via Email
            </button>
          </div>
        </div>
      </div>

      {/* Public URL Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Public Job URL</h4>
        <p className="text-sm text-blue-700 mb-3">
          Anyone can access this link to view and apply for the position
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={`${window.location.origin}/public/jobs/${job.id}`}
            readOnly
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/public/jobs/${job.id}`
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
