import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';

type ShiftType = 'NORMAL' | 'OVERTIME' | 'HOLIDAY_WORK' | 'ON_CALL' | 'TRAINING' | 'DAY_OFF' | 'SICK' | 'VACATION' | 'PERMIT';

export async function getOrCreateSchedule(storeId: string, year: number, month: number) {
  return prisma.schedule.upsert({
    where: { storeId_year_month: { storeId, year, month } },
    create: { storeId, year, month },
    update: {},
    include: {
      entries: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      },
    },
  });
}

export async function getSchedule(storeId: string, year: number, month: number) {
  const schedule = await prisma.schedule.findUnique({
    where: { storeId_year_month: { storeId, year, month } },
    include: {
      entries: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      },
    },
  });
  return schedule;
}

export async function getMySchedule(userId: string, storeId: string, year: number, month: number) {
  const schedule = await prisma.schedule.findUnique({
    where: { storeId_year_month: { storeId, year, month } },
    include: {
      entries: {
        where: { userId },
        orderBy: { date: 'asc' },
      },
    },
  });
  return schedule;
}

export async function upsertEntry(storeId: string, scheduleId: string, data: {
  userId: string; date: string; startTime: string; endTime: string;
  breakMinutes?: number; notes?: string; shiftType?: ShiftType; shiftId?: string;
}) {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, storeId } });
  if (!schedule) throw ApiError.notFound('Orario non trovato');

  const user = await prisma.user.findFirst({ where: { id: data.userId, storeId } });
  if (!user) throw ApiError.notFound('Dipendente non trovato');

  const date = new Date(data.date);

  return prisma.scheduleEntry.upsert({
    where: {
      id: (
        await prisma.scheduleEntry.findFirst({
          where: { scheduleId, userId: data.userId, date },
          select: { id: true },
        })
      )?.id ?? 'new',
    },
    create: {
      scheduleId,
      userId: data.userId,
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes ?? 0,
      notes: data.notes,
      shiftType: data.shiftType ?? 'NORMAL',
      shiftId: data.shiftId,
    },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes ?? 0,
      notes: data.notes,
      shiftType: data.shiftType ?? 'NORMAL',
      shiftId: data.shiftId,
    },
  });
}

export async function bulkUpsertEntries(storeId: string, scheduleId: string, entries: Array<{
  userId: string; date: string; startTime: string; endTime: string;
  breakMinutes?: number; notes?: string; shiftType?: ShiftType; shiftId?: string;
}>) {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, storeId } });
  if (!schedule) throw ApiError.notFound('Orario non trovato');

  return prisma.$transaction(
    entries.map((entry) =>
      prisma.scheduleEntry.upsert({
        where: {
          id: 'placeholder_' + entry.userId + '_' + entry.date,
        },
        create: {
          scheduleId,
          userId: entry.userId,
          date: new Date(entry.date),
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakMinutes: entry.breakMinutes ?? 0,
          notes: entry.notes,
          shiftType: entry.shiftType ?? 'NORMAL',
          shiftId: entry.shiftId,
        },
        update: {
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakMinutes: entry.breakMinutes ?? 0,
          notes: entry.notes,
          shiftType: entry.shiftType ?? 'NORMAL',
        },
      })
    )
  );
}

export async function deleteEntry(storeId: string, entryId: string) {
  const entry = await prisma.scheduleEntry.findFirst({
    where: { id: entryId, schedule: { storeId } },
  });
  if (!entry) throw ApiError.notFound('Voce non trovata');
  await prisma.scheduleEntry.delete({ where: { id: entryId } });
}

export async function publishSchedule(storeId: string, scheduleId: string) {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, storeId } });
  if (!schedule) throw ApiError.notFound('Orario non trovato');
  return prisma.schedule.update({
    where: { id: scheduleId },
    data: { isPublished: true, publishedAt: new Date() },
  });
}

export async function getShifts(storeId: string) {
  return prisma.shift.findMany({
    where: { storeId, isActive: true },
    orderBy: { startTime: 'asc' },
  });
}

export async function createShift(storeId: string, data: {
  name: string; startTime: string; endTime: string; breakMinutes?: number; color?: string;
}) {
  return prisma.shift.create({ data: { storeId, ...data } });
}

export async function deleteShift(storeId: string, shiftId: string) {
  const shift = await prisma.shift.findFirst({ where: { id: shiftId, storeId } });
  if (!shift) throw ApiError.notFound('Turno non trovato');
  await prisma.shift.update({ where: { id: shiftId }, data: { isActive: false } });
}
