-- 1. Crear ENUMs de Usuarios y Equipos (Si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'TECNICO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EquipmentType') THEN
        CREATE TYPE "EquipmentType" AS ENUM ('PC', 'LAPTOP', 'PRINTER', 'PLOTTER', 'OTHER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EquipmentStatus') THEN
        CREATE TYPE "EquipmentStatus" AS ENUM ('RECEIVED', 'REPAIR', 'REPAIRED', 'DELIVERED', 'CANCELLED');
    END IF;
END$$;

-- 2. Crear tabla Users (Si no existe, necesaria para Equipments)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TECNICO',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Crear índice único para email si no existe
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 3. Crear tabla Customers (Si no existe, necesaria para Equipments)
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ruc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- 4. Crear tabla Equipments (La que estaba fallando)
-- Incluimos aquí directamente la columna "others"
CREATE TABLE IF NOT EXISTS "equipments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "reportedFlaw" TEXT NOT NULL,
    "accessories" TEXT,
    "serviceType" TEXT,
    "others" TEXT,  -- <--- Aquí está la columna que querías agregar
    "status" "EquipmentStatus" NOT NULL DEFAULT 'RECEIVED',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedTechnicianId" TEXT,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- Crear índice único para code
CREATE UNIQUE INDEX IF NOT EXISTS "equipments_code_key" ON "equipments"("code");

-- 5. Agregar Claves Foráneas (Foreign Keys)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'equipments_customerId_fkey') THEN
        ALTER TABLE "equipments" ADD CONSTRAINT "equipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'equipments_assignedTechnicianId_fkey') THEN
        ALTER TABLE "equipments" ADD CONSTRAINT "equipments_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;