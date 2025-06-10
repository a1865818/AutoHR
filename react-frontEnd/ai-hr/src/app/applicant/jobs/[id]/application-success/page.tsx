import { ApplicationSuccessPage } from "@/components/jobs/apply/ApplicationSuccessPage";

interface ApplicationSuccessPageProps {
  params: {
    id: string;
  };
  searchParams: {
    applicationId?: string;
  };
}

export default async function ApplicantApplicationSuccessPage({
  params,
  searchParams,
}: ApplicationSuccessPageProps) {
  const { id } = await params;
  const { applicationId } = await searchParams;

  return <ApplicationSuccessPage jobId={id} applicationId={applicationId} />;
}
