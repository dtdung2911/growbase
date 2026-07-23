import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { txMonthVN } from "@growbase/shared/rules/date"

// Mirrors the web PUT/DELETE R3 guard: system-generated transactions are immutable.
const SYSTEM_TRANSACTION_TYPES = new Set([
  "internal_transfer",
  "fund_contribution",
  "fund_withdrawal",
])

// FR-8: a user may edit/delete only their own transactions in the current month.
// Enforced client-side only (no server-side ownership check exists) — see spec Design Notes.
export function canModifyTransaction(
  tx: TransactionWithJoins,
  myMemberId: string | null,
  currentMonth: string,
): boolean {
  if (!myMemberId || tx.member_id !== myMemberId) return false
  if (txMonthVN(tx.transaction_date) !== currentMonth) return false
  if (SYSTEM_TRANSACTION_TYPES.has(tx.transaction_type)) return false
  return true
}
