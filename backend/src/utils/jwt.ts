import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  storeId: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const opts = { expiresIn: env.jwtAccessExpiry } as SignOptions;
  return jwt.sign(payload, env.jwtSecret, opts);
}

export function signRefreshToken(payload: JwtPayload): string {
  const opts = { expiresIn: env.jwtRefreshExpiry } as SignOptions;
  return jwt.sign(payload, env.jwtRefreshSecret, opts);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}
