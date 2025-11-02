import detox from 'detox';
import adapter from 'detox/runners/jest/adapter';
import assignReporter from 'detox/runners/jest/assignReporter';
import specReporter from 'detox/runners/jest/specReporter';

jest.setTimeout(120000);

const env = (globalThis as unknown as {
  detoxCircus: { getEnv: () => { addEventsListener: (listener: unknown) => void } };
}).detoxCircus.getEnv();

// @ts-expect-error - Detox circus typings are not published for custom runners
env.addEventsListener(adapter);
// @ts-expect-error - Detox circus typings are not published for custom runners
env.addEventsListener(specReporter);
// @ts-expect-error - Detox circus typings are not published for custom runners
env.addEventsListener(assignReporter);

beforeAll(async () => {
  await detox.init(undefined, { initGlobals: false });
}, 120000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterEach(async () => {
  await adapter.afterEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
