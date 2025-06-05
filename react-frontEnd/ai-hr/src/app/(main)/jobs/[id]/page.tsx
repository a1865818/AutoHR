import { JobDetailsPage } from "@/components/jobs/JobDetailPage";
interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetail({ params }: JobDetailPageProps) {
  const { id } = await params;
  return <JobDetailsPage jobId={id} />;
}
