// app/jobs/[id]/edit/page.tsx
import { JobEditPage } from "@/components/jobs/edit/JobEditPage";
interface JobEditRouteProps {
  params: {
    id: string;
  };
}

export default function JobEdit({ params }: JobEditRouteProps) {
  return <JobEditPage jobId={params.id} />;
}
