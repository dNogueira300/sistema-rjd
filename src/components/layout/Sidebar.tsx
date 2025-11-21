"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Laptop, Users, DollarSign, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-pattern border-r border-slate-700 z-40">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="block">
            <div className="flex flex-col items-center space-y-3">
              <div className="logo-circle-white w-16 h-16 flex items-center justify-center">
                <Image
                  src="/assets/logo.png"
                  alt="Suministro y Servicios RJD"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center">
                <div className="text-slate-100 font-bold text-lg leading-tight">
                  Suministro y Servicios
                </div>
                <div className="text-gradient-blue-green font-bold text-base">
                  RJD
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-linear-to-r from-blue-600 to-green-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
          <p className="text-xs text-slate-400 text-center">
            Sistema RJD © {currentYear}
          </p>
        </div>
      </div>
    </aside>
  );
}
