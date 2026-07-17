// Categorical palette for donut/bar slices. Kept separate from theme tokens (which are
// semantic, not categorical). hsl() comma syntax matches tokens.ts so RN parses it.
const LIGHT = [
  "hsl(204, 100%, 43%)",
  "hsl(174, 62%, 40%)",
  "hsl(265, 60%, 58%)",
  "hsl(33, 90%, 52%)",
  "hsl(350, 72%, 58%)",
  "hsl(145, 55%, 42%)",
  "hsl(191, 70%, 45%)",
  "hsl(25, 78%, 52%)",
]

const DARK = [
  "hsl(204, 90%, 60%)",
  "hsl(174, 55%, 52%)",
  "hsl(265, 65%, 70%)",
  "hsl(33, 85%, 62%)",
  "hsl(350, 75%, 68%)",
  "hsl(145, 50%, 55%)",
  "hsl(191, 65%, 58%)",
  "hsl(25, 80%, 62%)",
]

export function chartPalette(isDark: boolean): string[] {
  return isDark ? DARK : LIGHT
}
