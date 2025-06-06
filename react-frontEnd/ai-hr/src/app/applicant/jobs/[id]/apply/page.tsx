import JobApplicationForm from "@/components/jobs/apply/JobApplicationForm";

interface ApplicantApplyPageProps {
  params: {
    id: string;
  };
}

export default async function ApplicantApplyPage({
  params,
}: ApplicantApplyPageProps) {
  const { id } = await params;

  return <JobApplicationForm jobId={id} />;
}
