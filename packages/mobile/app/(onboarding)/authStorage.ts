import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@rayon/authToken";
let inMemoryToken: string | null = null;

export const saveAuthToken = async (token: string) => {
  inMemoryToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  inMemoryToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  inMemoryToken = stored;
  return stored;
};

export const setInMemoryToken = (token: string | null) => {
  inMemoryToken = token;
};
