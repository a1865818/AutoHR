interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex-1">
      <div className="bg-white rounded-lg shadow p-6">{children}</div>
    </div>
  );
}
