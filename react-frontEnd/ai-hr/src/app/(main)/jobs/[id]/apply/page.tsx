import JobApplicationForm from "@/components/jobs/apply/JobApplicationForm";

interface ApplyPageProps {
  params: {
    id: string;
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;

  return <JobApplicationForm jobId={id} />;
}
