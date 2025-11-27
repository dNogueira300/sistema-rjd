-- 1. Crear ENUMS de manera segura (verificando si existen)
DO $$
BEGIN
    -- Role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "public"."Role" AS ENUM ('ADMINISTRADOR', 'TECNICO');
    END IF;
    -- UserStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
    -- EquipmentType
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EquipmentType') THEN
        CREATE TYPE "public"."EquipmentType" AS ENUM ('PC', 'LAPTOP', 'PRINTER', 'PLOTTER', 'OTHER');
    END IF;
    -- EquipmentStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EquipmentStatus') THEN
        CREATE TYPE "public"."EquipmentStatus" AS ENUM ('RECEIVED', 'REPAIR', 'REPAIRED', 'DELIVERED', 'CANCELLED');
    END IF;
    -- PaymentMethod
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
        CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'YAPE', 'PLIN', 'TRANSFER');
    END IF;
    -- VoucherType
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoucherType') THEN
        CREATE TYPE "public"."VoucherType" AS ENUM ('RECEIPT', 'INVOICE', 'DELIVERY_NOTE');
    END IF;
    -- PaymentStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED');
    END IF;
    -- ExpenseType
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpenseType') THEN
        CREATE TYPE "public"."ExpenseType" AS ENUM ('PURCHASE', 'ADVANCE', 'OTHER');
    END IF;
    -- AdvanceStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvanceStatus') THEN
        CREATE TYPE "public"."AdvanceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
    END IF;
END$$;

-- 2. Crear Tablas con IF NOT EXISTS

-- CreateTable users
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'TECNICO',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable customers
CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ruc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable equipments
CREATE TABLE IF NOT EXISTS "public"."equipments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "public"."EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "reportedFlaw" TEXT NOT NULL,
    "accessories" TEXT,
    "serviceType" TEXT,
    "status" "public"."EquipmentStatus" NOT NULL DEFAULT 'RECEIVED',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedTechnicianId" TEXT,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable equipment_status_history
CREATE TABLE IF NOT EXISTS "public"."equipment_status_history" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" "public"."EquipmentStatus" NOT NULL,
    "observations" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable payments
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "voucherType" "public"."VoucherType" NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable expenses
CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" TEXT NOT NULL,
    "type" "public"."ExpenseType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "beneficiary" TEXT,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable payroll_records
CREATE TABLE IF NOT EXISTS "public"."payroll_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable advances
CREATE TABLE IF NOT EXISTS "public"."advances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "public"."AdvanceStatus" NOT NULL DEFAULT 'PENDING',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advances_pkey" PRIMARY KEY ("id")
);

-- 3. Índices (Solo si no existen)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "public"."users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "equipments_code_key" ON "public"."equipments"("code");

-- 4. Foreign Keys (Verificando existencia)
DO $$
BEGIN
    -- Equipment -> Customer
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'equipments_customerId_fkey') THEN
        ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Equipment -> Technician
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'equipments_assignedTechnicianId_fkey') THEN
        ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- History -> Equipment
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'equipment_status_history_equipmentId_fkey') THEN
        ALTER TABLE "public"."equipment_status_history" ADD CONSTRAINT "equipment_status_history_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Payments -> Equipment
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_equipmentId_fkey') THEN
        ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Payroll -> User
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payroll_records_userId_fkey') THEN
        ALTER TABLE "public"."payroll_records" ADD CONSTRAINT "payroll_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Advances -> User
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'advances_userId_fkey') THEN
        ALTER TABLE "public"."advances" ADD CONSTRAINT "advances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;