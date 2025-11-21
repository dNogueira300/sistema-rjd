"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Laptop,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Equipos",
    href: "/dashboard/equipos",
    icon: Laptop,
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    name: "Finanzas",
    href: "/dashboard/finanzas",
    icon: DollarSign,
  },
  {
    name: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const { isCollapsed, isMobile, closeSidebar } = useSidebar();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleNavClick = () => {
    // Cerrar sidebar en móvil al hacer click en un enlace
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-dark-pattern border-r border-slate-700 z-50 transition-all duration-300 ease-in-out",
          // En móvil: slide desde la izquierda
          isMobile
            ? isCollapsed
              ? "-translate-x-full w-64"
              : "translate-x-0 w-64"
            : // En desktop: colapsar a mini sidebar
            isCollapsed
            ? "w-20"
            : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-start justify-between">
              <Link
                href="/dashboard"
                className="block flex-1"
                onClick={handleNavClick}
              >
                <div
                  className={cn(
                    "flex flex-col items-center",
                    isCollapsed && !isMobile ? "items-center" : "items-center"
                  )}
                >
                  <div className="logo-circle-white w-12 h-12 shrink-0 flex items-center justify-center">
                    <Image
                      src="/assets/logo.png"
                      alt="Suministro y Servicios RJD"
                      width={48}
                      height={48}
                      className="object-contain"
                      priority
                    />
                  </div>
                  {(!isCollapsed || isMobile) && (
                    <div className="text-center mt-2">
                      <div className="text-slate-100 font-bold text-sm leading-tight">
                        Suministro y Servicios
                      </div>
                      <div className="text-gradient-blue-green font-bold text-xs">
                        RJD
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              {/* Botón cerrar en móvil */}
              {isMobile && !isCollapsed && (
                <button
                  onClick={closeSidebar}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors absolute top-4 right-4"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    isCollapsed && !isMobile ? "justify-center" : "",
                    isActive
                      ? "bg-linear-to-r from-blue-600 to-green-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                  title={isCollapsed && !isMobile ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Toggle Button - Solo en desktop */}
          {!isMobile && (
            <div className="p-3 border-t border-slate-700">
              {/* <button
                onClick={toggleSidebar}
                className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
                title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Colapsar</span>
                  </>
                )}
              </button> */}
            </div>
          )}

          {/* Footer with Logout */}
          <div className="p-3 border-t border-slate-700 space-y-2">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg w-full text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200",
                isCollapsed && !isMobile ? "justify-center" : ""
              )}
              title={isCollapsed && !isMobile ? "Cerrar sesión" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="font-medium">Cerrar sesión</span>
              )}
            </button>
            {(!isCollapsed || isMobile) && (
              <p className="text-xs text-slate-400 text-center">
                Sistema RJD © {currentYear}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
