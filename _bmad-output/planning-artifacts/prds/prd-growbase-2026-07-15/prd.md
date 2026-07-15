---
title: "PRD: GrowBase Mobile (React Native)"
status: final
created: 2026-07-15
updated: 2026-07-15
---

# PRD: GrowBase Mobile

## 0. Context

Companion mobile app (React Native, iOS + Android) cho GrowBase — web app quản lý tài chính gia đình (Next.js 14 + Supabase). Mobile phục vụ tập chức năng cao tần suất khi di động: **nhập giao dịch nhanh, xem thống kê chi tiêu tháng, xem quỹ, xem ngân sách**. Dùng chung backend Supabase với web.

Nguồn: `brief-growbase-2026-07-15/brief.md` + `addendum.md`. Chi tiết technical-how ở `addendum.md` của PRD này.

**Nguyên tắc phân vai:** mobile = nhập nhanh + tra cứu nhanh; web = quản lý + phân tích đầy đủ.

## 1. Overview

GrowBase Mobile xóa ma sát *ghi nhận tức thời* mà web không giải được: mở app từ icon (không cần nhớ domain), unlock bằng Face ID, nhập giao dịch trong vài giây kể cả khi mất mạng, và nhận push notification nhắc ghi chép. Mục tiêu v1 (3 tháng): validate giả thuyết "companion mobile không ma sát giữ chân người dùng ghi chép hằng ngày", làm bàn đạp thương mại hóa.

## 2. Users & Journeys

### 2.1 Target Users
- **Người ghi chép chính (primary):** thành viên gia đình nhập chi tiêu hằng ngày, thường xuyên di chuyển, cần nhập/tra cứu nhanh trên điện thoại.
- **Người theo dõi (secondary):** thành viên khác trong household liếc thống kê / ngân sách để nắm tình hình.

### 2.2 Non-Users (v1)
- Người làm thao tác quản lý nặng (cấu hình budget, money model, đóng sổ tháng) — họ dùng web.

### 2.3 User Journeys

**UJ-1 — Nhập chi tiêu tại siêu thị (Dũng, ba 2 con).** Dũng vừa thanh toán 350.000đ ở siêu thị. Rút điện thoại → chạm icon GrowBase → Face ID mở khóa tức thì → màn nhập nhanh → gõ số tiền, chọn category "Ăn uống/Sinh hoạt", để mặc định ngày hôm nay và quỹ chi tiêu → lưu. Toàn bộ < 15 giây, không cần nhớ domain, không đăng nhập lại. Nếu sóng yếu ở tầng hầm siêu thị, giao dịch vẫn lưu offline và tự sync khi ra ngoài.

**UJ-2 — Liếc "tháng này tiêu bao nhiêu" (vợ Dũng).** Đang đợi con tan học, mở app → màn thống kê tháng: tổng chi tháng này, chi theo category, và mỗi budget line còn lại bao nhiêu (xanh/đỏ). Biết ngay tháng này ăn uống đã vượt ngân sách → nhắn chồng. Không mở web, không thao tác nặng.

**UJ-3 — Nhắc ghi chép cuối ngày (Dũng).** 21h, push notification "Hôm nay bạn chưa ghi khoản chi nào — ghi nhanh nhé". Chạm → mở thẳng màn nhập nhanh. Thói quen daily được duy trì.

## 3. Glossary

- **Household:** đơn vị gia đình chia sẻ dữ liệu tài chính. Người dùng có thể thuộc nhiều household.
- **Fund (quỹ):** 5 loại — emergency / sinking / goal / investment / freedom.
- **Budget line:** dòng ngân sách (18 dòng) map tới các category (38 category, 20 group, 7 cost type).
- **Transaction (giao dịch):** một khoản thu/chi gắn category, fund, ngày, ghi chú.
- **currentMonth:** tháng đang xem (`YYYY-MM`), nằm trong app state.

## 4. Functional Requirements

### FG-A — App Shell, Auth & Context

- **FR-1:** App cài từ App Store (iOS) và Play Store (Android), có app icon riêng, mở không cần nhập URL/domain.
- **FR-2:** Đăng nhập bằng email/password qua Supabase Auth (cùng tài khoản web). Hỗ trợ **đăng ký tài khoản mới** trên mobile, kèm **onboarding** tương đương web (welcome + tour + bước nhập thu nhập cố định).
- **FR-3:** Sau đăng nhập lần đầu, session lưu an toàn (secure storage); những lần mở app sau chỉ cần **Face ID / biometric**, không nhập lại mật khẩu. `[ASSUMPTION]` có fallback passcode/password khi biometric fail.
- **FR-4:** App load context từ state dùng chung: `householdId` + `currentMonth`. Cho phép **switch household** (nếu user thuộc >1) và **đổi tháng**, mặc định household gần nhất + tháng hiện tại.
- **FR-5:** Hỗ trợ i18n vi (mặc định) + en, và light/dark theme — nhất quán với web. `[ASSUMPTION]` đọc preference từ account, có toggle trong settings mobile.

### FG-B — Nhập giao dịch

- **FR-6:** Tạo giao dịch mới với các trường như web: số tiền, category, ngày (mặc định hôm nay), quỹ/hướng (thu/chi), ghi chú (optional).
- **FR-7:** Màn nhập tối ưu tốc độ: bàn phím số bật sẵn cho amount, category chọn nhanh (recent/thường dùng lên đầu), ngày + quỹ có default → mục tiêu: ít lần chạm nhất để lưu 1 giao dịch (đo bằng SM-2/NFR-1).
- **FR-8:** Xem danh sách giao dịch gần đây và **sửa/xóa** giao dịch (giao dịch do mình tạo trong tháng hiện tại).
- **FR-9:** Ghi/sửa giao dịch phải tôn trọng business rule của hệ thống: fund ops qua **atomic RPC**, `behavior_type` readonly, không tái hiện sai logic ở phía client.
- **FR-10 (ngoài v1, ghi để rõ ranh giới):** Đính ảnh hóa đơn / screenshot giao dịch và OCR tự động điền — **KHÔNG có ở v1** (xem §6, §Vision brief).

### FG-C — Thống kê chi tiêu tháng

- **FR-11:** Xem tổng chi tiêu của `currentMonth`.
- **FR-12:** Xem chi tiêu theo category/group trong tháng: danh sách + tỉ trọng, **kèm biểu đồ** — v1 gồm donut chi theo category và bar chi theo group/tháng (dùng RN chart lib, ví dụ `victory-native` hoặc `react-native-gifted-charts`). *(Đây là chart thống kê tháng cơ bản; report/phân tích chuyên sâu vẫn ở web — xem §6.2.)*
- **FR-13:** Xem chi tiêu tháng đối chiếu ngân sách (đã tiêu / còn lại theo budget line), có tín hiệu vượt ngưỡng.

### FG-D — Quỹ (Funds)

- **FR-14:** Xem danh sách quỹ (5 loại) với số dư và trạng thái hiện tại, nhóm theo loại như web.
- **FR-15 (ngoài v1):** Thao tác contribute/withdraw quỹ **giữ ở web v1** (thao tác có RPC + xác nhận, không thuộc "tra cứu nhanh"). Mobile chỉ xem.

### FG-E — Ngân sách (Budget)

- **FR-16:** Xem các budget line của `currentMonth`: ngân sách, đã chi, còn lại, % sử dụng, tín hiệu vượt.
- **FR-17 (ngoài v1):** Tạo/sửa budget, cấu hình money model — **giữ ở web**.

### FG-F — Offline & Sync

- **FR-18:** Tạo giao dịch được khi offline; lưu vào hàng đợi local, tự sync khi online lại (append-only, sync tuần tự để tránh conflict phức tạp).
- **FR-19:** Khi offline, xem được dữ liệu đã sync gần nhất (thống kê/quỹ/budget ở trạng thái cached), có chỉ báo "dữ liệu tính đến {thời điểm}".
- **FR-20:** Hiển thị trạng thái sync (đang chờ sync / đã sync / lỗi sync) cho giao dịch tạo offline.

### FG-G — Push Notifications

- **FR-21:** v1 chỉ có **nhắc ghi chép hằng ngày** (reminder cuối ngày nếu chưa ghi giao dịch nào). Chạm notification → mở thẳng màn nhập nhanh.
- **FR-22:** User bật/tắt và đặt giờ nhắc trong settings mobile.
- **FR-23 (ngoài v1):** Cảnh báo vượt budget, scheduled payment tới hạn — **defer** sang phase sau.

## 5. Non-Functional Requirements

- **NFR-1 (Performance):** End-to-end từ chạm icon → Face ID unlock → lưu xong 1 giao dịch < 15 giây (khớp UJ-1, SM-2). Cold start tới màn nhập ≤ 3 giây trên thiết bị tầm trung.
- **NFR-2 (Security):** Session lưu secure storage; biometric unlock; mọi truy cập dữ liệu qua Supabase RLS như web; auth check trước mọi thao tác. Không lưu mật khẩu dạng thô.
- **NFR-3 (Data integrity):** Các bất biến business rule giữ y hệt web — fund ops atomic RPC, `is_system=true` immutable, `behavior_type` do DB trigger. Client mobile không được vi phạm.
- **NFR-4 (Platform):** iOS + Android, tuân thủ yêu cầu review 2 store (privacy, quyền camera nếu dùng, quyền notification). `[ASSUMPTION]` iOS 15+ / Android tương đương.
- **NFR-5 (Reliability/Offline):** Không mất dữ liệu giao dịch tạo offline; sync idempotent, không tạo bản ghi trùng khi retry.
- **NFR-6 (Consistency web↔mobile):** Types, Zod schemas, business rules, query keys nên chia sẻ để tránh drift giữa 2 codebase (chi tiết ở addendum).
- **NFR-7 (i18n & Theme):** vi/en + light/dark, không hardcode chuỗi/màu.
- **NFR-8 (Mobile UX):** touch target ≥ 44px, input font ≥ 16px, an toàn với notch/safe-area.
- **NFR-9 (Native feel — north star):** Lý do chọn React Native thay Capacitor/PWA là *cảm giác native thật* ở tập nhập/tra cứu cao tần suất. Điều hướng, cuộn, phản hồi chạm phải mượt/tức thì như app native; không được tạo cảm giác "web bọc trong app".

## 6. Scope

### 6.1 Trong v1
Đăng ký + onboarding · nhập giao dịch (create/edit/delete) · thống kê chi tiêu tháng (list + chart đầy đủ + đối chiếu budget) · xem quỹ · xem ngân sách · app icon + store · Face ID unlock · offline entry + sync · push nhắc ghi chép hằng ngày · i18n + theme.

### 6.2 Ngoài v1 (phase sau)
- Đính ảnh hóa đơn / screenshot + OCR tự động điền.
- Contribute/withdraw quỹ, tạo/sửa budget, money model, đóng sổ tháng (giữ web).
- Report và phân tích chuyên sâu (ngoài thống kê tháng cơ bản ở FR-11–13), living plan.
- Push nâng cao (budget alert, scheduled payment due).
- Bất kỳ tính năng tài chính *mới* chưa có trên web.

## 7. Success Metrics

`[ASSUMPTION]` — ngưỡng cần user chốt:

- **SM-1 (Habit):** Người dùng + gia đình nhập giao dịch ≥ 5 ngày/tuần qua mobile, xuyên suốt 3 tháng.
- **SM-2 (Ma sát):** Thời gian trung bình mở app → lưu 1 giao dịch < 15 giây.
- **SM-3 (Độ đầy đủ dữ liệu):** `[ASSUMPTION]` Tỉ lệ giao dịch ghi *trong ngày phát sinh* ≥ 70% (so với baseline giai đoạn chỉ dùng web) — ngưỡng cần user chốt.
- **SM-4 (Cổng thương mại hóa):** Sau 3 tháng, SM-1 đạt → chuyển giai đoạn nghiên cứu thương mại hóa.

**Counter-metrics:**
- **SM-C1:** Không tăng SM-1 bằng bản ghi trùng do lỗi sync — số giao dịch trùng/hủy ≈ 0.
- **SM-C2:** Dữ liệu mobile khớp web (không sai lệch số dư quỹ/budget do client tính sai).

## 8. Open Questions

- Success metrics (SM-1..4): ngưỡng thực tế — chờ user chốt.
- Thương mại hóa: target customer + pricing — hoãn (từ brief).
- POC kỹ thuật: xác nhận cách share code web↔RN + auth/offline trong RN (xem addendum) trước khi vào architecture.

## 9. Assumptions Index

Các `[ASSUMPTION]` còn lại trong PRD — cần xác nhận/hiệu chỉnh ở UX/architecture hoặc với user:

- **FR-3:** Có fallback passcode/password khi Face ID fail.
- **FR-5:** i18n + theme preference đọc từ account, có toggle trong settings mobile.
- **NFR-4:** Nền tảng tối thiểu iOS 15+ / Android tương đương.
- **SM-1..4:** Ngưỡng success metric (≥5 ngày/tuần, <15s, SM-3 ≥70%, cổng thương mại hóa) — chờ user chốt số thực tế.
