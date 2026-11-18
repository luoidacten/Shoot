# Kế hoạch: Chế độ Sinh Tồn (Battleground)

> **Trạng thái: chỉ là kế hoạch, chưa làm.** Đây là chế độ riêng, tách khỏi chế độ 8 người hiện có.

## 1. Ý tưởng
- Có 8 người chơi trên một bản đồ rất lớn, có thể là người thật online, bot, hoặc cả hai.
- Chỉ đấu **1 ván**, không chia hiệp. Người cuối cùng còn sống thắng.
- Không có bước chọn thẻ ở đầu trận. Mọi thứ phải **nhặt trên bản đồ**: vũ khí, thẻ, phép, giáp, hộp hỗ trợ.

## 2. Bản đồ
- Kích thước khoảng 5000 × 5000, gấp 2–3 lần bản đồ lớn hiện tại.
- Có 6–8 **khu vực có tên** (Làng, Nhà Máy, Rừng, Bến Cảng…). Mỗi khu có kiểu vật cản riêng và đồ ở mức tốt khác nhau.
- Bản đồ được tạo ngẫu nhiên từ một seed. Host gửi seed cho các máy khách, giống cách đồng bộ bản đồ hiện nay.

## 3. Mở đầu: nhảy dù
- Máy bay chở mọi người bay ngang bản đồ theo một đường ngẫu nhiên.
- Người chơi chạm lên **bảng chiến thuật** (dùng lại `tactical.js`) để chọn chỗ nhảy.
- Thời gian rơi khoảng 3 giây. Lúc rơi không bị tấn công và không bắn được.
- Bot chọn chỗ nhảy theo tính cách: kiểu hung hăng nhảy vào khu đông người, kiểu thận trọng nhảy ra rìa.

## 4. Đồ nhặt được
| Loại | Mô tả |
|---|---|
| Vũ khí | Dùng 33 vũ khí sẵn có, chia 4 bậc màu (Thường, Hiếm, Sử Thi, Huyền Thoại). Bậc càng cao sát thương càng lớn và băng đạn càng nhiều. |
| Thẻ kỹ năng / nội tại | Rơi dưới dạng **"cuộn thẻ"**. Khi nhặt sẽ mở bảng chọn 1 trong 3 thẻ (dùng lại `openPhase`). Mỗi người mang tối đa 6 thẻ. |
| Phép bổ trợ | Mỗi người có 2 ô phép, nhặt bằng "ngọc phép". |
| Giáp / mũ | 3 cấp. Giáp giảm sát thương thân, mũ giảm sát thương headshot. |
| Hộp hỗ trợ | Dùng lại 10 loại SUPPLY sẵn có. |
| Thùng tiếp tế | Thả bằng dù mỗi 90 giây ở vị trí ngẫu nhiên, báo trên bản đồ. Bên trong có vũ khí Huyền Thoại hoặc thẻ tiến hoá. |

## 5. Vòng bo
- Có 5 giai đoạn. Mỗi giai đoạn gồm: báo trước vòng mới → chờ → bo thu nhỏ dần.
- Sát thương ngoài bo tăng theo từng giai đoạn: 2 → 4 → 7 → 12 → 20 mỗi giây.
- Có thể dùng lại `world.zone`, nhưng bổ sung **tâm bo kế tiếp** và vẽ vòng tiếp theo bằng nét đứt trên bản đồ nhỏ.

## 6. Hạ gục & đội
- **Chơi đơn**: hết máu là bị loại, chuyển sang xem người khác chơi (đổi người bằng ◀ ▶).
- **Đội 2 hoặc 4 người** (làm sau): hết máu thì nằm gục 20 giây, đồng đội giữ nút để đỡ dậy.
- Người bị hạ làm rơi **túi đồ** chứa vũ khí, giáp và thẻ, ai cũng nhặt được.

## 7. Giao diện
- Góc trên phải hiện bản đồ nhỏ, tâm bo tiếp theo và thời gian còn lại của bo.
- Góc trên giữa hiện số người còn sống, số hạ gục, và nhật ký "A hạ gục B".
- Có thêm thanh túi đồ ở dưới. Trên điện thoại, chạm để đổi vũ khí hoặc bỏ đồ.
- Cuối ván hiện màn hình **Top 1 · Xếp hạng #**, kèm sát thương gây ra, số hạ gục và thời gian sống.

## 8. Bot
- Bot dùng Utility AI hiện có và thêm 3 mục tiêu mới:
  - **đi nhặt đồ**: tìm đồ tốt nhất ở gần;
  - **chạy vào bo**: tính theo thời gian bo còn lại;
  - **tránh giao tranh** khi đang yếu.
- Tính cách (PERSONAS) ảnh hưởng tới chỗ nhảy dù, mức liều lĩnh và lúc nào thì vào bo.

## 9. Mạng
- Dữ liệu đồng bộ nhiều hơn, nên snapshot chỉ gửi những thực thể ở gần mỗi máy khách (lọc theo khoảng cách khoảng 1500).
- Đồ trên đất đồng bộ theo kiểu sự kiện "xuất hiện" / "bị nhặt", không gửi lại toàn bộ mỗi khung hình.
- Vẫn giới hạn 8 máy như chế độ 8 người.

## 10. Các bước làm (đề xuất)
1. Thêm `settings.mode = 'br'`, tạo bản đồ lớn và các khu vực, đổi luật thành 1 ván.
2. Làm đồ nhặt được: vũ khí theo bậc, cuộn thẻ, ngọc phép, giáp/mũ, túi đồ khi bị hạ.
3. Làm vòng bo 5 giai đoạn và giao diện bo.
4. Làm nhảy dù bằng bảng chiến thuật.
5. Thêm mục tiêu mới cho bot.
6. Tối ưu snapshot mạng.
7. Làm màn hình xem người khác chơi và bảng xếp hạng cuối ván.
8. (Sau) Chế độ đội 2/4 người có đỡ dậy.

## 11. Câu hỏi cần quyết trước khi làm
- Có giữ nguyên tầm nhìn kiểu đèn pin và sương mù không? Bản đồ lớn thì sương mù sẽ rất căng thẳng.
- Thời lượng một ván nên khoảng bao nhiêu? Đề xuất 6–8 phút.
- Người chơi có được giữ lợi thế đầu trận không, hay bỏ hẳn?
