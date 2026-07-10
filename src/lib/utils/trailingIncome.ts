// Trailing 3-tháng thu nhập hộ gia đình (BR-OB-015) — dùng cho timeline engine.
// Chia cho SỐ THÁNG trong cửa sổ (không chỉ các tháng > 0): một tháng thu nhập 0 vẫn là quan
// sát thật, làm phẳng biến động thu nhập. VD [40, 0, 20] → 60/3 = 20 (khớp AC3 story 12.1).
// Fallback (income onboarding) CHỈ khi KHÔNG tháng nào > 0 — hộ chưa từng ghi thu nhập thực.
export function trailingHouseholdIncome(monthlyTotals: number[], fallback: number): number {
  const hasAnyIncome = monthlyTotals.some((t) => t > 0)
  if (!hasAnyIncome) return fallback
  const sum = monthlyTotals.reduce((acc, t) => acc + t, 0)
  return Math.round(sum / monthlyTotals.length)
}
