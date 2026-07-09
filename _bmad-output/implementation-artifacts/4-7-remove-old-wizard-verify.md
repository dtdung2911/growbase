---
epic: 4
story: 7
title: "Gỡ wizard cũ & verify hành trình 3 phút"
status: review
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 4.7: Gỡ wizard cũ & verify hành trình 3 phút

As a người dùng mới,
I want một luồng onboarding duy nhất, gọn, không dấu vết wizard cũ,
So that trải nghiệm 4 bước là con đường duy nhất và hoàn thành dưới 3 phút.

## Acceptance Criteria

**AC1 — Given** onboarding v2 hoạt động end-to-end, **When** gỡ wizard cũ, **Then**:
- 5 bước cũ (Loại hộ, Mời thành viên, Tài khoản, Nợ, Categories, Budget) bị xoá khỏi codebase (component + logic trong `SetupClient.tsx`); phần Income cũ được tái dùng/refactor cho màn Thu nhập nếu phù hợp (AR1)
- translation keys orphan của wizard cũ bị dọn, không dead code
- handler cũ của `/api/onboarding/complete` đã bị thay thế hoàn toàn bởi bản v2 (story 4.4) — không code path wizard cũ nào còn được gọi, không route mồ côi

**AC2 — Given** wizard cũ đã gỡ, **When** kiểm tra routes + middleware, **Then**:
- gates AD-4 vẫn đúng: chưa onboard → `/setup` (flow mới); đã onboard vào `/setup` → redirect `/dashboard`
- không đường nào (link, redirect, deep-link) dẫn tới bước wizard cũ

**AC3 — Given** user mới đăng ký từ đầu, **When** đi trọn hành trình Hook → Mục tiêu → Thu nhập → Tada → dashboard, **Then** hoàn thành dưới 3 phút với đúng 2 lần nhập liệu (FR6 — verify thủ công dogfood)

## Dev Notes

### Research findings (from exhaustive codebase analysis — read every file before touching it)

**AR1 resolved — no porting needed.** Compared `src/components/onboarding/v2/IncomeStep.tsx` (v2, single monthly-income value + emergency-target preview, built independently in story 4.3, already `review`) against `src/components/onboarding/WizardStep3Income.tsx` (old, multi-source income array with add/remove rows + currency picker). They solve different problems by design (v2 = one household-level income number; old = itemized income sources per member). v2's `IncomeStep` is already fully self-sufficient; its only shared dependency is `CurrencyInput` (`src/components/ui/CurrencyInput.tsx`), which is a common component, not wizard-specific. **No code needs to be ported.**

**AC1 route check resolved.** Read `src/app/api/onboarding/complete/route.ts` in full: it validates with `completeOnboardingV2Schema`, calls `supabaseAdmin.rpc("complete_onboarding_v2", ...)` only. Zero old-wizard code path exists in this route already (this route was written fresh in story 4.4). Nothing to change here — just confirms AC1's route clause is already satisfied; no separate orphaned route file exists (`find src/app/api/onboarding` → only `complete/route.ts`).

**AC2 middleware check resolved.** Read `src/middleware.ts` in full: the AD-4 gate is a single generic check (`onboarding_completed` boolean → redirect `/setup` or `/dashboard`), with no per-wizard-step logic or old-wizard path references anywhere. No changes needed to `middleware.ts`.

**SetupClient.tsx already fully migrated.** `src/app/setup/SetupClient.tsx` already renders only the 4 v2 steps (`step === 0..3` → `HookStep`/`GoalStep`/`IncomeStep`/`TadaStep`); it has zero remaining references to any Wizard component. A comment at line 12 (`// Wizard 7 bước cũ ngắt khỏi render tại đây; components cũ xoá ở story 4.7.`) exists purely to flag this story — remove the comment once the files are actually deleted, since at that point it's just noise (nothing left to explain).

### Exhaustive dead-code inventory (confirmed via grep — zero real importers outside this list itself)

Files to **delete entirely**:
1. `src/components/onboarding/WizardLayout.tsx`
2. `src/components/onboarding/WizardStep1Type.tsx`
3. `src/components/onboarding/WizardStep2Invite.tsx`
4. `src/components/onboarding/WizardStep3Income.tsx`
5. `src/components/onboarding/WizardStep4Accounts.tsx`
6. `src/components/onboarding/WizardStep5Debt.tsx`
7. `src/components/onboarding/WizardStep6Categories.tsx`
8. `src/components/onboarding/WizardStep7Budget.tsx`
9. `src/lib/stores/wizardStore.ts` (173 lines) — only callers are the 7 wizard step files above + `useHousehold.ts`'s dead `useUpsertHousehold()` (below) + its own 2 test files (next item). Delete only after confirming those are also gone/fixed in the same pass.
10. `src/__tests__/stores/wizardStore.test.ts` (315 lines)
11. `src/__tests__/stores/wizardStore.regression.test.ts` (84 lines)

Code to **edit** (remove dead exports, keep the rest):
- `src/lib/hooks/useHousehold.ts` — remove the `useUpsertHousehold()` function (confirmed zero `.tsx` callers via grep) along with its now-unused `useMutation`, `toast`, `useWizardStore`, `HouseholdInput` imports. **Keep** `useHousehold(householdId)` — confirmed actively used by `src/components/settings/HouseholdSettingsForm.tsx`.
- `src/types/app.ts` — remove these now-dead types (zero usages outside the files being deleted, confirmed via grep): `WizardStep` (line 25), `IncomeDraft` (line 27-32), `AccountDraft` (line 34-41), `DebtDraft` (line 43-52), `BudgetPctDraft` (line 54-59), `WizardData` (line 61-69). **Keep** `AccountType` and `DebtType` — confirmed still used by `src/components/settings/AccountEditForm.tsx` and `DebtForm.tsx` respectively (real settings features, unrelated to onboarding).
- `src/app/setup/SetupClient.tsx` — remove the now-stale "xoá ở story 4.7" comment (line 12) since the thing it refers to will no longer exist.
- `src/components/onboarding/v2/OnboardingV2Shell.tsx` — remove the "xoá ở story 4.7" comment (line 11), same reason.

i18n keys to **delete** from both `src/lib/i18n/messages/vi.json` and `src/lib/i18n/messages/en.json` — all 60 keys under the `setup.` prefix (NOT `setupV2.`, which is the live v2 namespace and must stay untouched). Confirmed via grep: zero remaining call sites for any `setup.*` key outside the doomed wizard files. Full key list (60, identical set in both files):
```
setup.account, setup.accountNamePlaceholder, setup.accountType.bank, setup.accountType.cash,
setup.accountType.credit_card, setup.accountType.investment, setup.accountType.precious_metal,
setup.accountType.savings, setup.addAccount, setup.addDebt, setup.addIncome, setup.addMember,
setup.amountPlaceholder, setup.back, setup.bankNamePlaceholder, setup.complete, setup.creditCardNote,
setup.creditorPlaceholder, setup.currency, setup.debt, setup.debtBudget, setup.debtBudgetValue,
setup.debtType.bank_loan, setup.debtType.credit_card, setup.debtType.mortgage, setup.debtType.personal,
setup.emptyAccount, setup.emptyIncome, setup.family, setup.householdName, setup.householdNamePlaceholder,
setup.incomeSource, setup.incomeSourcePlaceholder, setup.inviteCreated, setup.inviteDisplayName,
setup.inviteDisplayNamePlaceholder, setup.inviteEmail, setup.inviteNote, setup.isCreditCard,
setup.linkCopied, setup.monthlyPayment, setup.next, setup.noHousehold, setup.personal,
setup.remainingBalance, setup.skip, setup.step1Title, setup.step2Title, setup.step3Title,
setup.step4Title, setup.step5Title, setup.step6Note, setup.step6Summary, setup.step6Title,
setup.step7Note, setup.step7Subtitle, setup.step7Title, setup.step7Total, setup.stepLabel,
setup.totalIncome
```

### Testing approach (planned, per karpathy "Delete > Add" + repo's mandatory business-flow verification)

- After every deletion: `tsc --noEmit` must show zero errors (deleting live code is a strong self-check — any missed reference surfaces immediately as a type error).
- `vitest run`: must show 0 failures. The 2 wizard store test files are deleted alongside their subject, so they won't run at all (not "fixed to pass" — removed because their subject no longer exists).
- Final grep sweep for zero remaining references to: `WizardLayout`, `WizardStep[0-9]`, `wizardStore`, `useWizardStore`, `useUpsertHousehold`, `IncomeDraft`, `AccountDraft`, `DebtDraft`, `BudgetPctDraft`, `WizardData` (as a type, not the epic's plain-English word "wizard"), and the 60 `setup.*` i18n keys.
- AC3 (dogfood journey, <3 min, 2 data-entry steps): this is a manual, human-timed flow through a real signed-up account and cannot be automated or substituted by code-tracing (unlike AC1/AC2, which are structural/deletion checks). Prior story 4.6 hit an auth-gate blocker (`/setup` requires a real Supabase session; no test credentials available in this environment) attempting exactly this kind of live check. **Plan:** attempt it again for this story since it's the story's core deliverable; if blocked by the same auth constraint, do a rigorous manual code-trace of the 4-step journey instead (verify `OnboardingV2Shell`'s step transitions, that exactly 2 steps require user input — Goal amount/type entry + Income amount entry — while Hook and Tada are display-only, and estimate step count/complexity as a proxy for the <3min claim), and document the substitution explicitly as a Limitation in the story's Testing section, the same way 4.6 did. Do not claim AC3 verified via automation if it wasn't.

## Tasks / Subtasks

- [x] **Task 1: Delete the 8 dead wizard component files** (AC1)
  - [x] Delete `WizardLayout.tsx`, `WizardStep1Type.tsx` through `WizardStep7Budget.tsx` (8 files total)
  - [x] Remove the now-stale "xoá ở story 4.7" comments in `SetupClient.tsx` and `OnboardingV2Shell.tsx`
  - [x] Run `tsc --noEmit` — no new errors from this deletion

- [x] **Task 2: Remove dead `useUpsertHousehold()` from `useHousehold.ts`** (AC1)
  - [x] Delete the function and its now-unused imports (`useMutation`, `toast`, `useWizardStore`, `HouseholdInput`)
  - [x] Keep `useHousehold(householdId)` query export untouched
  - [x] Run `tsc --noEmit`

- [x] **Task 3: Delete `wizardStore.ts` and its 2 test files** (AC1)
  - [x] Confirm (grep) zero remaining importers after Tasks 1-2
  - [x] Delete `src/lib/stores/wizardStore.ts`, `src/__tests__/stores/wizardStore.test.ts`, `src/__tests__/stores/wizardStore.regression.test.ts`
  - [x] Run `tsc --noEmit` and `vitest run` — both clean

- [x] **Task 4: Remove dead wizard-only types from `types/app.ts`** (AC1)
  - [x] Delete `WizardStep`, `IncomeDraft`, `AccountDraft`, `DebtDraft`, `BudgetPctDraft`, `WizardData`
  - [x] Keep `AccountType`, `DebtType` (still used by real settings forms)
  - [x] Run `tsc --noEmit`

- [x] **Task 5: Remove 60 orphaned `setup.*` i18n keys from `vi.json` and `en.json`** (AC1)
  - [x] Delete all 60 keys listed in Dev Notes from both files (keep `setupV2.*` untouched)
  - [x] Validate both files are syntactically valid JSON after edit
  - [x] Final grep sweep: zero remaining call sites for any deleted `setup.*` key, zero remaining references to any deleted type/store/component name

- [x] **Task 6: Verify AC2 (routing/middleware gates unaffected)**
  - [x] Re-confirmed `src/middleware.ts` AD-4 gate logic unchanged and correct — single generic `onboarding_completed` check, no wizard-step references exist
  - [x] Grepped entire codebase for any remaining link/redirect/deep-link string referencing a deleted wizard path — zero found

- [x] **Task 7: Verify AC3 (end-to-end journey, manual dogfood)** — DEVIATION: live walkthrough blocked
  - [x] Attempted live browser walkthrough: `LoginClient.tsx` uses `supabase.auth.signInWithOAuth()` only (Google OAuth) — no email/password or magic-link path exists to script a fresh signup without a real Google account, same class of blocker hit in story 4.6. Creating an OAuth-authenticated account is also outside what I can do autonomously (account creation requires real user consent).
  - [x] Fell back to rigorous manual code-trace of the 4-step journey (see Dev Agent Record → Testing) — documented as Limitation
  - [x] Recorded method + result in Dev Agent Record → Testing

- [x] **Task 8: Final full regression pass**
  - [x] `tsc --noEmit` — zero errors (only pre-existing, unrelated `layout.tsx` Supabase relation-type error remains, confirmed present at baseline commit too)
  - [x] `vitest run` — 298/298 passed (down from 336; the 2 deleted wizardStore test files accounted for the removed 38 tests — expected, not a regression)
  - [x] Status → `review`, `sprint-status.yaml` updated to `4-7-remove-old-wizard-verify: review`

## Dev Agent Record

### Agent Model Used
Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References
None.

### Completion Notes List
- AR1 ("Income cũ tái dùng nếu phù hợp"): resolved as **no porting needed** — v2's `IncomeStep.tsx` (single household-level income number) and old `WizardStep3Income.tsx` (itemized multi-source income array) solve different problems by design; only shared dependency is the already-common `CurrencyInput` component.
- AC1's route clause was already satisfied before this story started: `src/app/api/onboarding/complete/route.ts` was written fresh in story 4.4 and never contained an old-wizard code path; no separate orphaned route file exists (`find src/app/api/onboarding` → only `complete/route.ts`).
- Deleted 11 files total: 8 wizard step/layout components + `wizardStore.ts` + its 2 test files. Removed 1 dead function (`useUpsertHousehold`) from `useHousehold.ts`, 6 dead types from `types/app.ts` (kept `AccountType`/`DebtType`, confirmed still used by real Settings forms), 60 `setup.*` i18n keys from each of `vi.json`/`en.json` (kept all `setupV2.*` untouched), and 2 stale "xoá ở story 4.7" comments.
- DEVIATION/LIMITATION: AC3's live dogfood walkthrough could not be performed — the app's only login path is Google OAuth (`signInWithOAuth`), with no test credentials or password/magic-link path available in this environment, the same category of blocker encountered in story 4.6. Substituted a manual code-trace: confirmed exactly 2 data-entry steps (Goal preset selection + optional amount, then Income amount — matching FR6) bracketed by 2 display-only steps (Hook, Tada), across small single-purpose components (`GoalStep.tsx` 211 lines, `IncomeStep.tsx` 63 lines, `TadaStep.tsx` 242 lines mostly reveal/animation, `HookStep.tsx` 40 lines) — structurally consistent with a sub-3-minute completion, but this is not a substitute for an actual timed run. **Recommend the user manually time a real signup → dashboard run before relying on the <3min claim in production.**
- `tsc --noEmit` after all deletions surfaced zero new errors — the only remaining error (`src/app/(app)/layout.tsx` Supabase `SelectQueryError` on `household_members`/`households` relation) was independently confirmed present at the pre-story baseline commit (`168e2b2`) via `git stash` comparison, i.e. unrelated to this story's changes.

### File List
- DELETED: `src/components/onboarding/WizardLayout.tsx`
- DELETED: `src/components/onboarding/WizardStep1Type.tsx`
- DELETED: `src/components/onboarding/WizardStep2Invite.tsx`
- DELETED: `src/components/onboarding/WizardStep3Income.tsx`
- DELETED: `src/components/onboarding/WizardStep4Accounts.tsx`
- DELETED: `src/components/onboarding/WizardStep5Debt.tsx`
- DELETED: `src/components/onboarding/WizardStep6Categories.tsx`
- DELETED: `src/components/onboarding/WizardStep7Budget.tsx`
- DELETED: `src/lib/stores/wizardStore.ts`
- DELETED: `src/__tests__/stores/wizardStore.test.ts`
- DELETED: `src/__tests__/stores/wizardStore.regression.test.ts`
- MODIFIED: `src/lib/hooks/useHousehold.ts` (removed dead `useUpsertHousehold`)
- MODIFIED: `src/types/app.ts` (removed 6 dead wizard-only types)
- MODIFIED: `src/lib/i18n/messages/vi.json` (removed 60 `setup.*` keys)
- MODIFIED: `src/lib/i18n/messages/en.json` (removed 60 `setup.*` keys)
- MODIFIED: `src/app/setup/SetupClient.tsx` (removed stale comment)
- MODIFIED: `src/components/onboarding/v2/OnboardingV2Shell.tsx` (removed stale comment)

### Testing
| Flow | Method | Result |
|---|---|---|
| AC1: old wizard files fully removed, zero dangling imports | Automated (`tsc --noEmit`) + grep sweep | Pass — 0 references to `WizardLayout`, `WizardStep[0-9]`, `useWizardStore`, `useUpsertHousehold`, `IncomeDraft`, `AccountDraft`, `DebtDraft`, `BudgetPctDraft`, `WizardData` anywhere in `src` |
| AC1: `/api/onboarding/complete` has no old-wizard code path | Manual code read | Pass — route only calls `completeOnboardingV2Schema` + `complete_onboarding_v2` RPC, written fresh in story 4.4 |
| AC1: 60 orphaned i18n keys removed, `setupV2.*` untouched | Automated (Python JSON diff) + grep | Pass — 0 remaining `setup.*` keys in either message file, `setupV2.*` keys unaffected, both files valid JSON |
| AR1: old Income logic reused if suitable | Manual code comparison (`IncomeStep.tsx` vs `WizardStep3Income.tsx`) | Resolved — no reuse needed, different problem shapes, only shared dep (`CurrencyInput`) already common |
| AC2: AD-4 middleware gates (unauthenticated → `/setup`, onboarded → `/dashboard`) unaffected | Manual code read (`src/middleware.ts`) | Pass — single generic `onboarding_completed` check, zero wizard-step-specific logic existed before or after this story |
| AC2: no remaining link/redirect/deep-link to a deleted wizard path | grep sweep (`setup/step`, `onboarding/step`, `WizardStep`) | Pass — zero matches |
| AC3: full 4-step journey (Hook→Goal→Income→Tada→dashboard) completes <3min with exactly 2 data-entry steps | Manual — **live walkthrough blocked** (Google-OAuth-only login, no test credentials); substituted manual code-trace of all 4 v2 step components | Structurally consistent (2 data-entry steps: Goal, Income; 2 display-only: Hook, Tada) — **not independently timed**, flagged as Limitation |
| Regression: no other business flow broken by deletions | Automated (`vitest run`) | Pass — 298/298, delta from 336 fully explained by the 2 removed wizardStore test files (38 tests) |

**TL;DR cho DzungDuong:** Đã xoá sạch wizard 7 bước cũ (8 components + store + 2 test file + 60 key i18n orphan + 1 hàm dead code + 6 type dead code) — `tsc`/`vitest` đều xanh, grep xác nhận 0 tham chiếu còn sót. Rủi ro cao nhất: AC3 (hành trình <3 phút, đúng 2 bước nhập liệu) **chưa test tay thật được** — app chỉ login bằng Google OAuth, không có tài khoản test nào khả dụng trong môi trường này, nên mình chỉ trace code (Goal + Income là 2 bước nhập liệu duy nhất, khớp FR6) chứ chưa bấm giờ thật. Đề nghị bạn tự đăng ký tài khoản mới và đi thử hành trình Hook→Goal→Income→Tada→dashboard 1 lần trước khi coi AC3 là "confirmed" — đây là rủi ro duy nhất còn lại của cả Epic 4.

### Change Log
- 2026-07-03: Story created directly from research (bmad-create-story), implemented same session (bmad-dev-story), status → `review`. Đây là story cuối của Epic 4.
