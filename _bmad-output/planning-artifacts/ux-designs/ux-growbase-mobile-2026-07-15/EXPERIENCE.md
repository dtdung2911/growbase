---
title: "EXPERIENCE — GrowBase Mobile"
status: final
created: 2026-07-15
updated: 2026-07-15
design: ./DESIGN.md
sources:
  - ../../../specs/spec-growbase-mobile/SPEC.md
  - ../../architecture/architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md
---

# EXPERIENCE — GrowBase Mobile

## Foundation
- **Form-factor:** mobile, primary 375px. iOS + Android.
- **UI system:** React Native native primitives (Expo). Không webview. Visual identity ref: `DESIGN.md`.
- **Bản chất:** companion — *capture nhanh + tra cứu nhanh*; thao tác nặng ở web. Native feel là ràng buộc chất lượng (SPEC constraint / spine NFR-9).

## Information Architecture
Bottom tab nav 4 mục + **center FAB `+`** (add-transaction):

1. **Home** — glance: "hôm nay tiêu được bao nhiêu", tổng chi tháng vs budget, giao dịch gần đây, offline/sync banner.
2. **Transactions** — list giao dịch, sửa/xóa (CAP-2).
3. **Stats** — thống kê tháng: donut theo category, bar theo group, đối chiếu budget (CAP-3).
4. **Menu** — Funds (CAP-4), Budget (CAP-5), switch household, Settings (ngôn ngữ/theme/giờ nhắc), Logout.

**FAB `+`** → bottom sheet quick-add (CAP-2, luồng <15s). `[ASSUMPTION]` cấu trúc tab — xác nhận khi review.

Surface closure: mỗi CAP có surface; Add(FAB)→CAP-2, Home/Stats→CAP-3, Menu→CAP-4/5/8, cold-start→CAP-1, banner/chip→CAP-6, settings→CAP-7/8.

## Voice and Tone
Tiếng Việt thân thiện, ngắn. Microcopy nhắc: "Hôm nay bạn chưa ghi khoản chi nào — ghi nhanh nhé". Lỗi: cụ thể, không đổ lỗi. Empty state: khuyến khích ("Chạm + để ghi khoản đầu tiên"). Mọi chuỗi qua `t()` (vi/en).

## Component Patterns (behavioral)
- **Quick-add sheet:** mở từ FAB. Thứ tự focus: amount (native number keypad bật sẵn) → category quick-pick (recent/thường dùng lên đầu) → ngày (default hôm nay) → quỹ (default) → Lưu. Tối thiểu chạm.
- **Category quick-picker:** grid recent + search; ít cuộn.
- **Transaction row:** swipe → Sửa / Xóa; hiển thị sync chip nếu pending/error.
- **Sync chip:** trạng thái pending/synced/error (màu semantic).
- **Biometric unlock screen:** cold start → Face ID prompt; fallback passcode.
- **Stat card:** số mono lớn + mini chart; chạm → chi tiết.

## State Patterns
- **Loading:** skeleton (list/stat), không spinner toàn màn.
- **Empty:** minh họa + CTA ghi khoản đầu.
- **Error:** giữ form + toast.error 5s (nhất quán web).
- **Success:** toast.success 2s.
- **Offline:** banner "Đang offline — ghi vẫn lưu, sẽ sync sau".
- **Sync (per-transaction):** pending → synced (chip biến mất) hoặc error (retry action).
- **Optimistic add:** giao dịch hiện ngay với chip pending.
- **Cached view:** chỉ báo "Số liệu tính đến {time}" khi offline.

## Interaction Primitives
- FAB tap → sheet (spring animation, native).
- Swipe row → reveal edit/delete.
- Pull-to-refresh trên Home/Transactions/Stats.
- Biometric gate on cold start / resume sau timeout.
- Tab tap → switch; long-content scroll native momentum.
- Notification tap → deep link màn quick-add.

## Accessibility Floor
- Touch ≥ 44px; input font ≥ 16px.
- Contrast đạt WCAG AA (token DESIGN.md).
- Screen-reader labels cho FAB, sync chip, icon-only buttons.
- Respect reduce-motion (giảm spring/animation).
- Dynamic type: số/label scale theo OS font size ở mức hợp lý.

## Key Flows

**F1 — Nhập giao dịch ở siêu thị (Dũng, ba 2 con) `[CLIMAX]`.**
Thanh toán xong → rút điện thoại → chạm icon → **Face ID** mở tức thì → chạm **FAB +** → number keypad đã sẵn, gõ `350000` → chạm category "Ăn uống" (đứng đầu recent) → ngày/quỹ default → **Lưu** → toast 2s + về Home thấy số cập nhật. **< 15s, không domain, không đăng nhập lại.** *Offline variant:* tầng hầm mất sóng → vẫn lưu, chip `pending`, banner offline; ra ngoài → tự sync → chip biến mất.

**F2 — Liếc stats (vợ Dũng).** Mở app → tab Stats → donut category + bar group + budget compare; thấy "Ăn uống" đỏ (vượt) → nhắn chồng. Không thao tác nặng.

**F3 — Onboarding tài khoản mới `[native tour]`.** Đăng ký → welcome screen → tour native (coach-mark từng tab, KHÔNG dùng driver.js web) → bước nhập thu nhập cố định (income step, logic dùng chung `packages/shared`) → vào Home.

**F4 — Switch household.** Menu → chọn household khác → **cache purge** (spine AD-M9) → load dữ liệu household mới → về Home. Chỉ báo đang đổi.

## Responsive & Platform
- iOS: `NSFaceIDUsageDescription`, home-indicator safe-area, swipe-back.
- Android: notification channel, hardware back button (đóng sheet/về tab trước), edge-to-edge.
- Notification permission prompt đúng lúc (sau onboarding, không chặn đầu).
- Cả hai: dark/light theo OS + toggle trong Settings.
