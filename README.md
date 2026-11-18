# Đấu Trường Kỳ Ngộ

Game bắn súng đối kháng 1v1 góc nhìn từ trên xuống, chơi trên trình duyệt và tối ưu cho điện thoại.

## Chế độ chơi
- **Đấu bot**: bạn + bot, chọn 2–4 người trong trận. Bot có 3 độ khó và dùng kỹ năng như người.
- **Online tối đa 4 máy**: tạo phòng, gửi mã 5 ký tự hoặc link mời; chỗ trống tự thêm bot (ví dụ 3 người + 1 bot). Hai máy nối thẳng qua WebRTC (PeerJS).
  - Sương mù chiến trận, tiếng chân/súng theo hướng, dấu chân trên sàn.
  - Người rời phòng giữa trận sẽ được bot thay.
- **2 người 1 máy** (chỉ trên PC, bàn phím): 2 người + bot cho đủ số.
- Điện thoại: tự bật toàn màn hình khi vào trận. HUD kiểu Liên Quân: máu ở góc trái, không hiện thông tin của địch.

## Thể thức
Mọi người đấu sinh tồn: người cuối cùng còn sống thắng hiệp. Ai thắng 4 hiệp trước sẽ vô địch.

- Chỉ chọn nâng cấp **5 lần** cả trận (trước hiệp 1, 3, 5, 7, 9). Người đang bị dẫn được chọn trong 4 lá thay vì 3.
- 37 kỹ năng (S) và 40 nội tại (P), trong đó có 5 thẻ vượt địa hình: Cất Cánh (ba lô tên lửa), Móc Leo, Bước Nhảy Vọt, Vượt Rào, Xe Ủi.
- 135 phối hợp: sở hữu đúng cặp thẻ thì mạnh lên. Mỗi thẻ tham gia tối đa 3 phối hợp. 24 thẻ mới (chí mạng, súng, tầm nhìn) có 28 phối hợp riêng, ví dụ Thần Xạ (Thiện Xạ + Bách Phát Bách Trúng), Viên Định Mệnh (Chuyên Gia Súng Lục + Viên Cuối), Dơi Đêm (Sóng Âm + Bước Chân Mèo), Đèn Pha Kép (Đèn Pin Góc Rộng + Đèn Chiếu Xa).
- Bốc thẻ: mỗi lượt có tối đa **1 thẻ hợp với bạn** (tạo phối hợp), và cũng chỉ là hên xui (~55%). Các thẻ còn lại hoàn toàn ngẫu nhiên. Thẻ tiến hoá đủ điều kiện thì xuất hiện ~80%.
- Thẻ tầm nhìn (Mắt Đại Bàng, Lính Gác, Thợ Săn) và hiệu ứng làm lộ địch (Pháo Sáng, Dây Bẫy…) hiện mũi tên chỉ về phía địch.

## Tầm nhìn kiểu đèn pin
- Quanh bạn có một vùng sáng tròn nhỏ (~170). Phía trước là nón đèn pin (~57°) chiếu xa hơn trước (~620). Sương mù vẽ mềm: mép ánh sáng loang dần vào bóng tối, cuối đèn pin tắt dần.
- Nón quay theo hướng nhìn / hướng ngắm. Ngắm Sniper: nón hẹp dần theo độ tụ lực nhưng dài tới hết tầm bắn, vùng sáng quanh người thu nhỏ (Elsu thì không).
- Thẻ tầm nhìn: Mắt Kiểm Soát, Kính Nhìn Đêm (vùng sáng +30%), Kính Nhiệt, Ống Nhòm (đứng yên: đèn pin +40%), Sóng Âm, Giác Quan Thứ Sáu, **Đèn Pin Góc Rộng**, **Đèn Chiếu Xa**, **Mắt Mèo**, **Gương Chiếu Hậu**.
- Bom khói: người ném và đồng đội thấy khói rất mờ (viền đứt) và nhìn xuyên được khói của mình.

## Ngắm & vũ khí
- Không còn tự ngắm. Chạm nhẹ nút đánh = hỗ trợ nhắm địch gần nhất; kéo nút đánh để ngắm tay, kéo về giữa để huỷ.
- Kỹ năng cần hướng/vị trí (Lướt, Bom Khói, Bước Nhảy…): kéo nút kỹ năng để chọn, thả ra để dùng. Chạm nhẹ thì tự nhắm.
- Vùng ngắm chỉ người bắn thấy và dài đúng bằng tầm bay. Tầm bắn và tầm đánh đã giảm mạnh, súng vẫn xa hơn cận chiến nhiều.
- Cận chiến chia **đâm** (thẳng, xa, hẹp) và **chém** (vòng cung rộng). Dao và Kiếm Ánh Sáng: chém, chém, đâm.
- Bom và mọi vũ khí nổ mạnh hơn 40%.
- 28 vũ khí:
  - **Cận chiến:** Dao, Song Đao, Katana, Giáo, Búa Tạ, Cưa Máy, Khiên, Kiếm Ánh Sáng, **Kiếm Liễu** (lướt & đâm), **Đại Đao**.
  - Đại Đao chém rộng, mạnh, chậm; Búa Tạ cũng vậy. Giữ để phóng lên trời, chọn vùng rồi đạp xuống gây sát thương và choáng. Búa có vùng nhỏ hơn nhưng đẩy lùi mạnh và choáng lâu hơn.
  - **Tầm xa:** Súng lục, Ổ Quay, SMG, Song Súng, Súng Trường, Shotgun, Bắn tỉa, Cung, Pháo, Súng Phóng Lựu, Phun Lửa, **Súng Năng Lượng** (không bắn thì có khiên phía trước, bị phá được), **Súng Điện** (phóng điện liên tục, trúng đủ khoảng 1 giây thì bị giật choáng).
  - **Đặc biệt:** Súng Lưới (trúng thì choáng, trượt thì bung lưới làm chậm), Boomerang, Lựu đạn.
  - **Huyền thoại:** Minigun, Railgun.

## Phép bổ trợ & vật phẩm
- **Đầu trận tự chọn** phép bổ trợ (không ngẫu nhiên). Mặc định 1 phép; lợi thế Song Phép: 2; thẻ Túi Phép: +1 (chọn ngay khi lấy thẻ, tối đa 3).
- 10 phép: Tốc Biến, Hồi Máu, Thanh Tẩy, Gia Tốc, Trừng Phạt, Ngất Ngư, **Tường Băng**, **Pháo Tên Lửa**, **Bom Mù**, **Radar**.
  - **Thanh Tẩy**: gỡ hiệu ứng xấu và miễn nhiễm 3 giây với choáng, làm chậm, trói, câm lặng, keo, đốt, độc và sát thương theo thời gian.
  - **Tường Băng**: dựng tường chắn đạn trước mặt, vuông góc hướng ngắm (5 giây).
  - **Pháo Tên Lửa**: bay càng xa càng đau (tối đa ×3.2), nổ lan nhỏ.
  - **Bom Mù**: ném bom khói và tăng tốc; địch trong vùng nổ bị mù 3 giây.
  - **Radar**: 5 giây lộ mọi địch trong 650 (cả trong bụi, khói, tàng hình), tầm nhìn +20%.
- 18 phối hợp phép (có cả 2 phép thì mạnh lên, mỗi phép 3–4 phối hợp; bot cũng ưu tiên chọn phép tạo phối hợp):
  - Tên Lửa Dẫn Đường (Radar + Tên Lửa), Tên Lửa Băng (Tường Băng + Tên Lửa), Kết Liễu (Trừng Phạt + Tên Lửa)
  - Ảo Ảnh (Bom Mù + Tốc Biến), Chớp Choáng (Tốc Biến + Ngất Ngư), Hồi Phục Tức Thì (Tốc Biến + Hồi Máu)
  - Án Tử (Radar + Trừng Phạt), Đòn Kết Thúc (Ngất Ngư + Trừng Phạt), Mắt Trong Khói (Radar + Bom Mù), Tâm Tĩnh (Thanh Tẩy + Radar)
  - Băng Giá (Ngất Ngư + Tường Băng), Choáng Mù (Ngất Ngư + Bom Mù), Trượt Băng (Gia Tốc + Tường Băng), Giáp Băng (Hồi Máu + Tường Băng)
  - Bóng Ma (Bom Mù + Gia Tốc), Thoát Thân (Thanh Tẩy + Gia Tốc), Chạy Hồi Sức (Hồi Máu + Gia Tốc), Thánh Quang (Thanh Tẩy + Hồi Máu)
- 1 ô vật phẩm tiêu hao (thẻ Túi Vật Dụng: 2 ô). Mỗi hiệp có sẵn 1 vật phẩm, hòm hỗ trợ có thể rơi thêm.
- Có 12 loại vật phẩm: 6 cuộn phép dùng 1 lần, Bình Máu Lớn, Thuốc Khiên, Lựu Khói, Drone Định Vị, Bù Nhìn Mini, Thuốc Cuồng Nộ.
- Thẻ mới:
  - Cường Thể, Giáp Chống Cận Chiến, Mặt Nạ Phòng Độc, Bom Độc, Drone Do Thám, Bù Nhìn.
  - **Elsu**: ngắm thì đứng yên nhưng nhìn xa; kỹ năng cắm Ưng Trạm cho tầm nhìn.
  - **Kỹ Thuật Cao**: kỹ năng đổi theo vũ khí đang cầm.
  - Phù Thủy Bổ Trợ, Túi Phép, Túi Đồ (3 ô vũ khí), Túi Vật Dụng, Lựa Chọn Thay Thế (3 kỹ năng).

## Lợi thế đầu trận (chọn 1, xem được hết)
- 🗺️ **Bản Đồ Nhỏ**: minimap góc phải (tường, bụi, vòng bo, địch đang thấy, tiếng động); nghe tiếng chân xa hơn 60%.
- ✖️2 **Khởi Đầu Gấp Đôi**: lần nâng cấp đầu được chọn 2 thẻ.
- 📜 **Song Phép**: 2 phép bổ trợ (có Túi Phép thì 3).
- 🎖️ **Túi Quân Dụng**: mỗi hiệp có sẵn 1 súng ngẫu nhiên + dao.
- 🩹 **Medkit**: không trúng đòn 2.5 giây thì tự hồi máu, càng lâu càng nhanh (tới 10/giây).
- 🦺 **Giáp Chống Nổ**: mỗi hiệp 100 giáp, nổ -25%.
- 🛠️ **Kỹ Thuật Cao Khởi Động**: có sẵn thẻ Kỹ Thuật Cao, nhưng lần nâng cấp tiếp theo bị chọn ngẫu nhiên.
- 🃏 **Nhiều Lựa Chọn**: mỗi lần nâng cấp thêm 1 lá; luôn có 1 lá hợp với bạn, may mắn thì 2.
- 🥷 **Lẩn Trốn**: tiếng chân nhỏ, chỉ nghe được trong 380; nửa số dấu chân; người nhỏ hơn.
- 👑 **Con Đường Độc Tôn**: không nhận thẻ kỹ năng / nội tại. Mỗi lần nâng cấp nhận 2 gói chỉ số, cấp tăng dần theo lần nâng cấp: cấp I ×1.5 → cấp V ×3.5.
- ⚔️ **Bậc Thầy Cận Chiến** (gộp lợi thế Cận Chiến): chỉ dùng vũ khí cận chiến (tay không cũng tính); mỗi vũ khí cận chiến có 1 nội tại + 1 kỹ năng riêng (ví dụ Dao: đâm lén/phục kích ×3, kỹ năng lướt nhỏ); +25% sát thương cận chiến, chạy nhanh 10%, nhận ít hơn 18% sát thương đạn & nổ; mất lần nâng cấp đầu.
- 🏹 **Bậc Thầy Tầm Xa** (gộp lợi thế Bắn Chuẩn): chỉ dùng súng; mỗi loại súng có 1 nội tại + 1 kỹ năng riêng; súng chính xác hơn, tầm nhìn/tầm bắn/tốc bắn +15%; -20 máu, mất lần nâng cấp đầu.
- 🗡️🏹 **Bậc Thầy Vũ Khí**: có cả 2 Bậc Thầy, dùng mọi vũ khí, +10% tốc chạy, +15% sát thương; mất 3 lần nâng cấp đầu.
- 🤾 **Ném Đồ**: vũ khí ném ×1.8 sát thương, lựu đạn mạnh và rộng hơn 30%, khiên/rìu ném mạnh hơn.
- 🩹 **Medkit** (buff): mọi nguồn hồi máu +30%, nhặt hộp hỗ trợ luôn hồi thêm 25 máu.

## Nâng cấp chỉ số
- 14 gói chỉ số (dùng cho Độc Tôn): Máu, Sát Thương, Tốc Chạy, Hồi Chiêu, Tốc Đánh, Giáp, **Tầm Nhìn**, **Chí Mạng**, **Chính Xác**, **Hồi Máu**, và 4 gói kép: **Toàn Diện**, **Chiến Binh**, **Thợ Săn**, **Linh Hoạt**.
- 10 thẻ liên quan chỉ số: Lớn Dần, Đà Tiến, Pháo Thủy Tinh, Xe Tăng Thịt, Thích Nghi, Cân Bằng, Liều Mạng, Sung Sức, Giáp Dày, Chuỗi Hạ Gục; 12 phối hợp mới (Khổng Lồ Tăng Trưởng, Đại Bác Pha Lê, Sát Thần, Liều Chết…).

## Chí mạng, headshot & 20 thẻ mới
- Súng lục mạnh hơn: 24 sát thương, đạn bay nhanh, 30% chí mạng. Chí mạng mặc định ×1.6.
- Chí mạng / headshot: Mắt Chí Mạng, Đòn Hiểm, Thiện Xạ (headshot +60%), Bách Phát Bách Trúng, Chuỗi Chí Mạng, Đạn Rỗng Đầu.
- Cường hoá súng: Chuyên Gia Súng Lục, Xạ Thủ Súng Trường, Đồ Tể Shotgun, Xạ Thủ Kỳ Cựu, **Xạ Thủ Liên Đạn** (Song Súng/Súng lục sấy đủ 1 giây rồi dừng → loạt đạn hình nón), Nòng Nóng.
- 6 thẻ tầm nhìn: Mắt Kiểm Soát, Kính Nhìn Đêm, Kính Nhiệt, Ống Nhòm, Sóng Âm, Giác Quan Thứ Sáu.
- 2 kỹ năng: Tâm Ngắm Hoàn Hảo (3 giây toàn chí mạng), Đạn Đánh Dấu.

## Thẻ thoát chết (mỗi hiệp 1 lần mỗi thẻ)
- 💉 **Adrenaline**: còn 1 máu, bất tử 3 giây, +40% sát thương; không hạ được ai thì chết, hạ được thì sống với 30% máu.
- 🪢 **Thập Tử Nhất Sinh**: còn 1 máu, bất tử 1 giây.
- 🃏 **Joker**: bất tử 0.5 giây, hồi 25% máu, dịch chuyển tới chỗ khác.
- 🪶 **Phượng Hoàng**: nổ lửa quanh mình, bất tử 1.5 giây rồi hồi 30% máu.
- ⚱️ **Hiến Tế**: mất 30 máu tối đa (hiệp này) để sống lại với 50% máu.
- 👻 **Hồn Ma**: hoá hồn ma 2.5 giây (tàng hình, bất tử, không tấn công) rồi hiện lại với 15% máu.
- Phối hợp với Vô Hình: Trò Đùa Cuối (Joker), Sát Thủ Bóng Đêm (Adrenaline), Bóng Ma Thật Sự (Hồn Ma).

## Triệu hồi & ụ súng (20 thẻ)
- 9 kỹ năng: Bầy Sói, Người Đá, Bầy Ong Máy, Drone Y Tế, Gọi Hồn, Ụ Súng Máy, Pháo Cối, Tháp Lửa, Tháp Tesla. Tháp Pháo cũ giờ cũng phá được.
- 11 nội tại: Kỹ Sư, Ép Xung, Chủ Thú, Thủ Lĩnh Bầy, Linh Hồn Triệu Hồi, Ụ Tự Huỷ, Ụ Liên Kết, Nhặt Phế Liệu, Khế Ước Máu, Pháo Đài, Chỉ Huy.
- Lính và ụ súng bị đạn địch bắn phá được, tự tìm địch, có thanh máu. 16 phối hợp riêng (Sói Đầu Đàn, Quá Tải, Bẫy Nổ, Chỉ Điểm…).

## Bot thông minh (Utility AI)
- Mỗi bot có 1 trong 8 tính cách ẩn: Hổ Báo, Thận Trọng, Rình Rập, Du Kích, Tham Lam, Xạ Thủ, Kẻ Cơ Hội, Chiến Thuật Gia. Tính cách chỉ lộ ở bảng tổng kết.
- Cứ 0.3 giây bot chấm điểm 7 ý định (Đánh, Thả Diều, Vòng Sườn, Rút Lui, Nhặt Đồ, Phục Kích, Truy Lùng) theo tính cách, máu, vũ khí, tầm nhìn rồi theo đuổi ý định cao điểm nhất. Chọn mục tiêu cũng bằng điểm (ưu tiên kẻ yếu, kẻ vừa đánh mình).
- Lính triệu hồi cũng có tính cách: 😠 Hung Hãn, 🛡️ Trung Thành, 😨 Nhát Gan, 😏 Tinh Ranh. Lính và ụ súng được vẽ lại bằng hình vector.

## Thẻ vũ khí & cổng
- **Kỹ Thuật Cận Chiến Cao Cấp** (S): chiêu đổi theo vũ khí cận chiến (Ám Sát, Nhất Kiếm, Giáo Xuyên, Địa Chấn, Phản Đòn, Cuồng Cưa).
- **Trang Bị Phụ** (S): phụ kiện đổi theo súng (phóng lựu dưới nòng AR, băng trống, đạn sên, ống ngắm nhiệt, đạn nảy…).
- **Giáp Chống Đạn** (S): trâu hơn, giảm sát thương đạn; kỹ năng Tấm Kevlar.
- **Cổng Không Gian** (S): 2 cổng A/B, người và đạn đi qua được. **Xuyên Tường** (P): đi thẳng vào tường thì xuyên qua, mỗi tường hồi riêng.
- **Cổng Không Gian (S-P-S)** (tiến hoá từ 2 thẻ trên): hồi chiêu ngắn, đạn xuyên 1 tường, cổng bắn phụ khi bạn bắn.
- 10 phối hợp mới (Kiếm Thánh, Chiến Binh Thép, Thợ Súng Bậc Thầy, Cổng Băng, Bóng Ma Xuyên Tường…).

## Khác
- Đại Đao chỉ có trong hòm thính huyền thoại, nerf nhẹ. Gatling bắn xa hơn, sấy 2 giây thì đạn xuyên tường. Súng phun lửa phun càng lâu càng xa.
- Thông báo Chiến Công Đầu, Hạ Gục Kép/Ba/Tứ Sát/Huỷ Diệt, Chuỗi Thắng; huy hiệu 🔥 mạng và 🏆 chuỗi thắng cạnh bảng máu.
- Hoạt ảnh đánh: vung vũ khí, lao người khi đâm, giật lùi khi bắn, lắc lư khi chạy.
- Phép cần hướng (Pháo Tên Lửa, Tường Băng, Bom Mù, Tốc Biến): kéo nút để ngắm, thả ra mới dùng, kéo về giữa để huỷ.
- Khiên Tròn 2 dạng trên cùng nút đánh: chạm = dựng khiên trước mặt (chạm lại để thu), giữ rồi thả = ném khiên.

## Bộ kỹ năng vũ khí của Bậc Thầy
- Cận chiến: Dao (Ảnh Sát: lướt chém rồi tàng hình), Song Đao (Ám Sát + 4 nhát chảy máu), Búa (Nện Đất 3 vòng), Khiên (Xung Kích), Tay không (Liên Hoàn Quyền), Katana (chém vỡ đạn 25%/75%, lần 3 lướt đánh dấu nổ sau 2 giây), Kiếm Ánh Sáng (6 giây cường hoá, hư ảnh, chém bay đạn), Kiếm Liễu (kiếm khí, lần 5 vẽ ngôi sao), Giáo (nhảy đâm xuống), Rìu (Song Rìu gây cháy), Đại Đao (thế đỡ + phản kích, giữ để kéo lê rồi nhảy chém), Cưa Máy (Cuồng Cưa miễn khống), Khiên Tròn (ném khiên hồi máu + giáp).
- Súng: Ổ Quay (nhắm rồi tự bắn mọi mục tiêu), Song Súng (cầu năng lượng phóng điện), Gatling (Cuồng Phong: xả đạn loạn xạ), Bắn tỉa (Mắt Diều Hâu: tụ lực tức thì, toàn chí mạng), SMG (Băng Trống: bắn nhanh ×2, đạn nảy), Shotgun (đạn sên nổ mảnh), Cung (mưa tên), Railgun (khiên + 2 drone trinh sát), Phun Lửa (cầu lửa, vệt lửa), Phóng Lựu, Pháo, Súng Điện, Súng Năng Lượng, Súng Lưới, Boomerang cũng có P + S riêng.

## Vùng ngắm kỹ năng & hiệu ứng
- Kỹ năng vũ khí của Bậc Thầy có vùng ngắm đúng hình: dải chém (Katana, Kiếm Liễu, Khiên Tròn…), hình nón (Ổ Quay, Bắn tỉa, Pháo…), vùng rơi (Giáo, Mưa Tên, nhảy chém Đại Đao). Kỹ năng tại chỗ (Búa, Rìu, Cưa, Khiên, SMG, Gatling, Railgun, Súng Điện) chạm là dùng.
- Kỹ năng có thêm hiệu ứng: hư ảnh khi lướt, kiếm khí phát sáng, sóng chấn khi đáp đất.
- Độ bền vũ khí cận chiến ×2.5. Kỹ năng cận chiến mạnh hơn ~25%; hồi chiêu Katana 3.6 giây, Kiếm Liễu 3.2 giây.
- Nhảy đập: qua 50% thời gian lấy đà là đã bay lên trời — không bị đánh trúng, không bị khống chế.

## Đòn đánh thường (mọi người chơi)
- Dao 50% chí mạng. Đại Đao chém sau cảnh báo 1 giây nhưng rộng hơn. Nhảy đập (Búa, Đại Đao, Giáo) có thời gian lấy đà 1–1.5 giây và vòng cảnh báo vùng đáp.
- Cưa Máy: chạm = chém mạnh; giữ = rồ máy (chạy nhanh, giảm sát thương nhận, cưa liên tục thẳng phía trước, rất ồn).
- Cung: bắn liên tên thì lướt nhẹ và vô hình; giữ thêm 0.6 giây sau khi đầy lực = mũi tên lớn xuyên thủng mọi thứ.

## Phản đạn & Phản Đòn
- Mọi viên đạn bị phản (Phản Xạ, Katana, Kiếm Vô Niệm, Kiếm Ánh Sáng, thế đỡ Đại Đao, tường phản xạ) có hiệu ứng mới: vòng sáng, tia lửa toả theo hướng mới, viên đạn phát sáng kèm vệt sao chổi.
- Thẻ **Phản Đòn** (P): cầm vũ khí cận chiến hoặc tay không mà bị đánh cận chiến thì có cơ hội chặn và phản toàn bộ sát thương, kẻ đánh bị choáng 0.4 giây. Cơ hội 25% · Katana 50% · Khiên 75%. Mỗi lần phản tốn 1/4 độ bền tối đa. Phối hợp Bậc Thầy Phản Đòn (+ Kỹ Thuật Cận Chiến): +15% cơ hội, tốn nửa độ bền.

## Gọi hoả lực (20 thứ mới)
- **10 thẻ:** Không Kích (máy bay bay xuyên bản đồ theo hướng chọn, rải bom), Thả Bom (mở bản đồ, chọn A rồi B), Laser Vệ Tinh (chọn A→B, tia laser quét), Pháo Kích, Bom Napalm; Liên Lạc Nhanh, Tải Trọng Lớn, Lính Liên Lạc, Hầm Trú Ẩn, Chỉ Điểm Mục Tiêu. 5 phối hợp mới.
- **Bản đồ chọn điểm** không dừng trận. Bình thường chỉ hiện vị trí của bạn; có lợi thế Bản Đồ Nhỏ thì hiện thêm tường, bụi, vòng bo, địch, tiếng động.
- **5 phép:** Không Kích Nhẹ, Pháo Sáng, Rải Mìn, Màn Khói, Tiếp Tế Khẩn (+3 phối hợp phép).
- **5 vật phẩm:** Súng Pháo Sáng, Bộ Đàm Mini, Mìn Cá Nhân, Tiêm Adrenaline, Bộ Vá Giáp.
- **3 vũ khí nhặt được:** Bộ Đàm Không Kích, Máy Tính Bảng Thả Bom, Bộ Chỉ Điểm Laser.
- **Hộp hỗ trợ 10 loại** mỗi loại một hình & màu: Hộp Y Tế, Tim Lớn, Thùng Giáp, Hộp Đạn, Viên Năng Lượng, Lon Tăng Lực, Bình Cuồng Nộ, Thảo Dược, Hộp Quà, Nước Thánh.
- **Nút ném (B):** kéo để ngắm, thả ra để ném; kéo về giữa để huỷ.

## Tiến hoá S-P-S (Kỹ năng · Nội tại · Đặc biệt)
Chỉ xuất hiện khi đủ thẻ điều kiện, và thay thế thẻ kỹ năng gốc:
- 🪷 **Liên Hoa** (cần Kỹ Thuật Cao + Xạ Thủ Liên Đạn): xoay tròn bắn 2 vòng đạn hoa sen và nạp đầy đạn; nón đạn chỉ cần sấy 0.6 giây, 11 viên; 3 giây sau kỹ năng đạn nảy và +25% chí mạng.
- 🦅 **Elsu (S-P-S)** (cần Elsu + Mắt Kiểm Soát + Xạ Thủ Kỳ Cựu): lướt bất tử, nạp đạn, 3 phát ×1.5. Trong 3 giây sau khi lướt bấm lại → Bão Ưng: bay lên xoay tròn xả đạn, vòng sát thương liên tục bán kính 170.

## Vũ khí đặc biệt mới
- **Rìu**: chém 2 phát, phát 3 bổ cực đau và choáng. Giữ để ném rìu rồi rìu tự quay về.
- **Khiên Tròn**: yếu hơn Khiên; giữ để ném, khiên nảy qua 3 mục tiêu.
- **Khiên**: giữ để hút địch phía trước về phía mình.
- **Lục / AR Giảm Thanh**: không có tiếng, gần như không thấy đường đạn. AR giảm thanh sấy 7 viên, càng xa càng yếu.
- **Lựu Đạn Điện Từ**: tạo vùng khoá kỹ năng địch; hiệu ứng còn 2 giây sau khi rời vùng.
- **Cung**: bắn không có tiếng, cầm cung nhìn xa hơn chút. Mũi tụ lực có đường đạn rất mờ.
- **Bắn tỉa**: khi ngắm nhìn rất xa thẳng phía trước, nhưng xung quanh bị thu hẹp tầm nhìn (có thẻ Elsu thì không bị).
- **Railgun** 3 mức:
  - Mức 1: như cũ.
  - Mức 2 (giữ thêm 1 giây): đứng yên, có giáp, nhìn xa hơn, mạnh hơn.
  - Mức 3 (giữ thêm 1 giây nữa): chiếu laser rộng liên tục 1 giây, dùng hết đạn.
- Bụi rậm có thể bị lửa đốt cháy.

## Luật theo hiệp (vận mệnh)
Ngoài các vận mệnh cũ (F1, 1 máu…), hiệp từ thứ 2 trở đi có thể bốc trúng:
- Trời Sáng (không có sương mù)
- Đồng Đội (chia cặp 2 người 1 đội)
- Thêm Người Thêm Vui (+4 bot, bản đồ rộng)
- Đấu Trường Mở Rộng
- Zombie Tràn
- Phòng Ping 999+ (thao tác trễ)
- Thời Gian Bất Ổn
- Khí Độc
- Giả Lập Robot
- Phòng Gương

## Bản đồ
- **Đấu Trường**: cân bằng, có trụ và thùng gỗ phá được.
- **Mê Cung**: tường dày đặc, đánh giáp lá cà.
- **Hỏa Ngục**: hồ dung nham bùng cháy theo chu kỳ, nháy ⚠ trước khi cháy.
- **Rừng Rậm**: đầy bụi cỏ. Đứng trong bụi thì đối thủ không thấy, nhưng tiếng chân và dấu chân vẫn lộ.
- **Đảo Sông**: dòng sông uốn lượn cắt ngang, lội nước chậm 30% (và dập lửa đang cháy trên người), có 2 khúc cạn để băng qua.
- **Thành Cổ**: tòa thành vuông giữa bản đồ, 4 cổng và 4 tháp góc.
- **Nhà Kho**: dãy kệ hàng song song và nhiều chồng thùng gỗ phá được.
- **Sa Mạc**: khối đá lớn và hố cát lún làm chậm 50%.
- **Băng Nguyên**: mặt băng trơn trượt và tường băng không phá được.

**MC bình luận viên**: quả cầu loa có con mắt. Nó đọc vận mệnh mỗi hiệp và bình luận trong trận (máu đầu tiên, liên tiếp hạ gục, thắng hiệp). Máy có giọng tiếng Việt thì đọc thành lời; không có thì phát tiếng "bíp" kiểu loa. Bật/tắt trong menu tạm dừng.

Đứng ngoài vòng bo càng lâu thì bị đốt càng đau.

Ngoài ra trận nào cũng có vòng bo, thính vàng (vũ khí huyền thoại), sao băng và 12 "vận mệnh" ngẫu nhiên.

## Điều khiển
| | P1 | P2 |
|---|---|---|
| Di chuyển | WASD | Phím mũi tên |
| Đánh (giữ: ngắm/tụ lực) / Nạp·Ném / Đổi | F / G / H | K / L / ; |
| Kỹ năng 1 / 2 | R / T | I / O |

**Chuột (PC):** di chuột để ngắm, chuột trái bắn (giữ để tụ lực), chuột phải nạp/ném, lăn chuột đổi vũ khí.

Điện thoại dùng joystick nổi cùng các nút đánh, ném, đổi và 2 nút kỹ năng. Game cũng hỗ trợ tay cầm.

## Chạy thử
Không cần cài gì, chỉ cần một web server tĩnh:
```bash
python -m http.server 8123
```
Rồi mở http://localhost:8123.

Muốn chơi trên điện thoại, hãy bật **GitHub Pages** (Settings → Pages → Branch `main`) rồi mở link trên cả hai máy.
