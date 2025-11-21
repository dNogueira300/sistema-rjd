"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-dark-pattern border-b border-slate-700 z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Title Section */}
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Panel de Administración
          </h1>
          <p className="text-sm text-slate-400">Gestión integral del sistema</p>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-r from-blue-600 to-green-600">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-100">
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
