# Fixer Log: S1 — Auth + Onboarding Wizard

## Issues fixed

### CRITICAL
- [src/app/api/household/invite/route.ts:23-37] C1: Owner-check không bind household → nhận `householdId` từ body, query `household_members` với `.eq("household_id", householdId).eq("user_id", user.id).eq("role","owner").maybeSingle()`, INSERT invitation dùng `householdId`.
  - Phụ trợ: thêm `householdId: z.string().uuid()` vào `inviteSchema` (src/lib/validations/household.ts).
  - Phụ trợ: WizardStep2Invite dùng `inviteFormSchema = inviteSchema.omit({ householdId })` cho RHF, lấy `householdId` từ wizardStore, inject `{ ...values, householdId }` khi mutate + guard nếu chưa có household.
- [src/middleware.ts:29-35] C2: Household query thiếu ORDER BY/owner-bind → thêm `.eq("household_members.role","owner").order("created_at", { ascending: false }).limit(1).maybeSingle()`.
- [src/app/auth/callback/route.ts:26-32] C2: cùng pattern → fix tương tự.
- [src/app/api/household/route.ts:15-22 (GET) + 57-63 (POST existing-check)] C2: cùng pattern → fix cả 2 query, owner-bind + order by created_at desc.
- [supabase/migrations/003_functions.sql:358-365] C3: `accept_invitation` tin `p_user_id` mù quáng → thêm guard `IF p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Unauthorized'` ở đầu function.

### WARNING
- [src/app/setup/SetupClient.tsx:handleNext + handleSkip] W2: `mutateAsync` không try/catch → bọc try/catch (nuốt lỗi, toast đã xử lý qua onError) cho cả upsert (step 1) và complete (last step) trong cả handleNext và handleSkip.
- [src/lib/hooks/useHousehold.ts:3] W4: dead import `useQueryClient` → xóa.
- [src/components/onboarding/WizardStep7Budget.tsx:51-56] W5: pct input không clamp → `Math.min(100, Math.max(0, Number(e.target.value) || 0))`.
- [src/app/api/onboarding/complete/route.ts:63-80] W6: HTTP status sai → `Access denied` 401→403; thêm mapping `Household not found`→404; giữ `already completed`→409.

### MINOR
- [src/types/app.ts] M1: thêm `id: string` vào IncomeDraft/AccountDraft/DebtDraft.
- [WizardStep3Income/4Accounts/5Debt] M1: `add()` sinh `id: crypto.randomUUID()`, dùng `draft.id` làm key thay vì index.
- [src/components/onboarding/WizardStep7Budget.tsx:38,43,56,64] M4: `text-zinc-400`/`text-zinc-500` → `text-muted-foreground` (4 chỗ: amount line, Lock icon, span %, label Tổng). Giữ nguyên `text-rose-400`/`text-emerald-400` vì là màu semantic status, review không flag.

## Issues skipped

- W1 [src/lib/validations/onboarding.ts:26]: debt_type enum đã KHỚP 100% với DB enum `('bank_loan','credit_card','mortgage','personal')` trong 001_enums.sql:49. Không cần sửa.
- W3 [SetupClient.tsx:111 + WizardStep7Budget]: canProceed() selector pattern — review đánh dấu "Acceptable cho S1". Skip theo chỉ định (không bắt buộc).
- M2 [WizardStep5Debt.tsx:96-99]: remainingAmount hiển thị 0 thay vì rỗng — skip theo chỉ định (không bắt buộc, tốn thời gian vì CurrencyInput component nhận `value: number`).
- M3 [src/lib/validations/onboarding.ts:27]: `totalAmount: nonnegative()` → `positive()` — KHÔNG áp dụng. Xem "New issues" bên dưới: wizard không có UI input cho `totalAmount`, draft luôn khởi tạo `totalAmount: 0`, nên `.positive()` sẽ làm MỌI debt fail validation ở complete_onboarding → rollback toàn bộ onboarding. Áp dụng sẽ gây regression nặng hơn issue cosmetic ban đầu.
- M5 [invite/[token]/accept/route.ts]: review tự đánh dấu "Acceptable". Không trong scope yêu cầu.

## Files modified
- src/lib/validations/household.ts
- src/app/api/household/invite/route.ts
- src/components/onboarding/WizardStep2Invite.tsx
- src/middleware.ts
- src/app/auth/callback/route.ts
- src/app/api/household/route.ts
- supabase/migrations/003_functions.sql
- src/app/setup/SetupClient.tsx
- src/lib/hooks/useHousehold.ts
- src/components/onboarding/WizardStep7Budget.tsx
- src/app/api/onboarding/complete/route.ts
- src/types/app.ts
- src/components/onboarding/WizardStep3Income.tsx
- src/components/onboarding/WizardStep4Accounts.tsx
- src/components/onboarding/WizardStep5Debt.tsx

## New issues discovered (báo cáo, không tự handle)

1. **WizardStep5Debt thiếu UI input cho `totalAmount`** — Field `totalAmount` (DebtDraft) chỉ có UI cho `remainingAmount` ("Dư nợ còn lại") và `monthlyPayment`. `totalAmount` luôn = 0 từ `add()`, không bao giờ được user nhập. Đây là lý do KHÔNG fix M3 (`.positive()`). Cần quyết định nghiệp vụ: hoặc thêm input cho totalAmount, hoặc bỏ field totalAmount khỏi DebtDraft/payload nếu DB cho phép. Hiện DB `debt_entries.total_amount` — cần check constraint NOT NULL/CHECK trong 002_tables.sql trước khi quyết.

2. **C2 owner-binding thay đổi semantics của GET /api/household** — Trước đây query trả household bất kỳ user là member. Sau fix chỉ trả household user là OWNER. Member được mời (role=member/viewer) sẽ nhận `data: null` từ GET /api/household → middleware coi như chưa onboarded → redirect /setup. Với scope S1 (accept-invite chưa wired vào dashboard flow) chưa lộ, nhưng khi member flow hoạt động ở sprint sau, cần thiết kế riêng "household đang active của member" (không chỉ owner). Đúng theo yêu cầu fix của review (lấy household OWNER), nhưng ghi nhận để sprint sau xử lý member view.
