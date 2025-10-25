import { captureException, captureMessage, withScope } from '@sentry/nextjs';

type ContextExtras = Record<string, unknown>;

const shouldReport = () => process.env.NODE_ENV === 'production';

export const reportAdminAvailabilityIssue = (message: string, extra?: ContextExtras) => {
  if (!shouldReport()) {
    return;
  }
  withScope((scope) => {
    if (extra) {
      scope.setContext('admin_dashboard', extra);
    }
    scope.setLevel('error');
    captureMessage(message);
  });
};

export const reportAdminAvailabilityException = (error: unknown, extra?: ContextExtras) => {
  if (!shouldReport()) {
    return;
  }
  withScope((scope) => {
    if (extra) {
      scope.setContext('admin_dashboard', extra);
    }
    scope.setLevel('error');
    captureException(error);
  });
};
