import { MMKV } from "react-native-mmkv";

type KeyValue = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const store = new MMKV({ id: "gikundiro-mobile" });

export const mmkvStorage: KeyValue = {
  getItem: (key) => {
    try {
      return store.getString(key) ?? null;
    } catch (error) {
      console.warn(`[mmkv] Failed to read key ${key}`, error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      store.set(key, value);
    } catch (error) {
      console.warn(`[mmkv] Failed to write key ${key}`, error);
    }
  },
  removeItem: (key) => {
    try {
      store.delete(key);
    } catch (error) {
      console.warn(`[mmkv] Failed to remove key ${key}`, error);
    }
  },
};

export const mmkv = store;
