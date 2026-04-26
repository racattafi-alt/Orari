import { z } from 'zod';

export const clockInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const clockOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  notes: z.string().optional(),
});

export const manualAttendanceSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clockIn: z.string().datetime(),
  clockOut: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().optional(),
  year: z.string().optional(),
});
