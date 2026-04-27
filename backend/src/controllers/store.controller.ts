import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import { ApiError } from '../utils/apiError';

const storeSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(2).max(5),
  region: z.string().min(1),
  country: z.string().default('IT'),
  timezone: z.string().default('Europe/Rome'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export async function listStores(req: Request, res: Response, next: NextFunction) {
  try {
    const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { next(err); }
}

export async function getStore(req: Request, res: Response, next: NextFunction) {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.user!.storeId } });
    if (!store) throw ApiError.notFound('Negozio non trovato');
    res.json(store);
  } catch (err) { next(err); }
}

export async function createStore(req: Request, res: Response, next: NextFunction) {
  try {
    const data = storeSchema.parse(req.body);
    const store = await prisma.store.create({ data });
    res.status(201).json(store);
  } catch (err) { next(err); }
}

export async function updateStore(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = req.user!.role === 'SUPER_ADMIN' ? req.params.id : req.user!.storeId;
    const data = storeSchema.partial().parse(req.body);
    const store = await prisma.store.update({ where: { id: storeId }, data });
    res.json(store);
  } catch (err) { next(err); }
}

export async function generateInviteCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({ role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE') }).parse(req.body);
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const invite = await prisma.inviteCode.create({
      data: {
        storeId: req.user!.storeId,
        code,
        role: role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
        expiresAt: addDays(new Date(), 7),
      },
    });
    res.json(invite);
  } catch (err) { next(err); }
}
