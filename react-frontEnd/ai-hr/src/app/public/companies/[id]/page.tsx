import PublicCompanyDetails from "@/components/public/PublicCompanyDetails";

interface PageProps {
  params: {
    id: string;
  };
}

export default function PublicCompanyPage({ params }: PageProps) {
  return <PublicCompanyDetails companyId={params.id} />;
}
