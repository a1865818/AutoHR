import { ApplicantSidebar, Header, ProtectedRoute } from "@/components";
import { SavedJobsProvider } from "@/contexts/SavedJobsContext";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredUserCategory="ApplicationUser">
      <SavedJobsProvider>
        <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <ApplicantSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </SavedJobsProvider>
    </ProtectedRoute>
  );
}
