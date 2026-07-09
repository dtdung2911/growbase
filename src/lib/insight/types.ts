export type InsightState =
  | "first-day"
  | "under-plan-yesterday"
  | "over-plan-yesterday"
  | "no-transactions-yesterday"

export type InsightDescriptor = {
  state: InsightState
  i18nKey: string
  params: Record<string, string | number>
}
