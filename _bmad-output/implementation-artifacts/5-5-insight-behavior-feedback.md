---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 5.5: Insight phản hồi hành vi hôm trước

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng đã ghi chép hôm qua,
I want câu chào hôm nay phản hồi việc tôi tiêu thế nào so với kế hoạch,
so that tôi hiểu vòng lặp ghi chép → thấy mình → mục tiêu nhích lên, và không bị phán xét khi lỡ vượt.

## Acceptance Criteria

1. **Given** hôm qua user tiêu dưới kế hoạch ngày
   **When** insight hôm nay render
   **Then** ghi nhận + ảnh hưởng tích cực lên mục tiêu: "Hôm qua bạn tiêu 35.000đ — dưới kế hoạch 85.000đ. Khoản dư đẩy Quỹ học nhanh thêm một chút 🎉. Hôm nay bạn còn 118.000đ." (FR11, khớp UJ-2)
   **And** `[ASSUMPTION: "kế hoạch hôm qua" recompute từ dữ liệu hiện tại — chấp nhận lệch nếu budget bị sửa giữa tháng; v1 không lưu snapshot kế hoạch theo ngày]`

2. **Given** hôm qua user tiêu vượt kế hoạch ngày
   **When** insight hôm nay render
   **Then** giọng thông cảm + điều chỉnh con số hôm nay — tuyệt đối không đổ lỗi, không cảnh báo đỏ gắt (NFR2)
   **And** con số "còn lại hôm nay" đã recompute theo công thức v1 (tự hấp thụ phần vượt)

3. **Given** hôm qua user không ghi giao dịch nào
   **When** insight hôm nay render
   **Then** template trạng thái riêng — nhắc nhẹ nhàng kèm số còn lại, không trách móc

4. **Given** các nhánh trạng thái (dưới/vượt/không ghi/ngày đầu)
   **When** chạy test suite engine
   **Then** unit tests cover đủ 4 nhánh chọn template + tham số đúng

## Tasks / Subtasks

- [x] Task 1: Hoàn thiện tham số `yesterdayPlan`/`yesterdayDiff` cho template dưới/vượt kế hoạch (AC: 1, 2)
  - [x] `src/lib/insight/selectState.ts` (story 5.1, UPDATE) — `selectState()` hiện chỉ trả `state`, chưa surface `yesterdayFlexibleSpent`/`averageDailyFlexibleBudget` ra ngoài làm params. Thêm: `buildInsightDescriptor()` cho state `under-plan-yesterday`/`over-plan-yesterday` nhận thêm `yesterdaySpent` (tổng chi linh hoạt hôm qua), `yesterdayPlan` (= `averageDailyFlexibleBudget`, cùng công thức đã dùng để so sánh chọn state — KHÔNG tính lại bằng cách khác), `yesterdayDiff = Math.abs(yesterdaySpent - yesterdayPlan)`, `remainingToday` (= `calculateDailyRemaining()` hiện tại), `goalName`/`monthlyContribution` (từ `activeGoalFund`, story 5.4)
  - [x] Không thêm field/logic tính toán mới ngoài những gì đã có ở story 5.1 Task 2 — chỉ **truyền thêm** các số đã tính sẵn vào `params`, đúng ranh giới AR5 (engine tính, UI chỉ render)

- [x] Task 2: `[ASSUMPTION đã được epics chấp nhận sẵn]` — "kế hoạch hôm qua" recompute, không snapshot (AC: 1)
  - [x] Xác nhận lại (không tranh luận, epics đã đóng khung sẵn bằng `[ASSUMPTION: ...]`): `yesterdayPlan` LUÔN tính từ `budgetLines` hiện tại (thời điểm request hôm nay), không lưu lịch sử "kế hoạch tại thời điểm hôm qua" — nếu user sửa budget giữa tháng, số hiển thị có thể lệch nhẹ so với kế hoạch thực tế lúc đó. Đây là hành vi **được chấp nhận cho v1**, không phải bug — không thêm bảng snapshot/audit log để "sửa" việc này trong story này
  - [x] Ghi rõ quyết định này vào Dev Agent Record → Completion Notes để review sau không hiểu nhầm là thiếu sót

- [x] Task 3: i18n copy chính xác cho 3 template — tone đồng cảm, không đổ lỗi (AC: 1, 2, 3)
  - [x] `insight.underPlanYesterday` (`vi.json`/`en.json`, namespace đã tạo khung ở story 5.1) — khớp sát ví dụ AC1: "Hôm qua bạn tiêu {{yesterdaySpent}} — dưới kế hoạch {{yesterdayDiff}}. Khoản dư đẩy {{goalName}} nhanh thêm một chút 🎉. Hôm nay bạn còn {{remainingToday}}." — giữ emoji 🎉, giữ cấu trúc 3 câu
  - [x] `insight.overPlanYesterday` — giọng thông cảm, **không** dùng các từ mang tính phán xét ("vượt", "quá tay", "cảnh báo") theo nghĩa tiêu cực — ưu tiên khung "điều chỉnh nhẹ" thay vì "lỗi của bạn"; PHẢI chứa `{{remainingToday}}` đã recompute (AC2) để user thấy ngay số hôm nay đã tự động điều chỉnh, không cần user tự trừ
  - [x] `insight.noTransactionsYesterday` — nhắc nhẹ nhàng, không dùng từ "quên"/"thiếu sót" mang tính trách móc — khung dạng gợi ý ("Hôm qua chưa có ghi chép nào — hôm nay bạn còn {{remainingToday}} để chi tiêu") kèm `{{remainingToday}}`
  - [x] Review lại cả 2 template đã viết khung ở story 5.1 Task 3 (`underPlanYesterday`/`overPlanYesterday`/`noTransactionsYesterday`) — nếu bản nháp ở 5.1 chưa khớp copy chính xác này, SỬA đè bằng bản cuối trong story 5.5 (một nguồn copy thật duy nhất, không giữ 2 bản nháp song song)

- [x] Task 4: Test đủ 4 nhánh + verify "tự hấp thụ phần vượt" + business flow verification (AC: 2, 4)
  - [x] Unit test bổ sung trong `src/lib/insight/__tests__/`: dựng fixture "hôm qua chi vượt kế hoạch ngày" (vd `yesterdayFlexibleSpent > averageDailyFlexibleBudget`) → verify `calculateDailyRemaining()` cho hôm nay đã tự động thấp hơn (vì `totalSpent` tháng đã cộng dồn phần chi hôm qua) — **không có code riêng "trừ thêm phần vượt"**, đây là hệ quả tự nhiên của công thức v1 đã có ở story 5.1, test này chỉ xác nhận hành vi đúng, không viết logic mới
  - [x] Unit test 4 nhánh chọn state + params đúng (có thể đã có khung ở story 5.1 Task 2 — nếu đã cover đủ, story này chỉ bổ sung test cho `yesterdayPlan`/`yesterdayDiff`/`goalName` mới thêm ở Task 1, không viết lại test trùng)
  - [x] Liệt kê + verify business flow vào Dev Agent Record → `### Testing`: (1) fixture "dưới kế hoạch" → `DailyInsightBanner` (story 5.4) render đúng câu với số thật, có 🎉; (2) fixture "vượt kế hoạch" → câu không có từ đổ lỗi, số hôm nay đã thấp hơn tương ứng phần vượt; (3) fixture "không ghi giao dịch" → câu nhắc nhẹ, không dùng "quên"; (4) đổi ngôn ngữ vi↔en cả 3 template, không lai; (5) grep xác nhận copy không chứa các từ cảnh báo gắt ("cảnh báo", "vượt mức", "!") ở bản vi.json

### Review Findings

Review chạy 04-07-2026 trên diff scope: `selectState.test.ts`, `dailyRemaining.test.ts`, story file, sprint-status.yaml. 3 layer (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 24 finding thô, 1 patch đã áp dụng, 11 defer (pre-existing, ngoài scope story này), 9 dismiss (false-positive đã verify lại hoặc noise).

- [x] [Review][Patch] Test "vượt kế hoạch" exact-value thiếu assertion `goalName`/`monthlyContribution` — không đối xứng với test "dưới kế hoạch" [`src/lib/insight/__tests__/selectState.test.ts` — test "computes exact yesterdayDiff as absolute overshoot when over plan"] — đã fix, thêm 2 assertion, 14/14 test pass.
- [x] [Review][Defer] State `first-day` không thể reach qua đường render thật — `DashboardView.tsx:41` route sang `FirstExpenseCta` khi `!hasAnyTransactionEver`, không bao giờ vào `DailyInsightBanner` — pre-existing kiến trúc từ story 5.1/5.3 (có story riêng cho first-expense), không phải lỗi story 5.5.
- [x] [Review][Defer] Params `yesterdayPlan`/`monthlyContribution` được tính + test nhưng không xuất hiện trong bất kỳ chuỗi `insight.*` nào ở vi.json/en.json (copy chỉ dùng `yesterdaySpent`/`yesterdayDiff`/`goalName`/`remainingToday`) — pre-existing từ copy story 5.1, params do chính Task 1 spec yêu cầu nên không phải lỗi thực thi, nhưng đáng ghi backlog để xác nhận có cần dùng không.
- [x] [Review][Defer] `resolveActiveGoalFund.ts` (fallback goal→emergency→null) chưa có test riêng — pre-existing, thuộc scope story 5.1/5.4.
- [x] [Review][Defer] `budgetLines` rỗng + có giao dịch hôm qua thật (plan=0 boundary) chưa test cho nhánh non-first-day — pre-existing coverage gap, không bắt buộc theo AC4.
- [x] [Review][Defer] Nhiều dòng budget linh hoạt cộng dồn chưa test trong `selectState.test.ts` (chỉ fixture 1 dòng) — pre-existing coverage gap, không bắt buộc theo AC4.
- [x] [Review][Defer] `averageDailyFlexibleBudget` không chia hết (số lẻ) chưa test — floor (chọn state) vs `formatVND` round (hiển thị) có thể lệch gần boundary — pre-existing gap từ 5.1, đáng backlog vì ảnh hưởng UX.
- [x] [Review][Defer] `behavior_type = "variable"` (loại linh hoạt còn lại ngoài "wasteful") chưa được test — pre-existing coverage gap.
- [x] [Review][Defer] `TranslationProvider.tsx` dùng `String.replace` không global, chỉ thay thế lần xuất hiện đầu của key lặp lại — hiện chưa kích hoạt vì không chuỗi `insight.*` nào lặp key, nhưng là bug tiềm ẩn ở file không liên quan story này.
- [x] [Review][Defer] Test "ignores non-flexible/incoming transactions" gộp 2 lý do loại trừ khác nhau (direction=in và behavior_type=fixed) vào 1 assertion — nên tách 2 test để biết chính xác nhánh nào fail — pre-existing test từ story 5.1.
- [x] [Review][Defer] Phân loại flexible/fixed phụ thuộc string tiếng Việt hardcode ("Ăn uống ngoài", "Nhà ở & Điện nước") không qua constant chung — pre-existing design từ `budgetTemplate`, đổi copy category sẽ làm test âm thầm hỏng.
- [x] [Review][Defer] Tên test "uses local-time days-in-month, not UTC" hứa hẹn hơn assertion thực tế chứng minh (không ép UTC offset để so sánh) — pre-existing từ story 5.1, chỉ là đặt tên chưa khớp.

**Dismiss (đã verify lại, không cần action):**
- Acceptance Auditor nghi ngờ Task 1 "không có evidence trong diff" vì `selectState.ts` không xuất hiện — đã đóng: Edge Case Hunter (có quyền đọc code) xác nhận trực tiếp `buildInsightDescriptor` khớp chính xác `selectState.ts:45-69`, đúng công thức yêu cầu.
- Acceptance Auditor nghi ngờ "không sửa production code" là red flag — cùng lý do trên, đã verify độc lập.
- Acceptance Auditor nghi ngờ copy i18n (Task 3) "không verify được từ diff" — đã tự chạy lại script grep trực tiếp trên `vi.json`/`en.json` trong lúc triage: xác nhận không có từ cảnh báo gắt, không có "!", khớp đúng Testing table đã ghi.
- Acceptance Auditor cho rằng AC4 "4 nhánh" thiếu evidence (chỉ đếm 3 test mới) — false positive: toàn bộ file `selectState.test.ts` hiện là file mới trong git diff (thư mục `src/lib/insight/` chưa từng commit), nên cả 14 test (bao gồm first-day, no-transactions từ story 5.1) đều nằm trong diff — đã tự chạy `vitest run` xác nhận 31/31 pass đủ 4 nhánh.
- Blind Hunter: các phê bình về tautological test (`formatVND`/công thức tính lại giống hệt implementation) — dismiss, đây là style test nhất quán toàn bộ codebase cho pure function, không phải vấn đề riêng của story này.
- Blind Hunter: thiếu test refund/số âm — dismiss, không phải kịch bản nghiệp vụ hợp lệ (field `direction` đã encode in/out riêng).
- Blind Hunter: thiếu test tham số `today` mặc định (implicit `new Date()`) — dismiss, nhất quán pattern hiện có, giá trị thấp.
- Edge Case Hunter: fixture module-level dùng chung reference qua 14 test — dismiss, hàm thuần túy không mutate, rủi ro chỉ là giả thuyết.

## Dev Notes

### Phụ thuộc trực tiếp story 5.1 và 5.4 — không viết lại engine/render

Story này KHÔNG tạo file/component mới — chỉ hoàn thiện tham số (Task 1) và copy cuối cùng (Task 3) trên nền `src/lib/insight/` đã dựng ở story 5.1 và `DailyInsightBanner` đã dựng ở story 5.4. Nếu 5.1/5.4 chưa `done` khi bắt đầu story này, HALT và báo lại — không tự dựng lại engine/component song song.

### "Tự hấp thụ phần vượt" — không phải tính năng mới, là hệ quả công thức có sẵn

AC2 dòng "con số 'còn lại hôm nay' đã recompute theo công thức v1 (tự hấp thụ phần vượt)" **không yêu cầu code mới**: `calculateDailyRemaining()` (story 5.1) đã dùng `totalSpent` = tổng chi CẢ THÁNG tính đến hiện tại (bao gồm hôm qua), nên phần chi vượt hôm qua tự động làm giảm số còn lại hôm nay mà không cần logic bù trừ riêng. Task 4 chỉ cần **viết test xác nhận** hành vi này đúng, không viết thêm code tính toán.

### Copy tone — ràng buộc cứng NFR2

"Tuyệt đối không đổ lỗi, không cảnh báo đỏ gắt" là yêu cầu cứng (NFR2), không phải gợi ý — bản dev-story PHẢI tự đọc lại copy cuối cùng bằng góc nhìn "liệu câu này có khiến user cảm thấy bị trách không" trước khi đánh dấu Task 3 hoàn thành, không chỉ dựa vào việc test pass.

### Project Structure Notes

- Không có file mới trong story này
- File UPDATE: `src/lib/insight/selectState.ts` (thêm params), `src/lib/i18n/messages/vi.json`/`en.json` (hoàn thiện copy `insight.*`), `src/lib/insight/__tests__/*` (test bổ sung)
- Yêu cầu: story 5.1 và story 5.4 phải ở trạng thái `done` (hoặc ít nhất `review` với engine/component đã tồn tại) trước khi bắt đầu

### References

- [Source: epics-onboarding-v2.md#Story 5.5]
- [Source: 5-1-insight-engine-formula-v1.md — selectState, buildInsightDescriptor, calculateDailyRemaining]
- [Source: 5-4-daily-insight-greeting.md — DailyInsightBanner]

## Dev Agent Record

### Agent Model Used

claude-fable-5 (Claude Code)

### Debug Log References

- `npx vitest run src/lib/insight` → 4 files, 31 tests pass
- `npx vitest run` (full regression) → 25 files, 334 tests pass
- `npx tsc --noEmit` → 2 lỗi pre-existing tại `src/app/(app)/layout.tsx` (TS2352, tồn tại từ HEAD commit, xác nhận bằng `git stash` + tsc lại — không liên quan story này, story chỉ sửa 2 test files)
- ESLint chưa được cấu hình trong project (`next lint` yêu cầu setup interactive) — skip theo điều kiện "if configured"

### Implementation Plan

- Task 1: Kiểm tra `buildInsightDescriptor()` (story 5.1) — đã surface đủ `yesterdaySpent`/`yesterdayPlan`/`yesterdayDiff`/`remainingToday`/`goalName`/`monthlyContribution` đúng spec (yesterdayPlan dùng chính `averageDailyFlexibleBudget()` — cùng công thức chọn state; yesterdayDiff = `Math.abs(spent - plan)`). KHÔNG cần sửa code engine — chỉ bổ sung test exact-value để khóa hành vi.
- Task 3: Copy i18n 4 template đã có sẵn từ 5.1 và đã khớp bản cuối story 5.5 (underPlanYesterday khớp nguyên văn AC1, có 🎉, 3 câu). Review tone thủ công đạt NFR2 — không sửa.
- Task 4: Thêm 3 test exact-value vào `selectState.test.ts` + 1 test "tự hấp thụ phần vượt" vào `dailyRemaining.test.ts`.

### Completion Notes List

- **Task 2 — quyết định ASSUMPTION (ghi rõ để review không hiểu nhầm là thiếu sót):** `yesterdayPlan` LUÔN recompute từ `budgetLines` hiện tại lúc request (qua `averageDailyFlexibleBudget()`), KHÔNG lưu snapshot kế hoạch theo ngày. Nếu user sửa budget giữa tháng, số hiển thị có thể lệch nhẹ so với kế hoạch thực tế hôm qua — hành vi được chấp nhận cho v1 theo `[ASSUMPTION]` đã đóng khung trong epics. Không thêm bảng snapshot/audit log.
- **Task 1 không sửa `selectState.ts`:** story dự kiến UPDATE file này, nhưng story 5.1 đã implement đầy đủ params đúng từng chi tiết spec Task 1 (kể cả ràng buộc "yesterdayPlan cùng công thức chọn state, không tính lại cách khác"). Story này bổ sung test exact-value (35k spent / 100k plan → diff 65k; 185k → diff 85k; fallback goalFund null → chuỗi rỗng) để khóa contract thay vì viết lại code — đúng ranh giới AR5 và nguyên tắc không tạo logic mới.
- **AC2 "tự hấp thụ phần vượt":** xác nhận bằng test — `calculateDailyRemaining()` dùng `actual_amount` cộng dồn cả tháng nên phần chi vượt hôm qua tự động kéo số còn lại hôm nay xuống, không có code bù trừ riêng. Test mới trong `dailyRemaining.test.ts` chứng minh remaining của fixture overspent thấp hơn fixture on-plan và khớp công thức `floor((budget - spent) / daysRemaining)`.
- **Tone review NFR2 (đọc lại thủ công từng câu):** `overPlanYesterday` vi dùng "nhỉnh hơn kế hoạch … một chút. Không sao cả —" — khung "điều chỉnh nhẹ", không có "vượt"/"cảnh báo"/"quá tay"/"!"; `noTransactionsYesterday` dùng "chưa có ghi chép nào" — không có "quên"/"thiếu sót". Xác nhận thêm bằng script grep cả 4 template vi.

### Testing

| # | Business flow | Phương pháp | Kết quả |
|---|---------------|-------------|---------|
| 1 | Fixture "dưới kế hoạch" (35k/100k) → `DailyInsightBanner` render đúng câu với số thật, có 🎉 | Automated (`selectState.test.ts`: state + i18nKey + exact params) + manual trace (`DashboardView.tsx:41` → `DailyInsightBanner` → `t(descriptor.i18nKey, descriptor.params)`; `TranslationProvider.tsx:46` interpolate `{{k}}`; template vi chứa 🎉; API `dashboard/route.ts:191-192` cung cấp `hasAnyTransactionEver`/`yesterdayTransactions` thật) | PASS |
| 2 | Fixture "vượt kế hoạch" (185k/100k) → câu không đổ lỗi, số hôm nay đã thấp hơn tương ứng phần vượt | Automated (`selectState.test.ts` over-plan exact diff 85k; `dailyRemaining.test.ts` test tự hấp thụ: remaining overspent < on-plan, khớp công thức) + manual đọc copy vi/en | PASS |
| 3 | Fixture "không ghi giao dịch" → câu nhắc nhẹ, không dùng "quên" | Automated (state + i18nKey test) + grep copy vi: không có "quên"/"thiếu sót" | PASS |
| 4 | Đổi ngôn ngữ vi↔en cả 3 template, không lai | Manual (script Python so sánh key set + placeholder set giữa vi.json/en.json: 4/4 key trùng, params match 100%) | PASS |
| 5 | Grep copy vi.json không chứa từ cảnh báo gắt ("cảnh báo", "vượt mức", "quá tay", "!") | Manual (script grep cả 4 template `insight.*` trong vi.json → NONE) | PASS |

### File List

- `src/lib/insight/__tests__/selectState.test.ts` (modified — thêm 3 test exact-value params, +1 patch review: bổ sung assertion goalName/monthlyContribution cho test over-plan)
- `src/lib/insight/__tests__/dailyRemaining.test.ts` (modified — thêm 1 test tự hấp thụ phần vượt)
- `_bmad-output/implementation-artifacts/5-5-insight-behavior-feedback.md` (modified — story tracking)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status tracking)

## Change Log

- 04-07-2026: Story 5.5 hoàn thành — verify engine params (5.1) + copy i18n (khớp AC1 nguyên văn, tone NFR2 đạt), bổ sung 4 unit test (3 exact-value params, 1 tự hấp thụ phần vượt). 334/334 tests pass, không regression. Không sửa code production — engine 5.1 đã đủ, story chỉ khóa contract bằng test + xác nhận ASSUMPTION recompute.
- 04-07-2026: Code review (3-layer: Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 1 patch áp dụng (bổ sung assertion `goalName`/`monthlyContribution` cho test over-plan, đối xứng với test under-plan), 11 finding defer (pre-existing/ngoài scope), 9 dismiss (đã verify lại). 14/14 test `selectState.test.ts` pass sau patch.
