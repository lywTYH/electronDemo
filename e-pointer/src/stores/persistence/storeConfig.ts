import { StorageValue } from "zustand/middleware";



export const createPersistConfig = <T>(
  storeName: string,
  version = 1,
  partialize?: (state: T) => Partial<T>
) => ({
  name: storeName,
  storage: {
    getItem: async (): Promise<StorageValue<Partial<T>> | null> => null,
    setItem: async (): Promise<void> => {},
    removeItem: async (): Promise<void> => {},
  },
  version,
  partialize,
});
