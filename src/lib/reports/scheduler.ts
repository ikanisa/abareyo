import CronExpressionParser from 'cron-parser';

export class InvalidCronExpressionError extends Error {
  constructor(cron: string, cause?: unknown) {
    super(`Invalid cron expression: ${cron}`);
    this.name = 'InvalidCronExpressionError';
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.name}: ${this.message}\nCaused by: ${cause.stack}`;
    }
  }
}

const parseCron = (cron: string, currentDate: Date) => {
  try {
    return CronExpressionParser.parse(cron, {
      currentDate,
      tz: 'UTC',
    });
  } catch (error) {
    throw new InvalidCronExpressionError(cron, error);
  }
};

export const computeNextRun = (cron: string, from: Date = new Date()): Date => {
  const interval = parseCron(cron, from);
  return interval.next().toDate();
};

export const computeInitialRun = (cron: string, dispatchImmediately: boolean, from: Date = new Date()): Date => {
  if (dispatchImmediately) {
    return from;
  }
  return computeNextRun(cron, from);
};

export const computeNextRunIso = (cron: string, from: Date = new Date()): string => computeNextRun(cron, from).toISOString();
