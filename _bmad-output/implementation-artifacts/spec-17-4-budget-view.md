---
status: 'done'
epic: 17
story: 4
slug: 17-4-budget-view
warnings: ['oversized']
baseline_revision: 32c3d2a93e16b00464d5634f40177073b8b00ceb
final_revision: 113b5f9c0004afcd462d33a292101ed711c7b857
followup_review_recommended: false
---

# Spec 17-4: Xem ngân sách (Budget view, mobile)

<intent-contract>

## Intent

**Problem:** Mobile app (Epic 17 "glance") còn thiếu màn xem ngân sách. User cần liếc nhanh trên điện thoại: mỗi dòng ngân sách còn lại bao nhiêu, đã chi bao nhiêu, % sử dụng, và tín hiệu vượt ngưỡng — mà không phải mở web. Backend đọc đã sẵn (Epic 14, `/api/budget` nhận Bearer).

**Approach:** Thêm màn `Budget` read-only vào mobile, mirror pattern màn Funds (17-3) và card budget của Stats (17-2). Đọc `GET /api/budget?month` → `BudgetActualLine[]`, gom nhóm theo cost-type-group qua `BUDGET_TEMPLATE` (khớp tên), render group cards tĩnh + summary tổng, dùng màu semantic 3 mức cho % sử dụng. Vào từ Menu → Budget.

## Boundaries & Constraints

**Always:**
- Read-only: chỉ `GET`, không mutation. Không backend contract mới.
- Chuỗi qua `t()` (thêm cả vi + en, giữ parity). Màu qua theme tokens, số tiền font mono + tabular-nums.
- Query key từ factory `@growbase/shared/queryKeys` (dùng `keys.budgetActuals`). Store guards (user + householdId + !isLocked).
- Logic thuần (gom nhóm, tính tổng, ngưỡng màu) tách khỏi UI để unit-test được, giống `fundsGroup.ts`.
- Reuse shared: `BudgetActualLine` type, `BUDGET_TEMPLATE`/`COST_TYPE_GROUP_LABELS`/`CostTypeGroupKey`, `formatVND` — không reimplement.

**Block If:**
- `/api/budget` không tồn tại hoặc response KHÔNG phải `{data: BudgetActualLine[], error}` → HALT `blocked`, condition `budget API contract mismatch`.
- `keys.budgetActuals` không import được từ `@growbase/shared/queryKeys` → HALT `blocked`, condition `missing budget query key`.

**Never:**
- Không tạo/sửa/xóa budget, không cấu hình money model, không edit override pct (nút bút chì của web bỏ hẳn).
- Không collapse/expand interaction (read-only glance → group cards tĩnh).
- Không donut/bar chart (đó là scope Stats 17-2).
- Không thêm budget vào bottom tab (vào từ Menu, giống Funds).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gom nhóm nhiều dòng | `BudgetActualLine[]` khớp template nhiều group | Nhóm theo `costTypeGroup`, thứ tự cố định `[fixed,variable,wasteful,savings_investment,debt_repayment,other]`, dòng trong nhóm theo `sortOrder` template | No error |
| Nhóm rỗng | Không dòng nào thuộc 1 group | Group đó bị ẩn | No error |
| Dòng không khớp template | `cost_type_name` không có trong `BUDGET_TEMPLATE` | Bỏ qua (mirror web: iterate template) | No error |
| Chia 0 | `budget_amount = 0` | `usagePct` group = 0 (guard), không NaN/Infinity | No error |
| Ngưỡng màu | `usagePct` 0–200 | `>=100` error, `>=80` warning, `else` success; bar fill clamp 0–100% | No error |
| Data rỗng | `[]` | EmptyState (title + message), không crash | No error |
| Lỗi tải (online) | query error, `data` undefined | EmptyState loadError | Toast không bắt buộc; không crash |
| Offline có cache | `isPaused`, `dataUpdatedAt>0` | Banner offline + "Số liệu tính đến {time}" + render cache; pull-to-refresh khi online | No error |

</intent-contract>

## Code Map

- `apps/mobile/src/features/budget/budgetGroup.ts` -- MỚI: pure logic. `BUDGET_GROUP_ORDER`, `groupBudgetLines(lines): BudgetGroup[]` (join `BUDGET_TEMPLATE` theo `cost_type_name`, gom `costTypeGroup`, sort theo template, drop rỗng, tính tổng budget/actual/remaining/usagePct guard chia-0), `budgetLineStatus(usagePct): "safe"|"warning"|"over"`, `clampPct`. Type `BudgetGroup`.
- `apps/mobile/src/features/budget/budgetGroup.test.ts` -- MỚI: vitest cho I/O Matrix (gom nhóm, thứ tự, drop rỗng, dòng lạc, chia-0, ngưỡng màu). Mirror `fundsGroup.test.ts` (factory `makeLine`, không React/store).
- `apps/mobile/src/features/budget/useBudget.ts` -- MỚI: `useQuery` đọc `/api/budget?month=${currentMonth}` qua `apiFetch<BudgetActualLine[]>`, key `keys.budgetActuals(householdId ?? "", currentMonth)`, `enabled: !!user && !!householdId && !isLocked`. Mirror `useDashboard.ts` (có month) + `useFunds.ts`.
- `apps/mobile/app/budget.tsx` -- MỚI: màn full-screen. Header back, offline banner, dataAsOf, Skeleton (isPending && !isPaused), EmptyState (loadError khi !data / empty khi 0 dòng), ScrollView + RefreshControl. Summary card tổng (allocated/spent/remaining + bar usage tổng). Group cards tĩnh: label `t("budget.group.*")`, tổng nhóm, màu theo status; dòng: `cost_type_name`, allocated/spent/remaining mono, bar + `usage_pct`. Copy scaffold từ `app/funds.tsx` + card từ `app/(tabs)/stats.tsx:107-146`.
- `apps/mobile/app/(tabs)/menu.tsx` -- SỬA: thêm row "Budget" → `router.push("/budget")`, icon `pie-chart-outline`, `t("menu.budget")` (cạnh row Funds).
- `apps/mobile/src/lib/i18n/messages/vi.ts` & `en.ts` -- SỬA: thêm `menu.budget`, `budget.title`, `budget.group.{fixed|variable|wasteful|savings_investment|debt_repayment|other}`, `budget.allocated`, `budget.spent`, `budget.remaining`, `budget.usage`, `budget.empty.title`, `budget.empty.message`, `budget.loadError`. Text nhóm lấy từ `COST_TYPE_GROUP_LABELS`. Reuse `offline.banner`, `offline.dataAsOf`. Parity vi=en key set.
- `packages/shared/src/types/app.ts` -- ĐỌC: `BudgetActualLine` (`cost_type_id/name`, `budget_amount`, `actual_amount`, `remaining`, `usage_pct`, `effective_pct`...).
- `packages/shared/src/constants/budgetTemplate.ts` -- ĐỌC: `BUDGET_TEMPLATE` (`name`, `budgetPct`, `sortOrder`, `costTypeGroup`), `COST_TYPE_GROUP_LABELS`, `CostTypeGroupKey`.
- `packages/shared/src/queryKeys.ts` -- ĐỌC: `keys.budgetActuals(hid, month)`.
- `apps/web/src/app/api/budget/route.ts` -- ĐỌC: contract GET (`month` regex, `withAuth` Bearer, RPC `get_budget_with_actuals`, envelope `{data,error}`).
- `apps/web/src/components/budget/BudgetClient.tsx` -- THAM CHIẾU: thứ tự nhóm + cách join template (không copy mutation/collapse/edit).

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/src/features/budget/budgetGroup.ts` -- viết `BUDGET_GROUP_ORDER`, `groupBudgetLines`, `budgetLineStatus`, `clampPct`, type `BudgetGroup` -- logic thuần tách khỏi UI để test.
- [x] `apps/mobile/src/features/budget/budgetGroup.test.ts` -- unit-test các case I/O Matrix -- grouping/sort/drop/chia-0/ngưỡng đúng.
- [x] `apps/mobile/src/features/budget/useBudget.ts` -- hook đọc `/api/budget?month` qua `apiFetch` + `keys.budgetActuals` + store guards -- nguồn dữ liệu màn.
- [x] `apps/mobile/app/budget.tsx` -- màn group cards + summary, mono, bar/màu theo status, offline banner + Skeleton + EmptyState + RefreshControl -- màn chính.
- [x] `apps/mobile/app/(tabs)/menu.tsx` -- thêm row Budget điều hướng `/budget` -- điểm vào theo AC "Menu → Budget".
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- thêm key `budget.*` / `menu.budget` (parity) -- không hardcode chuỗi.

**Acceptance Criteria:**
- Given user đã đăng nhập có household, when mở Menu và chạm "Budget", then push sang màn Budget hiển thị các dòng ngân sách gom theo group đúng thứ tự cố định (nhóm rỗng ẩn), mỗi dòng có ngân sách/đã chi/còn lại/% sử dụng.
- Given màn Budget đang tải lần đầu, when chưa có data, then hiện Skeleton (không spinner toàn màn); khi có data, mỗi dòng và mỗi group hiện tín hiệu màu semantic theo % (success/warning/error) và số tiền font mono.
- Given household chưa có budget/actuals (`[]`), when data rỗng, then hiện EmptyState với title + message, không crash.
- Given thiết bị offline nhưng có cache, when mở màn, then hiện banner offline + "Số liệu tính đến {time}" và render dòng ngân sách từ cache; pull-to-refresh khả dụng khi online.
- Given `pnpm --filter @growbase/mobile test`, when chạy, then `budgetGroup.test.ts` pass và `parity.test.ts` vẫn pass (vi/en trùng key).

## Design Notes

- **Một ngưỡng màu thống nhất mobile:** dùng `>=100 → error, >=80 → warning, else success` cho cả dòng lẫn group (đã dùng ở Stats 17-2). Web có 2 thang riêng (pill 70/86/100, bar 70/90) nhưng epic chỉ nêu 3 màu semantic → cố ý giữ 1 thang cho mobile nhất quán, không import logic 4 mức của web.
- **Gom nhóm = iterate `BUDGET_TEMPLATE`** rồi lookup line theo `name`, giống web: dòng API không khớp template sẽ không hiển thị (chấp nhận, mirror web). Group order loại `income`.
- Group cards **tĩnh** (không collapse) — read-only glance, giảm state/interaction (Karpathy).

## Verification

- `pnpm --filter @growbase/mobile test` -- `budgetGroup.test.ts` + `parity.test.ts` pass.
- `pnpm --filter @growbase/mobile exec tsc --noEmit` -- không lỗi type (nếu script `typecheck` tồn tại thì dùng nó).

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 1: (high 0, medium 1, low 0)
- defer: 1: (high 0, medium 0, low 1)
- reject: 11: (high 0, medium 0, low 11)
- addressed_findings:
  - `medium` `patch` Summary card 3-col values (`allocated`/`spent`/`remaining`) truncated at realistic 7–8 digit VND totals on 375px (`numberOfLines={1}` in flex:1 columns) → switched `SummaryStat` to `formatVNDCompact`. Per-line/group rows keep full `formatVND` (2-up layout, matches shipped stats/funds). tsc + tests re-verified green.

## Auto Run Result

Status: done

Story 17-4 (mobile READ-ONLY Budget view) implemented and reviewed via bmad-dev-auto.

**Delivered:**
- `apps/mobile/app/budget.tsx` — grouped budget screen (summary card + per-group static cards + per-line allocated/spent/remaining/usage%), semantic color thresholds, offline banner + cached-as-of + Skeleton + EmptyState + pull-to-refresh.
- `apps/mobile/src/features/budget/budgetGroup.ts` (+ `budgetGroup.test.ts`) — pure grouping via shared `BUDGET_TEMPLATE`, per-group totals with divide-by-zero guard, `budgetLineStatus` thresholds (>=100 over / >=80 warning / else safe), `clampPct`.
- `apps/mobile/src/features/budget/useBudget.ts` — `GET /api/budget?month` via `apiFetch` + `keys.budgetActuals`, store guards.
- `apps/mobile/app/(tabs)/menu.tsx` — Budget entry → `/budget`.
- i18n `vi.ts` + `en.ts` — `menu.budget` + `budget.*` (parity maintained).

**Verification:** `pnpm --filter @growbase/mobile exec tsc --noEmit` → 0 errors. `budgetGroup.test.ts` (7) + `parity.test.ts` (2) → pass.

**Review:** 1 patch applied (summary 3-col amounts → `formatVNDCompact`, avoids 375px truncation). 1 defer (disabled-query indefinite-skeleton — shared app-wide pattern, already logged under 17-3). 11 rejected (consistent with shipped 17-2/17-3 or by-design web parity). No intent_gap, no bad_spec. `followup_review_recommended: false`.

Baseline: `32c3d2a` · Final: `113b5f9`
