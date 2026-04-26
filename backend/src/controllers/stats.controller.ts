import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/stats.service';
import { z } from 'zod';

export async function storeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await svc.getStoreStats(req.user!.storeId);
    res.json(stats);
  } catch (err) { next(err); }
}

export async function employeeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { year } = z.object({ year: z.string().transform(Number) }).parse(req.query);
    const userId = req.params.userId === 'me' ? req.user!.userId : req.params.userId;
    // Employees can only see their own stats
    if (req.user!.role === 'EMPLOYEE' && userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    const stats = await svc.getEmployeeStats(req.user!.storeId, userId, year);
    res.json(stats);
  } catch (err) { next(err); }
}
