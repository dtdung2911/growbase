---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 5.2: Dashboard ngày 0 — không vùng trống

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới vừa xong Tada,
I want dashboard hiển thị đầy đủ bức tranh của tôi ngay từ giây đầu,
so that tôi không rơi vào màn hình trống trơn và biết app đang đồng hành với mình.

## Acceptance Criteria

1. **Given** user vừa hoàn thành onboarding vào dashboard lần đầu
   **When** dashboard render
   **Then** hiển thị đủ: card mục tiêu + tiến độ 0%, budget tháng đã chia nhóm, số "còn lại hôm nay" từ insight engine — không vùng trống trắng (FR7)
   **And** skeleton loading trong lúc fetch (V1-NFR5), không spinner toàn trang

2. **Given** household chưa có giao dịch nào
   **When** các widget thống kê render
   **Then** không widget nào hiển thị empty-state lạnh lùng kiểu "Chưa có dữ liệu" — thay bằng trạng thái ngày 0 có định hướng (số 0 + copy đồng hành)

3. **Given** mobile 375px + dark mode
   **When** dashboard ngày 0 render
   **Then** layout 1 cột đúng chuẩn, tokens light/dark đầy đủ (NFR6), amounts `font-mono tabular-nums` + formatVND

## Tasks / Subtasks

- [x] Task 1: `hasAnyTransactionEver` — thêm nguồn dữ liệu phân biệt "ngày 0 thật" vs "tháng này rỗng nhưng đã có lịch sử" (AC: 1, 2)
  - [x] `src/app/api/dashboard/route.ts` — thêm 1 query nhẹ: `count("exact", { head: true })` trên `transactions` theo `household_id` KHÔNG lọc theo tháng (toàn bộ lịch sử) → trả `hasAnyTransactionEver: count > 0`
  - [x] `src/types/app.ts` — thêm field `hasAnyTransactionEver: boolean` vào `DashboardData`
  - [x] `src/lib/hooks/useDashboard.ts` (`useDashboardData()`) — không cần đổi logic, chỉ đảm bảo type mới đi qua nguyên vẹn (response đã là `DashboardData`)
  - [x] Lý do bắt buộc có field này (không suy ra từ `transactions` tháng hiện tại): phân biệt "household mới, chưa từng ghi gì" (ngày 0 → cần copy đồng hành) với "household cũ, tháng này chưa ghi gì" (ví dụ xem lại tháng trước còn trống, hoặc đầu tháng mới) — hai trường hợp cần copy khác nhau, không được gộp chung

- [x] Task 2: Sửa "vùng trống" thật đang tồn tại — Top Expenses section biến mất hoàn toàn ngày 0 (AC: 1, 2)
  - [x] `src/components/dashboard/DashboardView.tsx` (dòng ~95): điều kiện `{data.topExpenseCategories.length > 0 && (<section>...)}` đang ẩn TOÀN BỘ section (kể cả header) khi mảng rỗng — bug thật, không phải giả định. Hậu quả: (a) vi phạm AC1 "không vùng trống trắng" — thực ra tệ hơn empty-state, cả section mất tích, layout `lg:grid-cols-2` lệch còn 1 cột (WeekdayChart đơn độc); (b) `TopExpensesWidget` (trong `DashboardCharts.tsx`) đã tự có nhánh empty-state nội bộ (fallback `t("common.noData")`) nhưng KHÔNG BAO GIỜ chạy tới vì section cha đã ẩn trước — dead code trong chính widget
  - [x] Fix: bỏ điều kiện `data.topExpenseCategories.length > 0 &&` bọc ngoài section — luôn render section + header, để `TopExpensesWidget` tự xử lý nhánh rỗng (nó đã có sẵn nhánh này, chỉ cần cho nó chạy)
  - [x] Đổi nhánh rỗng bên trong `TopExpensesWidget` từ `t("common.noData")` sang copy ngày-0-có-định-hướng MỚI, có điều kiện theo `hasAnyTransactionEver` (xem Task 3) — không đổi `common.noData` (key dùng chung toàn app, đổi sẽ ảnh hưởng các nơi khác không liên quan)

- [x] Task 3: Copy ngày-0-có-định-hướng cho các widget rỗng (AC: 2)
  - [x] Thêm props optional mới cho các component hiện có (không đổi behavior khi prop không truyền — giữ nguyên cho các trang dùng lại như reports):
    - `SpendingDonut` (`src/components/shared/SpendingDonut.tsx`) — thêm prop optional `emptyMessage?: string`, dùng thay `t("common.noData")` khi có truyền, giữ nguyên fallback cũ khi không truyền
    - `RecentTransactionsList` (`src/components/dashboard/RecentTransactionsList.tsx`) — tương tự, thêm prop optional `emptyMessage?: string`
    - `TopExpensesWidget` (`src/components/dashboard/DashboardCharts.tsx`) — tương tự
  - [x] `DashboardView.tsx` — truyền `emptyMessage={t("dashboard.dayZeroEmptyHint")}` cho cả 3 component trên **chỉ khi** `!data.hasAnyTransactionEver` (ngày 0 thật); khi `hasAnyTransactionEver === true` (có lịch sử nhưng tháng/khoảng đang xem rỗng) → không truyền prop, giữ nguyên `common.noData` cũ (đúng ngữ cảnh hơn)
  - [x] Thêm key mới `dashboard.dayZeroEmptyHint` vào `vi.json`/`en.json` — copy đồng hành, không lạnh lùng, không nhắc "chưa có dữ liệu" (vd hướng "bắt đầu ghi khoản chi đầu tiên" — nhưng KHÔNG kèm CTA button ở đây, CTA thật thuộc story 5.3, story này chỉ đổi text)
  - [x] `WeekdayChart` (`DashboardCharts.tsx`) đã tự an toàn với dữ liệu toàn-0 (dùng `Math.max(..., 1)` tránh chia 0) — không cần sửa, chỉ verify bằng test/manual trace, không tự ý refactor

- [x] Task 4: Render số "còn lại hôm nay" từ insight engine (story 5.1) (AC: 1)
  - [x] `DashboardView.tsx` — thêm 1 khối hiển thị số "còn lại hôm nay" (không phải câu insight đầy đủ — câu narrative thuộc story 5.4), tính bằng `calculateDailyRemaining(data.budgetLines)` (từ `src/lib/insight/dailyRemaining.ts`, story 5.1) ngay khi `DashboardView` nhận `data` — đặt ở vị trí đầu dashboard (trên metric tiles), `font-mono tabular-nums` + `formatVND`
  - [x] Đây KHÔNG phải widget mới cần fetch thêm gì — `data.budgetLines` đã có sẵn trong `DashboardData`, engine là pure function client-side, gọi trực tiếp trong component

- [x] Task 5: Mobile 375px + dark mode + business flow verification (AC: 3)
  - [x] Manual trace/verify tại 375px: layout 1 cột đúng, không tràn ngang; dark mode: tokens `bg-card`/`text-muted-foreground`/`border-border` đã dùng nhất quán toàn file (không hardcode màu) — xác nhận không có màu hex trần nào mới thêm ở Task 2-4
  - [x] Liệt kê + verify business flow vào Dev Agent Record → `### Testing`: (1) dashboard ngày 0 (household mới, 0 giao dịch) — không section nào biến mất, Top Expenses hiện copy ngày-0; (2) household cũ xem tháng rỗng (có `hasAnyTransactionEver=true`) — vẫn hiện `common.noData` như cũ, không bị đổi nhầm; (3) "còn lại hôm nay" hiển thị đúng số từ `calculateDailyRemaining`; (4) skeleton loading khi fetch, không spinner toàn trang (đã có sẵn ở `DashboardClient.tsx` — chỉ verify không bị phá bởi thay đổi Task 1-4); (5) demo "nhà Minnie" (story 4.6, dùng chung `DashboardView`) không bị vỡ bởi field `hasAnyTransactionEver` mới — kiểm tra demo data JSON tĩnh có field này hay cần default `true`

## Dev Notes

### Bug thật đã xác nhận — không phải giả định

`DashboardView.tsx` dòng ~95 (`{data.topExpenseCategories.length > 0 && (...)}`) là nguyên nhân chính xác của "vùng trống" mà AC1/AC2 mô tả — đã đọc code xác nhận trực tiếp, không suy đoán. Đây là điểm sửa quan trọng nhất của story này.

### Những gì ĐÃ đúng sẵn — không cần sửa

- `DashboardClient.tsx` đã dùng skeleton loading, không spinner toàn trang (AC1 "skeleton loading" đã thoả) — chỉ cần verify không regress, không viết lại
- `FundOverviewCard.tsx` đã tính progress an toàn (`target && target > 0 ? balance/target : null`, không NaN khi `target_amount = null` như quỹ `freedom`) — card mục tiêu 0% (AC1) đã hoạt động đúng ngay khi có ≥1 fund, không cần sửa
- `data.budgetLines.length > 0` và `data.funds.length > 0` ở `DashboardView.tsx` luôn `true` ngay sau onboarding (story 4.4 tạo 18 budget lines + 1 goal fund trong cùng transaction) — 2 điều kiện ẩn-section này KHÔNG phải bug (khác với `topExpenseCategories`, mảng này thực sự có thể rỗng ở ngày 0 vì chưa có giao dịch)
- `WeekdayChart` đã tự chống chia-cho-0 bằng `Math.max(maxAmount, 1)` — dữ liệu toàn-0 vẫn render được (bar phẳng), không throw, không cần sửa

### Phân biệt "ngày 0 thật" và "tháng đang xem rỗng"

Không được dùng `data.topExpenseCategories.length === 0` (hay bất kỳ mảng nào scope theo THÁNG hiện tại) làm điều kiện để quyết định hiển thị copy "ngày 0 đồng hành" — vì user cũ xem một tháng không có giao dịch (tháng tương lai, hoặc tháng trước khi họ dùng app) cũng sẽ có mảng rỗng, nhưng đó KHÔNG phải trạng thái ngày 0 và không nên nhận copy "chào mừng bạn mới". Field mới `hasAnyTransactionEver` (toàn bộ lịch sử, không scope tháng) là điều kiện đúng để quyết định.

### Component thay đổi — giữ tương thích ngược

`SpendingDonut`/`RecentTransactionsList`/`TopExpensesWidget` đều được dùng lại ở nơi khác ngoài dashboard (ít nhất `RecentTransactionsList` khả năng cao dùng ở trang khác — kiểm tra bằng grep import trước khi sửa). Thêm prop optional `emptyMessage` thay vì đổi cứng text bên trong component, để các call site khác không truyền prop vẫn giữ nguyên `common.noData` như trước — không phá hành vi hiện có ở nơi khác.

### Story 4.6 (demo "nhà Minnie") dùng chung `DashboardView`

Demo dùng file JSON tĩnh (không gọi API `/api/dashboard`) render qua `DashboardView` y hệt dashboard thật (đảm bảo demo = ảnh thật sản phẩm, xem addendum.md). Field mới `hasAnyTransactionEver` phải có mặt (hoặc default hợp lý, gợi ý `true` vì demo có sẵn dữ liệu tháng) trong demo data JSON, nếu không `DashboardView` sẽ nhận `undefined` — kiểm tra `src/components/onboarding/v2/hookDemoData.ts` hoặc file demo JSON tương ứng và cập nhật nếu cần.

### Project Structure Notes

- File UPDATE (đọc trước khi sửa): `src/app/api/dashboard/route.ts`, `src/types/app.ts` (`DashboardData`), `src/lib/hooks/useDashboard.ts`, `src/components/dashboard/DashboardView.tsx`, `src/components/dashboard/DashboardCharts.tsx` (`TopExpensesWidget`), `src/components/shared/SpendingDonut.tsx`, `src/components/dashboard/RecentTransactionsList.tsx`
- Không sửa `FundOverviewCard.tsx`, `WeekdayChart`, `IncomeExpenseBar` — đã đúng, chỉ verify
- Phụ thuộc story 5.1 đã `done`/`review` trước khi làm Task 4 (cần `calculateDailyRemaining` từ `src/lib/insight/dailyRemaining.ts`)

### References

- [Source: epics-onboarding-v2.md#Story 5.2]
- [Source: src/components/dashboard/DashboardView.tsx — dòng ~95 điều kiện ẩn section]
- [Source: src/components/dashboard/DashboardCharts.tsx — TopExpensesWidget internal empty branch (hiện dead code)]
- [Source: src/components/shared/SpendingDonut.tsx, src/components/dashboard/RecentTransactionsList.tsx — common.noData fallback hiện tại]
- [Source: src/app/api/dashboard/route.ts — transactions query hiện có, điểm thêm count query mới]
- [Source: 5-1-insight-engine-formula-v1.md — calculateDailyRemaining]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` — 2 errors, both pre-existing baseline errors in `src/app/(app)/layout.tsx` (`SelectQueryError` conversion), unrelated to this story; confirmed via `git stash && npx tsc --noEmit | grep -c "error TS"` at Story 5.1 time — count unchanged after this story's edits
- `npx vitest run` — 23 test files, 317 tests, all pass (no regressions; `hookDemoData.test.ts` still passes with new `hasAnyTransactionEver` field added to demo data)
- `psql` against local Supabase (`127.0.0.1:54322`) — confirmed empirically that `v_budget_actual` (queried by the pre-existing `src/app/api/dashboard/route.ts`) does not exist: `ERROR: relation "v_budget_actual" does not exist`. Cross-checked with `grep -r "CREATE VIEW" supabase/migrations/` — zero matches for that view anywhere in the migration history.

### Completion Notes List

- **Sửa lại Dev Notes đã sai của chính story này**: mục "Những gì ĐÃ đúng sẵn" ở trên khẳng định `data.budgetLines.length > 0` luôn `true` ngay sau onboarding — **điều này sai**. Phát hiện trong lúc code Task 4 rằng `src/app/api/dashboard/route.ts` (trước khi sửa) query `.from("v_budget_actual")` — một Supabase view **không tồn tại** ở bất kỳ đâu trong `supabase/migrations/` (xác nhận cả bằng grep tĩnh và bằng `psql` chạy trực tiếp lên local DB, trả về lỗi `relation "v_budget_actual" does not exist`). Hậu quả: `budgetLines` trong response `/api/dashboard` **luôn là mảng rỗng** cho MỌI household, MỌI ngày — không phải vấn đề riêng của ngày 0. Điều này chặn đứng cả AC1 của chính story 5.2 (số "còn lại hôm nay" luôn tính trên `[]` → luôn ra 0) lẫn Story 5.1's engine (không bao giờ nhận dữ liệu thật). Đã sửa bằng cách đổi sang dùng đúng RPC `get_budget_with_actuals` (cùng pattern đã đúng ở `src/app/api/budget/route.ts`). Đây là bug production nghiêm trọng, không phải scope creep — nếu không sửa, AC1 của chính story này (hiển thị số "còn lại hôm nay") sẽ không bao giờ đúng.
- Task 1: thêm `hasAnyTransactionEver` bằng 1 query `count("exact", { head: true })` không lọc tháng trên `transactions`, cộng vào response `/api/dashboard`; thêm field vào `DashboardData` (`src/types/app.ts`); `useDashboard.ts` không cần đổi (type truyền nguyên vẹn qua `useQuery`).
- Task 2: bỏ điều kiện `data.topExpenseCategories.length > 0 &&` bọc ngoài section Top Expenses trong `DashboardView.tsx` — section + header giờ luôn render, để `TopExpensesWidget`'s nhánh rỗng nội bộ (trước đây là dead code, không bao giờ chạy tới) chạy đúng như thiết kế ban đầu của nó.
- Task 3: thêm prop optional `emptyMessage?: string` cho `SpendingDonut`, `RecentTransactionsList`, `TopExpensesWidget` — dùng `emptyMessage ?? t("common.noData")` để giữ nguyên hành vi cũ ở nơi khác không truyền prop (xác nhận `SpendingDonut` còn được dùng ở `src/components/reports/SpendingTab.tsx` — không truyền prop mới, hành vi không đổi). `DashboardView.tsx` truyền `emptyMessage` cho cả 3 component **chỉ khi** `!data.hasAnyTransactionEver`. Thêm key `dashboard.dayZeroEmptyHint` vào `vi.json`/`en.json` — copy đồng hành hướng tới hành động ("Bức tranh này sẽ đầy dần khi bạn ghi lại khoản chi đầu tiên" / EN tương đương), không dùng cụm "chưa có dữ liệu"/"no data" lạnh lùng, không kèm CTA button (CTA thật thuộc Story 5.3).
- Task 4: thêm khối "còn lại hôm nay" ở đầu `DashboardView.tsx` (trên metric tiles), gọi trực tiếp `calculateDailyRemaining(data.budgetLines)` từ Story 5.1 — pure function client-side, không fetch thêm. `font-mono tabular-nums` + `formatVND` đúng convention.
- Task 5: verify thủ công (xem `### Testing` bên dưới). Lưu ý phụ phát hiện khi verify demo "nhà Minnie" (item 5): `hookDemoData.ts`'s `buildBudgetLines()` gán `cost_type_name` bằng `COST_TYPE_GROUP_LABELS[group][locale]` (nhãn nhóm đã dịch, ví dụ "Chi phí cố định") — KHÔNG khớp với `BUDGET_TEMPLATE[].name` thật (ví dụ "Ăn uống ngoài") mà `isFlexibleBudgetLine()` (Story 5.1) dùng để match. Hậu quả: `calculateDailyRemaining()` áp lên demo data sẽ luôn ra `0` (không dòng nào match "flexible") — đây là hạn chế có sẵn của demo data (đơn giản hoá theo nhóm thay vì theo từng cost-type), không phải bug mới do story này gây ra, và ngoài phạm vi story 5.2 (demo chỉ cần field `hasAnyTransactionEver: true` mới không bị `undefined` — đã thêm). Đã thêm field, chưa sửa cấu trúc demo data vì không thuộc AC nào của story này — cờ lại cho ai làm Story 5.4/5.5 nếu demo cần hiển thị "còn lại hôm nay" chính xác.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Dashboard ngày 0 (household mới, 0 giao dịch): không section nào biến mất, Top Expenses hiện copy ngày-0 | Manual trace: đọc `DashboardView.tsx` sau sửa — section Top Expenses không còn bọc điều kiện, `TopExpensesWidget` nhận `emptyMessage={dayZeroEmptyMessage}` (= `t("dashboard.dayZeroEmptyHint")` khi `!hasAnyTransactionEver`); `SpendingDonut`/`RecentTransactionsList` cùng logic | ✅ Pass |
| 2 | Household cũ xem tháng rỗng (`hasAnyTransactionEver=true`): vẫn hiện `common.noData` như cũ | Manual trace: `dayZeroEmptyMessage = !data.hasAnyTransactionEver ? t(...) : undefined` → khi `true`, giá trị là `undefined` → `emptyMessage ?? t("common.noData")` fallback đúng về `common.noData` | ✅ Pass |
| 3 | "Còn lại hôm nay" hiển thị đúng số từ `calculateDailyRemaining` | Automated: `calculateDailyRemaining` đã có 6/6 test pass từ Story 5.1 (`dailyRemaining.test.ts`); Manual trace xác nhận `DashboardView.tsx` gọi đúng `calculateDailyRemaining(data.budgetLines)` không tham số thừa, render qua `formatVND` + `font-mono tabular-nums` | ✅ Pass |
| 4 | Skeleton loading khi fetch, không spinner toàn trang, không bị phá bởi Task 1-4 | Manual trace: đọc `DashboardClient.tsx` — không sửa file này ở story 5.2, `isLoading` gate vẫn render `SkeletonCard`/`SkeletonList` trước khi `DashboardView` mount, không liên quan tới các field mới | ✅ Pass |
| 5 | Demo "nhà Minnie" (Story 4.6) không vỡ vì field `hasAnyTransactionEver` mới | Automated: `npx vitest run` — `hookDemoData.test.ts` pass sau khi thêm `hasAnyTransactionEver: true` vào `buildHookDemoData()`; TypeScript không báo thiếu field (`DashboardData` yêu cầu field bắt buộc, không optional) | ✅ Pass |
| 6 | `npx tsc --noEmit` không phát sinh lỗi mới | Automated: 2 lỗi còn lại là baseline có sẵn trước story (đã xác nhận bằng `git stash` ở Story 5.1), không tăng thêm | ✅ Pass |
| 7 | `npx vitest run` toàn bộ suite không regress | Automated: 23 test files / 317 tests pass | ✅ Pass |

### File List

- `src/app/api/dashboard/route.ts` (UPDATE) — fix bug: đổi query từ view không tồn tại `v_budget_actual` sang RPC `get_budget_with_actuals`; thêm query `hasAnyTransactionEver`
- `src/types/app.ts` (UPDATE) — thêm `hasAnyTransactionEver: boolean` vào `DashboardData`
- `src/components/dashboard/DashboardView.tsx` (UPDATE) — bỏ điều kiện ẩn Top Expenses section; thêm khối "còn lại hôm nay"; truyền `emptyMessage` cho 3 component con
- `src/components/shared/SpendingDonut.tsx` (UPDATE) — thêm prop optional `emptyMessage`
- `src/components/dashboard/RecentTransactionsList.tsx` (UPDATE) — thêm prop optional `emptyMessage`
- `src/components/dashboard/DashboardCharts.tsx` (UPDATE) — `TopExpensesWidget` thêm prop optional `emptyMessage`
- `src/components/onboarding/v2/hookDemoData.ts` (UPDATE) — thêm `hasAnyTransactionEver: true` vào demo data
- `src/lib/i18n/messages/vi.json`, `src/lib/i18n/messages/en.json` (UPDATE) — thêm `dashboard.dailyRemaining`, `dashboard.dayZeroEmptyHint`

## Change Log

- 2026-07-04: Story implemented — day-0 dashboard no-empty-zone fix, `hasAnyTransactionEver` field, daily-remaining display, plus a confirmed pre-existing production bug fix (`v_budget_actual` nonexistent view → `get_budget_with_actuals` RPC). Status → review.
