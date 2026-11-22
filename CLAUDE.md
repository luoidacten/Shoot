# CLAUDE.md — Ghi chú phát triển (đọc trước khi làm việc)

Game bắn súng top-down chạy trình duyệt, **vanilla JS**, không build. Người dùng viết **tiếng Việt** → luôn trả lời tiếng Việt.

## Quy trình mỗi yêu cầu
1. Yêu cầu lớn: **viết TODO (TaskCreate) trước khi code**, nêu rõ cách hiểu; chỗ mơ hồ thì nói giả định.
2. Code trong file `js/reworkN.js` mới (hoặc file rework gần nhất), **bọc (wrap) hàm cũ**, không sửa file gốc trừ khi cần.
3. Thêm `<script src="js/reworkN.js?v=...">` vào `index.html` **ngay sau rework trước đó** và **đổi chuỗi `?v=` mới cho mọi script** (sed thay chuỗi version cũ).
4. Test bằng Playwright (xem mục Test), chạy hồi quy `t1`, test liên quan; xem ảnh chụp.
5. Commit trên nhánh làm việc → `git push -u origin <nhánh>` → tạo PR vào `main` (owner `luoidacten`, repo `Shoot`) → merge (merge_method `merge`).
6. Commit kết thúc bằng dòng `Co-Authored-By` + `Claude-Session` theo hướng dẫn hệ thống; PR body kết thúc bằng "🤖 Generated with [Claude Code]…" + link session. **Không** ghi tên/ID model vào commit/PR.
7. Tóm tắt bằng tiếng Việt: đã làm gì, số liệu test, hạn chế còn lại.

## Kiến trúc
- `index.html` nạp script theo thứ tự (cuối danh sách): `… weapons5.js, rework1.js … rework13.js, sandbox.js, battleground.js, fixes.js, icons.js, main.js`.
- **Biến toàn cục dùng chung giữa file** (`const/let` top-level). Hàm khai báo `function f(){}` có thể gán lại: mẫu wrapper
  `const _fR7 = f; f = function (...a) { ...; return _fR7(...a); };`
  → **tên biến lưu hàm cũ phải duy nhất** (dùng hậu tố `R7`, `R12`…). Trước khi thêm, grep trùng tên `const X\b` trong `js/*.js`.
- File nạp SAU rework (`sandbox.js`, `battleground.js`, `fixes.js`) khai báo `POLY_WEPS`, `bgWin`, `drawPicker`… → muốn ghi đè thì làm trong `window.addEventListener('load', ...)`.
- Vòng lặp: `main.js loop → update(dt) (game.js) → draw()`. Lỗi bị nuốt bằng `console.error` → test phải bắt cả `console` error.

### Hook chính để bọc
| Hook | Dùng cho |
|---|---|
| `fireWeapon(p,w,ang,charge,enemy)` | đòn đánh thường (charge ≥ 0.9 = giữ rồi thả) |
| `castSkill(p,slot,aimVec)` | dùng kỹ năng (đặt `p.skillAng/skillDist`, sau đó đặt `s.cd`) |
| `meleeTechCast(p)` / `gunModCast(p)` | Bậc Thầy / Trang Bị Phụ theo vũ khí |
| `HT[id] = [tên, fn]`, `HT_PROFILE[id]` | Kỹ Thuật Cao theo vũ khí + vùng ngắm |
| `skillProfile(p,id)` | vùng ngắm kỹ năng (`aim: 'dir'|'point'|null`, `shape`) |
| `dealDamage(target,dmg,attackerId,opts)` | mọi sát thương (giảm/tăng/chặn/hút máu) |
| `updatePartyExtras(dt)` | cập nhật mỗi khung |
| `drawW2Fx(now)` | vẽ hiệu ứng trong thế giới |
| `drawNetZones(now)` | vẽ `zones` (đồng bộ online) |
| `resetPlayerForRound(p)` | dọn trạng thái mỗi hiệp |
| `applyBuild(p)` | áp thẻ (build), kỹ năng = thẻ loại S |
| `makeWeapon(id,p)`, `wepAllowed`, `throwWeapon`, `reduceDurability` | khoá vũ khí |
| `cardsForPick(p,kind,n)`, `skipsPick(p)`, `cardClass` | bốc thẻ nâng cấp |
| `onHostData(g,m)` (chủ phòng nhận) / `onNetData(m)` (khách nhận), `netSend`, `netSendTo(id,m)` | online |
| `openPicker(src,slot,kind)`, `TAC[kind]`, `execTarget`, `p.pickTarget` | bảng chiến thuật |
| `ART2[id] = (c,w,r,x0,ch,now,p)` | vẽ vũ khí cầm tay, `MUZ[id]` = đầu nòng |

### Tiện ích hay dùng
`arcFoes(p,a,R,half)`, `lineFoes(p,a,L,pad)`, `rayFree(x,y,a,max)`, `umbFreeSpot(p,x,y)`, `startTravel(p,x,y,T,land,o,h)` (bay/nhảy, đang bay thì `air>0`), `trueDamage(e,d,id)`, `spawnBullet`, `htBullet(p,a,o)`, `dropBomb(p,x,y,dmg,R,delay)`, `explode(x,y,owner,dmg,R)`, `laserStrike(p,a,b,opt)`, `orbitalStrike(p,x,y)`, `warnLine`, `spotFor(e,viewerId,t)`, `afterImages`, `slashes.push({...})`, `beams.push({...})`, `zones.push({type,...})`, `ring/spark/smoke/flash/addShake/hitStop`, `floatText`, `AudioSys.playAt(type,x,y,vol)` (tên âm có thật: swing, slam, crit, whoosh, explosion, block, rail, smg, shotgun, shoot_heavy, legend, alarm, ui, select, tick, confirm).
`defS(id,icon,name,cd,ai,desc,cast,range)` (kỹ năng), `defP(id,icon,name,desc,apply)` (nội tại); `CARDS[id].masterOnly = true` để không lọt vào bộ bài thường.

## Bản đồ file rework (mới nhất ở dưới)
| File | Nội dung |
|---|---|
| `rework1.js` | Hiệu ứng chém/đâm mượt; Hoả Mai; Urumi; Kiếm Xà; Ám Khí |
| `rework2.js` | Raygun→ Railgun drone (`RG`), vũ khí **Kéo** (`SCISSORS`, `SC`), **Ma Đao Ngàn Lưỡi** làm lại (`MDS` mảnh, `W6`, Giải Phóng/Vạn Nhận Quy Tông, kỹ năng riêng ⚔ phím 4), thẻ **Sát Thủ Số 7** (`seven`, `isSeven`, `sevenArm`) |
| `rework3.js` | **Đại Đao** (Phá Thiên Tam Thức, Huyết Long Trảm), **Gậy Bóng Chày** (Bóng Nảy, Grand Slam) — `W7` |
| `rework4.js` | **Đa Khí Cụ** 7 dạng (`CUBE_FORMS`, `CUBE_SK`: E chuyển/M/G/H), đạn không nạp lại — `W8` |
| `rework5.js` | **Katana** mới (combo, lướt hất tung, đâm/Lốc Kiếm, Thiểm Ảnh Ngũ Trảm), **Tam Khúc Côn** 2 dạng, Rìu Pháo bắn vòng cung, Đa Khí Cụ báo trước dạng kế (`cubeNext`) — `W9` |
| `rework6.js` | Katana xoay chém cuối lướt; buff súng giảm thanh; **Bão Điện Từ**; Nỏ Nổ ghim; **VẠN TƯỢNG** (`VANTUONG`, bảng `VT`, `vtCur/vtOther/vtSwap`, Tàn Dư `VT_RES`, ảo ảnh `VTI`, `vtGiant`) — `W10` |
| `rework7.js` | +4 mould, thẻ **Chỉ Huy Sư Đoàn** (`commander`, `isCmd`, `cmdArm`), HUD **Hiệu Chỉnh** (`#vt-cal`, `vtCalibrate/vtCalApply/vtCalRender`), Sát Thủ 7 túi cố định + kỹ năng `mdBlades`, Ma Đao Giải Phóng bất tử + GĐ3 — `W11` |
| `rework8.js` | Laser vệ tinh mới (`laserBeam2`, bản tăng cường bám mục tiêu), buff/vẽ lại **Bộ Chỉ Điểm Laser**, mould Điểm Đánh Dấu (gunMod laser A→B), nội tại bảng như minimap |
| `rework9.js` | 4 mould độc quyền Chỉ Huy (`VT_EXCL`), thẻ độc quyền thay lợi thế (`sevenAdv`, `cmdAdv`), Hiệu Chỉnh online (msg `vtCal` / `vtCalSet`) |
| `rework10.js` | Tuyệt Diệt Quang kiểu vệ tinh + cột sáng lộ vị trí (`vtOrbital`, `selfBeacon`), nút 🔄 đổi mould (phím V) + 🎛️ Hiệu Chỉnh (phím 4), kỹ năng **Ép Xung** (`overclock`), vẽ lại **Bộ Định Vị Vệ Tinh** (`orbitalWarn2/orbitalBeam2`) |
| `rework11.js` | **Bảng chiến thuật 3 cấp** (`TAC_LEVEL`, `tacLevel`, ghi đè `bgWin` lúc load), đổi mould hồi 1s |
| `rework12.js` | **Ép Xung riêng 16 mould** (`VT_OC`), Nỏ Nổ ghim tường (`wallBolt`) — `W12` |
| `rework13.js` | Vũ khí **Bom** (`BOMB`), **Bom Lửa** (`FIREBOMBW`), **Phi Tiêu** (`SHURIKEN`) — vật ném riêng `W13`; Rìu Săn Dấu Săn (`huntN`, `bullet.hunt`) + Phát Cuối; **vẽ lại roi** (`drawWhip13`, thay vẽ `W2FX kind 'whip'`); Kim Cô Bổng **Định Thân** (`dinhThan`, `dinhT`) + Bậc Thầy **Chống Gậy** (`ruyiPerch`, dùng lại chọn điểm đáp) |

## Hệ thống đã chốt với người dùng
- **Vạn Tượng**: 16 mould = 12 thường (6 gần/6 xa) + 4 độc quyền Chỉ Huy (Khiên NL, Đầu Kiếm, Đầu Súng, Tia Lazer). Gậy thường luôn **1 gần + 1 xa**. Mỗi mould: đòn đánh `A`, buff, chiêu chuyển `S`, kỹ năng `K` (Bậc Thầy/Trang Bị Phụ), Ép Xung riêng. Thuộc nhánh vũ khí đa hình (`POLY_WEPS`).
- **Kỹ Thuật Cao** của Vạn Tượng = đổi mould tức thì (mould Điểm Đánh Dấu: Tuyệt Diệt Quang, cạn gậy; Chỉ Huy: KTC hồi ×2 thay vì mất gậy). Đổi mould hồi chung 1s.
- **Thẻ độc quyền** (chỉ ở lần chọn đầu, không cho người có lợi thế Bậc Thầy/Đa Hình): xoá lợi thế cũ, thay bằng lợi thế của thẻ, không chọn nâng cấp nữa.
  - Sát Thủ 7: túi 1 Ma Đao, túi 2 Kéo; skill Bậc Thầy, KTC, Vạn Đao Quy Nhất.
  - Chỉ Huy: 2 gậy Vạn Tượng; skill Bậc Thầy, KTC (đổi mould), Ép Xung; skill phụ Hiệu Chỉnh (nút/phím 4).
- **Bảng chiến thuật**: cấp 1 Mini / 2 Vùng / 3 Toàn map; Bản Đồ Nhỏ hoặc cầm Vạn Tượng +1 cấp (trừ đòn thường Điểm Đánh Dấu luôn Mini).

## Test (Playwright, Chromium có sẵn)
- Chạy server: `cd /home/user/Shoot && nohup python3 -m http.server 8765 >/dev/null 2>&1 &` (tắt thì khởi động lại).
- Script mẫu trong `tools/tests/` (chép ra scratchpad rồi `node tXXX.js`). `_harness.js` = phần khung: mở sandbox, xoá vật cản, đặt `window.R(id)` (trang bị vũ khí `id`, reset người chơi + hình nộm `players[1..]`, trả về mảng hình nộm) và `window.D()` (sát thương hình nộm 1 đã nhận).
- `audit.js [ID,ID]`: chạy mọi vũ khí × 4 hướng (đánh, giữ, Bậc Thầy/Trang Bị Phụ, KTC), báo sai hướng/hitbox; `audit_cards.js`: mọi thẻ kỹ năng. Nhiều cờ là nhiễu (chiêu vùng, đạn tản, chiêu trễ).
- Lưu ý test: `R()` không gọi `resetPlayerForRound` → hiệu ứng cũ còn sót; chiêu dùng `setTimeout` không chạy khi bước `update()` thủ công; test cũ có thể hỏng khi thiết kế đổi (ví dụ Hiệu Chỉnh không còn là ô kỹ năng).
- Ảnh chụp: `pg.screenshot({ clip })`, ghép bằng PIL để xem nhiều khung.

## Hạn chế còn biết
- Online: "dạng kế tiếp" của Đa Khí Cụ có thể hiện sai trên máy khách. Một số hiệu ứng riêng (mảng `W6…W12`, `USK`) không đồng bộ sang máy khách (chỉ `zones`, `bullets`, `slashes`… đồng bộ).
- Hoả Diệm chưa có âm thanh lửa riêng (`flame` không có trong `audio.js`).
- Nhãn "Chiến trường: bảng chỉ hiện vùng quanh bạn" (từ battleground.js) hiện cả ở chế độ thường khi bảng cấp 1–2.
