import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { txDateVN } from "@growbase/shared/rules/date"
import { z } from "zod"

const importRowSchema = z.object({
  transaction_date: z.string().min(1),
  amount: z.number().positive(),
  direction: z.enum(["in", "out"]),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid(),
  transaction_type: z.enum(["income", "expense"]).default("expense"),
})

const importBatchSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(500),
})

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = importBatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const { rows } = parsed.data
    const hid = auth.householdId

    const existing = await auth.supabase
      .from("transactions")
      .select("transaction_date, amount, description")
      .eq("household_id", hid)
      .eq("import_source", "csv")

    // Dedup theo NGÀY (VN) — transaction_date giờ là timestamptz nên chuẩn hóa về ngày
    // để giữ nguyên ngữ nghĩa chống trùng (cùng ngày + số tiền + mô tả = trùng).
    const existingSet = new Set(
      (existing.data ?? []).map((t) =>
        `${txDateVN(t.transaction_date)}|${t.amount}|${(t.description ?? "").slice(0, 50)}`
      )
    )

    const toInsert = []
    const duplicates = []

    for (const row of rows) {
      const key = `${txDateVN(row.transaction_date)}|${row.amount}|${(row.description ?? "").slice(0, 50)}`
      if (existingSet.has(key)) {
        duplicates.push(row)
        continue
      }
      existingSet.add(key)

      toInsert.push({
        household_id: hid,
        member_id: null,
        amount: row.amount,
        direction: row.direction,
        transaction_type: row.transaction_type,
        category_id: row.category_id ?? null,
        account_id: row.account_id,
        description: row.description ?? null,
        transaction_date: row.transaction_date,
        is_unusual_income: false,
        import_source: "csv" as const,
        is_duplicate: false,
      })
    }

    if (toInsert.length === 0) {
      return NextResponse.json({
        data: { inserted: 0, duplicates: duplicates.length },
        error: null,
      })
    }

    const { error } = await auth.supabase.from("transactions").insert(toInsert)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: { inserted: toInsert.length, duplicates: duplicates.length },
      error: null,
    })
  })
}
