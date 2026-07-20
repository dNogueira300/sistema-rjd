# Módulo de Control de Activación de Licencias de Antivirus — Diseño

- **Fecha:** 2026-07-20
- **Estado:** Aprobado (pendiente de revisión final del usuario)
- **Autor:** Daniel Nogueira (con Claude Code)

## 1. Objetivo

Agregar al Sistema RJD un módulo para controlar la activación de licencias de
antivirus. El negocio compra **paquetes de licencias** (por ejemplo, un paquete
de 10). Cada vez que un técnico activa una licencia para un cliente, se registra
la activación y se descuenta del paquete. El sistema debe avisar cuándo un
paquete se está agotando para saber cuándo comprar otro.

Cada activación registra: **fecha**, **usuario** (el técnico que hizo la
activación), **clave** (la licencia del antivirus), **soporte** (datos de
soporte para garantía) y **cliente**.

## 2. Decisiones tomadas (brainstorming)

1. **Origen de las claves:** la clave se escribe al momento de activar. El
   paquete solo guarda un total; el sistema descuenta y avisa cuando queda poco.
   (No se precargan las 10 claves al registrar el paquete.)
2. **Cliente:** se enlaza a la tabla `Customer` existente (con opción de crear
   uno nuevo desde el formulario), para tener historial de licencias por cliente.
3. **Acceso:** solo `ADMINISTRADOR`. Los técnicos NO acceden a este módulo. El
   técnico responsable de cada activación se elige de una lista al registrar.
4. **Producto/marca:** no se maneja campo de marca; siempre es el mismo antivirus.
5. **Exportación:** se incluye desde el inicio (Excel + PDF), dentro del propio
   módulo de Licencias (mismo patrón que Clientes/Técnicos, sin tocar el
   dashboard de Reportes).

## 3. Modelo de datos (Prisma)

Dos entidades nuevas en `prisma/schema.prisma`, siguiendo el estilo actual
(cuid, `@@map`, índices, timestamps).

### 3.1 `LicensePackage` (paquete)

| Campo           | Tipo       | Notas                                              |
|-----------------|------------|----------------------------------------------------|
| `id`            | String     | `@id @default(cuid())`                             |
| `code`          | String     | `@unique` — auto `LIC-YYYYMMDD-NNNN`               |
| `provider`      | String?    | Proveedor / dónde se compró (opcional)             |
| `totalLicenses` | Int        | Total del paquete (ej. 10)                         |
| `purchaseDate`  | DateTime   | `@default(now())` — fecha de compra                |
| `observations`  | String?    | Opcional                                           |
| `createdBy`     | String     | User ID (admin) que registró el paquete            |
| `createdAt`     | DateTime   | `@default(now())`                                  |
| `updatedAt`     | DateTime   | `@updatedAt`                                       |
| `activations`   | LicenseActivation[] | Relación inversa                          |

Índices: `@@index([purchaseDate(sort: Desc)])`, `@@index([code])`.
Mapea a la tabla `license_packages`.

**Cálculo de usadas/restantes:** se calcula por consulta
(`totalLicenses - _count(activations)`). **No** se guarda un contador
denormalizado, para evitar desincronización. La API devuelve `usedLicenses` y
`remainingLicenses` calculados.

### 3.2 `LicenseActivation` (activación)

| Campo            | Tipo      | Notas                                                  |
|------------------|-----------|--------------------------------------------------------|
| `id`             | String    | `@id @default(cuid())`                                 |
| `packageId`      | String    | FK → `LicensePackage`                                  |
| `package`        | LicensePackage | `@relation(fields: [packageId], references: [id])` |
| `activationDate` | DateTime  | `@default(now())` — **fecha**                          |
| `technicianId`   | String    | FK → `User` — **usuario** (el técnico que activó)      |
| `technician`     | User      | `@relation(...)`                                       |
| `licenseKey`     | String    | **clave** de la licencia                               |
| `support`        | String    | **soporte** — datos de garantía (texto)                |
| `customerId`     | String    | FK → `Customer` — **cliente**                          |
| `customer`       | Customer  | `@relation(...)`                                       |
| `observations`   | String?   | Opcional                                               |
| `createdBy`      | String    | User ID (admin) que registró                           |
| `createdAt`      | DateTime  | `@default(now())`                                      |
| `updatedAt`      | DateTime  | `@updatedAt`                                           |

Índices: `@@index([activationDate(sort: Desc)])`, `@@index([packageId])`,
`@@index([technicianId])`, `@@index([customerId])`.
Mapea a la tabla `license_activations`.

### 3.3 Relaciones inversas

- En `User`: agregar `licenseActivations LicenseActivation[]`.
- En `Customer`: agregar `licenseActivations LicenseActivation[]`.

### 3.4 Migración

Crear migración con `npx prisma migrate dev` (nombre sugerido:
`add_license_module`) y regenerar el cliente con `npx prisma generate`.

## 4. Reglas de negocio

1. **Descuento y guardia de stock:** al crear una activación, la API verifica
   que el paquete tenga licencias disponibles (`remainingLicenses > 0`). Si el
   paquete está agotado, rechaza con error 400 y mensaje claro.
2. **Paquete por defecto en el formulario:** el formulario de nueva activación
   preselecciona el paquete activo más reciente con `remainingLicenses > 0`.
3. **Aviso de stock bajo:** umbral configurable por constante
   (`LICENSE_LOW_STOCK_THRESHOLD = 2`). Un paquete con `remainingLicenses <=`
   umbral (pero > 0) muestra indicador de "stock bajo"; con `remainingLicenses
   === 0` se marca como "Agotado". Esto orienta cuándo comprar otro paquete.
4. **Eliminar paquete:** solo se permite si no tiene activaciones asociadas
   (para no perder historial). Si las tiene, se bloquea con mensaje.
5. **Auditoría mínima:** `createdBy` guarda el admin que registró (paquete o
   activación), tomado de la sesión NextAuth.

## 5. Validación (Zod)

Nuevo archivo `src/lib/validations/license.ts`:

- `licensePackageSchema`: `provider` (opcional), `totalLicenses` (int, ≥ 1),
  `purchaseDate` (fecha), `observations` (opcional).
- `licenseActivationSchema`: `packageId` (requerido), `activationDate` (fecha),
  `technicianId` (requerido), `licenseKey` (requerido, no vacío), `support`
  (requerido, no vacío), `customerId` (requerido), `observations` (opcional).

## 6. API (App Router, RESTful)

Siguiendo el estilo plano de los módulos actuales (`payments`, `expenses`).
Todos los endpoints verifican sesión y rol `ADMINISTRADOR` (vía helper de
`src/lib/auth.ts`), devolviendo 401/403 si corresponde.

### 6.1 `src/app/api/license-packages/`

- `route.ts`
  - `GET`: lista paquetes con `usedLicenses`/`remainingLicenses`/`status`
    calculados. Soporta filtros opcionales por query (estado, rango de fechas).
  - `POST`: crea paquete (valida con `licensePackageSchema`, genera `code`
    `LIC-YYYYMMDD-NNNN`, setea `createdBy`).
- `[id]/route.ts`
  - `GET`: detalle de un paquete con sus activaciones y conteos.
  - `PUT`: actualiza campos editables del paquete.
  - `DELETE`: elimina solo si no tiene activaciones (regla 4.4).

### 6.2 `src/app/api/license-activations/`

- `route.ts`
  - `GET`: lista activaciones con `technician`, `customer` y `package`
    incluidos. Soporta filtros por query: `from`/`to` (rango de fechas),
    `technicianId`, `customerId`, `packageId`.
  - `POST`: crea activación (valida, aplica guardia de stock regla 4.1,
    setea `createdBy`).
- `[id]/route.ts`
  - `GET`, `PUT`, `DELETE` de una activación.

### 6.3 Generación de `code`

Reutilizar el enfoque existente de códigos `RJD-YYYYMMDD-NNNN` (equipos),
adaptado al prefijo `LIC-`: el `NNNN` es correlativo del día.

## 7. Hooks (TanStack Query)

- `src/hooks/useLicensePackages.ts`: query de lista/detalle + mutaciones
  (crear, actualizar, eliminar) con updates optimistas e invalidación, igual
  que los hooks existentes.
- `src/hooks/useLicenseActivations.ts`: query de lista (con filtros) + detalle
  + mutaciones. Al crear/eliminar una activación, invalida también la query de
  paquetes (porque cambian las restantes).

## 8. UI

### 8.1 Página `src/app/dashboard/licencias/page.tsx`

Página con **dos vistas por tabs**:

- **Activaciones** (vista principal):
  - Barra de **filtros**: rango de fechas (react-daypicker, igual que los
    reportes recientes), técnico, cliente y paquete.
  - Botón **"Nueva activación"** → diálogo con formulario.
  - Tabla de activaciones: fecha, técnico, cliente, clave, soporte, paquete
    (código), observaciones, acciones (ver/editar/eliminar).
  - Botones **Exportar Excel** y **Exportar PDF** (sobre la lista filtrada).
- **Paquetes**:
  - Botón **"Nuevo paquete"** → diálogo con formulario.
  - Tabla/tarjetas de paquetes: código, proveedor, total, usadas, restantes,
    estado (Activo / Stock bajo / Agotado), fecha de compra, acciones.
  - Indicador visual de stock bajo / agotado (regla 4.3).
  - Botones **Exportar Excel** y **Exportar PDF** del estado de paquetes.

### 8.2 Componentes `src/components/licenses/`

- `LicenseActivationForm.tsx` (dentro de diálogo): selects de paquete, técnico
  y cliente (con opción de crear cliente nuevo), campos clave/soporte/fecha.
- `LicenseActivationsTable.tsx`
- `LicensePackageForm.tsx` (dentro de diálogo)
- `LicensePackagesTable.tsx`
- `LicenseFilters.tsx` (rango de fechas + selects)

Se reutilizan primitivos existentes de `src/components/ui/` (Radix), Sonner
para toasts y React Hook Form para formularios.

### 8.3 Navegación

Agregar ítem **"Licencias"** al `src/components/layout/Sidebar.tsx`
(icono `ShieldCheck` o `KeyRound` de lucide-react), apuntando a
`/dashboard/licencias`. El sidebar del dashboard ya es solo-admin (los técnicos
navegan a `/equipos`), por lo que no requiere cambios de middleware.

## 9. Exportación PDF / Excel

Sigue el patrón existente:

- **Excel:** generado en el cliente con **ExcelJS**, inline en la página
  `licencias` (como en `clientes/page.tsx` y `tecnicos/page.tsx`):
  `workbook.xlsx.writeBuffer()` → `Blob` → descarga.
  - Activaciones: columnas fecha, técnico, cliente, clave, soporte, paquete
    (código), observaciones.
  - Paquetes: código, proveedor, total, usadas, restantes, estado, fecha de
    compra.
- **PDF:** nuevo generador `src/lib/license-pdf-generator.ts` con **jsPDF**,
  reutilizando el encabezado/estilo de `report-pdf-generator.ts` (logo,
  colores azul/verde). Dos funciones:
  - `generateLicenseActivationsPDF(data)`: título, rango de filtros aplicados,
    tabla de activaciones y resumen (total de activaciones en el periodo).
  - `generateLicensePackagesPDF(data)`: estado de paquetes.
- **Tipos:** agregar en `src/types/` (por ejemplo `src/types/licenses.ts`) los
  tipos de datos que consumen los exportadores y la UI.

## 10. Alcance

### Incluido
- Modelo de datos (2 entidades + relaciones + migración).
- API REST (paquetes y activaciones) con guardia de stock y control de acceso.
- Hooks TanStack Query.
- UI con dos vistas (Activaciones / Paquetes), filtros y formularios.
- Exportación Excel + PDF de activaciones y de paquetes.
- Ítem de navegación en el sidebar.

### Fuera de alcance (YAGNI)
- Precarga de claves al registrar el paquete (se descartó en brainstorming).
- Renovaciones / vencimientos de licencia por cliente.
- Integración en el dashboard de Reportes (la exportación vive en el módulo).
- Cambios de middleware para dar acceso a técnicos.
- Notificaciones automáticas (email/push) de stock bajo; el aviso es visual.

## 11. Convenciones a respetar

- UI en español, locale peruano (teléfono 9 dígitos, RUC 11 dígitos donde aplique).
- Timezone `America/Lima`.
- Alias `@/*` → `./src/*`.
- Updates optimistas con TanStack Query; toasts con Sonner; validación con Zod.
