import { JobEditPage } from "@/components/jobs/edit/JobEditPage";
interface JobEditRouteProps {
  params: {
    id: string;
  };
}

export default async function JobEdit({ params }: JobEditRouteProps) {
  const { id } = await params;
  return <JobEditPage jobId={id} />;
}
