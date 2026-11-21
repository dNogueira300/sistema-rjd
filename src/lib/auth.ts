import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Define Role type manually (from Prisma schema)
type Role = "ADMINISTRADOR" | "TECNICO";

// Cada cuánto se revalida el rol/estado del usuario contra la BD
const ROLE_RECHECK_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  // NO usar adapter con strategy JWT - causan conflictos
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 60 minutos de sesión
    updateAge: 5 * 60, // Refrescar el token cada 5 minutos si hay actividad
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim(),
            },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          if (user.status === "INACTIVE") {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // En el login inicial, guardar el rol del usuario en el token
      if (user) {
        token.role = (user as { role: Role }).role;
        token.checkedAt = Date.now();
        token.inactive = false;
      }

      // Revalidar rol y estado contra la BD cada cierto tiempo, para que
      // cambios hechos desde el módulo de Usuarios (ascender a administrador,
      // desactivar, eliminar) se apliquen sin que el usuario cierre sesión.
      const now = Date.now();
      if (
        !user &&
        token.sub &&
        (trigger === "update" ||
          !token.checkedAt ||
          now - token.checkedAt > ROLE_RECHECK_MS)
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, status: true, name: true, email: true },
          });
          if (!dbUser || dbUser.status === "INACTIVE") {
            token.inactive = true;
            token.role = undefined;
          } else {
            token.inactive = false;
            token.role = dbUser.role as Role;
            token.name = dbUser.name;
            token.email = dbUser.email;
          }
          token.checkedAt = now;
        } catch (error) {
          // Si la BD falla, mantener el token actual
          console.error("[JWT Callback] Error revalidando usuario:", error);
        }
      }

      // CRÍTICO: El rol ya debería estar en el token desde el login
      // NextAuth automáticamente persiste todas las propiedades del token
      // No necesitamos hacer nada extra aquí

      // Actualizar timestamp cuando el token se refresca
      if (trigger === "update") {
        token.iat = Math.floor(Date.now() / 1000);
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        if (token?.sub) {
          session.user.id = token.sub;
        }

        // CRÍTICO: Siempre asignar el rol desde el token a la sesión
        if (token?.role && !token.inactive) {
          session.user.role = token.role as Role;
        } else {
          // Usuario desactivado o eliminado: sin rol no pasa ninguna guardia
          session.user.role = undefined as unknown as Role;
        }
        if (token?.name) session.user.name = token.name;
        if (token?.email) session.user.email = token.email;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // No existe /auth/error: NextAuth agrega ?error=... y el login lo muestra
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
