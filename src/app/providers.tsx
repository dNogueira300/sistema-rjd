// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { Toaster } from "sonner";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

// Componente para manejar el timeout de inactividad
function IdleSessionManager({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hora en milisegundos

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (session) {
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, IDLE_TIMEOUT);
    }
  }, [session, handleLogout, IDLE_TIMEOUT]);

  useEffect(() => {
    if (!session) return;

    // Eventos que reinician el timer de inactividad
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Iniciar timer
    resetTimer();

    // Agregar listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session, resetTimer]);

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
        <IdleSessionManager>{children}</IdleSessionManager>
        <Toaster position="top-right" theme="dark" richColors expand={true} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
