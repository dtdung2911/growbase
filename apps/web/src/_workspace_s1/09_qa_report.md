# QA Report: Sprint S1 — Auth + Onboarding Wizard (US-1.01→1.05, US-2.01→2.02)

> Final validation sau toàn bộ pipeline. Cross-boundary comparison (API ↔ Hook ↔ DB).
> Verdict: **PASS** (0 critical, 4 warnings, 1 minor) — có known issues đã document.

---

## Cross-Boundary Checks

### 1. POST /api/onboarding/complete ↔ useCompleteOnboarding
✓ **API ↔ Hook shape consistent.**
- Hook gửi `CompleteOnboardingInput` (`{ householdId, incomes, accounts, debts, budgetPcts }`) → route parse đúng bằng `completeOnboardingSchema` (cùng schema, cùng type). Khớp 100%.
- Route map camelCase → snake_case đúng khi gọi RPC: `sourceName→source_name`, `monthlyAmount→monthly_amount`, `bankName→bank_name`, `accountType→account_type`, `isCreditCard→is_credit_card`, `creditorName→creditor_name`, `debtType→debt_type`, `totalAmount→total_amount`, `remainingAmount→remaining_amount`, `monthlyPayment→monthly_payment`, `expectedEndDate→expected_end_date`, `linkedCategoryGroupNames→linked_group_names` (route.ts:25-53).
- Response `{ data: { householdId } }` ↔ hook đọc `json.data` → `{ householdId }`. `onSuccess({ householdId })` đúng shape.
- Error format `{ error: string }` → hook `onError` đọc `json.error` đúng. Status mapping 403/404/409/500 đầy đủ.
- Invalidation: `keys.household(householdId)` + `keys.budget(householdId, currentMonth)` + `keys.debts(householdId)` — đúng và đủ phạm vi (income+accounts+baselines+debt đều thuộc household này).

### 2. POST /api/household/invite ↔ useCreateInvite (sau fixer C1)
✓ **API ↔ Hook shape consistent.**
- C1 fix verified: route nhận `householdId` từ body và query `household_members` với `.eq("household_id", householdId).eq("user_id", user.id).eq("role","owner")` (route.ts:25-31). Không còn lấy household ngẫu nhiên.
- `inviteSchema` đã thêm `householdId: z.string().uuid()` (household.ts:10). Hook gửi `InviteInput` đầy đủ field `householdId` — WizardStep2Invite inject từ wizardStore.
- Response `{ data: { token, inviteLink } }` ↔ hook `CreateInviteResult` khớp.

### 3. POST /api/household/invite/[token]/accept ↔ useAcceptInvite
✓ Response `{ household_id, member_id, alreadyMember }` ↔ hook `AcceptInviteResult` khớp. Status 410/404/409/500 mapping đúng. alreadyMember pre-check (route.ts:18-41) trả 200 đúng contract.

### 4. RPC complete_onboarding (006) ↔ API route
✓ **Signature + jsonb structure consistent.**
- Param names snake_case khớp: `p_household_id, p_income_sources, p_accounts, p_debt_entries, p_budget_pcts` (route.ts:55-61 ↔ 006:21-27).
- jsonb fields route gửi khớp `jsonb_array_elements(...)->>'field'` trong RPC: income (`source_name, monthly_amount, member_id`), accounts (`name, bank_name, account_type, owner_name, is_credit_card`), debts (`creditor_name, debt_type, total_amount, remaining_amount, monthly_payment, expected_end_date, member_id`), budget (`name, budget_pct, linked_group_names`). Tất cả khớp.

### 5. POST/GET /api/household ↔ useHousehold / useUpsertHousehold
✓ Response `{ id, name, household_type, currency, onboarding_completed }` ↔ type `Household` (app.ts:17-23) khớp. Hook đọc `data.household_type`, `data.currency` — đúng field.

### 6. wizardStore ↔ SetupClient
✓ SetupClient import đúng `useWizardStore` + dùng đúng actions: `setHousehold`, `next`, `prev`, selector `stepOrder()`, `totalSteps()`, `canProceed()`. `stepOrder()` điều phối render `currentStep===N && <WizardStepN />` đúng (SetupClient.tsx:127-138). `buildCompletePayload` strip `isAutoCalculated` (chỉ gửi name/budgetPct/linkedCategoryGroupNames) — đúng shape Zod (Zod cũng strip key thừa).

### 7. useCategories ↔ WizardStep6Categories
✓ Hook shape `CategoryGroupWithCategories[]` (id, name, color, categories[]) ↔ component đọc `group.color`, `group.name`, `group.categories[].name`. Khớp. RLS cho phép đọc system groups/categories (xác nhận bên dưới).

### 8. budgetTemplate.linkedCategoryGroupNames ↔ seed category_groups (Hook ↔ DB)
✓ **15/15 named groups match exactly** (so sánh trực tiếp budgetTemplate.ts ↔ 005_seed.sql:31-50). "Quỹ đệm tháng kế tiếp" cố ý `[]` → RPC trả `'{}'` không raise. "Tiết kiệm & Quỹ" → link `["Tiết kiệm"]` → seed có "Tiết kiệm" ✓.

---

## Business Rules

✓ **BR-OB-001** (middleware redirect): `PUBLIC_PATTERNS` exclude `/^\/invite\//` → `/invite/abc` PASS (không bị chặn). User chưa onboard + path≠/setup → redirect /setup; onboarded + /login|/setup → /dashboard (middleware.ts:38-53). Auth callback + middleware đều owner-bind + order by created_at desc (C2 fix applied).
✓ **BR-OB-002** (canProceed gate): step 1 = householdType≠null, step 3 = incomes≥1, step 4 = accounts≥1, step 7 = totalBudgetPct≤100 (wizardStore.ts:86-100). Đúng spec.
✓ **BR-OB-003** (step count): `stepOrder()` family=[1..7], personal=[1,3,4,5,6,7]; `totalSteps()` 7/6 (wizardStore.ts:63-68). Đúng.
✓ **BR-OB-004** (upsert): POST /api/household check existing owner household → UPDATE thay vì INSERT (route.ts:58-80). Đúng.
✓ **BR-OB-005** (completion): RPC step 7 `UPDATE households SET onboarding_completed=true` (006:146-149). Đúng.
✓ **BR-BU-001** (total>100 block): `canProceed()` step 7 `totalBudgetPct()≤100` → `nextDisabled`; refine `completeOnboardingSchema` chặn server-side; UI hiển thị màu rose khi over (WizardStep7Budget.tsx:18,68-75). Tầng client+server đều chặn.
✓ **BR-BU-002** ('Chi trả nợ' locked khi debts>0): `setDebts` auto-sync pct = `debtPct()` khi có debts (wizardStore.ts:126-145); WizardStep7Budget render lock icon + `disabled` input (lines 29,41-49). Đúng.
✓ **BR-DT-001** (step 5 = client preview only): WizardStep5Debt chỉ gọi `setDebts` (mutate store), KHÔNG fetch/INSERT (WizardStep5Debt.tsx — không có import hook nào). Persist atomic ở completion. Regression test khẳng định. Đúng.

---

## Technical Constraints

### RLS & Security
✓ RPC `complete_onboarding` có auth guard `IF NOT (p_household_id = ANY(get_user_household_ids())) → RAISE 'Access denied'` (006:37-39) — thay thế RLS bypass do SECURITY DEFINER.
✓ `accept_invitation` (003) **C3 fix verified**: guard `IF p_user_id IS DISTINCT FROM auth.uid() THEN RAISE 'Unauthorized'` ở đầu function (003:362-365). Chặn impersonation qua PostgREST direct call.
✓ `complete_onboarding`, `accept_invitation`, `get_invitation_by_token` đều `SECURITY DEFINER SET search_path = public, pg_temp` (006:154, 003).
✓ Mọi API route check session (`auth.getUser()` → 401 nếu !user) trước khi query DB.
✓ RLS không thêm table mới ở S1 — income/accounts/baselines/debt đã đủ policy ở S0. `categories_select USING (household_id IS NULL OR ...)` + `category_groups_select USING (true)` → system entities đọc được cho Step6.

### Mobile-first
✓ Buttons: tất cả size variant `min-h-[44px]` / `h-11` / `min-h-[48px]` (button.tsx:21-25).
✓ Inputs: Input + CurrencyInput đều `min-h-[44px] text-base` (16px) → tránh iOS zoom (input.tsx:12, CurrencyInput.tsx:61).
✓ WizardLayout footer `pb-16` (WizardLayout.tsx:54); main `pb-28` thêm clearance cho sticky footer. `max-w-lg` mobile-first.

### Query Keys
✓ Không hardcode string. Tất cả dùng `keys.*` factory: `keys.household`, `keys.budget`, `keys.debts`, `keys.categories`. Invalidation đúng phạm vi.

### Error Handling Pattern
✓ Step6 list dùng skeleton (`CategorySkeleton` animate-pulse), KHÔNG spinner.
✓ Mutation: `isPending` → button `disabled` + `Loader2` spin (WizardLayout.tsx:78-82).
✓ Success: `reset()` + `toast.success("Đã lưu", { duration: 2000 })` + redirect (useCompleteOnboarding.ts:30-38).
✓ Error: `toast.error(message, { duration: 5000 })`, form giữ nguyên (onError mọi hook).

---

## UX Compliance

✓ **WizardStep1Type**: type cards + currency toggle + name input (US-1.02) — matches spec.
✓ **WizardStep5Debt**: debt rows + debtPct preview + skip available (US-1.05) — matches.
✓ **WizardStep6Categories**: count ("X danh mục trong Y nhóm") + callout ("Muốn thêm/chỉnh sửa → Cài đặt") + skeleton (US-2.01, WARNING #2 resolved) — matches.
✓ **WizardStep7Budget**: 16 lines + % input + realtime VND + lock icon cho 'Chi trả nợ' + total color (US-2.02) — matches.
✓ **/login + /invite/[token]**: Google sign-in, accept/expired/notfound/alreadyMember states.
⚠ **WizardStep5Debt empty state**: không có dedicated empty-state UI khi `debts=[]` (chỉ ẩn list + nút "Thêm khoản nợ"). Acceptable cho optional step — user skip được. Ghi chú minor.

---

## Issues Summary

### CRITICAL (phải fix)
*Không có.* Toàn bộ 3 CRITICAL từ code review (C1 owner-bind, C2 order/owner, C3 accept guard) đã được fixer xử lý và QA verify trực tiếp trong code.

### WARNING (nên fix — không block S1)
- **Version mismatch** `@supabase/ssr@0.5.2 ↔ @supabase/supabase-js@2.108.2` — src/lib/supabase/* — buộc cast `as unknown as SupabaseClient<Database>`. Type-safety risk, KHÔNG runtime. Cần align version + bỏ cast ở sprint sau. (Deviation #3 developer log.)
- **database.ts placeholder** — extend thủ công, chưa `supabase gen types`. Interim, không ảnh hưởng runtime nhưng thiếu FK metadata → buộc cast nested-select trong useCategories. Cần gen real types.
- **GET /api/household chỉ trả household OWNER** — src/app/api/household/route.ts:20-21 — member được mời (role=member/viewer) nhận `data:null` → middleware coi chưa onboard → redirect /setup loop. Chưa lộ ở S1 (accept-invite chưa wired vào dashboard), nhưng member-view flow cần thiết kế riêng ở sprint sau. (New issue #2 fixer log.)
- **totalAmount không có UI input** — WizardStep5Debt — `DebtDraft.totalAmount` luôn = 0 (chỉ có UI cho remainingAmount + monthlyPayment). `debtSchema.totalAmount` giữ `.nonnegative()` (KHÔNG `.positive()`) để 0 hợp lệ → tránh rollback toàn bộ onboarding. debt_entries.total_amount sẽ = 0 → dữ liệu nợ không đầy đủ. Cần quyết định nghiệp vụ: thêm input totalAmount HOẶC bỏ field. (M3 skip + New issue #1 fixer log.)

### MINOR (cosmetic)
- **WizardStep5Debt.tsx:113 + WizardLayout.tsx:44 + WizardStep6Categories.tsx:22,43**: còn vài chỗ hardcode `text-zinc-400` thay vì `text-muted-foreground` (fixer M4 chỉ fix Step7). Cosmetic, không ảnh hưởng chức năng.

---

## Verification chạy thực tế
- `npx tsc --noEmit` → **0 errors**.
- `npx vitest run` → **116/116 pass** (8 files).
- Migration log: 001→006 apply sạch, E2E happy path + idempotency + auth guard + skip-debt + mapping 15/15 verified trên Postgres tạm.

---

## Kết luận

**PASS** — 0 critical issues, 4 warnings, 1 minor.

Toàn bộ 3 CRITICAL từ code review đã fix và verify. Cross-boundary (API↔Hook↔DB) nhất quán hoàn toàn — không có field-name mismatch, status mapping đầy đủ, query key đúng phạm vi. Tất cả business rules S1 (BR-OB-001→005, BR-BU-001/002, BR-DT-001) tuân thủ. Mobile-first + error handling + RLS/security đạt chuẩn.

Các WARNING là **kỹ thuật nợ đã biết và document** (version align, gen types, member-view flow, totalAmount UI), KHÔNG block S1 — cần đưa vào backlog sprint sau. Sprint S1 sẵn sàng ship.

### Known issues cần track sang sprint sau
1. totalAmount field không có UI → debt data thiếu total_amount (=0).
2. GET /api/household chỉ trả owner household → member-invited flow cần design riêng.
3. database.ts placeholder → cần `supabase gen types typescript`.
4. Version mismatch @supabase/ssr ↔ supabase-js → cần align để bỏ cast `as unknown`.
