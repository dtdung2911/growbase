# Brainstorm Intent — Money Model & Cơ chế góp quỹ (09-07-2026)

> Session: Facilitator mode, 4 techniques (JTBD → Assumption Reversal → Morphological → Disney). Feed vào: Sprint Change Proposal (correct-course) + PRD update. Nguồn số liệu: `research-frameworks.md` cùng thư mục.

## Quyết định đã chốt

### Money model (nền)
- **Capacity góp quỹ = bucket "Tiết kiệm & Đầu tư" 15%** thu nhập ròng; "other" 4% trả về nhóm linh hoạt — hết đếm trùng. Attribution: CSP (Ramit Sethi) + debt bucket theo 70/20/10 (Clason 1926); emergency 3-6 tháng CHI TIÊU thiết yếu (CFPB/CFP/Vanguard); bucket architecture = Thaler mental accounting (Nobel 2017).
- **Onboarding = KỊCH BẢN mô phỏng, không phải cam kết.** Vận hành: tháng hiện tại khoá budget → cuối tháng đối chiếu kế hoạch vs thực tế → chỉnh tháng sau → hội tụ. Engine được phép sai lúc đầu, tự sửa theo vòng tháng.

### Allocation engine — Hybrid 3 giai đoạn
1. **Tuần tự:** 100% capacity → emergency đến **1 tháng chi tiêu** (CFPB starter/spending-shock).
2. **Song song:** emergency **70%** / goals **30%** đến khi emergency đủ 3 tháng.
3. **100% goals** + nhánh đầu tư cho quỹ dài hạn.

- Nhiều goals: chia **tỷ trọng bậc thang theo hạng** (2 quỹ: 70/30; 3 quỹ: 60/30/10) — KHÔNG waterfall.
- **Hạng do user kéo thả** (label màu), app chỉ advise (hint "quỹ X xong trong N tháng nếu đẩy hạng") — app không đọc được need/want (case iPhone 29tr vs xe máy 30tr).
- **Onboarding KHÔNG có slider tỷ lệ** — default cứng; chỉnh chi tiết = trang Funds hậu onboarding (backlog).

### Mục tiêu xa vời (P4)
- **Rule 1: số timeline gây tụt mood KHÔNG BAO GIỜ hiện một mình.** Voice app: luôn nói thật + luôn kèm lối thoát.
- Ghép 2 trường phái: **nắn chặng** (400tr → chặng 1: 100tr đặt cọc/5 năm) + **kê thuốc lãi kép** ("còn 11 năm nếu góp qua kênh đầu tư"). Thông điệp trung tâm: **"Sức mạnh của lãi kép"**.
- Nắn chặng = **opt-in 1 chạm**: mặc định kế hoạch full target; timeline >10 năm mới hiện card "chia chặng?", user tap mới áp.
- Thu nhập thấp: chấp nhận hiện thực trực diện — không tô hồng, nhưng có lối thoát.

### Lãi kép simulation (P3)
- 3 tầng thận trọng: ngắn <2 năm = tiết kiệm **5%**/năm · trung 2-5 năm = quỹ trái phiếu **6,5%** · dài >5 năm = DCA index/vàng **8%**.
- % lấy theo **năm T-1** (dynamic), highlight disclaimer "tham khảo, không phải cam kết". Mode "gợi ý tham khảo", nối module investment portfolio sẵn có.

### Tada (P5)
- Câu-1 user phải nhớ: *"Tôi vừa xây kế hoạch tài chính xịn — mục tiêu hiện hữu, khả thi — trong vài phút."*
- Tada = kế-hoạch-là-thành-tựu: mục tiêu + timeline khả thi + 1 dòng 3 giai đoạn + attribution. Chi tiết %, tỷ trọng, công thức → màn "kế hoạch chi tiết". Nối invite companion (7-2) sau reveal = meaningful moment thật.

## Realist slicing (đã duyệt)
- **Sprint 1 — Toán đúng + kể chuyện đúng:** capacity 15% + allocation engine thuần 3 giai đoạn + tests · GoalStep suggest "góp X/tháng, xong ~[năm]" · Tada per-fund từ engine + 1 dòng 3 giai đoạn + attribution.
- **Sprint 2 — Ưu tiên + lãi kép:** kéo thả xếp hạng + bậc thang · simulation lãi kép + nắn chặng opt-in · màn kế hoạch chi tiết.
- **Sprint 3 — Vận hành (backlog, ngoài scope onboarding):** khoá budget tháng · reconcile cuối tháng · daily notification "hôm nay tiêu được X" · tối ưu nhập liệu (trở ngại lớn nhất) · slider tỷ lệ cho power user · nối investment portfolio.

## Nguyên tắc xuyên suốt
1. App guide dựa nghiên cứu uy tín — user không phải nghĩ hộ công thức.
2. Luôn nói thật, sự thật luôn kèm lối thoát.
3. Kịch bản trước, cam kết sau — vòng tháng hội tụ về thực tế.
4. Mọi con số hiện cho user phải có nguồn hoặc disclaimer.
