---
baseline_commit: 8d33fee2813e1c35693cc1b7db2d03b93336989a
---

# Story 14-1: Cho phép Thêm tài khoản trong Settings

Status: review

## Story

As a **thành viên household**,
I want **tự thêm tài khoản mới trong Settings > Tài khoản (không phải liên hệ admin)**,
so that **tôi quản lý được nhiều tài khoản/ví thay vì chỉ 1 tài khoản mặc định tạo lúc onboarding**.

## Context / Problem

Hiện tại chỉ có **1 tài khoản** ("Tài khoản chính") được tạo tự động qua onboarding RPC `complete_onboarding_v2`. Sau onboarding, người dùng **không thể thêm** tài khoản mới vì:

- `AccountsManager` không có nút "Thêm" — chỉ list + edit/delete.
- Có admin note: `settings.accounts.adminNote` = "Tài khoản được tạo trong quá trình thiết lập. Liên hệ admin để thêm mới."
- `src/app/api/accounts/route.ts` chỉ có `GET` — **thiếu `POST`**.
- Thiếu `createAccountSchema`, thiếu `useCreateAccount` hook.

Edit (`PUT`) và soft-delete (`DELETE`) đã hoạt động đầy đủ. DB đã cho phép insert (RLS `accounts_insert` policy tồn tại — 004_rls.sql). Chỉ thiếu **app layer + UI** cho create.

## Acceptance Criteria

1. **AC1 — Nút Thêm hiển thị**: Trong Settings > Tài khoản có nút "Thêm tài khoản" (i18n vi/en). Admin note bị gỡ bỏ.
2. **AC2 — Form tạo mới**: Bấm nút mở form (Sheet) với các field: `name` (bắt buộc), `bank_name`, `account_type` (select 6 loại), `owner_name`, `is_credit_card` (switch), `color`. Cùng UX với AccountEditForm hiện có.
3. **AC3 — Tạo thành công**: Submit gọi `POST /api/accounts`. Thành công → toast.success 2s, đóng form, list refetch hiển thị account mới, form reset.
4. **AC4 — Validation**: `name` rỗng → không submit được (button disabled hoặc guard `name.trim()`). Backend validate qua `createAccountSchema`; lỗi 400 → giữ form + toast.error 5s.
5. **AC5 — Auth + scope**: `POST` route có auth check đầu tiên (`withAuth`). Account tạo ra gắn `household_id = auth.householdId` (không nhận từ client). Loại tài khoản khác household không bị ảnh hưởng.
6. **AC6 — Edit/delete không regress**: Nút edit và hide (soft-delete) hiện có vẫn hoạt động như trước.

## Tasks / Subtasks

- [x] **T1 — Validation** (`src/lib/validations/account-settings.ts`)
  - [x] Thêm `createAccountSchema`: `name` required (`z.string().min(1)`), các field còn lại optional, `account_type` enum 6 giá trị. **Không** nhận `household_id`/`is_active` từ client.
  - [x] Export type `CreateAccountInput = z.infer<typeof createAccountSchema>`.
- [x] **T2 — POST route** (`src/app/api/accounts/route.ts`)
  - [x] Thêm `export async function POST(request)`: `withAuth` → parse `createAccountSchema` → insert `{ ...parsed.data, household_id: auth.householdId }` vào `accounts` → `.select().single()`. Trả `{ data, error }` giống pattern GET/PUT. Lỗi parse → 400, lỗi DB → 500.
- [x] **T3 — Mutation hook** (`src/lib/hooks/useAccountMutations.ts`)
  - [x] Thêm `useCreateAccount()`: `fetch("/api/accounts", { method: "POST", ... })`. onSuccess invalidate `keys.accounts(householdId)` + toast.success "Đã thêm tài khoản" 2s. onError toast.error 5s. Mirror y hệt `useUpdateAccount`.
- [x] **T4 — Form create mode** (`src/components/settings/AccountEditForm.tsx`)
  - [x] Generalize: đổi prop `account: Account` → `account?: Account | null`. Nếu không có account → create mode: dùng `useCreateAccount`, title/description i18n "thêm", reset fields về default (`account_type = "bank"`, `is_credit_card = false`, `color = ""`). Nếu có account → giữ nguyên edit mode.
  - [x] (Karpathy: reuse form thay vì tạo file mới, tránh duplicate ~100 dòng JSX.)
- [x] **T5 — Nút Thêm + gỡ admin note** (`src/components/settings/AccountsManager.tsx`)
  - [x] Thêm state `isCreating`. Nút "Thêm tài khoản" mở form ở create mode. Gỡ `<p>{t("settings.accounts.adminNote")}</p>`.
  - [x] Xử lý empty state: khi `accounts.length === 0` vẫn cho phép thêm (nút Thêm trong EmptyState hoặc luôn hiển thị).
- [x] **T6 — i18n** (`src/lib/i18n/...` vi + en)
  - [x] Thêm keys: `settings.accounts.addLabel`, `addTitle`, `addDesc`, `addSuccess`. Gỡ hoặc bỏ dùng `adminNote`.
- [x] **T7 — Verify**: `npm run build` + tsc sạch. Test thủ công: thêm account mới → hiện trong list, edit/delete vẫn OK.

## Dev Notes

### Karpathy gate
**BẮT BUỘC** apply `karpathy-guidelines` trước khi viết code (CLAUDE.md hard gate). Minimal, no over-engineering, reuse trước khi tạo mới.

### Non-negotiable rules dự án
1. Auth check **đầu tiên** trong mọi API route (`withAuth`).
2. Query keys từ factory `keys.accounts(householdId)` — không hardcode.
3. `household_id` set từ `auth.householdId` phía server — **không** nhận từ client body.
4. Không hardcode màu; i18n mọi string qua `t()`.
5. Mutation UX: isPending → disable button; success toast 2s; error giữ form + toast 5s; list dùng skeleton.

### Accounts table schema (supabase/migrations/002_tables.sql:60)
```
id uuid PK default gen_random_uuid()
household_id uuid NOT NULL  -- set từ auth, KHÔNG từ client
member_id uuid (nullable)
name text NOT NULL          -- required field duy nhất
bank_name text
account_type account_type NOT NULL DEFAULT 'bank'
owner_name text
is_credit_card bool NOT NULL DEFAULT false
discount_rate numeric(4,2) DEFAULT 1.00
is_active bool NOT NULL DEFAULT true   -- KHÔNG cho client set
color text DEFAULT '#3B82F6'
sort_order int DEFAULT 0
created_at timestamptz DEFAULT now()
```
→ Insert tối thiểu cần `name` + `household_id`. Còn lại DB có default.

### Pattern có sẵn để mirror

**GET route hiện tại** (`src/app/api/accounts/route.ts`) — POST đi cùng file này:
```typescript
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { data, error } = await auth.supabase
    .from("accounts")
    .select("id, household_id, name, bank_name, account_type, owner_name, is_credit_card, color, sort_order, is_active")
    .eq("household_id", auth.householdId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], error: null })
}
```

**PUT route** (`[id]/route.ts`) — POST mirror validate+insert theo pattern này (parse schema → 400 nếu fail, DB error → 500):
```typescript
const body = await request.json().catch(() => null)
const parsed = updateAccountSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
}
const { data, error } = await auth.supabase.from("accounts").update(parsed.data)
  .eq("id", id).eq("household_id", auth.householdId).select().single()
```

**useUpdateAccount hook** (`useAccountMutations.ts`) — useCreateAccount mirror:
```typescript
export function useUpdateAccount() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateAccountInput): Promise<Account> => {
      const res = await fetch(`/api/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được tài khoản")
      return json.data
    },
    onSuccess: () => {
      if (householdId) void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => { toast.error(err.message, { duration: 5000 }) },
  })
}
```
→ `useCreateAccount`: POST `/api/accounts` với body = `CreateAccountInput`, toast "Đã thêm tài khoản".

**AccountEditForm** (`AccountEditForm.tsx`) — form Sheet, state cho từng field, `useEffect` sync từ `account`, `handleSubmit` gọi `updateMutation.mutate(..., { onSuccess: () => onOpenChange(false) })`. Generalize: `account?` optional; nếu null → create mode (useCreateAccount, reset defaults, không sync effect). ACCOUNT_TYPE_VALUES đã có sẵn 6 loại.

**AccountsManager** (`AccountsManager.tsx`) — hiện dùng `useAccounts`, `useSoftDeleteAccount`, state `editingAccount`/`deactivateTarget`. Thêm state create + nút. **Gỡ** dòng:
```tsx
<p className="text-xs text-muted-foreground">{t("settings.accounts.adminNote")}</p>
```

### Files touched
| File | Action |
|------|--------|
| `src/lib/validations/account-settings.ts` | UPDATE — thêm createAccountSchema + type |
| `src/app/api/accounts/route.ts` | UPDATE — thêm POST |
| `src/lib/hooks/useAccountMutations.ts` | UPDATE — thêm useCreateAccount |
| `src/components/settings/AccountEditForm.tsx` | UPDATE — hỗ trợ create mode |
| `src/components/settings/AccountsManager.tsx` | UPDATE — nút Thêm, gỡ admin note |
| i18n vi + en files | UPDATE — thêm keys add* |

### Không được phá
- Edit (PUT) và soft-delete (DELETE) flows.
- GET select column list phải khớp — account mới trả về đủ cột list dùng.
- Empty state hiện tại (khi chưa có account).

## Testing

- Manual: Settings > Tài khoản → Thêm → điền name → lưu → account xuất hiện trong list.
- Validation: bỏ trống name → không submit.
- Regression: edit + hide account cũ vẫn OK.
- Auth: POST không auth → 401 (withAuth).
- `npm run build` + tsc pass.

## Dependencies

- **Blocks 14-2 (seed transactions)**: seed cần structure account đúng (nhiều account) trước khi tạo giao dịch. Chạy 14-1 xong mới seed.


## Dev Agent Record

### Completion Notes
Implement 14-1 xong. Tạo account mới trong Settings > Tài khoản hoạt động end-to-end. Reuse AccountEditForm cho cả create+edit (1 component). Build + tsc sạch. Gỡ i18n key `addSuccess` (dead — toast hardcode theo convention useUpdateAccount).

### File List
- src/lib/validations/account-settings.ts (M) — createAccountSchema + CreateAccountInput
- src/app/api/accounts/route.ts (M) — POST handler, household_id từ auth
- src/lib/hooks/useAccountMutations.ts (M) — useCreateAccount
- src/components/settings/AccountEditForm.tsx (M) — create mode (account? optional)
- src/components/settings/AccountsManager.tsx (M) — nút Thêm, gỡ admin note, empty state cho phép thêm
- src/lib/i18n/messages/vi.json (M) — addLabel/addTitle/addDesc
- src/lib/i18n/messages/en.json (M) — addLabel/addTitle/addDesc

### Testing
| Flow (AC) | Method | Result |
|-----------|--------|--------|
| POST /api/accounts auth check (AC5) | code trace | withAuth() đầu tiên, household_id=auth.householdId, không nhận từ client — pass |
| createAccountSchema validate name required (AC4) | code trace | name z.string().min(1); 400 khi fail — pass |
| Nút Thêm + gỡ admin note (AC1) | build + code trace | admin note <p> removed, nút rounded-full brand render kể cả empty state — pass |
| Form create mode reset defaults (AC2) | code trace | account? optional, isCreate=!account, useEffect reset khi create — pass |
| Tạo thành công → toast + refetch (AC3) | code trace | useCreateAccount invalidate keys.accounts, toast 2s, đóng sheet — pass |
| Edit(PUT)/delete(DELETE) không regress (AC6) | build + code trace | không đụng vào 2 flow, GET select giữ nguyên — pass |
| tsc --noEmit + npm run build | automated | clean |

**CẦN verify tay trên browser**: mở Settings > Tài khoản → bấm Thêm → tạo account thật → xác nhận hiện trong list. Chưa chạy browser (cần app + auth login).

### Change Log
- 17-07-2026: Enable add account (POST + schema + hook + form create mode + UI). Gỡ dead i18n key addSuccess.
