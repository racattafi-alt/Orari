import { prisma } from '../config/database';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';

export async function getStoreStats(storeId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const [totalEmployees, activeEmployees, monthAttendance, yearAttendance, scheduleEntries] = await Promise.all([
    prisma.user.count({ where: { storeId } }),
    prisma.user.count({ where: { storeId, isActive: true } }),
    prisma.attendance.findMany({
      where: { storeId, date: { gte: monthStart, lte: monthEnd }, workedMinutes: { not: null } },
      select: { userId: true, workedMinutes: true, date: true },
    }),
    prisma.attendance.findMany({
      where: { storeId, date: { gte: yearStart, lte: yearEnd }, workedMinutes: { not: null } },
      select: { userId: true, workedMinutes: true, date: true },
    }),
    prisma.scheduleEntry.findMany({
      where: { schedule: { storeId }, date: { gte: monthStart, lte: monthEnd } },
      select: { userId: true, startTime: true, endTime: true, breakMinutes: true, shiftType: true },
    }),
  ]);

  const totalMonthHours = monthAttendance.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0) / 60;
  const totalYearHours = yearAttendance.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0) / 60;

  const byEmployee: Record<string, { workedMinutes: number; daysWorked: number }> = {};
  for (const a of monthAttendance) {
    if (!byEmployee[a.userId]) byEmployee[a.userId] = { workedMinutes: 0, daysWorked: 0 };
    byEmployee[a.userId].workedMinutes += a.workedMinutes ?? 0;
    byEmployee[a.userId].daysWorked++;
  }

  // Monthly trend for the year
  const months = eachMonthOfInterval({ start: yearStart, end: now });
  const monthlyTrend = months.map((m) => {
    const start = startOfMonth(m);
    const end = endOfMonth(m);
    const monthData = yearAttendance.filter((a) => a.date >= start && a.date <= end);
    return {
      month: format(m, 'MMM yyyy'),
      hours: Math.round(monthData.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0) / 60),
    };
  });

  // Shift type distribution
  const shiftDist: Record<string, number> = {};
  for (const e of scheduleEntries) {
    shiftDist[e.shiftType] = (shiftDist[e.shiftType] || 0) + 1;
  }

  return {
    totalEmployees,
    activeEmployees,
    totalMonthHours: Math.round(totalMonthHours * 100) / 100,
    totalYearHours: Math.round(totalYearHours * 100) / 100,
    avgHoursPerEmployee: activeEmployees > 0 ? Math.round((totalMonthHours / activeEmployees) * 100) / 100 : 0,
    byEmployee,
    monthlyTrend,
    shiftDistribution: shiftDist,
  };
}

export async function getEmployeeStats(storeId: string, userId: string, year: number) {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const user = await prisma.user.findFirst({
    where: { id: userId, storeId },
    select: { firstName: true, lastName: true, weeklyHours: true, hireDate: true },
  });

  if (!user) return null;

  const [attendance, scheduleEntries] = await Promise.all([
    prisma.attendance.findMany({
      where: { storeId, userId, date: { gte: yearStart, lte: yearEnd }, workedMinutes: { not: null } },
      orderBy: { date: 'asc' },
    }),
    prisma.scheduleEntry.findMany({
      where: { schedule: { storeId }, userId, date: { gte: yearStart, lte: yearEnd } },
      orderBy: { date: 'asc' },
    }),
  ]);

  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthlyData = months.map((m) => {
    const start = startOfMonth(m);
    const end = endOfMonth(m);
    const monthAttendance = attendance.filter((a) => a.date >= start && a.date <= end);
    const monthScheduled = scheduleEntries.filter((e) => e.date >= start && e.date <= end);

    const workedHours = monthAttendance.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0) / 60;
    const scheduledHours = monthScheduled.reduce((acc, e) => {
      const [sh, sm] = e.startTime.split(':').map(Number);
      const [eh, em] = e.endTime.split(':').map(Number);
      const total = (eh * 60 + em) - (sh * 60 + sm) - e.breakMinutes;
      return acc + Math.max(0, total / 60);
    }, 0);

    return {
      month: format(m, 'MMM'),
      workedHours: Math.round(workedHours * 100) / 100,
      scheduledHours: Math.round(scheduledHours * 100) / 100,
      daysWorked: monthAttendance.length,
    };
  });

  const totalWorkedHours = attendance.reduce((acc, a) => acc + (a.workedMinutes ?? 0), 0) / 60;
  const shiftTypes: Record<string, number> = {};
  for (const e of scheduleEntries) {
    shiftTypes[e.shiftType] = (shiftTypes[e.shiftType] || 0) + 1;
  }

  return {
    user: { ...user },
    year,
    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
    totalDaysWorked: attendance.length,
    monthlyData,
    shiftTypes,
    averageHoursPerDay:
      attendance.length > 0
        ? Math.round((totalWorkedHours / attendance.length) * 100) / 100
        : 0,
  };
}
