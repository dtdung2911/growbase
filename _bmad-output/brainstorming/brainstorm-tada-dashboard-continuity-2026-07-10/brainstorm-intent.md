# Brainstorm Intent — Tada ↔ Dashboard Continuity (10-07-2026)

Session: Creative Partner · 5 lens (What If, First Principles, Kiểm kê Khái niệm Mồ côi*, Người kể chuyện đổi vai*, Tháng Địa Ngục*) — (*) kỹ thuật tự chế. Memlog: `.memlog.md` (37 entries). Status: complete.

## Vấn đề

Tada onboarding vẽ bức tranh (3 giai đoạn, capacity 15%, hạng/ladder, timeline, kênh gợi ý) — rời Tada là toàn bộ khái niệm biến mất. Dashboard/Funds vận hành nói ngôn ngữ cũ. Kiểm kê: **7 khái niệm mồ côi**, 1 nhà tạm (CSP bar ở Budget).

## Quyết định nền (đã chốt trong session)

1. **Kế hoạch LUÔN TƯƠI** (living forecast): engine chạy lại với state thật mỗi lần render — không lưu plan tĩnh vào DB. Tada = lần chạy đầu tiên của cùng một hàm.
2. **Funds làm gốc**, plan đi theo từng fund + summary strip mini-Tada đầu trang (câu chuyện tập hợp không phân rã — tránh tái phạm lỗi 2-model-song-song).
3. **Trục thời gian giữ tháng/quý/năm** — giai đoạn là lớp phủ (badge), không thay thế.
4. **Góp quỹ giữ thao tác tay từng quỹ** (có tháng góp có tháng không) — engine chỉ gợi ý (pre-fill), không auto-allocate. App advise-not-act là triết lý vận hành.
5. **Income vận hành = thu nhập THỰC cả hộ gộp** (mọi member, ví chung); capacity tháng = 15% × income thực tháng; timeline dùng trailing average 3 tháng chống rung.
6. **Emergency target giữ số onboarding**, user tự sửa; ngưỡng GĐ derive từ target (GĐ1 = target/3, GĐ2 = target).
7. **Goal mới chen ladder** → recompute toàn bộ theo living plan.
8. **Quyền sửa kế hoạch**: permission flag per member (owner cấp khi invite hoặc trong cấu hình).
9. **Tụt giai đoạn được KỂ** + lối thoát "còn N tháng là đầy lại" (BR-OB-012); không notify chéo member khi biến động lan.
10. **Rút quỹ thêm nhập mô tả lý do** (friction tốt + data).
11. **Tada tươi cho member mới** (7-2): reveal 4-stage chạy bằng số hôm nay — không replay snapshot.
12. OK concept **"chế độ tháng khó"** (gom tin xấu thành 1 câu chuyện + lối thoát) — để epic tương lai.

## Gap kỹ thuật phát hiện

- **Hạng quỹ không sống trong DB** — thứ tự chỉ tồn tại lúc gửi route onboarding. Cần cột `priority_rank` (migration duy nhất của đợt này; còn lại compute-on-render).
- Insight engine (Epic 5) nói ngôn ngữ chi tiêu, chưa nói ngôn ngữ giai đoạn — gap là NGÔN NGỮ, không phải thiếu feature.
- Insight từ review 10.3: stage1EndMonth luôn = 6 tháng với balance 0 — vận hành với balance thật thì số này mới sống.

## MoSCoW (chốt nguyên trạng 10-07-2026)

**MUST:**
- C — Cột `priority_rank` DB + sheet "Đổi hạng" (reuse GoalRankList)
- M — Engine vận hành đọc income thực hộ gộp + trailing 3 tháng
- A — Funds summary strip mini-Tada (capacity 15%, GĐ hiện tại + progress, cách chia ladder)
- D — Tab "Kế hoạch" fund detail (góp TB, timeline, kênh + lãi kép + disclaimer BR-OB-013, marker chặng 50%)
- E — Pre-fill dialog góp bằng số engine gợi ý (sửa được, bỏ qua được)
- K — Goal mới chen ladder → recompute (làm cùng C)

**SHOULD:** B — badge GĐ dashboard header · F — drift kể tử tế (tháng không góp → timeline giãn + lối thoát) · G — sự kiện tụt GĐ · L — mô tả lý do rút · I — Tada tươi member mới

**COULD:** H — insight engine ngôn ngữ giai đoạn (kể cả first-expense = "viên gạch đầu GĐ1") · J — permission flag · O — 1 dòng chuyện 4 bucket Budget page

**WON'T lần này:** N — chế độ tháng khó (cần F+G có data tín hiệu trước)

## Synthesis

- Gap = **ngôn ngữ**, không phải feature — nhiều xương có sẵn (Epic 5, GoalRankList, PlanDetailSheet, engine), thiếu lớp dịch.
- "Kế hoạch luôn tươi" là chìa khoá giải 5 bài toán cùng lúc: Tada tươi, tụt GĐ tự phát hiện, chen ladder, drift tự giãn, không cần schema plan.
- Trục Must là một đường thẳng: *engine sống bằng số thật (C+M+K) → bức tranh có nhà (A+D) → vận hành chạm kế hoạch (E)*.
- User giữ chủ quyền thao tác — app gợi ý + kể chuyện, không tự làm (BR-OB-011 mở rộng thành triết lý).

## Handoff

Next: `bmad-correct-course` (sprint change proposal — BR mới cho living plan/income thực/permission, epic mới từ Must+Should) → epics → create-story pipeline như đợt Money Model v2.
