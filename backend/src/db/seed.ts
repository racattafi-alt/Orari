import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export async function seedDefaultAdmin(): Promise<void> {
  let store = await prisma.store.findFirst();
  if (!store) {
    store = await prisma.store.create({
      data: { name: 'Negozio Principale', city: 'Milano', province: 'MI', region: 'Lombardia' },
    });
    logger.info(`Store di default creato: ${store.name}`);
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
    logger.info('SUPER_ADMIN creato: admin@orari.app / Admin1234!');
  }
}
