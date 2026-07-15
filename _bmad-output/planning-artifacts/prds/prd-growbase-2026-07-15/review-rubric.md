# PRD Quality Review — GrowBase Mobile (React Native)

## Overall verdict

PRD ngắn gọn, mạch lạc, có thesis rõ (xóa ma sát *ghi nhận tức thời* mà web không giải được) và phân vai mobile/web nhất quán xuyên suốt — đây là điểm mạnh nhất. Với stakes moderate + fast-path draft, PRD đủ tốt để mở bước architecture. Rủi ro chính nằm ở **done-ness**: nhiều FR vẫn dùng tính từ định tính ("hợp lý", "tối ưu tốc độ", "tăng rõ") thiếu ngưỡng đo được, và một cụm quyết định phạm vi còn treo "cần user xác nhận" — cần chốt trước khi story creation dựa vào PRD này.

Verdict: **PASS-with-fixes**.

## Decision-readiness — adequate

Các quyết định phần lớn được nêu thẳng, không giấu dưới dạng "cân nhắc". Ranh giới v1 rõ ràng, các FR ngoài v1 đều gắn nhãn `(ngoài v1)` với lý do (FR-10 OCR, FR-15 contribute/withdraw, FR-17 budget config, FR-23 push nâng cao). Trade-off "mobile chỉ tra cứu nhanh, thao tác nặng giữ ở web" được nêu và nhất quán.

Điểm yếu: một số quyết định còn ở trạng thái nửa vời — FR-15 và FR-23 kết bằng "**Cần user xác nhận**", tức là chưa phải quyết định đã chốt mà là đề xuất chờ duyệt. Với một PRD fast-path chuẩn bị vào architecture, việc để 2 ranh giới scope treo là chấp nhận được nhưng cần đóng sớm. Open Questions (§8) là câu hỏi thật (ngưỡng SM, pricing, POC), không phải câu hỏi tu từ — tốt.

### Findings
- **medium** Hai ranh giới scope còn treo (§FR-15, FR-23) — "Cần user xác nhận" biến quyết định thành đề xuất; downstream không biết chắc contribute/withdraw và push nâng cao có nằm ngoài v1 hay không. *Fix:* chốt dứt khoát với user và chuyển thành `[NON-GOAL for MVP]` hoặc kéo vào scope, bỏ cụm "cần xác nhận".

## Substance over theater — strong

Không có furniture. Chỉ 2 persona (primary/secondary) + 1 non-user, mỗi persona đều có chức năng thực (primary drive UJ-1/UJ-3, secondary drive UJ-2, non-user định nghĩa ranh giới web). 3 UJ đều cụ thể, có protagonist tên (Dũng, vợ Dũng), không dàn trải. Vision statement (§1) đặc thù cho sản phẩm này — nói về "ma sát ghi nhận tức thời", Face ID, offline — không thể swap sang PRD khác. Không có innovation theater giả tạo. NFR phần lớn có nội dung sản phẩm-cụ thể chứ không phải boilerplate (xem lưu ý ở done-ness về NFR định tính).

### Findings
(không có — dimension đạt)

## Strategic coherence — strong

PRD có thesis rõ: "companion mobile không ma sát giữ chân người dùng ghi chép hằng ngày" (§1, §7 SM-1). Feature prioritization theo đúng thesis — nhập nhanh (FG-B), offline (FG-F), push reminder (FG-G) là core; xem thống kê/quỹ/budget (FG-C/D/E) chỉ read-only phục vụ "tra cứu nhanh". Việc đẩy contribute/withdraw, budget config, OCR ra ngoài v1 nhất quán với thesis (không phải "làm cái dễ trước" mà "làm cái phục vụ giả thuyết trước"). Success Metrics validate thesis (SM-1 habit, SM-2 ma sát) chứ không đo activity suông. Có counter-metrics (SM-C1 bản ghi trùng, SM-C2 khớp số liệu) — hiếm PRD fast-path làm được. MVP scope kind = problem-solving/experience, scope logic khớp.

### Findings
(không có — dimension đạt)

## Done-ness clarity — thin

Đây là dimension yếu nhất và là lý do chính của "with-fixes". Nhiều FR/NFR dùng tính từ định tính không có bound đo được:

- **NFR-1 / NFR-2**: "Cold start **hợp lý** cho app native" — không có ngưỡng (ví dụ < 2s?).
- **FR-7**: "Màn nhập **tối ưu tốc độ** mobile" — mô tả cơ chế (bàn phím số, recent category) nhưng không có tiêu chí done đo được; gắn `[ASSUMPTION]` trống.
- **SM-3**: "Tỉ lệ giao dịch ghi trong ngày phát sinh **tăng rõ**" — "tăng rõ" không đo được, không có baseline.
- **FR-12**: "biểu đồ **đầy đủ** (tương đương web)" — "tương đương web" mơ hồ cho engineer RN (web dùng ApexCharts; RN dùng lib nào, những chart type nào là "đầy đủ"?).
- **SM-1..4** toàn bộ gắn `[ASSUMPTION]` "ngưỡng cần user chốt" — SM-2 may mắn có ngưỡng cụ thể (<15s, khớp NFR-1) nhưng SM-1 ("≥5 ngày/tuần") và SM-3/SM-4 còn phụ thuộc chốt.

Mặt tích cực: NFR-5 (sync idempotent, "không tạo bản ghi trùng khi retry") và SM-2/NFR-1 (<15s) là các bound testable rõ ràng. FR-18/19/20 mô tả offline behavior đủ cụ thể để test. Nhưng nhìn chung PRD chưa có section Acceptance Criteria và một số FR trọng yếu (FR-7, FR-12) sẽ khiến story creation phải tự suy diễn.

### Findings
- **high** Tính từ định tính thay cho ngưỡng (§NFR-1 "cold start hợp lý", FR-7 "tối ưu tốc độ", SM-3 "tăng rõ", FR-12 "chart đầy đủ") — engineer/story creation phải tự đoán "done". *Fix:* thêm bound cụ thể: cold start target (vd < 2s), định nghĩa "chart đầy đủ" = liệt kê chart type bắt buộc, SM-3 cần baseline + % target.
- **medium** SM-1/3/4 chưa có ngưỡng (§7 `[ASSUMPTION]`) — SM-4 (cổng thương mại hóa) phụ thuộc SM-1 nên treo dây chuyền. *Fix:* chốt ngưỡng SM-1 với user; nếu chưa thể, đánh dấu rõ đây là gate chặn đo lường, không chặn build.
- **low** FR-7 gắn `[ASSUMPTION]` rỗng (không có nội dung giả định) (§FR-7) — không rõ đang giả định điều gì. *Fix:* điền nội dung assumption hoặc bỏ tag.

## Scope honesty — strong

Omission rất minh bạch — đây là điểm mạnh thứ hai. §6.2 "Ngoài v1" liệt kê rõ (OCR, contribute/withdraw, budget config, report đầy đủ, push nâng cao, tính năng tài chính mới). Các FR ngoài scope được đánh dấu inline `(ngoài v1)` ngay tại vị trí liên quan (FR-10, FR-15, FR-17, FR-23) — reader không phải suy diễn. Addendum có mục "Rejected/Deferred" (RN full parity, PWA, Capacitor). De-scoping làm công khai, không âm thầm.

Open-items density: khoảng 7 `[ASSUMPTION]` + 3 Open Questions cho một PRD fast-path moderate-stakes — hợp lý, không quá tải. Chỉ có 2 chỗ "cần user xác nhận" (đã note ở decision-readiness) là làm mờ ranh giới scope một chút.

Lưu ý: PRD dùng `[ASSUMPTION]` inline nhưng **không có Assumptions Index** ở cuối — với fast-path chấp nhận được nhưng nên bổ sung khi PRD trưởng thành.

### Findings
- **low** Không có Assumptions Index (roundtrip) — 7 `[ASSUMPTION]` inline rải rác nhưng không gom index cuối PRD. *Fix:* thêm section Assumptions Index liệt kê + đánh dấu cái nào chờ user chốt.

## Downstream usability — adequate

PRD này là chain-top (feeds architecture → stories) nên dimension này quan trọng. Glossary (§3) có mặt, các domain noun (Household, Fund, Budget line, Transaction, currentMonth) dùng nhất quán. FR IDs contiguous FR-1..FR-23, unique, không gap. Cross-reference nội bộ resolve (§6, §Vision brief được nhắc; addendum tách technical-how rõ ràng).

Điểm cần cải thiện: FR-12 tham chiếu "tương đương web" và "chart library trên RN" nhưng không nêu cụ thể — architecture/story sẽ phải quay lại hỏi. NFR-6 nói "types/schemas/rules/query keys **nên** chia sẻ" (dùng "nên" thay vì "phải") — addendum làm rõ hơn (tách shared package) nhưng bản thân NFR để ngỏ. UJ đều có protagonist tên, không floating. Mỗi section đứng độc lập được nhờ Glossary.

### Findings
- **medium** FR-12 "chart đầy đủ tương đương web" không actionable cho RN (§FG-C) — web ApexCharts không map 1-1 sang RN; story creation phải tự chọn scope chart. *Fix:* liệt kê chart type v1 bắt buộc + chỉ định RN chart lib (hoặc để addendum quyết, và tham chiếu rõ).

## Shape fit — strong

Shape khớp sản phẩm. Đây là consumer product / mobile UX-heavy nên UJ với protagonist tên là load-bearing — PRD có đúng 3 UJ cụ thể (không over-formalize, không under). Là brownfield (companion cho web đã có) — PRD phân biệt rõ cái đã có ở web vs cái mới ở mobile, và business-rule bất biến (fund ops RPC, behavior_type, is_system) được tham chiếu chính xác khớp CLAUDE.md/web. Technical-how đúng chỗ (addendum), PRD chính giữ "cái gì". Không bị ép khuôn thừa. Với fast-path moderate stakes, mức rigor phù hợp.

### Findings
(không có — dimension đạt)

## Mechanical notes

- **Glossary drift:** không phát hiện — domain noun dùng nhất quán (Household, Fund, Budget line, Transaction, currentMonth). `currentMonth` dùng đúng format `YYYY-MM` xuyên suốt.
- **ID continuity:** FR-1..FR-23 liên tục, unique, không gap/dup. FG-A..FG-G nhóm rõ. SM-1..4 + SM-C1/C2 + NFR-1..8 đều liên tục. Tốt.
- **Cross-refs:** §6, §Vision, addendum resolve được. "Xem addendum" trỏ đúng file.
- **Assumptions Index roundtrip:** thiếu Index (đã note ở scope honesty). 7 `[ASSUMPTION]` inline chưa gom.
- **UJ protagonist:** cả 3 UJ có tên protagonist mang context inline — đạt.
- **Required sections:** đủ cho fast-path moderate stakes (Context, Overview, Users&Journeys, Glossary, FR, NFR, Scope, Success Metrics, Open Questions). Thiếu Acceptance Criteria section (một phần bù bằng consequences trong FR nhưng chưa đủ cho FR-7/FR-12).
