import type { vi } from "@/lib/i18n/messages/vi";

export const en: Record<keyof typeof vi, string> = {
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.error.invalidCredentials": "Incorrect email or password",
  "login.error.network": "Couldn't connect. Please try again",
  "unlock.title": "Unlock GrowBase",
  "unlock.faceId.cta": "Unlock with Face ID",
  "unlock.faceId.prompt": "Authenticate to unlock GrowBase",
  "unlock.password.cta": "Enter password",
  "unlock.error.failed": "Authentication failed. Please try again",
};
