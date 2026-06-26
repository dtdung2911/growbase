export const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)

export const formatVNDCompact = (amount: number): string => {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}tỷ`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}tr`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`
  return `${sign}${abs}đ`
}
