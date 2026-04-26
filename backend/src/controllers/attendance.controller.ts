import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/attendance.service';
import { clockInSchema, clockOutSchema, manualAttendanceSchema, attendanceQuerySchema } from '../schemas/attendance.schema';

export async function clockIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude } = clockInSchema.parse(req.body);
    const record = await svc.clockIn(req.user!.userId, req.user!.storeId, latitude, longitude);
    res.json(record);
  } catch (err) { next(err); }
}

export async function clockOut(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, notes } = clockOutSchema.parse(req.body);
    const record = await svc.clockOut(req.user!.userId, req.user!.storeId, latitude, longitude, notes);
    res.json(record);
  } catch (err) { next(err); }
}

export async function todayStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await svc.getTodayStatus(req.user!.userId, req.user!.storeId);
    res.json(record);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = attendanceQuerySchema.parse(req.query);
    // Employees can only see their own attendance
    if (req.user!.role === 'EMPLOYEE') filters.userId = req.user!.userId;
    const records = await svc.getAttendance(req.user!.storeId, filters);
    res.json(records);
  } catch (err) { next(err); }
}

export async function createManual(req: Request, res: Response, next: NextFunction) {
  try {
    const data = manualAttendanceSchema.parse(req.body);
    const record = await svc.createManualAttendance(req.user!.storeId, req.user!.userId, data);
    res.status(201).json(record);
  } catch (err) { next(err); }
}
