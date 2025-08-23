import { SessionDebug } from "@/components/auth/SessionDebug";
import { ClientOnly } from "@/components/ClientOnly";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalToast } from "@/components/settings/GlobalToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI HR Recruitment Platform",
  description: "AI-powered recruitment platform for HR professionals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <GlobalToast />
            {/* <ClientOnly>
              <SessionDebug />
            </ClientOnly> */}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
