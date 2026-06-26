## Kế hoạch thực hiện: Sprint S0 — Foundation (Schema + Seed + Next.js init)

### Phạm vi và mục tiêu

S0 là **Foundation sprint thuần hạ tầng** — KHÔNG có UI, KHÔNG có business logic ở app layer. Mục tiêu: dựng nền tảng để các sprint S1→S5 build trên đó.

Theo SPRINT PLAN: `S0 = Foundation: Schema + Seed + Next.js init | 3 days | US-9.01 partial, schema tasks`.

Hai trục công việc song song:
- **Trục A — DB Layer:** Toàn bộ schema SQL (enums, tables, RPC functions, triggers, RLS, seed) từ `04_TECHNICAL_SPEC.md`.
- **Trục B — App scaffold:** Khởi tạo Next.js 14, cài dependencies, shadcn/ui, cấu trúc thư mục, utils nền tảng, Supabase clients, query keys, Zustand store. KHÔNG implement feature.

---

### Stories trong scope

**US-9.01 — Vercel Deploy (phần S0 only)**

Tasks (S0):
- `npm create next-app@14` với TypeScript + Tailwind + App Router
- Install: supabase-js, @supabase/auth-helpers-nextjs, @tanstack/react-query@5, zustand, react-hook-form, zod, recharts, date-fns, lucide-react, sonner
- `npx shadcn-ui@latest init` (zinc, CSS variables)
- Add shadcn components: button, card, input, select, dialog, sheet, tabs, badge, progress, form, toast, sonner, skeleton, command, popover, drawer, dropdown-menu, separator, avatar, label, alert-dialog
- Run schema SQL trong Supabase
- Run seed SQL (cost_types, system category_groups, system categories)
- Set up `.env.local` với Supabase credentials

**AC (phần liên quan S0):**
```
Given RLS active Then no cross-household data leak
```

**Schema tasks (không có US ID — implied từ SPRINT PLAN):**
Toàn bộ schema từ `04_TECHNICAL_SPEC.md` mục 2, 3, 4, 6.2, 7.

---

### Business Rules áp dụng (cần được hiện thực hóa ở DB layer)

- **BR-CA-001** (DB): Trigger `set_transaction_behavior_type` set `behavior_type` từ `category.default_behavior_type` khi INSERT transaction.
- **BR-TX-001/002** (DB): Trigger force `exclude_from_budget_report=true` cho `fund_withdrawal` và `internal_transfer`.
- **BR-CO-002** (DB/RPC): `fund_contribute()` set `exclude_from_budget_report=false`.
- **BR-CO-003** (RPC): Fund operations atomic-only. `fund_contribute()` / `fund_withdraw()` lock row → INSERT → UPDATE trong 1 function.
- **BR-CO-001** (RPC): `fund_withdraw()` raise exception nếu `balance_after < 0`.
- **BR-DT-001** (DB): `recalculate_debt_budget()` + trigger `debt_budget_recalc`.
- **BR-FU-003** (DB): `reset_freedom_funds()` function cần tồn tại.
- **BR-SY-001/003** (RLS): Policies trên `categories` block write khi `is_system=true`.
- **BR-NW-001** (DB): UNIQUE constraint `(household_id, snapshot_month)`.
- **BR-NW-002** (DB): `discrepancy` GENERATED ALWAYS AS `(total_recorded - total_system)`.

---

### Tasks theo thứ tự

#### DB Layer (`supabase/migrations/`)

**1. `supabase/migrations/001_enums.sql` — Enums**
- Mục tiêu: Tạo 15 enum types theo TECHNICAL_SPEC 2.1.
- Enums: `household_type, currency_code, member_role, invitation_status, account_type, behavior_type, transaction_type, direction, fund_type, import_source, debt_type, debt_status, scheduled_period, expense_status`.
- Ghi chú: `fund_transactions.transaction_type` và `scheduled_payments.status` dùng **text + CHECK**, không dùng enum.

**2. `supabase/migrations/002_tables.sql` — Core tables**
- Mục tiêu: Tạo tất cả tables theo TECHNICAL_SPEC 2.2→2.7.
- Thứ tự bắt buộc (do FK): `households` → `household_members` → `household_invitations`, `income_sources`, `accounts` → `cost_types` → `category_groups` → `categories` → `budget_baselines`, `budget_overrides` → `funds` → `debt_entries` → `transactions` → `fund_transactions` → `net_worth_snapshots`, `scheduled_payments`, `estimated_expenses`.
- Phụ thuộc: task #1.
- Ghi chú quan trọng: **Circular FK** giữa `transactions` và `fund_transactions`: cần tạo `transactions` trước `fund_transactions`, dùng `ALTER TABLE ADD CONSTRAINT` sau cho `fund_transactions.linked_transaction_id`. Tất cả `numeric(15,0)` (VND).
- BR: BR-NW-001 (UNIQUE), BR-NW-002 (GENERATED column), Indexes cho transactions.

**3. `supabase/migrations/003_functions.sql` — RPC functions + triggers**
- Mục tiêu: Tạo functions/triggers từ TECHNICAL_SPEC 3.1→3.5 và 6.2.
- Functions: `fund_contribute()`, `fund_withdraw()`, `recalculate_debt_budget()` + trigger, `set_transaction_behavior_type()` + trigger (BEFORE INSERT), `reset_freedom_funds()`, `get_budget_with_actuals()`, `get_user_household_ids()`.
- Phụ thuộc: task #2.
- BR: BR-CO-003 (atomic + lock), BR-CO-001 (balance check), BR-CA-001 (BEFORE INSERT trigger).

**4. `supabase/migrations/004_rls.sql` — RLS policies**
- Mục tiêu: Enable RLS + policies theo TECHNICAL_SPEC mục 4.
- Ghi chú: Phải nhân bản pattern `select/insert/update/delete_own_household` cho TẤT CẢ tables được listed (không bỏ sót).
- Phụ thuộc: task #2, #3.
- ⚠️ BLOCKER: `household_members` và `household_invitations` chưa có policy mẫu trong spec — Architect cần quyết.

**5. `supabase/migrations/005_seed.sql` — System seed data**
- Mục tiêu: Seed `cost_types`, system `category_groups`, system `categories`.
- Ghi chú: KHÔNG seed `budget_baselines` — đó là việc của onboarding wizard (S1).
- ⚠️ BLOCKER: Income categories cần `default_behavior_type` NOT NULL nhưng `behavior_type` enum không có `income` — Architect phải quyết trước khi viết seed.
- Phụ thuộc: task #4.

#### App Layer (scaffold)

**6. Init Next.js 14 project** — root `/`
- `create-next-app@14` TypeScript + Tailwind + App Router + ESLint + src directory.
- Ghi chú: giữ nguyên `src/_workspace/` và `docs/` hiện có.

**7. Install dependencies**
- `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs` (hoặc `@supabase/ssr` — xem Rủi ro #7), `@tanstack/react-query@5`, `zustand`, `react-hook-form`, `zod`, `recharts`, `date-fns`, `lucide-react`, `sonner`.
- Phụ thuộc: task #6.

**8. Init shadcn/ui + components** — `components.json`, `src/components/ui/`
- `shadcn init` (zinc, CSS variables).
- Add 21 components: button, card, input, select, dialog, sheet, tabs, badge, progress, form, toast, sonner, skeleton, command, popover, drawer, dropdown-menu, separator, avatar, label, alert-dialog.
- Phụ thuộc: task #6, #7.

**9. Cấu trúc thư mục** — `src/`
- Tạo skeleton: `src/app/`, `src/components/[domain]/`, `src/lib/supabase/`, `src/lib/hooks/`, `src/lib/queries/`, `src/lib/stores/`, `src/lib/utils/`, `src/lib/validations/`, `src/types/`.
- Phụ thuộc: task #6.

**10. Supabase clients** — `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Browser client + server client. KHÔNG viết auth flow (S1).
- Phụ thuộc: task #7.

**11. Zustand store** — `src/lib/stores/appStore.ts`
- Interface đúng CLAUDE.md: `householdId`, `currentMonth` (default current month), `user`, setters.
- Phụ thuộc: task #7.

**12. Query keys factory** — `src/lib/queries/queryKeys.ts`
- Export `keys` factory theo CLAUDE.md: household, transactions, funds, budget, reports, debts, categories.
- Phụ thuộc: task #7.

**13. Utility functions** — `src/lib/utils/date.ts`, `currency.ts`, `budget.ts`, `cn.ts`
- Helpers theo TECHNICAL_SPEC mục 9: `monthRange`, `toYearMonth`, `firstDayOfMonth`, `formatVND`, `getBudgetStatus`, `cn`.
- Phụ thuộc: task #7, #8.

**14. `.env.local` + `.env.example`** — root
- `.env.example` với 3 biến (TECHNICAL_SPEC mục 8). KHÔNG commit secrets.
- Phụ thuộc: không.

**15. TanStack Query Provider** — `src/app/providers.tsx`
- `QueryClientProvider` + `Toaster` (sonner). Wrap trong root layout.
- Phụ thuộc: task #7, #8.

---

### Rủi ro / Điểm cần chú ý

**#1 [INFO] `internal_transfer` trong trigger:**
Trigger `set_transaction_behavior_type` check `transaction_type IN ('fund_withdrawal', 'internal_transfer')`. Enum CÓ `internal_transfer`. S0 chỉ cần đảm bảo enum + trigger đúng; transfer logic là S2.

**#2 [WARNING] Trigger chỉ BEFORE INSERT — không chạy khi UPDATE:**
Nếu user edit transaction đổi category, `behavior_type` sẽ KHÔNG tự cập nhật. BR-CA-001 nói "WHEN transaction is INSERT" — đúng spec, nhưng có thể là gap nghiệp vụ. Flag cho Business Review xác nhận: edit transaction có cần recompute behavior_type không?

**#3 [BLOCKER?] BR-TX-003 yêu cầu DB CHECK nhưng schema thiếu:**
BR-TX-003: `direction='out' AND is_unusual_income=true` không hợp lệ. Schema `transactions` không có CHECK constraint này. Mâu thuẫn BR vs schema. Cần Architect quyết: thêm CHECK constraint hay để app layer enforce?

**#4 [BLOCKER] RLS cho `household_members` và `household_invitations` chưa có policy:**
Spec KHÔNG có policy mẫu cho 2 bảng này. Client query trực tiếp sẽ fail. Cần Architect định nghĩa policies trước S1 (cần cho auth flow).

**#5 [BLOCKER] Budget template storage chưa được định nghĩa:**
Mục 7.3 ghi "copy from template" nhưng không định nghĩa template lưu ở đâu. KHÔNG seed budget_baselines trong S0. Cần Architect quyết: hardcode constant hay bảng riêng.

**#6 [TECHNICAL] Circular FK cần ALTER TABLE:**
`fund_transactions.linked_transaction_id → transactions(id)` — cần tạo `transactions` trước `fund_transactions`, sau đó `ALTER TABLE fund_transactions ADD CONSTRAINT`.

**#7 [BLOCKER] `@supabase/auth-helpers-nextjs` deprecated:**
Backlog ghi `auth-helpers-nextjs` nhưng Supabase đã deprecated, khuyến nghị `@supabase/ssr`. Ảnh hưởng toàn bộ auth architecture S1. Cần Architect quyết ở S0.

**#8 [INFO] SECURITY DEFINER functions bypass RLS:**
App layer (S2+) phải tự verify `household_id` thuộc user trước khi gọi RPC. Flag cho Senior Developer S2.

**#9 [BLOCKER] Income categories cần `default_behavior_type` NOT NULL:**
`behavior_type` enum không có `income`. Income categories (`cost_type='income'`) sẽ fail seed vì NOT NULL constraint. Cần Architect quyết.

**#10 [SUMMARY cho các agents tiếp theo]:**
- Business Review: xác nhận #2, #3 (quyết định nghiệp vụ)
- Architect: quyết #4, #5, #7, #9 (quyết định kỹ thuật/schema)
- Migration agent: xử lý #6, #9, nhân bản RLS pattern
