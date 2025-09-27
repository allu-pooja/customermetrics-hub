import { Navbar } from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main content area */}
      <main className="flex-1 p-6 bg-background overflow-auto">{children}</main>
    </div>
  );
}
