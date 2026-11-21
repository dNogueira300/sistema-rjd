import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// El DATABASE_URL trae `connection_limit=1`. Con Vercel Fluid Compute una
// misma instancia atiende varias peticiones a la vez, y con una sola conexión
// todas las consultas (incluidos los Promise.all) quedan en cola; si la cola
// supera el pool_timeout, la petición falla. Se sube el límite (el pooler de
// Supabase en modo transacción, puerto 6543, admite muchas conexiones).
// Se puede ajustar con la variable PRISMA_CONNECTION_LIMIT.
function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const limit = process.env.PRISMA_CONNECTION_LIMIT || "5";
    url.searchParams.set("connection_limit", limit);
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: buildDatasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
