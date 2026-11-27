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
- `index.html` nạp script theo thứ tự (cuối danh sách): `… weapons5.js, rework1.js … rework20.js, sandbox.js, battleground.js, fixes.js, icons.js, main.js`.
- **Biến toàn cục dùng chung giữa file** (`const/let` top-level). Hàm khai báo `function f(){}` có thể gán lại: mẫu wrapper
  `const _fR7 = f; f = function (...a) { ...; return _fR7(...a); };`
  → **tên biến lưu hàm cũ phải duy nhất** (dùng hậu tố `R7`, `R12`…). Trước khi thêm, grep trùng tên `const X\b` trong `js/*.js`.
- File nạp SAU rework (`sandbox.js`, `battleground.js`, `fixes.js`) khai báo `POLY_WEPS`, `bgWin`, `drawPicker`… → muốn ghi đè thì làm trong `window.addEventListener('load', ...)`.
- **Quy tắc vòng lặp duyệt ngược** `for (let i = A.length - 1; i >= 0; i--) { const x = A[i]; if (!x) continue; …` — hạ gục có thể kết thúc hiệp và XOÁ SẠCH mảng ngay giữa vòng lặp; luôn có chốt `if (!x) continue;` (đã thêm cho 84 vòng lặp cũ).
- **Không tính góc từ người chưa xuất hiện** (Chiến trường có hồi sinh: `x/y` có thể `undefined` → `atan2` = NaN); rework19 có lưới an toàn nhưng code mới vẫn nên kiểm `isFinite`.
- Muốn biết sát thương đến từ đâu (đòn thường / kỹ năng): dùng `gunSrcR19(A, target, opts)` / `isSkillDmgR19(opts)` (rework19).
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
`arcFoes(p,a,R,half)`, `lineFoes(p,a,L,pad)`, `rayFree(x,y,a,max)`, `umbFreeSpot(p,x,y)`, `startTravel(p,x,y,T,land,o,h)` (bay/nhảy, đang bay thì `air>0`), `trueDamage(e,d,id)`, `spawnBullet`, `htBullet(p,a,o)`, `dropBomb(p,x,y,dmg,R,delay)`, `explode(x,y,owner,dmg,R)`, `laserStrike(p,a,b,opt)`, `orbitalStrike(p,x,y)`, `warnLine`, `spotFor(e,viewerId,t)`, `afterImages`, `slashes.push({...})`, `beams.push({...})`, `zones.push({type,...})`, `ring/spark/smoke/flash/addShake/hitStop`, `floatText`, `AudioSys.playAt(type,x,y,vol)` (tên âm: xem `assets/audio/audio.json` — gồm cả laser, teleport, zap, ground, clang, glass, ricochet, sniper, cannon, magic, spell, whip, freeze, heal, shield, shield_up, throw, flame, chainsaw, bow…).
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
| `rework13.js` | Vũ khí **Bom** (`BOMB`), **Bom Lửa** (`FIREBOMBW`), **Phi Tiêu** (`SHURIKEN`) — vật ném riêng `W13`; Rìu Săn Dấu Săn (`huntN`, `bullet.hunt`) + Phát Cuối; **vẽ lại roi** (`drawWhip13`, thay vẽ `W2FX kind 'whip'`); Kim Cô Bổng **Định Thân** (`dinhThan`, `dinhT`) + Bậc Thầy **Chống Gậy** (`ruyiPerch`, dùng lại chọn điểm đáp); **tạm tắt biến cố "Thêm Người Thêm Vui" khi online** (`r13NoMore` → đổi thành Đấu Trường Mở Rộng); điện thoại: nút 🔄/🎛️ Vạn Tượng đặt theo `touchLayout()` (`r13PlaceVtBtns`), `#vt-cal` vuốt được (`touch-action:pan-y`) |
| `rework14.js` | **Cân bằng**: máu cơ bản **600** (`BASE_HP_R14`, cộng sau `resetPlayerForRound`), vũ khí dễ trúng giảm sát thương theo vũ khí đang cầm (`EASY_NERF_R14`, bọc `dealDamage` + `trueDamage`), Hỏa Mai **999** sát thương chuẩn |
| `rework15.js` | **Súng: 2 băng = 1 mạng** — hệ số theo số đo 1 băng (`MAG_DMG_R15` → `GUN_BUFF_R15`, đo bằng `t136.js`), Sniper mỗi viên đúng 100 (`SNIPER_HIT_R15`, raw) |
| `rework16.js` | **Độ bền**: cận chiến/khiên/đa hình mỗi đòn −1 dù trượt (bỏ −1 khi trúng), dò chặn đạn chung (`blockScanR16`, −max(2, dmg/8); khiên ×2), vũ khí combo = số đòn × 5 (`COMBO_LEN_R16`) |
| `rework17.js` | **Cưa Máy làm lại** (`sawFire17`: rồ máy `sawRev`, nhiệt `sawHeat`/quá nhiệt `sawJam`, Xé Thịt, thả = Lao Cưa; Bậc Thầy Đĩa Cưa Bay, KTC Bão Cưa — `W17`); **buff Vạn Tượng** (sửa thẳng `VT[k].buff`, Điểm Đánh Dấu mạnh nhất) + **Chỉ Huy** (+200 máu, hồi chiêu −25%, +10% sát thương, tự hồi máu); **đầu gậy riêng 16 mould** (`VT_HEAD17`, ghi đè `ART2.VANTUONG`); **Huyền Cơ** chặn đạn: dạng Mở đứng yên, dạng Huyền Cơ chậm (bọc `blockBulletsArc`) |
| `rework18.js` | **Gắn 17 âm nhóm C** (xem `AUDIO_MOI.md`): lớp đổi tên âm theo ngữ cảnh bọc `AudioSys.playAt/play` — ngăn xếp `SND_CTX18` (vũ khí / `VT:mould` / `S:kỹ năng` / `SP:phép`), bảng `SND_MAP18`, đoán theo người đứng tại chỗ phát; âm kèm: nổ đầu roi, đạn nảy (`updateBullets`), đóng băng (`frozenT`); thiếu file thì giữ âm cũ. Muốn gắn âm mới cho vũ khí: thêm dòng vào `SND_MAP18` |
| `rework19.js` | **Sửa sau rà soát**: nhãn NGUỒN SÁT THƯƠNG (`SRC19`, `runCtx19`: đạn/vật ném/vùng/hàng đợi do đòn thường → `_atkW`, do kỹ năng/phép → `_skill`; `gunSrcR19`, `isSkillDmgR19`) → buff súng rework15 chỉ áp đòn bắn thường, nerf rework14 không áp kỹ năng; **lưới an toàn NaN** (góc, lực đẩy, toạ độ, âm thanh, góc đẩy lùi) |
| `rework20.js` | **Nhân theo tỉ lệ máu mới** `HEALK = 600/200 = 3`: hồi máu CỐ ĐỊNH đã sửa tại chỗ ở file gốc thành `(x) * HEALK` (34 chỗ; KHÔNG nhân hồi theo % máu / hút máu theo % sát thương); máu Robot/Titan/Mech ×HEALK; **sát thương kỹ năng/phép ×HEALK** (đòn trực tiếp, đạn/vật/vùng của kỹ năng, không kích do kỹ năng gọi `strikeOwner20`, cú đáp sau nhảy từ kỹ năng `_landSkill20`, triệu hồi `opts.summon`); khiên từ kỹ năng ×HEALK. Đòn đánh thường vũ khí KHÔNG đổi |

## Hệ thống đã chốt với người dùng
- **Máu cơ bản 600.** Vũ khí dễ trúng ×0.8 (Tesla, Phun Lửa, Súng Băng, Roi Điện, Urumi, Railgun, Shotgun, AR Giảm Thanh, Bộ Cơ Động, Đĩa Nảy, Nỏ Liên Châu, Minigun), Ma Đao (người dùng gọi "Ám đao") ×0.9. Ám Khí không giảm. Hỏa Mai 999.
- **Tỉ lệ máu mới (rework20)**: hồi máu cố định, sát thương kỹ năng/phép/triệu hồi/không kích của kỹ năng, khiên từ kỹ năng, máu Robot/Titan ×3. Code mới: hồi cố định viết `x * HEALK`; sát thương kỹ năng viết theo mốc 200 máu cũ (tự ×3), đòn thường vũ khí viết theo mốc 600.
- **Súng**: trúng hết 2 băng gốc = 600 (1 mạng); súng đã mạnh hơn thì giữ. Sniper: mỗi viên đúng 100 → đủ 6 viên. Không áp: Hỏa Mai, Boomerang, Súng Lưới, súng chiến thuật, đa hình.
- **Độ bền**: mỗi đòn cận chiến/đa hình đều tốn (trúng hay trượt); chặn đạn tốn nhiều; vũ khí combo bền 5 lượt combo rồi gãy.
- **Vạn Tượng buff** (rework17): mọi mould sát thương ×1.2, chịu đòn ×0.88, chạy ×1.05, độ bền 120; **Điểm Đánh Dấu mạnh nhất** (×1.5 / ×0.8 / ×1.12, dấu nổ ×1.25). **Chỉ Huy**: +200 máu, hồi chiêu −25%, +10% sát thương, hồi 4 máu/giây khi 3 giây không bị đánh.
- **Huyền Cơ**: dạng Mở chặn đạn → đứng yên 0.45s; dạng Huyền Cơ chặn đạn → chậm 0.9s.
- **Vạn Tượng**: 16 mould = 12 thường (6 gần/6 xa) + 4 độc quyền Chỉ Huy (Khiên NL, Đầu Kiếm, Đầu Súng, Tia Lazer). Gậy thường luôn **1 gần + 1 xa**. Mỗi mould: đòn đánh `A`, buff, chiêu chuyển `S`, kỹ năng `K` (Bậc Thầy/Trang Bị Phụ), Ép Xung riêng. Thuộc nhánh vũ khí đa hình (`POLY_WEPS`).
- **Kỹ Thuật Cao** của Vạn Tượng = đổi mould tức thì (mould Điểm Đánh Dấu: Tuyệt Diệt Quang, cạn gậy; Chỉ Huy: KTC hồi ×2 thay vì mất gậy). Đổi mould hồi chung 1s.
- **Thẻ độc quyền** (chỉ ở lần chọn đầu, không cho người có lợi thế Bậc Thầy/Đa Hình): xoá lợi thế cũ, thay bằng lợi thế của thẻ, không chọn nâng cấp nữa.
  - Sát Thủ 7: túi 1 Ma Đao, túi 2 Kéo; skill Bậc Thầy, KTC, Vạn Đao Quy Nhất.
  - Chỉ Huy: 2 gậy Vạn Tượng; skill Bậc Thầy, KTC (đổi mould), Ép Xung; skill phụ Hiệu Chỉnh (nút/phím 4).
- **Bảng chiến thuật**: cấp 1 Mini / 2 Vùng / 3 Toàn map; Bản Đồ Nhỏ hoặc cầm Vạn Tượng +1 cấp (trừ đòn thường Điểm Đánh Dấu luôn Mini).

## Test (Playwright, Chromium có sẵn)
- Rà soát: ESLint có sẵn (`/opt/node-tools/node_modules/eslint`, luật `no-undef`/`no-dupe-keys`…); acorn để phân tích tĩnh (hàm khai báo lại, gán đè không gọi hàm cũ, mục bảng trùng). Lỗi hiếm → chạy 3 trận Chiến trường song song ~3 phút và ghi `console.error` kèm stack.
- Chạy server: `cd /home/user/Shoot && nohup python3 -m http.server 8765 >/dev/null 2>&1 &` (tắt thì khởi động lại).
- Script mẫu trong `tools/tests/` (chép ra scratchpad rồi `node tXXX.js`). `_harness.js` = phần khung: mở sandbox, xoá vật cản, đặt `window.R(id)` (trang bị vũ khí `id`, reset người chơi + hình nộm `players[1..]`, trả về mảng hình nộm) và `window.D()` (sát thương hình nộm 1 đã nhận).
- `audit.js [ID,ID]`: chạy mọi vũ khí × 4 hướng (đánh, giữ, Bậc Thầy/Trang Bị Phụ, KTC), báo sai hướng/hitbox; `audit_cards.js`: mọi thẻ kỹ năng. Nhiều cờ là nhiễu (chiêu vùng, đạn tản, chiêu trễ).
- Lưu ý test: `R()` không gọi `resetPlayerForRound` → hiệu ứng cũ còn sót; chiêu dùng `setTimeout` không chạy khi bước `update()` thủ công; test cũ có thể hỏng khi thiết kế đổi (ví dụ Hiệu Chỉnh không còn là ô kỹ năng).
- Điện thoại: `devices['Pixel 7 landscape']`; vuốt thật bằng CDP `Input.dispatchTouchEvent` (touchStart/Move/End) — `synthesizeScrollGesture` không đáng tin (xem `t134.js`). Lưu ý `style.css` có `* { touch-action: none }` → bảng DOM cần cuộn phải tự đặt `touch-action: pan-y`.
- Ảnh chụp: `pg.screenshot({ clip })`, ghép bằng PIL để xem nhiều khung.

## Hạn chế còn biết
- Biến cố "THÊM NGƯỜI THÊM VUI" (thêm 4 bot tạm, `modes.js`) lỗi khi online → đang tạm tắt online (rework13.js), offline vẫn có.
- Online: "dạng kế tiếp" của Đa Khí Cụ có thể hiện sai trên máy khách. Một số hiệu ứng riêng (mảng `W6…W12`, `USK`) không đồng bộ sang máy khách (chỉ `zones`, `bullets`, `slashes`… đồng bộ).
- Nhãn "Chiến trường: bảng chỉ hiện vùng quanh bạn" (từ battleground.js) hiện cả ở chế độ thường khi bảng cấp 1–2.
