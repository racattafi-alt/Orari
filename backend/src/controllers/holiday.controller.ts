import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/holiday.service';
import { z } from 'zod';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { year } = z.object({ year: z.string().transform(Number) }).parse(req.query);
    const holidays = await svc.getHolidays(req.user!.storeId, year);
    res.json(holidays);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { year } = z.object({ year: z.string().transform(Number) }).parse(req.query);
    const holidays = await svc.refreshHolidays(req.user!.storeId, year);
    res.json(holidays);
  } catch (err) { next(err); }
}

export async function addCustom(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, name } = z.object({ date: z.string(), name: z.string().min(1) }).parse(req.body);
    const holiday = await svc.addCustomHoliday(req.user!.storeId, date, name);
    res.status(201).json(holiday);
  } catch (err) { next(err); }
}

export async function removeCustom(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.removeCustomHoliday(req.user!.storeId, req.params.id);
    res.json({ message: 'Festività rimossa' });
  } catch (err) { next(err); }
}
