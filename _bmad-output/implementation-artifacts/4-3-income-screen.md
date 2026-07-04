---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 4.3: Màn Thu nhập

Status: review

## Story

As a người dùng mới,
I want nhập đúng một con số — thu nhập hàng tháng của gia đình,
so that app có đủ dữ liệu dựng bức tranh tài chính cho tôi mà không phải khai form dài.

## Acceptance Criteria

1. **Given** user đã chọn mục tiêu và sang màn Thu nhập
   **When** màn hình render
   **Then** có đúng một trường nhập: "Thu nhập hàng tháng của gia đình bạn khoảng bao nhiêu?" — gắn nhãn thu nhập của hộ, không gắn cá nhân người nhập (AR9)
   **And** amount input dùng `font-mono`, format VND, font-size 16px

2. **Given** user nhập giá trị ≤ 0 hoặc bỏ trống
   **When** user bấm tiếp tục
   **Then** validation chặn với message thân thiện (Zod schema), form giữ nguyên giá trị

3. **Given** user đã chọn 🛡️ Quỹ khẩn cấp ở màn trước
   **When** income hợp lệ được nhập
   **Then** target quỹ khẩn cấp tự tính = 3 × tổng budget chi tiêu tháng (scale theo income — chốt OQ2: tính từ budget)
   **And** user thấy số target đã tính trước khi sang Tada, sửa được nếu muốn

## Tasks / Subtasks

- [x] Task 1: Validation schema + helper tính target quỹ khẩn cấp (AC: 2, 3)
  - [x] `src/lib/validations/onboardingV2.ts` — thêm `monthlyIncomeSchema` = `z.number().positive(<message thân thiện tiếng Việt>)`; export dùng chung cho IncomeStep + story 4.4
  - [x] `src/lib/constants/budgetTemplate.ts` — thêm helper pure `estimateEmergencyTarget(monthlyIncome: number): number` = `EMERGENCY_FUND_MONTHS (3) × monthlyIncome × (Σ budgetPct các dòng chi tiêu / 100)`, làm tròn xuống bội `100_000`. "Dòng chi tiêu" = `costTypeGroup ∈ SPENDING_COST_TYPE_GROUPS` (named constant, xem Dev Notes — quyết định OQ2)
  - [x] Unit tests: mở rộng `src/lib/constants/__tests__/budgetTemplate.test.ts` cho `estimateEmergencyTarget` (income chuẩn 20tr, làm tròn, income lẻ, tỉ lệ đúng Σ pct) + `src/__tests__/validations/onboardingV2.test.ts` cho `monthlyIncomeSchema` (0, âm, dương, không nguyên)
- [x] Task 2: Store — canProceed step 2 qua schema (AC: 2)
  - [x] `src/lib/stores/onboardingV2Store.ts` — `canProceed()` step 2 đổi từ check thủ công `> 0` sang `monthlyIncomeSchema.safeParse(s.monthlyIncome).success` (một nguồn validation duy nhất)
  - [x] Cập nhật `src/__tests__/stores/onboardingV2Store.test.ts` nếu message/behavior đổi (bounds không đổi — 9 tests store pass nguyên, không cần sửa)
- [x] Task 3: IncomeStep UI (AC: 1, 2, 3)
  - [x] `src/components/onboarding/v2/IncomeStep.tsx` — thay placeholder bằng màn thật: heading câu hỏi (pattern h1/subtitle giống `GoalStep.tsx:109-112`), đúng MỘT trường `CurrencyInput` (có sẵn — `value: number`, `onChange: (v: number) => void`), Label gắn nhãn thu nhập hộ gia đình
  - [x] Đọc/ghi store qua selector: `monthlyIncome` + `setMonthlyIncome` (CurrencyInput trả 0 khi rỗng → lưu `null` khi 0, giữ pattern `v || null` như GoalStep)
  - [x] Inline error: khi user đã nhập rồi xoá/để 0 → hiện message từ i18n key dưới input (text-destructive, text-sm, guard `touched`); giá trị đã gõ không bị clear. Nút "Tiếp tục" của Shell tự disabled qua `canProceed` — không sửa Shell
  - [x] Preview quỹ khẩn cấp: khi `goal?.presetId === "emergency"` và income hợp lệ → card `rounded-[13px] border border-border/40 bg-card shadow-card` hiển thị target = `goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome)` (CurrencyInput đã có font-mono + format VND) + dòng giải thích "3 × chi tiêu tháng"
  - [x] Target sửa được tại chỗ: CurrencyInput trong preview card → `setGoal({ ...goal, targetAmount: v || null })`. `targetAmount === null` = "auto" (recompute theo income); user đã sửa → giữ nguyên giá trị user kể cả khi income đổi sau đó
- [x] Task 4: i18n (AC: 1, 3)
  - [x] Thêm 7 keys `setupV2.income.*` vào CẢ `vi.json` VÀ `en.json` (flat keys): title, householdHint, inputLabel, error, emergencyTitle, emergencyDesc, emergencyEditLabel
  - [x] Xoá key chết `setupV2.income.placeholder` khỏi cả 2 file (IncomeStep không còn dùng)
  - [x] Zero hardcode text trong component
- [x] Task 5: Verification (AC: all)
  - [x] `npm test` — 334/334 pass (327 cũ + 7 mới, 0 regression)
  - [x] `npm run type-check` — 0 errors mới (2 pre-existing `src/app/(app)/layout.tsx:82-83` đã biết, ngoài scope)
  - [x] Business flows verify — browser automation bị block (Chrome extension treo `document_idle` với mọi trang kể cả example.com — lỗi môi trường, không phải app), toàn bộ flows verify bằng automated tests + manual code trace, chi tiết ở Dev Agent Record → Testing

## Dev Notes

### Nền tảng từ story 4.2 (đã review) — KHÔNG làm lại

- **Store có sẵn**: `src/lib/stores/onboardingV2Store.ts` — `monthlyIncome: number | null` + `setMonthlyIncome` + `canProceed()` step 2 đã check `> 0`. Chỉ nâng cấp sang schema, không đổi shape. Persist sessionStorage key `growbase-onboarding-v2` — reload giữ giá trị tự động (AC flow g).
- **Shell có sẵn**: `src/components/onboarding/v2/OnboardingV2Shell.tsx` — footer nav sticky, nút "Tiếp tục" disabled theo `canProceed`. IncomeStep KHÔNG render nút điều hướng riêng, KHÔNG sửa Shell.
- **`IncomeStep.tsx` hiện là placeholder 13 dòng** — thay toàn bộ nội dung, giữ tên file/export.
- **`goalSchema` có sẵn**: emergency hợp lệ với `targetAmount/targetMonths = null` (refine chỉ bắt buộc với fundType "goal"). User override target emergency → `targetAmount` set, vẫn pass schema. `targetMonths` của emergency GIỮ null — không thêm deadline cho quỹ khẩn cấp ở story này (4.4 xử lý).
- **CurrencyInput có sẵn** `src/components/ui/CurrencyInput.tsx`: props `value: number`, `onChange: (v: number) => void`, đã có `h-[44px] rounded-[18px]`, `inputMode="numeric"`, font-mono, format VND — KHÔNG tự viết input mới. Pattern dùng: `value={monthlyIncome ?? 0}` / `onChange={(v) => setMonthlyIncome(v || null)}` (như `GoalStep.tsx:175-179`).
- **GoalStep là mẫu style**: heading `text-2xl font-bold` + subtitle `text-sm text-muted-foreground`, card `rounded-[13px] border border-border/40 bg-card shadow-card`, Label + space-y-1.5.

### Quyết định OQ2 — công thức target quỹ khẩn cấp `[ASSUMPTION — cần DzungDuong confirm]`

- PRD chốt hướng: tính từ **budget**, không phải thu nhập thô. Budget seed = `BUDGET_TEMPLATE` (`src/lib/constants/budgetTemplate.ts`) — 18 dòng `budgetPct` (% thu nhập, tổng 100%).
- **"Tổng budget chi tiêu tháng"** = các dòng có `costTypeGroup ∈ {"fixed", "variable", "wasteful", "debt_repayment"}` = 53 + 13 + 7 + 8 = **81%** thu nhập. Loại trừ: `income` (không phải chi), `savings_investment` (15% — để dành, không phải chi tiêu), `other` (4% — "Chênh lệch ghi chép" + "Vay nợ" là dòng sổ sách, không phải chi tiêu sống).
- Công thức: `target = 3 × income × 0.81`, làm tròn xuống bội 100.000đ. Ví dụ income 20.000.000 → 3 × 16.200.000 = 48.600.000đ.
- Named constants: `EMERGENCY_FUND_MONTHS = 3`, `SPENDING_COST_TYPE_GROUPS` — đổi được một chỗ. **Đặt helper cạnh `BUDGET_TEMPLATE`** trong `budgetTemplate.ts` (derive từ chính template — không hardcode 81; story 4.4 API reuse cùng helper để số client preview = số server tạo fund).

### Kiến trúc & constraints

- Màn này **thuần client-side** — không API call, không ghi database (AC story 4.2: chưa ghi DB cho tới Tada). Không TanStack Query, không queryKeys.
- AR9: income là số của **household** — copy/nhãn phải nói rõ "của cả nhà", không gắn tên người nhập. Không có field chọn người.
- Style guide (docs/06): input `h-[44px] rounded-[18px]` font 16px (CurrencyInput đã chuẩn), semantic tokens only (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`), KHÔNG hardcode màu, KHÔNG `rounded-2xl` cho data card (13px), light/dark tự nhiên qua tokens.
- i18n flat keys prefix `setupV2.income.*`, interpolation `{{var}}` nếu cần. Đủ vi + en. Tone NFR2: thân mật, xưng "bạn", không giọng ngân hàng.
- Karpathy: không tách sub-component/custom hook cho màn ~100 dòng; helper là pure function có test; không thêm state ngoài store (trừ local UI state "đã touched" nếu cần cho inline error).
- Store selector pattern: `useOnboardingV2Store((s) => s.monthlyIncome)` — không subscribe cả store.

### Learnings từ story 4.2

- Type-check baseline có 2 errors pre-existing `src/app/(app)/layout.tsx:82-83` — ngoài scope, đừng sửa.
- Baseline tests: **327/327 pass** — regression gate.
- Dev server có thể stale build (404 lạ) → kill + xoá `.next` + restart trước khi nghi bug code.
- ESLint chưa config (next lint hỏi interactive) — skip lint.
- Verify nghiệp vụ thật trên browser, không chỉ type-check (retro epic 3). DB local đã reset sạch — login là vào `/setup` ngay.
- Goal name lưu theo locale tại thời điểm chọn — đã chấp nhận ở 4.2, không "sửa" ở story này.

### Project Structure Notes

- Sửa: `src/components/onboarding/v2/IncomeStep.tsx`, `src/lib/stores/onboardingV2Store.ts`, `src/lib/validations/onboardingV2.ts`, `src/lib/constants/budgetTemplate.ts`, `src/lib/i18n/messages/{vi,en}.json`
- Tests: `src/__tests__/validations/onboardingV2.test.ts`, `src/__tests__/stores/onboardingV2Store.test.ts`, `src/lib/constants/__tests__/budgetTemplate.test.ts` (pattern hiện hành — test constants nằm cạnh constants)
- KHÔNG tạo file component mới, KHÔNG đụng wizard cũ (xoá ở 4.7), KHÔNG đụng API routes (4.4)

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story-4.3] — story + ACs + AR9, OQ2
- [Source: _bmad-output/implementation-artifacts/4-2-flow-skeleton-goal-screen.md] — store/shell/schema nền + learnings
- [Source: src/lib/constants/budgetTemplate.ts] — BUDGET_TEMPLATE 18 dòng budgetPct + costTypeGroup
- [Source: src/components/onboarding/v2/GoalStep.tsx] — style mẫu heading/card/CurrencyInput usage
- [Source: src/components/ui/CurrencyInput.tsx] — input chuẩn 44px/18px/font-mono
- [Source: docs/06_STYLE_GUIDE.md] — visual tokens

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5) — Claude Code, workflow bmad-dev-story, 03-07-2026

### Debug Log References

- Chrome extension (claude-in-chrome) treo "Page still loading (document_idle)" với MỌI trang — cả example.com, cả sau khi restart dev server + tab mới. Lỗi môi trường extension (khả năng đang chờ permission prompt trong Chrome), không phải bug app. Browser verify không thực hiện được session này.
- Dev server cũ (6h uptime, start trước khi Supabase local up) đã kill + xoá `.next` + restart theo learnings 4.2.
- Supabase local down đầu session (Docker daemon chưa chạy) — đã `open -a Docker` + `npx supabase start`. Tạo test user `story43@test.local` qua admin API (local dev) chuẩn bị cho browser verify — user này chưa dùng đến, để lại cho DzungDuong verify tay.
- ESLint chưa config (next lint hỏi interactive) — skip lint, như 4.1/4.2.

### Testing

| # | Flow | Method | Kết quả |
|---|------|--------|---------|
| 1 | `monthlyIncomeSchema`: dương pass; 0/âm/null/undefined/string fail | Automated (vitest, 3 tests) | ✅ Pass |
| 2 | `estimateEmergencyTarget`: 20tr → 48.6tr (3 × 81%); làm tròn xuống bội 100k (10.137.000 → 24.600.000); income 0 → 0; Σ pct chi tiêu derive từ template = 81 | Automated (vitest, 4 tests) | ✅ Pass |
| 3 | Store `canProceed` step 2 qua schema: null/≤0 → false, >0 → true; next/prev bounds; reset | Automated (vitest, 9 tests store giữ nguyên pass sau đổi implementation) | ✅ Pass |
| 4 | Step 3/4 render IncomeStep — đúng một trường nhập + nhãn hộ gia đình | Manual trace: `SetupClient.tsx` map step 2 → `<IncomeStep />`; component có đúng 1 CurrencyInput income + Label/hint từ keys `setupV2.income.*` | ✅ Pass (trace) |
| 5 | Nhập hợp lệ → "Tiếp tục" enabled; xoá/0 → error hiện + disabled + giá trị không mất | Manual trace: `onChange → setMonthlyIncome(v \|\| null)` → `canProceed()` safeParse → Shell `disabled={!canProceed}`; error render khi `touched && !incomeValid`; value từ store không bị clear | ✅ Pass (trace) |
| 6 | Emergency preview: chọn 🛡️ ở step 2 → step 3 income hợp lệ → card target xuất hiện đúng công thức; goal khác → không có card | Manual trace: `showEmergencyPreview = goal?.presetId === "emergency" && incomeValid`; số từ `estimateEmergencyTarget` (công thức automated-tested ở #2) | ✅ Pass (trace) |
| 7 | Sửa target trong preview → giữ giá trị user khi income đổi; xoá target → về auto | Manual trace: display `goal.targetAmount ?? estimate`; edit set `targetAmount`; income change không ghi đè; clear → `null` = auto recompute | ✅ Pass (trace) |
| 8 | Reload giữa chừng → income còn nguyên | Manual trace: `monthlyIncome` nằm trong cùng persist state sessionStorage đã verify reload ở 4.2 (flow #7 story 4.2) | ✅ Pass (trace) |
| 9 | Đổi vi/en → toàn bộ text đổi | Automated check: 7/7 keys tồn tại cả vi.json + en.json, key chết placeholder đã xoá cả 2 file; grep component 0 hardcode text | ✅ Pass |
| 10 | Input font 16px + touch target ≥44px | Manual trace: CurrencyInput có sẵn `h-[44px]` + `text-base` (16px) — component chuẩn đã verify ở GoalStep 4.2 | ✅ Pass (trace) |

Full suite: **334/334 tests pass** (327 cũ + 7 mới, 0 regression). Type-check: 0 errors mới (2 pre-existing `src/app/(app)/layout.tsx:82-83`, ngoài scope).

⚠️ **Browser verify bị block bởi lỗi extension môi trường** — flows 4-8, 10 verify bằng code trace thay vì browser thật. DzungDuong cần click qua flow một lần trên browser (xem TL;DR).

### Completion Notes List

- **Quyết định OQ2 (assumption cần confirm)**: "tổng budget chi tiêu tháng" = các dòng `BUDGET_TEMPLATE` có `costTypeGroup ∈ {fixed, variable, wasteful, debt_repayment}` = **81% thu nhập** (loại `savings_investment` 15% và `other` 4% — dòng sổ sách). Target = 3 × income × 0.81, làm tròn xuống bội 100k. Constants `EMERGENCY_FUND_MONTHS` + `SPENDING_COST_TYPE_GROUPS` đặt cạnh `BUDGET_TEMPLATE` — story 4.4 API phải reuse cùng helper để số client = số server.
- Semantic `targetAmount === null` = "auto": preview hiển thị số tự tính và recompute khi income đổi; user sửa → giá trị user được giữ; user xoá input → quay về auto. Store không lưu số tự tính — story 4.4 nhận `targetAmount` null cho emergency thì tự tính server-side bằng cùng helper.
- `canProceed` step 2 nâng từ check `> 0` thủ công lên `monthlyIncomeSchema.safeParse` — một nguồn validation duy nhất, 9 tests store cũ pass nguyên không sửa.
- Zod message trong schema là tiếng Việt hardcode (nhất quán pattern `goalSchema` đã chấp nhận ở 4.2); message hiển thị trong UI dùng i18n key `setupV2.income.error` riêng.
- `targetMonths` của emergency giữ `null` — không thêm deadline cho quỹ khẩn cấp ở story này (4.4 xử lý).

### File List

- src/components/onboarding/v2/IncomeStep.tsx (sửa — thay placeholder bằng màn Thu nhập thật)
- src/lib/validations/onboardingV2.ts (sửa — thêm monthlyIncomeSchema)
- src/lib/constants/budgetTemplate.ts (sửa — thêm SPENDING_COST_TYPE_GROUPS, EMERGENCY_FUND_MONTHS, estimateEmergencyTarget)
- src/lib/stores/onboardingV2Store.ts (sửa — canProceed step 2 qua schema)
- src/lib/i18n/messages/vi.json (sửa — 7 keys setupV2.income.*, xoá placeholder)
- src/lib/i18n/messages/en.json (sửa — 7 keys setupV2.income.*, xoá placeholder)
- src/__tests__/validations/onboardingV2.test.ts (sửa — 3 tests monthlyIncomeSchema)
- src/lib/constants/__tests__/budgetTemplate.test.ts (sửa — 4 tests estimateEmergencyTarget)

## Change Log

- 03-07-2026: Story file tạo (create-story). Implement toàn bộ: monthlyIncomeSchema + estimateEmergencyTarget (quyết định OQ2: 81% income) + canProceed qua schema + IncomeStep UI (income input + emergency preview editable) + 14 i18n keys vi/en. 334/334 tests pass. Browser verify bị block bởi lỗi Chrome extension môi trường — flows verify bằng automated tests + code trace. Status → review.
