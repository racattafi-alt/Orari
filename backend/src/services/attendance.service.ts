import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { format, differenceInMinutes } from 'date-fns';

const EARTH_RADIUS_M = 6371000;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function clockIn(userId: string, storeId: string, latitude: number, longitude: number) {
  const user = await prisma.user.findFirst({
    where: { id: userId, storeId },
    select: { id: true, canClockIn: true, geoLatitude: true, geoLongitude: true, geoRadiusMeters: true },
  });

  if (!user) throw ApiError.notFound('Utente non trovato');
  if (!user.canClockIn) throw ApiError.forbidden('Timbratura non abilitata per questo utente');

  let isValid = true;
  if (user.geoLatitude && user.geoLongitude && user.geoRadiusMeters) {
    const dist = haversineDistance(user.geoLatitude, user.geoLongitude, latitude, longitude);
    isValid = dist <= user.geoRadiusMeters;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const existing = await prisma.attendance.findUnique({
    where: { storeId_userId_date: { storeId, userId, date: new Date(today) } },
  });

  if (existing?.clockIn) throw ApiError.conflict('Timbratura di entrata già registrata oggi');

  const now = new Date();

  return prisma.attendance.upsert({
    where: { storeId_userId_date: { storeId, userId, date: new Date(today) } },
    create: {
      storeId, userId,
      date: new Date(today),
      clockIn: now,
      clockInLat: latitude,
      clockInLon: longitude,
      clockInValid: isValid,
    },
    update: {
      clockIn: now,
      clockInLat: latitude,
      clockInLon: longitude,
      clockInValid: isValid,
    },
  });
}

export async function clockOut(userId: string, storeId: string, latitude: number, longitude: number, notes?: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const attendance = await prisma.attendance.findUnique({
    where: { storeId_userId_date: { storeId, userId, date: new Date(today) } },
  });

  if (!attendance || !attendance.clockIn) throw ApiError.badRequest('Nessuna timbratura di entrata oggi');
  if (attendance.clockOut) throw ApiError.conflict('Timbratura di uscita già registrata oggi');

  const user = await prisma.user.findFirst({
    where: { id: userId, storeId },
    select: { geoLatitude: true, geoLongitude: true, geoRadiusMeters: true },
  });

  let isValid = true;
  if (user?.geoLatitude && user?.geoLongitude && user?.geoRadiusMeters) {
    const dist = haversineDistance(user.geoLatitude, user.geoLongitude, latitude, longitude);
    isValid = dist <= user.geoRadiusMeters;
  }

  const now = new Date();
  const workedMinutes = differenceInMinutes(now, attendance.clockIn);

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      clockOut: now,
      clockOutLat: latitude,
      clockOutLon: longitude,
      clockOutValid: isValid,
      workedMinutes,
      notes,
    },
  });
}

export async function getAttendance(storeId: string, filters: {
  userId?: string; startDate?: string; endDate?: string; month?: string; year?: string;
}) {
  const where: Prisma.AttendanceWhereInput = { storeId };

  if (filters.userId) where.userId = filters.userId;

  if (filters.month && filters.year) {
    const m = parseInt(filters.month, 10);
    const y = parseInt(filters.year, 10);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    where.date = { gte: start, lte: end };
  } else if (filters.startDate && filters.endDate) {
    where.date = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
  }

  return prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ date: 'desc' }, { clockIn: 'desc' }],
  });
}

export async function getTodayStatus(userId: string, storeId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return prisma.attendance.findUnique({
    where: { storeId_userId_date: { storeId, userId, date: new Date(today) } },
  });
}

export async function createManualAttendance(storeId: string, adminId: string, data: {
  userId: string; date: string; clockIn: string; clockOut?: string; notes?: string;
}) {
  const user = await prisma.user.findFirst({ where: { id: data.userId, storeId } });
  if (!user) throw ApiError.notFound('Dipendente non trovato');

  const clockIn = new Date(data.clockIn);
  const clockOut = data.clockOut ? new Date(data.clockOut) : undefined;
  const workedMinutes = clockOut ? differenceInMinutes(clockOut, clockIn) : undefined;

  return prisma.attendance.upsert({
    where: { storeId_userId_date: { storeId, userId: data.userId, date: new Date(data.date) } },
    create: {
      storeId, userId: data.userId,
      date: new Date(data.date),
      clockIn, clockOut,
      workedMinutes,
      notes: data.notes,
      isManual: true,
    },
    update: { clockIn, clockOut, workedMinutes, notes: data.notes, isManual: true },
  });
}
