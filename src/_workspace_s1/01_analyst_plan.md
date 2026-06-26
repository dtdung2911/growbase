# Sprint S1 — Analyst Plan
> Auth + Onboarding Wizard (US-1.01→1.05, US-2.01→2.02)

## Stories trong scope

### US-1.01 — Google OAuth Login `M` `S1`
> As a new user I want to sign in with Google so that I don't need a password.

**AC:**
- Given user not logged in When visit /dashboard Then redirect /login
- Given login success And `onboarding_completed=false` Then redirect /setup
- Given login success And `onboarding_completed=true` Then redirect /dashboard
- Given logged in When visit /login Then redirect /dashboard

---

### US-1.02 — Wizard Step 1: Household Type + Currency `M` `S1`
> As a new user I want to choose Personal/Family and currency so that the app sets up correctly.

**AC:**
- Given type=family Then wizard shows 7 steps (step 2 = invite members)
- Given type=personal Then wizard shows 6 steps (skip step 2)
- Given household already exists (back/refresh) Then UPDATE not INSERT
- Given currency=VND Then all amounts display as "1.000.000 đ"

---

### US-1.03 — Wizard Step 2: Invite Members (Family only) `M` `S1`
> As a family owner I want to invite members by email so that we manage finances together.

**AC:**
- Given valid token When accept Then member sees household data
- Given expired token (>7 days) Then show "Link hết hạn, yêu cầu invite mới"
- Given already a member When accept again Then show "Bạn đã là thành viên"
- Given step 2 skipped Then household created with owner only, can invite later

---

### US-1.04 — Wizard Steps 3-4: Income + Accounts `M` `S1`
> As a user I want to enter income sources and accounts so that the system has financial context.

**AC:**
- Given income_sources empty Then "Tiếp tục" button disabled
- Given accounts empty Then "Tiếp tục" button disabled
- Given is_credit_card=true Then show hint "Thanh toán thẻ tín dụng = chuyển khoản nội bộ"
- Given multiple income sources entered Then total income displayed at bottom

---

### US-1.05 — Wizard Step 5: Debt Entry → Auto Budget `M` `S1`
> As a user with loans I want to enter my debts so that the system auto-calculates my repayment budget.

**AC:**
- Given monthly_payment=4.2M AND income=50M Then debt_pct = 8.4% displayed
- Given step skipped Then budget step 7: "Chi trả nợ" = 0%, user can edit
- Given debt entered Then budget step 7: "Chi trả nợ" = debt_pct, locked
- Given multiple debts entered Then debt_pct = SUM(monthly_payments)/income * 100

---

### US-2.01 — Wizard Step 6: Category Preview `M` `S1`
> As a user I want to see suggested categories so that I know how spending will be classified.

**AC:**
- Given system categories seeded Then display all active categories
- Given user clicks "Tiếp tục" Then proceed to step 7 immediately

---

### US-2.02 — Wizard Step 7: Budget Setup `M` `S1`
> As a user I want to review and adjust budget percentages so that allocation matches my family.

**AC:**
- Given total_pct > 100 Then disable "Hoàn thành" + show "Tổng vượt 100%"
- Given debt_entries.status=active Then "Chi trả nợ" row locked, shows lock icon
- Given user changes pct Then VND amount recalculates instantly
- Given submit success Then onboarding_completed=true AND redirect /dashboard

---

## Business Rules áp dụng

| Rule | Mô tả | Tại sao quan trọng với S1 |
|------|-------|---------------------------|
| **BR-OB-001** | onboarding_completed=false → redirect mọi route → /setup | Lõi của middleware US-1.01 |
| **BR-OB-002** | Required: Step 1, Step 3 (≥1 income), Step 4 (≥1 account). Optional: 2, 5, 6, 7 | Disable "Tiếp tục" cho 3 step bắt buộc |
| **BR-OB-003** | personal → skip step 2, progress bar 6 steps; family → 7 steps | Wizard state machine |
| **BR-OB-004** | User đã có household → UPDATE, không INSERT (upsert) | Back/refresh không tạo household trùng |
| **BR-OB-005** | Hoàn thành step 7 → UPSERT budget_baselines → SET onboarding_completed=true → redirect /dashboard | Completion handler |
| **BR-DT-001** | INSERT/UPDATE/DELETE debt_entries → recalculate_debt_budget() → debt_pct = SUM(active monthly_payment)/SUM(income)*100 | Trigger DB tự động |
| **BR-DT-003** | Step 5 skip → "Chi trả nợ" = 0%, editable. Có debt → locked | Step 5 + step 7 logic |
| **BR-BU-001** | SUM(budget_pct) > 100 → block save | Step 7 total validator |
| **BR-BU-002** | Có active debt → "Chi trả nợ" locked, is_auto_calculated=true | Step 7 lock row |
| **BR-SY-001** | System entities immutable | Step 6 read-only |
| **BR-CO-004** | account.balance KHÔNG auto-maintain trong MVP | Step 4 không nhập balance |

**Set bởi DB (không phải user):**
- `household_invitations.token` = gen_random_uuid()::text (DEFAULT)
- `expires_at` = now() + 7 days (DEFAULT)
- `recalculate_debt_budget()` chạy qua trigger AFTER INSERT/UPDATE/DELETE trên debt_entries
- `income_sources.is_current` default true
- `monthly_amount > 0` CHECK constraint

---

## Tasks theo thứ tự (dependencies-first)

### DB Layer

**Task 1: Verify/confirm onboarding schema từ S0**
- Đảm bảo tables: households, household_members, household_invitations, income_sources, accounts, debt_entries, budget_baselines đã tồn tại
- Nếu thiếu: tạo theo §2 technical spec
- Note: phần lớn schema thuộc S0

**Task 2: RPC — invitation helpers**
- `get_invitation_by_token(p_token text)` → trả household info + status + expired check
- `accept_invitation(p_token text)` → verify → check expired → check member → INSERT household_members → SET status='accepted'
- PHẢI dùng SECURITY DEFINER (caller chưa là member khi accept)
- ⚠️ GAP: 04_TECHNICAL_SPEC §3 không có 2 RPC này — Architect cần define signature

**Task 3: RPC — complete_onboarding (cân nhắc)**
- UPSERT budget_baselines + SET onboarding_completed=true atomic
- Hoặc API route làm tuần tự (chấp nhận được, không phải fund operation)
- Architect quyết định

**Task 4: RLS policies — invitations + members**
- household_invitations: INSERT (owner only), SELECT by token via SECURITY DEFINER RPC
- household_members: INSERT khi accept via RPC

### App Layer

**Task 5: Supabase clients**
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client (cookie-based session)
- Dùng @supabase/ssr pattern (đã validate ở S0)

**Task 6: Zod schemas** — `src/lib/validations/onboarding.ts`, `household.ts`
- householdSchema (type, currency, name)
- inviteSchema (email, display_name)
- incomeSourceSchema (source_name, monthly_amount>0, member_id)
- accountSchema (name, bank_name, account_type, owner_name, is_credit_card)
- debtSchema (creditor_name, debt_type, monthly_payment>0, remaining_amount, expected_end_date, member_id)
- budgetSetupSchema (array of {baseline_id, pct})

**Task 7: TypeScript types** — `src/types/app.ts`, `api.ts`
- WizardData, WizardStep types
- API response `{ data, error }`

**Task 8: Zustand wizard store** — `src/lib/stores/wizardStore.ts`
- currentStep, householdType, currency
- danh sách tạm: income/accounts/debts/invites
- computed totalSteps (6 hoặc 7 theo BR-OB-003)
- navigation: next/prev/skip + validation gate per step (BR-OB-002)

**Task 9: TanStack Query hooks**
- `src/lib/hooks/useHousehold.ts` — get/upsert household
- `useIncomeSources.ts` — list + create
- `useAccounts.ts` — list + create
- `useDebt.ts` — list + create/delete (invalidate budget vì trigger)
- `useBudget.ts` — baselines + completion
- `useInvitation.ts` — invite + accept

**Task 10: API routes**
- `src/app/auth/callback/route.ts` — exchange code → session → redirect
- `src/app/api/household/route.ts` — GET + POST upsert
- `src/app/api/income-sources/route.ts` — GET + POST
- `src/app/api/accounts/route.ts` — GET + POST
- `src/app/api/debt/route.ts` — POST (trigger auto-runs)
- `src/app/api/household/invite/route.ts` — POST (INSERT invitation)
- `src/app/api/household/invite/[token]/accept/route.ts` — POST (gọi RPC accept_invitation)
- `src/app/api/budget/route.ts` — GET baselines + completion endpoint

**Task 11: Middleware** — `src/middleware.ts`
- Session check → redirect logic (US-1.01 4 AC + BR-OB-001)
- Exclude: /auth/callback, /invite/[token], static assets, /login

**Task 12: Shared components**
- `src/components/ui/CurrencyInput.tsx` — raw on focus, VND format on blur, digits only, 16px
- `src/components/common/MonthPicker.tsx` — base component (confirm nếu cần ở S1)
- `src/components/onboarding/WizardLayout.tsx` — progress bar 6/7 steps, max-w-lg, footer CTA

**Task 13: Auth page** — `src/app/login/page.tsx`
- Centered card max-w-sm
- "Đăng nhập với Google" button + loading state

**Task 14: Invite accept page** — `src/app/invite/[token]/page.tsx`
- Load token → show household info → Accept/Reject
- Handle: valid / expired / already-member states

**Task 15: Wizard step components** — `src/components/onboarding/`
- WizardStep1: type cards + currency toggle (US-1.02)
- WizardStep2: invite form, family only (US-1.03)
- WizardStep3: income rows + total (US-1.04)
- WizardStep4: account rows + CC hint (US-1.04)
- WizardStep5: debt rows + debt_pct preview + skip (US-1.05)
- WizardStep6: category tree read-only (US-2.01)
- WizardStep7: 16 budget lines + % inputs + realtime total + lock "Chi trả nợ" (US-2.02)

**Task 16: Setup wizard page** — `src/app/setup/page.tsx`
- Orchestrate: WizardLayout + step component theo wizardStore.currentStep
- Handle skip/next/completion → redirect /dashboard
- BR-OB-005 completion handler

---

## Rủi ro / Điểm cần xử lý

1. **GAP — RPC `accept_invitation` + `get_invitation_by_token` không có trong spec §3** → Architect phải define signature
2. **Tên table nhầm trong prompt** — `budget_months`/`budget_categories` KHÔNG tồn tại; dùng `budget_baselines` + `budget_overrides`
3. **Touch target mâu thuẫn** — CLAUDE.md: 44px; UX_SPEC §1: 48px; §5: 44px → dùng 44px theo CLAUDE.md
4. **Budget line → category group mapping** chưa rõ cho step 7 copy template → Architect cần define
5. **Budget copy cơ chế** — template lưu ở đâu? Hardcode hay template table? → Architect xác nhận
6. **Thứ tự: debt entry ở step 5 nhưng budget_baselines tạo ở step 7** → trigger recalculate_debt_budget UPDATE budget_baselines chưa có sẽ no-op → Architect cần quyết: tạo baselines sớm hơn hay step 5 chỉ preview client-side
7. **Email invitation** — Supabase Auth không có transactional email API → cơ chế gửi email cần xác nhận (Edge Function hay chỉ share link)
8. **Middleware phải exclude `/invite/[token]`** — member mới chưa onboarding sẽ bị loop redirect nếu không exclude
