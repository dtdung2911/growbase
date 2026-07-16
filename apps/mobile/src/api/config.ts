const API_URL_ENV = "EXPO_PUBLIC_API_URL";

export function getApiBaseUrl(): string {
  // MUST stay a literal property access: Expo/babel inlines EXPO_PUBLIC_* at build time,
  // so a dynamic process.env[name] lookup returns undefined in real builds.
  const value = process.env.EXPO_PUBLIC_API_URL;
  if (!value) {
    throw new Error(`${API_URL_ENV} is not set. Add it to apps/mobile/.env (copy .env.example).`);
  }
  const url = value.trim().replace(/\/+$/, "");
  if (!/^https?:\/\/.+$/.test(url)) {
    throw new Error(`${API_URL_ENV} must be an http(s) URL. Got: "${value}".`);
  }
  return url;
}
