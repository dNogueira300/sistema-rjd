import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🧹 Iniciando limpieza de base de datos...");
  console.log("⚠️  CONSERVANDO SOLO USUARIOS - Eliminando todo lo demás");

  try {
    // Orden correcto: eliminar dependencias primero
    console.log("Eliminando equipment_status_history...");
    await prisma.equipmentStatusHistory.deleteMany();

    console.log("Eliminando payments...");
    await prisma.payment.deleteMany();

    console.log("Eliminando equipments...");
    await prisma.equipment.deleteMany();

    console.log("Eliminando customers...");
    await prisma.customer.deleteMany();

    console.log("Eliminando expenses...");
    await prisma.expense.deleteMany();

    console.log("Eliminando payroll_records...");
    await prisma.payrollRecord.deleteMany();

    console.log("Eliminando advances...");
    await prisma.advance.deleteMany();

    // Verificar que solo users quedan
    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();
    const equipmentCount = await prisma.equipment.count();
    const paymentCount = await prisma.payment.count();
    const expenseCount = await prisma.expense.count();

    console.log("✅ Limpieza completada!");
    console.log(`📊 Estado final de la base de datos:`);
    console.log(`   - Usuarios: ${userCount} ✅`);
    console.log(`   - Clientes: ${customerCount} (eliminados)`);
    console.log(`   - Equipos: ${equipmentCount} (eliminados)`);
    console.log(`   - Pagos: ${paymentCount} (eliminados)`);
    console.log(`   - Gastos: ${expenseCount} (eliminados)`);

    if (
      customerCount === 0 &&
      equipmentCount === 0 &&
      paymentCount === 0 &&
      expenseCount === 0
    ) {
      console.log("🎯 ÉXITO: Solo usuarios conservados");
    } else {
      console.log("⚠️  Advertencia: Algunos registros no fueron eliminados");
    }
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
