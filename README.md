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

- 21 kỹ năng (S) và 21 nội tại (P).
- 36 phối hợp: khi sở hữu đúng cặp thẻ, cả hai mạnh lên nhưng kèm một đánh đổi. Mỗi thẻ tham gia tối đa 3 phối hợp.
- Người đang thua được chọn thêm 1 lá.

## Bản đồ
- **Đấu Trường**: cân bằng, có trụ và thùng gỗ phá được.
- **Mê Cung**: tường dày đặc, đánh giáp lá cà.
- **Hỏa Ngục**: hồ dung nham bùng cháy theo chu kỳ, nháy ⚠ trước khi cháy.

Ngoài ra trận nào cũng có vòng bo, thính vàng (vũ khí huyền thoại), sao băng và 12 "vận mệnh" ngẫu nhiên.

## Điều khiển
| | P1 | P2 |
|---|---|---|
| Di chuyển | WASD | Phím mũi tên |
| Đánh / Ném / Đổi vũ khí | F / G / H | K / L / ; |
| Kỹ năng 1 / 2 | R / T | I / O |

Điện thoại dùng joystick nổi cùng các nút đánh, ném, đổi và 2 nút kỹ năng. Game cũng hỗ trợ tay cầm.

## Chạy thử
Không cần cài gì, chỉ cần một web server tĩnh:
```bash
python -m http.server 8123
```
Rồi mở http://localhost:8123.

Muốn chơi trên điện thoại, hãy bật **GitHub Pages** (Settings → Pages → Branch `main`) rồi mở link trên cả hai máy.
