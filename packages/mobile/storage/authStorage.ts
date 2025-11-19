import AsyncStorage from '@react-native-async-storage/async-storage';

type TokenChangeListener = (token: string | null) => void;

const STORAGE_KEY = 'rayon.mobile.authToken';
const listeners = new Set<TokenChangeListener>();

const notify = (value: string | null) => {
  listeners.forEach((listener) => listener(value));
};

export const authStorage = {
  async hydrate(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEY);
      if (token) {
        notify(token);
      }
      return token;
    } catch (error) {
      console.warn('Failed to hydrate auth token', error);
      return null;
    }
  },
  async save(token: string) {
    await AsyncStorage.setItem(STORAGE_KEY, token);
    notify(token);
  },
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    notify(null);
  },
  subscribe(listener: TokenChangeListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
