import { ApplicantJobDetailPage } from "@/components/jobs/ApplicantJobDetailPage";

interface ApplicantJobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ApplicantJobDetail({
  params,
}: ApplicantJobDetailPageProps) {
  // Using await to properly handle the dynamic params
  const { id } = await params;
  return <ApplicantJobDetailPage jobId={id} />;
}
