# Story 4.2: Flow skeleton 4 bước & màn Mục tiêu

Status: review

## Story

As a người dùng mới,
I want chọn một mục tiêu tài chính từ danh sách gợi ý có số mặc định thông minh,
so that mục tiêu của tôi trở thành xương sống câu chuyện tài chính mà không phải nghĩ từ con số 0.

## Acceptance Criteria

1. **Given** user chưa hoàn thành onboarding truy cập `/setup`
   **When** flow onboarding v2 render
   **Then** shell 4 bước mới (Hook → Mục tiêu → Thu nhập → Tada) thay navigation wizard 7 bước cũ, có progress indicator
   **And** state các bước lưu client-side (chưa ghi database cho tới màn Tada)
   **And** refresh/reload giữa chừng không mất lựa chọn đã nhập (sessionStorage)

2. **Given** user ở màn Mục tiêu "Bạn muốn gì cho gia đình mình?"
   **When** danh sách gợi ý hiển thị
   **Then** có đúng 5 lựa chọn: 🛡️ Quỹ khẩn cấp (3 × chi tiêu tháng — hiển thị "tự tính sau khi có thu nhập"), 🎓 Quỹ học cho con (200tr/5 năm), 🏠 Mua nhà (500tr/3 năm), ✈️ Du lịch gia đình (30tr/1 năm), ✏️ Tự nhập (tên + số đích + thời hạn)
   **And** số mặc định sửa được ngay tại chỗ (inline edit), amounts hiển thị `font-mono` + formatVND

3. **Given** user chưa chọn mục tiêu nào
   **When** user cố đi tiếp
   **Then** không đi được — bước này bắt buộc, không có lối "để sau" (FR2)
   **And** chỉ chọn được đúng một mục tiêu

4. **Given** mobile 375px
   **When** thao tác toàn màn hình
   **Then** touch targets ≥44px, thao tác một tay được, input font 16px, mọi string qua `t()` vi+en

## Tasks / Subtasks

- [x] Task 1: Store + validation cho onboarding v2 (AC: 1, 3)
  - [x] `src/lib/stores/onboardingV2Store.ts` — Zustand + persist qua **sessionStorage** (`createJSONStorage(() => sessionStorage)`, key `growbase-onboarding-v2`): `{ step: 0|1|2|3, goal: OnboardingGoal | null, monthlyIncome: number | null }` + actions `setStep/next/prev/setGoal/setMonthlyIncome/reset` + `canProceed()` per step (step 1 cần goal ≠ null)
  - [x] `src/lib/validations/onboardingV2.ts` — Zod: `goalSchema` = `{ fundType: "emergency"|"goal", name: min 1, targetAmount: positive nullable (chỉ null khi emergency — auto-calc sau), targetMonths: int positive }`; export type `OnboardingGoal`
  - [x] Unit tests: `src/__tests__/validations/onboardingV2.test.ts` (edge: target 0/âm, months 0, name rỗng, emergency null target hợp lệ) + `src/__tests__/stores/onboardingV2Store.test.ts` (canProceed, next/prev bounds, reset)
- [x] Task 2: Shell 4 bước (AC: 1, 4)
  - [x] `src/components/onboarding/v2/OnboardingV2Shell.tsx` — layout mobile-first: progress indicator 4 bước (tái dùng pattern progress bar inline của `WizardLayout.tsx:40-50`, KHÔNG tạo primitive mới), slot render step, footer nav sticky bottom (Back/Tiếp tục, `min-h-[44px]`, disabled theo `canProceed`)
  - [x] Step placeholders: `HookStep.tsx` (CTA "Đến lượt nhà bạn" + "Bỏ qua" → cùng sang step 1 — nội dung demo thật ở story 4.6), `IncomeStep.tsx` + `TadaStep.tsx` (placeholder tối giản — story 4.3/4.5)
  - [x] `SetupClient.tsx` — thay render wizard cũ bằng flow v2 (components wizard cũ GIỮ NGUYÊN trong repo, chỉ ngắt khỏi render — xoá ở story 4.7); bỏ hydrate `useWizardStore`/`initialHousehold` logic cho flow mới
- [x] Task 3: Màn Mục tiêu — GoalStep (AC: 2, 3, 4)
  - [x] `src/components/onboarding/v2/GoalStep.tsx` — câu hỏi "Bạn muốn gì cho gia đình mình?", 5 option cards (radio behavior — chọn 1): emoji + tên + mô tả số mặc định; card chọn có ring primary
  - [x] Defaults: emergency `{fundType:"emergency", targetAmount:null, targetMonths:null}` hiển thị "3 × chi tiêu tháng — tự tính sau khi có thu nhập"; học con `{goal, 200_000_000, 60}`; mua nhà `{goal, 500_000_000, 36}`; du lịch `{goal, 30_000_000, 12}`; tự nhập `{goal, user input}`
  - [x] Inline edit: chọn card non-emergency → expand editor tại chỗ: `CurrencyInput` (có sẵn `src/components/ui/CurrencyInput.tsx`) cho target + input số tháng/năm; custom thêm input tên; amounts `font-mono tabular-nums` + formatVND
  - [x] Nút Tiếp tục disabled khi `goal === null` hoặc goal đang edit không pass `goalSchema`
- [x] Task 4: i18n (AC: 4)
  - [x] Keys `setupV2.*` vào CẢ `src/lib/i18n/messages/vi.json` VÀ `en.json` (flat keys, interpolation `{{var}}`): tiêu đề câu hỏi, 5 option names + descriptions, labels editor, nav buttons
  - [x] Zero hardcode text trong components
- [x] Task 5: Verification (AC: all)
  - [x] `npm test` — tests mới pass + 310 tests cũ không regression
  - [x] `npm run type-check` — 0 errors mới (2 pre-existing layout.tsx đã biết)
  - [x] Business flows verify (browser hoặc trace, ghi rõ method): (a) `/setup` render shell 4 bước; (b) chọn goal → sửa số inline → Tiếp tục enable; (c) chưa chọn → Tiếp tục disabled; (d) reload giữa chừng → lựa chọn còn nguyên; (e) đổi vi/en → toàn bộ text đổi

## Dev Notes

### Context từ codebase (recon 02-07-2026)

- **Wizard cũ**: `SetupClient.tsx` (~160 dòng) lái bằng `useWizardStore` (`src/lib/stores/wizardStore.ts`, persist localStorage `growbase-wizard`), render `WizardLayout` + `WizardStep1Type...7Budget` từ `src/components/onboarding/`. KHÔNG sửa/xoá các file wizard cũ — story 4.7 dọn.
- **Store mới tách riêng** khỏi `wizardStore` (tránh đụng persist key cũ) và khỏi `appStore` (state onboarding là tạm thời, không thuộc workspace). sessionStorage per AC — Zustand persist: `storage: createJSONStorage(() => sessionStorage)`. SSR guard: persist tự xử lý, nhưng component đọc store cần `"use client"`.
- **`page.tsx` setup giữ nguyên server component** (fetch household đang dở — flow v2 chưa cần `initialHousehold`, truyền nhưng không dùng hoặc bỏ prop; giữ page.tsx thin wrapper).
- **Middleware** (`src/middleware.ts`): needsSetup = không có membership HOẶC household chưa `onboarding_completed` → `/setup`. Flow v2 không đổi middleware.
- **FundType đã có**: `src/types/app.ts:88` `FundType = "emergency"|"sinking"|"goal"|"investment"|"freedom"`; `FUND_TYPE_CONFIG` có icon/color/label per type. Goal picker chỉ dùng `"emergency"|"goal"`.
- **i18n**: flat keys, `useTranslation` từ `@/lib/i18n/useTranslation`, messages `src/lib/i18n/messages/{vi,en}.json` (vi ~703 dòng). Prefix mới `setupV2.*` — không đụng keys `setup.*` cũ (xoá ở 4.7).
- **CurrencyInput có sẵn** `src/components/ui/CurrencyInput.tsx` — dùng cho target amount, không tự viết.
- **formatVND**: `import { formatVND } from "@/lib/utils/currency"`.
- **sessionStorage pattern tham khảo**: `src/lib/hooks/useTransactionReminder.ts:27-37` (guard `typeof window === "undefined"`).

### Kiến trúc & constraints

- Emoji trong option list (🛡️🎓🏠✈️✏️) theo PRD FR2 — dùng emoji trực tiếp, không cần iconify cho picker này (PRD chỉ định emoji làm ngôn ngữ thị giác goal).
- `targetMonths` lưu số tháng (60/36/12) — deadline date thật tính ở story 4.4 khi tạo fund (`created_at + targetMonths`). UI hiển thị "5 năm"/"3 năm"/"1 năm" — editor cho sửa theo tháng hoặc năm, lưu tháng.
- Style guide (docs/06): cards `rounded-[13px] border border-border/40 bg-card shadow-card`, buttons pill `rounded-full min-h-[44px]`, inputs `h-[44px] rounded-[18px]` font 16px, semantic tokens only (bg-background/bg-card/text-foreground), light/dark OK tự nhiên qua tokens.
- Karpathy: không tạo stepper primitive, không custom hook dùng 1 lần, editor inline trong GoalStep không tách file trừ khi >~150 dòng.
- Store: selector pattern `useOnboardingV2Store((s) => s.goal)` — không subscribe cả store.

### Learnings từ story 4.1

- Type-check baseline có 2 errors pre-existing `src/app/(app)/layout.tsx:82-83` — không phải của story này, đừng sửa (ngoài scope).
- DB local đã reset sạch (0 households) — `/setup` sẽ là màn đầu khi login, thuận cho browser verify.
- Verify nghiệp vụ thật, không chỉ type-check (retro epic 3).

### Project Structure Notes

- Components mới: `src/components/onboarding/v2/` (OnboardingV2Shell, HookStep, GoalStep, IncomeStep, TadaStep) — namespace v2 tách khỏi wizard cũ cùng thư mục cha
- Tests: `src/__tests__/validations/`, `src/__tests__/stores/` (pattern hiện hành)

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story-4.2] — story + ACs
- [Source: _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/prd.md#F1] — FR2 goal picker spec
- [Source: src/lib/stores/wizardStore.ts] — store pattern tham khảo
- [Source: src/components/onboarding/WizardLayout.tsx:40-50] — progress bar pattern
- [Source: src/types/app.ts:88-101] — FundType + FUND_TYPE_CONFIG
- [Source: docs/06_STYLE_GUIDE.md] — visual tokens
- [Source: _bmad-output/implementation-artifacts/4-1-reset-test-data-seed.md] — learnings

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5) — Claude Code, workflow bmad-dev-story, 03-07-2026 (tiếp nối session 02-07-2026)

### Debug Log References

- Dev server (PID cũ 58519, chạy 11h40) trả 404 cho `/login` dù `page.tsx` tồn tại — stale build. Đã kill + xoá `.next` + restart, hết lỗi. Không phải bug code.
- ESLint chưa config trong project (next lint hỏi interactive setup) — skip lint check.

### Testing

| # | Flow | Method | Kết quả |
|---|------|--------|---------|
| 1 | `/setup` render shell 4 bước: progress bar, step label "1 / 4", HookStep, footer sticky Bỏ qua + "Đến lượt nhà bạn" | Manual (browser, DOM inspect qua Chrome) | ✅ Pass |
| 2 | CTA Hook → step 2/4, GoalStep hiện đúng 5 options (🛡️🎓🏠✈️✏️) với số mặc định formatVNDCompact + thời hạn | Manual (browser) | ✅ Pass |
| 3 | Chưa chọn goal → nút "Tiếp tục" disabled | Manual (browser) | ✅ Pass |
| 4 | Chọn "Quỹ học cho con" → inline editor expand (CurrencyInput "200.000.000 ₫" + months 60), "Tiếp tục" enabled | Manual (browser) | ✅ Pass |
| 5 | Sửa months = 0 → "Tiếp tục" disabled (goalSchema gate); months = 48 → enabled lại | Manual (browser) | ✅ Pass |
| 6 | Chọn "Quỹ khẩn cấp" → không có editor, "Tiếp tục" enabled (targetAmount null hợp lệ) | Manual (browser) | ✅ Pass |
| 7 | Reload giữa chừng → step 2/4 + goal + months=48 còn nguyên (sessionStorage `growbase-onboarding-v2`) | Manual (browser) | ✅ Pass |
| 8 | Đổi locale en → toàn bộ text đổi (title, 5 options, nav Back/Continue từ keys `setupV2.nav.*`) | Manual (browser) | ✅ Pass |
| 9 | Nút Back (Quay lại) → về step 1/4; touch targets Back/Tiếp tục = 44px đo getBoundingClientRect | Manual (browser) | ✅ Pass |
| 10 | Store: canProceed per step, next/prev bounds, reset | Automated (vitest) | ✅ Pass |
| 11 | goalSchema edges: target 0/âm, months 0, name rỗng, emergency null target hợp lệ | Automated (vitest) | ✅ Pass |

Full suite: **327/327 tests pass** (310 cũ + 17 mới, 0 regression). Type-check: 0 errors mới (2 pre-existing `src/app/(app)/layout.tsx:82-83` đã biết, ngoài scope).

### Completion Notes List

- Task 1 (store + validation + unit tests) và Task 3 (GoalStep), Task 4 (i18n 20 keys setupV2.* vi+en) đã implement ở session 02-07-2026; session này verify lại toàn bộ khớp spec.
- Session này hoàn thiện Task 2: tạo `OnboardingV2Shell.tsx` (progress bar copy pattern WizardLayout:40-50 + footer nav sticky) — trước đó SetupClient dùng thẳng `WizardLayout` cũ, sẽ chặn story 4.7 xoá wizard cũ. Shell tự subscribe store (step/next/prev/canProceed), SetupClient chỉ còn hydration guard + render step theo `step`.
- Thêm 4 keys `setupV2.nav.back/next/skip/stepLabel` (vi+en) — shell không dùng keys `setup.*` cũ (bị xoá ở 4.7).
- **Deviation 1**: store không có action `setStep` như spec Task 1 — không có consumer nào cần jump step tùy ý, `next/prev` đủ (Karpathy: không thêm code chưa dùng). Story 4.4/4.5 cần thì thêm sau.
- **Deviation 2**: footer shell dùng `border-t border-border/40` thay `shadow-soft` của WizardLayout — `shadow-soft` là dead token (=none trong tailwind.config, per style guide audit 02-07-2026).
- Nit đã biết: en hiển thị "1 years" (key `setupV2.goal.years` = "{{n}} years") — số ít không đổi dạng. Vi không bị. Không chặn AC.
- Goal name lưu vào store theo locale tại thời điểm chọn (vd đang vi thì name="Quỹ học cho con") — đổi locale sau đó không đổi name đã lưu. Chấp nhận: name là data user sẽ thành tên fund ở story 4.4.

### File List

- src/components/onboarding/v2/OnboardingV2Shell.tsx (mới — session này)
- src/components/onboarding/v2/HookStep.tsx (mới)
- src/components/onboarding/v2/GoalStep.tsx (mới)
- src/components/onboarding/v2/IncomeStep.tsx (mới)
- src/components/onboarding/v2/TadaStep.tsx (mới)
- src/lib/stores/onboardingV2Store.ts (mới)
- src/lib/validations/onboardingV2.ts (mới)
- src/__tests__/stores/onboardingV2Store.test.ts (mới)
- src/__tests__/validations/onboardingV2.test.ts (mới)
- src/app/setup/SetupClient.tsx (sửa — thay wizard 7 bước bằng flow v2; session này rewire sang OnboardingV2Shell)
- src/app/setup/page.tsx (sửa — bỏ fetch initialHousehold, giữ thin wrapper + auth redirect)
- src/lib/i18n/messages/vi.json (sửa — 24 keys setupV2.*)
- src/lib/i18n/messages/en.json (sửa — 24 keys setupV2.*)

## Change Log

- 02-07-2026: Store + validation + tests, GoalStep, step placeholders, i18n setupV2.* (20 keys), SetupClient chuyển sang flow v2 (tạm dùng WizardLayout).
- 03-07-2026: Tạo OnboardingV2Shell riêng (ngắt phụ thuộc WizardLayout/keys setup.* cũ), thêm 4 keys setupV2.nav.*, rewire SetupClient. Verify 11 business flows (9 manual browser + 2 automated). 327/327 tests pass. Status → review.
