"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Inicia colapsado por defecto
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);

      // En móvil, siempre iniciar colapsado
      if (mobile) {
        setIsCollapsed(true);
      } else {
        // En desktop, abrir por defecto
        setIsCollapsed(false);
      }
    };

    // Verificar al montar
    checkMobile();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const closeSidebar = () => setIsCollapsed(true);
  const openSidebar = () => setIsCollapsed(false);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobile,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
