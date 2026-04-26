import { Request, Response, NextFunction } from 'express';
import { loginService, refreshTokenService, logoutService, changePasswordService } from '../services/auth.service';
import { loginSchema, refreshSchema, changePasswordSchema } from '../schemas/auth.schema';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginService(email, password);
    res.json(result);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshTokenService(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await logoutService(refreshToken);
    res.json({ message: 'Disconnesso con successo' });
  } catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, storeId: true, canClockIn: true, avatarUrl: true, phone: true,
        store: { select: { id: true, name: true, city: true, timezone: true } },
      },
    });
    res.json(user);
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePasswordService(req.user!.userId, currentPassword, newPassword);
    res.json({ message: 'Password aggiornata con successo' });
  } catch (err) { next(err); }
}
