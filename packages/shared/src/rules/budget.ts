export const getBudgetStatus = (
  actual: number,
  budget: number
): "safe" | "warning" | "danger" => {
  if (actual > budget) return "danger"
  if (actual > budget * 0.8) return "warning"
  return "safe"
}
