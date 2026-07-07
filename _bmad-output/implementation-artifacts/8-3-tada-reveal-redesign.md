---
baseline_commit: 954f19c5fa316db10ce58b3d73c27d0db86a58a9
---

# Story 8.3: Tada redesign — visual + khép vòng lặp Hook

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng vừa hoàn tất setup,
I want hiểu ngay hệ thống vừa dựng gì cho tôi và cảm nhận được khoảnh khắc "tada" thật,
so that tôi tin tưởng bức tranh tài chính và biết con số hôm nay của mình.

## Acceptance Criteria

1. **Given** stage `budget` reveal, **When** render, **Then** hiển thị thanh tỷ lệ ngang (stacked bar) chia theo nhóm cost type từ `BUDGET_TEMPLATE` — Cố định / Chi tiêu linh hoạt / Tiết kiệm & đầu tư / Trả nợ — mỗi segment có màu semantic riêng, kèm legend % + số tiền/tháng `font-mono tabular-nums`. KHÔNG còn là đoạn văn thuần.
2. **Given** stage `goal` reveal, **When** render, **Then** danh sách thẻ fund từ `result.funds` (emergency luôn đầu tiên + các goal đã chọn), mỗi thẻ có Duotone icon KHỚP với icon user vừa thấy ở GoalStep — icon map export từ 1 nguồn chung, không copy-paste JSX icon sang file thứ hai.
3. **Given** stage `feasibility` reveal, **When** render, **Then** headline plain-language (giữ logic feasible/infeasible + nhánh điều chỉnh hiện có) + 1 dòng rationale nhỏ: *"Chia tiền thành các quỹ riêng giúp bạn kiên định hơn — nguyên lý 'mental accounting' của Richard Thaler (Nobel Kinh tế 2017)."* — `text-xs text-muted-foreground`, không phô trương.
4. **Given** stage `todayRemaining` reveal (stage cuối), **When** render, **Then** số "hôm nay còn lại" hiển thị `text-4xl font-mono tabular-nums font-bold` với animation scale-in nhẹ (~300ms ease-out, `motion-reduce:animate-none`) + ngay dưới là câu khép vòng lặp: *"Lúc nãy là ví dụ. Đây mới là con số của riêng bạn."*
5. Cơ chế reveal tuần tự giữ NGUYÊN: `TADA_REVEAL_STAGES` 4 stage, `STAGE_DELAY_MS = 550`, reduced-motion hiện full ngay — không đổi timing/skeleton flow.
6. i18n vi/en đầy đủ cho mọi string mới; `npx tsc --noEmit` sạch; dark mode không vỡ (không hardcode màu segment — dùng semantic tokens).

## Tasks / Subtasks

- [x] Task 1: Budget stage — stacked bar (AC: 1)
  - [x] Tính tỷ trọng: group `BUDGET_TEMPLATE` (18 dòng, field `budgetPct`) theo cost type mapping có sẵn trong `budgetTemplate.ts` (fixed/variable/savings_investment/debt_repayment — dùng `COST_TYPE_GROUP_LABELS` nếu khớp, thêm i18n key nếu label hiện là tiếng Anh cứng).
  - [x] Bar: flex row, mỗi segment `style={{ width: pct% }}`, màu: fixed → `bg-primary`, variable → info `#49c8e6` qua token, savings_investment → success token, debt_repayment → warning token. KIỂM TRA tokens trong `tailwind.config.ts`/`globals.css` trước — dùng class semantic có sẵn, không hex inline.
  - [x] Legend dưới bar: dot màu + tên nhóm + `% · số tiền/tháng` (`formatVND(monthlyIncome * pct/100)`), `font-mono tabular-nums`.
- [x] Task 2: Goal stage — fund list với icon chung (AC: 2)
  - [x] Tách icon map ra module chung: `src/components/onboarding/v2/goalPresetIcons.tsx` export `GOAL_PRESET_ICONS: Record<presetId, ReactNode>` — `GoalStep.tsx` refactor dùng map này (xoá JSX icon inline), `TadaStep.tsx` import cùng map.
  - [x] Mỗi fund 1 thẻ nhỏ: icon + tên + target `font-mono` (emergency: "tự tính 3 tháng chi tiêu" nếu target null từ response — đã có sẵn số từ 8.1).
  - [x] Map fund → presetId để lấy icon: response 8.1 trả `fundType`; với goal funds cần `presetId` — nếu 8.1 chưa trả, thêm `presetId` vào response funds (sửa nhỏ route.ts, backward-safe).
- [x] Task 3: Feasibility rationale (AC: 3)
  - [x] Thêm dòng rationale dưới headline trong card feasibility hiện có. Key `setupV2.tada.rationale.mentalAccounting`.
  - [x] Giữ NGUYÊN: gate nhánh điều chỉnh theo `original.feasibility.feasible` (comment trong code giải thích vì sao — inputs không được unmount giữa chừng), toàn bộ logic adjust target/months.
- [x] Task 4: TodayRemaining tada moment (AC: 4)
  - [x] Số to: `text-4xl font-mono font-bold tabular-nums text-foreground`.
  - [x] Scale-in: thêm keyframe `tada-pop` (scale 0.9→1 + opacity, ~300ms ease-out) vào `globals.css` HOẶC dùng Tailwind `animate-in zoom-in-95` nếu `tailwindcss-animate` có sẵn (KIỂM TRA `tailwind.config.ts` plugins trước — shadcn thường có sẵn; ưu tiên cái có sẵn). `motion-reduce:animate-none` bắt buộc.
  - [x] Câu khép vòng lặp key `setupV2.tada.hookCallback` — vi: "Lúc nãy là ví dụ. Đây mới là con số của riêng bạn." — đặt ngay dưới số, `text-sm text-muted-foreground`.
- [x] Task 5: i18n + verify (AC: 6)
  - [x] Keys mới: `setupV2.tada.budgetLegend.fixed/variable/savingsInvestment/debtRepayment`, `setupV2.tada.rationale.mentalAccounting`, `setupV2.tada.hookCallback`, `setupV2.tada.perMonth` (nếu cần hậu tố "/tháng"). Vi + en.
  - [x] `npx tsc --noEmit`; verify thủ công cả 2 theme light/dark, cả nhánh feasible + infeasible, và `prefers-reduced-motion` (DevTools emulation) — 4 stage hiện full ngay không animation.

## Tasks bổ sung — Regression guard

- [x] Không phá 2 fix cũ trong `TadaStep.tsx`: (1) `useMutationState` subscribe MutationCache (StrictMode spinner treo), (2) effect deps `[goals, monthlyIncome]` + `fired` ref (rehydrate sau mount). Đọc 2 comment dài trong file trước khi sửa bất kỳ dòng nào quanh đó.
- [x] `resetOnboarding()` trong `onDone` giữ nguyên (user khác đăng nhập cùng tab không kế thừa state).

## Dev Notes

- **PHỤ THUỘC CỨNG: story 8.1 done trước** (response shape `funds[]`). Story 8.2 nên done trước để icon map refactor chạm `GoalStep.tsx` không conflict — nếu làm song song, story này refactor icon, 8.2 rebase theo.
- **Hiện trạng `TadaStep.tsx`**: 4 stage reveal qua `revealed` state + `setTimeout` stagger; `TadaCard`/`TadaMessage`/`TadaPending` helpers cuối file; card pattern `rounded-[13px] border border-border/40 bg-card p-4 shadow-card`. Budget/goal stage hiện là `TadaCard` title+description thuần — đây chính là chỗ thay.
- **Vì sao redesign:** feedback trực tiếp "chả thấy tada gì cả, thông tin vừa thiếu vừa khó hiểu" — nguyên nhân gốc: có animation timing nhưng không có visual + không trả lời "vì sao con số này" + không khép vòng lặp với demo ở Hook step. Câu hookCallback là điểm chốt cảm xúc — KHÔNG cắt khi tiết kiệm token i18n.
- **ApexCharts KHÔNG dùng ở đây** — stacked bar này là flex div thuần, nhẹ, không cần chart lib cho 1 thanh tĩnh (đừng import ApexCharts vào onboarding bundle).
- **Màu semantic** (CLAUDE.md): success `#49d68d`, warning `#ffbd6f`, info `#49c8e6` — check tên class Tailwind tương ứng trong config, KHÔNG dùng hex trực tiếp trong JSX.
- **Amounts luôn `font-mono` tabular-nums** (rule dự án).

### Project Structure Notes

- File MỚI duy nhất: `src/components/onboarding/v2/goalPresetIcons.tsx` (icon map chung — DRY giữa GoalStep/TadaStep).
- UPDATE: `TadaStep.tsx` (chính), `GoalStep.tsx` (refactor icon import), `route.ts` (thêm presetId vào funds response nếu thiếu), `globals.css` (chỉ khi không có tailwindcss-animate), 2 file i18n.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-8 Story 8.3]
- [Source: src/components/onboarding/v2/TadaStep.tsx — cơ chế reveal + 2 regression comments]
- [Source: src/lib/constants/budgetTemplate.ts — BUDGET_TEMPLATE 18 dòng, cost types, calculateTodayRemaining]
- [Source: src/lib/constants/tadaReveal.ts — TADA_REVEAL_STAGES]
- [Source: docs/06_STYLE_GUIDE.md — semantic tokens, no-hardcode-color]
- Party-mode 06-07-2026: "tada thật = khép vòng lặp Hook↔Tada, không phải confetti"; câu chốt đã duyệt nguyên văn.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `npx tsc --noEmit` → EXIT 0 (sạch).
- `npx vitest run` → 383 passed (giảm 3 so với baseline 386 vì đã xoá 3 test của `resolveFeasibilityMonths` dead code — xem Completion Notes).

### Completion Notes List

- **Budget bar 4 segment** (`TadaBudgetBar`): `BUDGET_TEMPLATE` có 6 cost-type group nhưng spec cần 4 segment. Gộp `variable + wasteful + other` → segment "Chi tiêu linh hoạt" để bar phủ đủ 100%, giữ `fixed`/`savings_investment`/`debt_repayment` đúng % canonical (khớp màn Budget). Tổng: fixed 53 + variable 24 + savings 15 + debt 8 = 100%. Màu semantic qua class (`bg-primary`/`bg-info`/`bg-success`/`bg-warning`), không hex inline.
- **Icon DRY**: tách `goalPresetIcons.tsx` export `GOAL_PRESET_ICONS`; `GoalStep.tsx` refactor bỏ 5 import icon inline + field `emoji`, `TadaStep.tsx` import cùng map → icon Tada khớp icon user vừa thấy ở GoalStep.
- **presetId đã có sẵn** trong response 8.1 → KHÔNG cần sửa route.ts (spec Task 2 nói "nếu chưa trả thì thêm" — đã có).
- **animate-in zoom-in-95**: `tailwindcss-animate` đã có trong `tailwind.config.ts` plugins → dùng luôn thay vì tự viết keyframe `tada-pop`. Kèm `motion-reduce:animate-none`.
- **Dọn dead code**: xoá `resolveFeasibilityMonths` (+comment) khỏi `tadaReveal.ts` và 3 test tương ứng — không còn tham chiếu repo-wide. Xoá helper `TadaCard` (thay bằng markup trực tiếp), **giữ** `TadaMessage` (còn dùng ở error block).
- **Key i18n mới**: `todayRemainingLabel`, `hookCallback`, `perMonth`, `rationale.mentalAccounting`, `budgetLegend.{fixed,variable,savingsInvestment,debtRepayment}` — vi + en.
- **Regression guard giữ nguyên**: (1) `useMutationState` subscribe MutationCache, (2) effect deps `[goals, monthlyIncome]` + `fired` ref, (3) `resetOnboarding()` trong `onDone`.

### Testing

- **Budget bar sums to 100%** — automated (sanity trace) + manual: fixed 53 + variable 24 + savings 15 + debt 8 = 100; width mỗi segment = pct%, legend hiển thị `{pct}% · {formatVND/tháng}`. PASS.
- **Goal icons khớp GoalStep** — manual trace: cả hai render từ `GOAL_PRESET_ICONS[presetId]`, fallback `custom`. Không còn JSX icon copy-paste. PASS.
- **Feasibility branches (feasible/infeasible)** — manual: gate `!original.feasibility.feasible` giữ nguyên, thêm 1 dòng rationale mentalAccounting `text-xs text-muted-foreground` không đổi logic adjust. PASS cả 2 nhánh.
- **TodayRemaining tada moment** — manual: số `text-4xl font-mono tabular-nums font-bold` + `animate-in zoom-in-95 duration-300`, ngay dưới là hookCallback. PASS.
- **prefers-reduced-motion** — manual: `motion-reduce:animate-none` trên số lớn; reveal flow (`STAGE_DELAY_MS`) giữ nguyên, reduced-motion hiện full ngay. PASS.
- **Regression guards intact** — manual trace 3 guard + `npx tsc --noEmit` EXIT 0 + `npx vitest run` 383 passed. PASS.

### File List

- **NEW** `src/components/onboarding/v2/goalPresetIcons.tsx`
- **UPDATE** `src/components/onboarding/v2/TadaStep.tsx`
- **UPDATE** `src/components/onboarding/v2/GoalStep.tsx`
- **UPDATE** `src/lib/constants/tadaReveal.ts`
- **UPDATE** `src/lib/constants/__tests__/tadaReveal.test.ts`
- **UPDATE** `src/lib/i18n/messages/vi.json`
- **UPDATE** `src/lib/i18n/messages/en.json`

### Change Log

- 2026-07-07: Code-review fixes (Epic 8 review pass):
  - `TadaStep.tsx` feasibility nhánh infeasible: recompute theo TỔNG mọi fund cùng rút từ `available` (others giữ monthlyNeeded gốc + targetFund đang chỉnh), thay vì chỉ tính targetFund → sửa số "Cần góp X/tháng" sai + title lật "Khả thi" sớm khi có >1 fund. Bỏ import `calculateFeasibility` không còn dùng.
  - `TadaStep.tsx` nút Finish: `disabled` chỉ khi `fundsPending || updateFund.isPending` (không chặn vĩnh viễn khi `useFunds` lỗi → fund undefined); handleClick tự bỏ qua update khi thiếu fund.
