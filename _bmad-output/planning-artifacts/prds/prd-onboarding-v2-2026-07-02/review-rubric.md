# Review: PRD quality rubric — prd.md (2026-07-02)

Chạy sequential (không subagent — môi trường thiếu uv/python3.11). Stakes: internal phase → rigor vừa.

## Verdict

**PASS có điều kiện** — cấu trúc chắc, FR đo được, counter-metrics có mặt. 1 finding HIGH cần quyết định của PM trước khi final; còn lại medium/low sửa được trong polish.

## Findings

### HIGH

**H1 — FR2 ép chọn mục tiêu, không có lối thoát.** User không có mục tiêu rõ (hoặc chỉ muốn "theo dõi chi tiêu cái đã") bị ép chọn bừa → chính counter-metric #1 của PRD (tỉ lệ sửa/xoá goal tuần đầu) sẽ bẩn ngay từ thiết kế. Cần quyết định: goal bắt buộc (giữ narrative spine, chấp nhận rủi ro chọn bừa) hay có lối "Để sau" (mất xương sống Tada — màn Tada thiếu goal fund + tính khả thi). Đây là phase-blocker cho UX spec.

### MEDIUM

**M1 — FR4e chia cho 0 / thu nhập bất thường.** Thu nhập = 0 hoặc bỏ trống → công thức khả thi vỡ. Cần validation min (>0) và hành vi khi thu nhập < tổng budget mặc định (budget seed phải scale theo thu nhập, không phải số tuyệt đối).

**M2 — Success metrics chưa nói cách đo.** Phase gia đình chưa có analytics; D1 return / "vợ mở app 3 ngày/tuần" đo bằng gì? Nên ghi rõ: đo thủ công/dogfood observation ở phase này, analytics instrument hoãn sang phase thương mại.

**M3 — Đơn vị tiền tệ.** PRD mặc định VND ngầm; NFR i18n en tồn tại nhưng không nói currency. Một dòng "VND only phase này, currency là mối lo phase thương mại" là đủ.

### LOW

**L1 — Nguyên tắc "ẩn độ phức tạp" chưa thành chữ** (trùng gap #1 của reconcile) — thêm 1 dòng §1 hoặc NFR2.
**L2 — FR16 "mọi thành viên household" trước khi F5 giới thiệu multi-member — thứ tự đọc hơi ngược, không sai.
