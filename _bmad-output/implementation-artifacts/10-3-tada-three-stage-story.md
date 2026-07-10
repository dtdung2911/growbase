---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 10.3: Tada kể chuyện 3 giai đoạn + attribution

Status: done

## Story

As a người dùng hoàn thành setup,
I want Tada kể kế hoạch 3 giai đoạn bằng 1 dòng đơn giản với số per-fund từ engine và nguồn phương pháp,
So that tôi tin kế hoạch và muốn kể ngay cho vợ/chồng.

**Nguồn:** Epic 10 — Money Model v2 (`epics-onboarding-v2.md:927-940`) · BR-OB-009, BR-OB-010, BR-OB-013 (attribution) · PRD addendum "Tada = kế-hoạch-là-thành-tựu".

## Acceptance Criteria

1. **Given** Tada render sau onboarding
   **When** hiển thị
   **Then** 1 dòng tóm tắt 3 giai đoạn + số góp/tháng per-fund + tổng từ engine (reuse UI Epic 9); dòng attribution (CSP/Sethi · debt bucket 70/20/10 Clason · emergency CFPB); câu chuyện khép 100% thu nhập; invite companion giữ sau reveal; i18n vi/en; vitest pass

## Tasks / Subtasks

- [x] Task 1: Dòng tóm tắt 3 giai đoạn trong TadaStep (AC: 1)
  - [x] Từ `livePlan` (đã có client-side): `stage1EndMonth`, `stage2EndMonth` → 1 dòng i18n dạng "GĐ1 an toàn {m1} tháng đầu → GĐ2 vừa an toàn vừa mơ → GĐ3 toàn lực cho ước mơ" (văn phong ngắn, warm — xem §Voice; số tháng interpolate; stage đã xong/không xảy ra → nhánh text phù hợp, xem §Edge)
  - [x] Đặt trong stage reveal "feasibility" hiện tại (sau tổng góp/capacity) — GIỮ cấu trúc 4-stage + animation + reduced-motion nguyên vẹn
- [x] Task 2: Câu chuyện khép 100% thu nhập (AC: 1)
  - [x] Stage "budget" (CSP bar) hiện có: kiểm tra bar + labels thể hiện đủ 4 bucket khép 100% (53 cố định / 24 linh hoạt / 15 tiết kiệm-đầu tư / 8 nợ — derive từ BUDGET_TEMPLATE, không hardcode)
  - [x] Nối narrative: dòng capacity 15% (đã có từ 10.1 P1) phải nói rõ "15% này chia cho các quỹ bên dưới" — không còn số nào lơ lửng ngoài bức tranh 100%
- [x] Task 3: Dòng attribution (AC: 1)
  - [x] 1 dòng nhỏ (text-xs muted) cuối Tada trước CTA: "Phương pháp: Conscious Spending Plan (Ramit Sethi) · quỹ nợ theo 70/20/10 (Clason) · quỹ khẩn cấp theo CFPB" — i18n vi/en, KHÔNG link ngoài
- [x] Task 4: Cleanup response payload thừa (AC: 1 — trả deferred item 10-1)
  - [x] TadaStep đã tự recompute qua livePlan → xóa `funds[].monthlyAmount`, `funds[].timelineMonths`, `plan` khỏi response `route.ts` + types `useCompleteOnboardingV2.ts` NẾU sau Tasks 1-3 vẫn không consumer nào đọc (grep trước khi xóa; route vẫn dùng engine nội bộ cho `target_date` — GIỮ engine call)
  - [x] Nếu Task 1 quyết định dùng server plan thay livePlan → GIỮ fields, xóa recompute client — chọn MỘT nguồn, không giữ hai
- [x] Task 5: Invite companion + verify (AC: 1)
  - [x] Verify invite companion prompt (story 7-2) vẫn xuất hiện sau reveal — đọc flow hiện tại trước khi sửa TadaStep, không phá
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass · i18n parity vi == en · manual trace: onboarding end-to-end + reveal 4 stage + adjust + invite prompt

## Dev Notes

### Voice (PRD addendum + BR-OB-012 tinh thần)

- Tada = "kế hoạch xịn trong vài phút" — celebrate kế hoạch, KHÔNG đổ chi tiết %. Chi tiết công thức/tỷ trọng → màn "kế hoạch chi tiết" (story 11.3).
- 1 dòng 3 giai đoạn = câu chuyện, không phải bảng số. Tối đa ~2 dòng text mobile 375px.
- Attribution = tăng trust ("nguồn phương pháp"), giọng khiêm tốn, không phải marketing.

### Edge cases dòng 3 giai đoạn

- `stage1EndMonth === null` (emergency không bao giờ đạt 1 tháng — capacity quá nhỏ): khó xảy ra qua schema income min 100k, nhưng nhánh text fallback: bỏ số tháng, chỉ kể thứ tự giai đoạn.
- `stage2EndMonth === null` nhưng stage1 xong: kể GĐ1 + "GĐ2 đang tiếp tục".
- 0 goals (user skip): GĐ3 không có gì — dòng kể GĐ1/GĐ2 emergency-only, không nhắc "ước mơ" rỗng.
- `stage1EndMonth === 0` / `stage2EndMonth === 0` (emergency đầy sẵn — không xảy ra onboarding vì balance 0, nhưng engine cho phép): text "đã sẵn sàng từ đầu".

### Hiện trạng TadaStep (sau 10.1 + review P1/P2)

- 4-stage reveal: "budget" → "goal" → "feasibility" → "todayRemaining", STAGE_DELAY_MS 550, reduced-motion render ngay — GIỮ NGUYÊN
- `livePlan = calculateAllocationPlan({ monthlyIncome, goals: engineGoals })` client-side — nguồn số hiện tại cho per-fund + tổng
- Per-fund: "Góp trung bình ~{{amount}}/tháng" (`monthlyAmount` avg, null → `fundTimelineNever`) + timeline; tổng = `plan.capacityMonthly` + dòng `capacitySource` 15%
- Adjust flow: chỉnh targetAmount → re-run engine → PATCH mọi goal fund target_date (review P2, `goalFundUpdates` + useMutation inline)
- Guards giữ: match by id, không adjust emergency, 409 CTA resetOnboarding, RPC validation
- i18n keys: `setupV2.tada.*` — fundMonthly, fundTimeline, fundTimelineNever ({{max}}), capacitySource, feasibleTitle, noAdjustHint

### Invite companion (story 7-2 — ĐỌC trước khi sửa)

Meaningful-moment invite prompt xuất hiện sau reveal — tìm trong TadaStep hoặc component/hook riêng (`grep -rn "invite" src/components/onboarding/ src/lib/hooks/`), xác nhận vị trí render + trigger, và verify không bị đẩy xuống/che bởi content mới (dòng 3 giai đoạn + attribution thêm chiều cao — check mobile 375px pb-16).

### Response cleanup (Task 4 — deferred 10-1)

`deferred-work.md` §10-1: "Response `plan` + `funds[].monthlyAmount/timelineMonths` server-side chưa consumer nào đọc — story 10-3 tiêu thụ cho storytelling; nếu 10-3 không dùng thì xóa." Khuyến nghị: dùng livePlan client (nhất quán với adjust flow re-run), xóa fields thừa khỏi response — 1 nguồn số duy nhất phía client, engine server chỉ phục vụ `target_date`. Đổi types hook + route, tsc sẽ bắt hết chỗ lệch.

### Attribution — nguồn chuẩn (BR-OB-013 + research-frameworks.md)

- CSP (Ramit Sethi) — numeric fit 53/24/15/8
- 70/20/10 (George S. Clason, The Richest Man in Babylon 1926) — debt bucket structural fit
- Emergency 3-6 tháng expenses — CFPB (+ CFP Board/Vanguard/Fidelity, chỉ cần ghi CFPB cho gọn)
- BR-OB-013 disclaimer "tham khảo ≠ tư vấn đầu tư" là cho lãi kép (Epic 11.2) — KHÔNG cần ở 10.3 vì chưa hiện số lãi kép

### Previous Story Intelligence

- 10.1: engine API + monthlyAmount avg semantic; review P1 đổi semantic hiển thị — mọi số mới thêm phải cùng semantic
- 10.2: LONG_TIMELINE_MONTHS = 120 threshold BR-OB-012; suggest keys `setupV2.goal.*`; văn phong "Góp trung bình ~X/tháng · xong khoảng N tháng"
- Review 10.2 defer: font-mono cả câu là sai style (chỉ amount mono) — 10.3 thêm text mới ĐÚNG chuẩn ngay: prose thường, số bọc span font-mono tabular-nums
- Lesson 9.1: label semantic per-fund vs tổng — mỗi key i18n mới verify nghĩa
- Working tree có diff 10.1 + 10.2 chưa commit — 10.3 đụng TadaStep (10.1 đã sửa), route.ts, useCompleteOnboardingV2, i18n jsons: cùng files, sửa tiếp trên bản working tree

### Project Structure Notes

- Tuân `project-context.md`: i18n t(), không hardcode màu, strict TS
- Tests: nếu thêm logic thuần (format dòng 3 giai đoạn) → test trong file test hiện có; UI reveal = manual trace
- KHÔNG migration DB, KHÔNG đụng engine

### References

- `epics-onboarding-v2.md:927-940` (story 10.3 verbatim)
- `_bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/addendum.md:37-47` (Tada = kế-hoạch-là-thành-tựu)
- `_bmad-output/brainstorming/brainstorm-money-model-fund-engine-2026-07-09/research-frameworks.md` (attribution)
- `_bmad-output/implementation-artifacts/10-1-allocation-engine-3-stages.md` + `10-2-goalstep-live-suggest.md` (engine + review learnings)
- `_bmad-output/implementation-artifacts/7-2-meaningful-moment-invite-prompt.md` (invite flow)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` → exit 0 (verify độc lập main thread)
- `npx vitest run` → 31 files / 422 tests pass (không đổi — story UI + cleanup, không logic thuần mới)
- i18n parity: setupV2 vi 94 == en 94, full-file 0 lệch; placeholder `{{months}}` khớp 2 locale
- Grep sau cleanup: `AllocationPlanSummary` / response `.plan` / `f.monthlyAmount|timelineMonths` reads → 0

### Completion Notes List

1. **Task 1** — Dòng 3 giai đoạn trong stage "feasibility" (sau capacity, trước mentalAccounting), helper `ThreeStageLine`; nguồn số = `livePlan.stage1EndMonth`; 6 nhánh edge (null/0/bình thường × có goals/emergency-only); 4-stage + animation + reduced-motion giữ nguyên.
2. **Task 2** — CSP bar đã derive 100% từ BUDGET_TEMPLATE (53/24/15/8, verify không hardcode); `capacitySource` nối thêm "chia cho các quỹ bên dưới".
3. **Task 3** — `setupV2.tada.attribution` text-xs muted trước TadaFinishButton, chỉ render khi đủ 4 stage: CSP (Ramit Sethi) · nợ 70/20/10 (Clason) · khẩn cấp CFPB.
4. **Task 4** — Response cleanup: xóa `funds[].monthlyAmount/timelineMonths` + `plan` + type `AllocationPlanSummary` (grep 0 consumer trước khi xóa); MỘT nguồn số = livePlan client; route giữ engine nội bộ cho target_date; xóa `emergencyAlloc` dead code.
5. **Task 5** — Invite companion (7-2) ở `DashboardView`/`InviteCompanionPrompt` (route khác, trigger ≥5/7 ngày active) — không đụng, verify qua git diff; Tada shell `pb-28` đủ chỗ mobile 375px.
6. **Quyết định tự đưa (flag reviewer):** chỉ surface số tháng GĐ1 (stage2End không hiện — giữ voice 1 dòng, GĐ2/GĐ3 là mô tả); tách template trên `{{months}}` để số vào `<span font-mono tabular-nums>`, câu prose thường (đúng chuẩn flag 10.2); attribution prose thường không mono (nhãn phương pháp, không phải amount).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Dòng 3 giai đoạn đúng nhánh: có/không goals, stage1End null/0/N | Manual trace 6 nhánh `ThreeStageLine` — **cần browser verify** | PASS (trace) |
| Câu chuyện khép 100%: CSP bar 53/24/15/8 + capacity 15% nối quỹ | Manual trace + verify derive từ BUDGET_TEMPLATE | PASS |
| Attribution hiện sau đủ 4 stage reveal, trước CTA | Manual trace — **cần browser verify** | PASS (trace) |
| Response cleanup không vỡ consumer (1 nguồn số livePlan) | Automated (tsc strict) + grep 0 reads | PASS |
| Onboarding end-to-end + adjust flow sau cleanup | Automated (422 tests) + manual trace route/TadaStep | PASS |
| Invite companion prompt (7-2) không bị ảnh hưởng | git diff xác nhận không đụng dashboard files | PASS |

### File List

- M `src/components/onboarding/v2/TadaStep.tsx`
- M `src/app/api/onboarding/complete/route.ts`
- M `src/lib/hooks/useCompleteOnboardingV2.ts`
- M `src/lib/i18n/messages/vi.json`
- M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 6 patches) · **Layers:** Blind Hunter + Edge/Acceptance combined (2 agents song song, cả 2 xong)

**Verdicts:** AC1 PASS toàn bộ (auditor verify độc lập từng item: 3 giai đoạn, attribution, khép 100%, invite giữ, i18n, vitest) · Dev Record claims reproduce đầy đủ · Deviation stage2 ẩn: ACCEPT (AC đòi tóm tắt, không đòi số per-stage; voice cấm đổ số).

### Action Items

- [x] [MED][blind] Adjust input Tada thiếu min 100k (goalSchema có, fund PATCH schema không) — re-type "20" → target 20đ vào DB. **P1:** `belowMinTarget` → hint destructive + disable finish + guard handleClick (2 lớp). Key `setupV2.tada.minTargetHint`.
- [x] [LOW][blind] Per-fund avg không cộng = tổng capacity (khác horizon) — mâu thuẫn arithmetic màn flagship. **P2:** copy `totalMonthly` → "Mỗi tháng bạn để dành ~{{amount}}" (semantic capacity, không phải tổng phép cộng).
- [x] [LOW][edge] `capacitySource` "bên dưới" sai hướng (funds render trên). **P3:** trung tính "chia cho các quỹ của bạn".
- [x] [LOW][edge] `withGoals` ~130 chars → 3-4 dòng mobile. **P4:** rút vi 88 / en 80 chars, giữ 3 giai đoạn + {{months}}.
- [x] [LOW][blind] Dead key `budgetDesc` 2 locale. **P5:** xóa.
- [x] [test-gap][edge] 6 nhánh ThreeStageLine inline không test. **P6:** extract `pickThreeStageKey(stage1EndMonth, hasGoals)` vào `tadaReveal.ts` (file có sẵn) + tests 6 nhánh.

### Deferred / Info

- [Review][Defer] TadaPending rotation không bao giờ advance (`revealed.length` luôn 0 lúc pending) — pre-existing Epic 8/9, 3 pending strings unreachable.
- [Review][Info] `stage2EndMonth` sau deviation không consumer nào ngoài engine/tests — giữ (engine surface 10.1), story 11.3 màn chi tiết có thể dùng.
- [Review][Insight] `stage1EndMonth` với input onboarding LUÔN = 6 (ceil(81/15), income-independent) — số "cá nhân hóa" GĐ1 thực chất là hằng số. Không phải bug 10.3 (bản chất model BR-OB-009/010), lưu ý cho product copy sau.

### Verification sau patch (main thread, độc lập)

`npx tsc --noEmit` exit 0 · `npx vitest run` **31 files / 425 tests pass** (422 → 425, +3 tests pickThreeStageKey) · i18n parity setupV2 94 == 94.

## Change Log

- 10-07-2026: Story 10.3 implemented — Tada 3 giai đoạn 1 dòng (ThreeStageLine 6 nhánh), attribution CSP/Clason/CFPB, capacity nối quỹ, response cleanup 1 nguồn số livePlan; 422 tests pass; status → review.
- 10-07-2026: Code review (3 layers/2 agents) — 6 action items resolved (MED min-target guard, copy fixes, test gap), 1 defer + 2 info; 425 tests pass; status → done.
