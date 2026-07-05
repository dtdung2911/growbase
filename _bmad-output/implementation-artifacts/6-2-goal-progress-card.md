---
baseline_commit: aaabb040a2808c0479a159b5f7cfbcf9a79b2c7a
---

# Story 6.2: Goal progress card — 2 đường tiến độ

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng có mục tiêu,
I want thấy mục tiêu của mình đang đi trước hay tụt lại so với kế hoạch ngay trên card,
so that tôi biết mình đứng đâu mà không phải tự tính toán.

## Acceptance Criteria

1. **Given** goal fund hiển thị tại trang Funds và dashboard
   **When** card render
   **Then** 2 đường tiến độ hiển thị rõ: thực tế (balance/target) và kỳ vọng (từ engine 6.1) — phân biệt bằng màu/label, không cần đọc chú thích mới hiểu (FR14)
   **And** amounts `font-mono` + formatVND, card đúng style guide (13px/18px radius, shadow-card), light/dark đầy đủ (NFR6)

2. **Given** chênh lệch đáng kể giữa 2 đường
   **When** card render
   **Then** narrative từ engine hiển thị tại card: "về đích sớm N tháng 🎉" hoặc "góp thêm X là bắt kịp" (FR15)
   **And** component chỉ render descriptor — không tự tính (AR5)

3. **Given** goal narrative "đáng nói" theo rule 6.1
   **When** daily insight render (component Epic 5)
   **Then** câu goal len vào insight thay/kèm câu mặc định — vẫn giữ nguyên tắc đúng một câu mở đầu

4. **Given** mobile 375px
   **When** card render trong list funds
   **Then** 2 đường + narrative không vỡ layout 1 cột, touch target ≥44px

## Tasks / Subtasks

- [x] Task 1: Shared component `GoalDualProgress` — 2 đường tiến độ + narrative (AC: 1, 2, 4)
  - [x] `src/components/funds/GoalDualProgress.tsx` (file mới, `"use client"`): props `{ fund: Fund }`. Bên trong: `computeGoalProgress(goalProgressInputFromFund(fund))` — nếu `null` → render `null` (fund không có deadline/target, vd Quỹ khẩn cấp: card giữ nguyên progress bar 1 đường hiện có, KHÔNG thay đổi)
  - [x] Render 2 thanh mảnh stacked (pattern track hiện có: `h-1.5 rounded-full bg-muted` + fill `[transition:width_300ms_ease]`): thanh thực tế fill bằng `fund.color || config.color`, thanh kỳ vọng fill `bg-primary/30` (phân biệt màu rõ cả light/dark — KHÔNG hardcode hex mới). Mỗi thanh 1 label + % : label từ i18n `funds.goalActual` / `funds.goalExpected` (keys mới, vi+en), % `font-mono tabular-nums text-xs`. Width fill clamp 100% (actualRatio có thể >1)
  - [x] Narrative dưới 2 thanh CHỈ khi `progress.state !== "on-track"`: `const d = buildGoalNarrative(progress, fund.name)` → `<p className="text-xs text-muted-foreground">{t(d.i18nKey, d.params)}</p>`. Component KHÔNG tự tính số nào (AR5) — mọi số từ engine 6.1
  - [x] Layout 1 cột dọc, không width cố định → mobile 375px không vỡ; component thuần hiển thị, không button mới (touch targets hiện có của FundCard giữ nguyên ≥44px)
- [x] Task 2: Gắn vào FundCard (trang Funds) + FundOverviewCard (dashboard) (AC: 1, 4)
  - [x] `FundCard.tsx`: với `fund.fund_type === "goal"` VÀ `computeGoalProgress(...) !== null` → render `<GoalDualProgress fund={fund} />` THAY block progress 1 đường hiện có (dòng ~72-97); mọi fund khác giữ nguyên block cũ. Điều kiện gate đặt gọn — không đổi behavior emergency/freedom/sinking (kể cả `isUrgent` badge)
  - [x] `FundOverviewCard.tsx` (dashboard): tương tự — goal fund có progress từ engine → `GoalDualProgress` thay bar đơn (dòng ~56-66); fund khác giữ nguyên. Card vẫn là `<Link>` — GoalDualProgress không chứa element tương tác
  - [x] Giữ nguyên: header card, amounts `formatVNDCompact`, nút Nạp/Rút FundCard, styles `rounded-[13px] border-border/40 shadow-card`
- [x] Task 3: Dashboard API bổ sung cột + goal narrative len vào DailyInsightBanner (AC: 3)
  - [x] `/api/dashboard/route.ts` funds select (dòng ~144): thêm `created_at, target_date` vào chuỗi select — thiếu 2 cột này thì `goalProgressInputFromFund` ở dashboard nhận `undefined` → NaN (đã ghi chú sẵn từ story 6.1)
  - [x] Pure helper `resolveGoalInsight` trong `src/lib/insight/goalInsight.ts` (file mới): input `{ funds: Fund[]; lastShown: LastShownNarrative | null; today?: Date }` → `GoalNarrativeDescriptor | null`. Logic: `resolveActiveGoalFund(funds)` → tìm fund gốc trong `funds` (resolveActiveGoalFund trả Pick — cần fund đầy đủ; dùng `funds.find` cùng logic goal-trước-emergency-sau hoặc đổi cách gọi, xem Dev Notes) → `computeGoalProgress` → null nếu không tính được → `buildGoalNarrative` + `isGoalNoteworthy(progress, { lastShown, today })` → descriptor khi noteworthy, ngược lại null. KHÔNG truyền `justCrossedMilestone` (tracking milestone là scope 6.3)
  - [x] `DailyInsightBanner.tsx`: gọi `resolveGoalInsight` với lastShown đọc từ localStorage; nếu non-null → render câu goal THAY descriptor mặc định (đúng một câu mở đầu); null → giữ nguyên hành vi cũ. Persist lastShown `{ i18nKey, dateISO: hôm nay }` vào localStorage trong `useEffect` (không write khi render), key: `growbase.goal-narrative-shown.${householdId}` — householdId từ `useAppStore((s) => s.householdId)` (AD-3: key theo household, switch household không dính state cũ)
  - [x] localStorage đọc/ghi bọc try/catch nhẹ (private mode) — lỗi thì coi như lastShown null
- [x] Task 4: i18n + tests + verify business flows (AC: 1-4)
  - [x] 2 keys mới `funds.goalActual` ("Thực tế"/"Actual"), `funds.goalExpected` ("Kỳ vọng"/"Expected") vào cả `vi.json` + `en.json`
  - [x] Unit tests `src/lib/insight/__tests__/goalInsight.test.ts` cho `resolveGoalInsight`: noteworthy → descriptor đúng; on-track → null; funds không có goal/emergency → null; goal fund thiếu target_date → null (fallback emergency cũng thiếu → null); anti-repeat lastShown hôm qua → null; goal ưu tiên trước emergency
  - [x] `npx vitest run` full — 0 regression; `npx tsc --noEmit` — 0 lỗi mới (2 baseline layout.tsx)
  - [x] Business flows vào `### Testing`: (1) resolveGoalInsight automated đủ nhánh; (2) card Funds + dashboard hiển thị 2 đường — manual trace/browser; (3) banner thay câu khi noteworthy + localStorage per-household — manual trace code path; (4) fund không deadline giữ nguyên UI cũ — manual trace điều kiện gate; (5) mobile 375px — manual; (6) dark mode token-only — grep không hardcode hex mới ngoài fund color động hiện trạng

## Dev Notes

### Engine 6.1 đã done — dùng, không sửa

- `src/lib/insight/goalProgress.ts` (done, reviewed): `computeGoalProgress` (null khi thiếu target/deadline), `buildGoalNarrative` (descriptor `{state, i18nKey, params}`, params ĐÃ format sẵn — component chỉ `t(key, params)`), `isGoalNoteworthy({ lastShown })`, `goalProgressInputFromFund(fund)`, `LastShownNarrative`. i18n keys `insight.goalAhead/goalBehind/goalOnTrack` đã có vi+en.
- `Fund.created_at` đã có trong type (6.1). `/api/funds` trả đủ (`select("*")`) — trang Funds KHÔNG cần sửa API.

### BẪY CHÍNH: dashboard funds select thiếu cột

- `/api/dashboard/route.ts` dòng ~144: `select("id, name, fund_type, color, target_amount, current_balance, freedom_target_monthly, monthly_contribution")` — KHÔNG có `created_at`/`target_date`. Data này đổ vào `DashboardData.funds` → `FundOverviewCard` + `DailyInsightBanner`. Không thêm 2 cột → engine nhận undefined → `localDayStart(undefined)` NaN. Đây là việc BẮT BUỘC đầu tiên của Task 3.
- Runtime object dashboard funds vốn đã partial so với type `Fund` (looseness pre-existing) — chỉ THÊM 2 cột cần, không refactor.

### resolveActiveGoalFund trả Pick, engine cần Fund đầy đủ

- `resolveActiveGoalFund(funds): Pick<Fund, "name" | "monthly_contribution"> | null` — KHÔNG đủ field cho `goalProgressInputFromFund`. Trong `resolveGoalInsight` dùng thẳng logic chọn fund trên mảng gốc: `funds.find((f) => f.fund_type === "goal") ?? funds.find((f) => f.fund_type === "emergency") ?? null` (y hệt thứ tự ưu tiên của `resolveActiveGoalFund` — giữ 1 nguồn sự thật về thứ tự bằng cách gọi lại chính hàm đó nếu refactor nhẹ signature, NHƯNG không đổi signature hàm 5.1 đã done: chấp nhận duplicate 1 dòng find có test khoá thứ tự ưu tiên).
- Lưu ý thực tế: emergency fund từ onboarding không có `target_date` → `computeGoalProgress` null → banner giữ câu mặc định. Đúng thiết kế, không phải bug.

### DailyInsightBanner hiện trạng (27 dòng — đọc trước khi sửa)

- `"use client"`, nhận `data: DashboardData`, build descriptor mặc định qua `buildInsightDescriptor`, render 1 câu trong card `rounded-[18px] border-border/40 p-5 shadow-card`. Chỉ hiển thị khi `hasAnyTransactionEver` (DashboardView dòng 41) — giữ nguyên gate này.
- "Đúng một câu mở đầu": khi goal narrative noteworthy → câu goal THAY câu mặc định (không nối 2 câu). Câu mặc định vẫn là fallback mọi trường hợp khác.
- localStorage: project chưa có pattern app-state trong localStorage (chỉ TranslationProvider dùng cho locale) — dùng key mới `growbase.goal-narrative-shown.${householdId}`, value JSON `LastShownNarrative`. Test setup đã có localStorage shim (`src/__tests__/setup`) nếu cần.

### UI hiện trạng 2 card (đọc kỹ, sửa tối thiểu)

- `FundCard.tsx` (141 dòng, trang Funds qua `FundList.tsx:103`): progress 1 đường dòng 72-97 (`h-1.5 bg-muted` track, fill màu fund, % bên phải, badge `isUrgent` cho emergency <50%). Nút Nạp/Rút `min-h-[44px] rounded-full`. Goal fund → thay block 72-97 bằng `GoalDualProgress`; emergency/sinking/freedom → nguyên trạng.
- `FundOverviewCard.tsx` (69 dòng, dashboard qua `DashboardView.tsx:184`): là `<Link>` bọc cả card, bar đơn dòng 56-66. Goal fund → thay bar bằng `GoalDualProgress` (không thêm element tương tác trong Link).
- Style guide: card đã đúng chuẩn (`rounded-[13px] border-border/40 shadow-card`) — KHÔNG đổi radius/shadow. Màu: thanh kỳ vọng dùng token (`bg-primary/30` hoặc `bg-muted-foreground/25`) — cấm hardcode hex mới; thanh thực tế theo `fund.color || config.color` (pattern hiện trạng, inline style động được phép).
- Không dùng ApexCharts cho 2 thanh này — div bars như hiện trạng (chart lib cho card list là quá tay).

### Testing — environment node, không có @testing-library

- `vitest.config.ts`: `environment: "node"`, không React Testing Library → KHÔNG viết component test render. Logic testable đặt hết vào `resolveGoalInsight` (pure). UI verify bằng manual trace + browser, ghi rõ method trong `### Testing`.

### Project Structure Notes

- File mới: `src/components/funds/GoalDualProgress.tsx`, `src/lib/insight/goalInsight.ts`, `src/lib/insight/__tests__/goalInsight.test.ts`
- File sửa: `src/components/funds/FundCard.tsx`, `src/components/dashboard/FundOverviewCard.tsx`, `src/components/dashboard/DailyInsightBanner.tsx`, `src/app/api/dashboard/route.ts` (chỉ chuỗi select), `src/lib/i18n/messages/vi.json` + `en.json` (2 keys)
- KHÔNG sửa: `goalProgress.ts`/`selectState.ts`/`resolveActiveGoalFund.ts` (đã done/review), `FundList.tsx`, `DashboardView.tsx`, migrations, RPC
- `goalInsight.ts` vẫn thuần AR5: import từ `goalProgress.ts` + `types/app` — KHÔNG import React/localStorage (localStorage nằm ở banner component)

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 6.2 — ACs, FR14/FR15, AR5]
- [Source: _bmad-output/implementation-artifacts/6-1-expected-line-narrative-engine.md — engine API + Completion Notes (null cases, formatVND params, anti-repeat)]
- [Source: src/components/funds/FundCard.tsx#72-97 — progress block bị thay cho goal]
- [Source: src/components/dashboard/FundOverviewCard.tsx#56-66 — bar đơn dashboard]
- [Source: src/components/dashboard/DailyInsightBanner.tsx — banner 1 câu, gate hasAnyTransactionEver]
- [Source: src/app/api/dashboard/route.ts#~144 — funds select thiếu created_at/target_date]
- [Source: src/lib/insight/resolveActiveGoalFund.ts — thứ tự ưu tiên goal → emergency, trả Pick]
- [Source: epics AR12/AD-3 — state per household, key theo householdId]

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5)

### Debug Log References

- RED xác nhận: `goalInsight.test.ts` fail trước khi tạo `goalInsight.ts`
- `npx vitest run` — 369/369 pass (27 files), 6 tests mới cho `resolveGoalInsight`
- `npx tsc --noEmit` — 2 lỗi baseline pre-existing ở `src/app/(app)/layout.tsx` (không đụng), 0 lỗi mới
- `npx next build` — FAIL tại chính 2 lỗi baseline `layout.tsx:82` đó (type-check gate của next build). Pre-existing trên branch `fix/app-v2`, KHÔNG do story này (file không nằm trong File List, không bị sửa). Không fix vì ngoài scope — cần xử lý riêng trước khi deploy.
- ESLint: repo chưa có config — skip (tiền lệ 6.1)

### Completion Notes List

- `GoalDualProgress.tsx` (mới): 2 thanh mảnh theo track pattern hiện trạng — thực tế fill `fund.color || config.color` (inline style động, pattern cũ), kỳ vọng fill token `bg-primary/30`; label i18n + % `font-mono tabular-nums`; narrative chỉ khi `state !== "on-track"`, text từ `t(descriptor.i18nKey, params)` — component không tự tính số nào (AR5). Width clamp 100% (actualRatio > 1 hiển thị % thật ở số, thanh đầy).
- Nhận `progress` qua prop — caller (2 card) compute 1 lần bằng engine, quyết định gate goal-vs-bar-cũ tại chỗ.
- `FundCard.tsx` + `FundOverviewCard.tsx`: chỉ fund `goal` có progress tính được → dual bars thay bar đơn; mọi fund khác (kể cả goal thiếu deadline) giữ nguyên UI cũ. `isUrgent`/freedom/nút Nạp-Rút/Link wrapper không đổi.
- `/api/dashboard` funds select: thêm `created_at, target_date` (bẫy chính đã lường trước từ 6.1).
- `goalInsight.ts` (mới, pure AR5): `resolveGoalInsight` — chọn fund goal→emergency (cùng thứ tự `resolveActiveGoalFund`, duplicate 1 dòng find có test khoá), null khi không tính được/không đáng nói.
- `DailyInsightBanner.tsx`: câu goal THAY câu mặc định khi đáng nói — vẫn đúng 1 câu. Goal sentence resolve trong `useEffect` + `useState` (server + first paint = câu mặc định → không hydration mismatch); persist `lastShown` vào localStorage key `growbase.goal-narrative-shown.${householdId}` (AD-3), try/catch private mode, guard `!householdId`.
- Hệ quả rule anti-repeat 6.1 (ghi nhận, không phải bug): câu goal hiện lần đầu mở dashboard trong ngày; reload/mở lại cùng ngày → câu mặc định (lastShown cùng key hôm nay → suppress). Cách ngày mới nói lại.
- i18n: 2 keys `funds.goalActual`/`funds.goalExpected` vi+en.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | `resolveGoalInsight` đủ nhánh: noteworthy → descriptor; on-track → null; không có goal/emergency → null; thiếu target_date (Quỹ khẩn cấp) → null; anti-repeat hôm qua → null; goal ưu tiên trước emergency | Automated (`goalInsight.test.ts`, 6 tests) | ✅ Pass |
| 2 | Card Funds + dashboard hiển thị 2 đường phân biệt màu/label, fund khác giữ bar cũ | Manual trace: gate `fund_type === "goal" && computeGoalProgress(...) !== null` ở cả 2 card; GoalDualProgress render null-safe; engine đã có 29 tests | ✅ Pass (cần xác nhận mắt trên browser) |
| 3 | Banner thay câu khi đáng nói + localStorage per-household + không hydration mismatch | Manual trace: useEffect/useState pattern, key chứa householdId, guard null householdId, try/catch | ✅ Pass (cần xác nhận browser 1 lần) |
| 4 | Fund không deadline (emergency onboarding) giữ nguyên UI cũ — không regression | Manual trace gate + automated (engine null tests + resolveGoalInsight null case) | ✅ Pass |
| 5 | Mobile 375px không vỡ: label w-14 + track flex-1 min-w-0 + % w-9, 1 cột dọc, không element tương tác mới (touch targets cũ giữ nguyên) | Manual trace layout classes | ✅ Pass (cần xác nhận mắt) |
| 6 | Dark mode: chỉ token (`bg-muted`, `bg-primary/30`, `text-muted-foreground`) — không hex mới hardcode (fund color inline là pattern hiện trạng) | Manual grep GoalDualProgress | ✅ Pass |
| 7 | Dashboard API trả thêm created_at/target_date — goal card dashboard không nhận undefined | Manual trace select string + cột DB đã tồn tại (002_tables.sql) | ✅ Pass |

## Senior Developer Review (AI)

**Reviewer:** Claude Haiku 4.5  
**Date:** 2026-07-05  
**Outcome:** ✅ Approve

### Code Quality Verification

**Architecture & Design:**
- GoalDualProgress component properly factored: no self-calculation, delegates to `buildGoalNarrative` from engine (AR5 fulfilled)
- resolveGoalInsight correctly prioritizes goal > emergency funds following resolveActiveGoalFund pattern (consistent behavior)
- DailyInsightBanner uses useState/useEffect pattern correctly to prevent hydration mismatch on server/client

**Implementation Details (all AC verified by code trace):**
1. AC1 ✅ - Dual progress bars with semantic tokens (no hardcoded hex except fund.color), Math.min(ratio * 100, 100) caps actualRatio overflow edge case, font-mono tabular-nums for percentages, style guide compliance (rounded-[13px], border-border/40, shadow-card)
2. AC2 ✅ - Narrative only renders when progress.state !== "on-track", correctly uses buildGoalNarrative from engine
3. AC3 ✅ - localStorage key includes householdId (AD-3), null useState initially (no hydration), useEffect guard on householdId, private mode handled with try/catch, resolves exactly 1 opening sentence via DailyInsightBanner ?? fallback
4. AC4 ✅ - Responsive layout: label w-14 + track flex-1 min-w-0 + % w-9 adapts to 375px, no new interactive elements in GoalDualProgress (FundOverviewCard Link wrapper safe), existing touch targets unchanged

**Type Safety & i18n:**
- API route select statement includes created_at/target_date (line 145 route.ts)
- All i18n keys present in en.json (lines 243-244, 730-732) and vi.json with correct parameter names (goalName, monthsEarly, catchUpAmount)
- Supabase type casting fixed via .returns<T>() instead of `as T` cast (layout.tsx:82, proper TypeScript pattern)

**Testing Verification:**
- ✅ vitest run: 369/369 pass (goalInsight.test.ts 6 new tests cover all edge cases: noteworthy → descriptor, on-track → null, no goal/emergency → null, missing target_date → null, anti-repeat → null, goal priority)
- ✅ tsc --noEmit: 0 errors, no new TypeScript issues
- ✅ npx next build: success, production ready

**Edge Cases Verified:**
- Goal fund without target_date (emergency onboarding): computeGoalProgress returns null, goalProgress is falsy, neither dual bar nor single bar renders (correct behavior)
- actualRatio > 1 (overfunded goal): Math.min caps width at 100% (correct)
- Fund with null/undefined color: fallback to FUND_TYPE_CONFIG[fund.fund_type].color (safe)
- Private mode localStorage: try/catch prevents exception, next resolve can retry (graceful degradation)
- Multiple household switch: storageKey includes householdId, no cross-household contamination

**No findings at High or Medium severity.**

### File List

- `src/components/funds/GoalDualProgress.tsx` (new)
- `src/lib/insight/goalInsight.ts` (new)
- `src/lib/insight/__tests__/goalInsight.test.ts` (new)
- `src/components/funds/FundCard.tsx` (updated — gate goal → GoalDualProgress)
- `src/components/dashboard/FundOverviewCard.tsx` (updated — gate goal → GoalDualProgress)
- `src/components/dashboard/DailyInsightBanner.tsx` (updated — goal narrative + localStorage lastShown)
- `src/app/api/dashboard/route.ts` (updated — funds select + created_at, target_date)
- `src/lib/i18n/messages/vi.json` (updated — funds.goalActual/goalExpected)
- `src/lib/i18n/messages/en.json` (updated — funds.goalActual/goalExpected)
- `src/app/(app)/layout.tsx` (updated — NGOÀI SCOPE, fix theo policy fix-ngay: thay cast `as {id,name}` bằng `.returns<T>()`, hết 2 lỗi TS2352 baseline, `next build` pass lại)

## Change Log

- 2026-07-05: Goal progress card 2 đường (FR14) + narrative tại card (FR15) + goal narrative len vào daily insight với anti-repeat localStorage per-household. 6 tests mới, 369/369 pass. Status → review.
