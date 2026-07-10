---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 13.1: Badge giai đoạn trên dashboard

Status: done

## Story

As a người dùng mở dashboard hằng ngày,
I want thấy badge giai đoạn hiện tại của gia đình,
So that câu chuyện 3 giai đoạn sống cùng tôi mỗi ngày, không chỉ ở Tada.

**Nguồn:** Epic 13 (`epics-onboarding-v2.md:1075-1081`) · BR-OB-014 · useLivingPlan (Epic 12).

## Acceptance Criteria

1. **Given** dashboard header render
   **When** badge hiện
   **Then** đeo badge "GĐ1 · tháng 2/6" (lớp phủ, trục tháng của dashboard giữ nguyên — BR-OB-014); nguồn duy nhất useLivingPlan (Epic 12)

2. **Given** hộ chưa có đủ dữ liệu (0 income / mới tạo)
   **When** dashboard render
   **Then** badge fallback tử tế (không crash, không số vô nghĩa); i18n vi/en; đọc rõ ở 375px; `tsc` sạch

## Tasks / Subtasks

- [x] Task 1: Component `StageBadge` (AC: 1)
  - [x] `src/components/dashboard/StageBadge.tsx`: gọi `useLivingPlan`; GĐ từ `currentStage(emergencyBalance, plan.emergencyTarget)` (helper 12.2)
  - [x] Text theo GĐ (QUYẾT ĐỊNH D1 — epic viết "tháng 2/6" nhưng living plan không biết "đã ở GĐ bao lâu", chỉ biết CÒN bao lâu; dùng dạng living honest):
    - GĐ1: "GĐ1 · còn ~{{months}} tháng" ({{months}} = `plan.stage1EndMonth`)
    - GĐ2: "GĐ2 · còn ~{{months}} tháng" ({{months}} = `plan.stage2EndMonth`)
    - GĐ3: "GĐ3 · toàn lực cho ước mơ" (không số)
    - stage end null → bỏ số, chỉ "GĐ{n}"
  - [x] Style: pill nhỏ `bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1` (token, đọc rõ 375px, không cần touch), số mono span
- [x] Task 2: Mount + fallback (AC: 1, 2)
  - [x] Mount đầu `DashboardView.tsx` (287 dòng — wrapper space-y-6 dòng 54-60, đặt TRƯỚC MilestoneCelebration, dòng riêng hoặc cạnh greeting — đọc cấu trúc thật chọn chỗ tự nhiên, KHÔNG phá layout)
  - [x] Fallback: `isLoading` → null (không skeleton — badge phụ); `isError` hoặc plan null → null; capacity 0 + emergencyTarget 0 (hộ mới/0 income) → null (ẩn tử tế, không số vô nghĩa) — KHÔNG crash
  - [x] Trục tháng dashboard (month switcher TopHeader) GIỮ NGUYÊN — badge là lớp phủ độc lập tháng browsed
- [x] Task 3: Tests + i18n + verify (AC: 2)
  - [x] Logic chọn text/GĐ nếu tách thuần → test (stage × stageEnd null/0/N); i18n keys `dashboard.stageBadge.*` parity vi == en
  - [x] `npx tsc --noEmit` · `npx vitest run` full · manual trace: hộ seed GĐ1, hộ 0 income → ẩn

## Dev Notes

### Hiện trạng

- `DashboardView.tsx` 287 dòng: wrapper space-y-6 (54-60): MilestoneCelebration → DailyInsightBanner → FirstExpenseCta → InviteCompanionPrompt
- `useLivingPlan` (12.1-12.3): `{ plan, capacityThisMonth, trailingIncome, emergencyBalance, isLoading, isError }`; plan.emergencyTarget = DB target thật (12.3 P3); stage ends living
- `currentStage(emergencyBalance, emergencyTarget)` — `src/lib/utils/currentStage.ts`
- Dashboard đã có nhiều card đầu trang — badge phải NHẸ (1 pill), không thêm card

### Quyết định D1 (flag reviewer)

Epic viết "GĐ1 · tháng 2/6" — cần biết đã-ở-GĐ-bao-lâu (không có trong living plan, không lưu lịch sử stage). Dạng living honest: "còn ~N tháng" từ stage ends hiện tại. Đúng tinh thần BR-OB-014 (số luôn tươi) + tránh lưu thêm state.

### Previous Story Intelligence

- 12.2 FundsPlanStrip đã render GĐ + progress ở Funds — badge dashboard NHẸ hơn (pill 1 dòng), không lặp progress
- Lessons: isError → ẩn (không skeleton vĩnh viễn 12.2 P3); số mono span; parity; token màu

### Project Structure Notes

- Mới: `src/components/dashboard/StageBadge.tsx` (+ helper test nếu tách)
- Sửa: `DashboardView.tsx` (1 dòng mount)
- KHÔNG đụng: TopHeader/month switcher, insight system (13.2 mới đụng), fundPlan/ContributeModal (12.4 đang patch)

### References

- `epics-onboarding-v2.md:1075-1081` (13.1 verbatim) · BR-OB-014
- `12-2-*.md` (currentStage + strip pattern) · `12-3-*.md` (emergencyTarget thật)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 37 files / 506 tests (500 → 506, +6 stageBadge) — verify độc lập · parity 845 == 845

### Completion Notes List

1. `stageBadgeContent` helper thuần (union months/plain/dream) + StageBadge pill; mount con đầu space-y-6 DashboardView (2 dòng); D1 giữ "còn ~N tháng"; guard months ≤ 0 → plain (phòng thủ); fallback ẩn 4 case; số mono qua split {{months}}.

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| stageBadgeContent 6 nhánh (stage × end null/0/N) | Automated (6 tests) | PASS |
| Fallback ẩn: loading/error/plan null/hộ mới | Manual trace — cần browser verify | PASS (trace) |
| Badge độc lập browsed month | Trace (useLivingPlan hid-only key) | PASS |

### File List

- A `src/lib/utils/stageBadge.ts` · A `src/components/dashboard/StageBadge.tsx` · A `src/__tests__/utils/stageBadge.test.ts`
- M `src/components/dashboard/DashboardView.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 11-07-2026 · **Outcome:** Approve — CLEAN (0 findings) · **Layer:** cavecrew-reviewer (diff nhỏ 6 files; stage2 semantics + GĐ3 branch + parity + mount verify OK)

## Change Log

- 11-07-2026: Story 13.1 implemented + reviewed clean — StageBadge pill living (D1 "còn ~N tháng"); 506 tests; status → done.
