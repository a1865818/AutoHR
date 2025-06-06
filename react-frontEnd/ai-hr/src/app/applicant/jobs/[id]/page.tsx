import { ApplicantJobDetailPage } from "@/components/jobs/ApplicantJobDetailPage";

interface ApplicantJobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ApplicantJobDetail({
  params,
}: ApplicantJobDetailPageProps) {
  const { id } = params;
  return <ApplicantJobDetailPage jobId={id} />;
}
