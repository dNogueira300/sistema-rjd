import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Página de inicio según el rol del usuario
function homeFor(role: string | undefined) {
  return role === "ADMINISTRADOR" ? "/dashboard" : "/dashboard/equipos";
}

// Rutas del dashboard a las que puede entrar un TECNICO
const TECNICO_ALLOWED = ["/dashboard/equipos"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isLoggedIn = !!token && !token.inactive;

    // Raíz: ir directo al login o al panel (sin pantalla de espera)
    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(isLoggedIn ? homeFor(token?.role) : "/auth/signin", req.url)
      );
    }

    // Nota: withAuth no ejecuta este middleware en /auth/signin; la
    // redirección de usuarios ya autenticados está en esa página.

    // Control de acceso por rol dentro del dashboard
    if (isLoggedIn && pathname.startsWith("/dashboard")) {
      if (
        token?.role !== "ADMINISTRADOR" &&
        !TECNICO_ALLOWED.some((p) => pathname.startsWith(p))
      ) {
        return NextResponse.redirect(new URL("/dashboard/equipos", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    // Sin esto, withAuth manda a la página por defecto /api/auth/signin
    pages: { signIn: "/auth/signin" },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rutas públicas
        if (pathname === "/" || pathname.startsWith("/auth")) return true;

        return !!token && !token.inactive;
      },
    },
  }
);

// Las rutas /api quedan fuera: validan la sesión por sí mismas y responden
// 401 en JSON (apiFetch lo detecta), en vez de una redirección HTML.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|assets/|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)).*)",
  ],
};
