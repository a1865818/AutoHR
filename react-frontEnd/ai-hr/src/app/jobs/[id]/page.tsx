// app/jobs/[id]/page.tsx
import { JobDetailsPage } from "@/components/jobs/JobDetailPage";
interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetail({ params }: JobDetailPageProps) {
  return <JobDetailsPage jobId={params.id} />;
}

// // Optional: Generate metadata for the page
// export async function generateMetadata({ params }: JobDetailPageProps) {
//   // In a real app, you'd fetch the job data here
//   return {
//     title: `Job Details - ${params.id}`,
//     description: "View detailed information about this job posting.",
//   };
// }
