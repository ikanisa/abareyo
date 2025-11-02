type LogContext = Record<string, unknown> | undefined;

type LogLevel = 'info' | 'warn' | 'error';

const formatEntry = (level: LogLevel, message: string, context: LogContext) => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  ...(context ? { context } : {}),
});

const emit = (level: LogLevel, message: string, context?: LogContext) => {
  const entry = JSON.stringify(formatEntry(level, message, context));
  switch (level) {
    case 'error':
      console.error(entry);
      break;
    case 'warn':
      console.warn(entry);
      break;
    default:
      console.log(entry);
  }
};

export const logInfo = (message: string, context?: LogContext) => emit('info', message, context);
export const logWarn = (message: string, context?: LogContext) => emit('warn', message, context);
export const logError = (message: string, context?: LogContext) => emit('error', message, context);
