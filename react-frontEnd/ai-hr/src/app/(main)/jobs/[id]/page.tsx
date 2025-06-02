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
