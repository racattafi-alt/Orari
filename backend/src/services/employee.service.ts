import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { encrypt, decrypt } from '../utils/crypto';
import { Role } from '@prisma/client';

export async function getEmployees(storeId: string) {
  const users = await prisma.user.findMany({
    where: { storeId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, phone: true, fiscalCode: true, hireDate: true,
      weeklyHours: true, isActive: true, canClockIn: true,
      geoLatitude: true, geoLongitude: true, geoRadiusMeters: true,
      avatarUrl: true, notes: true, createdAt: true,
      ibanEncrypted: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return users.map((u) => ({
    ...u,
    iban: u.ibanEncrypted ? decrypt(u.ibanEncrypted) : null,
    ibanEncrypted: undefined,
  }));
}

export async function getEmployee(storeId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, storeId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, phone: true, fiscalCode: true, hireDate: true,
      weeklyHours: true, isActive: true, canClockIn: true,
      geoLatitude: true, geoLongitude: true, geoRadiusMeters: true,
      avatarUrl: true, notes: true, ibanEncrypted: true, createdAt: true,
    },
  });
  if (!user) throw ApiError.notFound('Dipendente non trovato');

  return {
    ...user,
    iban: user.ibanEncrypted ? decrypt(user.ibanEncrypted) : null,
    ibanEncrypted: undefined,
  };
}

export async function createEmployee(storeId: string, data: {
  email: string; password: string; firstName: string; lastName: string;
  role?: Role; phone?: string; iban?: string; fiscalCode?: string;
  hireDate?: string; weeklyHours?: number; canClockIn?: boolean;
  geoLatitude?: number; geoLongitude?: number; geoRadiusMeters?: number; notes?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw ApiError.conflict('Email già registrata');

  const hashed = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      storeId,
      email: data.email.toLowerCase(),
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'EMPLOYEE',
      phone: data.phone,
      ibanEncrypted: data.iban ? encrypt(data.iban) : undefined,
      fiscalCode: data.fiscalCode,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      weeklyHours: data.weeklyHours ?? 40,
      canClockIn: data.canClockIn ?? false,
      geoLatitude: data.geoLatitude,
      geoLongitude: data.geoLongitude,
      geoRadiusMeters: data.geoRadiusMeters,
      notes: data.notes,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
}

export async function updateEmployee(storeId: string, userId: string, data: Partial<{
  firstName: string; lastName: string; role: Role; phone: string;
  iban: string; fiscalCode: string; hireDate: string; weeklyHours: number;
  isActive: boolean; canClockIn: boolean; geoLatitude: number;
  geoLongitude: number; geoRadiusMeters: number; notes: string;
}>) {
  const existing = await prisma.user.findFirst({ where: { id: userId, storeId } });
  if (!existing) throw ApiError.notFound('Dipendente non trovato');

  const { iban, hireDate, ...rest } = data;

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(iban !== undefined && { ibanEncrypted: iban ? encrypt(iban) : null }),
      ...(hireDate && { hireDate: new Date(hireDate) }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  });
}

export async function deleteEmployee(storeId: string, userId: string) {
  const existing = await prisma.user.findFirst({ where: { id: userId, storeId } });
  if (!existing) throw ApiError.notFound('Dipendente non trovato');
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
}

export async function resetEmployeePassword(storeId: string, userId: string, newPassword: string) {
  const existing = await prisma.user.findFirst({ where: { id: userId, storeId } });
  if (!existing) throw ApiError.notFound('Dipendente non trovato');
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
