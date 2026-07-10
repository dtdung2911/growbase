# Sprint Change Proposal — Living Plan / Tada↔Dashboard Continuity (10-07-2026)

Status: approved (signoff 10-07-2026) — artifacts applied
Workflow: bmad-correct-course · Mode: Batch
Nguồn: brainstorm 10-07-2026 (`_bmad-output/brainstorming/brainstorm-tada-dashboard-continuity-2026-07-10/` — memlog 37 entries + brainstorm-intent.md, MoSCoW đã chốt)

## 1. Issue Summary

User browser-test sau Epic 10+11 (10-07-2026): onboarding ổn, nhưng **bức tranh Tada và dashboard vận hành không khớp** — rời Tada là mọi khái niệm biến mất, nặng nhất ở quản lý quỹ. Kiểm kê có hệ thống: **7 khái niệm mồ côi** (capacity 15%, giai đoạn hiện tại, hạng/ladder/kéo thả, góp TB + timeline per fund, kênh gợi ý + lãi kép, chia chặng, lối thoát drift) + 1 nhà tạm (CSP bar). Gap bản chất là **ngôn ngữ + tính liên tục**, không phải thiếu feature: engine thuần và phần lớn UI components đã tồn tại.

Phát hiện kỹ thuật kèm theo: **hạng quỹ không sống trong DB** (chỉ là thứ tự mảng lúc gửi route onboarding) — kéo thả 11.1 chết cùng session.

## 2. Impact Analysis

- **Epic impact:** Epic 10/11 done, không rollback (reuse: engine, GoalRankList, PlanDetailSheet, pattern Tada). Cần **Epic 12** (Living Plan core — MoSCoW Must) + **Epic 13** (Narrative layer — Should). Could/Won't → deferred-work.
- **Story impact:** backlog trống (epic 10/11 done hết) — không story mở nào vỡ.
- **Artifact conflicts:** BUSINESS_RULES thiếu BR cho living plan/income thực/rank/permission/stage events; PRD addendum chưa định nghĩa vận hành hậu Tada; epics file chưa có Epic 12/13; sprint-status thiếu tracking; UX_SPEC cần đánh dấu planned.
- **Technical impact:** 1 migration DB duy nhất (`priority_rank` trên funds); hook `useLivingPlan` (client, reuse engine — pattern livePlan Tada); còn lại compute-on-render, không schema plan. Insight engine (Epic 5) chỉ đụng ở Epic 13.

## 3. Recommended Approach

**Direct Adjustment — scope Moderate.** Nền tảng từ brainstorm đã chốt 12 quyết định (chi tiết brainstorm-intent.md):

- **Kế hoạch LUÔN TƯƠI**: engine chạy lại với state thật (rank DB + income thực hộ gộp + emergency balance) mỗi render — không lưu plan tĩnh. Tada = lần chạy đầu của cùng hàm → Tada tươi cho member mới miễn phí.
- **Funds làm gốc**: summary strip mini-Tada (câu chuyện tập hợp) + plan đi theo từng fund (tab Kế hoạch). Không tách trang /plan.
- **User giữ tay lái**: góp tay từng quỹ (engine chỉ pre-fill gợi ý), sửa target tay, trục thời gian giữ tháng/quý/năm (giai đoạn = badge phủ). Advise-not-act (BR-OB-011) thành triết lý vận hành.
- Income vận hành = thu nhập thực **cả hộ gộp**; capacity tháng = 15% × income thực tháng; timeline dùng trailing 3 tháng. Emergency target giữ số onboarding (user tự sửa); ngưỡng GĐ derive từ target (1/3, 3/3).

Effort: Epic 12 ~1 sprint, Epic 13 ~1 sprint. Risk: Medium-low (engine đã có + tested; rủi ro chính là data-source mapping income thực — mitigate: helper thuần + tests trước UI).

## 4. Detailed Change Proposals (Batch)

### P1 — Business Rules (`docs/02_BUSINESS_RULES.md` += BR-OB-014..018, chèn sau BR-OB-013)

- **BR-OB-014 — Living Plan:** Kế hoạch phân bổ KHÔNG lưu tĩnh. Mọi màn hình tính lại từ engine với state thật: `priority_rank` (DB) + income thực hộ + emergency balance thật. Tada = snapshot đầu tiên; member mới xem "Tada tươi" bằng số hiện tại, không replay.
- **BR-OB-015 — Income vận hành:** Capacity tháng = 15% × tổng thu nhập THỰC cả hộ trong tháng (ví chung, mọi member). Timeline dài hạn dùng trailing average 3 tháng. Income onboarding chỉ dùng để estimate bức tranh ban đầu.
- **BR-OB-016 — Hạng quỹ persistent:** Hạng goal funds sống ở cột `priority_rank`; do USER xếp (kéo thả — sheet Đổi hạng), app chỉ advise. Goal mới chen ladder → mọi số recompute, không hỏi lại. Quyền sửa kế hoạch (hạng/target): theo permission flag per member, owner cấp.
- **BR-OB-017 — Góp quỹ vận hành:** Thao tác tay từng quỹ, engine PRE-FILL số gợi ý (sửa/bỏ qua được). KHÔNG auto-allocate. Tháng không góp = hợp lệ: timeline tự giãn + kể tử tế kèm lối thoát (không phải lỗi).
- **BR-OB-018 — Sự kiện giai đoạn:** Chuyển GĐ (lên/xuống, kể cả rút emergency tụt ngưỡng) phải được KỂ kèm lối thoát ("còn N tháng là đầy lại") — BR-OB-012 áp cho vận hành. Rút quỹ yêu cầu nhập mô tả lý do. Không notify chéo member khi biến động lan.

### P2 — PRD addendum (`prds/prd-onboarding-v2-2026-07-02/addendum.md` += section "Living Plan (10-07-2026)")

Tóm tắt 12 quyết định brainstorm + MoSCoW + trỏ BR-OB-014..018 (trích nguyên quyết định từ brainstorm-intent.md).

### P3 — Epics (`epics-onboarding-v2.md` += Epic 12 + Epic 13)

**Epic 12 — Living Plan: engine sống bằng số thật (Must):**
- **12.1 Rank persistent + engine vận hành** (C+M+K): migration `priority_rank` (backfill theo thứ tự tạo fund từ onboarding); helper thuần `getOperationalPlanInput` (income thực hộ gộp + trailing 3 tháng, emergency balance, goals theo rank) + hook `useLivingPlan`; goal mới tạo → rank cuối, recompute tự nhiên; tests boundary (0 income tháng, member 2 người, goal mới chen).
- **12.2 Funds summary strip + Đổi hạng** (A+C UI): mini-Tada đầu trang Funds (capacity tháng, GĐ hiện tại + progress 3 GĐ, cách chia ladder); sheet "Đổi hạng" reuse GoalRankList ghi `priority_rank` (permission-aware); mobile 375px.
- **12.3 Tab Kế hoạch fund detail** (D): góp TB + timeline (living), kênh gợi ý + lãi kép + disclaimer BR-OB-013 cho goal dài, marker chặng 50% trên progress; reuse compound helpers + planDetail patterns.
- **12.4 Pre-fill góp quỹ** (E): dialog contribute pre-fill số engine tháng này (capacity tháng × ladder, trừ phần đã góp); sửa được, bỏ qua được; sau góp → strip/timeline cập nhật.

**Epic 13 — Narrative layer: app kể chuyện vận hành (Should):**
- **13.1 Badge GĐ dashboard** (B): header dashboard đeo badge "GĐ1 · tháng 2/6" (lớp phủ, trục tháng giữ nguyên) — nguồn useLivingPlan.
- **13.2 Drift + sự kiện GĐ kể tử tế** (F+G): tháng không góp → timeline giãn + message lối thoát; chuyển GĐ lên/xuống → insight card "còn N tháng là đầy lại" (BR-OB-018).
- **13.3 Mô tả rút quỹ** (L): withdraw yêu cầu note lý do (text), lưu vào transaction/fund history.
- **13.4 Tada tươi cho member mới** (I): member join (7-3) → offer xem reveal 4-stage chạy bằng số hôm nay (reuse TadaStep parts, không replay snapshot).

**Could/Won't → deferred-work:** H (insight engine ngôn ngữ GĐ toàn diện — 13.2 chỉ làm events), J (permission flag UI đầy đủ — 12.2 chỉ check owner trước), O (dòng chuyện Budget page), N (chế độ tháng khó — cần F+G có data).

### P4 — Tracking & docs phụ

- `sprint-status.yaml` += epic-12 (4 stories) + epic-13 (4 stories), backlog.
- `deferred-work.md` += section Living Plan Could/Won't (H/J/O/N chi tiết).
- `docs/05_UX_SPEC.md`: đánh dấu Funds page + fund detail "(Epic 12 — planned)", dashboard header "(Epic 13 — planned)".

## 5. Implementation Handoff

- **Scope: Moderate** — backlog reorganization (2 epic mới) + doc updates. Route: PO/Dev = user + Claude (BMad flow).
- Docs edits: apply ngay sau signoff. Code: `bmad-create-story` 12-1 → `bmad-dev-story` (auto) → `bmad-code-review` — pipeline như Money Model v2.
- **Success criteria:** hạng sống qua reload (DB); Funds strip + fund detail + dashboard badge + Tada đọc CÙNG một `useLivingPlan`; góp/rút/goal mới/income mới → mọi số tự cập nhật; sự kiện GĐ luôn kèm lối thoát; `tsc` + vitest sạch; mọi số hiện UI có nguồn hoặc disclaimer.

## 6. Checklist status

Understand issue [x] · Epic impact [x] (2 epic mới, không rollback) · Artifact conflicts [x] (BR/PRD/epics/sprint-status/UX/deferred) · Path evaluation [x] (Direct Adjustment, không MVP review) · Proposal consolidated [x].
