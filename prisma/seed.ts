import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Verificar si ya existe un admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMINISTRADOR" },
  });

  if (existingAdmin) {
    console.log("✅ Admin ya existe:", existingAdmin.email);
    return;
  }

  // Crear admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@rjd.com",
      name: "Administrador RJD",
      phone: "999999999",
      role: "ADMINISTRADOR",
      status: "ACTIVE",
      password: hashedPassword,
    },
  });

  console.log("🎉 Admin creado:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
