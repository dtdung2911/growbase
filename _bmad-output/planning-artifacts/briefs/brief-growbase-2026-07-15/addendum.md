# Addendum — GrowBase Mobile

Chi tiết bổ trợ cho `brief.md`, dành cho các bước downstream (PRD, architecture). Không đưa vào brief chính vì đây là phần depth/rationale, không phải nội dung cốt lõi.

## Options Considered — Delivery Technology

Quyết định tech đã đi qua vài vòng trước khi chốt. Ghi lại để tránh xét lại không cần thiết ở bước architecture.

| Phương án | Bản chất | Ưu | Nhược | Kết luận |
|---|---|---|---|---|
| **RN full parity** | Viết lại toàn bộ app bằng React Native | Native feel tối đa, mobile-first hoàn toàn | ~3x effort để *bằng* web đã có; 1 dev / 3 tháng không khả thi; đổ effort vào phần ít mở khóa giá trị | ❌ Loại |
| **PWA** | Web responsive + service worker + manifest | Rẻ nhất, reuse ~100%, có push/offline/icon | Không lên được App Store/Play; Face ID chỉ qua WebAuthn; native feel hạn chế | ❌ Không chọn (cần lên store) |
| **Capacitor** | Bọc web hiện tại vào shell native | Reuse ~100% web, lên store được, native plugin cho camera/FaceID/push | Vướng khi đóng gói Next.js App Router; native feel "khá" chứ không tối đa | ⚠️ Từng chốt, sau đó đảo |
| **RN companion** ✅ | RN dựng *subset* màn hình cao tần suất, dùng chung Supabase | Native feel tốt nhất cho tập nhập/tra cứu; tập trung; RN không còn là rewrite vì scope nhỏ | Duy trì 2 codebase; viết lại data/auth layer trong RN | ✅ **CHỐT** |

**Lý do chốt RN companion:** khi scope thu về *subset gọn* (nhập giao dịch + thống kê tháng + quỹ + ngân sách) thay vì full parity, lập luận "RN = rewrite toàn bộ" không còn đúng — chỉ dựng ~4-5 màn hình mới. Đánh đổi 2 codebase là chấp nhận được để lấy native feel tốt nhất ở đúng tập chức năng cao tần suất.

## Rejected Ideas — Scope

- **Full parity trên mobile:** loại. Thao tác nặng (cấu hình budget 38 category, money model, đóng sổ) không hợp mobile và không phải nơi tạo giá trị mới. Giữ ở web.
- **Photo attach + OCR trong v1:** hoãn sang phase sau. Là core value ban đầu (scan hóa đơn / screenshot bank) nhưng phức tạp; v1 dùng form nhập tay như web để giảm rủi ro khi giao hàng.

## Technical Depth — cho Architecture

- **Chia sẻ code web ↔ RN:** cân nhắc tách package dùng chung: TypeScript types, Zod schemas, business rules, query key factory (`keys.ts`). Giảm drift giữa 2 codebase.
- **Business-rule bất biến phải giữ trên mobile:** fund ops = atomic RPC only; behavior_type = DB trigger readonly; is_system=true immutable; auth check first. Mobile gọi cùng RPC, không tái hiện logic.
- **POC ưu tiên trước khi cam kết:** auth session Supabase trong RN + secure storage + Face ID unlock; offline queue (append-only, sync tuần tự) cho nhập giao dịch.

## Deferred / Open (từ Discovery)

- Thương mại hóa: target customer + pricing model — người dùng hoãn.
- Success criteria: ngưỡng thực tế chưa chốt (brief để `[ASSUMPTION]`).
