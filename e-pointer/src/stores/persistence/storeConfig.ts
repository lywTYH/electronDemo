import { StorageValue } from "zustand/middleware";

const DB_NAME = 'EPointerAppDB';
const DB_VERSION = 1;

export const createPersistConfig = <T>(
  storeName: string,
  version = 1,
  partialize?: (state: T) => Partial<T>
) => ({
  name: storeName,
  storage: {
    getItem: async (name: string): Promise<StorageValue<Partial<T>> | null> => null,
    setItem: async (name: string, value: StorageValue<Partial<T>>): Promise<void> => {},
    removeItem: async (name: string): Promise<void> => {},
  },
  version,
  partialize,
});
