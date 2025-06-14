import { GuestApplicationSuccessPage } from "@/components/jobs/public/GuestApplicationSuccessPage";

interface GuestApplicationSuccessPageProps {
  params: {
    id: string;
  };
  searchParams: {
    applicationId?: string;
  };
}

export default async function PublicApplicationSuccessPage({
  params,
  searchParams,
}: GuestApplicationSuccessPageProps) {
  const { id } = await params;
  const { applicationId } = await searchParams;

  return (
    <GuestApplicationSuccessPage jobId={id} applicationId={applicationId} />
  );
}
