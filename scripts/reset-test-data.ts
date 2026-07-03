// Dev-only: wipe toàn bộ dữ liệu test household-scoped, giữ nguyên system seed
// (7 cost_types / 20 category_groups / 38 categories, household_id IS NULL) và auth.users.
// Chạy: npm run db:reset-test — story 4.1, PRD onboarding-v2 FR21.
import { readFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Thứ tự bắt buộc con-trước-cha: category_groups/categories KHÔNG có ON DELETE CASCADE
// từ households (002_tables.sql), và transactions tham chiếu categories/accounts/funds
// không cascade — xoá households trực tiếp sẽ vỡ FK.
const DELETE_ORDER = [
  "fund_transactions",
  "transactions",
  "estimated_expenses",
  "scheduled_payments",
  "net_worth_snapshots",
  "budget_overrides",
  "budget_baselines",
  "debt_entries",
  "investment_purchases",
  "investment_dca_plans",
  "investment_holdings",
  "event_budget_items",
  "event_budgets",
  "funds",
  "categories",
  "category_groups",
  "cost_types",
  "income_sources",
  "accounts",
  "household_invitations",
  "household_members",
  "households",
] as const

// Các bảng chứa cả system rows (household_id IS NULL) — chỉ xoá rows của household.
const HOUSEHOLD_NULLABLE_TABLES = new Set(["categories", "category_groups", "cost_types"])

// Số kỳ vọng theo docs/01 + Google Sheet — seed hiện tại lệch (categories 35/38),
// nên chỉ warn khi lệch; script fail cứng duy nhất khi CHÍNH NÓ làm mất system rows.
const EXPECTED_SYSTEM_SEED: Record<string, number> = {
  cost_types: 7,
  category_groups: 20,
  categories: 38,
}

function loadEnvLocal(): void {
  let raw: string
  try {
    raw = readFileSync(".env.local", "utf8")
  } catch {
    throw new Error("Không đọc được .env.local — chạy script từ project root")
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
    }
  }
}

async function deleteHouseholdRows(db: SupabaseClient, table: string): Promise<number> {
  let query = db.from(table).delete({ count: "exact" })
  query = HOUSEHOLD_NULLABLE_TABLES.has(table)
    ? query.not("household_id", "is", null)
    : query.neq("id", "00000000-0000-0000-0000-000000000000")
  const { count, error } = await query
  if (error) throw new Error(`Xoá ${table} thất bại: ${error.message}`)
  return count ?? 0
}

async function countSystemSeed(db: SupabaseClient): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const table of Object.keys(EXPECTED_SYSTEM_SEED)) {
    const { count, error } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .is("household_id", null)
      .eq("is_system", true)
    if (error) throw new Error(`Đếm system seed ${table} thất bại: ${error.message}`)
    counts[table] = count ?? 0
  }
  return counts
}

function verifySystemSeed(before: Record<string, number>, after: Record<string, number>): void {
  for (const [table, expected] of Object.entries(EXPECTED_SYSTEM_SEED)) {
    if (after[table] !== before[table]) {
      throw new Error(
        `Script làm mất system seed: ${table} ${before[table]} → ${after[table]} rows`
      )
    }
    if (after[table] !== expected) {
      console.warn(`⚠️  ${table}: ${after[table]} system rows, docs kỳ vọng ${expected} — seed drift, xử lý riêng`)
    }
  }
}

async function main(): Promise<void> {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local")
  }

  const db = createClient(url, serviceKey)

  const { count: householdCount, error: countError } = await db
    .from("households")
    .select("id", { count: "exact", head: true })
  if (countError) throw new Error(`Không đếm được households: ${countError.message}`)

  console.log(`Target: ${url}`)
  console.log(`Households hiện có: ${householdCount ?? 0}`)
  console.log("Sẽ xoá TOÀN BỘ dữ liệu household-scoped. System seed + auth users giữ nguyên.")

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question('Gõ "RESET" để xác nhận: ')
  rl.close()
  if (answer.trim() !== "RESET") {
    console.log("Huỷ — không xoá gì.")
    return
  }

  const seedBefore = await countSystemSeed(db)

  let total = 0
  for (const table of DELETE_ORDER) {
    const deleted = await deleteHouseholdRows(db, table)
    total += deleted
    console.log(`  ${table}: ${deleted} rows`)
  }

  const seedAfter = await countSystemSeed(db)
  verifySystemSeed(seedBefore, seedAfter)
  console.log(
    `Xong. Đã xoá ${total} rows. System seed nguyên vẹn (${seedAfter.cost_types}/${seedAfter.category_groups}/${seedAfter.categories}).`
  )
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
