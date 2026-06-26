---
project: growbase
generated: 2026-06-25
language: Vietnamese
sections_completed:
  - tech-stack
  - language-rules
  - framework-rules
  - ui-component-rules
  - testing-rules
  - code-quality
  - anti-patterns
---

# GrowBase — Project Context for AI Agents

> Đây là tài liệu bắt buộc cho mọi AI agent implement code GrowBase.
> Đọc toàn bộ trước khi viết bất kỳ dòng code nào.

## 1. Tech Stack & Versions

```
Next.js 14 (App Router) · React 18 · TypeScript 5 (strict: true)
Tailwind CSS · shadcn/ui (Spike Admin blue theme)
Supabase JS v2 (SSR client, RLS enforced at DB level)
TanStack Query v5 · Zustand (global store)
Zod · React Hook Form · sonner (toasts)
@iconify/react (icons) · ApexCharts (charts)
Vitest (unit tests) · next-themes · custom i18n (TranslationContext)
```

## 2. Language-Specific Rules (TypeScript)

- `strict: true` — không dùng `any`, không dùng `as unknown as X`
- Import alias `@/*` maps to `src/*`. Luôn dùng `@/` không dùng relative path qua folder
- `"use client"` — bắt buộc trên mọi hook, component tương tác, store
- Server components = default (không có directive). **Không bao giờ** thêm `"use client"` vào API routes
- Async: luôn dùng `await`, không dùng `.then()` chains
- Error: `throw new Error(msg)` — không bao giờ throw string
- `error: string | null` — API error field là string, không phải object

## 3. Framework Rules (Next.js + Supabase)

### API Routes

```typescript
// TEMPLATE BẮT BUỘC cho mọi API route
export async function GET(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error  // returns 401 or 403 response

  // ... logic
  return NextResponse.json({ data: result, error: null })
}
```

- `withAuth()` từ `@/lib/supabase/auth-check` — **LUÔN gọi đầu tiên** trong mọi API route
- Response shape nhất quán: `{ data: T | null, error: string | null }` — **cả hai field phải có**
- Validate request body: `schema.safeParse(body)` → trả 400 nếu fail, message: `parsed.error.errors[0]?.message`
- Month param validation: `/^\d{4}-\d{2}$/.test(month)` — validate ở route, trả 400 nếu fail

### Fund / Balance Operations

- Fund balance mutations (contribute/withdraw) → **PHẢI dùng Supabase RPC**, không direct insert/update
- Vì: RPC là atomic transaction, bảo vệ data integrity — direct insert có thể corrupt balance
- Ví dụ: `auth.supabase.rpc("contribute_to_fund", { p_fund_id, p_amount, ... })`

### Immutable Fields

- `is_system = true` → record là system record, **không cho edit/delete**
- Kiểm tra `is_system` trước khi render nút edit/delete trong UI
- `behavior_type` → chỉ được set bởi DB trigger, **không bao giờ write từ app code**
- RLS ở Supabase enforce những rule này ở DB level — nhưng UI cũng phải guard

### Pages vs Client Components

```typescript
// Page = thin wrapper only
export default function FundsPage() {
  return <FundsClient />
}

// FundsClient.tsx = tất cả logic, state, queries
"use client"
export function FundsClient() { ... }
```

### Query Keys

```typescript
// ĐÚNG — luôn dùng factory từ @/lib/queries/queryKeys
import { keys } from "@/lib/queries/queryKeys"
queryKey: keys.funds(householdId)        // → ["funds", householdId]
queryKey: keys.transactions(hid, month)  // → ["transactions", hid, month]

// SAI — không bao giờ hardcode
queryKey: ["funds", householdId]
```

### Zustand Store

```typescript
// ĐÚNG — selector pattern
const householdId = useAppStore((s) => s.householdId)
const currentMonth = useAppStore((s) => s.currentMonth)

// SAI — không subscribe toàn bộ store
const store = useAppStore()
```

### Timezone

- `toYearMonth()` util dùng **local time (GMT+7 VN)**, không phải UTC
- Khi compare dates với server: server trả UTC, convert về local trước khi hiển thị

## 4. UI / Component Rules

### Icons

```typescript
// ĐÚNG — dùng @iconify/react
import { Icon } from "@iconify/react"
<Icon icon="solar:wallet-bold" className="h-5 w-5" />

// SAI — @lucide-react đã bị remove khỏi project
import { Wallet } from "lucide-react"
```

### Amounts & Currency

```typescript
// Amounts luôn dùng font-mono + formatVND utility
<span className="font-mono tabular-nums">{formatVND(amount)}</span>
<span className="font-mono tabular-nums">{formatVNDCompact(amount)}</span>
```

### i18n — Không bao giờ hardcode text

```typescript
// ĐÚNG
const { t } = useTranslation()
<p>{t("funds.balance")}</p>

// SAI — không bao giờ hardcode Vietnamese hoặc English text trong component
<p>Số dư</p>
```

### Colors & Tokens

- Chỉ dùng CSS vars: `text-foreground`, `bg-card`, `bg-background`, `border-border`
- Không hardcode hex color trong className hoặc style (trừ dynamic color từ data như fund.color)
- Shadow: `rgba(29, 77, 124, 0.08)` — blue-tinted, không phải black-based

### Loading States

```typescript
// ĐÚNG — skeleton cho lists
if (isLoading) return <SkeletonList count={5} />

// SAI — không dùng spinner cho lists
if (isLoading) return <Spinner />
```

### Mutations & UX

```typescript
// Button disable khi pending
<Button disabled={isPending}>
  {isPending ? "Đang lưu..." : "Lưu"}
</Button>

// Toast success: 2000ms
toast.success("Đã tạo quỹ", { duration: 2000 })

// Toast error: 5000ms, giữ form
toast.error(err.message, { duration: 5000 })
```

### Destructive Actions

"Destructive" = delete record, withdraw fund, archive item, remove member.

```typescript
// LUÔN show ConfirmDialog trước mutation destructive
<ConfirmDialog
  open={open}
  onConfirm={() => deleteMutation.mutate(id)}
  title="Xóa quỹ?"
  description="Hành động này không thể hoàn tác."
/>
```

### Component Design Tokens

```
Cards:     rounded-2xl border border-border/40 shadow-card
Buttons:   rounded-full (pill shape), hover: -translate-y-px
Inputs:    h-12 (48px height), focus-visible:ring-primary/20
Mobile:    min touch target 44px, pb-16 cho pages có bottom nav
```

## 5. Hook Pattern

```typescript
// src/lib/hooks/use{Entity}.ts — query + mutation cùng file
"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"

export function use{Entity}() {
  const householdId = useAppStore((s) => s.householdId)
  return useQuery({
    queryKey: keys.{entity}(householdId ?? ""),
    queryFn: async () => {
      const res = await fetch("/api/{entity}")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Lỗi tải dữ liệu")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}
```

## 6. Validation Schema Pattern

```typescript
// src/lib/validations/{entity}.ts
import { z } from "zod"

export const create{Entity}Schema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  amount: z.number().nonnegative("Số tiền không âm"),
})

export type Create{Entity}Input = z.infer<typeof create{Entity}Schema>
```

## 7. File Structure Rules

```
src/
├── app/
│   ├── (app)/           # Protected routes (requires auth)
│   │   └── {feature}/
│   │       └── page.tsx # Thin wrapper only → <FeatureClient />
│   ├── api/
│   │   └── {entity}/
│   │       ├── route.ts           # GET, POST
│   │       └── [id]/
│   │           └── route.ts       # GET, PATCH, DELETE
│   └── login/ setup/ auth/        # Public routes
├── components/
│   └── {feature}/
│       ├── {Feature}Client.tsx    # Main client component
│       ├── {Feature}Card.tsx      # Sub-components
│       └── {Feature}Form.tsx
├── lib/
│   ├── hooks/use{Entity}.ts       # TanStack Query hooks
│   ├── queries/queryKeys.ts       # Key factory (keys.*)
│   ├── stores/appStore.ts         # Zustand global store
│   ├── supabase/
│   │   ├── auth-check.ts          # withAuth() helper
│   │   └── server.ts              # createClient() server-side
│   ├── utils/                     # Pure utility functions
│   └── validations/{entity}.ts    # Zod schemas
└── types/app.ts                   # All domain types
```

## 8. Testing Rules

```
Framework: Vitest (vitest.config.ts at root)
Test location: src/__tests__/
  ├── stores/          # Zustand store unit tests
  └── validations/     # Zod schema unit tests

Scope: Unit tests cho pure functions, Zod schemas, store logic
Không mock Supabase client trong integration tests
Coverage: validation schemas phải có test đầy đủ edge cases
```

## 9. Critical Anti-Patterns

| ❌ SAI | ✅ ĐÚNG |
|--------|---------|
| Gọi Supabase trực tiếp từ component | Dùng API route + TanStack Query hook |
| Hardcode query key arrays `["funds", hid]` | Dùng `keys.funds(hid)` factory |
| Write `behavior_type` từ app code | Để DB trigger set tự động |
| Direct INSERT để thay đổi fund balance | Gọi RPC: `supabase.rpc("contribute_to_fund", ...)` |
| Bỏ qua `withAuth()` trong API route | Gọi `withAuth()` làm dòng đầu tiên |
| Lấy `householdId` từ URL/params | Lấy từ `useAppStore(s => s.householdId)` |
| Hardcode text `"Số dư"` trong component | Dùng `t("key")` từ `useTranslation()` |
| Import `lucide-react` | Import `@iconify/react` |
| Black-based shadows `rgba(0,0,0,0.1)` | Blue-tinted `rgba(29, 77, 124, 0.08)` |
| `"use client"` trên API route file | Không có directive trên route files |
| Render edit/delete khi `is_system=true` | Check `!record.is_system` trước khi show actions |
| Spinner cho list loading | `<SkeletonList />` component |
| Destructive mutation không confirm | Wrap trong `<ConfirmDialog />` trước |
