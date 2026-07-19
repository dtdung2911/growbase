---
title: "Product Brief: GrowBase Mobile (React Native)"
status: ready
created: 2026-07-15
updated: 2026-07-15
---

# Product Brief: GrowBase Mobile

## Executive Summary

GrowBase là web app quản lý tài chính gia đình (Next.js 14 + Supabase), đã tương đối hoàn chỉnh. Web mạnh ở *quản lý và phân tích* nhưng yếu ở *ghi nhận tức thời*: để ghi một khoản chi ngay lúc phát sinh, người dùng phải nhớ domain, mở browser, đăng nhập và gõ nhiều — nên hay hoãn đến tối rồi quên.

GrowBase Mobile là **companion app viết bằng React Native** cho iOS và Android, tập trung vào một tập chức năng gọn phục vụ đúng khoảnh khắc di động: **nhập giao dịch nhanh**, xem **thống kê chi tiêu tháng**, xem **quỹ (funds)** và **ngân sách (budget)**. Các thao tác quản lý nặng và phân tích đầy đủ vẫn ở web. App khai thác sức mạnh native để xóa ma sát: mở từ icon (không cần nhớ domain), unlock bằng Face ID, nhập được cả khi mất mạng (sync sau) và push notification nhắc ghi chép.

Mục tiêu 3 tháng đầu: dùng cho cá nhân và gia đình để **validate** giả thuyết "một companion mobile không ma sát giữ chân người dùng ghi chép hằng ngày". Nếu đúng, đây là bàn đạp cho định hướng thương mại hóa.

## The Problem

Web GrowBase mạnh ở *quản lý và phân tích* (5 loại fund, 38 category, money model, living plan, report, đóng sổ tháng), nhưng yếu ở *ghi nhận tức thời* và *tra cứu nhanh khi di chuyển*:

- **Ma sát tại thời điểm chi tiêu.** Đứng ở quầy thanh toán, không ai muốn nhớ domain → mở browser → đăng nhập → gõ. Kết quả: hoãn lại → quên → dữ liệu thiếu, sai.
- **Không có "hook" chủ động.** Web không nhắc. Không push notification → không hình thành thói quen ghi chép hằng ngày.
- **Tra cứu nhanh bất tiện.** Muốn liếc "tháng này tiêu bao nhiêu / quỹ còn gì / còn bao nhiêu ngân sách" khi đang ra ngoài — mở web trên điện thoại là quá nhiều bước.
- **Đăng nhập phiền.** Nhập mật khẩu mỗi lần mở web = thêm rào cản nhỏ nhưng đủ để nản.

Chi phí của status quo: dữ liệu tài chính gia đình không đầy đủ → mọi tính năng phân tích phía sau mất giá trị vì "rác vào, rác ra".

## The Solution

Một **React Native companion app** (iOS + Android), dùng chung backend Supabase với web, tập trung vào tập chức năng cao tần suất khi di động — **nhập giao dịch** (form nhập tay như web, tối ưu cho thao tác nhanh; chưa có đính ảnh/OCR ở v1), xem **thống kê chi tiêu tháng**, xem **quỹ (funds)** và **ngân sách (budget)** — cộng với lớp native tối giản ma sát:

- **App icon + no-domain** — mở từ màn hình chính, không cần nhớ địa chỉ.
- **Face ID unlock** — dùng ngay, không gõ mật khẩu.
- **Offline-first cho việc nhập** — nhập được khi mất mạng, tự sync khi online lại.
- **Push notification** — nhắc ghi chép, tạo thói quen hằng ngày.

Nguyên tắc phân vai: **mobile = nhập nhanh + tra cứu nhanh; web = quản lý + phân tích đầy đủ.**

## What Makes This Different

Trung thực — lợi thế nằm ở *nền tảng đã chín* và *sự tập trung*, không phải công nghệ độc quyền:

- **Logic tài chính đã kiểm chứng.** Money model v2, living plan, category structure khớp thực tế chi tiêu gia đình VN — phần khó nhất đã xong và đã dùng thật. Mobile không phải phát minh lại, chỉ đưa một tập chức năng ra đúng ngữ cảnh.
- **Tập trung, không ôm đồm.** Cố ý làm subset thay vì full parity → native UX cho việc nhập/tra cứu có thể trau chuốt tối đa, thay vì phân tán effort tái tạo mọi màn hình web.
- **Native feel thật.** Chọn React Native (thay vì bọc web) cho tập màn hình cao tần suất này = trải nghiệm nhập/tra cứu mượt, phản hồi tức thì — đúng nơi cảm giác native tạo khác biệt về thói quen dùng.

## Who This Serves

- **Primary (3 tháng đầu):** Chính người xây dựng và gia đình — người ghi chép tài chính hằng ngày, cần nhập liệu và tra cứu không ma sát khi di chuyển. Thành công = ghi chép thành thói quen tự nhiên.
- **Secondary (định hướng thương mại hóa):** `[ASSUMPTION]` Gia đình Việt Nam có nhu cầu quản lý chi tiêu chung, đã quen app tài chính nhưng bỏ cuộc vì ma sát nhập liệu. *(Chưa thảo luận chi tiết — xem Open Questions.)*

## Success Criteria

`[ASSUMPTION]` *(Chưa chốt cùng người dùng — đề xuất để pressure-test:)*

- **Signal chính (habit):** Người dùng + gia đình nhập giao dịch ≥ 5 ngày/tuần qua mobile app, thay cho web, xuyên suốt 3 tháng.
- **Signal ma sát:** Thời gian trung bình từ "mở app" đến "lưu xong một giao dịch" < 15 giây.
- **Signal độ đầy đủ dữ liệu:** Tỉ lệ giao dịch được ghi trong ngày phát sinh tăng rõ so với giai đoạn chỉ dùng web.
- **Cổng quyết định thương mại hóa:** Sau 3 tháng, nếu habit signal đạt → chuyển sang giai đoạn nghiên cứu thương mại hóa.

## Scope

**Trong v1 (bản đầu, mục tiêu 3 tháng) — React Native companion, iOS + Android:**

- Nhập giao dịch (form nhập tay như web).
- Xem thống kê chi tiêu tháng hiện tại.
- Xem quỹ (funds) — số dư, trạng thái.
- Xem ngân sách (budget) — còn lại.
- App icon; cài từ App Store + Play Store.
- Face ID / biometric unlock.
- Offline entry + sync khi online.
- Push notification (nhắc ghi chép).

**Ngoài scope v1 (để sau):**

- Đính ảnh hóa đơn / screenshot giao dịch, và OCR tự động điền → **phase sau** (core value ban đầu, tạm hoãn vì phức tạp).
- Toàn bộ quản lý/phân tích nặng: cấu hình budget, money model, living plan, report/chart đầy đủ, đóng sổ tháng — **giữ trên web**.
- Bất kỳ tính năng tài chính *mới* nào chưa có trên web (mobile không mở rộng feature).

## Technical Considerations & Risks

- **⚠️ Rủi ro số 1 — hai codebase.** RN companion = duy trì **2 codebase song song** (web Next.js + mobile RN). Mỗi thay đổi logic ở tập chức năng chung (nhập giao dịch, tính toán quỹ/ngân sách) phải đồng bộ hai nơi. Cần chiến lược rõ về chia sẻ (types, business rules) để tránh drift.
- **Viết lại data + auth layer trong RN.** Supabase queries, TanStack Query hooks, Zod schemas, auth session — hiện dùng cho web — phải tái hiện trong RN. Cân nhắc tách phần chia sẻ được (types, validation, query keys) thành package dùng chung.
- **Auth + Face ID.** Session Supabase lưu an toàn (secure storage) + mở khóa biometric — không re-auth mỗi lần mở.
- **Offline sync.** Nhập offline rồi sync đòi hỏi queue + xử lý conflict; giữ đơn giản ở v1 (append-only, sync tuần tự).
- **Store compliance.** iOS + Android có yêu cầu review/store riêng (privacy, quyền notification); tính vào timeline.
- **Nhất quán business rule.** Fund ops phải qua atomic RPC, behavior_type readonly, is_system immutable — các bất biến này phải được tôn trọng y hệt trên mobile (gọi cùng RPC, không tái hiện logic sai lệch).

## Vision

Nếu v1 validate được thesis:

- **Phase sau — giảm ma sát sâu hơn:** đính ảnh hóa đơn / screenshot giao dịch, rồi OCR tự động điền amount/category — bước nhảy lớn nhất về trải nghiệm capture.
- **Mở rộng dần chức năng mobile:** đưa thêm màn hình quản lý phù hợp mobile khi có tín hiệu người dùng cần, tiến tới việc người dùng thương mại ít phụ thuộc vào web hơn.
- **Giai đoạn thương mại hóa:** trên nền dữ liệu và habit đã kiểm chứng, nghiên cứu mô hình sản phẩm cho gia đình Việt Nam (target, pricing, onboarding).

Bắc đẩu: GrowBase trở thành app tài chính gia đình mà người Việt mở hằng ngày *vì nó không cản đường họ* — ghi một khoản chi nhanh và nhẹ như một thao tác phản xạ.

## Open Questions

- **Thương mại hóa (D):** Khách hàng mục tiêu cụ thể? Mô hình giá (freemium / subscription)? — *người dùng hoãn thảo luận, chốt ở giai đoạn sau.*
- **Success criteria (E):** Các chỉ số ở phần Success Criteria đang là `[ASSUMPTION]` — cần người dùng chốt ngưỡng thực tế.
- **Chia sẻ code web ↔ RN:** Mức độ tách package dùng chung (types/rules/query keys) để giảm chi phí 2 codebase — cần quyết ở giai đoạn architecture.
