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
- 92 phối hợp: sở hữu đúng cặp thẻ thì cả hai mạnh lên kèm một đánh đổi. Mỗi thẻ tham gia tối đa 3 phối hợp.
- Thẻ tầm nhìn (Mắt Đại Bàng, Lính Gác, Thợ Săn) và hiệu ứng làm lộ địch (Pháo Sáng, Dây Bẫy…) hiện mũi tên chỉ về phía địch.

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
- Đầu trận mỗi người được 2 phép bổ trợ ngẫu nhiên (thẻ Túi Phép: 3): Tốc Biến, Hồi Máu, Thanh Tẩy (dùng được cả khi bị choáng), Gia Tốc, Trừng Phạt, Ngất Ngư.
- 1 ô vật phẩm tiêu hao (thẻ Túi Vật Dụng: 2 ô). Mỗi hiệp có sẵn 1 vật phẩm, hòm hỗ trợ có thể rơi thêm.
- Có 12 loại vật phẩm: 6 cuộn phép dùng 1 lần, Bình Máu Lớn, Thuốc Khiên, Lựu Khói, Drone Định Vị, Bù Nhìn Mini, Thuốc Cuồng Nộ.
- Thẻ mới:
  - Cường Thể, Giáp Chống Cận Chiến, Mặt Nạ Phòng Độc, Bom Độc, Drone Do Thám, Bù Nhìn.
  - **Elsu**: ngắm thì đứng yên nhưng nhìn xa; kỹ năng cắm Ưng Trạm cho tầm nhìn.
  - **Kỹ Thuật Cao**: kỹ năng đổi theo vũ khí đang cầm.
  - Phù Thủy Bổ Trợ, Túi Phép, Túi Đồ (3 ô vũ khí), Túi Vật Dụng, Lựa Chọn Thay Thế (3 kỹ năng).

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
