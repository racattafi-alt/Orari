import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/schedule.service';
import { createScheduleSchema, scheduleEntrySchema, bulkEntriesSchema, createShiftSchema } from '../schemas/schedule.schema';
import { z } from 'zod';

const monthParams = z.object({
  year: z.string().transform(Number),
  month: z.string().transform(Number),
});

export async function getOrCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = monthParams.parse(req.query);
    const schedule = await svc.getOrCreateSchedule(req.user!.storeId, year, month);
    res.json(schedule);
  } catch (err) { next(err); }
}

export async function getMySchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month } = monthParams.parse(req.query);
    const schedule = await svc.getMySchedule(req.user!.userId, req.user!.storeId, year, month);
    res.json(schedule);
  } catch (err) { next(err); }
}

export async function upsertEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const data = scheduleEntrySchema.parse(req.body);
    const entry = await svc.upsertEntry(req.user!.storeId, req.params.scheduleId, data);
    res.json(entry);
  } catch (err) { next(err); }
}

export async function bulkUpsert(req: Request, res: Response, next: NextFunction) {
  try {
    const { entries } = bulkEntriesSchema.parse(req.body);
    await svc.bulkUpsertEntries(req.user!.storeId, req.params.scheduleId, entries);
    res.json({ message: 'Orari salvati con successo' });
  } catch (err) { next(err); }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteEntry(req.user!.storeId, req.params.entryId);
    res.json({ message: 'Voce eliminata' });
  } catch (err) { next(err); }
}

export async function publish(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await svc.publishSchedule(req.user!.storeId, req.params.scheduleId);
    res.json(schedule);
  } catch (err) { next(err); }
}

export async function listShifts(req: Request, res: Response, next: NextFunction) {
  try {
    const shifts = await svc.getShifts(req.user!.storeId);
    res.json(shifts);
  } catch (err) { next(err); }
}

export async function createShift(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createShiftSchema.parse(req.body);
    const shift = await svc.createShift(req.user!.storeId, data);
    res.status(201).json(shift);
  } catch (err) { next(err); }
}

export async function deleteShift(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteShift(req.user!.storeId, req.params.shiftId);
    res.json({ message: 'Turno eliminato' });
  } catch (err) { next(err); }
}
