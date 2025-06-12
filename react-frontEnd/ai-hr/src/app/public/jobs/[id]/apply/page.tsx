import { GuestJobApplicationForm } from "@/components/jobs/public/GuestJobApplicationForm";

interface PublicApplyPageProps {
  params: {
    id: string;
  };
}

export default async function PublicApplyPage({
  params,
}: PublicApplyPageProps) {
  const { id } = await params;

  return <GuestJobApplicationForm jobId={id} />;
}
