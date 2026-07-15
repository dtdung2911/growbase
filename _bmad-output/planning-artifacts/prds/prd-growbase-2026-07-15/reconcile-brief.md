# Reconcile — Brief → PRD (GrowBase Mobile)

Kiểm tra độ phủ giữa **input** (product brief + addendum) và **output** (PRD + addendum).
Mục tiêu: tìm ý brief nói mà PRD **bỏ sót** hoặc **mâu thuẫn** — đặc biệt intent chất lượng (tone/feel/value prop, capture-in-the-moment, < 15 giây, offline reasoning, 2-codebase risk).

Ngày: 2026-07-15. Không sửa file, chỉ báo cáo.

---

## Inputs

| Vai trò | File |
|---|---|
| Brief (input) | `briefs/brief-growbase-2026-07-15/brief.md` |
| Brief addendum (input) | `briefs/brief-growbase-2026-07-15/addendum.md` |
| PRD (output) | `prds/prd-growbase-2026-07-15/prd.md` |
| PRD addendum (output) | `prds/prd-growbase-2026-07-15/addendum.md` |

---

## A. Điểm đã phủ tốt (không cần lo)

- **Value prop friction-removal** — brief L12-16, L98 "ghi nhanh và nhẹ như thao tác phản xạ" → PRD Overview §1 + UJ-1/UJ-2/UJ-3 giữ được narrative capture-in-the-moment tốt.
- **4 native levers** (icon/no-domain, Face ID, offline-first, push) — brief L33-36 → PRD FR-1, FR-3, FR-18..20, FR-21..22. Đầy đủ.
- **Offline reasoning** — brief L35, L86 (queue, append-only, sync tuần tự, conflict đơn giản) → PRD FR-18/19/20, NFR-5, PRD addendum "Offline & Sync" (idempotent, client-generated id, cached read). Phủ tốt, thậm chí sâu hơn brief.
- **2-codebase risk** — brief L83-84 (rủi ro số 1), addendum L25 → PRD NFR-6 + PRD addendum "Kiến trúc 2-codebase" (shared package: types/Zod/rules/keys.ts, không share UI/data-fetching). Phủ tốt.
- **Business-rule bất biến** — brief L88, addendum L26 → PRD FR-9, NFR-3, PRD addendum. Đầy đủ.
- **Subset scope, giữ web các thao tác nặng** — brief L75-79 → PRD §6.2, FR-15/FR-17/FR-23. Nhất quán.
- **Success criteria + commercialization gate** — brief L57-60 → PRD SM-1..4 (giữ nguyên `[ASSUMPTION]`).
- **OCR/photo defer** — brief L77, L94 → PRD FR-10, §6.2.

---

## B. GAP / MÂU THUẪN (quan trọng)

### B1. [MÂU THUẪN — scope creep] FR-12 "biểu đồ đầy đủ (tương đương web)" trên mobile
- **Brief:** solution chỉ nói "xem **thống kê chi tiêu tháng**" (L14, L31, L68). Scope out-v1 ghi rõ **"report/chart đầy đủ ... giữ trên web"** (brief L78; PRD addendum §Rejected cũng liệt "Report/chart đầy đủ" là out-v1 tại prd §6.2 L112).
- **PRD:** FR-12 (L68) yêu cầu "danh sách + tỉ trọng **và biểu đồ đầy đủ (tương đương web, dùng chart library trên RN)**".
- **Xung đột:** "chart đầy đủ tương đương web" mâu thuẫn nguyên tắc phân vai (mobile = tra cứu nhanh, không phân tích đầy đủ) và mâu thuẫn chính §6.2 của PRD (report/chart đầy đủ giữ web). Cũng đội effort — đúng thứ brief muốn tránh (L45 "không phân tán effort tái tạo mọi màn hình web"). Cần hạ xuống mức "chart tóm tắt nhẹ" hoặc bỏ "đầy đủ".

### B2. [GAP — scope expansion không có trong brief] FR-2 đăng ký + onboarding parity trên mobile
- **Brief:** scope v1 (L64-73) **không** liệt đăng ký tài khoản mới hay onboarding. Solution ngụ ý dùng **cùng tài khoản web** (L14 "đăng nhập", addendum auth chỉ nói session/Face ID). Value prop cốt lõi = giảm ma sát, làm subset gọn ~4-5 màn hình (addendum L16).
- **PRD:** FR-2 (L52) thêm "**đăng ký tài khoản mới** trên mobile, kèm **onboarding tương đương web (welcome + tour + bước nhập thu nhập cố định)**".
- **Xung đột:** onboarding parity là màn hình nặng, không nằm trong "tập chức năng cao tần suất", đi ngược nguyên tắc "tập trung, không ôm đồm" (brief L45). Là quyết định scope mới cần user xác nhận, không phát sinh từ brief.

### B3. [GAP chất lượng — dropped intent] "Native feel thật" không thành requirement nào
- **Brief:** đây là **lý do chốt RN thay vì Capacitor/PWA** (brief L46 "native feel thật", "phản hồi tức thì"; addendum matrix L11-16, L16 "đánh đổi 2 codebase để lấy native feel tốt nhất"). Là differentiator #3.
- **PRD:** không có FR/NFR nào bắt buộc "native feel / mượt / phản hồi tức thì". NFR-8 (L102) chỉ là mobile UX generic (44px touch, 16px font, safe-area) — không capture ý định chất lượng khiến RN được chọn.
- **Rủi ro:** mất north star chất lượng → downstream dễ tạo ra app "chạy được" nhưng không mượt, làm vô hiệu hóa lý do tồn tại của việc chọn RN.

### B4. [MÂU THUẪN nội bộ + weakening] "< 15 giây" bị thu hẹp bằng "(đã unlock)"
- **Brief:** signal ma sát = "từ **'mở app'** đến 'lưu xong một giao dịch' < 15 giây" (L58) — đo end-to-end, **bao gồm** Face ID unlock. PRD UJ-1 (L33) cũng nói "**Toàn bộ** < 15 giây" kể cả Face ID.
- **PRD:** NFR-1 (L95) sửa thành "Từ mở app **(đã unlock)** đến lưu xong ... < 15 giây" — loại thời gian unlock.
- **Xung đột:** NFR-1 vừa yếu hơn brief vừa **mâu thuẫn chính UJ-1 và SM-2** (SM-2 L121 vẫn giữ "mở app → lưu"). Cần thống nhất một định nghĩa (khuyến nghị: end-to-end gồm unlock, đúng brief).

---

## C. Gap nhỏ / theo dõi (không chặn)

- **Store-compliance timeline:** brief L87 "tính vào timeline". PRD NFR-4 phủ compliance nhưng bỏ ý "tính vào timeline" (PRD không bàn timeline — chấp nhận được ở tầng PRD).
- **OCR "core value ban đầu":** brief L77/L94 nhấn OCR là *core value* chỉ tạm hoãn. PRD FR-10 chỉ nói "KHÔNG có ở v1", mất sắc thái "đây mới là bước nhảy lớn nhất". Vision không lặp trong PRD (PRD không có mục Vision) — cân nhắc thêm 1 dòng để giữ định hướng.
- **Primary user reframe:** brief L50 primary = "chính người xây dựng và gia đình". PRD 2.1 tổng quát hóa thành "thành viên gia đình" + thêm secondary "người theo dõi". Không sai nhưng làm nhạt bối cảnh dogfooding 3 tháng.
- **Push chạm → mở thẳng màn nhập:** brief không nói rõ, PRD FR-21 thêm (hợp lý, tăng cường intent capture — ghi nhận là bổ sung tốt).

---

## D. Khuyến nghị chỉnh PRD

1. FR-12: đổi "biểu đồ đầy đủ (tương đương web)" → "chart tóm tắt nhẹ cho tra cứu nhanh"; report/chart đầy đủ giữ web (khớp §6.2).
2. FR-2: tách "đăng ký + onboarding parity" ra thành Open Question / cần user xác nhận, hoặc scope xuống (login-only v1).
3. Thêm 1 NFR "native feel": tương tác mượt, phản hồi tức thì, không cảm giác web-wrapper — làm rõ intent chọn RN.
4. NFR-1: bỏ "(đã unlock)", đồng bộ với UJ-1/SM-2 (đo end-to-end gồm Face ID).
