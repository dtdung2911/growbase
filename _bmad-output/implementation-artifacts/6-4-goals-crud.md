---
baseline_commit: aaabb040a2808c0479a159b5f7cfbcf9a79b2c7a
---

# Story 6.4: CRUD goals trong app

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng sau onboarding,
I want thêm/sửa/xoá mục tiêu ngay trong app không giới hạn số lượng,
so that cuộc sống thay đổi thì mục tiêu đổi theo — không bị khoá vào lựa chọn lúc onboarding.

## Acceptance Criteria

1. **Given** trang Funds hiện có (fund type `goal`/`emergency` đã CRUD được)
   **When** user tạo goal mới
   **Then** form có đủ: tên, số đích, **thời hạn (deadline)** — field mới cho expected line; danh sách gợi ý + số mặc định như onboarding tái dùng được (FR17, `[ASSUMPTION: UI dùng lại trang Funds]`)
   **And** tạo qua atomic RPC như mọi fund (A-1), không giới hạn số lượng goal

2. **Given** user sửa target hoặc deadline goal đang chạy
   **When** lưu thành công
   **Then** đường kỳ vọng + narrative recompute theo số mới ngay (engine 6.1 nhận input mới), cache invalidate qua `keys.*`

3. **Given** user xoá goal
   **When** thao tác xoá
   **Then** ConfirmDialog trước mutation (destructive), balance còn lại xử lý theo luồng release fund hiện hành
   **And** goal bị xoá biến khỏi dashboard + insight — không narrative mồ côi

4. **Given** goal do onboarding tạo (story 4.4)
   **When** user xem tại trang Funds
   **Then** không khác biệt gì goal tạo trong app — cùng entity, cùng card, cùng narrative

## Tasks / Subtasks

- [x] Task 1: Gợi ý goal trong form tạo fund (AC: 1)
  - [x] `src/lib/constants/goalPresets.ts` (file mới): data thuần khớp onboarding GoalStep — `[{ presetId: "education", targetAmount: 200_000_000, targetMonths: 60 }, { presetId: "house", targetAmount: 500_000_000, targetMonths: 36 }, { presetId: "travel", targetAmount: 30_000_000, targetMonths: 12 }]`; tên qua i18n key CÓ SẴN `setupV2.goal.<presetId>.name`. KHÔNG sửa `GoalStep.tsx` (file đang có WIP chưa commit của DzungDuong — cấm đụng; hợp nhất 2 nguồn preset là follow-up sau khi WIP ổn định, ghi chú trong code comment)
  - [x] `FundForm.tsx` (update): khi user đã chọn `fund_type === "goal"` — render hàng chips gợi ý (3 preset) phía trên field tên; tap chip → điền `name` (từ i18n), `target_amount`, `target_date` (= hôm nay + targetMonths × 30 ngày, format `yyyy-MM-dd` bằng date-fns — CÙNG công thức months×30 onboarding dùng ở `/api/onboarding/complete`); user sửa tay được sau khi điền. Chip style: `rounded-full border border-border min-h-[44px] px-4 text-sm`, selected `ring-2 ring-primary/20`
  - [x] Field `target_date` cho goal: FundForm ĐÃ có field này (dòng ~302, type=date) — chỉ verify nó hiện cho fund_type goal và giữ nguyên; KHÔNG thêm field trùng
  - [x] Không giới hạn số lượng goal: verify không có chỗ nào chặn count (hiện trạng không có — chỉ cần không thêm)
- [x] Task 2: Sửa target/deadline goal — edit sheet + invalidation (AC: 2)
  - [x] `src/components/funds/GoalEditSheet.tsx` (file mới, `"use client"`): sheet/dialog nhỏ chuyên goal — fields: tên, số đích (CurrencyInput), deadline (date input `min-h-[44px]`), submit qua `useUpdateFund` (PATCH `/api/funds/[id]` — `updateFundSchema` đã nhận `target_amount`, `target_date`). Zod client validate: target > 0, deadline > hôm nay. isPending → disable nút; success → toast 2s + đóng; error → giữ form + toast 5s (Error Patterns chuẩn)
  - [x] Mount tại fund detail page `/funds/[id]` — nút "Sửa mục tiêu" chỉ hiển thị khi `fund_type === "goal"` (`min-h-[44px] rounded-full`)
  - [x] Invalidation: verify `useUpdateFund` invalidate `keys.funds(hid)` VÀ thêm `keys.dashboard(...)` nếu chưa có — dashboard card + insight banner phải nhận số mới không cần reload (AC2 "recompute ngay"). Engine 6.1 pure → data mới vào là số mới ra, không cần đụng engine
  - [x] Tương tự verify `useCreateFund` + `useDeleteFund` invalidate dashboard — thiếu thì bổ sung cùng pattern (1 dòng mỗi hook)
- [x] Task 3: Xoá goal — verify luồng hiện hành + narrative không mồ côi (AC: 3)
  - [x] Verify (không viết lại): detail page đã có ConfirmDialog + `useDeleteFund`; DELETE route đã chặn `balance > 0` → 409 bắt rút/release trước (= "luồng release hiện hành"). Chỉ sửa nếu verify fail
  - [x] Narrative mồ côi: goal xoá → `is_active = false` → mọi select đều filter `is_active = true` → biến khỏi funds list + dashboard + `resolveGoalInsight` (trace cả 3). localStorage `lastShown`/`seen` còn key fund cũ — vô hại (không render gì từ key không có fund), KHÔNG cần dọn
  - [x] Test bổ sung `goalInsight.test.ts`: funds sau khi xoá goal (mảng không còn goal, chỉ emergency thiếu deadline) → `resolveGoalInsight` null — khoá hành vi "không narrative mồ côi" bằng automated test
- [x] Task 4: Verify AC4 + regression + flows (AC: 4)
  - [x] AC4 manual trace: goal onboarding tạo qua `/api/onboarding/complete` insert cùng bảng `funds` với `fund_type: "goal"`, `target_amount`, `target_date` — cùng entity; FundCard/GoalDualProgress/narrative không phân biệt nguồn gốc (không có field nào đánh dấu onboarding). Xác nhận không code path nào rẽ nhánh theo nguồn
  - [x] i18n: keys mới cho GoalEditSheet + chips (title, save, deadline label...) vi+en — dùng lại key có sẵn khi khớp (`common.save`...), chỉ thêm key thiếu
  - [x] `npx vitest run` — 0 regression; `npx tsc --noEmit` — 0 lỗi; `npx next build` — pass
  - [x] `### Testing`: liệt kê flows — create với chip gợi ý (manual), edit target/deadline → dashboard cập nhật (manual trace invalidation + automated engine), delete → confirm + biến khỏi insight (trace + automated test mới), AC4 same-entity (trace), không giới hạn count (trace)

## Dev Notes

### Hiện trạng CRUD — GẦN ĐỦ, story này chủ yếu lấp 3 khoảng trống

- **Create ĐÃ CÓ**: `FundList.tsx` mở `FundForm` (Sheet 2 bước, ~308 dòng) → `useCreateFund` → POST `/api/funds` (direct insert, `createFundSchema` đã có `target_date`). Field deadline ĐÃ tồn tại trong form.
- **Update route ĐÃ CÓ**: PATCH `/api/funds/[id]` + `updateFundSchema` (có `target_amount`, `target_date`) + `useUpdateFund` hook. **THIẾU UI edit** — đây là gap chính (AC2).
- **Delete ĐÃ CÓ**: detail page `/funds/[id]/page.tsx` có ConfirmDialog + `useDeleteFund`; DELETE route soft-delete (`is_active=false`), chặn balance > 0 → 409. Khớp AC3 — chỉ verify.
- Gap thật: (1) chips gợi ý goal trong create form, (2) UI sửa target/deadline, (3) invalidate dashboard khi fund mutations.

### AC nói "tạo qua atomic RPC (A-1)" — hiện trạng là direct insert, GIỮ HIỆN TRẠNG

- Toàn bộ fund creation trong app (kể cả onboarding) là direct insert vào `funds`. RPC atomic chỉ dùng cho balance mutations (contribute/withdraw — Non-Negotiable Rule 1). Insert fund mới không đụng balance → không cần RPC. ĐỪNG viết RPC mới cho create (deviation khỏi chữ AC nhưng đúng kiến trúc thật — ghi vào Completion Notes như deviation có chủ đích, epic viết "như mọi fund" và mọi fund thật sự là insert).

### GoalStep.tsx đang có WIP chưa commit — CẤM đụng

- `git status`: `src/components/onboarding/v2/GoalStep.tsx` (và các file onboarding v2 khác) modified chưa commit bởi DzungDuong. `GOAL_PRESETS` nằm trong đó dạng component-local có JSX icon. KHÔNG extract/refactor file này. Tạo `goalPresets.ts` data thuần riêng (3 preset goal — bỏ preset "emergency" và "custom" vì form funds đã có sẵn luồng tự nhập). i18n names dùng chung key `setupV2.goal.education.name` / `.house.name` / `.travel.name` — ĐÃ tồn tại trong vi.json/en.json, không tạo key trùng nghĩa.
- Số liệu khớp PRD V1-FR10: 200tr/60 tháng (education), 500tr/36 tháng (house), 30tr/12 tháng (travel).

### Deadline từ months: công thức months × 30 ngày

- Onboarding (`/api/onboarding/complete`) tính `target_date = hôm nay + months × 30 ngày` (không phải addMonths) — chips dùng CÙNG công thức để nhất quán. date-fns `addDays` + `format(d, "yyyy-MM-dd")`.

### Invalidation map (kiểm rồi mới thêm)

- `keys.funds(hid)` — funds page; `keys.dashboard(hid, month)` (xem chữ ký thật trong `queryKeys.ts`) — dashboard data nuôi `FundOverviewCard`, `DailyInsightBanner`, `MilestoneCelebration`. Fund mutation nào cũng nên invalidate cả hai. Detail page dùng key gì cho fund đơn — kiểm `useFunds.ts` (có key "fund-detail" hardcode pre-existing thì để nguyên, chỉ ghi nhận — sửa là scope creep).
- LUÔN dùng keys factory — không hardcode mảng key mới.

### Engine/UI 6.1-6.3 — không đụng

- Sửa target/deadline → engine pure tự ra số mới khi query refetch. `GoalDualProgress`, `resolveGoalInsight`, `resolveMilestoneCelebration` KHÔNG cần thay đổi. Milestone seen: target tăng → ratio giảm → seen giữ max (không celebrate lại cho tới khi vượt lại) — hành vi đúng, đã có test 6.3.

### Testing — node env

- Automated: test mới trong `goalInsight.test.ts` (narrative mồ côi). Form/sheet UI: manual trace (tiền lệ 6.2/6.3 review Approve). Invalidation: trace code hooks.

### Project Structure Notes

- File mới: `src/lib/constants/goalPresets.ts`, `src/components/funds/GoalEditSheet.tsx`
- File sửa: `src/components/funds/FundForm.tsx` (chips gợi ý), `src/app/(app)/funds/[id]/page.tsx` (nút Sửa mục tiêu + mount sheet), `src/lib/hooks/useFunds.ts` (bổ sung invalidate dashboard nếu thiếu), `src/lib/insight/__tests__/goalInsight.test.ts` (1 test), `vi.json`/`en.json` (keys thiếu)
- KHÔNG sửa: `GoalStep.tsx` + mọi file onboarding v2 (WIP), engine files 6.1-6.3, API routes (trừ khi verify Task 3 fail), migrations

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 6.4 — ACs, FR17, A-1]
- [Source: src/components/funds/FundForm.tsx — Sheet create, field target_date ~dòng 302]
- [Source: src/lib/validations/fund.ts — createFundSchema/updateFundSchema có target_date]
- [Source: src/lib/hooks/useFunds.ts — useCreateFund/useUpdateFund/useDeleteFund + invalidation hiện trạng]
- [Source: src/app/(app)/funds/[id]/page.tsx — ConfirmDialog delete có sẵn]
- [Source: src/app/api/funds/[id]/route.ts — PATCH + DELETE (chặn balance>0, 409)]
- [Source: src/components/onboarding/v2/GoalStep.tsx — GOAL_PRESETS số liệu (CHỈ đọc, WIP không đụng)]
- [Source: _bmad-output/implementation-artifacts/6-2-goal-progress-card.md + 6-3 — patterns đã Approve]

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5)

### Debug Log References

- `npx vitest run` — 378/378 pass (28 files; +1 test narrative mồ côi trong goalInsight.test.ts)
- `npx tsc --noEmit` — 0 lỗi
- `npx next build` — Compiled successfully

### Completion Notes List

- **Task 1 (create + gợi ý):** `src/lib/constants/goalPresets.ts` — 3 preset data thuần khớp onboarding/PRD V1-FR10 (education 200tr/60m, house 500tr/36m, travel 30tr/12m), `presetTargetDate` dùng cùng công thức months×30 ngày như `/api/onboarding/complete`. `FundForm.tsx`: chips gợi ý (rounded-full, min-h-44px) hiện ở step 2 khi fund_type = goal, tap → điền name (i18n `setupV2.goal.*.name` có sẵn) + target_amount + target_date, user sửa tay được. KHÔNG đụng `GoalStep.tsx` (WIP). Field deadline đã có sẵn trong form từ trước — không thêm trùng. Không có giới hạn count nào tồn tại.
- **Task 2 (edit):** `GoalEditSheet.tsx` mới — sheet bottom (rounded-t-[18px]) sửa tên/số đích/deadline qua `useUpdateFund` (PATCH có sẵn), validate deadline > hôm nay (i18n `funds.deadlineFuture`), isPending disable, toast theo hook chuẩn. Nút bút chì (44px, aria-label) trên detail page chỉ hiện cho goal fund. Invalidation: bổ sung `keys.dashboard(hid, month)` vào cả `useCreateFund`/`useUpdateFund`/`useDeleteFund` — trước đó dashboard KHÔNG được invalidate khi fund mutations → card/insight/milestone giờ nhận số mới ngay (AC2).
- **Task 3 (delete — verify):** hiện trạng khớp AC3, không sửa route: ConfirmDialog trước mutation (detail page), DELETE chặn balance > 0 → 409 (bắt rút/release trước = luồng release hiện hành), soft-delete `is_active=false` → biến khỏi funds list + dashboard select (đều filter is_active) → `resolveGoalInsight` không thấy fund → không narrative mồ côi. Khoá bằng test mới. localStorage lastShown/seen còn key fund cũ — vô hại, không dọn.
- **Task 4 (AC4 — verify):** goal onboarding insert cùng bảng `funds`, cùng `fund_type: "goal"` + target + deadline; không field nào đánh dấu nguồn gốc, không code path nào rẽ nhánh — cùng card/narrative/edit/delete.
- **Deviation có chủ đích:** AC ghi "tạo qua atomic RPC (A-1)" — hiện trạng mọi fund creation là direct insert (RPC chỉ cho balance mutations, đúng Non-Negotiable Rule 1). Giữ insert, không viết RPC mới.
- i18n: 2 keys mới `funds.editGoal`, `funds.deadlineFuture` vi+en; còn lại tái dùng key có sẵn.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Tạo goal với chip gợi ý → form điền name/target/deadline đúng preset, sửa tay được | Manual trace (setValue 3 field, presetTargetDate months×30) | ✅ Pass (cần xác nhận mắt) |
| 2 | Sửa target/deadline → dashboard + card + insight recompute ngay | Manual trace: `useUpdateFund` giờ invalidate `keys.funds` + `fund-detail` + `keys.dashboard`; engine pure nhận data mới | ✅ Pass |
| 3 | Validate deadline ≤ hôm nay → báo lỗi giữ form, không mutation | Manual trace GoalEditSheet onSubmit setError | ✅ Pass |
| 4 | Xoá goal: ConfirmDialog → soft delete → biến khỏi funds/dashboard/insight, không narrative mồ côi | Manual trace (is_active filter 3 nơi) + Automated (test mới goalInsight) | ✅ Pass |
| 5 | Xoá goal còn balance → 409 bắt rút trước (luồng release hiện hành) | Manual trace DELETE route (hiện trạng, không sửa) | ✅ Pass |
| 6 | Goal onboarding = goal in-app: cùng entity/card/narrative/edit/delete | Manual trace (không code path phân biệt nguồn) | ✅ Pass |
| 7 | Không giới hạn số lượng goal | Manual trace (không tồn tại check count nào) | ✅ Pass |
| 8 | Regression toàn cục: engine 6.1-6.3 + suite cũ | Automated 378/378 + build pass | ✅ Pass |

### File List

- `src/lib/constants/goalPresets.ts` (new)
- `src/components/funds/GoalEditSheet.tsx` (new)
- `src/components/funds/FundForm.tsx` (updated — chips gợi ý goal)
- `src/app/(app)/funds/[id]/page.tsx` (updated — nút Sửa mục tiêu + mount GoalEditSheet)
- `src/lib/hooks/useFunds.ts` (updated — invalidate keys.dashboard ở create/update/delete)
- `src/lib/insight/__tests__/goalInsight.test.ts` (updated — test narrative mồ côi)
- `src/lib/i18n/messages/vi.json` (updated — funds.editGoal, funds.deadlineFuture)
- `src/lib/i18n/messages/en.json` (updated — funds.editGoal, funds.deadlineFuture)

## Senior Developer Review (AI)

**Reviewer:** claude-haiku-4-5-20251001  
**Date:** 2026-07-05  
**Outcome:** ✅ **APPROVE** — Ready to merge

### Verification Summary

#### AC1: Create goal with preset chips
- ✅ `src/lib/constants/goalPresets.ts`: 3 presets match spec exactly
  - education: 200_000_000 / 60 months
  - house: 500_000_000 / 36 months
  - travel: 30_000_000 / 12 months
- ✅ Preset date formula: `addDays(today, months × 30)` matches `/api/onboarding/complete`
- ✅ `FundForm.tsx` chips (lines 168-184): conditional render for `fund_type === "goal"`, correct setValue calls
- ✅ i18n keys present: `setupV2.goal.education.name`, `.house.name`, `.travel.name` in vi.json + en.json
- ✅ No count limits exist; architecture allows unlimited goals

#### AC2: Edit target/deadline with invalidation
- ✅ `GoalEditSheet.tsx`: form structure complete (name/target_amount/target_date)
- ✅ Validation: `target_date > today` check (line 39); error message uses `funds.deadlineFuture` i18n key
- ✅ API call: `useUpdateFund` (PATCH `/api/funds/[id]`) with correct schema
- ✅ Invalidation complete (lines 94-96 in useFunds.ts):
  - `keys.funds(householdId)` ✓
  - `["fund-detail", householdId, fundId]` ✓
  - `keys.dashboard(householdId, month)` ✓
- ✅ Edit button conditional (page.tsx line 98): only shows for `fund_type === "goal"`
- ✅ Sheet mounts conditionally (line 325-326): fresh mount on each open ensures current fund data

#### AC3: Delete with ConfirmDialog + no orphan narratives
- ✅ ConfirmDialog present (lines 328-341 in page.tsx)
- ✅ DELETE route (api/funds/[id]/route.ts lines 73-108):
  - Blocks balance > 0 with 409 status ✓
  - Soft-deletes with `is_active: false` ✓
- ✅ `is_active` filters in place:
  - GET `/api/funds` (line 13): `.eq("is_active", true)` ✓
  - Dashboard won't fetch deleted funds ✓
  - `resolveGoalInsight` won't see deleted goal ✓
- ✅ Test coverage: new test in goalInsight.test.ts verifies narrative null after delete

#### AC4: Same entity for onboarding + app goals
- ✅ No code path splits; onboarding goals use same `funds` table insert with `fund_type: "goal"` + target_amount + target_date
- ✅ Card/narrative/edit/delete flows treat all goals identically

#### Technical Checks
- ✅ Tests: `npx vitest run` — **378/378 pass** (includes new test for AC3)
- ✅ Types: `npx tsc --noEmit` — **0 errors**
- ✅ Build: `npx next build` — **Compiled successfully** (all 55 pages generated)

### Findings

**None — clean implementation**

### Action Items

**None — ready for merge**

---

## Change Log

- 2026-07-05: CRUD goals (FR17): chips gợi ý preset trong FundForm, GoalEditSheet sửa target/deadline, dashboard invalidation cho mọi fund mutation, verify delete + same-entity onboarding. 378/378 pass, build xanh. **Status: review → done**
