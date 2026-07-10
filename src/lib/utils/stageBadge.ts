export type StageBadgeContent =
  | { kind: "months"; stage: 1 | 2; months: number }
  | { kind: "plain"; stage: 1 | 2 }
  | { kind: "dream" }

// Text badge GĐ (D1 story 13.1): living plan chỉ biết CÒN bao lâu (stage end), không biết đã-ở-GĐ-bao-lâu.
// GĐ3 = toàn lực ước mơ (không số); stage end null/≤0 → chỉ "GĐ{n}" (chưa/không ước lượng được).
export function stageBadgeContent(
  stage: 1 | 2 | 3,
  stage1EndMonth: number | null,
  stage2EndMonth: number | null,
): StageBadgeContent {
  if (stage === 3) return { kind: "dream" }
  const months = stage === 1 ? stage1EndMonth : stage2EndMonth
  if (months == null || months <= 0) return { kind: "plain", stage }
  return { kind: "months", stage, months }
}
