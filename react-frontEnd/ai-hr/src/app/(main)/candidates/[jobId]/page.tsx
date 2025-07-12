import { CandidatesByJobPage } from "@/components/candidates/CandidatesByJobPage";

interface CandidatesByJobPageProps {
  params: {
    jobId: string;
  };
}

export default async function CandidatesByJob({
  params,
}: CandidatesByJobPageProps) {
  const { jobId } = await params;
  return <CandidatesByJobPage jobId={jobId} />;
}
