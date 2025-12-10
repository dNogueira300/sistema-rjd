import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["@prisma/client", "prisma"],

  // Configuración específica para archivos estáticos en production
  assetPrefix: process.env.NODE_ENV === "production" ? "" : undefined,

  // Asegurar serving correcto de archivos públicos
  async rewrites() {
    return [
      {
        source: "/logo.png",
        destination: "/logo.png",
      },
    ];
  },
};

export default nextConfig;
