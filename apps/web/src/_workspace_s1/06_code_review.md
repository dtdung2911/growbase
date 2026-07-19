# Code Review: S1 — Auth + Onboarding Wizard

**Status: NEEDS_FIX** — 3 CRITICAL, 6 WARNING, 5 MINOR

---

## CRITICAL

### C1 — src/app/api/household/invite/route.ts:25-37
**Owner-check không bind household cụ thể**
Query `household_members` chỉ filter `user_id`, KHÔNG filter `household_id`. Nếu user là member nhiều household → lấy household ngẫu nhiên → invite bị tạo sai household.
**Fix:** Body nhận `householdId` + query với `.eq("household_id", householdId).eq("user_id", user.id).eq("role","owner")`.

### C2 — src/middleware.ts, src/app/auth/callback/route.ts, src/app/api/household/route.ts
**Household query `limit(1)` không có `.order()`**
Pattern `limit(1).maybeSingle()` không ORDER BY → Postgres trả row không xác định khi user thuộc nhiều household. Middleware đọc `onboarding_completed` sai → redirect sai. Sẽ nổ ngay khi accept-invite hoạt động trong S1.
**Fix:** Thêm `.eq("household_members.role","owner").order("created_at", { ascending: false })` để lấy household owner của chính user, không phải household được mời vào.

### C3 — supabase/migrations/003_functions.sql (cần verify)
**`accept_invitation` tin `p_user_id` thay vì `auth.uid()`**
Nếu RPC nhận `p_user_id` từ ngoài mà không verify `auth.uid()` = `p_user_id`, có thể bị impersonation qua PostgREST direct call.
**Fix:** Fixer đọc 003_functions.sql xác nhận RPC có guard `IF p_user_id <> auth.uid() THEN RAISE`. Nếu không có → thêm guard hoặc bỏ param và dùng `auth.uid()` nội bộ.

---

## WARNING

### W1 — src/lib/validations/onboarding.ts:24-32
`debtSchema.debtType` enum cần verify khớp DB enum `debt_type` trong 002_tables.sql. Nếu lệch → cast RPC fail → rollback toàn bộ onboarding.

### W2 — src/app/setup/SetupClient.tsx:71-91
`mutateAsync` không có `try/catch` → unhandled promise rejection. Bọc `try/catch` để nuốt lỗi (đã có `onError` toast).

### W3 — src/app/setup/SetupClient.tsx:111 + WizardStep7Budget.tsx
`canProceed()` selector pattern fragile. Acceptable cho S1 nhưng cân nhắc refactor sang value selector.

### W4 — src/lib/hooks/useHousehold.ts:3
Dead import `useQueryClient`. Xóa.

### W5 — src/components/onboarding/WizardStep7Budget.tsx:51-53
Budget pct input không clamp per-field. Fix: `Math.min(100, Math.max(0, Number(e.target.value) || 0))`.

### W6 — src/app/api/onboarding/complete/route.ts:64-74
HTTP status sai: `Access denied` → phải là 403 (không phải 401); `Household not found` → phải là 404.

---

## MINOR

### M1 — WizardStep3/4/5: `key={i}` index làm key cho field array có remove
Thêm stable id cho drafts, dùng làm key.

### M2 — WizardStep5Debt.tsx:96-99
`remainingAmount` luôn hiện 0 thay vì rỗng cho field optional.

### M3 — onboarding.ts:28
`totalAmount: nonnegative()` cho phép 0 — nên `.positive()`.

### M4 — WizardStep7Budget.tsx:38,56,64
Hardcode `text-zinc-400/500` thay vì `text-muted-foreground` design token.

### M5 — invite/[token]/accept/route.ts:19-21
Double round-trip resolve token (pre-check + RPC). Acceptable.

---

## Deviation Assessment

1. **shadcn native** — ACCEPT. Mobile-first OK (44px, 16px). Swap Radix sau.
2. **Version cast** — WARNING. Type-safety risk, không phải runtime. Fix sprint sau bằng align version + gen types.
3. **database.ts placeholder** — ACCEPT interim. Không ảnh hưởng runtime.

---

## Highlights (code tốt)

- `complete_onboarding` RPC atomic: auth guard → `FOR UPDATE` lock → baselines-before-debts ordering → trigger recalc đúng ✓
- BR-DT-001: WizardStep5 preview client-side only, không INSERT sớm ✓
- BR-BU-002: wizardStore auto-sync 'Chi trả nợ' + UI lock icon ✓
- BR-OB-001: middleware exclude `/invite/` đúng ✓
- Query keys: keys factory nhất quán, không hardcode ✓
- Error handling: toast 5000ms/2000ms pattern đúng ✓
