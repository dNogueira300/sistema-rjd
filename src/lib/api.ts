// src/lib/api.ts
"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

// Flag para evitar múltiples redirecciones simultáneas
let isRedirecting = false;

/**
 * Maneja errores de autenticación (401)
 * Redirige al login automáticamente cuando la sesión expira
 */
async function handleAuthError() {
  if (isRedirecting) return;
  isRedirecting = true;

  toast.error("Tu sesión ha expirado. Redirigiendo al login...", {
    duration: 3000,
  });

  // Pequeño delay para que el usuario vea el mensaje
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await signOut({ callbackUrl: "/auth/signin" });
  isRedirecting = false;
}

/**
 * Wrapper de fetch que maneja automáticamente errores 401
 * Redirige al login cuando la sesión expira
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // Si es error 401, redirigir al login
  if (response.status === 401) {
    handleAuthError();
    throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
  }

  return response;
}

/**
 * Helper para hacer peticiones JSON con manejo automático de 401
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || `Error ${response.status}`
    );
  }

  return response.json();
}
