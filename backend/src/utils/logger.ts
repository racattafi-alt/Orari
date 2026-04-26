import winston from 'winston';
import { env } from '../config/env';

export const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.isDev
      ? winston.format.colorize()
      : winston.format.json(),
    env.isDev
      ? winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${extra}`;
        })
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
