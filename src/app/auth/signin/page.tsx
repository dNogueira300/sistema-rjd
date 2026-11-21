// src/app/auth/signin/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // El middleware de NextAuth no se ejecuta en la propia página de login,
  // así que la redirección de usuarios ya autenticados se hace aquí.
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(
      session.user.role === "ADMINISTRADOR" ? "/dashboard" : "/dashboard/equipos"
    );
  }

  // NextAuth redirige aquí con ?error=... cuando falla un inicio de sesión
  const { error } = await searchParams;
  const initialError = !error
    ? ""
    : error === "CredentialsSignin"
      ? "Credenciales inválidas. Verifica tu email y contraseña."
      : "No se pudo iniciar sesión. Intenta nuevamente.";

  return <SignInForm initialError={initialError} />;
}
