import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./custom-styles.css";
import { Providers } from "./providers";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className="font-sans antialiased bg-slate-900 text-slate-100"
      >
        <Providers session={null}>{children}</Providers>
      </body>
    </html>
  );
}
