interface ProfileLayoutProps {
  children: React.ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[600px]">
        {children}
      </div>
    </div>
  );
}
