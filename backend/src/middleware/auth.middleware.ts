import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        storeId: string;
        role: string;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized();

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, storeId: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) throw ApiError.unauthorized('Utente non trovato o disattivato');

    req.user = { userId: user.id, storeId: user.storeId, role: user.role };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized());
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}

export function requireSameStore(req: Request, _res: Response, next: NextFunction) {
  const { storeId } = req.params;
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role !== 'SUPER_ADMIN' && storeId && req.user.storeId !== storeId) {
    return next(ApiError.forbidden());
  }
  next();
}
