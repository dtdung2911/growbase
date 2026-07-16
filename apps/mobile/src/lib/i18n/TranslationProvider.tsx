import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { appStorage } from "@/lib/storage/mmkv";
import { en } from "@/lib/i18n/messages/en";
import { vi } from "@/lib/i18n/messages/vi";

export type Locale = "vi" | "en";
type MessageKey = keyof typeof vi;

const STORAGE_KEY = "growbase-locale";
const dictionaries: Record<Locale, Record<MessageKey, string>> = { vi, en };

export function readStoredLocale(): Locale {
  try {
    return appStorage.getItem(STORAGE_KEY) === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}

export function persistLocale(locale: Locale): void {
  appStorage.setItem(STORAGE_KEY, locale);
}

type TranslationContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const TranslationContext = createContext<TranslationContextValue>({
  locale: "vi",
  setLocale: () => {},
  t: (key) => key,
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  const setLocale = useCallback((next: Locale) => {
    try {
      persistLocale(next);
    } catch {}
    setLocaleState(next);
  }, []);
  const t = useCallback((key: MessageKey) => dictionaries[locale][key] ?? key, [locale]);

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
