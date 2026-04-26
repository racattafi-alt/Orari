import { z } from 'zod';

export const createScheduleSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  name: z.string().optional(),
  notes: z.string().optional(),
});

export const scheduleEntrySchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  shiftType: z
    .enum(['NORMAL', 'OVERTIME', 'HOLIDAY_WORK', 'ON_CALL', 'TRAINING', 'DAY_OFF', 'SICK', 'VACATION', 'PERMIT'])
    .default('NORMAL'),
  shiftId: z.string().optional(),
});

export const bulkEntriesSchema = z.object({
  entries: z.array(scheduleEntrySchema),
});

export const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakMinutes: z.number().int().min(0).default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3B82F6'),
});
