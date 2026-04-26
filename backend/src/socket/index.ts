import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export function setupSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token mancante'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Token non valido'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.debug(`Socket connected: ${user.userId} (store: ${user.storeId})`);

    // Join store room for targeted broadcasts
    socket.join(`store:${user.storeId}`);
    socket.join(`user:${user.userId}`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${user.userId}`);
    });
  });

  return io;
}

export function emitToStore(io: Server, storeId: string, event: string, data: unknown) {
  io.to(`store:${storeId}`).emit(event, data);
}

export function emitToUser(io: Server, userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}
