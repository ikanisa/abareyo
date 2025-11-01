const storage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
  getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
  removeItem: jest.fn(async (key: string) => {
    storage.delete(key);
  }),
  clear: jest.fn(async () => {
    storage.clear();
  }),
}));

process.env.EXPO_PUBLIC_WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://mobile.abareyo.dev';
