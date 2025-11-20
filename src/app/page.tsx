"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Timer para redireccionar después de 3 segundos
    const timer = setTimeout(() => {
      if (session) {
        // Si ya está logueado, ir al dashboard según rol
        if (session.user.role === "ADMINISTRADOR") {
          router.push("/dashboard");
        } else {
          router.push("/equipos");
        }
      } else {
        // Si no está logueado, ir al login
        router.push("/auth/signin");
      }
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, [session, status, router]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback a PNG si SVG falla
    const target = e.target as HTMLImageElement;
    if (target.src.includes(".svg")) {
      target.src = "/assets/logon.png";
    }
  };

  return (
    <div className="min-h-screen bg-dark-pattern relative overflow-hidden">
      {/* Elementos decorativos de fondo para tema oscuro */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-green-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>

        {/* Patrón de puntos sutil */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(148, 163, 184, 0.3) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>
      </div>

      {/* Contenido central */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8">
          {/* Logo en círculo con efecto glow */}
          <div className="flex justify-center">
            <div className="logo-circle-glow w-40 h-40 flex items-center justify-center">
              <div className="w-24 h-24 relative">
                <Image
                  src="/assets/logo.png"
                  alt="Suministro y Servicios RJD"
                  width={96}
                  height={96}
                  className="drop-shadow-2xl object-contain"
                  onError={handleImageError}
                  priority
                />
              </div>
            </div>
          </div>

          {/* Texto de bienvenida */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
              Suministro y Servicios
              <span className="block text-3xl text-gradient-blue-green font-bold mt-1">
                RJD
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-md mx-auto leading-relaxed">
              Sistema de Control Interno
            </p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Reparación y mantenimiento de equipos de computación
            </p>
          </div>

          {/* Indicador de carga elegante */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-600 border-t-blue-500"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-green-500 animate-ping"></div>
              </div>
            </div>
            <p className="text-sm text-slate-400 animate-pulse">
              Iniciando sistema...
            </p>
          </div>

          {/* Barra de progreso moderna */}
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-slate-800 rounded-full h-2 shadow-inner">
              <div className="bg-linear-to-r from-blue-500 to-green-500 h-2 rounded-full shadow-lg loading-bar-dark"></div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="pt-8">
            <p className="text-xs text-slate-500">© 2025 RJD - Versión 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
