---
title: 'Story 17.2: Thống kê chi tiêu tháng (mobile)'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: 'f5ab9e753f5fdcad042c3354ae8cf8670602748a'
final_revision: '228cf0809d7da5557f4ec2d6144b01ff3ad3a156'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-17-context.md'
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** Tab Stats trên mobile app hiện chỉ là `ScreenPlaceholder` — người dùng không xem được thống kê chi tiêu tháng (chart theo category/group) và đối chiếu ngân sách, phần còn lại của "glance" trong scope v1.

**Approach:** Dựng màn Stats read-only: **donut chi theo category** + **bar chi theo group** (aggregate client-side từ `/api/transactions` join `/api/categories`, dùng lib `react-native-gifted-charts`), và **section đối chiếu ngân sách** (mỗi budget line: ngân sách / đã chi / còn lại / % + màu semantic) tái dùng `useDashboard().budgetLines`. Không thêm backend, không đổi `packages/shared`.

## Boundaries & Constraints

**Always:**
- Data qua `apiFetch` tới `/api/*` (Bearer tự gắn); query keys qua factory `keys.*` từ `@growbase/shared/queryKeys` (`keys.transactions`, `keys.categories`, `keys.dashboard` — đều đã có); `householdId`/`currentMonth`/`user`/`isLocked` chỉ lấy từ `useAppStore`.
- `enabled: !!user && !!householdId && !isLocked` cho mỗi query (mẫu `useTransactions`).
- Aggregate donut/bar tách vào pure helpers (`statsAggregate.ts`) + unit test colocated (Vitest), UI không chứa logic tính toán.
- Budget compare tái dùng `useDashboard()` (cùng endpoint/hook với Home 17.1 → cache nhất quán), KHÔNG thêm hook budget mới.
- Màu từ `useTheme().colors` + `chartPalette(isDark)`; không hardcode hex. Amounts `formatVND`/`formatVNDCompact` từ `@growbase/shared/rules/currency` + font mono (`MONO` const, `fontVariant: ["tabular-nums"]`). Touch target ≥44px.
- i18n: thêm keys `stats.*` vào **cả** `vi.ts` và `en.ts` (parity test fail nếu thiếu); `t()` không interpolate → dùng `.replace("{token}", val)`.
- Loading = skeleton, không spinner toàn màn; offline banner + "Số liệu tính đến {time}" (mẫu `index.tsx`); pull-to-refresh (`ScrollView` + `RefreshControl`, `refetch` cả 3 query).
- Áp karpathy-guidelines: tối thiểu, tái dùng pattern 17.1, không abstraction thừa.

**Block If:**
- `/api/categories` không trả `CategoryGroupWithCategories[]` hoặc `/api/transactions` đổi shape `TransactionWithJoins[]` (contract lệch) — không tự sửa backend ngoài scope.
- Cần backend/endpoint aggregate mới để thoả AC (epic cấm thêm backend contract).

**Never:**
- Không mutation, không fund ops, không offline queue/Idempotency-Key (story read-only).
- Không thêm endpoint `/api/*` mới, không đổi type/key trong `packages/shared`.
- Không dùng ApexCharts (web-only); không webview chart.
- Không build màn Budget đầy đủ (config/sửa budget) — thuộc 17.4; ở đây chỉ compare read-only.
- Không đổi response `/api/dashboard`, `/api/transactions`, `/api/categories`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|----------------------------|----------------|
| Happy path | Online, tháng có expense + có budget | Donut top-6 category + "Khác"; bar theo group; danh sách budget line (spent/budget/còn lại/% + bar màu), sort % desc | Không lỗi |
| Chỉ có income | txns toàn `direction==="in"` (hoặc `exclude_from_budget_report`) | Donut & bar rỗng → hiện empty-note trong section; budget vẫn render | Không lỗi |
| Category null / không có trong catalog | txn `category==null` hoặc `category_id` không map được group | Gộp vào bucket "Khác" (`stats.uncategorized`) ở cả donut & bar | Không lỗi |
| Không có giao dịch tháng | `transactions` = `[]` | `EmptyState` + CTA `/quick-add` (thay toàn bộ nội dung) | Không lỗi |
| Không có budget | `dashboard.budgetLines` = `[]` | Ẩn section budget (không render header rỗng) | Không lỗi |
| Vượt ngân sách | line `usage_pct >= 100` | Bar + % màu `error`; fill clamp 100% | Không lỗi |
| Offline + cache | `useIsOnline()===false`, `dataUpdatedAt>0` | Banner offline + "Số liệu tính đến {time}"; chart/budget từ cache vẫn hiển thị | Không lỗi |
| Offline no cache / query error | `!transactions && (isError || isPaused)` | `EmptyState` báo lỗi (icon `cloud-offline-outline`), retry qua pull-to-refresh | Không toast spam |
| Pull-to-refresh | Kéo xuống | `RefreshControl` spinner, `refetch()` cả 3 query, cập nhật `dataUpdatedAt` | Lỗi giữ data cũ |

</intent-contract>

## Code Map

- `apps/mobile/app/(tabs)/stats.tsx` -- STUB (`ScreenPlaceholder`) cần thay bằng màn Stats; tab đã đăng ký (`stats-chart`, `nav.stats`)
- `apps/mobile/app/(tabs)/index.tsx` -- Home 17.1: mẫu offline banner, `dataAsOf`/`formatTime`, skeleton (`isPending && !isPaused`), pull-to-refresh, `MONO`, progress bar + `usageColor` threshold, card style
- `apps/mobile/src/features/transactions/useTransactions.ts` -- mẫu hook + query dùng lại cho txns tháng
- `apps/mobile/src/features/dashboard/useDashboard.ts` -- nguồn `budgetLines` + `totalExpense` cho budget compare (tái dùng)
- `apps/mobile/src/api/client.ts` -- `apiFetch<T>(path)`; path bắt đầu `/`; envelope `{data,error}`; throw `ApiError`
- `apps/mobile/src/store/appStore.ts` -- `useAppStore` (user, householdId, currentMonth, isLocked)
- `apps/mobile/src/lib/network/useIsOnline.ts` -- online state cho banner
- `apps/mobile/src/components/{Skeleton,EmptyState}.tsx` -- `Skeleton{width,height,radius}`, `TransactionRowSkeleton`, `EmptyState{icon,title,message,action}`
- `apps/mobile/src/lib/i18n/messages/{vi,en}.ts` -- catalog flat dotted key; `parity.test.ts` ép parity
- `apps/mobile/src/lib/i18n/TranslationProvider.tsx` -- `useTranslation().t` (không interpolate)
- `apps/mobile/src/lib/theme/tokens.ts` -- `ThemeColors` (success/warning/error/primary/card/border/textMuted…); CHƯA có palette chart
- `packages/shared/src/types/{app,category}.ts` -- `TransactionWithJoins`, `BudgetActualLine`, `DashboardData`, `CategoryGroupWithCategories` (đọc, không sửa)
- `packages/shared/src/queryKeys.ts` -- `keys.transactions/categories/dashboard` (đọc, không sửa)
- `apps/mobile/package.json` -- thêm deps chart lib
- `apps/web/src/components/reports/SpendingTab.tsx` -- tham chiếu logic aggregate category→group (không sửa)

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/package.json` -- thêm `react-native-gifted-charts` + peer `react-native-svg` (dùng `expo install react-native-svg` để khớp SDK 56) + `react-native-linear-gradient`; chạy `pnpm install` -- lib donut/bar theo epic
- [x] `apps/mobile/src/lib/theme/chartPalette.ts` -- `chartPalette(isDark: boolean): string[]` (~8 màu categorical brand-neutral hsl, tương phản đủ light+dark) -- màu slice donut/bar, không hardcode trong component
- [x] `apps/mobile/src/features/stats/useCategories.ts` -- hook `useCategories()` clone mẫu `useTransactions`: `keys.categories(householdId ?? "")`, `apiFetch<CategoryGroupWithCategories[]>("/api/categories")`, `enabled` gate -- nguồn map category→group
- [x] `apps/mobile/src/features/stats/statsAggregate.ts` -- pure helpers: `aggregateByCategory(txns): CategorySlice[]` (lọc `direction==="out"` & `!exclude_from_budget_report`, gộp theo `category_id`, name/icon từ `txn.category`, `null`→"Khác", pct theo tổng, sort desc); `aggregateByGroup(txns, groups): GroupSlice[]` (map `cat.id→group.name`, không map→"Khác", pct, sort desc); `topNWithOther(slices, n, otherLabel): CategorySlice[]` -- logic tách UI để test
- [x] `apps/mobile/src/features/stats/statsAggregate.test.ts` -- Vitest phủ matrix: chỉ income (rỗng), category null→Khác, group không map→Khác, topN+Khác, pct tổng ≈100
- [x] `apps/mobile/src/features/stats/SpendingDonut.tsx` -- `PieChart` (donut) + legend list (icon/name/`formatVNDCompact`/%); màu từ `chartPalette`; empty-note khi `slices` rỗng -- donut theo category
- [x] `apps/mobile/src/features/stats/SpendingBar.tsx` -- `BarChart` theo group (value/label/frontColor từ `chartPalette`); empty-note khi rỗng -- bar theo group
- [x] `apps/mobile/app/(tabs)/stats.tsx` -- thay stub: đọc `useTransactions`+`useCategories`+`useDashboard`; combined `isPending/isPaused/isRefetching/dataUpdatedAt/refetch`; `ScrollView`+`RefreshControl`; offline banner + dataAsOf; skeleton khi pending; `EmptyState`+CTA `/quick-add` khi `transactions.length===0`; `EmptyState` lỗi khi `!transactions && (isError||isPaused)`; section Donut, section Bar, section Budget compare (danh sách line: name, `formatVND(actual)`/`formatVND(budget)`, còn lại, `usage_pct`%, progress bar + `usageColor`: over `error` / ≥80 `warning` / else `success`, clamp 100%, sort `usage_pct` desc; ẩn section nếu `budgetLines` rỗng)
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- thêm keys `stats.*` (tiêu đề section donut/bar/budget, `stats.uncategorized`="Khác", nhãn spent/budget/remaining, `stats.noExpense`, empty CTA, loadError) vào cả hai file

**Acceptance Criteria:**
- Given user đã login + chọn household + tháng có expense, when mở tab Stats, then thấy donut chi theo category (top-6 + "Khác"), bar chi theo group, và danh sách đối chiếu budget; amounts font mono; skeleton khi đang load.
- Given một budget line `usage_pct >= 100`, when render section budget, then % và progress bar dùng màu `error` và fill clamp 100%; line `usage_pct >= 80` màu `warning`; còn lại `success`.
- Given tháng không có giao dịch (`transactions.length === 0`), when Stats load xong, then hiện `EmptyState` + CTA điều hướng `/quick-add`, không render chart rỗng.
- Given có txn `category === null` hoặc category không thuộc group nào, when aggregate, then khoản đó gộp vào bucket "Khác" ở cả donut và bar (không mất tiền, tổng pct ≈ 100).
- Given đang offline nhưng có cache, when mở Stats, then banner offline + "Số liệu tính đến {time}" hiển thị và chart/budget từ cache vẫn render.
- Given màn Stats, when kéo pull-to-refresh, then cả 3 query refetch và indicator tắt sau khi xong; lỗi giữ data cũ.
- Given locale `en`, when mở Stats, then mọi chuỗi hiển thị tiếng Anh (parity test pass, không hardcode vi).

## Spec Change Log

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 7: (high 0, medium 4, low 3)
- defer: 0
- reject: 7
- addressed_findings:
  - `[medium]` `[patch]` `statsAggregate.ts`: `aggregateByCategory` keyed trên join `tx.category?.id` còn `aggregateByGroup` trên FK `tx.category_id`, và `topNWithOther` push slice "Khác" thứ 2 trùng `OTHER_KEY` → duplicate React key + 2 dòng "Khác" + lệch bucket giữa 2 chart. Sửa: cả hai aggregator key theo FK `tx.category_id`; `topNWithOther` merge tail vào slice OTHER_KEY sẵn có (≤1 slice/key, "Khác" cuối); thêm 2 test.
  - `[medium]` `[patch]` `SpendingDonut.tsx`/`SpendingBar.tsx`: chỉ guard `length===0` → dataset toàn 0 lọt vào chart lib (ring rỗng/NaN bar). Thêm guard `slices.every(s=>s.amount<=0)` → empty note.
  - `[medium]` `[patch]` `stats.tsx` budget: `usage_pct` = Infinity/NaN khi `budget_amount=0` hoặc âm khi refund → "Infinity%"/width lỗi. Sửa: `pct = isFinite? : 0`, text `Math.round(pct)`, width `Math.max(0, Math.min(pct,100))%`, sort finite-safe.
  - `[medium]` `[patch]` `package.json`: gỡ `react-native-linear-gradient` (bare native không dùng — chart dùng màu đặc); chạy `pnpm install`, tsc/vitest vẫn xanh.
  - `[low]` `[patch]` `stats.tsx`: "Số liệu tính đến" chỉ lấy `dataUpdatedAt` của transactions → dùng min các `dataUpdatedAt` khác 0 của tx/cat/dashboard.
  - `[low]` `[patch]` `stats.tsx`: icon loadError luôn là `cloud-offline-outline` kể cả khi online → `alert-circle-outline` khi online, `cloud-offline-outline` khi offline.
  - `[low]` `[patch]` `SpendingBar.tsx`: nhãn group dài (vi) chồng/cắt dưới bar hẹp → truncate 8 ký tự + "…", font axis 9.
- rejected (noise/by-design): `isOutExpense` lọc `direction==="out" && !exclude_from_budget_report` (đúng chủ đích, parity web `SpendingTab` + spec); "Khác" xếp cuối (quy ước donut); khác chữ với `transactions.uncategorized` (đúng ngữ cảnh donut); categories vắng mặt (đã che bởi combined skeleton); a11y label chart (không có AC, scope creep); guard NaN/âm cho `tx.amount` (bất khả đạt theo data contract, đã có guard `total>0`).

## Design Notes

- **Nguồn dữ liệu (không thêm backend):** web derive donut/bar client-side (`SpendingTab.tsx`); mobile mirror — `/api/transactions?month=` (full month, qua `useTransactions`) join `/api/categories` (catalog category→group). Budget compare tái dùng `useDashboard().budgetLines` (đã có ở Home 17.1) để "chung endpoint/hook" theo epic, tránh fetch trùng.
- **Combined query state:** screen orchestrate 3 hook. `isPending` = bất kỳ query pending; `isPaused` = bất kỳ paused (offline no-cache); `dataUpdatedAt` lấy từ `transactions` (primary); `refetch` gọi cả 3; `isRefetching` = OR. Guard cached theo mẫu 17.1: dùng `!transactions` (không `isError`) để cache sống qua refetch fail.
- **Chart lib native:** `react-native-svg` là native module → dev client phải rebuild mới thấy chart trên thiết bị; `tsc`/`vitest` không cần (chỉ cần types sau `pnpm install`). Nếu `gifted-charts` yêu cầu `react-native-linear-gradient` lúc import, đã thêm sẵn.
- **Palette:** không có token categorical sẵn → thêm `chartPalette.ts` (một nơi định nghĩa, component lấy theo `isDark`), giữ nguyên tắc "không hardcode màu trong component".
- Ví dụ threshold (mirror Home): `usageColor = over ? error : pct>=80 ? warning : success`.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile exec vitest run` -- expected: pass toàn bộ, gồm `statsAggregate.test.ts` và `parity.test.ts`
- `pnpm --filter @growbase/mobile exec tsc --noEmit` -- expected: 0 error

**Manual checks (if no CLI):**
- Rebuild dev client (do thêm `react-native-svg`), mở tab Stats: donut theo category + bar theo group + danh sách budget (màu ngưỡng đúng); kéo pull-to-refresh chạy; bật airplane mode thấy banner + "Số liệu tính đến {time}"; đổi locale sang `en` thấy chuỗi tiếng Anh.

## Auto Run Result

Status: done

**Summary:** Story 17.2 — màn Stats (mobile) thay stub `ScreenPlaceholder`: donut chi theo category (top-6 + "Khác"), bar chi theo group, section đối chiếu ngân sách (đã chi / ngân sách / còn lại / % + progress bar màu semantic). Aggregate donut/bar client-side từ `useTransactions` join `useCategories` (pure helpers `statsAggregate.ts` + Vitest); budget compare tái dùng `useDashboard().budgetLines`. Offline banner + "Số liệu tính đến {time}", skeleton, EmptyState + CTA `/quick-add`, pull-to-refresh (refetch cả 3 query). Không thêm backend/`packages/shared`.

**Files changed:**
- `apps/mobile/app/(tabs)/stats.tsx` — thay stub bằng màn Stats read-only (3 hook combined, offline/loading/empty/error, 3 section chart+budget)
- `apps/mobile/src/features/stats/useCategories.ts` — hook mới `/api/categories` (`keys.categories`)
- `apps/mobile/src/features/stats/statsAggregate.ts` — pure helpers `aggregateByCategory`/`aggregateByGroup`/`topNWithOther`
- `apps/mobile/src/features/stats/statsAggregate.test.ts` — 8 unit test (edge matrix + dedupe/parity keying)
- `apps/mobile/src/features/stats/SpendingDonut.tsx` — donut (gifted-charts `PieChart`) + legend
- `apps/mobile/src/features/stats/SpendingBar.tsx` — bar theo group (gifted-charts `BarChart`)
- `apps/mobile/src/lib/theme/chartPalette.ts` — palette categorical light/dark
- `apps/mobile/src/lib/i18n/messages/{vi,en}.ts` — thêm keys `stats.*` (parity OK)
- `apps/mobile/package.json` — thêm `react-native-gifted-charts` + `react-native-svg` (đã gỡ `react-native-linear-gradient` sau review)

**Review findings:** 7 patch đã fix (4 medium: dedupe "Khác"/keying nhất quán, guard chart toàn-0, hardening `usage_pct`, gỡ bare native linear-gradient; 3 low: data-as-of min 3 query, icon lỗi khi online, truncate nhãn bar). 0 defer, 0 intent_gap, 0 bad_spec, 7 reject. Chi tiết ở Review Triage Log.

**Verification:** `pnpm --filter @growbase/mobile exec vitest run` → 22 files / 142 tests pass (gồm `statsAggregate.test.ts` 8, `parity.test.ts` 2). `pnpm --filter @growbase/mobile exec tsc --noEmit` → 0 error. Manual dev-client check chưa chạy (unattended run) — xem Manual checks.

**Follow-up review:** không cần (`followup_review_recommended: false`) — các fix cục bộ, dễ hiểu, verification xanh, không đụng security/API/data.

**Residual risks:** Chart components (`SpendingDonut`/`SpendingBar`) chưa có render test — `apps/mobile` chưa có RN testing-library harness (đã ghi deferred từ 16.x/17.1); mới verify qua tsc + logic thuần. `react-native-svg` là native module → cần rebuild dev client mới thấy chart trên thiết bị.
