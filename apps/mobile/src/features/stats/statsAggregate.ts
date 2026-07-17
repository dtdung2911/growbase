import type { TransactionWithJoins } from "@growbase/shared/types/app"
import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"

export type CategorySlice = {
  key: string
  name: string
  icon: string | null
  amount: number
  pct: number
}

export type GroupSlice = {
  key: string
  name: string
  amount: number
  pct: number
}

const OTHER_KEY = "__other__"

function isOutExpense(tx: TransactionWithJoins): boolean {
  return tx.direction === "out" && !tx.exclude_from_budget_report
}

export function aggregateByCategory(txns: TransactionWithJoins[], otherLabel: string): CategorySlice[] {
  const buckets = new Map<string, { name: string; icon: string | null; amount: number }>()
  let total = 0
  for (const tx of txns) {
    if (!isOutExpense(tx)) continue
    total += tx.amount
    const key = tx.category_id ?? OTHER_KEY
    const existing = buckets.get(key)
    if (existing) {
      existing.amount += tx.amount
    } else {
      buckets.set(key, { name: tx.category?.name ?? otherLabel, icon: tx.category?.icon ?? null, amount: tx.amount })
    }
  }
  return Array.from(buckets, ([key, b]) => ({
    key,
    name: b.name,
    icon: b.icon,
    amount: b.amount,
    pct: total > 0 ? (b.amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount)
}

export function aggregateByGroup(
  txns: TransactionWithJoins[],
  groups: CategoryGroupWithCategories[],
  otherLabel: string,
): GroupSlice[] {
  const categoryToGroup = new Map<string, string>()
  for (const group of groups) {
    for (const cat of group.categories) categoryToGroup.set(cat.id, group.name)
  }
  const buckets = new Map<string, number>()
  let total = 0
  for (const tx of txns) {
    if (!isOutExpense(tx)) continue
    total += tx.amount
    const name = categoryToGroup.get(tx.category_id) ?? otherLabel
    buckets.set(name, (buckets.get(name) ?? 0) + tx.amount)
  }
  return Array.from(buckets, ([name, amount]) => ({
    key: name,
    name,
    amount,
    pct: total > 0 ? (amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount)
}

export function topNWithOther(slices: CategorySlice[], n: number, otherLabel: string): CategorySlice[] {
  const named = slices.filter((s) => s.key !== OTHER_KEY)
  if (named.length <= n) return slices
  const existingOther = slices.find((s) => s.key === OTHER_KEY)
  const tail = named.slice(n)
  const amount = tail.reduce((s, x) => s + x.amount, 0) + (existingOther?.amount ?? 0)
  const pct = tail.reduce((s, x) => s + x.pct, 0) + (existingOther?.pct ?? 0)
  return [...named.slice(0, n), { key: OTHER_KEY, name: otherLabel, icon: null, amount, pct }]
}
