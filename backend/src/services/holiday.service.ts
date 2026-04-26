import Holidays from 'date-holidays';
import { prisma } from '../config/database';
import { HolidayType } from '@prisma/client';
import { startOfYear, endOfYear, eachDayOfInterval, format } from 'date-fns';

interface HolidayEntry {
  date: string;
  name: string;
  type: HolidayType;
}

export async function getHolidays(storeId: string, year: number): Promise<HolidayEntry[]> {
  const cached = await prisma.holidayCache.findMany({
    where: { storeId, year },
    orderBy: { date: 'asc' },
  });

  if (cached.length > 0) {
    return cached.map((h) => ({
      date: format(h.date, 'yyyy-MM-dd'),
      name: h.name,
      type: h.type,
    }));
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return [];

  const holidays = await fetchItalianHolidays(store.province, store.region, year);

  await prisma.holidayCache.createMany({
    data: holidays.map((h) => ({
      storeId,
      date: new Date(h.date),
      name: h.name,
      type: h.type,
      year,
    })),
    skipDuplicates: true,
  });

  return holidays;
}

async function fetchItalianHolidays(province: string, region: string, year: number): Promise<HolidayEntry[]> {
  const results: HolidayEntry[] = [];

  // National holidays
  const hd = new Holidays('IT');
  const nationalHolidays = hd.getHolidays(year, 'it');
  for (const h of nationalHolidays) {
    if (h.type === 'public') {
      results.push({
        date: format(new Date(h.date), 'yyyy-MM-dd'),
        name: h.name,
        type: 'NATIONAL',
      });
    }
  }

  // Regional holidays (Patron saints, etc.)
  try {
    const hdRegion = new Holidays('IT', region.toUpperCase());
    const regionalHolidays = hdRegion.getHolidays(year, 'it');
    for (const h of regionalHolidays) {
      if (h.type === 'public' || h.type === 'bank') {
        const dateStr = format(new Date(h.date), 'yyyy-MM-dd');
        const alreadyAdded = results.some((r) => r.date === dateStr && r.name === h.name);
        if (!alreadyAdded) {
          results.push({ date: dateStr, name: h.name, type: 'REGIONAL' });
        }
      }
    }
  } catch {
    // Region not supported, skip
  }

  // Local/provincial holidays
  try {
    const hdLocal = new Holidays('IT', region.toUpperCase(), province.toUpperCase());
    const localHolidays = hdLocal.getHolidays(year, 'it');
    for (const h of localHolidays) {
      if (h.type === 'public' || h.type === 'bank') {
        const dateStr = format(new Date(h.date), 'yyyy-MM-dd');
        const alreadyAdded = results.some((r) => r.date === dateStr && r.name === h.name);
        if (!alreadyAdded) {
          results.push({ date: dateStr, name: h.name, type: 'LOCAL' });
        }
      }
    }
  } catch {
    // Province not supported, skip
  }

  return results;
}

export async function addCustomHoliday(storeId: string, date: string, name: string) {
  const year = parseInt(date.split('-')[0], 10);
  return prisma.holidayCache.create({
    data: {
      storeId,
      date: new Date(date),
      name,
      type: 'CUSTOM',
      year,
    },
  });
}

export async function removeCustomHoliday(storeId: string, holidayId: string) {
  const h = await prisma.holidayCache.findFirst({ where: { id: holidayId, storeId, type: 'CUSTOM' } });
  if (!h) throw new Error('Festività non trovata');
  await prisma.holidayCache.delete({ where: { id: holidayId } });
}

export async function refreshHolidays(storeId: string, year: number) {
  await prisma.holidayCache.deleteMany({ where: { storeId, year, type: { not: 'CUSTOM' } } });
  return getHolidays(storeId, year);
}
