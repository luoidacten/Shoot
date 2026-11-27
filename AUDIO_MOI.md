# Âm thanh mới — ghi chú cho người sửa code

Tất cả nằm trong `assets/audio/`, đã khai báo trong `audio.json` (mục `sfx`). Gọi bằng tên như mọi âm khác: `AudioSys.play('<tên>')` hoặc `AudioSys.playAt('<tên>', x, y, vol)`. Mỗi âm có 1–4 bản, game tự chọn ngẫu nhiên. Độ to và khoảng cách phát chỉnh trong `js/sound.js` (`SFX_VOL`, `SFX_GAP`).

## Nhóm A, B — đã chạy ngay, không cần sửa code
`whoosh`, `swing`, `alarm`, `tick`, `step`, `heart`, `ko`, `win`, `flame`, `chainsaw`, `bow`

## Nhóm C — tên âm mới, cần gắn vào đúng chỗ trong code
| Tên | Dùng cho | Đang dùng chung |
|---|---|---|
| `laser` | tia laser, laser vệ tinh, Railgun | `rail` |
| `teleport` | dịch chuyển, Tốc Biến, cổng không gian | `rail` / `trick` |
| `zap` | Súng Điện, Roi Điện, sét, EMP | `rail` |
| `ground` | nện đất, đáp xuống, Búa | `slam` |
| `clang` | chém đạn, kiếm chạm kiếm, khiên kim loại | `block` |
| `glass` | Bom Lửa vỡ chai | `block` |
| `ricochet` | đạn nảy khỏi tường | `block` |
| `sniper` | Bắn tỉa | `shoot_heavy` |
| `cannon` | Hoả Mai, pháo | `shoot_heavy` |
| `magic` | chiêu lớn, vũ khí huyền thoại, tăng sức mạnh | `legend` |
| `spell` | phép, triệu hồi | `trick` |
| `whip` | tiếng nổ đầu roi | — |
| `freeze` | Súng Băng, đóng băng | — |
| `heal` | hồi máu | — |
| `shield` | đỡ đòn bằng khiên | — |
| `shield_up` | dựng khiên năng lượng | — |
| `throw` | ném dao, phi tiêu, ném đồ | — |

Thiếu file thì `AudioSys.play` tự quay về tiếng tổng hợp cũ, nên gắn tên mới vào không lo bị câm.
