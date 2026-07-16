import type { vi } from "@/lib/i18n/messages/vi";

export const en: Record<keyof typeof vi, string> = {
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.error.invalidCredentials": "Incorrect email or password",
  "login.error.network": "Couldn't connect. Please try again",
};
