export const captureException = () => {};

export const getCurrentHub = () => ({
  getClient: () => null,
});

export const withScope = (
  callback: (scope: { setExtras: (extras: Record<string, unknown>) => void }) => void,
) => {
  callback({ setExtras: () => {} });
};

export default {
  captureException,
  getCurrentHub,
  withScope,
};
