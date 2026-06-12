import winston from 'winston';
import { mkdirSync } from 'node:fs';
import { e2eConfig, resolveFromRoot } from '../config/environment.js';

const logDir = resolveFromRoot('logs');
mkdirSync(logDir, { recursive: true });

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, scope, ...meta }) => {
    const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}${scope ? ` (${scope})` : ''}: ${message}${suffix}`;
  }),
);

const rootLogger = winston.createLogger({
  level: e2eConfig.logLevel,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: resolveFromRoot('logs/e2e.log'),
      format: baseFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

export function createLogger(scope: string): winston.Logger {
  return rootLogger.child({ scope });
}

export { rootLogger as logger };
