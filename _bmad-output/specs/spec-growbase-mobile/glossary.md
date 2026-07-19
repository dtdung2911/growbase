# Glossary — GrowBase Mobile

- **Household:** đơn vị gia đình chia sẻ dữ liệu tài chính. Người dùng có thể thuộc nhiều household.
- **Fund (quỹ):** 5 loại — emergency / sinking / goal / investment / freedom.
- **Budget line:** dòng ngân sách (18 dòng) map tới category (38 category, 20 group, 7 cost type).
- **Transaction (giao dịch):** khoản thu/chi gắn category, fund, ngày, ghi chú.
- **currentMonth:** tháng đang xem (`YYYY-MM`), nằm trong Zustand store.
- **Companion app:** mobile phục vụ nhập nhanh + tra cứu nhanh; web giữ quản lý + phân tích đầy đủ.
- **LargeSecureStore:** pattern lưu session an toàn — khóa AES-256 trong expo-secure-store, session mã hóa trong MMKV.
- **Idempotency-Key:** khóa client sinh, gắn mỗi mutating call để backend dedupe khi replay offline.
