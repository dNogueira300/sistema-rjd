// src/app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas. Verifica tu email y contraseña.");
      } else {
        const session = await getSession();
        if (session?.user.role === "ADMINISTRADOR") {
          router.push("/dashboard");
        } else {
          router.push("/equipos");
        }
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error al iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

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
      </div>

      {/* Contenido principal */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header del login */}
          <div className="text-center space-y-6">
            {/* Logo en círculo */}
            <div className="flex justify-center">
              <div className="logo-circle-glow w-32 h-32 flex items-center justify-center">
                <div className="w-20 h-20 relative flex items-center justify-center">
                  <Image
                    src="/assets/logo.png"
                    alt="Suministro y Servicios RJD"
                    width={80}
                    height={80}
                    className="drop-shadow-xl object-contain absolute inset-0 m-auto"
                    onError={handleImageError}
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-100">
                Iniciar Sesión
              </h2>
              <p className="text-slate-300">
                Accede al Sistema de Control Interno
              </p>
              <p className="text-sm text-slate-400">
                Suministro y Servicios RJD
              </p>
            </div>
          </div>

          {/* Formulario de login con glassmorphism */}
          <div className="glass-dark-strong rounded-3xl p-8 shadow-2xl border border-slate-600/30">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Campo Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-200 flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Correo electrónico</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-dark block w-full px-4 py-3 rounded-xl transition-all duration-200"
                    placeholder="admin@rjd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-200 flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-green-400" />
                  <span>Contraseña</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input-dark block w-full px-4 py-3 pr-12 rounded-xl transition-all duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-200 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-200 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-900/30 px-4 py-3 rounded-xl border border-red-500/30 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Botón de login */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-dark w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>

            {/* Credenciales por defecto */}
            {/* <div className="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Credenciales por defecto:</span>
              </h4>
              <div className="text-xs text-blue-200/80 space-y-1 ml-4">
                <p>
                  <span className="font-medium">Email:</span> admin@rjd.com
                </p>
                <p>
                  <span className="font-medium">Contraseña:</span> admin123
                </p>
              </div>
            </div> */}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Suministro y Servicios RJD - Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
