"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-dark-pattern">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          // Ajustar margen izquierdo según estado del sidebar
          isMobile
            ? "ml-0" // En móvil, sin margen (sidebar se superpone)
            : isCollapsed
            ? "ml-20" // Desktop colapsado
            : "ml-64" // Desktop expandido
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
