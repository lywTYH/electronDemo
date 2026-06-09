const DB_NAME = 'EPointerAppDB';
const DB_VERSION = 1;

export const createPersistConfig = <T>(
  storeName: string,
  version = 1,
  partialize?: (state: any) => any
) => ({
  name: storeName,
  storage: {
    getItem: async (key: string) => {},
    setItem: async (key: string, value: string) => {},
    removeItem: async (key: string) => {}
  },
  version,
  partialize
});
