# Addendum — Onboarding v2 & Goal-driven Narrative

Nội dung kỹ thuật/how thuộc downstream (architecture, UX spec), không thuộc PRD. Nguồn: design thinking session + party-mode round table 02-07-2026.

## Mapping vào hệ thống hiện có

- **Goal onboarding → fund type `goal`** có sẵn trong schema (5 fund types: emergency/sinking/goal/investment/freedom). Quỹ khẩn cấp gợi ý map vào type `emergency`. Tạo qua atomic RPC hiện hành (non-negotiable rule #1).
- **Categories + budget mặc định:** seed 38 categories / 18 budget lines đã có (khớp Google Sheet) — màn Tada gọi seed này thay vì bắt user cấu hình.
- **Tài khoản mặc định:** tạo account "Tài khoản chính" ngầm; user đổi tên/thêm account sau trong Settings.
- **Household income:** lưu ở mức household, không gắn user_id người nhập — cho phép tách người góp sau khi có thành viên thứ hai (quyết định của Mary trong party).

## Insight layer (đề xuất kiến trúc của Winston)

- Một tầng tổng hợp duy nhất biến số liệu thành câu nói — **không** rải logic narrative vào từng component UI.
- Công thức daily insight v1: `còn lại hôm nay = (tổng budget linh hoạt tháng − đã chi trong tháng) / số ngày còn lại`. "Budget linh hoạt" = các nhóm chi tiêu biến đổi, loại trừ cố định (thuê nhà, học phí...) và khoản góp mục tiêu.
- Đường kỳ vọng goal: tuyến tính `target × (ngày đã qua / tổng ngày)`; so với balance thực → chọn template narrative (trước/đúng/sau kỳ vọng).
- Insight là template có tham số, chọn theo trạng thái — không sinh tự do, để kiểm soát tone và i18n.

## Demo "nhà Minnie"

- File JSON tĩnh trong bundle client, render bằng đúng components dashboard thật (đảm bảo demo = ảnh thật của sản phẩm).
- Read-only snapshot, không ghi DB → không cần cleanup (Winston). Rủi ro lẫn demo/thật là feature-to-test #1 (Victor).
- Cần bản vi + en của toàn bộ demo data (tên, ghi chú giao dịch).

## Wizard cũ — phần bị thay thế

`src/app/setup/SetupClient.tsx` wizard 7 bước (Type → Invite → Income → Accounts → Debt → Categories → Budget) và `src/app/api/onboarding/complete`. Các component step cũ có thể giữ lại phần Income làm nền cho màn Thu nhập mới; phần còn lại thay thế.

## Lý do đã bác (rejected alternatives)

- **Tour guide/coach marks:** bác — tour là băng dán cho sản phẩm khó hiểu; demo dashboard chính là tour (Victor).
- **Nhiều mục tiêu ở onboarding:** bác — câu chuyện cần một nhân vật chính; multi-goal sau trong app (Sophia/Sally).
- **Mời vợ/chồng trong onboarding:** bác — lời mời lúc chưa thấy giá trị có tỉ lệ chấp nhận thấp; chuyển sang khoảnh khắc có nghĩa (Sally/John).
- **Demo ghi vào DB rồi dọn:** bác — snapshot client-side loại bỏ hẳn lớp rủi ro cleanup (Winston vs Amelia).
- **Goal dạng text tự do:** bác — mục tiêu phải là entity đo được (đích + thời hạn), nếu không là trang trí (Mary, cắm cờ 3 lần).
