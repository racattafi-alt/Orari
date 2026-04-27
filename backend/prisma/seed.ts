import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let store = await prisma.store.findFirst();
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Negozio Principale',
        city: 'Milano',
        province: 'MI',
        region: 'Lombardia',
      },
    });
    console.log('Store creato:', store.name);
  }

  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!existing) {
    const hashed = await bcrypt.hash('Admin1234!', 12);
    await prisma.user.create({
      data: {
        storeId: store.id,
        email: 'admin@orari.app',
        password: hashed,
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('SUPER_ADMIN creato: admin@orari.app / Admin1234!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
