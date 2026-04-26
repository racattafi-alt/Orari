import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/employee.service';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/employee.schema';
import { z } from 'zod';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.user!.role === 'SUPER_ADMIN' ? req.params.storeId : req.user!.storeId;
    const employees = await svc.getEmployees(storeId);
    res.json(employees);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.user!.storeId;
    const employee = await svc.getEmployee(storeId, req.params.id);
    res.json(employee);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEmployeeSchema.parse(req.body);
    const employee = await svc.createEmployee(req.user!.storeId, data);
    res.status(201).json(employee);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateEmployeeSchema.parse(req.body);
    const employee = await svc.updateEmployee(req.user!.storeId, req.params.id, data);
    res.json(employee);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteEmployee(req.user!.storeId, req.params.id);
    res.json({ message: 'Dipendente disattivato' });
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(req.body);
    await svc.resetEmployeePassword(req.user!.storeId, req.params.id, newPassword);
    res.json({ message: 'Password reimpostata con successo' });
  } catch (err) { next(err); }
}
