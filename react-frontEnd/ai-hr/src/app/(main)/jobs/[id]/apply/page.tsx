// app/jobs/[id]/apply/page.tsx
import JobApplicationForm from "@/components/jobs/apply/JobApplicationForm";
import { getJobById, jobToJobData } from "@/lib/data/mockJobs";

// Function to get job data - in real app this would be an API call
async function getJobData(jobId: string) {
  const job = getJobById(jobId);

  if (!job) {
    // Return a default job if not found
    const defaultJob = getJobById("1");
    return defaultJob ? jobToJobData(defaultJob) : null;
  }

  return jobToJobData(job);
}

interface ApplyPageProps {
  params: {
    id: string;
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const jobData = await getJobData(params.id);

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h1>
          <p className="text-gray-600">
            The job you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return <JobApplicationForm jobData={jobData} />;
}
