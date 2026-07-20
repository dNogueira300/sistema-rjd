# Módulo de Licencias de Antivirus — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un módulo solo-admin para registrar paquetes de licencias de antivirus y sus activaciones (fecha, técnico, clave, soporte, cliente), con descuento de stock, aviso de agotamiento y exportación a Excel/PDF.

**Architecture:** Dos entidades Prisma nuevas (`LicensePackage`, `LicenseActivation`). API REST plana por recurso (`/api/license-packages`, `/api/license-activations`) siguiendo el patrón de `tecnicos`/`equipments` (sesión NextAuth + chequeo de rol `ADMINISTRADOR` + validación Zod). UI en `/dashboard/licencias` con dos pestañas (Activaciones / Paquetes), hooks TanStack Query, formularios con Tailwind + validación Zod vía `useMemo` (patrón de `ClientForm`), Excel inline con ExcelJS y PDF con un generador jsPDF dedicado.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma + PostgreSQL, NextAuth (JWT), TanStack Query, Zod, Tailwind CSS 4, lucide-react, react-day-picker, ExcelJS, jsPDF.

## Global Constraints

- **Verificación (este repo NO tiene framework de tests):** cada tarea se verifica con `npm run lint` y `npx tsc --noEmit`; las tareas con hitos grandes usan `npm run build`. Las tareas de API se prueban en runtime con el dev server. No se introduce ningún framework de tests nuevo (ningún módulo existente tiene tests).
- **Acceso:** todos los endpoints y la página son solo `ADMINISTRADOR`. Patrón exacto: `getServerSession(authOptions)` → 401 si `!session?.user`, 403 si `session.user.role !== "ADMINISTRADOR"`.
- **Idioma/locale:** UI en español, locale peruano. Timezone `America/Lima`.
- **Alias:** `@/*` → `./src/*`.
- **Estilo UI:** clases CSS existentes (`card-dark-strong`, `input-dark`, `input-group`, `btn-primary-dark`, `glass-dark`). Colores de marca: azul `#2563eb`, verde `#059669`.
- **Umbral de stock bajo:** constante `LICENSE_LOW_STOCK_THRESHOLD = 2`.
- **Código de paquete:** formato `LIC-YYYYMMDD-NNNN` (correlativo por día, `NNNN` con `padStart(4,"0")`).
- **Commits:** frecuentes, uno por tarea. Mensajes en español, con la línea `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en rama `feat/licencias-antivirus` (no directo sobre `main`).

---

## Mapa de archivos

**Crear:**
- `src/types/license.ts` — tipos de dominio, inputs, filtros, respuestas y filas de exportación.
- `src/lib/validations/license.ts` — esquemas Zod + tipos derivados + helper de estado de stock.
- `src/lib/license-pdf-generator.ts` — generadores PDF (activaciones y paquetes).
- `src/app/api/license-packages/route.ts` — GET (lista con restantes) + POST (crear con código).
- `src/app/api/license-packages/[id]/route.ts` — GET / PUT / DELETE.
- `src/app/api/license-activations/route.ts` — GET (lista con filtros) + POST (guardia de stock).
- `src/app/api/license-activations/[id]/route.ts` — GET / PUT / DELETE.
- `src/hooks/useLicensePackages.ts` — query + mutaciones de paquetes.
- `src/hooks/useLicenseActivations.ts` — query (con filtros) + mutaciones de activaciones.
- `src/components/licenses/LicensePackageForm.tsx`
- `src/components/licenses/LicensePackagesTable.tsx`
- `src/components/licenses/LicenseActivationForm.tsx`
- `src/components/licenses/LicenseActivationsTable.tsx`
- `src/components/licenses/LicenseFilters.tsx`
- `src/app/dashboard/licencias/page.tsx` — página con pestañas + exportación.

**Modificar:**
- `prisma/schema.prisma` — 2 modelos nuevos + relaciones inversas en `User` y `Customer`.
- `src/components/layout/Sidebar.tsx` — ítem de menú "Licencias".

---

### Task 1: Modelo de datos y migración

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos Prisma `LicensePackage` y `LicenseActivation`; el cliente Prisma expone `prisma.licensePackage` y `prisma.licenseActivation` con relaciones `activations`, `technician`, `customer`, `package`.

- [ ] **Step 1: Agregar relaciones inversas en `User` y `Customer`**

En `prisma/schema.prisma`, dentro de `model User`, en la sección de relaciones (junto a `assignedEquipments`, `payrollRecords`, `advances`), agregar:

```prisma
  licenseActivations LicenseActivation[]
```

Dentro de `model Customer`, junto a `equipments`, agregar:

```prisma
  licenseActivations LicenseActivation[]
```

- [ ] **Step 2: Agregar los dos modelos nuevos al final del schema**

Agregar al final de `prisma/schema.prisma`:

```prisma
// ============ MODELOS DE LICENCIAS DE ANTIVIRUS ============

model LicensePackage {
  id            String   @id @default(cuid())
  code          String   @unique // LIC-YYYYMMDD-NNNN
  provider      String?  // Proveedor / dónde se compró
  totalLicenses Int      // Total del paquete (ej. 10)
  purchaseDate  DateTime @default(now())
  observations  String?
  createdBy     String   // User ID (admin) que registró
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relaciones
  activations LicenseActivation[]

  @@map("license_packages")

  // Indices
  @@index([purchaseDate(sort: Desc)], name: "license_package_date_idx")
  @@index([code], name: "license_package_code_idx")
}

model LicenseActivation {
  id             String   @id @default(cuid())
  activationDate DateTime @default(now())
  licenseKey     String   // Clave de la licencia
  support        String   // Datos de soporte / garantía
  observations   String?
  createdBy      String   // User ID (admin) que registró
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relaciones
  packageId  String
  package    LicensePackage @relation(fields: [packageId], references: [id])
  technicianId String
  technician   User         @relation(fields: [technicianId], references: [id])
  customerId String
  customer   Customer       @relation(fields: [customerId], references: [id])

  @@map("license_activations")

  // Indices
  @@index([activationDate(sort: Desc)], name: "license_activation_date_idx")
  @@index([packageId], name: "license_activation_package_idx")
  @@index([technicianId], name: "license_activation_technician_idx")
  @@index([customerId], name: "license_activation_customer_idx")
}
```

- [ ] **Step 3: Validar el schema**

Run: `npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid 🚀`

- [ ] **Step 4: Crear y aplicar la migración**

Run: `npx prisma migrate dev --name add_license_module`
Expected: crea `prisma/migrations/<timestamp>_add_license_module/` y aplica sin errores. Regenera el cliente automáticamente.

- [ ] **Step 5: Regenerar el cliente Prisma (por si acaso) y typecheck**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/licencias-antivirus
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(licencias): modelo de datos de paquetes y activaciones"
```

---

### Task 2: Tipos de dominio

**Files:**
- Create: `src/types/license.ts`

**Interfaces:**
- Produces: `LicensePackage`, `LicenseActivation`, `CreateLicensePackageData`, `UpdateLicensePackageData`, `CreateLicenseActivationData`, `UpdateLicenseActivationData`, `LicenseActivationFilters`, `LicensePackagesResponse`, `LicenseActivationsResponse`, `PackageStockStatus`, y las filas de exportación `ActivationExportRow` / `PackageExportRow`. Consumidos por API, hooks, componentes y generador PDF.

- [ ] **Step 1: Crear el archivo de tipos**

```typescript
// src/types/license.ts

export type PackageStockStatus = "ACTIVE" | "LOW" | "DEPLETED";

// Referencias mínimas embebidas en una activación
export interface ActivationTechnicianRef {
  id: string;
  name: string;
}

export interface ActivationCustomerRef {
  id: string;
  name: string;
}

export interface ActivationPackageRef {
  id: string;
  code: string;
}

// ====== PAQUETE ======
export interface LicensePackage {
  id: string;
  code: string;
  provider: string | null;
  totalLicenses: number;
  usedLicenses: number;
  remainingLicenses: number;
  stockStatus: PackageStockStatus;
  purchaseDate: string;
  observations: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicensePackageData {
  provider?: string;
  totalLicenses: number;
  purchaseDate: string; // ISO
  observations?: string;
}

export interface UpdateLicensePackageData extends Partial<CreateLicensePackageData> {}

// ====== ACTIVACIÓN ======
export interface LicenseActivation {
  id: string;
  activationDate: string;
  licenseKey: string;
  support: string;
  observations: string | null;
  packageId: string;
  technicianId: string;
  customerId: string;
  package: ActivationPackageRef;
  technician: ActivationTechnicianRef;
  customer: ActivationCustomerRef;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseActivationData {
  packageId: string;
  activationDate: string; // ISO
  technicianId: string;
  licenseKey: string;
  support: string;
  customerId: string;
  observations?: string;
}

export interface UpdateLicenseActivationData
  extends Partial<CreateLicenseActivationData> {}

export interface LicenseActivationFilters {
  from?: string; // ISO (inicio de rango)
  to?: string; // ISO (fin de rango)
  technicianId?: string;
  customerId?: string;
  packageId?: string;
}

// ====== RESPUESTAS API ======
export interface LicensePackagesResponse {
  packages: LicensePackage[];
  total: number;
}

export interface LicenseActivationsResponse {
  activations: LicenseActivation[];
  total: number;
}

// ====== FILAS DE EXPORTACIÓN ======
export interface ActivationExportRow {
  activationDate: string;
  technicianName: string;
  customerName: string;
  licenseKey: string;
  support: string;
  packageCode: string;
  observations: string;
}

export interface PackageExportRow {
  code: string;
  provider: string;
  totalLicenses: number;
  usedLicenses: number;
  remainingLicenses: number;
  statusLabel: string;
  purchaseDate: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/types/license.ts
git commit -m "feat(licencias): tipos de dominio"
```

---

### Task 3: Validaciones Zod y helper de stock

**Files:**
- Create: `src/lib/validations/license.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `createLicensePackageSchema`, `updateLicensePackageSchema`, `createLicenseActivationSchema`, `updateLicenseActivationSchema`, `licenseActivationFiltersSchema`, la constante `LICENSE_LOW_STOCK_THRESHOLD`, y el helper `getStockStatus(remaining: number): PackageStockStatus`. Consumidos por las rutas API y la UI.

- [ ] **Step 1: Crear el archivo de validaciones**

```typescript
// src/lib/validations/license.ts
import { z } from "zod";
import type { PackageStockStatus } from "@/types/license";

export const LICENSE_LOW_STOCK_THRESHOLD = 2;

export const getStockStatus = (remaining: number): PackageStockStatus => {
  if (remaining <= 0) return "DEPLETED";
  if (remaining <= LICENSE_LOW_STOCK_THRESHOLD) return "LOW";
  return "ACTIVE";
};

// ====== PAQUETE ======
export const createLicensePackageSchema = z.object({
  provider: z
    .string()
    .max(100, "El proveedor no puede exceder 100 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  totalLicenses: z
    .number({ invalid_type_error: "El total debe ser un número" })
    .int("El total debe ser un número entero")
    .min(1, "El total debe ser al menos 1")
    .max(100000, "El total es demasiado grande"),
  purchaseDate: z
    .string()
    .min(1, "La fecha de compra es requerida")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  observations: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateLicensePackageSchema = createLicensePackageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

// ====== ACTIVACIÓN ======
export const createLicenseActivationSchema = z.object({
  packageId: z.string().min(1, "El paquete es requerido"),
  activationDate: z
    .string()
    .min(1, "La fecha es requerida")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  technicianId: z.string().min(1, "El técnico es requerido"),
  licenseKey: z
    .string()
    .min(1, "La clave es requerida")
    .max(200, "La clave no puede exceder 200 caracteres")
    .trim(),
  support: z
    .string()
    .min(1, "El soporte es requerido")
    .max(1000, "El soporte no puede exceder 1000 caracteres")
    .trim(),
  customerId: z.string().min(1, "El cliente es requerido"),
  observations: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateLicenseActivationSchema = createLicenseActivationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Al menos un campo debe ser actualizado",
  });

export const licenseActivationFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  technicianId: z.string().optional(),
  customerId: z.string().optional(),
  packageId: z.string().optional(),
});

export type CreateLicensePackageInput = z.infer<
  typeof createLicensePackageSchema
>;
export type CreateLicenseActivationInput = z.infer<
  typeof createLicenseActivationSchema
>;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/license.ts
git commit -m "feat(licencias): validaciones zod y helper de stock"
```

---

### Task 4: API de paquetes (`/api/license-packages`)

**Files:**
- Create: `src/app/api/license-packages/route.ts`
- Create: `src/app/api/license-packages/[id]/route.ts`

**Interfaces:**
- Consumes: `createLicensePackageSchema`, `updateLicensePackageSchema`, `getStockStatus` (Task 3); tipo `LicensePackage` (Task 2).
- Produces: endpoints REST. `GET /api/license-packages` → `{ packages: LicensePackage[], total }`. `POST` → `{ package: LicensePackage }` (201). `[id]`: `GET` → `{ package, activations }`, `PUT` → `{ package }`, `DELETE` → `{ message, deletedId }`. Genera `code` `LIC-YYYYMMDD-NNNN`.

- [ ] **Step 1: Crear `route.ts` (lista + creación)**

```typescript
// src/app/api/license-packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLicensePackageSchema, getStockStatus } from "@/lib/validations/license";
import type { LicensePackage } from "@/types/license";

interface PrismaPackageResult {
  id: string;
  code: string;
  provider: string | null;
  totalLicenses: number;
  purchaseDate: Date;
  observations: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { activations: number };
}

function toLicensePackage(pkg: PrismaPackageResult): LicensePackage {
  const usedLicenses = pkg._count.activations;
  const remainingLicenses = pkg.totalLicenses - usedLicenses;
  return {
    id: pkg.id,
    code: pkg.code,
    provider: pkg.provider,
    totalLicenses: pkg.totalLicenses,
    usedLicenses,
    remainingLicenses,
    stockStatus: getStockStatus(remainingLicenses),
    purchaseDate: pkg.purchaseDate.toISOString(),
    observations: pkg.observations,
    createdBy: pkg.createdBy,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

// Genera un código LIC-YYYYMMDD-NNNN correlativo por día
async function generateLicensePackageCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const last = await prisma.licensePackage.findFirst({
    where: { createdAt: { gte: today, lt: tomorrow } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let next = 1;
  if (last?.code) {
    const lastSeq = parseInt(last.code.split("-")[2] ?? "0", 10);
    if (!Number.isNaN(lastSeq)) next = lastSeq + 1;
  }

  return `LIC-${datePart}-${String(next).padStart(4, "0")}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const packages = await prisma.licensePackage.findMany({
      orderBy: { purchaseDate: "desc" },
      include: { _count: { select: { activations: true } } },
    });

    const formatted = (packages as PrismaPackageResult[]).map(toLicensePackage);

    return NextResponse.json({ packages: formatted, total: formatted.length });
  } catch (error) {
    console.error("Error obteniendo paquetes de licencias:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const data = createLicensePackageSchema.parse(body);

    const code = await generateLicensePackageCode();

    const created = await prisma.licensePackage.create({
      data: {
        code,
        provider: data.provider ? data.provider : null,
        totalLicenses: data.totalLicenses,
        purchaseDate: new Date(data.purchaseDate),
        observations: data.observations ? data.observations : null,
        createdBy: session.user.id,
      },
      include: { _count: { select: { activations: true } } },
    });

    return NextResponse.json(
      { package: toLicensePackage(created as PrismaPackageResult) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando paquete de licencias:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `[id]/route.ts` (detalle, actualización, borrado)**

```typescript
// src/app/api/license-packages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLicensePackageSchema, getStockStatus } from "@/lib/validations/license";
import type { LicensePackage } from "@/types/license";

interface PrismaPackageResult {
  id: string;
  code: string;
  provider: string | null;
  totalLicenses: number;
  purchaseDate: Date;
  observations: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { activations: number };
}

function toLicensePackage(pkg: PrismaPackageResult): LicensePackage {
  const usedLicenses = pkg._count.activations;
  const remainingLicenses = pkg.totalLicenses - usedLicenses;
  return {
    id: pkg.id,
    code: pkg.code,
    provider: pkg.provider,
    totalLicenses: pkg.totalLicenses,
    usedLicenses,
    remainingLicenses,
    stockStatus: getStockStatus(remainingLicenses),
    purchaseDate: pkg.purchaseDate.toISOString(),
    observations: pkg.observations,
    createdBy: pkg.createdBy,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMINISTRADOR") {
    return { error: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const pkg = await prisma.licensePackage.findUnique({
    where: { id },
    include: {
      _count: { select: { activations: true } },
      activations: {
        orderBy: { activationDate: "desc" },
        include: {
          technician: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ package: toLicensePackage(pkg as PrismaPackageResult) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateLicensePackageSchema.parse(body);

    const existing = await prisma.licensePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }

    const updated = await prisma.licensePackage.update({
      where: { id },
      data: {
        ...(data.provider !== undefined ? { provider: data.provider || null } : {}),
        ...(data.totalLicenses !== undefined ? { totalLicenses: data.totalLicenses } : {}),
        ...(data.purchaseDate !== undefined ? { purchaseDate: new Date(data.purchaseDate) } : {}),
        ...(data.observations !== undefined ? { observations: data.observations || null } : {}),
      },
      include: { _count: { select: { activations: true } } },
    });

    return NextResponse.json({ package: toLicensePackage(updated as PrismaPackageResult) });
  } catch (error) {
    console.error("Error actualizando paquete:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const pkg = await prisma.licensePackage.findUnique({
    where: { id },
    include: { _count: { select: { activations: true } } },
  });
  if (!pkg) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }
  if (pkg._count.activations > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar un paquete con activaciones registradas", details: "Elimine primero las activaciones asociadas." },
      { status: 400 }
    );
  }

  await prisma.licensePackage.delete({ where: { id } });
  return NextResponse.json({ message: "Paquete eliminado", deletedId: id });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores. (Nota: `params` es `Promise` en Next 16 App Router — el código ya usa `await params`.)

- [ ] **Step 4: Verificar en runtime**

Run: `npm run dev` (en segundo plano) y, autenticado como admin en el navegador, en la consola del navegador (o vía la app luego) confirmar que `GET /api/license-packages` responde `{ packages: [], total: 0 }`. Alternativamente crear un paquete con:

```bash
# En la consola del navegador ya logueado como admin:
fetch('/api/license-packages', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({totalLicenses:10,purchaseDate:new Date().toISOString()})}).then(r=>r.json()).then(console.log)
```
Expected: objeto `{ package: { code: "LIC-...-0001", totalLicenses: 10, remainingLicenses: 10, stockStatus: "ACTIVE", ... } }`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/license-packages
git commit -m "feat(licencias): API de paquetes con generacion de codigo"
```

---

### Task 5: API de activaciones (`/api/license-activations`)

**Files:**
- Create: `src/app/api/license-activations/route.ts`
- Create: `src/app/api/license-activations/[id]/route.ts`

**Interfaces:**
- Consumes: `createLicenseActivationSchema`, `updateLicenseActivationSchema`, `licenseActivationFiltersSchema` (Task 3); tipo `LicenseActivation` (Task 2).
- Produces: `GET /api/license-activations` (con filtros `from`,`to`,`technicianId`,`customerId`,`packageId`) → `{ activations, total }`. `POST` con guardia de stock → `{ activation }` (201) o 400 si el paquete está agotado. `[id]`: `GET`/`PUT`/`DELETE`.

- [ ] **Step 1: Crear `route.ts` (lista con filtros + creación con guardia de stock)**

```typescript
// src/app/api/license-activations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLicenseActivationSchema,
  licenseActivationFiltersSchema,
} from "@/lib/validations/license";
import type { LicenseActivation } from "@/types/license";

interface PrismaActivationResult {
  id: string;
  activationDate: Date;
  licenseKey: string;
  support: string;
  observations: string | null;
  packageId: string;
  technicianId: string;
  customerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  package: { id: string; code: string };
  technician: { id: string; name: string };
  customer: { id: string; name: string };
}

function toActivation(a: PrismaActivationResult): LicenseActivation {
  return {
    id: a.id,
    activationDate: a.activationDate.toISOString(),
    licenseKey: a.licenseKey,
    support: a.support,
    observations: a.observations,
    packageId: a.packageId,
    technicianId: a.technicianId,
    customerId: a.customerId,
    package: { id: a.package.id, code: a.package.code },
    technician: { id: a.technician.id, name: a.technician.name },
    customer: { id: a.customer.id, name: a.customer.name },
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

const activationInclude = {
  package: { select: { id: true, code: true } },
  technician: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = licenseActivationFiltersSchema.parse({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      packageId: searchParams.get("packageId") || undefined,
    });

    const where: Record<string, unknown> = {};
    if (filters.from || filters.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.gte = new Date(filters.from);
      if (filters.to) dateFilter.lte = new Date(filters.to);
      where.activationDate = dateFilter;
    }
    if (filters.technicianId) where.technicianId = filters.technicianId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.packageId) where.packageId = filters.packageId;

    const activations = await prisma.licenseActivation.findMany({
      where,
      orderBy: { activationDate: "desc" },
      include: activationInclude,
    });

    const formatted = (activations as PrismaActivationResult[]).map(toActivation);
    return NextResponse.json({ activations: formatted, total: formatted.length });
  } catch (error) {
    console.error("Error obteniendo activaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const data = createLicenseActivationSchema.parse(body);

    // Verificar que el paquete existe y tiene stock disponible
    const pkg = await prisma.licensePackage.findUnique({
      where: { id: data.packageId },
      include: { _count: { select: { activations: true } } },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }
    const remaining = pkg.totalLicenses - pkg._count.activations;
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "El paquete no tiene licencias disponibles", details: "Registre un nuevo paquete." },
        { status: 400 }
      );
    }

    // Verificar existencia de técnico y cliente
    const [technician, customer] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.technicianId }, select: { id: true } }),
      prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }),
    ]);
    if (!technician) {
      return NextResponse.json({ error: "Técnico no encontrado" }, { status: 404 });
    }
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const created = await prisma.licenseActivation.create({
      data: {
        packageId: data.packageId,
        activationDate: new Date(data.activationDate),
        technicianId: data.technicianId,
        licenseKey: data.licenseKey,
        support: data.support,
        customerId: data.customerId,
        observations: data.observations ? data.observations : null,
        createdBy: session.user.id,
      },
      include: activationInclude,
    });

    return NextResponse.json(
      { activation: toActivation(created as PrismaActivationResult) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando activación:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `[id]/route.ts`**

```typescript
// src/app/api/license-activations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLicenseActivationSchema } from "@/lib/validations/license";
import type { LicenseActivation } from "@/types/license";

interface PrismaActivationResult {
  id: string;
  activationDate: Date;
  licenseKey: string;
  support: string;
  observations: string | null;
  packageId: string;
  technicianId: string;
  customerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  package: { id: string; code: string };
  technician: { id: string; name: string };
  customer: { id: string; name: string };
}

const activationInclude = {
  package: { select: { id: true, code: true } },
  technician: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
} as const;

function toActivation(a: PrismaActivationResult): LicenseActivation {
  return {
    id: a.id,
    activationDate: a.activationDate.toISOString(),
    licenseKey: a.licenseKey,
    support: a.support,
    observations: a.observations,
    packageId: a.packageId,
    technicianId: a.technicianId,
    customerId: a.customerId,
    package: { id: a.package.id, code: a.package.code },
    technician: { id: a.technician.id, name: a.technician.name },
    customer: { id: a.customer.id, name: a.customer.name },
    createdBy: a.createdBy,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMINISTRADOR") {
    return { error: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const activation = await prisma.licenseActivation.findUnique({
    where: { id },
    include: activationInclude,
  });
  if (!activation) {
    return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ activation: toActivation(activation as PrismaActivationResult) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateLicenseActivationSchema.parse(body);

    const existing = await prisma.licenseActivation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
    }

    const updated = await prisma.licenseActivation.update({
      where: { id },
      data: {
        ...(data.packageId !== undefined ? { packageId: data.packageId } : {}),
        ...(data.activationDate !== undefined ? { activationDate: new Date(data.activationDate) } : {}),
        ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
        ...(data.licenseKey !== undefined ? { licenseKey: data.licenseKey } : {}),
        ...(data.support !== undefined ? { support: data.support } : {}),
        ...(data.customerId !== undefined ? { customerId: data.customerId } : {}),
        ...(data.observations !== undefined ? { observations: data.observations || null } : {}),
      },
      include: activationInclude,
    });

    return NextResponse.json({ activation: toActivation(updated as PrismaActivationResult) });
  } catch (error) {
    console.error("Error actualizando activación:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;

  const existing = await prisma.licenseActivation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Activación no encontrada" }, { status: 404 });
  }

  await prisma.licenseActivation.delete({ where: { id } });
  return NextResponse.json({ message: "Activación eliminada", deletedId: id });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificar guardia de stock en runtime**

Con el dev server corriendo y logueado como admin, en la consola del navegador crear una activación sobre el paquete creado en Task 4 (reemplazar los IDs con reales tomados de `GET /api/license-packages`, `GET /api/tecnicos`, `GET /api/clients`):

```bash
fetch('/api/license-activations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packageId:'<PKG_ID>',activationDate:new Date().toISOString(),technicianId:'<TEC_ID>',licenseKey:'ABC-123',support:'garantia 1 año',customerId:'<CLI_ID>'})}).then(r=>r.json()).then(console.log)
```
Expected: `{ activation: {...} }`. Y `GET /api/license-packages` ahora muestra `remainingLicenses: 9` para ese paquete.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/license-activations
git commit -m "feat(licencias): API de activaciones con guardia de stock"
```

---

### Task 6: Hooks TanStack Query

**Files:**
- Create: `src/hooks/useLicensePackages.ts`
- Create: `src/hooks/useLicenseActivations.ts`

**Interfaces:**
- Consumes: `apiFetch` (`@/lib/api`); tipos de `@/types/license`.
- Produces: hook `useLicensePackages()` → `{ packages, total, isLoading, isError, error, createPackage, updatePackage, deletePackage, isMutating, refetch }`. Hook `useLicenseActivations(filters)` → `{ activations, total, isLoading, isError, error, createActivation, updateActivation, deleteActivation, isMutating, refetch }`. `createActivation`/`deleteActivation` invalidan también `["license-packages"]`.

- [ ] **Step 1: Crear `useLicensePackages.ts`**

```typescript
// src/hooks/useLicensePackages.ts
"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  LicensePackage,
  LicensePackagesResponse,
  CreateLicensePackageData,
  UpdateLicensePackageData,
} from "@/types/license";

const packagesAPI = {
  list: async (): Promise<LicensePackagesResponse> => {
    const res = await apiFetch("/api/license-packages");
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Error obteniendo paquetes");
    }
    return res.json();
  },
  create: async (data: CreateLicensePackageData): Promise<{ package: LicensePackage }> => {
    const res = await apiFetch("/api/license-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error creando paquete");
    }
    return res.json();
  },
  update: async (id: string, data: UpdateLicensePackageData): Promise<{ package: LicensePackage }> => {
    const res = await apiFetch(`/api/license-packages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error actualizando paquete");
    }
    return res.json();
  },
  remove: async (id: string): Promise<{ message: string; deletedId: string }> => {
    const res = await apiFetch(`/api/license-packages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error eliminando paquete");
    }
    return res.json();
  },
};

export function useLicensePackages() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["license-packages"],
    queryFn: packagesAPI.list,
    staleTime: 30000,
  });

  const createPackage = useMutation({
    mutationFn: packagesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete registrado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePackage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLicensePackageData }) =>
      packagesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete actualizado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePackage = useMutation({
    mutationFn: packagesAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["license-packages"] });
      toast.success("Paquete eliminado exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const packages = useMemo(() => data?.packages ?? [], [data]);

  return {
    packages,
    total: data?.total ?? 0,
    isLoading,
    isError,
    error: error as Error | null,
    createPackage: createPackage.mutate,
    updatePackage: updatePackage.mutate,
    deletePackage: deletePackage.mutate,
    isMutating: createPackage.isPending || updatePackage.isPending || deletePackage.isPending,
    refetch,
  };
}
```

- [ ] **Step 2: Crear `useLicenseActivations.ts`**

```typescript
// src/hooks/useLicenseActivations.ts
"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type {
  LicenseActivation,
  LicenseActivationsResponse,
  LicenseActivationFilters,
  CreateLicenseActivationData,
  UpdateLicenseActivationData,
} from "@/types/license";

function buildQuery(filters: LicenseActivationFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const activationsAPI = {
  list: async (filters: LicenseActivationFilters): Promise<LicenseActivationsResponse> => {
    const res = await apiFetch(`/api/license-activations${buildQuery(filters)}`);
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error || "Error obteniendo activaciones");
    }
    return res.json();
  },
  create: async (data: CreateLicenseActivationData): Promise<{ activation: LicenseActivation }> => {
    const res = await apiFetch("/api/license-activations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error creando activación");
    }
    return res.json();
  },
  update: async (id: string, data: UpdateLicenseActivationData): Promise<{ activation: LicenseActivation }> => {
    const res = await apiFetch(`/api/license-activations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error actualizando activación");
    }
    return res.json();
  },
  remove: async (id: string): Promise<{ message: string; deletedId: string }> => {
    const res = await apiFetch(`/api/license-activations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.details || e.error || "Error eliminando activación");
    }
    return res.json();
  },
};

export function useLicenseActivations(filters: LicenseActivationFilters = {}) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["license-activations"] });
    queryClient.invalidateQueries({ queryKey: ["license-packages"] });
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["license-activations", filters],
    queryFn: () => activationsAPI.list(filters),
    staleTime: 30000,
  });

  const createActivation = useMutation({
    mutationFn: activationsAPI.create,
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación registrada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateActivation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLicenseActivationData }) =>
      activationsAPI.update(id, data),
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación actualizada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteActivation = useMutation({
    mutationFn: activationsAPI.remove,
    onSuccess: () => {
      invalidateAll();
      toast.success("Activación eliminada exitosamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activations = useMemo(() => data?.activations ?? [], [data]);

  return {
    activations,
    total: data?.total ?? 0,
    isLoading,
    isError,
    error: error as Error | null,
    createActivation: createActivation.mutate,
    updateActivation: updateActivation.mutate,
    deleteActivation: deleteActivation.mutate,
    isMutating:
      createActivation.isPending || updateActivation.isPending || deleteActivation.isPending,
    refetch,
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLicensePackages.ts src/hooks/useLicenseActivations.ts
git commit -m "feat(licencias): hooks de paquetes y activaciones"
```

---

### Task 7: Generador PDF

**Files:**
- Create: `src/lib/license-pdf-generator.ts`

**Interfaces:**
- Consumes: `logoBase64` (`@/lib/logo-base64`); tipos `ActivationExportRow`, `PackageExportRow` (Task 2).
- Produces: `generateLicenseActivationsPDF(rows: ActivationExportRow[], rangeLabel: string): ArrayBuffer` y `generateLicensePackagesPDF(rows: PackageExportRow[]): ArrayBuffer`. Consumidos por la página (Task 12).

- [ ] **Step 1: Crear el generador**

```typescript
// src/lib/license-pdf-generator.ts
import jsPDF from "jspdf";
import { logoBase64 } from "./logo-base64";
import type { ActivationExportRow, PackageExportRow } from "@/types/license";

const primaryBlue: [number, number, number] = [37, 99, 235];
const primaryGreen: [number, number, number] = [5, 150, 105];
const darkGray: [number, number, number] = [51, 65, 85];
const mediumGray: [number, number, number] = [100, 116, 139];

function addHeader(doc: jsPDF, title: string, subtitle: string, pageWidth: number) {
  const margin = 15;
  try {
    doc.addImage(logoBase64, "PNG", margin, 10, 22, 22);
  } catch {
    // Si el logo falla, continuar sin él
  }
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryBlue);
  doc.text(title, margin + 28, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mediumGray);
  doc.text("Suministro y Servicios RJD", margin + 28, 27);
  if (subtitle) {
    doc.setTextColor(...primaryGreen);
    doc.text(subtitle, margin + 28, 33);
  }

  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(margin, 38, pageWidth - margin, 38);
}

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  colWidths: number[],
  rows: string[][],
): number {
  const margin = 15;
  const rowHeight = 8;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  const drawHeaderRow = () => {
    doc.setFillColor(...primaryBlue);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let x = margin;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], rowHeight, "F");
      doc.text(h, x + 2, y + 5.5, { maxWidth: colWidths[i] - 3 });
      x += colWidths[i];
    });
    y += rowHeight;
  };

  drawHeaderRow();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rows.forEach((row, idx) => {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 20;
      drawHeaderRow();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }
    if (idx % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      let x = margin;
      colWidths.forEach((w) => {
        doc.rect(x, y, w, rowHeight, "F");
        x += w;
      });
    }
    doc.setTextColor(...darkGray);
    let x = margin;
    row.forEach((cell, i) => {
      const text = doc.splitTextToSize(cell || "-", colWidths[i] - 3)[0] ?? "-";
      doc.text(String(text), x + 2, y + 5.5);
      x += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

export function generateLicenseActivationsPDF(
  rows: ActivationExportRow[],
  rangeLabel: string,
): ArrayBuffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  addHeader(doc, "REPORTE DE LICENCIAS", rangeLabel, pageWidth);

  const headers = ["Fecha", "Técnico", "Cliente", "Clave", "Soporte", "Paquete"];
  const colWidths = [22, 30, 32, 32, 40, 24];
  const body = rows.map((r) => [
    r.activationDate,
    r.technicianName,
    r.customerName,
    r.licenseKey,
    r.support,
    r.packageCode,
  ]);

  const endY = drawTable(doc, 44, headers, colWidths, body);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkGray);
  doc.text(`Total de activaciones: ${rows.length}`, 15, endY + 8);

  return doc.output("arraybuffer");
}

export function generateLicensePackagesPDF(rows: PackageExportRow[]): ArrayBuffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  addHeader(doc, "PAQUETES DE LICENCIAS", "Estado de inventario", pageWidth);

  const headers = ["Código", "Proveedor", "Total", "Usadas", "Restantes", "Estado", "Compra"];
  const colWidths = [30, 34, 16, 16, 20, 24, 26];
  const body = rows.map((r) => [
    r.code,
    r.provider,
    String(r.totalLicenses),
    String(r.usedLicenses),
    String(r.remainingLicenses),
    r.statusLabel,
    r.purchaseDate,
  ]);

  drawTable(doc, 44, headers, colWidths, body);

  return doc.output("arraybuffer");
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores. (Verifica que `@/lib/logo-base64` exporte `logoBase64`; ya existe y lo usa `report-pdf-generator.ts`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/license-pdf-generator.ts
git commit -m "feat(licencias): generador PDF de activaciones y paquetes"
```

---

### Task 8: Formulario y tabla de paquetes

**Files:**
- Create: `src/components/licenses/LicensePackageForm.tsx`
- Create: `src/components/licenses/LicensePackagesTable.tsx`

**Interfaces:**
- Consumes: `createLicensePackageSchema`, `updateLicensePackageSchema` (Task 3); tipos de `@/types/license`.
- Produces: `LicensePackageForm` (props: `package?`, `onSubmit`, `onCancel`, `isLoading`) y `LicensePackagesTable` (props: `packages`, `onEdit`, `onDelete`). Consumidos por la página (Task 12).

- [ ] **Step 1: Crear `LicensePackageForm.tsx`** (patrón de `ClientForm`: `useState` + validación Zod en `useMemo`)

```tsx
// src/components/licenses/LicensePackageForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { Package, Calendar, Hash, Building2, FileText, X } from "lucide-react";
import {
  createLicensePackageSchema,
  updateLicensePackageSchema,
} from "@/lib/validations/license";
import type {
  LicensePackage,
  CreateLicensePackageData,
} from "@/types/license";

interface LicensePackageFormProps {
  package?: LicensePackage | null;
  onSubmit: (data: CreateLicensePackageData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function LicensePackageForm({
  package: pkg,
  onSubmit,
  onCancel,
  isLoading = false,
}: LicensePackageFormProps) {
  const isEditing = !!pkg;
  const formKey = pkg ? pkg.id : "new";

  const [formData, setFormData] = useState<CreateLicensePackageData>(() => ({
    provider: pkg?.provider ?? "",
    totalLicenses: pkg?.totalLicenses ?? 10,
    purchaseDate: pkg ? toDateInput(pkg.purchaseDate) : toDateInput(new Date().toISOString()),
    observations: pkg?.observations ?? "",
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    try {
      const schema = isEditing ? updateLicensePackageSchema : createLicensePackageSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (field && touched[field]) result[field] = err.message;
        });
      }
    }
    return result;
  }, [formData, touched, isEditing]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ provider: true, totalLicenses: true, purchaseDate: true, observations: true });
      try {
        const schema = isEditing ? updateLicensePackageSchema : createLicensePackageSchema;
        schema.parse(formData);
        onSubmit({
          ...formData,
          purchaseDate: new Date(formData.purchaseDate).toISOString(),
        });
      } catch (error) {
        console.error("Error de validación:", error);
      }
    },
    [formData, isEditing, onSubmit]
  );

  const isValid = Object.keys(errors).length === 0 && formData.totalLicenses >= 1 && !!formData.purchaseDate;

  return (
    <div key={formKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {isEditing ? "Editar Paquete" : "Nuevo Paquete"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200" disabled={isLoading}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-blue-400" /> Cantidad de licencias *
          </label>
          <input
            type="number"
            min={1}
            value={formData.totalLicenses}
            onChange={(e) => setFormData((p) => ({ ...p, totalLicenses: Number(e.target.value) }))}
            onBlur={() => handleBlur("totalLicenses")}
            className={`input-dark w-full ${errors.totalLicenses ? "border-red-500" : ""}`}
            disabled={isLoading || isEditing && (pkg?.usedLicenses ?? 0) > 0}
            required
          />
          {isEditing && (pkg?.usedLicenses ?? 0) > 0 && (
            <p className="text-slate-400 text-xs mt-1">No se puede reducir por debajo de las {pkg?.usedLicenses} ya usadas.</p>
          )}
          {errors.totalLicenses && <p className="text-red-400 text-xs mt-1">{errors.totalLicenses}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-400" /> Fecha de compra *
          </label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData((p) => ({ ...p, purchaseDate: e.target.value }))}
            onBlur={() => handleBlur("purchaseDate")}
            className={`input-dark w-full ${errors.purchaseDate ? "border-red-500" : ""}`}
            disabled={isLoading}
            required
          />
          {errors.purchaseDate && <p className="text-red-400 text-xs mt-1">{errors.purchaseDate}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-yellow-400" /> Proveedor
          </label>
          <input
            type="text"
            value={formData.provider ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, provider: e.target.value }))}
            className="input-dark w-full"
            placeholder="Ej: Distribuidor ESET"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" /> Observaciones
          </label>
          <textarea
            value={formData.observations ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, observations: e.target.value }))}
            className="input-dark w-full min-h-20"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading || !isValid}>
            {isLoading ? "Guardando..." : isEditing ? "Actualizar Paquete" : "Registrar Paquete"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Crear `LicensePackagesTable.tsx`** (badge de estado según `stockStatus`)

```tsx
// src/components/licenses/LicensePackagesTable.tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LicensePackage, PackageStockStatus } from "@/types/license";

interface LicensePackagesTableProps {
  packages: LicensePackage[];
  onEdit: (pkg: LicensePackage) => void;
  onDelete: (pkg: LicensePackage) => void;
}

const statusBadge: Record<PackageStockStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Activo", className: "text-emerald-700 bg-emerald-100" },
  LOW: { label: "Stock bajo", className: "text-amber-700 bg-amber-100" },
  DEPLETED: { label: "Agotado", className: "text-red-700 bg-red-100" },
};

export default function LicensePackagesTable({ packages, onEdit, onDelete }: LicensePackagesTableProps) {
  if (packages.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay paquetes registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-3 px-3">Código</th>
            <th className="py-3 px-3">Proveedor</th>
            <th className="py-3 px-3 text-center">Total</th>
            <th className="py-3 px-3 text-center">Usadas</th>
            <th className="py-3 px-3 text-center">Restantes</th>
            <th className="py-3 px-3">Estado</th>
            <th className="py-3 px-3">Compra</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const badge = statusBadge[pkg.stockStatus];
            return (
              <tr key={pkg.id} className="border-b border-slate-800 text-slate-200">
                <td className="py-3 px-3 font-mono text-xs">{pkg.code}</td>
                <td className="py-3 px-3">{pkg.provider || "-"}</td>
                <td className="py-3 px-3 text-center">{pkg.totalLicenses}</td>
                <td className="py-3 px-3 text-center">{pkg.usedLicenses}</td>
                <td className="py-3 px-3 text-center font-semibold">{pkg.remainingLicenses}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>{badge.label}</span>
                </td>
                <td className="py-3 px-3">{formatDate(pkg.purchaseDate)}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onEdit(pkg)} className="p-2 rounded-lg hover:bg-slate-700 text-blue-400" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(pkg)} className="p-2 rounded-lg hover:bg-slate-700 text-red-400" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/licenses/LicensePackageForm.tsx src/components/licenses/LicensePackagesTable.tsx
git commit -m "feat(licencias): formulario y tabla de paquetes"
```

---

### Task 9: Formulario, tabla y filtros de activaciones

**Files:**
- Create: `src/components/licenses/LicenseActivationForm.tsx`
- Create: `src/components/licenses/LicenseActivationsTable.tsx`
- Create: `src/components/licenses/LicenseFilters.tsx`

**Interfaces:**
- Consumes: `createLicenseActivationSchema`/`updateLicenseActivationSchema` (Task 3); tipos de `@/types/license`; `useClients` (`@/hooks/useClients`) y `useTechnicians` (`@/hooks/useTechnicians`) para poblar selects; `useLicensePackages` (Task 6) para el select de paquete.
- Produces: `LicenseActivationForm` (props: `activation?`, `packages`, `technicians`, `customers`, `onSubmit`, `onCancel`, `isLoading`), `LicenseActivationsTable` (props: `activations`, `onEdit`, `onDelete`), `LicenseFilters` (props: `filters`, `packages`, `technicians`, `customers`, `onChange`, `onReset`).

- [ ] **Step 1: Crear `LicenseActivationForm.tsx`**

Nota: `packages`, `technicians` y `customers` se pasan como props (listas ya cargadas). El paquete por defecto es el primero con `remainingLicenses > 0`.

```tsx
// src/components/licenses/LicenseActivationForm.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { KeyRound, Calendar, User, Users, Package, LifeBuoy, FileText, X } from "lucide-react";
import {
  createLicenseActivationSchema,
  updateLicenseActivationSchema,
} from "@/lib/validations/license";
import type {
  LicenseActivation,
  LicensePackage,
  CreateLicenseActivationData,
} from "@/types/license";

interface Option {
  id: string;
  name: string;
}

interface LicenseActivationFormProps {
  activation?: LicenseActivation | null;
  packages: LicensePackage[];
  technicians: Option[];
  customers: Option[];
  onSubmit: (data: CreateLicenseActivationData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDateInput(iso: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function LicenseActivationForm({
  activation,
  packages,
  technicians,
  customers,
  onSubmit,
  onCancel,
  isLoading = false,
}: LicenseActivationFormProps) {
  const isEditing = !!activation;
  const formKey = activation ? activation.id : "new";

  const defaultPackageId = useMemo(() => {
    if (activation) return activation.packageId;
    const withStock = packages.find((p) => p.remainingLicenses > 0);
    return withStock?.id ?? "";
  }, [activation, packages]);

  const [formData, setFormData] = useState<CreateLicenseActivationData>(() => ({
    packageId: defaultPackageId,
    activationDate: activation ? toDateInput(activation.activationDate) : toDateInput(new Date().toISOString()),
    technicianId: activation?.technicianId ?? "",
    licenseKey: activation?.licenseKey ?? "",
    support: activation?.support ?? "",
    customerId: activation?.customerId ?? "",
    observations: activation?.observations ?? "",
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    try {
      const schema = isEditing ? updateLicenseActivationSchema : createLicenseActivationSchema;
      schema.parse(formData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (field && touched[field]) result[field] = err.message;
        });
      }
    }
    return result;
  }, [formData, touched, isEditing]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({
        packageId: true, activationDate: true, technicianId: true,
        licenseKey: true, support: true, customerId: true,
      });
      try {
        const schema = isEditing ? updateLicenseActivationSchema : createLicenseActivationSchema;
        schema.parse(formData);
        onSubmit({ ...formData, activationDate: new Date(formData.activationDate).toISOString() });
      } catch (error) {
        console.error("Error de validación:", error);
      }
    },
    [formData, isEditing, onSubmit]
  );

  const isValid =
    Object.keys(errors).length === 0 &&
    formData.packageId && formData.technicianId && formData.customerId &&
    formData.licenseKey.trim() && formData.support.trim();

  return (
    <div key={formKey} className="card-dark-strong p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-100">
          {isEditing ? "Editar Activación" : "Nueva Activación"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200" disabled={isLoading}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-400" /> Paquete *
          </label>
          <select
            value={formData.packageId}
            onChange={(e) => setFormData((p) => ({ ...p, packageId: e.target.value }))}
            onBlur={() => handleBlur("packageId")}
            className={`input-dark w-full ${errors.packageId ? "border-red-500" : ""}`}
            disabled={isLoading}
            required
          >
            <option value="">Seleccionar paquete</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id} disabled={p.remainingLicenses <= 0 && p.id !== formData.packageId}>
                {p.code} — quedan {p.remainingLicenses}
              </option>
            ))}
          </select>
          {errors.packageId && <p className="text-red-400 text-xs mt-1">{errors.packageId}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" /> Fecha *
            </label>
            <input
              type="date"
              value={formData.activationDate}
              onChange={(e) => setFormData((p) => ({ ...p, activationDate: e.target.value }))}
              onBlur={() => handleBlur("activationDate")}
              className={`input-dark w-full ${errors.activationDate ? "border-red-500" : ""}`}
              disabled={isLoading}
              required
            />
            {errors.activationDate && <p className="text-red-400 text-xs mt-1">{errors.activationDate}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-yellow-400" /> Técnico (quién activó) *
            </label>
            <select
              value={formData.technicianId}
              onChange={(e) => setFormData((p) => ({ ...p, technicianId: e.target.value }))}
              onBlur={() => handleBlur("technicianId")}
              className={`input-dark w-full ${errors.technicianId ? "border-red-500" : ""}`}
              disabled={isLoading}
              required
            >
              <option value="">Seleccionar técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.technicianId && <p className="text-red-400 text-xs mt-1">{errors.technicianId}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" /> Cliente *
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => setFormData((p) => ({ ...p, customerId: e.target.value }))}
            onBlur={() => handleBlur("customerId")}
            className={`input-dark w-full ${errors.customerId ? "border-red-500" : ""}`}
            disabled={isLoading}
            required
          >
            <option value="">Seleccionar cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-green-400" /> Clave de licencia *
          </label>
          <input
            type="text"
            value={formData.licenseKey}
            onChange={(e) => setFormData((p) => ({ ...p, licenseKey: e.target.value }))}
            onBlur={() => handleBlur("licenseKey")}
            className={`input-dark w-full ${errors.licenseKey ? "border-red-500" : ""}`}
            placeholder="Clave / serial del antivirus"
            disabled={isLoading}
            required
          />
          {errors.licenseKey && <p className="text-red-400 text-xs mt-1">{errors.licenseKey}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <LifeBuoy className="w-4 h-4 text-yellow-400" /> Soporte / garantía *
          </label>
          <textarea
            value={formData.support}
            onChange={(e) => setFormData((p) => ({ ...p, support: e.target.value }))}
            onBlur={() => handleBlur("support")}
            className={`input-dark w-full min-h-20 ${errors.support ? "border-red-500" : ""}`}
            placeholder="Datos de soporte para garantía"
            disabled={isLoading}
            required
          />
          {errors.support && <p className="text-red-400 text-xs mt-1">{errors.support}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-400" /> Observaciones
          </label>
          <textarea
            value={formData.observations ?? ""}
            onChange={(e) => setFormData((p) => ({ ...p, observations: e.target.value }))}
            className="input-dark w-full min-h-16"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary-dark flex-1 py-3 px-4 rounded-xl disabled:opacity-50" disabled={isLoading || !isValid}>
            {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Registrar Activación"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Crear `LicenseActivationsTable.tsx`**

```tsx
// src/components/licenses/LicenseActivationsTable.tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LicenseActivation } from "@/types/license";

interface LicenseActivationsTableProps {
  activations: LicenseActivation[];
  onEdit: (activation: LicenseActivation) => void;
  onDelete: (activation: LicenseActivation) => void;
}

export default function LicenseActivationsTable({ activations, onEdit, onDelete }: LicenseActivationsTableProps) {
  if (activations.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay activaciones registradas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-3 px-3">Fecha</th>
            <th className="py-3 px-3">Técnico</th>
            <th className="py-3 px-3">Cliente</th>
            <th className="py-3 px-3">Clave</th>
            <th className="py-3 px-3">Soporte</th>
            <th className="py-3 px-3">Paquete</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {activations.map((a) => (
            <tr key={a.id} className="border-b border-slate-800 text-slate-200">
              <td className="py-3 px-3 whitespace-nowrap">{formatDate(a.activationDate)}</td>
              <td className="py-3 px-3">{a.technician.name}</td>
              <td className="py-3 px-3">{a.customer.name}</td>
              <td className="py-3 px-3 font-mono text-xs">{a.licenseKey}</td>
              <td className="py-3 px-3 max-w-52 truncate" title={a.support}>{a.support}</td>
              <td className="py-3 px-3 font-mono text-xs">{a.package.code}</td>
              <td className="py-3 px-3">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(a)} className="p-2 rounded-lg hover:bg-slate-700 text-blue-400" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(a)} className="p-2 rounded-lg hover:bg-slate-700 text-red-400" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Crear `LicenseFilters.tsx`** (rango de fechas con `<input type="date">` + selects; simple y consistente)

```tsx
// src/components/licenses/LicenseFilters.tsx
"use client";

import { Filter, X } from "lucide-react";
import type { LicenseActivationFilters, LicensePackage } from "@/types/license";

interface Option {
  id: string;
  name: string;
}

interface LicenseFiltersProps {
  filters: LicenseActivationFilters;
  packages: LicensePackage[];
  technicians: Option[];
  customers: Option[];
  onChange: (filters: LicenseActivationFilters) => void;
  onReset: () => void;
}

export default function LicenseFilters({
  filters,
  packages,
  technicians,
  customers,
  onChange,
  onReset,
}: LicenseFiltersProps) {
  const update = (patch: Partial<LicenseActivationFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="card-dark-strong p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <Filter className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Desde</label>
          <input type="date" value={filters.from ? filters.from.slice(0, 10) : ""}
            onChange={(e) => update({ from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            className="input-dark w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Hasta</label>
          <input type="date" value={filters.to ? filters.to.slice(0, 10) : ""}
            onChange={(e) => {
              if (!e.target.value) return update({ to: undefined });
              const d = new Date(e.target.value); d.setHours(23, 59, 59, 999);
              update({ to: d.toISOString() });
            }}
            className="input-dark w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Técnico</label>
          <select value={filters.technicianId ?? ""} onChange={(e) => update({ technicianId: e.target.value || undefined })} className="input-dark w-full">
            <option value="">Todos</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cliente</label>
          <select value={filters.customerId ?? ""} onChange={(e) => update({ customerId: e.target.value || undefined })} className="input-dark w-full">
            <option value="">Todos</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Paquete</label>
          <select value={filters.packageId ?? ""} onChange={(e) => update({ packageId: e.target.value || undefined })} className="input-dark w-full">
            <option value="">Todos</option>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button onClick={onReset} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-700">
          <X className="w-4 h-4" /> Limpiar filtros
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/licenses/LicenseActivationForm.tsx src/components/licenses/LicenseActivationsTable.tsx src/components/licenses/LicenseFilters.tsx
git commit -m "feat(licencias): formulario, tabla y filtros de activaciones"
```

---

### Task 10: Página con pestañas, modales y exportación

**Files:**
- Create: `src/app/dashboard/licencias/page.tsx`

**Interfaces:**
- Consumes: `useLicensePackages`, `useLicenseActivations` (Task 6); `useClients`, `useTechnicians`; componentes de licencias (Tasks 8-9); `generateLicenseActivationsPDF`, `generateLicensePackagesPDF` (Task 7); `ConfirmModal` (`@/components/clients/ConfirmModal`); `formatDate` (`@/lib/utils`); `ExcelJS`.
- Produces: la ruta `/dashboard/licencias`.

- [ ] **Step 1: Interfaces confirmadas (referencia)**

Ya verificado contra el código actual — no hay que cambiar nada aquí, solo tenerlo presente al escribir el Step 2:
- `useClients()` devuelve `{ clients, ... }` (`src/hooks/useClients.ts:188`).
- `useTechnicians()` devuelve `{ technicians, ... }`.
- `ConfirmModal` (`src/components/clients/ConfirmModal.tsx`) recibe props: `isOpen: boolean`, `title: string`, `message: string`, `onConfirm: () => void`, `onCancel: () => void` (y `isLoading?` opcional).

- [ ] **Step 2: Crear `page.tsx`**

```tsx
// src/app/dashboard/licencias/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Plus, FileDown, FileSpreadsheet, KeyRound } from "lucide-react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { useLicensePackages } from "@/hooks/useLicensePackages";
import { useLicenseActivations } from "@/hooks/useLicenseActivations";
import { useClients } from "@/hooks/useClients";
import { useTechnicians } from "@/hooks/useTechnicians";
import LicensePackageForm from "@/components/licenses/LicensePackageForm";
import LicensePackagesTable from "@/components/licenses/LicensePackagesTable";
import LicenseActivationForm from "@/components/licenses/LicenseActivationForm";
import LicenseActivationsTable from "@/components/licenses/LicenseActivationsTable";
import LicenseFilters from "@/components/licenses/LicenseFilters";
import ConfirmModal from "@/components/clients/ConfirmModal";
import { formatDate } from "@/lib/utils";
import {
  generateLicenseActivationsPDF,
  generateLicensePackagesPDF,
} from "@/lib/license-pdf-generator";
import type {
  LicensePackage,
  LicenseActivation,
  LicenseActivationFilters,
  PackageStockStatus,
} from "@/types/license";

type Tab = "activations" | "packages";

const statusLabel: Record<PackageStockStatus, string> = {
  ACTIVE: "Activo",
  LOW: "Stock bajo",
  DEPLETED: "Agotado",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LicenciasPage() {
  const [tab, setTab] = useState<Tab>("activations");
  const [filters, setFilters] = useState<LicenseActivationFilters>({});

  const { packages, isLoading: loadingPackages, createPackage, updatePackage, deletePackage, isMutating: mutatingPackages } = useLicensePackages();
  const { activations, isLoading: loadingActivations, createActivation, updateActivation, deleteActivation, isMutating: mutatingActivations } = useLicenseActivations(filters);
  const { clients } = useClients();
  const { technicians } = useTechnicians();

  const customerOptions = useMemo(() => (clients ?? []).map((c) => ({ id: c.id, name: c.name })), [clients]);
  const technicianOptions = useMemo(() => (technicians ?? []).map((t) => ({ id: t.id, name: t.name })), [technicians]);

  // Modales de formulario
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<LicensePackage | null>(null);
  const [activationFormOpen, setActivationFormOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<LicenseActivation | null>(null);

  // Confirmaciones de borrado
  const [packageToDelete, setPackageToDelete] = useState<LicensePackage | null>(null);
  const [activationToDelete, setActivationToDelete] = useState<LicenseActivation | null>(null);

  const rangeLabel = useMemo(() => {
    const from = filters.from ? formatDate(filters.from) : null;
    const to = filters.to ? formatDate(filters.to) : null;
    if (from && to) return `Del ${from} al ${to}`;
    if (from) return `Desde ${from}`;
    if (to) return `Hasta ${to}`;
    return "Todas las activaciones";
  }, [filters]);

  // ====== EXPORTACIÓN ACTIVACIONES ======
  const exportActivationsExcel = async () => {
    if (activations.length === 0) return toast.error("No hay activaciones para exportar");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Activaciones");
    ws.columns = [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Técnico", key: "tecnico", width: 24 },
      { header: "Cliente", key: "cliente", width: 24 },
      { header: "Clave", key: "clave", width: 28 },
      { header: "Soporte", key: "soporte", width: 34 },
      { header: "Paquete", key: "paquete", width: 18 },
      { header: "Observaciones", key: "obs", width: 30 },
    ];
    activations.forEach((a) =>
      ws.addRow({
        fecha: formatDate(a.activationDate),
        tecnico: a.technician.name,
        cliente: a.customer.name,
        clave: a.licenseKey,
        soporte: a.support,
        paquete: a.package.code,
        obs: a.observations ?? "",
      })
    );
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "activaciones-licencias.xlsx");
  };

  const exportActivationsPDF = () => {
    if (activations.length === 0) return toast.error("No hay activaciones para exportar");
    const rows = activations.map((a) => ({
      activationDate: formatDate(a.activationDate),
      technicianName: a.technician.name,
      customerName: a.customer.name,
      licenseKey: a.licenseKey,
      support: a.support,
      packageCode: a.package.code,
      observations: a.observations ?? "",
    }));
    const buffer = generateLicenseActivationsPDF(rows, rangeLabel);
    downloadBlob(new Blob([buffer], { type: "application/pdf" }), "activaciones-licencias.pdf");
  };

  // ====== EXPORTACIÓN PAQUETES ======
  const exportPackagesExcel = async () => {
    if (packages.length === 0) return toast.error("No hay paquetes para exportar");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Paquetes");
    ws.columns = [
      { header: "Código", key: "codigo", width: 20 },
      { header: "Proveedor", key: "proveedor", width: 24 },
      { header: "Total", key: "total", width: 10 },
      { header: "Usadas", key: "usadas", width: 10 },
      { header: "Restantes", key: "restantes", width: 12 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Compra", key: "compra", width: 14 },
    ];
    packages.forEach((p) =>
      ws.addRow({
        codigo: p.code,
        proveedor: p.provider ?? "",
        total: p.totalLicenses,
        usadas: p.usedLicenses,
        restantes: p.remainingLicenses,
        estado: statusLabel[p.stockStatus],
        compra: formatDate(p.purchaseDate),
      })
    );
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "paquetes-licencias.xlsx");
  };

  const exportPackagesPDF = () => {
    if (packages.length === 0) return toast.error("No hay paquetes para exportar");
    const rows = packages.map((p) => ({
      code: p.code,
      provider: p.provider ?? "-",
      totalLicenses: p.totalLicenses,
      usedLicenses: p.usedLicenses,
      remainingLicenses: p.remainingLicenses,
      statusLabel: statusLabel[p.stockStatus],
      purchaseDate: formatDate(p.purchaseDate),
    }));
    const buffer = generateLicensePackagesPDF(rows);
    downloadBlob(new Blob([buffer], { type: "application/pdf" }), "paquetes-licencias.pdf");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <KeyRound className="w-7 h-7 text-blue-400" />
        <h1 className="text-2xl font-bold text-slate-100">Licencias de Antivirus</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button onClick={() => setTab("activations")} className={`px-4 py-2 font-medium ${tab === "activations" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
          Activaciones
        </button>
        <button onClick={() => setTab("packages")} className={`px-4 py-2 font-medium ${tab === "packages" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}>
          Paquetes
        </button>
      </div>

      {tab === "activations" && (
        <div className="space-y-4">
          <LicenseFilters
            filters={filters}
            packages={packages}
            technicians={technicianOptions}
            customers={customerOptions}
            onChange={setFilters}
            onReset={() => setFilters({})}
          />
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button onClick={() => { setEditingActivation(null); setActivationFormOpen(true); }} className="btn-primary-dark flex items-center gap-2 px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Nueva activación
            </button>
            <div className="flex gap-2">
              <button onClick={exportActivationsExcel} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportActivationsPDF} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileDown className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
          <div className="card-dark-strong p-4">
            {loadingActivations ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : (
              <LicenseActivationsTable
                activations={activations}
                onEdit={(a) => { setEditingActivation(a); setActivationFormOpen(true); }}
                onDelete={(a) => setActivationToDelete(a)}
              />
            )}
          </div>
        </div>
      )}

      {tab === "packages" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button onClick={() => { setEditingPackage(null); setPackageFormOpen(true); }} className="btn-primary-dark flex items-center gap-2 px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Nuevo paquete
            </button>
            <div className="flex gap-2">
              <button onClick={exportPackagesExcel} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportPackagesPDF} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded-xl">
                <FileDown className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
          <div className="card-dark-strong p-4">
            {loadingPackages ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : (
              <LicensePackagesTable
                packages={packages}
                onEdit={(p) => { setEditingPackage(p); setPackageFormOpen(true); }}
                onDelete={(p) => setPackageToDelete(p)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal formulario paquete */}
      {packageFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <LicensePackageForm
            package={editingPackage}
            isLoading={mutatingPackages}
            onCancel={() => setPackageFormOpen(false)}
            onSubmit={(data) => {
              if (editingPackage) updatePackage({ id: editingPackage.id, data });
              else createPackage(data);
              setPackageFormOpen(false);
            }}
          />
        </div>
      )}

      {/* Modal formulario activación */}
      {activationFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <LicenseActivationForm
            activation={editingActivation}
            packages={packages}
            technicians={technicianOptions}
            customers={customerOptions}
            isLoading={mutatingActivations}
            onCancel={() => setActivationFormOpen(false)}
            onSubmit={(data) => {
              if (editingActivation) updateActivation({ id: editingActivation.id, data });
              else createActivation(data);
              setActivationFormOpen(false);
            }}
          />
        </div>
      )}

      {/* Confirmaciones */}
      <ConfirmModal
        isOpen={!!packageToDelete}
        title="Eliminar paquete"
        message={`¿Eliminar el paquete ${packageToDelete?.code}? Esta acción no se puede deshacer.`}
        onConfirm={() => { if (packageToDelete) deletePackage(packageToDelete.id); setPackageToDelete(null); }}
        onCancel={() => setPackageToDelete(null)}
      />
      <ConfirmModal
        isOpen={!!activationToDelete}
        title="Eliminar activación"
        message={`¿Eliminar la activación de la clave ${activationToDelete?.licenseKey}? Esto devuelve una licencia al paquete.`}
        onConfirm={() => { if (activationToDelete) deleteActivation(activationToDelete.id); setActivationToDelete(null); }}
        onCancel={() => setActivationToDelete(null)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores. Si `useClients` no expone `clients` o `ConfirmModal` tiene props distintas (confirmadas en Step 1), corregir aquí.

- [ ] **Step 4: Verificación en runtime**

Con `npm run dev` y logueado como admin, navegar a `/dashboard/licencias`. Verificar: crear un paquete, crear una activación (el select de paquete muestra "quedan N"), que la tabla de paquetes refleje la resta, exportar Excel y PDF de ambas pestañas, y que los filtros de fecha/técnico/cliente/paquete filtren la lista.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/licencias/page.tsx
git commit -m "feat(licencias): pagina con pestañas, modales y exportacion"
```

---

### Task 11: Ítem de navegación en el Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: la ruta `/dashboard/licencias` (Task 10).
- Produces: enlace visible en el menú del dashboard (solo-admin por naturaleza del dashboard).

- [ ] **Step 1: Importar el icono**

En `src/components/layout/Sidebar.tsx`, en el import de `lucide-react` (líneas 6-15), agregar `KeyRound` a la lista de iconos importados.

```tsx
import {
  Home,
  Laptop,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  X,
  Wrench,
  KeyRound,
} from "lucide-react";
```

- [ ] **Step 2: Agregar el ítem al menú**

En el array `menuItems`, después del objeto de "Técnicos" y antes de "Reportes", agregar:

```tsx
  {
    name: "Licencias",
    href: "/dashboard/licencias",
    icon: KeyRound,
  },
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(licencias): item de navegacion en el sidebar"
```

---

### Task 12: Verificación final (build)

**Files:** ninguno (verificación integral).

- [ ] **Step 1: Build de producción**

Run: `npm run build`
Expected: build exitoso, incluyendo la ruta `/dashboard/licencias` y las rutas API `/api/license-packages` y `/api/license-activations` en el listado de rutas.

- [ ] **Step 2: Lint completo**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 3: Prueba de humo end-to-end (dev server)**

Con `npm run dev`, logueado como admin:
1. Crear paquete de 3 licencias.
2. Registrar 3 activaciones → el paquete pasa a "Stock bajo" (≤2) y luego "Agotado" (0).
3. Intentar una 4.ª activación sobre ese paquete → el select lo muestra deshabilitado y la API rechaza (400) si se fuerza.
4. Exportar Excel y PDF de activaciones y de paquetes.
5. Eliminar una activación → el paquete recupera una licencia (restantes sube).
6. Intentar eliminar un paquete con activaciones → bloqueado con mensaje.

- [ ] **Step 4: Commit final (si hubo ajustes) y merge**

```bash
git add -A
git commit -m "chore(licencias): verificacion final del modulo" || echo "sin cambios"
```

Dejar la rama `feat/licencias-antivirus` lista para revisión / merge a `main`.

---

## Self-Review

**Cobertura del spec:**
- Modelo de datos (paquetes + activaciones, clave al activar, cliente enlazado) → Task 1, 2.
- Validación Zod + umbral de stock → Task 3.
- API con guardia de stock y acceso solo-admin → Task 4, 5.
- Hooks TanStack Query con invalidación cruzada → Task 6.
- Reglas de negocio (descuento, guardia, borrado protegido de paquete, aviso de stock) → Task 4 (DELETE), 5 (POST guard), 3 (getStockStatus), 8 (badge).
- UI dos pestañas + filtros + formularios → Task 8, 9, 10.
- Exportación Excel + PDF (activaciones y paquetes) → Task 7, 10.
- Navegación → Task 11.
- Verificación → cada task + Task 12.

**Nota sobre TDD:** el repo no tiene framework de tests ni tests en ningún módulo; el plan sustituye el ciclo TDD por verificación con typecheck/lint/build y pruebas en runtime, coherente con el patrón establecido del proyecto (documentado en Global Constraints).

**Consistencia de tipos:** los nombres de función y tipos usados entre tareas coinciden (`getStockStatus`, `toLicensePackage`, `toActivation`, `generateLicenseActivationsPDF`, `generateLicensePackagesPDF`, `useLicensePackages`, `useLicenseActivations`, campos de `LicensePackage`/`LicenseActivation`).
