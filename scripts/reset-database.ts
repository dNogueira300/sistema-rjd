import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🧹 Iniciando limpieza de base de datos...");

  try {
    // Orden correcto: eliminar dependencias primero
    console.log("Eliminando equipment_status_history...");
    await prisma.equipmentStatusHistory.deleteMany();

    console.log("Eliminando payments...");
    await prisma.payment.deleteMany();

    console.log("Eliminando equipments...");
    await prisma.equipment.deleteMany();

    console.log("Eliminando expenses...");
    await prisma.expense.deleteMany();

    console.log("Eliminando payroll_records...");
    await prisma.payrollRecord.deleteMany();

    console.log("Eliminando advances...");
    await prisma.advance.deleteMany();

    // Verificar que users y customers siguen ahí
    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();

    console.log("✅ Limpieza completada!");
    console.log(`📊 Datos conservados:`);
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Clientes: ${customerCount}`);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
