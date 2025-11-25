import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // DEBUG: Log para rastrear el problema del role en middleware
    console.log("[Middleware]", {
      pathname,
      hasToken: !!token,
      tokenRole: token?.role,
      tokenSub: token?.sub,
    });

    // Si está autenticado y está en rutas públicas, redirigir según rol
    if (
      token &&
      (pathname === "/" ||
        pathname === "/welcome" ||
        pathname === "/auth/signin")
    ) {
      console.log("[Middleware] Redirigiendo usuario autenticado, role:", token.role);
      if (token.role === "ADMINISTRADOR") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/equipos", req.url));
      }
    }

    // Control de acceso por roles para rutas administrativas
    if (token && pathname.startsWith("/admin")) {
      console.log("[Middleware] Verificando acceso admin, role:", token.role);
      if (token.role !== "ADMINISTRADOR") {
        console.log("[Middleware] Acceso denegado - role no es ADMINISTRADOR");
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir acceso a rutas públicas
        if (
          pathname === "/" ||
          pathname === "/welcome" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/_next") ||
          pathname === "/favicon.ico" ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Requerir autenticación para todas las demás rutas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
