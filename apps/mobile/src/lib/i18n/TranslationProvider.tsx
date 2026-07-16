import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { en } from "@/lib/i18n/messages/en";
import { vi } from "@/lib/i18n/messages/vi";

export type Locale = "vi" | "en";
type MessageKey = keyof typeof vi;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { vi, en };

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
  const [locale, setLocale] = useState<Locale>("vi");
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
