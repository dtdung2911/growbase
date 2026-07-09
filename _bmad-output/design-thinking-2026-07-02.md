# Design Thinking Session: growbase

**Date:** 2026-07-02
**Facilitator:** DzungDuong
**Design Challenge:** GrowBase đã có ~60% tính năng quản lý tài chính gia đình nhưng thiếu narrative xuyên suốt — người dùng mới không hiểu "vì sao" phải làm từng bước, khiến các tính năng (onboarding, setup, xem báo cáo) trở nên rời rạc thay vì một hành trình có ý nghĩa.

---

## 🎯 Design Challenge

**Bối cảnh:** GrowBase là app quản lý tài chính gia đình, đã build được khoảng 60% tính năng cốt lõi (fund management, transaction, budget, báo cáo...). Tuy nhiên trải nghiệm hiện tại thiếu một "sợi dây câu chuyện" xuyên suốt — đặc biệt rõ ở 3 điểm chạm: **onboarding lần đầu**, **thời điểm nhận diện vấn đề/nhu cầu tài chính mới**, và **xem báo cáo**. User không tự trả lời được "mình đang làm gì và vì sao" — các bước trở thành thao tác kỹ thuật rời rạc.

**Đối tượng chính:** Người dùng mới, chưa có kiến thức quản lý tài chính cá nhân sâu (đại diện: DzungDuong tự đặt mình vào vai user mới để dogfood).

**Ràng buộc:** Không giới hạn — có thể điều chỉnh UI, copy, flow, thậm chí logic nếu cần.

**Định nghĩa thành công (draft):** Trải nghiệm trở thành một hành trình có mạch truyện — user hiểu ngay "vì sao" ở mỗi bước, độ phức tạp tính toán/tổng hợp được ẩn phía sau, chỉ hiện kết quả đơn giản và mang tính đồng hành (vd: thông báo dạng "Hôm nay bạn còn 40.000đ để chi tiêu cá nhân, cùng hướng tới mục tiêu nhé!").

**Research context:** Tự trải nghiệm (dogfooding) trong vai user mới, chưa có test với user thật khác — sẽ là nguồn insight chính cho bước Empathize.

---

## 👥 EMPATHIZE: Understanding Users

**Phương pháp:** Dogfooding (tự trải nghiệm trong vai user mới) + Party-mode round table (đa góc nhìn PM/UX/Analyst/Storyteller/Architect/Engineer/Innovation).

### User Insights

- Bước **đầu tiên** của onboarding ("Loại hộ: Cá nhân / Gia đình") đã gây hiểu sai: user đọc thành "ai đang ngồi trước máy" thay vì "household này có mấy thành viên" → user định dùng cho cả gia đình vẫn chọn "Cá nhân", data model sai từ giây thứ 10.
- Chuỗi step sau đó khó hiểu, không giải thích "vì sao" → cảm giác "nộp thuế": khai một đống form, không nhận lại gì.
- Sau khi setup xong, **dashboard trống trơn** — user mới không biết làm gì tiếp → setup xong là quên luôn app.
- User hiểu cấu trúc 38 categories vì tự xây Google Sheet gốc; người dùng mới nhìn vào chỉ thấy ma trận — mental model bị bê nguyên từ spreadsheet sang app.

### Key Observations

- App đang bắt user trả lời câu hỏi của **database**, không phải câu hỏi của **cuộc đời họ**.
- Flow hiện tại: *setup toàn bộ cấu trúc → rồi mới dùng*. Cần lật ngược: *dùng ngay → cấu trúc tự mọc quanh hành vi*.
- Khoảnh khắc "north star": "Hôm nay bạn còn 40.000đ để chi tiêu cá nhân, cùng hướng tới mục tiêu nhé!"

### Empathy Map Summary

| | User mới (chưa rành tài chính) |
|---|---|
| **Says** | "Loại hộ là gì?", "Bước này để làm gì?", "Setup xong rồi... giờ sao?" |
| **Thinks** | "Chắc chọn Cá nhân vì mình đang ngồi một mình", "App này phức tạp quá" |
| **Does** | Chọn sai loại hộ, lướt nhanh qua các step, setup xong đóng app, không quay lại |
| **Feels** | Mơ hồ, bị bỏ rơi, không thấy giá trị nhận lại — muốn được đồng hành chứ không muốn học kế toán |

---

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

**Người dùng mới chưa rành quản lý tài chính** cần **nhận được giá trị thật (bức tranh tài chính + lời đồng hành) trước khi phải hiểu bất kỳ khái niệm nào của app**, bởi vì **onboarding hiện tại bắt họ trả lời câu hỏi của database và "nộp thuế" form mà không nhận lại gì — nên họ setup sai, không hiểu vì sao, và quên app ngay sau đó**.

### How Might We Questions

1. HMW cho user thấy **thành quả trước** khi bắt họ nhập bất cứ thứ gì?
2. HMW biến mỗi input của onboarding thành một "món quà" nhận lại ngay?
3. HMW để cấu trúc app (funds, categories, budget) **tự mọc quanh hành vi** thay vì bắt setup trước?
4. HMW làm **mục tiêu gia đình** trở thành xương sống narrative xuyên suốt app?
5. HMW cho user lý do quay lại vào **ngày mai** ngay từ cuối ngày 0?

### Key Insights

- Câu hỏi onboarding chỉ được tồn tại nếu nó **đổi hành vi của app** (tạo entity thật, đổi flow) — không đổi được gì thì cắt.
- Hai mặt trận riêng biệt, không gộp: **cửa vào** (first-run experience) và **lý do quay lại** (daily insight).
- Quyết định "Cá nhân/Gia đình" thuộc về *khoảnh khắc có ý nghĩa* (lúc mời người thứ hai), không phải form đăng ký.

---

## 💡 IDEATE: Generate Solutions

### Selected Methods

- **Party-mode round table** (7 personas: PM, UX, Analyst, Architect, Engineer, Storyteller, Innovation Oracle) — thay cho brainstorm nhóm truyền thống.
- **Provocation** (Victor): "Xoá toàn bộ onboarding — mở app vào thẳng dashboard demo."
- **Constraint-based**: mỗi câu hỏi onboarding phải tạo entity thật hoặc bị cắt.

### Generated Ideas

1. Xoá câu hỏi "Loại hộ" — household mặc định 1 thành viên, tự thành "Gia đình" khi mời người thứ hai
2. Màn Hook: dashboard demo "gia đình mẫu" có sẵn số liệu sống động (JSON read-only client-side, không ghi DB)
3. Ranh giới demo/thật rõ ràng: "Đây là nhà Minnie. Giờ đến lượt nhà bạn →"
4. Onboarding hỏi mục tiêu: "Bạn muốn gì cho gia đình mình?" — chọn 1 từ danh sách gợi ý có số mặc định thông minh (Quỹ khẩn cấp = 3 tháng chi tiêu, Quỹ học con = 200tr/5 năm...)
5. Mục tiêu = **goal fund thật**: tên + số đích + thời hạn (không phải text trang trí)
6. Thu nhập tháng: một con số duy nhất, gắn nhãn **household income** (không gắn cá nhân người nhập)
7. Màn Tada: app tự dựng budget mặc định (38 categories seed sẵn) + goal fund + phán tính khả thi: "(đích − hiện có)/số tháng = 2tr/tháng — khả thi ✓"
8. Tiến độ mục tiêu = 2 đường: thực tế vs kỳ vọng → máy sinh narrative ("về đích sớm 2 tháng 🎉" / "góp thêm 500k là bắt kịp")
9. Mục tiêu thấm vào insight hàng ngày: "còn 40k hôm nay *vì* 2tr tháng này đã để dành cho mục tiêu"
10. Dashboard ngày 0: CTA duy nhất "Ghi khoản chi đầu tiên — thử ly cà phê sáng nay?" (30 giây)
11. Cuối onboarding cài lời hứa: "Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch"
12. Mời vợ/chồng tại khoảnh khắc có nghĩa (sau tuần đầu dùng đều / khi có tín hiệu), không nhét vào onboarding
13. Câu chào buổi sáng trên dashboard: một câu, số thật, giọng người thật
14. Khi người thứ hai vào: câu chuyện nâng cấp thành "chuyện chung" — thông báo chung khi đạt mốc mục tiêu

### Top Concepts

**Concept 1 — Onboarding "mở quà" 4 bước (ưu tiên cao nhất):**
`Hook (dashboard demo) → Mục tiêu (1 goal, gợi ý sẵn) → Thu nhập (1 con số household) → Tada (bức tranh của chính họ + tính khả thi)`
— 4 bước, chỉ 2 bước nhập liệu.

**Concept 2 — Goal-driven narrative:** mục tiêu là xương sống — goal fund thật, tiến độ thực tế vs kỳ vọng, thấm vào insight hàng ngày.

**Concept 3 — Ngày 0 không trống:** dashboard sau onboarding có sẵn mục tiêu + budget, một CTA duy nhất (ghi khoản chi đầu tiên) + lời hứa ngày mai.

---

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

_(sẽ điền ở bước tiếp theo)_

### Prototype Description

_(sẽ điền ở bước tiếp theo)_

### Key Features to Test

_(sẽ điền ở bước tiếp theo)_

---

## ✅ TEST: Validate with Users

### Testing Plan

_(sẽ điền ở bước tiếp theo)_

### User Feedback

_(sẽ điền ở bước tiếp theo)_

### Key Learnings

_(sẽ điền ở bước tiếp theo)_

---

## 🚀 Next Steps

### Refinements Needed

_(sẽ điền ở bước tiếp theo)_

### Action Items

_(sẽ điền ở bước tiếp theo)_

### Success Metrics

_(sẽ điền ở bước tiếp theo)_

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
