import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./custom-styles.css";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sistema RJD - Control Interno",
  description: "Sistema de control interno para Suministro y Servicios RJD",
  keywords: "RJD, sistema, control interno, reparación, equipos, computación",
  authors: [{ name: "Suministro y Servicios RJD" }],
  icons: {
    icon: "/assets/favicon.ico",
    shortcut: "/assets/favicon.ico",
    apple: "/assets/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e293b",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRÍTICO: Obtener la sesión del servidor para hidratar el SessionProvider
  // Esto previene la pérdida de datos de sesión (incluyendo role) en refreshes
  const session = await getServerSession(authOptions);

  return (
    <html lang="es" className="dark">
      <body
        className="font-sans antialiased bg-slate-900 text-slate-100"
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
