export const normalizeUrl = (host: string, path: string) => `${host.replace(/\/$/, '')}${path}`;

export const toErrorMessage = (error: unknown, fallback = 'Unknown error') =>
  error instanceof Error ? error.message : fallback;
