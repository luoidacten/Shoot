# Đấu Trường Kỳ Ngộ

Game bắn súng đối kháng 1v1 góc nhìn từ trên xuống, chơi trên trình duyệt và tối ưu cho điện thoại.

## Chế độ chơi
- **2 người chung 1 máy**: đặt điện thoại nằm ngang giữa hai người.
- **Đấu máy**: bot có 3 độ khó và dùng kỹ năng như người. Có thể bật sương mù chiến trận.
- **Online 2 máy**: tạo phòng, gửi mã 5 ký tự hoặc link mời. Hai máy nối thẳng với nhau qua WebRTC (PeerJS).
  - Sương mù chiến trận: chỉ thấy những gì nhân vật nhìn thấy, tường che tầm mắt.
  - Tiếng bước chân và tiếng súng nghe theo hướng trái/phải và khoảng cách.
  - Dấu chân in trên sàn để lần theo đối thủ.

## Thể thức BO7
Ai thắng 4 hiệp trước sẽ vô địch. Trước mỗi hiệp, mỗi người chọn 1 thẻ:

| Hiệp | Loại thẻ |
|---|---|
| 1, 3, 5, 7 | **Định hình**: Kỹ năng (S, có nút bấm, tối đa 2) hoặc Nội tại (P) |
| 2, 4, 6 | **Chỉ số** (vĩnh viễn) hoặc **lợi thế** chỉ trong hiệp đó |

- 34 kỹ năng (S) và 38 nội tại (P), gồm nhóm nạp đạn, giữ vị trí, bẫy, bản đồ và tài nguyên.
- 74 phối hợp: khi sở hữu đúng cặp thẻ, cả hai mạnh lên nhưng kèm một đánh đổi. Mỗi thẻ tham gia tối đa 3 phối hợp.
- Người đang thua được chọn thêm 1 lá.

## Vũ khí (kiểu Brawl Stars)
- Giữ nút đánh để hiện vùng bắn, thả tay là bắn. Trên điện thoại kéo nút đánh để ngắm tay, kéo về giữa để huỷ.
- Có băng đạn và đạn dự trữ. Hết băng thì tự nạp; chạm nút Ném để nạp chủ động, giữ nút Ném để ném. Hết sạch đạn thì tự ném vũ khí.
- Vũ khí tụ lực (Sniper, Cung, Railgun): vùng ngắm thu hẹp dần thành một đường thẳng. Người bị ngắm thấy dải cảnh báo đỏ.
- Có 24 vũ khí:
  - **Cận chiến:** Dao, Song Đao, Katana, Giáo, Búa Tạ, Cưa Máy, Khiên, Kiếm Ánh Sáng.
  - **Tầm xa:** Súng lục, Ổ Quay, SMG, Song Súng, Súng Trường, Shotgun, Bắn tỉa, Cung, Pháo, Súng Phóng Lựu, Phun Lửa.
  - **Đặc biệt:** Súng Lưới, Boomerang, Lựu đạn.
  - **Huyền thoại:** Minigun, Railgun.

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
