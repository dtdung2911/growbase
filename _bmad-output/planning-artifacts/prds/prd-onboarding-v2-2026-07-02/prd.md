---
title: GrowBase — Onboarding v2 & Goal-driven Narrative
status: final
created: 2026-07-02
updated: 2026-07-02
author: DzungDuong
inputs:
  - _bmad-output/design-thinking-2026-07-02.md
---

# GrowBase — Onboarding v2 & Goal-driven Narrative

## 1. Bối cảnh & Vấn đề

GrowBase đã có ~60% tính năng cốt lõi (funds, transactions, categories, budget, báo cáo) nhưng thiếu narrative xuyên suốt. Design thinking session 02-07-2026 xác định 3 điểm gãy:

1. **Onboarding "nộp thuế":** wizard 7 bước hiện tại (Loại hộ → Mời thành viên → Thu nhập → Tài khoản → Nợ → Categories → Budget) bắt user hiểu toàn bộ khái niệm trước khi nhận được bất kỳ giá trị nào. Câu hỏi đầu tiên "Loại hộ" gây hiểu sai (user đọc thành "ai đang ngồi trước máy") → data sai từ giây thứ 10.
2. **Dashboard ngày 0 trống trơn:** setup xong không biết làm gì tiếp → quên app.
3. **Không có lý do quay lại:** số liệu là bảng kế toán, không phải lời đồng hành.

**Nguyên tắc thiết kế** (từ DEFINE phase): user phải nhận giá trị thật **trước khi** phải hiểu bất kỳ khái niệm nào của app; mỗi input onboarding phải đổi được hành vi của app (tạo entity thật) hoặc bị cắt; cấu trúc app tự mọc quanh hành vi thay vì setup trước; **độ phức tạp tính toán luôn ẩn phía sau** — user không bao giờ thấy công thức, chỉ thấy kết quả bằng lời người.

## 2. Mục tiêu & Success Metrics

**Phase hiện tại:** hobby/gia đình (~2 tháng, đến ~09/2026). **Phase kế:** launch thương mại — FRs trong PRD này không được chặn đường thương mại hóa nhưng không gold-plate cho nó.

| Metric | Đích (phase gia đình) |
|---|---|
| Thời gian hoàn thành onboarding | < 3 phút |
| Giao dịch đầu tiên được ghi trong ngày 0 | Có |
| User quay lại ngày hôm sau (D1 return) | Có |
| Người thứ hai (vợ/chồng) tự mở app sau tuần 2 | ≥ 3 ngày/tuần |

Phase gia đình đo **thủ công qua dogfood observation** — không dựng analytics. Instrument đo tự động là việc của phase thương mại.

**Counter-metrics** (đo để không tự lừa):
- Tỉ lệ sửa/xoá mục tiêu trong tuần đầu — nếu cao, màn Mục tiêu đang ép chọn bừa, không phải chọn nhanh.
- Insight hàng ngày bị lướt qua không tương tác — nếu vậy narrative là trang trí, chưa phải đồng hành.

## 3. Phạm vi

**Trong phạm vi:** onboarding 4 bước mới (thay thế hoàn toàn wizard 7 bước) · dashboard ngày 0 · daily insight (in-app) · goal progress (thực tế vs kỳ vọng) · lời mời vợ/chồng hậu-onboarding · reset test data sang cấu trúc mới.

**Ngoài phạm vi (phase thương mại):** push notification · multi-goal onboarding · A/B testing hạ tầng · billing/subscription · demo data cá nhân hóa theo phân khúc · đa tiền tệ (phase này **VND only**).

## 4. User Journeys

### UJ-1 — Lan, lần đầu mở GrowBase

Lan (32 tuổi, mẹ một con, chưa từng dùng app tài chính, được chồng giới thiệu) mở GrowBase lần đầu:

1. **Hook:** thay vì form, Lan thấy dashboard sống động của "nhà Minnie" — mục tiêu "Quỹ học cho bé Na 43%", ngân sách tháng, dòng chữ "Hôm nay nhà Minnie còn 85.000đ chi tiêu thoải mái". Banner rõ: *"Đây là nhà Minnie. Giờ đến lượt nhà bạn →"*. (Lan có thể bấm "Bỏ qua" nếu sốt ruột.)
2. **Mục tiêu:** app hỏi *"Bạn muốn gì cho gia đình mình?"* — Lan chọn 🎓 Quỹ học cho con từ danh sách gợi ý, giữ số mặc định 200 triệu / 5 năm.
3. **Thu nhập:** một câu duy nhất — *"Thu nhập hàng tháng của gia đình bạn khoảng bao nhiêu?"* Lan nhập 30 triệu.
4. **Tada:** app dựng ngay bức tranh của Lan — ngân sách tháng chia sẵn theo nhóm, mục tiêu thành quỹ thật với kết luận *"Cần góp 3,3tr/tháng — khả thi ✓ với thu nhập của bạn"*, và câu chốt *"Hôm nay bạn còn 120.000đ chi tiêu thoải mái"*.
5. **Ngày 0:** dashboard có đúng một lời mời hành động: *"Ghi khoản chi đầu tiên — thử ly cà phê sáng nay?"* Lan ghi 35.000đ cà phê trong 30 giây. App đáp: *"Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch."*

### UJ-2 — Lan, sáng hôm sau

Lan mở app vì tò mò lời hứa hôm qua. Dashboard chào: *"Hôm qua bạn tiêu 35.000đ — dưới kế hoạch 85.000đ. Khoản dư đẩy Quỹ học cho bé Na nhanh thêm một chút 🎉. Hôm nay bạn còn 118.000đ."* Lan hiểu ngay vòng lặp: ghi chép → thấy mình so với kế hoạch → mục tiêu nhích lên.

### UJ-3 — Tuần thứ hai, người thứ hai bước vào

Sau 7 ngày Lan dùng đều, app gợi ý: *"Quản lý cùng nhau dễ hơn một mình — mời người đồng hành?"* Lan mời chồng. Household tự chuyển thành "Gia đình" — không ai từng phải trả lời câu hỏi "Loại hộ". Khi Quỹ học đạt mốc 10%, cả hai cùng nhận được khoảnh khắc chúc mừng trong app.

## 5. Features & Functional Requirements

### F1 — Onboarding 4 bước "mở quà"

Thay thế hoàn toàn wizard 7 bước hiện tại.

- **FR1.** Màn Hook hiển thị dashboard demo "nhà Minnie" — dữ liệu tĩnh, render client-side, không ghi database. Ranh giới demo/thật hiển thị thường trực; CTA chính "Đến lượt nhà bạn"; có nút "Bỏ qua" đi thẳng FR2.
- **FR2.** Màn Mục tiêu: chọn đúng **một** mục tiêu từ danh sách gợi ý kèm số mặc định thông minh: 🛡️ Quỹ khẩn cấp (3 × chi tiêu tháng, tự tính sau khi có thu nhập), 🎓 Quỹ học cho con (200tr/5 năm), 🏠 Mua nhà (500tr/3 năm), ✈️ Du lịch gia đình (30tr/1 năm), ✏️ Tự nhập (tên + số đích + thời hạn). Số mặc định sửa được ngay tại chỗ. Bước này **bắt buộc** — không có lối "để sau" (mục tiêu là xương sống narrative của toàn app; Quỹ khẩn cấp là lựa chọn an toàn cho người chưa nghĩ ra mục tiêu riêng). Rủi ro chọn bừa được theo dõi bằng counter-metric #1.
- **FR3.** Màn Thu nhập: một trường duy nhất — thu nhập hàng tháng của hộ, gắn nhãn household income, không gắn vào cá nhân người nhập. Validation: bắt buộc > 0.
- **FR4.** Màn Tada: từ 2 input trên, app tự tạo (a) household 1 thành viên — không hỏi "Loại hộ"; (b) tài khoản mặc định "Tài khoản chính"; (c) bộ categories + budget mặc định từ seed 38 categories — số tiền budget **scale theo thu nhập** đã nhập, không phải hằng số tuyệt đối; (d) goal fund thật từ FR2; (e) kết luận khả thi: `(đích − 0) / số tháng` so với `thu nhập − tổng budget`, hiển thị "khả thi ✓" hoặc gợi ý điều chỉnh (giảm đích / kéo dài thời hạn); (f) con số "hôm nay còn X đ chi tiêu thoải mái".
- **FR5.** Không còn bước Mời thành viên, Tài khoản, Nợ, Categories, Budget trong onboarding. Nợ và tài khoản bổ sung khai báo sau trong app.
- **FR6.** Toàn bộ onboarding hoàn thành được dưới 3 phút với đúng 2 lần nhập liệu (mục tiêu + thu nhập).

### F2 — Dashboard ngày 0

- **FR7.** Ngay sau Tada, dashboard hiển thị đầy đủ: mục tiêu + tiến độ 0%, budget tháng, số "còn lại hôm nay" — không có vùng trống trắng.
- **FR8.** Một CTA duy nhất nổi bật: "Ghi khoản chi đầu tiên" (gợi ý mẫu: ly cà phê sáng), luồng ghi hoàn thành trong ~30 giây.
- **FR9.** Sau giao dịch đầu tiên, app hiển thị lời hứa quay lại: "Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch."

### F3 — Daily Insight (narrative layer)

- **FR10.** Mỗi ngày, dashboard mở đầu bằng đúng **một câu** insight bằng số thật, giọng người thật: số còn được tiêu hôm nay + liên kết với mục tiêu ("còn 118k *vì* 3,3tr tháng này đã để dành cho Quỹ học").
- **FR11.** Insight ngày hôm sau phản hồi hành vi hôm trước: dưới kế hoạch → ghi nhận + ảnh hưởng tích cực lên mục tiêu; vượt kế hoạch → thông cảm + điều chỉnh con số hôm nay, không đổ lỗi.
- **FR12.** Insight tính từ dữ liệu thật (budget linh hoạt còn lại / số ngày còn lại trong tháng) `[ASSUMPTION: công thức v1 — chi tiết thuật toán ở addendum, chốt khi architecture]`.
- **FR13.** Phase gia đình: insight chỉ in-app. Push notification ngoài phạm vi.

### F4 — Goal Progress (thực tế vs kỳ vọng)

- **FR14.** Mục tiêu hiển thị 2 đường tiến độ: thực tế (balance/target) và kỳ vọng (tuyến tính theo thời gian từ ngày tạo đến deadline).
- **FR15.** Chênh lệch 2 đường sinh narrative: đi trước → "về đích sớm N tháng 🎉"; tụt lại → "góp thêm X là bắt kịp" — hiển thị tại card mục tiêu và len vào daily insight khi đáng nói.
- **FR16.** Mốc tiến độ (10%, 25%, 50%, 75%, 100%) tạo khoảnh khắc chúc mừng cho **mọi** thành viên household (một hoặc nhiều người — xem F5).
- **FR17.** Thêm/sửa/xoá mục tiêu sau onboarding thực hiện trong app, không giới hạn số lượng `[ASSUMPTION: UI quản lý goals dùng lại trang Funds hiện có]`.

### F5 — Mời người đồng hành (hậu-onboarding)

- **FR18.** Household khởi tạo mặc định 1 thành viên. Khái niệm "Cá nhân/Gia đình" không bao giờ là câu hỏi — trạng thái tự suy từ số thành viên.
- **FR19.** Lời mời xuất hiện tại khoảnh khắc có nghĩa: sau 7 ngày sử dụng liên tục `[ASSUMPTION: định nghĩa "dùng đều" = mở app hoặc ghi giao dịch ≥5/7 ngày]`, hoặc user chủ động từ Settings bất cứ lúc nào.
- **FR20.** Người thứ hai vào: thấy cùng mục tiêu, cùng budget; thu nhập household có thể tách theo người góp nếu muốn — không bắt buộc.

### F6 — Reset dữ liệu test

- **FR21.** Dữ liệu hiện tại là test — clear toàn bộ households/funds/transactions hiện có và khởi tạo lại theo cấu trúc mới bằng seed script. Không cần UI migration, không cần backward compatibility `[ASSUMPTION: thực hiện một lần bởi dev, không phải tính năng user-facing]`.

## 6. Non-Functional Requirements

- **NFR1 — i18n:** mọi chuỗi (kể cả insight templates, demo data nhà Minnie) qua `t()`, đủ vi + en; vi là default.
- **NFR2 — Tone:** thân mật, xưng "bạn", đồng hành không phán xét; tuyệt đối không giọng ngân hàng/kế toán. Copy insight là sản phẩm, không phải string kỹ thuật.
- **NFR3 — Mobile-first:** 375px primary, touch target 44px, onboarding thao tác được hoàn toàn bằng một tay.
- **NFR4 — Hiệu năng cảm nhận:** màn Tada dựng bức tranh với hiệu ứng "đang chuẩn bị cho bạn..." — chờ có chủ đích, không spinner chết.
- **NFR5 — Demo an toàn:** dữ liệu nhà Minnie không bao giờ chạm database; không thể lẫn vào báo cáo thật (rủi ro #1 từ design session — phải test riêng).
- **NFR6 — Theme:** light/dark đầy đủ theo design tokens hiện hành.

## 7. Open Questions & Assumptions

Các `[ASSUMPTION]` đã tag inline: FR12 (công thức insight v1), FR17 (UI goals dùng lại Funds), FR19 (định nghĩa "dùng đều"), FR21 (reset bằng dev script).

Open:
- **OQ1.** Nội dung demo nhà Minnie: 1 tháng dữ liệu tĩnh có đủ "sống động" không, hay cần 2-3 tháng để chart có hình? *(chốt lúc UX spec)*
- **OQ2.** Quỹ khẩn cấp mặc định "3 tháng chi tiêu" — tính từ budget hay từ thu nhập? *(chốt lúc architecture — nghiêng về budget)*

---

_Addendum kỹ thuật: xem `addendum.md` cùng thư mục._
