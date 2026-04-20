import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
});

export function createLogger(context: { org_id?: string; user_id?: string; trip_id?: string }) {
  return logger.child(context);
}

export default logger;
