import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirigir a login si no está autenticado
    if (!token && pathname !== "/auth/signin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Si está autenticado y está en login, redirigir al dashboard
    if (token && pathname === "/auth/signin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Control de acceso por roles
    if (token && pathname.startsWith("/admin")) {
      if (token.role !== "ADMINISTRADOR") {
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
          pathname.startsWith("/auth") ||
          pathname === "/" ||
          pathname.startsWith("/_next") ||
          pathname === "/favicon.ico"
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
