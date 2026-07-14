---
name: growbase-conventions
description: |
  Conventions, business rules, và patterns BẮT BUỘC của dự án GrowBase family finance app. Dùng skill này khi viết hoặc review BẤT KỲ code nào cho GrowBase — Next.js components, hooks, API routes, Supabase queries, UI components. Cập nhật lại skill mỗi khi hoàn thành một task hoặc fix bug xong để lưu lại patterns mới phát hiện.
---

# GrowBase Conventions & Patterns

Tài liệu này là **living document** — cập nhật sau mỗi task hoàn thành hoặc bug fix.

Đọc toàn bộ trước khi viết bất kỳ code GrowBase nào.

---

## Business Rules Tuyệt Đối (không được vi phạm)

### BR-CO-003: Fund Operations = Atomic RPC
```typescript
// ❌ SAI — sequential calls
await supabase.from('funds').update({ balance: newBalance })
await supabase.from('transactions').insert({ ... })

// ✓ ĐÚNG — atomic RPC
await supabase.rpc('fund_contribute', { p_fund_id, p_amount, p_note })
await supabase.rpc('fund_withdraw', { p_fund_id, p_amount, p_note })
```

### BR-CA-001: behavior_type = read-only
```tsx
// ❌ SAI — form field
<FormField name="behavior_type" ... />

// ✓ ĐÚNG — read-only display only
<Badge variant="outline">{transaction.behavior_type}</Badge>
```

### BR-SY-001: System Entities bất biến
```typescript
// UI: ẩn Edit/Delete
{!item.is_system && <Button>Edit</Button>}
{!item.is_system && <Button>Delete</Button>}

// API: reject tại server
if (item.is_system) {
  return NextResponse.json({ error: 'Cannot modify system entity' }, { status: 403 })
}
```

### BR-TX-001/002: exclude_from_budget_report = DB trigger
```typescript
// ❌ SAI — set từ client
body: { ...data, exclude_from_budget_report: true }

// ✓ ĐÚNG — không include field này, DB trigger tự set
body: { amount, category_id, note, transaction_date }
```

---

## Stack Conventions

### TypeScript
- `strict: true` — bắt buộc
- Không dùng `any` — dùng `unknown` + type guard
- Named exports (không default export cho utilities, hooks)
- Types > interfaces cho object shapes

### Component conventions
```typescript
// Server Component mặc định
export default function TransactionList() { ... }

// Client Component — chỉ khi cần event handlers/hooks/browser API
"use client"
export function TransactionForm() { ... }

// Props interface
interface TransactionCardProps {
  transaction: Transaction
  onDelete?: (id: string) => void
}
```

### State management
```typescript
// Zustand — dùng từ appStore, không tạo store mới cho householdId/currentMonth
const householdId = useAppStore(s => s.householdId)
const currentMonth = useAppStore(s => s.currentMonth)

// Không fetch lại nếu đã có trong store
```

### TanStack Query Keys
```typescript
// ❌ SAI — hardcode string
queryKey: ['transactions', householdId, currentMonth]

// ✓ ĐÚNG — factory function
import { keys } from '@/lib/queries/queryKeys'
queryKey: keys.transactions(householdId, currentMonth)
```

### shadcn/ui + Tailwind
```typescript
// ✓ ĐÚNG — dùng cn() cho conditional classes
import { cn } from '@/lib/utils/cn'
<div className={cn('base-class', isActive && 'active-class')} />

// ❌ SAI — template literal
<div className={`base-class ${isActive ? 'active-class' : ''}`} />
```

---

## Design System (Spike Admin Dashboard template)
- Framework: shadcn/ui + custom design tokens — based on Spike Admin Dashboard template
- Brand Primary: `#0084DB` · Hover: `#006BB8` · Pressed: `#004F8A` · Tint: `#EBF5FF` · Dark BG: `#05101A`
- Semantic: success `#49d68d` · warning `#ffbd6f` · error `#ff917d` · info `#49c8e6` · violet `#9b78ff`
- Background: cool blue-gray `#eef5fb` — cards white, creates depth contrast
- Text hierarchy: ink `#1d2737` → text `#2a3445` → muted `#7d8b9f` → faint `#a5b1c2`
- Shadows: all `none` (border-only depth) except `shadow-float` for FAB
- Cards: `rounded-[15px] border border-border bg-card` — no shadow, border-only depth
- Buttons: `rounded-full` pill shape, `hover:bg-primary-hover`, `active:bg-primary-pressed`
- Inputs: 48px min-height, focus glow `ring-primary/20`
- Sidebar: rounded-3xl float, notch active state (extends to right edge), user card at bottom
- Dark mode: `#05101A` bg, cards `hsl(209, 45%, 10%)`
- Font: Plus Jakarta Sans (body), JetBrains Mono (amounts)
- Icons: `@iconify/react` with `lucide:` prefix — NO `lucide-react` package
- i18n: vi (default) + en. All strings via `t()` from `useTranslation()`. No hardcoded strings
- Theme: light default, dark toggle. Floating ThemeToggle bottom-right on all pages + Settings > Appearance
- Language: switchable vi/en. Floating toggle bottom-right + Settings > Appearance
- Do NOT revert to copper/orange theme or introduce new color palettes

## Mobile-first Checklist

Kiểm tra trước khi done mọi component:

- [ ] Buttons: `h-11` hoặc `min-h-[44px]` (44px touch target iOS)
- [ ] Input fields: `text-base` (16px — tránh iOS auto-zoom)
- [ ] Pages có bottom nav: `pb-16` padding
- [ ] Test trên 375px viewport width

---

## Error Handling Patterns

```typescript
// List pages — skeleton, KHÔNG spinner
<Suspense fallback={<TransactionListSkeleton />}>
  <TransactionList />
</Suspense>

// Mutations — loading trên button
<Button disabled={isPending}>
  {isPending ? <Loader2 className="animate-spin" /> : null}
  Lưu
</Button>

// Success
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: keys.transactions(householdId, currentMonth) })
  onClose()
  toast.success('Đã lưu', { duration: 2000 })
}

// Error — giữ form mở
onError: (error) => {
  toast.error(error.message, { duration: 5000 })
  // KHÔNG đóng form
}

// Destructive — confirm dialog trước
<ConfirmDialog
  onConfirm={handleDelete}
  title="Xóa giao dịch?"
  description="Hành động này không thể hoàn tác."
/>
```

---

## API Route Pattern

```typescript
// src/app/api/[domain]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

const bodySchema = z.object({ ... })

export async function POST(req: NextRequest) {
  // 1. Auth check — bắt buộc đầu tiên
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate request body
  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  // 3. Business logic với Supabase
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.rpc('...', { ... })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

---

## Supabase Query Patterns

```typescript
// ✓ ĐÚNG — select cụ thể fields
const { data } = await supabase
  .from('transactions')
  .select('id, amount, note, category_id, created_at, categories(name, color)')
  .eq('household_id', householdId)
  .order('created_at', { ascending: false })

// ❌ SAI — select * không dùng toàn bộ
const { data } = await supabase.from('transactions').select('*')

// ✓ ĐÚNG — household isolation trong mọi query
.eq('household_id', householdId)  // bắt buộc
```

---

## File & Folder Conventions

```
src/
├── app/
│   ├── api/[domain]/[action]/route.ts    # API routes
│   └── (app)/[page]/page.tsx             # Pages
├── components/
│   └── [domain]/                         # domain-specific components
│       ├── [ComponentName].tsx           # 1 component = 1 file
│       └── [ComponentName].skeleton.tsx  # skeleton cho loading
├── lib/
│   ├── hooks/use[Name].ts               # TanStack Query hooks
│   ├── validations/[name].ts            # Zod schemas
│   ├── stores/appStore.ts               # Zustand (đừng tạo store mới)
│   └── utils/                           # Pure utilities
└── types/
    ├── database.ts                      # Generated từ Supabase
    └── app.ts                           # App-specific types
```

---

## Common Gotchas (bugs đã gặp)

> Mục này được cập nhật tự động sau mỗi bug fix.

- **Fund operations**: Phải dùng RPC `fund_contribute`/`fund_withdraw`. Sequential `.update()` + `.insert()` sẽ tạo race condition và không atomic.
- **Query keys**: Nếu hardcode string thay vì dùng `keys` factory, cache invalidation sẽ không hoạt động → stale data.
- **iOS zoom**: Input không có `text-base` (16px) sẽ bị iOS auto-zoom khi focus.
- **RLS bypass risk**: Luôn filter `household_id` dù RLS đã có, để explicit và readable.
- **SECURITY DEFINER bắt buộc `SET search_path = public, pg_temp`**: Thiếu → schema hijack risk. Thêm vào mọi SECURITY DEFINER function signature. (Phát hiện S0, fixed bởi fixer.)
- **SECURITY DEFINER bypass RLS → cần membership guard**: fund RPCs không check caller là member → cross-household access. Mỗi RPC có `p_household_id` param phải guard: `IF NOT (p_household_id = ANY(get_user_household_ids())) THEN RAISE EXCEPTION 'Access denied'; END IF;`
- **`ON CONFLICT DO NOTHING RETURNING id` trả NULL khi row đã tồn tại**: Pattern thường dùng trong invite accept. Fix: thêm fallback `SELECT id INTO v_id FROM table WHERE unique_condition` sau `IF v_id IS NULL THEN`.
- **Trigger membership guard với service-role**: Nếu trigger gọi function có `get_user_household_ids()` (dựa vào `auth.uid()`), cron/service-role job sẽ fail vì `auth.uid() = NULL`. Flag cho S5 khi implement scheduling.
- **`formatVND` output dùng NBSP (U+00A0)**: Node ICU dùng non-breaking space giữa số và ₫. Khi viết snapshot test component ở S1+, normalize whitespace hoặc dùng `.toContain()` thay `.toBe()`.
- **`getBudgetStatus` dùng strict `>` (không `>=`)**: Tại biên chính xác (actual = budget * 0.8 hoặc actual = budget), kết quả rơi vào nhánh "thấp hơn". Behavior đã test + document. Đối chiếu BA ở S4 Reports nếu spec cần inclusive.
- **`limit(1).maybeSingle()` PHẢI có `.order()` khi user có thể thuộc nhiều household**: Không ORDER BY → Postgres trả row không xác định. Luôn thêm `.eq("role","owner").order("created_at", { ascending: false })` để lấy household chính. (Phát hiện S1, fixed C2.)
- **`accept_invitation` RPC phải guard `auth.uid()` thay vì tin `p_user_id`**: RPC SECURITY DEFINER có thể bị gọi trực tiếp qua PostgREST; `p_user_id` từ client không đáng tin. Guard: `IF p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Unauthorized'`. (Phát hiện S1, fixed C3.)
- **Invite API route phải bind `householdId` từ body**: Query owner-check chỉ filter `user_id` → sai khi user thuộc nhiều household. Phải `.eq("household_id", householdId).eq("user_id", user.id).eq("role","owner")`. (Phát hiện S1, fixed C1.)
- **Wizard store phải persist localStorage**: Zustand `persist` middleware với key `'growbase-wizard'` để chịu refresh giữa onboarding. Xóa bằng `reset()` sau completion thành công.
- **Multi-table atomic persist = RPC, không sequential API**: Khi cần đảm bảo thứ tự INSERT (vd baselines phải tồn tại trước debts để trigger không no-op), dùng single SECURITY DEFINER RPC. Sequential client calls không đảm bảo thứ tự và không atomic. (Validated: `complete_onboarding` S1.)
- **`mutateAsync` trong event handler phải có `try/catch`**: Nếu không, unhandled promise rejection lan ra dù `onError` đã có toast. Pattern: `try { await mutate(); navigate() } catch { /* handled by onError */ }`.
- **`formatVND` output dùng ký hiệu `₫` (U+20AB) không phải `đ`**: Thực tế output là `"1.000.000 ₫"`. Test dùng `.toContain('1.000.000')` để tránh bị break bởi NBSP + ký hiệu currency.
- **Zustand v5 selector không được trả object/array mới mỗi render**: `useStore((s) => s.stepOrder())` sẽ loop nếu `stepOrder()` tạo `[]` mới. Dùng stable constants, primitive selectors, hoặc shallow equality cho derived arrays/objects.
- **driver.js (tour onboarding) — CSS phải load TRƯỚC globals.css**: `import "driver.js/dist/driver.css"` đặt trước `import "./globals.css"` trong `app/layout.tsx` để override `.driver-popover` trong globals.css thắng theo source order. JS thì `await import("driver.js")` trong hàm (không import top-level) → SSR-safe + code-split. Bước cuối = popover không `element` (centered); nút Done chạy `popover.onDoneClick` (KHÔNG phải onNextClick), phải tự gọi `tour.destroy()`. Prev ở bước đầu rơi vào nhánh destroy của driver → set `showButtons: ["next","close"]` cho bước đầu.
- **Tour target = attribute `data-tour` trơ**: gắn thẳng lên `<section>`; component tái sử dụng (vd `MetricCard`) thêm prop `tourId?: string` spread `data-tour={tourId}` (undefined → React bỏ qua, an toàn cho trang thật). Lọc step theo `document.querySelector` lúc chạy để bỏ section không render (StageBadge/StageEventCard/InviteCompanionPrompt gate `householdId` nên vắng ở demo onboarding).

---

## Patterns đã được validate

> Mục này được cập nhật khi team confirm pattern hoạt động tốt.

### S0 — Foundation

- **`@supabase/ssr` + cookies adapter**: `createServerClient` + `getAll/setAll` pattern từ `next/headers` hoạt động tốt với Next.js 14 App Router. Không dùng `auth-helpers-nextjs` (deprecated).
- **Budget template = TypeScript constant**: 18 dòng tĩnh hardcode trong `budgetTemplate.ts`, không seed vào DB. Tránh nullable FK + special RLS. Onboarding S1 INSERT rows từ constant này. "Phương tiện" links BOTH fixed + variable vehicle groups. All lines have non-empty `linkedCategoryGroupNames`.
- **`behavior_type` enum 7 values**: `income`, `fixed`, `variable`, `wasteful`, `debt_repayment`, `savings_investment`, `loan`. `loan` distinguishes receiving loans (direction=in) from repaying debt (direction=out). Reports filter `direction='out'` trước khi group behavior_type.
- **`get_user_household_ids()` SECURITY DEFINER STABLE**: Safe dùng trong SELECT policy (không recursion). Pattern chuẩn cho toàn bộ `own_household` RLS policies.
- **Invite token flow = SECURITY DEFINER RPC**: `get_invitation_by_token` + `accept_invitation` RPCs cho phép read/accept invitation trước khi user là member. Không dùng open-read policy.

### S1 — Auth + Onboarding

- **`complete_onboarding` RPC = single atomic transaction cho toàn bộ onboarding data**: income_sources → accounts → budget_baselines → debt_entries (trigger recalc tự chạy) → onboarding_completed=true. Thứ tự baselines-before-debts là bắt buộc.
- **Wizard state flow**: household upsert ngay step 1 (cần ID sớm cho invite), financial data (income/accounts/debts/budget) giữ ở wizardStore localStorage, persist atomic 1 lần ở completion. Không có API routes riêng cho income/accounts/debts trong onboarding.
- **Email invitation trong MVP = copy share link**: Không gửi email thật. API trả `{ inviteLink: /invite/${token} }`, UI hiển thị copy button. AC không yêu cầu email delivery.
- **Middleware exclude `/invite/*` khỏi onboarding gate**: Member mới chưa onboard sẽ bị loop redirect nếu không exclude. Dùng regex `^/invite/` trong PUBLIC_PATTERNS.
- **Debt step 5 = client-side preview only**: `debtPct() = SUM(drafts.monthlyPayment)/totalIncome*100` computed từ wizardStore, KHÔNG INSERT debt_entries. Persist thật chỉ ở completion RPC.
- **`canProceed()` gate per step (BR-OB-002)**: step 1 = householdType not null; step 3 = incomes≥1; step 4 = accounts≥1; step 7 = totalBudgetPct≤100; step 2/5/6 luôn pass (optional).
- **`p_budget_pcts` gửi từ app → RPC**: RPC nhận 18 lines với `name`, `budget_pct`, `linked_group_names[]`. Resolve group names → ids trong RPC, không hardcode SQL. Single source of truth = `budgetTemplate.ts`.
- **debtPct() guard div-by-zero**: `totalIncome() === 0 → return 0`. Không raise client-side.

### Sprint A — Category Restructure

- **20 category groups (was 17)**: Vehicle split fixed/variable ("Phương tiện xe cơ cố định" + "Phương tiện xe cơ phát sinh"), child expenses "Minnie" separated from "Giáo dục", health+personal care merged into "Chăm sóc cá nhân", 2 income groups merged into "Thu nhập", added "Chênh lệch ghi chép" (reconciliation) + "Dự trù tháng kế tiếp" (budget buffer) + "Vay nợ" (loan)
- **38 system categories (was 17)**: Each group has specific leaf categories matching actual family finance usage. See `005_seed.sql` for full list.
- **Spelling convention**: "hàng ngày" not "hằng ngày" — consistent throughout codebase

### Sprint B — Reports & Budget Enhancements

- **`goalText` field in BudgetTemplateLine**: Optional behavioral goal text per budget line (e.g., "Giới hạn cứng", "Kiểm soát hành vi"). Stored in `budgetTemplate.ts` constant, NOT in DB. Displayed in BudgetGroupRow expanded view via name-matching lookup: `BUDGET_TEMPLATE.find(tpl => tpl.name === line.cost_type_name)?.goalText`.
- **SpendingTab 2-level grouping**: Level 1 = behavior_type, Level 2 = category group. Builds `categoryId → groupName` map from `useCategories()` hook data. ReportsClient passes `categoryGroups` prop to SpendingTab. Expandable accordion UI per behavior type.
- **Category group data in reports**: `useCategories(householdId)` called in ReportsClient alongside existing `useTransactions()`. Categories data enables client-side category-to-group mapping without modifying transaction API query.

### Sprint C+D — Enhanced Features & New Modules

- **Responsive Table/Panel pattern**: Desktop (≥md) uses `<Table>` from `src/components/ui/table.tsx`. Mobile (<md) uses existing card/panel components. Toggle via `hidden md:block` / `md:hidden`. Applied to: TransactionList, ScheduledPaymentsClient, InvestmentClient, EventBudgetClient.
- **New tables added via `010_sprint_cd.sql`**: `investment_holdings` (UNIQUE household+stock_code), `investment_dca_plans` (UNIQUE household+stock_code, upsert pattern), `investment_purchases` (UNIQUE holding+month), `event_budgets`, `event_budget_items` (no household_id — ownership via parent FK).
- **DCA plan POST = upsert**: Uses `onConflict: "household_id,stock_code"` to match UNIQUE constraint.
- **Event budget items ownership**: Items don't have `household_id` — guard via parent `event_budgets.household_id` check before CRUD on items.
- **Status filter chip pattern**: Row of `<button>` elements with `rounded-full px-3 py-1` toggling between filter values. Active = `bg-primary text-primary-foreground`, inactive = `bg-muted`. Used in ScheduledPaymentsClient.
- **`scheduled_payments.expiry_date`**: New nullable date column for yearly subscriptions.

### Categories Redesign — Per-Household Cost Types + Editable Table

- **cost_types per household**: `cost_types` table now has `household_id` column. System rows (`household_id=NULL`) are templates. During onboarding, `clone_category_hierarchy()` clones cost_types → groups → categories per household. Each household has independent copies.
- **UNIQUE constraints split**: `cost_types_system_code` (WHERE household_id IS NULL) + `cost_types_household_code` (WHERE household_id IS NOT NULL). No global UNIQUE on `code`.
- **RLS on cost_types**: SELECT = system + household, INSERT/UPDATE/DELETE = household only.
- **useCategories hook**: Now queries `.eq("household_id", householdId)` only (no system rows). Household has its own copies.
- **3-level editable table**: CategoriesManager.tsx is an inline-editable table (desktop) / accordion (mobile). Level 0 = cost type, Level 1 = group, Level 2 = category. Inline rename via `InlineNameEditor`, inline add via `InlineAddRow`.
- **Category group CRUD added**: `useCategoryGroupMutations.ts` + `/api/category-groups/` routes. Previously only categories had CRUD.
- **"Biến đổi" renamed to "Phát sinh"**: `behavior.variable` i18n key updated.
- **Inline-added categories inherit behavior_type** from parent cost type's `code` — valid because codes = behavior_type enum values.

### Fund Management Sprint

- **FundType enum changed**: `emergency/sinking/goal/investment/freedom` (removed monthly_buffer/retirement/education/custom).
- **`FUND_TYPE_CONFIG` constant**: `src/types/app.ts` — icon, color, bgColor, label per fund type. Use this for all fund UI, don't hardcode colors.
- **`formatVNDCompact(amount)`**: `src/lib/utils/currency.ts` — compact format: 1.5tr, 500k, 2.1tỷ.
- **Fund CRUD via API**: POST create, PATCH update, DELETE (soft, 409 if balance > 0). Contribute/withdraw via existing RPC — NEVER rewrite as sequential calls.
- **Fund UI grouped by type**: FundList groups funds into 5 sections (emergency → sinking → goal → investment → freedom) with colored section headers.
- **FundForm 3-step wizard**: Step 1 = type selector (5 cards), Step 2 = common fields, Step 3 = type-specific fields.
- **ContributeModal presets**: 50% / Standard / 2x of monthly_contribution. Balance after preview with progress bar.
- **WithdrawModal**: Green info banner ("không tính chi tiêu"), amber #EF9F27 submit button, CategoryPicker required.
- **Fund Detail /funds/[id]**: Header + balance + progress, 2 action buttons, tabs (History table + Info metadata).
- **Modal ownership at parent level**: FundCard receives `onContribute`/`onWithdraw` callbacks, FundList manages modal state.

### Brand Assets

- **Logo assets phục vụ từ `public/brand/`**: Dùng `src/components/brand/BrandLogo.tsx` cho UI thay vì hardcode text/logo lại trong từng page. Metadata favicon/app icon trỏ tới `/brand/favicon-32.svg` và `/brand/icon-app-light.svg`.

---

## Technical Debt cần xử lý (tracked)

- **database.ts placeholder**: cần `supabase gen types typescript --local` sau khi apply migrations. Hiện tại `as unknown` cast che type errors.
- **@supabase/ssr@0.5.2 ↔ supabase-js@2.108.2 version mismatch**: `GenericSchema` import path đã bị xóa ở supabase-js 2.108. Cần align versions (downgrade js về ~2.46 hoặc nâng ssr). Workaround hiện tại: `as unknown as SupabaseClient<Database>`.
- **`totalAmount` field trong debt_entries**: Wizard không collect field này → luôn = 0. Cần design decision: thêm UI input hoặc làm nullable.
- **GET /api/household chỉ trả owner household**: Member được invite sẽ nhận null → redirect /setup. Cần "active household" concept cho member flow ở S2+.

---

## Cách cập nhật tài liệu này

Sau mỗi task hoàn thành hoặc bug fix, xem xét có gì cần thêm vào:

1. **Common Gotchas**: Bug vừa fix → thêm vào để tránh tái phát
2. **Patterns đã được validate**: Pattern mới work tốt → document lại
3. **Business Rules**: Phát hiện rule chưa document → thêm vào
4. **Conventions**: Discovered better approach → update với rationale

Chỉ thêm khi **non-obvious** — không document những gì đã rõ ràng từ TypeScript types hay component names.

---

*Cập nhật lần cuối: 2026-06-17 (bugfix runtime setup + Next patch)*
