# Prompt: Implement Fund Management — GrowBase

## Đọc trước khi bắt đầu
- `CLAUDE.md` — conventions, brand colors, coding rules
- `docs/03_FUND_BUSINESS_LOGIC.md` — 5 loại fund, 4 quy tắc nghiệp vụ cốt lõi

## Phạm vi
Implement toàn bộ Fund Management: API Routes, hooks, components, 4 trang/modal.

---

## DESIGN TOKENS — Fund type colors (không thay đổi)

```typescript
// src/types/app.ts — đảm bảo đã có
export const FUND_TYPE_CONFIG = {
  emergency:  { icon: '🛡️', color: '#E24B4A', bgColor: '#FCEBEB', label: 'Khẩn cấp' },
  sinking:    { icon: '🪣', color: '#EF9F27', bgColor: '#FAEEDA', label: 'Tích lũy' },
  goal:       { icon: '🎯', color: '#639922', bgColor: '#EAF3DE', label: 'Mục tiêu' },
  investment: { icon: '📈', color: '#7F77DD', bgColor: '#EEEDFE', label: 'Đầu tư' },
  freedom:    { icon: '🎀', color: '#0084DB', bgColor: '#E6F1FB', label: 'Tự do' },
} as const

export type FundType = keyof typeof FUND_TYPE_CONFIG
```

---

## TASK 1 — API Routes

### 1A. GET /api/funds — Lấy danh sách quỹ

```typescript
// src/app/api/funds/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Dùng view fund_overview đã có trong schema
  const { data, error } = await supabase
    .from('fund_overview')
    .select('*')
    .order('priority', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST — Tạo fund mới
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // Validate required fields
  if (!body.name || !body.fund_type || !body.household_id) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('funds')
    .insert({
      household_id:         body.household_id,
      name:                 body.name,
      description:          body.description || null,
      fund_type:            body.fund_type,
      icon:                 body.icon || FUND_TYPE_CONFIG[body.fund_type]?.icon,
      color:                body.color || FUND_TYPE_CONFIG[body.fund_type]?.color,
      monthly_contribution: body.monthly_contribution || 0,
      contribution_day:     body.contribution_day || 1,
      target_amount:        body.target_amount || null,
      target_date:          body.target_date || null,
      target_months_expense:body.target_months_expense || null,
      reset_monthly:        body.fund_type === 'freedom' ? true : false,
      priority:             body.priority || 5,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

### 1B. POST /api/funds/[id]/contribute — Nạp quỹ

```typescript
// src/app/api/funds/[id]/contribute/route.ts
// ĐÂY LÀ OPERATION QUAN TRỌNG NHẤT — phải đúng business logic

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, description, date, householdId, accountId } = await request.json()

  // Validate
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Số tiền không hợp lệ' }, { status: 400 })
  }

  // 1. Lấy thông tin fund hiện tại
  const { data: fund, error: fundErr } = await supabase
    .from('funds')
    .select('id, name, current_balance, household_id')
    .eq('id', params.id)
    .single()

  if (fundErr || !fund) {
    return NextResponse.json({ error: 'Không tìm thấy quỹ' }, { status: 404 })
  }

  const balanceAfter = fund.current_balance + amount
  const today = date || new Date().toISOString().split('T')[0]

  // 2. Tạo transaction chính (fund_contribution — TÍNH vào chi tiêu tháng)
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      household_id:             fund.household_id,
      amount,
      direction:                'out',
      transaction_type:         'fund_contribution',
      fund_id:                  params.id,
      account_id:               accountId || null,
      exclude_from_budget_report: false,  // nạp quỹ = chi tiêu bình thường
      description:              description || `Nạp ${fund.name}`,
      date:                     today,
      import_source:            'manual',
      created_by:               user.id,
    })
    .select('id')
    .single()

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  // 3. Tạo fund_transaction (lịch sử quỹ)
  const { error: ftErr } = await supabase
    .from('fund_transactions')
    .insert({
      household_id:       fund.household_id,
      fund_id:            params.id,
      transaction_type:   'contribution',
      amount,
      direction:          'in',
      balance_after:      balanceAfter,
      linked_transaction_id: tx.id,
      description:        description || null,
      transaction_date:   today,
      is_automatic:       false,
      created_by:         user.id,
    })

  if (ftErr) return NextResponse.json({ error: ftErr.message }, { status: 500 })

  // 4. Cập nhật fund.current_balance
  const { error: updateErr } = await supabase
    .from('funds')
    .update({ current_balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ data: { balanceAfter, transactionId: tx.id } })
}
```

### 1C. POST /api/funds/[id]/withdraw — Rút quỹ

```typescript
// src/app/api/funds/[id]/withdraw/route.ts
// RULE: fund_withdrawal KHÔNG tính vào chi tiêu — trigger DB tự set exclude_from_budget_report=true

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, description, date, householdId, accountId, categoryId } = await request.json()

  // Validate
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Số tiền không hợp lệ' }, { status: 400 })
  }

  // 1. Lấy fund và kiểm tra số dư
  const { data: fund } = await supabase
    .from('funds')
    .select('id, name, current_balance, household_id')
    .eq('id', params.id)
    .single()

  if (!fund) return NextResponse.json({ error: 'Không tìm thấy quỹ' }, { status: 404 })

  if (amount > fund.current_balance) {
    return NextResponse.json({
      error: `Số dư quỹ không đủ. Hiện có: ${fund.current_balance.toLocaleString('vi-VN')} ₫`
    }, { status: 400 })
  }

  const balanceAfter = fund.current_balance - amount
  const today = date || new Date().toISOString().split('T')[0]

  // 2. Tạo transaction (fund_withdrawal)
  // DB trigger tự động set exclude_from_budget_report = true
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      household_id:     fund.household_id,
      amount,
      direction:        'out',
      transaction_type: 'fund_withdrawal',  // trigger sets exclude_from_budget_report = true
      fund_id:          params.id,
      account_id:       accountId || null,
      category_id:      categoryId || null,
      description:      description || `Rút ${fund.name}`,
      date:             today,
      import_source:    'manual',
      created_by:       user.id,
    })
    .select('id')
    .single()

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  // 3. Tạo fund_transaction
  await supabase.from('fund_transactions').insert({
    household_id:          fund.household_id,
    fund_id:               params.id,
    transaction_type:      'withdrawal',
    amount,
    direction:             'out',
    balance_after:         balanceAfter,
    linked_transaction_id: tx.id,
    description,
    transaction_date:      today,
    is_automatic:          false,
    created_by:            user.id,
  })

  // 4. Cập nhật fund balance
  await supabase
    .from('funds')
    .update({ current_balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ data: { balanceAfter, transactionId: tx.id } })
}
```

### 1D. GET /api/funds/[id] — Fund detail + history

```typescript
// src/app/api/funds/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')

  // Fund detail từ view
  const { data: fund } = await supabase
    .from('fund_overview')
    .select('*')
    .eq('id', params.id)
    .single()

  // Transaction history
  const { data: history } = await supabase
    .from('fund_transactions')
    .select('id, transaction_type, amount, direction, balance_after, description, transaction_date, is_automatic')
    .eq('fund_id', params.id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json({ data: { fund, history } })
}

// PATCH — Cập nhật thông tin fund
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()

  // Chỉ cho phép update các field safe
  const allowed = ['name', 'description', 'monthly_contribution',
    'contribution_day', 'target_amount', 'target_date', 'icon', 'color',
    'status', 'priority', 'sort_order']

  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('funds')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

---

## TASK 2 — Data Hooks

### 2A. useFunds hook

```typescript
// src/lib/hooks/useFunds.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useActiveHousehold } from './useHousehold'
import { formatVND } from '@/lib/utils/currency'

export function useFunds() {
  const { householdId } = useActiveHousehold()

  return useQuery({
    queryKey: ['funds', householdId],
    queryFn: async () => {
      const res = await fetch('/api/funds')
      if (!res.ok) throw new Error('Failed to fetch funds')
      const { data } = await res.json()
      return data as FundOverview[]
    },
    enabled: !!householdId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useFundDetail(fundId: string) {
  return useQuery({
    queryKey: ['fund-detail', fundId],
    queryFn: async () => {
      const res = await fetch(`/api/funds/${fundId}`)
      if (!res.ok) throw new Error('Failed to fetch fund')
      const { data } = await res.json()
      return data
    },
    enabled: !!fundId,
  })
}

export function useContribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fundId, amount, description, date, accountId
    }: {
      fundId: string; amount: number; description?: string;
      date?: string; accountId?: string
    }) => {
      const res = await fetch(`/api/funds/${fundId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, date, accountId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Lỗi nạp quỹ')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate tất cả query liên quan
      queryClient.invalidateQueries({ queryKey: ['funds'] })
      queryClient.invalidateQueries({ queryKey: ['fund-detail'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fundId, amount, description, date, accountId, categoryId
    }: {
      fundId: string; amount: number; description?: string;
      date?: string; accountId?: string; categoryId?: string
    }) => {
      const res = await fetch(`/api/funds/${fundId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, date, accountId, categoryId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Lỗi rút quỹ')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] })
      queryClient.invalidateQueries({ queryKey: ['fund-detail'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Type definitions
export interface FundOverview {
  id: string
  household_id: string
  name: string
  fund_type: FundType
  icon: string
  color: string
  current_balance: number
  target_amount: number | null
  monthly_contribution: number
  target_date: string | null
  priority: number
  status: string
  effective_target: number | null
  progress_percent: number | null
  months_to_target: number | null
  reset_monthly: boolean
  per_member: boolean
  amount_per_member: number | null
}
```

---

## TASK 3 — UI Components

### 3A. FundCard component

```typescript
// src/components/funds/FundCard.tsx
'use client'
import { formatVND, formatVNDCompact } from '@/lib/utils/currency'
import { FUND_TYPE_CONFIG } from '@/types/app'
import type { FundOverview } from '@/lib/hooks/useFunds'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface Props {
  fund: FundOverview
  onContribute: (fund: FundOverview) => void
  onWithdraw: (fund: FundOverview) => void
}

export function FundCard({ fund, onContribute, onWithdraw }: Props) {
  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const progress = fund.progress_percent || 0
  const isUrgent = fund.fund_type === 'emergency' && progress < 50

  return (
    <div className="bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-3 mb-2 group hover:border-[var(--color-border-secondary)] transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-[9px] flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: config.bgColor }}
        >
          {config.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                {fund.name}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Nạp {formatVNDCompact(fund.monthly_contribution)}/tháng
                {fund.months_to_target && ` · ${fund.months_to_target} tháng nữa`}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                {formatVNDCompact(fund.current_balance)}
              </p>
              {fund.effective_target && (
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  / {formatVNDCompact(fund.effective_target)}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {fund.effective_target && (
            <>
              <div className="h-1 bg-[var(--color-background-secondary)] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: fund.color || config.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                {isUrgent && (
                  <span className="text-[11px] flex items-center gap-1" style={{ color: config.color }}>
                    <AlertCircle className="w-3 h-3" />
                    Ưu tiên nạp ngay
                  </span>
                )}
                <span className="text-[11px] text-[var(--color-text-secondary)] ml-auto">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </>
          )}

          {/* Freedom fund: show remaining this month */}
          {fund.fund_type === 'freedom' && fund.reset_monthly && (
            <>
              <div className="h-1 bg-[var(--color-background-secondary)] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((fund.current_balance / (fund.amount_per_member || 1)) * 100, 100)}%`,
                    background: '#0084DB',
                  }}
                />
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                {formatVNDCompact(fund.current_balance)} còn lại tháng này
              </p>
            </>
          )}
        </div>

        {/* Action arrow */}
        <Link href={`/funds/${fund.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </Link>
      </div>

      {/* Quick actions (on hover / always visible on mobile) */}
      <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-[var(--color-border-tertiary)]">
        <button
          onClick={() => onContribute(fund)}
          className="flex-1 text-[12px] py-1.5 rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          + Nạp quỹ
        </button>
        <button
          onClick={() => onWithdraw(fund)}
          disabled={fund.current_balance === 0}
          className={cn(
            'flex-1 text-[12px] py-1.5 rounded-lg transition-colors',
            fund.current_balance > 0
              ? 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              : 'opacity-40 cursor-not-allowed bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]'
          )}
        >
          Rút quỹ
        </button>
      </div>
    </div>
  )
}
```

### 3B. ContributeModal

```typescript
// src/components/funds/ContributeModal.tsx
'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useContribute } from '@/lib/hooks/useFunds'
import { useActiveHousehold } from '@/lib/hooks/useHousehold'
import { FUND_TYPE_CONFIG } from '@/types/app'
import { formatVND, formatVNDCompact } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { FundOverview } from '@/lib/hooks/useFunds'

const schema = z.object({
  amount: z.number().min(1000, 'Tối thiểu 1.000 ₫'),
  description: z.string().optional(),
  date: z.string(),
})

interface Props {
  fund: FundOverview | null
  open: boolean
  onClose: () => void
}

export function ContributeModal({ fund, open, onClose }: Props) {
  const contribute = useContribute()
  const config = fund ? FUND_TYPE_CONFIG[fund.fund_type] : null

  const { control, handleSubmit, setValue, watch, reset,
    formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: fund?.monthly_contribution || 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const amount = watch('amount')

  // Quick amount presets
  const presets = fund ? [
    { label: '50%',   value: Math.floor(fund.monthly_contribution * 0.5) },
    { label: 'Chuẩn', value: fund.monthly_contribution },
    { label: '2x',    value: fund.monthly_contribution * 2 },
  ] : []

  const onSubmit = async (data: any) => {
    if (!fund) return
    try {
      await contribute.mutateAsync({
        fundId: fund.id,
        amount: data.amount,
        description: data.description,
        date: data.date,
      })
      toast.success(`Đã nạp ${formatVND(data.amount)} vào ${fund.name}`)
      reset()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (!fund || !config) return null

  const balanceAfter = fund.current_balance + (amount || 0)
  const progressAfter = fund.effective_target
    ? Math.min((balanceAfter / fund.effective_target) * 100, 100)
    : null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[92vh] overflow-y-auto rounded-t-2xl bg-[var(--color-background-primary)] border-t border-[var(--color-border-tertiary)]">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl"
              style={{ background: config.bgColor }}>
              {config.icon}
            </div>
            <div>
              <SheetTitle className="text-left">Nạp {fund.name}</SheetTitle>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Số dư hiện tại: {formatVND(fund.current_balance)}
              </p>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount input */}
          <div>
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-1.5">Số tiền nạp</p>
            <Controller name="amount" control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  className="text-center text-2xl h-14"
                />
              )}
            />
            {errors.amount && (
              <p className="text-[11px] text-red-500 mt-1">{errors.amount.message}</p>
            )}

            {/* Quick presets */}
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setValue('amount', p.value)}
                  className={`py-2 rounded-lg text-[12px] transition-colors border ${
                    amount === p.value
                      ? 'border-[#0084DB] bg-[#E6F1FB] text-[#0084DB]'
                      : 'border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="block text-[10px] opacity-70">{p.label}</span>
                  {formatVNDCompact(p.value)}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="bg-[var(--color-background-secondary)] rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="text-[12px] text-[var(--color-text-secondary)]">Ngày</span>
            <input
              type="date"
              {...control.register('date')}
              className="flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] outline-none"
            />
          </div>

          {/* Description */}
          <div className="bg-[var(--color-background-secondary)] rounded-lg px-3 py-2.5">
            <input
              type="text"
              placeholder="Ghi chú (tùy chọn)"
              {...control.register('description')}
              className="w-full bg-transparent text-[12px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>

          {/* Balance after preview */}
          <div className="bg-[var(--color-background-secondary)] rounded-lg px-3 py-2.5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] text-[var(--color-text-secondary)]">Số dư sau khi nạp</span>
              <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {formatVND(balanceAfter)}
              </span>
            </div>
            {fund.effective_target && progressAfter !== null && (
              <div className="h-1.5 bg-[var(--color-background-primary)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressAfter}%`, background: config.color }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={contribute.isPending || !amount}
              className="bg-[#0084DB] hover:bg-[#006BB8] text-white"
            >
              {contribute.isPending ? 'Đang nạp...' : 'Nạp quỹ'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

### 3C. WithdrawModal

```typescript
// src/components/funds/WithdrawModal.tsx
// Tương tự ContributeModal nhưng có:
// 1. Banner xanh lá "không tính vào chi tiêu"
// 2. CategoryPicker (chọn danh mục chi tiêu liên quan)
// 3. AccountPicker (chọn tài khoản nhận tiền)
// 4. Validate: amount <= fund.current_balance
// 5. Button màu amber (#EF9F27) thay vì blue

// Banner warning:
<div className="bg-[#EAF3DE] border-l-[3px] border-[#639922] rounded-r-lg px-3 py-2.5 mb-4">
  <p className="text-[12px] text-[#27500A] leading-relaxed">
    Khoản rút này <strong>không</strong> tính vào chi tiêu tháng —
    báo cáo và budget hoàn toàn không bị ảnh hưởng.
  </p>
</div>

// Submit button:
<Button
  type="submit"
  style={{ background: '#EF9F27', color: '#412402' }}
  className="hover:opacity-90"
>
  Rút quỹ
</Button>
```

### 3D. FundForm (Tạo/Sửa quỹ)

```typescript
// src/components/funds/FundForm.tsx
// Dynamic form thay đổi theo fund_type

// Step 1: Chọn fund_type (5 cards với icon + màu + mô tả)
// Step 2: Nhập thông tin chung (name, description, monthly_contribution, contribution_day)
// Step 3: Thông tin đặc thù theo fund_type:
//   - emergency: target_months_expense (3/6/12 — button group)
//   - sinking:   target_amount (CurrencyInput) + target_date (DatePicker)
//   - goal:      target_amount + target_date + expected_return_rate + investment_vehicle
//   - investment:target_amount + expected_return_rate
//   - freedom:   amount_per_member + per_member toggle + reset_monthly (always true)

// fund_type selector layout (5 cards trong grid 2-3 cols):
const FUND_TYPE_OPTIONS = [
  { type: 'emergency',  ...FUND_TYPE_CONFIG.emergency,  desc: 'Dự phòng rủi ro bất ngờ' },
  { type: 'sinking',    ...FUND_TYPE_CONFIG.sinking,    desc: 'Tích lũy cho chi tiêu lớn' },
  { type: 'goal',       ...FUND_TYPE_CONFIG.goal,       desc: 'Mục tiêu tài chính dài hạn' },
  { type: 'investment', ...FUND_TYPE_CONFIG.investment,  desc: 'Tăng trưởng tài sản' },
  { type: 'freedom',    ...FUND_TYPE_CONFIG.freedom,    desc: 'Tiêu thoải mái hàng tháng' },
]
```

---

## TASK 4 — Pages

### 4A. Fund List Page

```typescript
// src/app/(app)/funds/page.tsx
'use client'
import { useState, useMemo } from 'react'
import { useFunds } from '@/lib/hooks/useFunds'
import { FundCard } from '@/components/funds/FundCard'
import { ContributeModal } from '@/components/funds/ContributeModal'
import { WithdrawModal } from '@/components/funds/WithdrawModal'
import { Skeleton } from '@/components/ui/skeleton'
import { formatVND, formatVNDCompact } from '@/lib/utils/currency'
import { Plus } from 'lucide-react'
import type { FundOverview } from '@/lib/hooks/useFunds'
import { FUND_TYPE_CONFIG } from '@/types/app'

// Group fund types với màu sắc nhãn
const FUND_GROUPS = [
  { type: 'emergency',  label: 'Quỹ khẩn cấp',           color: '#A32D2D' },
  { type: 'sinking',    label: 'Sinking funds — tích lũy', color: '#854F0B' },
  { type: 'goal',       label: 'Goal funds — mục tiêu',    color: '#3B6D11' },
  { type: 'investment', label: 'Investment fund',           color: '#3C3489' },
  { type: 'freedom',    label: 'Freedom funds',             color: '#185FA5' },
]

export default function FundsPage() {
  const { data: funds = [], isLoading } = useFunds()
  const [contributeFund, setContributeFund] = useState<FundOverview | null>(null)
  const [withdrawFund, setWithdrawFund] = useState<FundOverview | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Tính tổng
  const totalBalance = funds.reduce((s, f) => s + f.current_balance, 0)
  const activeFunds = funds.filter(f => f.status === 'active').length
  const totalMonthly = funds
    .filter(f => f.status === 'active')
    .reduce((s, f) => s + f.monthly_contribution, 0)

  // Group funds theo type
  const grouped = useMemo(() => {
    return FUND_GROUPS.map(group => ({
      ...group,
      funds: funds.filter(f => f.fund_type === group.type && f.status === 'active'),
    })).filter(g => g.funds.length > 0)
  }, [funds])

  if (isLoading) return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {Array(5).fill(0).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl bg-[var(--color-background-secondary)]" />
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-[var(--color-text-primary)]">Quỹ</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo quỹ
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng tiền quỹ', value: formatVNDCompact(totalBalance), color: 'text-[var(--color-text-primary)]' },
          { label: 'Số quỹ active', value: `${activeFunds} quỹ`,            color: 'text-[var(--color-text-primary)]' },
          { label: 'Nạp/tháng',    value: formatVNDCompact(totalMonthly),   color: 'text-[#0084DB]' },
        ].map(item => (
          <div key={item.label} className="bg-[var(--color-background-secondary)] rounded-xl p-3 text-center">
            <p className="text-[11px] text-[var(--color-text-secondary)] mb-1">{item.label}</p>
            <p className={`text-[16px] font-medium ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Fund groups */}
      {grouped.map(group => (
        <div key={group.type}>
          <p className="text-[11px] uppercase tracking-widest mb-2 font-medium"
            style={{ color: group.color }}>
            {group.label}
          </p>
          {group.funds.map(fund => (
            <FundCard
              key={fund.id}
              fund={fund}
              onContribute={setContributeFund}
              onWithdraw={setWithdrawFund}
            />
          ))}
        </div>
      ))}

      {/* Empty state */}
      {funds.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🪣</p>
          <p className="text-[var(--color-text-primary)] font-medium">Chưa có quỹ nào</p>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
            Tạo quỹ đầu tiên để bắt đầu tích lũy
          </p>
          <button onClick={() => setShowCreateForm(true)}
            className="mt-4 px-4 py-2 bg-[#0084DB] text-white rounded-lg text-[13px]">
            Tạo quỹ đầu tiên
          </button>
        </div>
      )}

      {/* Modals */}
      <ContributeModal
        fund={contributeFund}
        open={!!contributeFund}
        onClose={() => setContributeFund(null)}
      />
      <WithdrawModal
        fund={withdrawFund}
        open={!!withdrawFund}
        onClose={() => setWithdrawFund(null)}
      />
    </div>
  )
}
```

### 4B. Fund Detail Page

```typescript
// src/app/(app)/funds/[id]/page.tsx
'use client'
import { useState } from 'react'
import { useFundDetail } from '@/lib/hooks/useFunds'
import { ContributeModal } from '@/components/funds/ContributeModal'
import { WithdrawModal } from '@/components/funds/WithdrawModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, ArrowUpRight, Settings } from 'lucide-react'
import { formatVND, formatVNDCompact } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { FUND_TYPE_CONFIG } from '@/types/app'
import Link from 'next/link'

export default function FundDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useFundDetail(params.id)
  const [showContribute, setShowContribute] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  if (isLoading) return <Skeleton className="h-96 rounded-xl bg-[var(--color-background-secondary)]" />

  const fund = data?.fund
  const history = data?.history || []
  if (!fund) return <div>Không tìm thấy quỹ</div>

  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const progress = fund.progress_percent || 0

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <Link href="/funds" className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* Fund header */}
      <div className="bg-[var(--color-background-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: config.bgColor }}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-[16px] font-medium text-[var(--color-text-primary)]">{fund.name}</h1>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Nạp {formatVND(fund.monthly_contribution)}/tháng
              {fund.months_to_target && ` · Đủ trong ${fund.months_to_target} tháng`}
            </p>
          </div>
          <Link href={`/funds/${params.id}/settings`}>
            <Settings className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </Link>
        </div>

        {/* Balance + Progress */}
        <div className="bg-[var(--color-background-secondary)] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-[12px] text-[var(--color-text-secondary)]">Số dư hiện tại</p>
            <p className="text-[22px] font-medium text-[var(--color-text-primary)]">
              {formatVND(fund.current_balance)}
            </p>
          </div>
          {fund.effective_target && (
            <>
              <div className="h-2 bg-[var(--color-background-primary)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%`, background: config.color }} />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Còn thiếu {formatVNDCompact(Math.max(0, fund.effective_target - fund.current_balance))}
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">{progress.toFixed(1)}%</p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowContribute(true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0084DB] text-white text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Nạp quỹ
          </button>
          <button onClick={() => setShowWithdraw(true)}
            disabled={fund.current_balance === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--color-border-tertiary)] text-[var(--color-text-primary)] text-[13px] hover:bg-[var(--color-background-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ArrowUpRight className="w-4 h-4" /> Rút quỹ
          </button>
        </div>
      </div>

      {/* Tabs: History & Settings */}
      <Tabs defaultValue="history">
        <TabsList className="bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)]">
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt quỹ</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-3 space-y-2">
          {history.length === 0 && (
            <div className="text-center py-10 text-[var(--color-text-secondary)] text-[13px]">
              Chưa có giao dịch nào
            </div>
          )}
          {history.map((tx: any) => {
            const isIn = tx.direction === 'in'
            return (
              <div key={tx.id}
                className="flex items-center gap-3 p-3 bg-[var(--color-background-secondary)] rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isIn ? 'bg-[#EAF3DE]' : 'bg-[#FAEEDA]'
                }`}>
                  <span className="text-[13px]">{isIn ? '↓' : '↑'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--color-text-primary)] truncate">
                    {tx.description || (isIn ? 'Nạp quỹ' : 'Rút quỹ')}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {formatDate(tx.transaction_date)} · {tx.is_automatic ? 'Tự động' : 'Thủ công'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[13px] font-medium ${isIn ? 'text-[#3B6D11]' : 'text-[#854F0B]'}`}>
                    {isIn ? '+' : '−'}{formatVND(tx.amount)}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    = {formatVNDCompact(tx.balance_after)}
                  </p>
                </div>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="settings" className="mt-3">
          {/* Form chỉnh sửa fund: monthly_contribution, target_amount, target_date, etc. */}
          {/* Dùng FundForm component ở edit mode */}
          <p className="text-[13px] text-[var(--color-text-secondary)] text-center py-8">
            Fund settings form (implement tương tự FundForm nhưng pre-fill data)
          </p>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContributeModal fund={fund} open={showContribute} onClose={() => setShowContribute(false)} />
      <WithdrawModal fund={fund} open={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </div>
  )
}
```

---

## TASK 5 — Dashboard: FundOverview widget

```typescript
// src/components/dashboard/FundOverview.tsx
// Compact version cho dashboard — chỉ hiện top 4-5 funds cần chú ý nhất

// Priority hiển thị:
// 1. Emergency fund nếu < 50%
// 2. Sinking funds gần deadline nhất
// 3. Investment fund
// 4. Freedom funds

// Mỗi item: icon + tên + compact progress + balance
// Link "Xem tất cả →" về /funds
```

---

## Acceptance Criteria

### API
- [ ] `GET /api/funds` trả đúng danh sách theo household
- [ ] `POST /api/funds/:id/contribute` tạo đủ 3 records (transaction + fund_transaction + update balance)
- [ ] `POST /api/funds/:id/withdraw` validate số dư, tạo đủ records
- [ ] Withdraw transaction có `exclude_from_budget_report = true` (do DB trigger)
- [ ] `PATCH /api/funds/:id` chỉ update các field được phép

### Business Logic
- [ ] Nạp quỹ → balance tăng đúng số tiền
- [ ] Rút quỹ → balance giảm đúng, không cho rút quá số dư
- [ ] Rút quỹ không xuất hiện trong budget report tháng đó
- [ ] FundCard disable nút "Rút quỹ" khi balance = 0

### UI Fund List
- [ ] Funds nhóm theo 5 loại với màu label đúng
- [ ] Progress bar màu theo fund type
- [ ] Emergency fund < 50% hiện "Ưu tiên nạp ngay" + màu đỏ
- [ ] Freedom fund hiện "X còn lại tháng này"
- [ ] Summary: tổng tiền quỹ / số quỹ / nạp/tháng đúng
- [ ] Empty state có CTA

### UI ContributeModal
- [ ] 3 nút preset (50%, chuẩn, 2x) hoạt động
- [ ] Balance after preview cập nhật real-time
- [ ] Progress bar preview cập nhật real-time
- [ ] Toast success sau khi nạp
- [ ] Invalidate đúng queries

### UI WithdrawModal
- [ ] Banner "không tính vào chi tiêu" hiển thị
- [ ] Validate không cho nhập quá số dư
- [ ] CategoryPicker để link giao dịch
- [ ] Button màu amber (#EF9F27)

### UI Fund Detail
- [ ] Header: balance lớn + progress bar 8px
- [ ] 2 action buttons (Nạp + Rút)
- [ ] Tab lịch sử: phân biệt in (xanh lá) / out (cam)
- [ ] Hiện balance sau mỗi giao dịch
- [ ] Tab cài đặt: form chỉnh sửa fund

### Thứ tự thực hiện
```
TASK 1 (API) → TASK 2 (Hooks) → TASK 3A (FundCard) 
→ TASK 3B (ContributeModal) → TASK 3C (WithdrawModal)
→ TASK 4A (Fund List Page) → TASK 4B (Fund Detail Page)
→ TASK 5 (Dashboard widget)
```