// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, signOut, useSession, getSession } from "next-auth/react";
import { Toaster, toast } from "sonner";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

// Componente para manejar el timeout de inactividad y refrescar sesión
function SessionManager({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hora de inactividad para logout
  const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // Verificar sesión cada 10 minutos

  const handleLogout = useCallback(async (showMessage = true) => {
    if (showMessage) {
      toast.error("Tu sesión ha expirado. Redirigiendo al login...", {
        duration: 3000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await signOut({ callbackUrl: "/auth/signin" });
  }, []);

  // Verificar y refrescar sesión periódicamente
  const checkAndRefreshSession = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      // getSession fuerza una verificación del token con el servidor
      const currentSession = await getSession();

      if (!currentSession) {
        // Si no hay sesión válida, redirigir al login
        handleLogout(true);
      }
    } catch {
      // Error al verificar sesión, probablemente expiró
      handleLogout(true);
    }
  }, [status, handleLogout]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    if (session) {
      idleTimeoutRef.current = setTimeout(() => {
        handleLogout(false);
      }, IDLE_TIMEOUT);
    }
  }, [session, handleLogout, IDLE_TIMEOUT]);

  useEffect(() => {
    if (!session || status !== "authenticated") return;

    // Eventos que reinician el timer de inactividad
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Iniciar timer de inactividad
    resetIdleTimer();

    // Iniciar verificación periódica de sesión
    refreshIntervalRef.current = setInterval(() => {
      // Solo verificar si ha habido actividad reciente
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity < IDLE_TIMEOUT) {
        checkAndRefreshSession();
      }
    }, SESSION_REFRESH_INTERVAL);

    // Agregar listeners
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Cleanup
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [session, status, resetIdleTimer, checkAndRefreshSession, IDLE_TIMEOUT, SESSION_REFRESH_INTERVAL]);

  return <>{children}</>;
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
          },
        },
      })
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <SessionManager>{children}</SessionManager>
        <Toaster position="top-right" theme="dark" richColors expand={true} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
