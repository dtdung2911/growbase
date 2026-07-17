---
title: 'Story 17.3: Xem quỹ (funds) — mobile'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_revision: '63ac4b2d8df51852f607f86c28c6e81a923a830c'
final_revision: '29c003cbceb6a57c382548a9a7de2121ec27b436'
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-17-context.md'
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** App mobile (RN companion) chưa có màn xem quỹ. Người dùng cần xem 5 loại quỹ (emergency/sinking/goal/investment/freedom) với số dư và trạng thái, gom nhóm theo loại — read-only, không góp/rút (web-only v1).

**Approach:** Thêm route `app/funds.tsx` (push full-screen từ Menu → Funds), hook `useFunds` đọc `GET /api/funds` (đã hỗ trợ Bearer, trả `Fund[]` active). Tách 2 hàm thuần `groupFunds` + `deriveFundStatus` để gom nhóm + suy ra tiến độ/trạng thái, unit-test riêng. UI tái dùng pattern màn Stats (offline banner inline, Skeleton, EmptyState, RefreshControl, số mono).

## Boundaries & Constraints

**Always:**
- Đọc dữ liệu qua `apiFetch<Fund[]>("/api/funds")` từ `@/api/client`; KHÔNG query Supabase trực tiếp từ client.
- Query key bắt buộc qua factory: `keys.funds(householdId)` từ `@growbase/shared/queryKeys`. `householdId`/`user`/`isLocked` lấy từ `useAppStore`; `enabled: !!user && !!householdId && !isLocked`.
- Types dùng chung: `Fund`, `FundType`, `FUND_TYPE_CONFIG` từ `@growbase/shared/types/app`. Tiền định dạng qua `formatVND`/`formatVNDCompact` (`@growbase/shared/rules/currency`), hiển thị font mono + `fontVariant:["tabular-nums"]`.
- Nhóm hiển thị theo thứ tự cố định: emergency → sinking → goal → investment → freedom; nhóm rỗng bị bỏ. Quỹ goal sắp theo `priority_rank` asc (null cuối) rồi `created_at` rồi `id`; các loại khác giữ thứ tự API (priority, sort_order).
- Tiến độ goal suy ra qua `computeGoalProgress(goalProgressInputFromFund(fund))` (`@growbase/shared/rules/goalProgress`) — không tự viết lại công thức.
- Mọi chuỗi qua `t()`; thêm key vào cả `vi.ts` và `en.ts` (parity.test bắt buộc trùng key set). Màu qua theme tokens (`useTheme().colors`) + `FUND_TYPE_CONFIG.color/bgColor`, không hardcode.
- Loading = Skeleton (không spinner toàn màn). Rỗng = EmptyState. Offline = banner inline + chỉ báo "Số liệu tính đến {time}" (theo pattern stats.tsx). Có RefreshControl (pull-to-refresh).

**Block If:**
- `GET /api/funds` KHÔNG chấp nhận Bearer token qua `withAuth()` (đáng ra Epic 14 đã lo) → không có endpoint đọc funds cho mobile.
- Thiếu `keys.funds`, `Fund`/`FundType`/`FUND_TYPE_CONFIG`, hoặc `computeGoalProgress`/`goalProgressInputFromFund` trong `@growbase/shared` (khác với khảo sát).

**Never:**
- Không góp/rút/release/reset quỹ; không port `ContributeModal`/`WithdrawModal`/action buttons/mutation hooks/`Idempotency-Key`.
- Không thêm backend/API contract mới; không đụng offline queue (chỉ dành cho transaction CRUD).
- Không chuyển `menu.tsx` thành thư mục; không tạo màn chi tiết quỹ (ngoài scope 17.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy — có quỹ đủ loại | `Fund[]` gồm nhiều loại | `groupFunds` trả các nhóm đúng thứ tự cố định, mỗi nhóm có funds đã sort | No error |
| Nhóm rỗng | không có quỹ loại `investment` | Nhóm `investment` bị loại khỏi kết quả | No error |
| Sort goal | 2 goal `priority_rank`=null & =1 | goal `priority_rank`=1 đứng trước, null xuống cuối | No error |
| Status có target | fund `target_amount`>0 | `deriveFundStatus` trả `progressPct` = clamp(balance/target*100, 0..100), `targetAmount` | No error |
| Status không target | `target_amount` null/0 | `progressPct`=null (chỉ hiện số dư) | Không chia cho 0 |
| Status goal | fund_type=goal có target | dùng `computeGoalProgress`, trả progressPct từ đó | No error |
| Không quỹ nào | `Fund[]` rỗng | Màn hiện EmptyState (title + message), không crash | No error |
| Offline có cache | query `isPaused`, có `dataUpdatedAt` | Hiện banner offline + "Số liệu tính đến {time}", vẫn render funds cached | Giữ cache |
| Lỗi tải (online) | apiFetch throw `ApiError` | Giữ màn + `toast.error` 5s (hoặc EmptyState lỗi theo pattern) | Không crash |

</intent-contract>

## Code Map

- `apps/mobile/app/funds.tsx` -- MỚI: màn Funds full-screen (header back, ScrollView + RefreshControl, offline banner, Skeleton, EmptyState, render nhóm). Copy scaffold từ `app/(tabs)/stats.tsx`.
- `apps/mobile/app/(tabs)/menu.tsx` -- SỬA: thêm row "Funds" → `router.push("/funds")` (import `router` từ `expo-router`).
- `apps/mobile/src/features/funds/useFunds.ts` -- MỚI: hook `useQuery` đọc `/api/funds`, mirror `src/features/dashboard/useDashboard.ts`.
- `apps/mobile/src/features/funds/fundsGroup.ts` -- MỚI: hàm thuần `groupFunds(funds)` + `deriveFundStatus(fund)` + hằng `FUND_GROUP_ORDER` + map Ionicons theo `FundType`.
- `apps/mobile/src/features/funds/fundsGroup.test.ts` -- MỚI: unit test cho I/O Matrix (grouping, empty-drop, sort goal, progress có/không target, chia-0).
- `apps/mobile/src/lib/i18n/messages/vi.ts` & `en.ts` -- SỬA: thêm key `menu.funds`, `funds.title`, `funds.group.*` (5 loại), `funds.empty.title/message`, `funds.loadError`, `funds.of` (progress "x / y"). Giữ parity.
- `packages/shared/src/types/app.ts` -- ĐỌC: `Fund`, `FundType`, `FUND_TYPE_CONFIG` (color/bgColor/label/labelEn).
- `packages/shared/src/rules/goalProgress.ts` -- ĐỌC: `computeGoalProgress`, `goalProgressInputFromFund`.
- `apps/web/src/app/api/funds/route.ts` -- ĐỌC: contract GET (Bearer + `Fund[]` active, order priority/sort_order).
- `apps/web/src/components/funds/FundList.tsx` & `FundCard.tsx` -- THAM CHIẾU: thứ tự nhóm + cách suy status (không copy phần mutation/modal).

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/src/features/funds/fundsGroup.ts` -- viết `FUND_GROUP_ORDER`, `groupFunds`, `deriveFundStatus`, `fundIconFor(type)` (Ionicons) -- tách logic thuần khỏi UI để test được.
- [x] `apps/mobile/src/features/funds/fundsGroup.test.ts` -- unit-test các case trong I/O Matrix -- đảm bảo grouping/sort/progress đúng, không chia-0.
- [x] `apps/mobile/src/features/funds/useFunds.ts` -- hook đọc `/api/funds` qua `apiFetch` + `keys.funds` + store guards -- nguồn dữ liệu màn.
- [x] `apps/mobile/app/funds.tsx` -- màn list gom nhóm, số dư mono, progress bar/label theo `deriveFundStatus`, offline banner + Skeleton + EmptyState + RefreshControl -- màn chính.
- [x] `apps/mobile/app/(tabs)/menu.tsx` -- thêm row Funds điều hướng `/funds` -- điểm vào theo AC "Menu → Funds".
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- thêm key funds.* / menu.funds (parity) -- không hardcode chuỗi.

**Acceptance Criteria:**
- Given user đã đăng nhập có household, when mở Menu và chạm "Funds", then push sang màn Funds hiển thị các quỹ active gom theo 5 loại đúng thứ tự cố định (nhóm rỗng ẩn).
- Given màn Funds đang tải lần đầu, when chưa có data, then hiện Skeleton (không spinner toàn màn); khi có data thì mỗi quỹ hiện tên, icon+màu theo loại, số dư font mono, và trạng thái/tiến độ (progress khi có target).
- Given household không có quỹ nào, when data rỗng, then hiện EmptyState với title + message, không crash.
- Given thiết bị offline nhưng có cache, when mở màn, then hiện banner offline + "Số liệu tính đến {time}" và vẫn render quỹ từ cache; pull-to-refresh khả dụng khi online.
- Given `pnpm --filter @growbase/mobile test`, when chạy, then `fundsGroup.test.ts` pass và `parity.test.ts` vẫn pass (vi/en trùng key).

## Review Triage Log

### 2026-07-18 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 3: (high 0, medium 1, low 2)
- defer: 5: (high 0, medium 3, low 2)
- reject: 6: (high 0, medium 0, low 6)
- addressed_findings:
  - `[medium]` `[patch]` Icon chip used hardcoded light pastel `FUND_TYPE_CONFIG.bgColor` (not theme-aware, poor on dark card) → switched to `${config.color}22` (color at ~13% alpha) — works in both themes.
  - `[low]` `[patch]` Pull-to-refresh passed raw `query.refetch` (floating promise, inconsistent with stats.tsx) → wrapped in `() => { query.refetch() }`.
  - `[low]` `[patch]` Redundant array spread before `.sort()` in `groupFunds` (`[...funds.filter(...)]`) → dropped spread (`filter()` already returns a fresh array).

## Design Notes

- `deriveFundStatus(fund)` trả tối thiểu `{ progressPct: number|null, targetAmount: number|null }`. Với `fund_type==="goal"` dùng `computeGoalProgress(goalProgressInputFromFund(fund))` lấy phần trăm; loại khác: `target_amount>0 ? clamp(current_balance/target_amount*100,0,100) : null`. Không suy diễn thêm badge phức tạp (urgent/months-to-target) ở v1 — giữ read-only tối giản; chỉ khi có `progressPct` mới vẽ progress bar.
- `fundIconFor(type)` map sang Ionicons (`@expo/vector-icons`) vì `FUND_TYPE_CONFIG.icon` là tên lucide/iconify của web: emergency→`shield`, sinking→`wallet`, goal→`flag`, investment→`trending-up`, freedom→`sparkles`. Màu/bgColor/label lấy trực tiếp từ `FUND_TYPE_CONFIG` (label theo locale: `labelEn` khi `en`, `label` khi `vi`) — nhưng ưu tiên key i18n `funds.group.*` cho tiêu đề nhóm để nhất quán catalog.
- Offline banner + "cập nhật lúc": copy nguyên style/logic từ `app/(tabs)/stats.tsx` (`useIsOnline` + `isPaused` + `dataUpdatedAt`).

## Auto Run Result

Status: done

**Tóm tắt:** Thêm màn xem quỹ read-only cho app mobile — Menu → Funds mở màn full-screen list 5 loại quỹ (emergency/sinking/goal/investment/freedom) gom nhóm theo thứ tự cố định, hiển thị số dư (mono) + progress bar khi có target; tái dùng pattern offline banner / Skeleton / EmptyState / RefreshControl từ màn Stats. Đọc qua `GET /api/funds` (Bearer), không mutation.

**Files thay đổi:**
- `apps/mobile/src/features/funds/fundsGroup.ts` — MỚI: `FUND_GROUP_ORDER`, `groupFunds` (thứ tự cố định, bỏ nhóm rỗng, goal sort `priority_rank`), `deriveFundStatus` (goal qua `computeGoalProgress`, khác dùng balance/target, chặn chia-0), `fundIconFor` (Ionicons).
- `apps/mobile/src/features/funds/fundsGroup.test.ts` — MỚI: 9 test Vitest phủ I/O & Edge-Case Matrix.
- `apps/mobile/src/features/funds/useFunds.ts` — MỚI: hook `useQuery` đọc `/api/funds` (mirror `useDashboard`).
- `apps/mobile/app/funds.tsx` — MỚI: màn Funds (header back, offline banner + "Số liệu tính đến {time}", Skeleton, EmptyState empty/error, RefreshControl, card nhóm, progress bar).
- `apps/mobile/app/(tabs)/menu.tsx` — SỬA: thêm row "Funds" → `router.push("/funds")`.
- `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` — SỬA: thêm key funds.* / menu.funds (parity giữ nguyên).

**Review findings breakdown:** patch 3 (đã áp dụng: chip bg theme-aware, wrap refetch tránh floating promise, bỏ spread thừa) · defer 5 (freedom no-progress-bar theo spec v1, goal order vs web, offline copy app-wide, infinite-skeleton khi query disabled app-wide, refetch-error-stale no-cue app-wide — ghi vào `deferred-work.md`) · reject 6 (icon map platform-diff, dynamic i18n key có union+parity, DRY scope-creep, a11y không baseline, unknown-type union cố định, clamp NaN over-defensive) · intent_gap 0 · bad_spec 0.

**Follow-up review:** không cần (`false`) — chỉ 3 patch cục bộ, hệ quả thấp, không đụng behavior/API/data/security.

**Verification:**
- `pnpm --filter @growbase/mobile test` → 23 files / 151 tests passed (gồm `fundsGroup.test.ts` 9 + `parity.test.ts`), chạy lại sau patch vẫn xanh.
- `pnpm exec tsc --noEmit` (apps/mobile) → exit 0, không lỗi.

**Rủi ro còn lại:** freedom/emergency-by-months không có progress bar (chủ ý v1, đã defer); thứ tự goal khác web (đã defer); offline copy + infinite-skeleton là pattern app-wide (đã defer để sửa đồng loạt).
