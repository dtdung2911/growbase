// Ported from apps/web/src/app/globals.css / docs/06_STYLE_GUIDE.md.
// Values are hsl() strings (comma syntax, which RN's color parser accepts) so the
// authoritative HSL tokens are the single source of truth — no raw brand hex lives
// in the codebase.
export type ThemeColors = {
  background: string
  surface: string
  card: string
  elevated: string
  border: string
  primary: string
  primaryPressed: string
  primarySoft: string
  onPrimary: string
  textInk: string
  textBody: string
  textMuted: string
  textFaint: string
  success: string
  warning: string
  error: string
  info: string
}

export const lightColors: ThemeColors = Object.freeze({
  background: "hsl(210, 54%, 96%)",
  surface: "hsl(210, 40%, 97%)",
  card: "hsl(0, 0%, 100%)",
  elevated: "hsl(210, 30%, 93%)",
  border: "hsl(212, 45%, 93%)",
  primary: "hsl(204, 100%, 43%)",
  primaryPressed: "hsl(206, 100%, 27%)",
  primarySoft: "hsl(210, 100%, 96%)",
  onPrimary: "hsl(0, 0%, 100%)",
  textInk: "hsl(218, 30%, 16%)",
  textBody: "hsl(218, 24%, 22%)",
  textMuted: "hsl(215, 15%, 56%)",
  textFaint: "hsl(215, 17%, 70%)",
  success: "hsl(149, 62%, 36%)",
  warning: "hsl(33, 100%, 62%)",
  error: "hsl(9, 100%, 75%)",
  info: "hsl(191, 73%, 59%)",
})

export const darkColors: ThemeColors = Object.freeze({
  background: "hsl(209, 68%, 6%)",
  surface: "hsl(215, 30%, 8%)",
  card: "hsl(209, 45%, 10%)",
  elevated: "hsl(215, 25%, 12%)",
  border: "hsl(215, 20%, 16%)",
  primary: "hsl(204, 90%, 48%)",
  primaryPressed: "hsl(206, 90%, 34%)",
  primarySoft: "hsl(204, 40%, 14%)",
  onPrimary: "hsl(0, 0%, 100%)",
  textInk: "hsl(210, 20%, 92%)",
  textBody: "hsl(210, 20%, 92%)",
  textMuted: "hsl(215, 15%, 55%)",
  textFaint: "hsl(215, 12%, 38%)",
  success: "hsl(149, 50%, 42%)",
  warning: "hsl(33, 80%, 55%)",
  error: "hsl(9, 70%, 55%)",
  info: "hsl(191, 60%, 45%)",
})
