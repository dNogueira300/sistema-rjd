"use client";

import { useSession } from "next-auth/react";
import { User, Menu } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-dark-pattern border-b border-slate-700 z-30 transition-all duration-300",
        // Ajustar posición izquierda según estado del sidebar
        isMobile
          ? "left-0" // En móvil, ocupa todo el ancho
          : isCollapsed
          ? "left-20" // Desktop colapsado
          : "left-64" // Desktop expandido
      )}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left Section - Hamburger + Title */}
        <div className="flex items-center gap-3">
          {/* Botón hamburguesa para colapsar/expandir sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={
              isMobile
                ? "Abrir menú"
                : isCollapsed
                ? "Expandir menú"
                : "Colapsar menú"
            }
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title Section */}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-100">
              Panel de Administración
            </h1>
            <p className="text-xs md:text-sm text-slate-400 hidden sm:block">
              Gestión integral del sistema
            </p>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-r from-blue-600 to-green-600">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-100 truncate max-w-[120px] md:max-w-[200px]">
                {session?.user?.email || "Usuario"}
              </p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
