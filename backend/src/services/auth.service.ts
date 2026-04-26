import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { addDays } from 'date-fns';

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { store: { select: { id: true, name: true, isActive: true } } },
  });

  if (!user || !user.isActive) throw ApiError.unauthorized('Credenziali non valide');
  if (!user.store.isActive) throw ApiError.forbidden('Negozio disattivato');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw ApiError.unauthorized('Credenziali non valide');

  const payload = { userId: user.id, storeId: user.storeId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const rawToken = crypto.randomBytes(40).toString('hex');

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 30),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      storeId: user.storeId,
      storeName: user.store.name,
      canClockIn: user.canClockIn,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function refreshTokenService(token: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw ApiError.unauthorized('Sessione scaduta');
  }

  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, storeId: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) throw ApiError.unauthorized();

  const newAccessToken = signAccessToken({ userId: user.id, storeId: user.storeId, role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user.id, storeId: user.storeId, role: user.role });

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: { userId: user.id, token: newRefreshToken, expiresAt: addDays(new Date(), 30) },
    }),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutService(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function changePasswordService(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Utente non trovato');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw ApiError.badRequest('Password corrente non valida');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
