import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Define Role type manually (from Prisma schema)
type Role = "ADMINISTRADOR" | "TECNICO";

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
              email: credentials.email,
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
      }

      // CRÍTICO: El rol ya debería estar en el token desde el login
      // NextAuth automáticamente persiste todas las propiedades del token
      // No necesitamos hacer nada extra aquí

      if (!token.role) {
        console.error(
          "[JWT Callback] ERROR: Token sin role después de callback!"
        );
      }

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
        if (token?.role) {
          session.user.role = token.role as Role;
        } else {
          console.error("[Session Callback] ERROR: Token no tiene role!");
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
