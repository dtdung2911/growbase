---
baseline_commit: aaabb040a2808c0479a159b5f7cfbcf9a79b2c7a
---

# Story 6.3: Milestone celebration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a thành viên household có mục tiêu chung,
I want khoảnh khắc chúc mừng khi mục tiêu đạt mốc,
so that cả nhà cùng cảm nhận tiến bộ — tiền để dành có câu chuyện, không chỉ là con số.

## Acceptance Criteria

1. **Given** goal fund vượt mốc 10%, 25%, 50%, 75% hoặc 100% sau một lần góp
   **When** thành viên household mở app (bất kỳ ai — một hoặc nhiều người)
   **Then** khoảnh khắc chúc mừng in-app hiển thị: mốc đạt được + tên goal + câu chúc theo tone đồng hành (FR16)
   **And** mỗi mốc chúc mừng đúng một lần per thành viên — không lặp mỗi lần mở app

2. **Given** trạng thái "đã thấy milestone" cần lưu per user
   **When** review implementation
   **Then** tracking không vi phạm AD-3: household-scoped state clear khi switch household hoặc key theo householdId

3. **Given** một lần góp lớn nhảy qua nhiều mốc (ví dụ 5% → 60%)
   **When** celebration hiển thị
   **Then** chúc mừng mốc cao nhất đạt được, không xếp hàng nhiều popup liên tiếp

4. **Given** `prefers-reduced-motion`
   **When** celebration render
   **Then** hiệu ứng tôn trọng setting (V1-FR10), vẫn hiển thị nội dung chúc mừng tĩnh

## Tasks / Subtasks

- [x] Task 1: Pure logic `resolveMilestoneCelebration` + tests (AC: 1, 2, 3)
  - [x] `src/lib/insight/goalMilestone.ts` (file mới, pure AR5 — không React/localStorage): `type SeenMilestones = Record<string, number>` (fundId → mốc cao nhất đã thấy, 0 = chưa mốc nào)
  - [x] `currentMilestoneTier(fund): number` — mốc CAO NHẤT trong `GOAL_MILESTONES` (từ 6.1) mà `current_balance / target_amount × 100 >= mốc`; 0 nếu chưa đạt mốc nào hoặc `target_amount` null/≤0
  - [x] `resolveMilestoneCelebration(funds: Fund[], seen: SeenMilestones): { celebration: { fundId: string; fundName: string; milestone: number } | null; nextSeen: SeenMilestones }`:
    - Chỉ xét fund `fund_type === "goal"` (AC ghi "goal fund" — `[ASSUMPTION: emergency/sinking không celebrate v1]`), `is_active`, có `target_amount > 0`. KHÔNG cần deadline — milestone chỉ dựa balance/target
    - Fund CHƯA có entry trong `seen` → baseline init: `nextSeen[fundId] = currentTier`, KHÔNG celebrate (chặn chúc mừng backlog khi feature mới ship / lần đầu mở app / device mới)
    - Fund có `seen[fundId] < currentTier` → ứng viên celebrate với mốc `currentTier` (mốc cao nhất — nhảy 5%→60% chúc 50, AC3)
    - Nhiều fund cùng vượt → chọn MỘT: milestone cao nhất, tie → fund đứng trước trong mảng (một popup duy nhất, AC3)
    - `nextSeen` luôn cập nhật mọi fund goal về currentTier (kể cả không celebrate); fund biến mất khỏi danh sách → giữ nguyên entry cũ (vô hại)
  - [x] Tests `src/lib/insight/__tests__/goalMilestone.test.ts`: vượt 1 mốc; nhảy nhiều mốc → mốc cao nhất; baseline init không celebrate; mở app lần 2 cùng seen → null; 2 fund cùng vượt → 1 celebration mốc cao nhất; target null/0 → bỏ qua; balance tụt xuống dưới mốc đã thấy → không celebrate lại và seen KHÔNG hạ xuống (giữ max — rút tiền rồi góp lại không chúc lần 2)
- [x] Task 2: `MilestoneCelebrationDialog` component (AC: 1, 4)
  - [x] `src/components/dashboard/MilestoneCelebrationDialog.tsx` (mới, `"use client"`): dùng shadcn `Dialog` hiện có (`@/components/ui/dialog`), props `{ celebration: { fundName: string; milestone: number } | null; onClose: () => void }` — open khi celebration non-null
  - [x] Nội dung: emoji 🎉 lớn, mốc (`font-mono` %), tên goal, câu chúc i18n tone "cả nhà" đồng hành; mốc 100% dùng câu riêng (về đích). Nút đóng ≥44px `rounded-full`
  - [x] Animation: emoji/scale entrance bằng CSS class có sẵn (`card-enter` pattern trong globals.css) hoặc Tailwind `animate-*` + `motion-reduce:animate-none` — KHÔNG thêm dependency mới (không canvas-confetti). `prefers-reduced-motion` → nội dung tĩnh vẫn đầy đủ (AC4)
  - [x] Style: theo style guide — Dialog content radius 18px nếu override, token colors only, không hardcode hex
- [x] Task 3: Mount vào Dashboard + persistence localStorage (AC: 1, 2)
  - [x] `DashboardView.tsx` (update): thêm `<MilestoneCelebration funds={data.funds} />` (wrapper nhỏ chứa logic) hoặc logic trong component dialog wrapper riêng — pattern useEffect + useState như DailyInsightBanner 6.2 (server render không mở dialog → không hydration mismatch)
  - [x] localStorage key `growbase.goal-milestone-seen.${householdId}` (AD-3 — householdId từ `useAppStore`), value JSON `SeenMilestones`; đọc/ghi try/catch (private mode → coi như seen rỗng nhưng khi đó baseline-init sẽ chặn celebrate — đúng an toàn); guard `!householdId` trong effect
  - [x] Flow effect: đọc seen → `resolveMilestoneCelebration(data.funds, seen)` → luôn persist `nextSeen`; celebration non-null → setState mở dialog (mark-on-show — không lặp mỗi lần mở app, AC1)
  - [x] Dashboard funds select đã có `target_amount, current_balance` (và created_at/target_date từ 6.2) — KHÔNG cần sửa API
- [x] Task 4: i18n + verify flows (AC: 1-4)
  - [x] Keys mới vi+en: `celebration.milestoneTitle` (vd "Cột mốc mới! 🎉"), `celebration.milestoneBody` ("{{goalName}} đã đạt {{milestone}}% chặng đường — cả nhà đang làm rất tốt!"), `celebration.goalCompletedBody` ("{{goalName}} đã về đích! Cả nhà làm được rồi 🎉"), `celebration.close` ("Tuyệt vời")
  - [x] `npx vitest run` full — 0 regression; `npx tsc --noEmit` — 0 lỗi; `npx next build` — pass (build đã xanh sau fix layout.tsx)
  - [x] `### Testing`: (1) resolveMilestoneCelebration automated đủ nhánh; (2) dialog hiển thị + đóng — manual trace; (3) localStorage per-household + baseline init — manual trace + automated logic; (4) reduced-motion — manual trace class `motion-reduce:`; (5) không popup khi mở app lần 2 — automated (seen logic)

## Dev Notes

### Nền tảng từ 6.1 + 6.2 (đều done — dùng, không sửa)

- `GOAL_MILESTONES = [10, 25, 50, 75, 100]` và `crossedMilestone(prev, current)` đã có trong `src/lib/insight/goalProgress.ts`. Story này cần **tier** (mốc cao nhất ≤ ratio) chứ không phải **crossing giữa 2 ratio** — vì persistence lưu "mốc cao nhất đã thấy" chứ không lưu ratio. `crossedMilestone` có thể không dùng đến trong story này (nó phục vụ rule đáng-nói 6.1) — đừng gò ép dùng nếu `currentMilestoneTier` + so sánh seen là đủ.
- Pattern localStorage + useEffect + useState + guard householdId + try/catch: copy y hệt `DailyInsightBanner.tsx` (6.2) — ĐỌC file này trước khi viết wrapper.
- `isGoalNoteworthy({ justCrossedMilestone })` (6.1): dialog celebration là kênh riêng của FR16 — KHÔNG cần nối vào daily insight trong story này (câu goal trong insight đã là 6.2; milestone-vào-insight là tính năng độc lập, không có AC yêu cầu ở 6.3 — bỏ qua, tránh scope creep).

### Baseline-init là quyết định quan trọng nhất

- Lần đầu user mở app sau khi feature ship (hoặc device mới/clear storage): seen rỗng → nếu celebrate ngay theo tier hiện tại sẽ chúc mừng cả mốc đạt từ 3 tháng trước — vô nghĩa. Baseline init: ghi tier hiện tại vào seen, im lặng. Chỉ chúc những mốc vượt SAU thời điểm đó. Trade-off chấp nhận: mốc đạt đúng hôm feature ship sẽ bị nuốt — không sao.
- Hệ quả per-device: localStorage nghĩa là "per thành viên per device". AC nói per thành viên — device mới sẽ baseline-init lặng lẽ (không chúc lại mốc cũ, cũng không chúc thiếu mốc mới sau đó). Đúng tinh thần "không lặp".

### Chỉ dialog, một lần, không hàng đợi

- Một render dashboard tối đa MỘT dialog (AC3). `resolveMilestoneCelebration` trả 1 celebration hoặc null — logic chọn nằm ở pure function, có test, không phải trong component.
- Mark-on-show: persist `nextSeen` ngay trong effect (trước cả khi user đóng dialog) — reload giữa chừng không hiện lại. Nhất quán với lastShown 6.2.

### Dialog + animation hiện trạng

- `src/components/ui/dialog.tsx` (shadcn) đã có — dùng, không tự viết overlay. `alert-dialog` là cho destructive confirm — không dùng ở đây.
- globals.css có sẵn `@keyframes card-enter` (400ms cubic-bezier) — có thể tái dùng class hoặc thêm keyframe scale-pop nhỏ NẾU cần, kèm `@media (prefers-reduced-motion: reduce)` hoặc dùng Tailwind `motion-reduce:animate-none` trên element animate. Nội dung (title/body/nút) không phụ thuộc animation.
- KHÔNG dependency mới. Confetti canvas = new dep = HALT theo workflow — đừng đề xuất.

### DashboardView mount point

- `DashboardView.tsx` render `<DailyInsightBanner data={data}/>` ở đầu (dòng ~41). Mount `<MilestoneCelebration funds={data.funds} />` cạnh đó (trong cùng `space-y-6` div, dialog không chiếm layout). DashboardView là client component (`useTranslation`) — wrapper con `"use client"` bình thường.
- Dashboard funds từ `/api/dashboard` đã select `target_amount, current_balance, created_at, target_date` (sau 6.2) — đủ cho tier math. KHÔNG sửa API.

### Testing — node env, không RTL

- Pure logic (`goalMilestone.ts`) test đầy đủ automated. Dialog/effect wrapper: manual trace (tiền lệ 6.2 đã được review Approve với pattern này). Ghi rõ method trong `### Testing`.

### Project Structure Notes

- File mới: `src/lib/insight/goalMilestone.ts`, `src/lib/insight/__tests__/goalMilestone.test.ts`, `src/components/dashboard/MilestoneCelebrationDialog.tsx` (dialog + wrapper logic cùng file được — 2 component nhỏ 1 file nếu <100 dòng, karpathy)
- File sửa: `src/components/dashboard/DashboardView.tsx` (1 dòng mount), `src/lib/i18n/messages/vi.json` + `en.json` (4 keys `celebration.*`)
- KHÔNG sửa: `goalProgress.ts`, `goalInsight.ts`, `DailyInsightBanner.tsx`, API routes, migrations, store

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 6.3 — ACs, FR16, V1-FR10, AD-3]
- [Source: _bmad-output/implementation-artifacts/6-1-expected-line-narrative-engine.md — GOAL_MILESTONES, crossedMilestone]
- [Source: _bmad-output/implementation-artifacts/6-2-goal-progress-card.md — pattern localStorage/useEffect/householdId guard + review Approve]
- [Source: src/components/dashboard/DailyInsightBanner.tsx — pattern copy trực tiếp]
- [Source: src/components/ui/dialog.tsx — shadcn Dialog có sẵn]
- [Source: src/app/globals.css#387 — keyframes card-enter tái dùng]
- [Source: src/components/dashboard/DashboardView.tsx#~41 — mount point]

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5)

### Debug Log References

- RED xác nhận: `goalMilestone.test.ts` fail trước khi tạo `goalMilestone.ts` → GREEN 8/8
- `npx vitest run` — 377/377 pass (28 files)
- `npx tsc --noEmit` — 0 lỗi
- `npx next build` — Compiled successfully (build xanh sau fix layout.tsx ở 6.2)

### Completion Notes List

- `goalMilestone.ts` (mới, pure AR5): `currentMilestoneTier` (mốc cao nhất ≤ ratio, từ `GOAL_MILESTONES` 6.1) + `resolveMilestoneCelebration(funds, seen)` → 1 celebration duy nhất (mốc cao nhất giữa các fund vượt) + `nextSeen`. Baseline-init: fund chưa có trong seen → ghi tier hiện tại, im lặng (không chúc mốc cũ khi feature mới ship/device mới). Seen giữ max — balance tụt rồi góp lại không chúc lần 2. Chỉ `fund_type === "goal"` + `target_amount > 0`.
- `crossedMilestone` (6.1) không dùng — tier + seen comparison đủ, đúng ghi chú Dev Notes.
- `MilestoneCelebrationDialog.tsx` (mới): wrapper `MilestoneCelebration` (effect đọc localStorage `growbase.goal-milestone-seen.${householdId}` — AD-3, guard `!householdId`, try/catch private mode, mark-on-show persist nextSeen trước khi user đóng) + shadcn Dialog: emoji 🎉 `animate-bounce motion-reduce:animate-none` (AC4 — nội dung tĩnh đầy đủ khi reduced motion), mốc `font-mono text-primary`, câu chúc i18n (mốc 100 câu riêng), nút đóng `min-h-[44px] rounded-full bg-primary hover:brightness-[0.8]`.
- Mount 1 dòng đầu `DashboardView` — dialog không chiếm layout; server render không mở dialog (state khởi tạo null, effect chỉ chạy client) → không hydration mismatch.
- Private mode: readSeen fail → seen rỗng → baseline-init mọi fund → không bao giờ celebrate → an toàn, không spam.
- i18n 4 keys `celebration.*` vi+en, tone "cả nhà" đồng hành.
- Không dependency mới, không sửa API (dashboard select đã đủ cột từ 6.2), không đụng file 6.1/6.2.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Vượt 1 mốc → celebrate đúng mốc; nhảy 5%→60% → chúc mốc cao nhất 50, 1 popup (AC3) | Automated (`goalMilestone.test.ts`) | ✅ Pass |
| 2 | Mỗi mốc chúc đúng 1 lần — mở app lần 2 với seen đã persist → null (AC1) | Automated | ✅ Pass |
| 3 | Baseline-init lần đầu (feature mới/device mới/clear storage) → im lặng, không chúc mốc cũ | Automated | ✅ Pass |
| 4 | 2 fund cùng vượt → 1 celebration mốc cao nhất, seen cả 2 đều cập nhật | Automated | ✅ Pass |
| 5 | Tracking per-household (AD-3): localStorage key chứa householdId, guard null, switch household đọc key khác | Manual trace wrapper effect | ✅ Pass |
| 6 | Dialog hiển thị mốc + tên goal + câu chúc, đóng được, nút ≥44px | Manual trace component + i18n keys tồn tại vi/en | ✅ Pass (cần xác nhận mắt trên browser) |
| 7 | `prefers-reduced-motion` → `motion-reduce:animate-none` trên emoji, title/body/nút tĩnh không phụ thuộc animation (AC4) | Manual trace classes | ✅ Pass |
| 8 | Balance tụt dưới mốc đã thấy → không celebrate lại, seen không hạ | Automated | ✅ Pass |

### File List

- `src/lib/insight/goalMilestone.ts` (new)
- `src/lib/insight/__tests__/goalMilestone.test.ts` (new)
- `src/components/dashboard/MilestoneCelebrationDialog.tsx` (new)
- `src/components/dashboard/DashboardView.tsx` (updated — import + mount 1 dòng)
- `src/lib/i18n/messages/vi.json` (updated — 4 keys celebration.*)
- `src/lib/i18n/messages/en.json` (updated — 4 keys celebration.*)

## Change Log

- 2026-07-05: Milestone celebration (FR16): pure resolver với baseline-init + seen-max, dialog 🎉 reduced-motion-safe, localStorage per-household (AD-3). 8 tests mới, 377/377 pass, build xanh. Status → review.

## Senior Developer Review (AI)

**Reviewer:** claude-haiku-4-5
**Date:** 2026-07-05
**Outcome:** ✅ Approved

### AC Verification

1. **AC1 (Celebration display + single-show-per-member):** PASS
   - `goalMilestone.ts:45–47`: correct logic — celebrate only when `tier > seenTier`, ensuring each milestone celebrates exactly once per household
   - `MilestoneCelebrationDialog.tsx:46–49`: celebration renders milestone % + fundName + i18n copy (2 variants: 100% vs. milestone)
   - `currentMilestoneTier()`: correctly finds highest milestone in GOAL_MILESTONES [10,25,50,75,100] matching fund progress

2. **AC2 (AD-3 — household-scoped state, switch-safe):** PASS
   - `MilestoneCelebrationDialog.tsx:30`: storageKey computed as `growbase.goal-milestone-seen.${householdId}` — household-scoped ✓
   - Line 33: guard `if (!householdId) return` prevents null key issues ✓
   - Switch household → storageKey changes → localStorage.getItem(storageKey) reads new household's seen data (old state not leaked) ✓

3. **AC3 (Multiple milestone jumps → highest only, single popup):** PASS
   - `goalMilestone.ts:45`: loop compares milestone values, overwrites celebration only if `tier > celebration.milestone`
   - Test case (line 68–76): 2 funds crossing (f1→25%, f2→75%) → celebration{f2, 75} (highest wins) ✓
   - Private mode fallback: localStorage.setItem() catch → no nextSeen persist → baseline-init each launch → safe

4. **AC4 (prefers-reduced-motion respect):** PASS
   - `MilestoneCelebrationDialog.tsx:54`: emoji div has `motion-reduce:animate-none` + `aria-hidden` ✓
   - Content (DialogTitle, milestone %, body copy, close button) always visible — motion disabled, not hidden ✓

### Code Quality Checks

- **Pure resolver pattern (AR5):** `goalMilestone.ts` is stateless, testable, no React/storage — correct ✓
- **Baseline-init safety:** Fund new to `seen` → `nextSeen[fundId] = tier, continue` (test 53–60) — prevents old backlog/day-one false celebrates ✓
- **Max-retention (no downgrade):** Line 43: `nextSeen[fundId] = Math.max(seenTier, tier)` — balance decrease won't celebrate again ✓
- **i18n coverage:** 4 keys added (celebration.milestoneTitle, milestoneBody, goalCompletedBody, close) in both vi.json + en.json ✓
- **Dialog a11y:** DialogTitle + DialogDescription present, Dialog wrapper correct (shadcn pattern) ✓
- **Style tokens:** font-mono + tabular-nums for amounts ✓, rounded-full button ✓, min-h-[44px] ✓, hover:brightness-[0.8] ✓, no hardcoded hex colors ✓
- **Hydration-safe:** Component initial state = null, celebration set only in useEffect → server renders null (no dialog) ✓

### Test Results

- `vitest run`: 8 tests in `goalMilestone.test.ts` pass ✓ (377/377 overall pass)
- `npx tsc --noEmit`: 0 TypeScript errors ✓
- `npx next build`: success ✓

### Files Reviewed

- ✅ `src/lib/insight/goalMilestone.ts` (new — pure resolver, 52 LOC)
- ✅ `src/lib/insight/__tests__/goalMilestone.test.ts` (new — 8 comprehensive tests)
- ✅ `src/components/dashboard/MilestoneCelebrationDialog.tsx` (new — 75 LOC, Dialog wrapper)
- ✅ `src/components/dashboard/DashboardView.tsx` (import + mount, 1 line change)
- ✅ `src/lib/i18n/messages/vi.json` (4 celebration.* keys added)
- ✅ `src/lib/i18n/messages/en.json` (4 celebration.* keys added)

### No Issues Found

Story implementation is production-ready. All ACs verified, tests pass, no code or architecture concerns identified.
