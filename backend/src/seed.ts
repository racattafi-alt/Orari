import './config/env';
import bcrypt from 'bcryptjs';
import { prisma } from './config/database';
import { logger } from './utils/logger';

async function seed() {
  logger.info('Seeding database...');

  // Create store
  const store = await prisma.store.upsert({
    where: { id: 'store_demo' },
    create: {
      id: 'store_demo',
      name: 'Caffè San Marco',
      city: 'Padova',
      province: 'PD',
      region: 'Veneto',
      country: 'IT',
      timezone: 'Europe/Rome',
      address: 'Via Roma 1, Padova',
      phone: '+39 049 000000',
      email: 'info@caffesanmarco.it',
    },
    update: {},
  });

  logger.info(`Store: ${store.name} (${store.id})`);

  // Create admin
  const adminPwd = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@caffesanmarco.it' },
    create: {
      storeId: store.id,
      email: 'admin@caffesanmarco.it',
      password: adminPwd,
      firstName: 'Marco',
      lastName: 'Bianchi',
      role: 'ADMIN',
      weeklyHours: 40,
    },
    update: {},
  });
  logger.info(`Admin: ${admin.email}`);

  // Create employees
  const empPwd = await bcrypt.hash('Pass123!', 12);
  const employees = [
    { email: 'sara.rossi@caffesanmarco.it', firstName: 'Sara', lastName: 'Rossi', canClockIn: true },
    { email: 'luca.ferrari@caffesanmarco.it', firstName: 'Luca', lastName: 'Ferrari', canClockIn: true },
    { email: 'giulia.conti@caffesanmarco.it', firstName: 'Giulia', lastName: 'Conti', canClockIn: false },
    { email: 'mario.verde@caffesanmarco.it', firstName: 'Mario', lastName: 'Verde', canClockIn: true },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      create: {
        storeId: store.id,
        email: emp.email,
        password: empPwd,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: 'EMPLOYEE',
        weeklyHours: 40,
        canClockIn: emp.canClockIn,
      },
      update: {},
    });
    logger.info(`Employee: ${emp.email}`);
  }

  // Create default shifts
  const shifts = [
    { name: 'Mattina', startTime: '07:00', endTime: '13:00', color: '#F59E0B', breakMinutes: 0 },
    { name: 'Pomeriggio', startTime: '13:00', endTime: '19:00', color: '#3B82F6', breakMinutes: 30 },
    { name: 'Sera', startTime: '17:00', endTime: '23:00', color: '#8B5CF6', breakMinutes: 30 },
    { name: 'Giornata', startTime: '09:00', endTime: '18:00', color: '#10B981', breakMinutes: 60 },
    { name: 'Breve', startTime: '08:00', endTime: '12:00', color: '#6B7280', breakMinutes: 0 },
  ];

  for (const shift of shifts) {
    const existing = await prisma.shift.findFirst({ where: { storeId: store.id, name: shift.name } });
    if (!existing) {
      await prisma.shift.create({ data: { storeId: store.id, ...shift } });
      logger.info(`Shift: ${shift.name}`);
    }
  }

  logger.info('Seed completed!');
  logger.info('');
  logger.info('--- CREDENZIALI ---');
  logger.info(`Admin: admin@caffesanmarco.it / Admin123!`);
  logger.info(`Dipendenti: sara.rossi@caffesanmarco.it / Pass123!`);

  await prisma.$disconnect();
}

seed().catch((err) => {
  logger.error('Seed failed', { err });
  process.exit(1);
});
