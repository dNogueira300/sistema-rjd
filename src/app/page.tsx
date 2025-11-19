"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Aún cargando

    if (session) {
      // Si está logueado, redirigir según el rol
      if (session.user.role === "ADMINISTRADOR") {
        router.push("/dashboard");
      } else {
        router.push("/equipos");
      }
    } else {
      // Si no está logueado, redirigir al login
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Página de carga mientras se determina el estado
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando Sistema RJD...</p>
      </div>
    </div>
  );
}
