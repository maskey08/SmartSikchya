export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  isDev: import.meta.env.DEV,
} as const;
