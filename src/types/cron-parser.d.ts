declare module 'cron-parser' {
  export type ParserOptions = {
    currentDate?: Date | string | number;
    tz?: string;
    iterator?: boolean;
  };

  export type CronDateWrapper = {
    toDate: () => Date;
  };

  export type CronExpression = {
    next: () => CronDateWrapper;
    prev: () => CronDateWrapper;
  };

  const CronExpressionParser: {
    parse: (expression: string, options?: ParserOptions) => CronExpression;
  };

  export default CronExpressionParser;
}

