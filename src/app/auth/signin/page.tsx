// src/app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
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

  return (
    <div className="font-body min-h-screen w-full flex bg-slate-950 text-slate-100">
      {/* ===== Panel izquierdo: marca ===== */}
      <aside className="relative hidden lg:flex lg:w-[55%] flex-col justify-between p-12 xl:p-16 overflow-hidden">
        {/* Fondo atmosférico */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 login-grid" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-blob" />
        <div className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl animate-blob animation-delay-2000" />

        {/* Marca */}
        <div
          className="relative z-10 login-reveal"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-black/40 shrink-0">
              <Image
                src="/logo.png"
                alt="Suministro y Servicios RJD"
                width={56}
                height={56}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-slate-200">
                Suministro y Servicios
              </p>
              <p className="font-display text-2xl font-bold text-gradient-blue-green -mt-0.5">
                RJD
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <div
          className="relative z-10 max-w-md login-reveal"
          style={{ animationDelay: "160ms" }}
        >
          <div className="h-px w-16 bg-linear-to-r from-blue-500 to-emerald-500 mb-8" />
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.1] text-slate-100">
            Control interno,
            <br />
            <span className="text-gradient-blue-green">simple y claro.</span>
          </h1>
          <p className="mt-6 text-slate-400 text-base leading-relaxed">
            Gestiona equipos, clientes y finanzas de tu servicio técnico desde un
            solo lugar.
          </p>
        </div>

        {/* Footer */}
        <div
          className="relative z-10 login-reveal"
          style={{ animationDelay: "260ms" }}
        >
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Suministro y Servicios RJD · Todos los
            derechos reservados
          </p>
        </div>
      </aside>

      {/* Divisor sutil */}
      <div className="hidden lg:block w-px bg-linear-to-b from-transparent via-slate-700/60 to-transparent" />

      {/* ===== Panel derecho: formulario ===== */}
      <main className="relative flex-1 flex flex-col bg-slate-900">
        {/* Atmósfera solo en móvil (sin tarjeta central) */}
        <div className="absolute inset-0 lg:hidden bg-dark-pattern" />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 py-12">
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            {/* Marca compacta (móvil) */}
            <div className="lg:hidden flex items-center gap-3 mb-10 login-reveal">
              <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-lg shadow-black/30 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Suministro y Servicios RJD"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <p className="font-display font-bold text-lg">
                <span className="text-slate-100">Servicios </span>
                <span className="text-gradient-blue-green">RJD</span>
              </p>
            </div>

            {/* Encabezado */}
            <div className="login-reveal" style={{ animationDelay: "80ms" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gradient-blue-green mb-3">
                Sistema de control interno
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-100">
                Iniciar sesión
              </h2>
              <p className="mt-3 text-slate-400">
                Ingresa tus credenciales para acceder a tu cuenta.
              </p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div
                className="space-y-2 login-reveal"
                style={{ animationDelay: "140ms" }}
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-blue-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 pl-11 pr-4 py-3 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 focus:bg-slate-800"
                    placeholder="admin@rjd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div
                className="space-y-2 login-reveal"
                style={{ animationDelay: "200ms" }}
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-emerald-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 pl-11 pr-11 py-3 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 focus:bg-slate-800"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/40 px-4 py-3 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Botón */}
              <div
                className="login-reveal pt-1"
                style={{ animationDelay: "260ms" }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-linear-to-r from-blue-600 to-emerald-600 shadow-lg shadow-blue-900/30 transition-all duration-200 hover:from-blue-500 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-900/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <ArrowRight className="w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer (móvil) */}
            <p className="lg:hidden mt-10 text-center text-xs text-slate-600">
              © {new Date().getFullYear()} Suministro y Servicios RJD
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
