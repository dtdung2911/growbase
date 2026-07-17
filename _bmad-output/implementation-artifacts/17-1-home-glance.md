---
title: 'Story 17.1: Home glance (mobile)'
type: 'feature'
created: '2026-07-17'
status: 'done'
baseline_revision: '4446644f7c0b00eb37dc9a92efdce917d8e54d31'
final_revision: '6e1fa8b9c74c5b87a53de4bd7278771551779808'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-17-context.md'
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** Tab Home trên mobile app hiện chỉ là `ScreenPlaceholder` — người dùng mở app không thấy được tình hình chi tiêu hôm nay/tháng này (nửa "glance" của scope v1 capture + glance).

**Approach:** Dựng màn Home read-only tiêu thụ endpoint `/api/dashboard` sẵn có: card "hôm nay tiêu được bao nhiêu" (derive từ `calculateDailyRemaining` trong shared, chỉ hiện nếu áp dụng), card tổng chi tháng vs budget, danh sách giao dịch gần đây, offline/sync banner tái dùng pattern Epic 16.

## Boundaries & Constraints

**Always:**
- Mọi data đọc qua `apiFetch` tới `/api/dashboard?month={currentMonth}` (Bearer token tự gắn); không query Supabase trực tiếp.
- Query key qua factory: `keys.dashboard(householdId, currentMonth)` từ `@growbase/shared`; `householdId`/`currentMonth` chỉ lấy từ `useAppStore` selector.
- `enabled: !!user && !!householdId && !isLocked` giống `useTransactions`.
- Amounts dùng `formatVND`/`formatVNDCompact` + font mono (const `MONO` pattern hiện có); i18n keys mới phải thêm cả `vi.ts` và `en.ts` (parity test sẽ fail nếu thiếu); `t()` không interpolate — dùng `.replace()`.
- Màu/token từ `useTheme().colors`, không hardcode hex; touch target ≥44px.
- Loading = skeleton (dùng `Skeleton`/`TransactionRowSkeleton`), không spinner toàn màn.
- Áp dụng karpathy-guidelines: tối thiểu, không dựng abstraction mới khi pattern có sẵn.

**Block If:**
- `/api/dashboard` không trả được `budgetLines`/`recentTransactions` như type `DashboardData` (contract lệch) — không tự sửa backend ngoài scope.
- Cần thêm endpoint backend mới để thoả AC.

**Never:**
- Không mutation, không fund ops, không offline queue/Idempotency-Key (story thuần read-only).
- Không cài chart lib (donut/bar thuộc 17.2), không build màn Stats.
- Không dựng lại transaction list/sync engine — tái dùng Epic 16.
- Không thêm field mới vào response `/api/dashboard`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Online, có flexible budget, có giao dịch | Card "hôm nay tiêu được" (daily remaining), tổng chi tháng vs tổng budget + % + màu semantic, ~5 giao dịch gần đây | Không lỗi |
| Không áp dụng daily | `budgetLines` rỗng hoặc không có flexible line với `budget_amount > 0` | Ẩn card "hôm nay tiêu được"; vẫn hiện tổng chi (không % nếu tổng budget = 0) | Không lỗi |
| Daily remaining âm | Đã chi vượt flexible budget | Hiển thị `0đ` với màu `error` | Không lỗi |
| Chưa có giao dịch nào | `hasAnyTransactionEver === false` | `EmptyState` + CTA mở `/quick-add` ghi khoản đầu | Không lỗi |
| Offline + cache | `useIsOnline()===false`, `dataUpdatedAt>0` | Banner offline + dòng "Số liệu tính đến {time}"; data cached vẫn hiển thị | Không lỗi |
| Offline không cache / API lỗi | Query error | `EmptyState` báo lỗi (pattern transactions.tsx), giữ màn | Không toast spam; retry qua pull-to-refresh |
| Pull-to-refresh | Kéo xuống | `RefreshControl` spinner, `refetch()`, cập nhật `dataUpdatedAt` | Lỗi giữ data cũ |

</intent-contract>

## Code Map

- `apps/mobile/app/(tabs)/index.tsx` -- Home stub (`ScreenPlaceholder`) cần thay bằng màn glance
- `apps/mobile/app/(tabs)/transactions.tsx` -- pattern chuẩn: offline banner, dataAsOf, skeleton, EmptyState (dòng 79–90)
- `apps/mobile/src/features/transactions/TransactionRow.tsx` -- row giao dịch + const `MONO`; props `{transaction, myMemberId, currentMonth, onEdit, onDelete}`
- `apps/mobile/src/features/transactions/useTransactions.ts` -- template hook (queryKey/enabled/apiFetch)
- `apps/mobile/src/api/client.ts` -- `apiFetch<T>` unwrap `{data,error}`, Bearer tự gắn
- `apps/mobile/src/lib/network/useIsOnline.ts` -- online state cho banner
- `apps/mobile/src/components/Skeleton.tsx`, `EmptyState.tsx` -- loading/empty
- `apps/mobile/src/lib/i18n/messages/vi.ts`, `en.ts` -- catalog; parity test ép đủ 2 file
- `packages/shared/src/queryKeys.ts` -- `keys.dashboard(hid, month)` đã có
- `packages/shared/src/types/app.ts` -- `DashboardData` (totalExpense, budgetLines, recentTransactions, hasAnyTransactionEver), `BudgetActualLine`
- `packages/shared/src/rules/dailyRemaining.ts` -- `calculateDailyRemaining(budgetLines, today?)`, `isFlexibleBudgetLine`
- `packages/shared/src/rules/currency.ts` -- `formatVND`, `formatVNDCompact`
- `apps/web/src/app/api/dashboard/route.ts` -- endpoint nguồn, đã `withAuth()` Bearer — không sửa

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/src/features/dashboard/useDashboard.ts` -- tạo hook `useDashboard()` theo template `useTransactions`: `keys.dashboard(householdId ?? "", currentMonth)`, `apiFetch<DashboardData>("/api/dashboard?month=" + currentMonth)` -- data layer duy nhất cho Home
- [x] `apps/mobile/src/features/dashboard/homeGlance.ts` -- pure helpers: `getDailyAllowance(budgetLines)` (null nếu không áp dụng, clamp ≥0 + flag vượt) và `getBudgetUsage(totalExpense, budgetLines)` (`{totalBudget, usagePct}`) -- logic tách khỏi UI để test
- [x] `apps/mobile/src/features/dashboard/homeGlance.test.ts` -- unit test edge cases matrix (không áp dụng / âm / budget 0) bằng Vitest colocated
- [x] `apps/mobile/app/(tabs)/index.tsx` -- thay stub: ScrollView + `RefreshControl`; offline banner + dataAsOf (copy pattern transactions.tsx); stat card "hôm nay tiêu được" (ẩn nếu null); card tổng chi vs budget (% + màu success/warning ≥80%/error >100%); section giao dịch gần đây (~5 dòng, read-only — tái dùng `TransactionRow` nếu props cho phép no-op actions, ngược lại row nhẹ nội bộ); skeleton khi `isPending`; `EmptyState` + CTA `/quick-add` khi `hasAnyTransactionEver === false`
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- thêm keys `home.*` (tiêu đề card, nhãn budget, empty CTA…) đủ cả hai catalog

**Acceptance Criteria:**
- Given user đã login + chọn household, when mở tab Home, then thấy tổng chi tháng hiện tại vs budget, giao dịch gần đây; amounts mono; skeleton khi đang load.
- Given household có flexible budget, when Home load xong, then card "hôm nay tiêu được bao nhiêu" hiển thị số từ `calculateDailyRemaining`; household không có thì card ẩn hẳn.
- Given đang offline với cache, when mở Home, then banner offline + "Số liệu tính đến {time}" hiển thị, data cached vẫn đọc được.
- Given màn Home, when kéo pull-to-refresh, then data refetch và indicator tắt sau khi xong.
- Given locale en, when mở Home, then mọi chuỗi hiển thị tiếng Anh (không hardcode vi).

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile exec vitest run` -- expected: pass toàn bộ, gồm `homeGlance.test.ts` và `parity.test.ts`
- `pnpm --filter @growbase/mobile exec tsc --noEmit` -- expected: 0 error

**Manual checks (if no CLI):**
- Mở dev client, tab Home: đủ 3 khối (daily/tháng vs budget/recent), kéo refresh chạy, bật airplane mode thấy banner + dataAsOf.

## Spec Change Log

## Review Triage Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 6: (high 1, medium 1, low 4)
- defer: 3: (high 0, medium 1, low 2)
- reject: 7: (high 0, medium 0, low 7)
- addressed_findings:
  - `[high]` `[patch]` Error branch `isError || !data` nuốt cached data khi refetch fail — đổi guard còn `!data`, refetch lỗi giữ nguyên data cached (khớp matrix "Lỗi giữ data cũ").
  - `[medium]` `[patch]` Offline lần đầu không cache → skeleton vĩnh viễn (query paused, networkMode online) — dùng `isPaused`: skeleton chỉ khi đang fetch thật, `!data && (isError || isPaused)` → EmptyState trong ScrollView + RefreshControl để retry.
  - `[low]` `[patch]` `EmptyBlock` local trùng `EmptyState` — thêm prop `action?` (pill ≥44px) vào `EmptyState`, xóa EmptyBlock.
  - `[low]` `[patch]` Daily allowance dùng device date lệch `currentMonth` (month rollover) — `getDailyAllowance(budgetLines, currentMonth, today?)` trả null khi `toYearMonth(today) !== currentMonth` + test.
  - `[low]` `[patch]` Section giao dịch gần đây trống trơ heading khi tháng mới — thêm message `home.recentEmpty` (vi+en).
  - `[low]` `[patch]` 100.4% làm tròn thành 100 mất màu error — `getBudgetUsage` trả `over: totalExpense > totalBudget`, màu error theo `over` + test.

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 0
- defer: 0
- reject: 8
- addressed_findings:
  - none

## Auto Run Result

**Summary:** Story 17.1 Home glance (mobile) — tab Home thay stub bằng màn glance read-only: card "hôm nay tiêu được" (calculateDailyRemaining, ẩn nếu không áp dụng), card tổng chi tháng vs budget (% + progress bar + màu semantic), ~5 giao dịch gần đây, offline banner + "Số liệu tính đến {time}", skeleton, EmptyState + CTA /quick-add, pull-to-refresh. Data qua hook `useDashboard` mới → `GET /api/dashboard?month=` (keys.dashboard, Bearer).

**Files changed:**
- `apps/mobile/src/features/dashboard/useDashboard.ts` — hook mới, clone shape useTransactions
- `apps/mobile/src/features/dashboard/homeGlance.ts` — pure helpers getDailyAllowance/getBudgetUsage
- `apps/mobile/src/features/dashboard/homeGlance.test.ts` — 11 unit tests edge matrix
- `apps/mobile/app/(tabs)/index.tsx` — màn Home glance thay ScreenPlaceholder
- `apps/mobile/src/components/EmptyState.tsx` — thêm prop `action?` (CTA pill)
- `apps/mobile/src/lib/i18n/messages/vi.ts`, `en.ts` — keys `home.*` (11 keys, parity OK)

**Review findings:** 6 patch đã fix (1 high, 1 medium, 4 low) · 3 defer vào deferred-work.md (gcTime persist GC, formatTime thiếu ngày, isFlexibleBudgetLine match theo tên) · 7 reject.

**Verification:** `vitest run` → 21 files / 134 tests pass (gồm homeGlance 11 + parity) · `tsc --noEmit` → 0 error. Manual dev-client check chưa chạy (unattended run) — xem Manual checks trong spec.

**Residual risks:** UI branch logic (error-with-cache, offline-paused) chưa có render test — apps/mobile chưa có RN testing-library harness (đã ghi deferred từ 16-2/16-4). Rule flexible-line match theo tên có thể ẩn daily card với household đã rename cost type (deferred).

**Review pass 2 (2026-07-18):** Re-review độc lập (Blind Hunter + Edge Case Hunter). 8 finding surface lại đều đã được pass 1 xử lý hoặc reject: infinite-skeleton/offline-icon/month-rollover đã có guard từ patch pass 1; budget usage num/denom là by-design theo intent ("tổng chi tháng vs tổng budget"); progress-bar lower-clamp & NaN totalExpense không reachable (expense total ≥ 0, contract number); persister buster/gcTime là near-dup của defer đã có. Kết quả: 0 patch, 0 defer mới, 8 reject. `vitest` homeGlance 11/11 pass · `tsc --noEmit` 0 error · 0 code change. Converged — followup_review không cần thiết.
