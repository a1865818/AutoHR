import { PublicJobDetails } from "@/components/jobs/public/PublicJobDetails";

interface PublicJobDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function PublicJobDetailsPage({
  params,
}: PublicJobDetailsPageProps) {
  const { id } = await params;

  return <PublicJobDetails jobId={id} />;
}
