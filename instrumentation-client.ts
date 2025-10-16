import * as Sentry from '@sentry/nextjs';

export { register } from './instrumentation';
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
