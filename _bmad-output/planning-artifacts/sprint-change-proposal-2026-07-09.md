# Sprint Change Proposal — Money Model v2 (09-07-2026)

Status: approved (signoff 09-07-2026) — artifacts applied
Workflow: bmad-correct-course · Mode: Incremental (4/4 proposals approved từng phần)

## 1. Issue Summary

Phát hiện khi user browser-test sau Epic 9 (09-07-2026): app tồn tại **2 model tiền song song không reconcile**:

1. Card ngân sách user thấy: cố định 53% + linh hoạt 24% (gồm "other" 4%) + tiết kiệm & đầu tư 15% + nợ 8% = 100%.
2. Feasibility code: `available = 100% − SPENDING(81%) = 19%` — đếm trùng "other" 4% (vừa trong linh hoạt trên card, vừa trong capacity góp quỹ), và con số 19% không hiển thị ở bất kỳ đâu.
3. Tổng góp quỹ (case thực: 17,9tr/tháng = 44,75% income 40tr) không có "nhà" trong bức tranh 100%.

Bản chất: lỗ hổng thiết kế nghiệp vụ từ PRD onboarding-v2 (Epic 8) — code làm đúng spec sai. Evidence chi tiết: memlog brainstorm + `_bmad-output/brainstorming/brainstorm-money-model-fund-engine-2026-07-09/`.

## 2. Impact Analysis

- **Epic impact:** Epic 8/9 done, không rollback (UI Epic 9 reuse ~80%). Cần Epic 10 + 11 mới; Sprint 3 (vận hành) vào deferred-work.
- **Story impact:** không story đang mở nào bị vỡ (backlog trống trước thay đổi).
- **Artifact conflicts:** PRD addendum (money model chưa định nghĩa), BUSINESS_RULES (thiếu BR capacity/allocation/hiển thị), UX_SPEC (Tada/Goal step sẽ đổi), `budgetTemplate.ts` (công thức available 19% sai).
- **Technical impact:** engine thuần mới trong `budgetTemplate.ts` thay `calculateFeasibility`/`calculateAggregateFeasibility`; GoalStep/TadaStep/route onboarding tiêu thụ engine; không migration DB (schema đủ).

## 3. Recommended Approach

**Direct Adjustment — scope Moderate.** Không rollback, không thu hẹp MVP. Nền tảng quyết định từ brainstorm 09-07-2026 (memlog + brainstorm-intent.md) và research có citation (research-frameworks.md):

- Capacity góp = bucket Tiết kiệm & Đầu tư **15%** (CSP/Sethi) — hết đếm trùng.
- **Hybrid 3 giai đoạn**: 100%→emergency 1 tháng chi tiêu (CFPB) → 70/30 đến 3 tháng → 100% goals.
- Goals chia **tỷ trọng bậc thang theo hạng user kéo thả**; không slider trong onboarding.
- **Voice**: sự thật luôn kèm lối thoát — số tụt mood không đứng một mình; nắn chặng opt-in (>10 năm); lãi kép 3 tầng 5/6,5/8%/năm (T-1, disclaimer).
- Tada = kế-hoạch-là-thành-tựu; chi tiết → màn "kế hoạch chi tiết".

Effort: Epic 10 ~1 sprint, Epic 11 ~1 sprint. Risk: Medium (đổi công thức lõi — mitigate: engine thuần + tests đủ boundary trước khi đụng UI).

## 4. Detailed Change Proposals (đã duyệt từng phần, Incremental)

### P1 — PRD addendum (approved)
`prds/prd-onboarding-v2-2026-07-02/addendum.md` += section "Money Model v2 (09-07-2026)": capacity 15%, hybrid 3 giai đoạn, bậc thang theo hạng, nắn chặng opt-in + lãi kép, rule hiển thị, Tada mới. (Chi tiết trong brainstorm-intent.md — addendum trích nguyên quyết định.)

### P2 — Business Rules (approved)
`docs/02_BUSINESS_RULES.md` += BR-OB-009 (capacity 15%, other ∉ capacity) · BR-OB-010 (hybrid 3 giai đoạn, emergency = 3× chi tiêu thiết yếu) · BR-OB-011 (bậc thang theo hạng, không waterfall/slider) · BR-OB-012 (số tụt mood không đứng một mình; nắn chặng opt-in >10 năm) · BR-OB-013 (lãi kép 5/6,5/8% T-1 + disclaimer; gợi ý tham khảo ≠ tư vấn đầu tư).

### P3 — Epics (approved)
`epics-onboarding-v2.md` += **Epic 10** (10.1 allocation engine thuần + tests; 10.2 GoalStep suggest live; 10.3 Tada 3 giai đoạn + attribution) + **Epic 11** (11.1 kéo thả xếp hạng; 11.2 lãi kép + nắn chặng; 11.3 màn kế hoạch chi tiết). Sprint 3 → deferred-work, chưa tạo epic.

### P4 — Tracking & docs phụ (approved)
`sprint-status.yaml` += epic-10/11 + 6 stories (backlog). `deferred-work.md` += section Sprint 3 vận hành (khoá tháng, reconcile, daily notify, nhập liệu nhanh, slider power-user, nối investment portfolio, review 70/30). `docs/05_UX_SPEC.md`: cập nhật /setup đánh dấu "(Epic 10/11 — planned)".

## 5. Implementation Handoff

- **Scope: Moderate** — backlog reorganization (2 epic mới) + doc updates.
- **Route:** PO/Dev = chính user + Claude (BMad flow hiện tại). Docs edits: apply ngay sau signoff. Code: `bmad-create-story` 10-1 → `bmad-dev-story` (auto theo quy trình đã chốt) → `bmad-code-review`.
- **Success criteria:** engine mới pass tests boundary (income 15tr/40tr/100tr; 0-6 goals; timeline 1-600 tháng); Tada/GoalStep/dashboard kể cùng 1 câu chuyện 100% thu nhập; mọi số hiện UI có nguồn hoặc disclaimer; `tsc` + vitest sạch.

## 6. Nguồn

- `_bmad-output/brainstorming/brainstorm-money-model-fund-engine-2026-07-09/` (.memlog.md, brainstorm-intent.md, research-frameworks.md)
- Party-mode 06-07-2026 (framing CSP) · CFPB/CFP/Vanguard/Fidelity (emergency) · Thaler 1985/Nobel 2017 (buckets)
