import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env, validateEnv } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { setupSocket } from './socket';
import routes from './routes';
import { logger } from './utils/logger';
import { seedDefaultAdmin } from './db/seed';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.frontendUrl, credentials: true },
});

// Security middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// Rate limiting
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Troppi tentativi, riprova tra 15 minuti' } }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// Attach io to requests for use in controllers
app.use((req, _res, next) => { (req as Record<string, unknown> & typeof req).io = io; next(); });

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorHandler);

// Setup socket
setupSocket(io);

async function start() {
  try {
    validateEnv();
    await connectDatabase();
    await seedDefaultAdmin();
    httpServer.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  const { disconnectDatabase } = await import('./config/database');
  await disconnectDatabase();
  process.exit(0);
});

start();
