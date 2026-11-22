/** ==================== VẠN TƯỢNG: nút đổi mould · Tuyệt Diệt Quang kiểu vệ tinh · Chỉ Huy (Hiệu Chỉnh = skill phụ, Ép Xung) · Bộ Định Vị Vệ Tinh đẹp hơn ====================
 *  Nạp sau rework9.js.
 */

/* ============================== 1) TUYỆT DIỆT QUANG (mould Điểm Đánh Dấu · Kỹ Thuật Cao) ============================== */
// chọn điểm trên bảng → quỹ đạo huỷ diệt kiểu Bộ Định Vị Vệ Tinh; trong lúc gọi, cột sáng từ bạn chiếu lên trời làm bạn LỘ VỊ TRÍ; dùng xong gậy cạn năng lượng
TAC.vtGiant = { name: '☄️ TUYỆT DIỆT QUANG', need: 1, r: 170, col: '#f472b6', steps: ['CHẠM VÙNG HUỶ DIỆT (bạn sẽ bị lộ vị trí)'] };
vtGiant = function (p) {
    const w = getCurrentWeapon(p); let pt = p.pickTarget && p.pickTarget.a;
    if (!pt) { const e = enemiesOf(p).filter(q => q.hp > 0).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0]; pt = e ? { x: e.x, y: e.y } : { x: p.x + Math.cos(aimDir(p)) * 500, y: p.y + Math.sin(aimDir(p)) * 500 }; }
    const R = 170, warn = 1.8, dur = 1.4;
    zones.push({ type: 'orbitalWarn2', x: pt.x, y: pt.y, r: R, t: warn, maxT: warn, owner: p.id, tick: 0, pink: true });
    zones.push({ type: 'selfBeacon', x: p.x, y: p.y, r: 30, t: warn + dur, maxT: warn + dur, owner: p.id, tick: 0 });
    strikes.push({ kind: 'vtOrbital', owner: p.id, x: pt.x, y: pt.y, R, t: warn, dur, tick: 0, w });
    p.vtBeaconT = world.time + warn + dur; p.st.root = Math.max(p.st.root || 0, 0.6); p.st.shield = Math.min(200, (p.st.shield || 0) + 60); p.st.shieldT = Math.max(p.st.shieldT || 0, warn + dur);
    floatText(p.x, p.y - 50, '☄️ TUYỆT DIỆT QUANG — BẠN ĐANG BỊ LỘ!', '#f472b6', 15); AudioSys.playAt('alarm', pt.x, pt.y, 0.6, 4000); AudioSys.playAt('rail', p.x, p.y, 0.5);
};
const _updateStrikesR10 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikesR10(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (s.kind !== 'vtOrbital' || s.t > 0) continue;
        const o = players.find(q => q.id === s.owner);
        if (!s.z) { // giáng xuống: huỷ diệt tức thì + cháy tiếp
            s.z = { type: 'orbitalBeam2', x: s.x, y: s.y, r: s.R, t: s.dur, maxT: s.dur, owner: s.owner, tick: 0, pink: true }; zones.push(s.z);
            flash('#f472b6', 0.25); addShake(16); hitStop(0.1); AudioSys.playAt('explosion', s.x, s.y, 0.9, 4000); AudioSys.playAt('rail', s.x, s.y, 1, 4000);
            if (o) {
                enemiesOf(o).forEach(e => { if (e.hp > 0 && dist(e.x, e.y, s.x, s.y) < s.R + e.radius) { trueDamage(e, e.hp + (e.st.shield || 0) + 50, o.id); floatText(e.x, e.y - 50, '☠ TIÊU DIỆT', '#f472b6', 16); } });
                decoys.forEach(d => { if (d.owner !== o.id && dist(d.x, d.y, s.x, s.y) < s.R) d.hp = 0; });
                obstacles.slice().forEach(ob => { if (ob.wood && dist(ob.x + ob.w / 2, ob.y + ob.h / 2, s.x, s.y) < s.R) damageObstacle(ob, 300, o); });
                if (isCmd(o)) { const k = (o.skills || []).find(q => q.id === 'hightech'); if (k) k.cd = Math.max(k.cd, skillCooldown(o, 'hightech') * 2); floatText(o.x, o.y - 62, '🎖️ Gậy Chỉ Huy quá nhiệt (KTC hồi lâu gấp đôi)', '#fde68a', 12); }
                else { const j = o.inventory.indexOf(s.w); if (j >= 0) { o.inventory[j] = { ...WEAPONS.NONE }; floatText(o.x, o.y - 62, '🪄 VẠN TƯỢNG CẠN NĂNG LƯỢNG', '#94a3b8', 13); } }
            }
        }
        s.dur -= dt; s.tick -= dt;
        if (s.tick <= 0 && o) { s.tick = 0.1; enemiesOf(o).forEach(e => { if (e.hp > 0 && dist(e.x, e.y, s.x, s.y) < s.R + e.radius) dealDamage(e, 20, o.id, { knock: 30, angle: Math.atan2(e.y - s.y, e.x - s.x), noCharge: true }); }); }
        if (s.dur <= 0) { strikes.splice(i, 1); explosionFx(s.x, s.y, s.R * 0.8); for (let a = 0; a < 6.28; a += 0.6) zones.push({ type: 'scorch2', x: s.x + Math.cos(a) * s.R * 0.5, y: s.y + Math.sin(a) * s.R * 0.5, r: 60, t: 6, maxT: 6, owner: s.owner, tick: 0 }); }
    }
};
// Bộ Định Vị Vệ Tinh cũng dùng lớp vẽ mới (đổi loại vùng ngay khi được tạo, giữ nguyên chớp sáng / rung gốc)
const _orbitalStrikeR10 = orbitalStrike;
orbitalStrike = function (p, x, y) { const zn = zones.length; _orbitalStrikeR10(p, x, y); for (let i = zn; i < zones.length; i++) if (zones[i].type === 'orbitalWarn') zones[i].type = 'orbitalWarn2'; };
const _updateStrikesR10b = updateStrikes;
updateStrikes = function (dt) { _updateStrikesR10b(dt); strikes.forEach(s => { if (s.kind === 'orbital' && s.z && s.z.type === 'orbitalBeam') s.z.type = 'orbitalBeam2'; }); };

/* ============================== 2) NÚT ĐỔI MOULD + NÚT HIỆU CHỈNH (skill phụ của Chỉ Huy) ============================== */
function vtBtnSwap(p) {
    const w = p && getCurrentWeapon(p); if (!w || w.id !== 'VANTUONG' || !w.mods || p.hp <= 0 || p.stun > 0) return;
    if (p.vtBtnT > world.time) return; p.vtBtnT = world.time + 0.45;
    p.cooldown = Math.max(p.cooldown, 12); vtSwap(p, w);
}
function vtBtnCal(p) {
    if (!p || p.hp <= 0 || !isCmd(p)) return;
    if (p.calCd > 0) { if (!p.isBot) floatText(p.x, p.y - 30, `🎛️ ${Math.ceil(p.calCd)}s`, '#94a3b8', 12); return; }
    p.calCd = 6; vtCalibrate(p);
}
const vtLocalAct = kind => { const me = localPlayer(); if (!me || !['PLAYING', 'KO'].includes(gameState)) return; if (net.role === 'guest') netSend({ t: kind }); else (kind === 'vtSwapBtn' ? vtBtnSwap : vtBtnCal)(me); };
(function () {
    const mk = (id, txt, title, right, col) => { const b = document.createElement('button'); b.id = id; b.textContent = txt; b.title = title; b.style.cssText = `position:fixed;right:${right}px;bottom:220px;z-index:58;width:50px;height:50px;border-radius:50%;border:2px solid ${col};background:rgba(30,27,75,.85);color:#f5f3ff;font:800 20px system-ui;display:none;touch-action:manipulation;box-shadow:0 0 12px ${col}55`; document.body.appendChild(b); return b; };
    const s = mk('vt-swap', '🔄', 'Đổi mould (phím V)', 80, '#a78bfa'), c = mk('vt-calb', '🎛️', 'Hiệu Chỉnh (phím 4)', 18, '#f0abfc');
    ['touchstart', 'mousedown'].forEach(ev => { s.addEventListener(ev, e => { e.stopPropagation(); e.preventDefault(); vtLocalAct('vtSwapBtn'); }, { passive: false }); c.addEventListener(ev, e => { e.stopPropagation(); e.preventDefault(); vtLocalAct('vtCalBtn'); }, { passive: false }); });
    window.addEventListener('keydown', e => { if (e.repeat || vtCal || picker) return; const me = localPlayer(), w = me && getCurrentWeapon(me); if (!w || w.id !== 'VANTUONG') return; if (e.code === 'KeyV') vtLocalAct('vtSwapBtn'); if (e.code === 'Digit4') vtLocalAct('vtCalBtn'); });
})();
const _onHostDataR10 = onHostData;
onHostData = function (g, m) {
    if (m && (m.t === 'vtSwapBtn' || m.t === 'vtCalBtn')) { const p = players.find(q => q.id === g.id); (m.t === 'vtSwapBtn' ? vtBtnSwap : vtBtnCal)(p); return; }
    return _onHostDataR10(g, m);
};

/* ============================== 3) CHỈ HUY SƯ ĐOÀN: 3 skill = Bậc Thầy · Kỹ Thuật (đổi mould) · ÉP XUNG ============================== */
function vtOverclock(p) {
    const w = getCurrentWeapon(p); if (!w || w.id !== 'VANTUONG' || !w.mods) { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần cầm Vạn Tượng', '#94a3b8', 12); return; }
    if (vtCur(w) === 'beam') return vtLineAnnihilate(p);
    p.vtFuse = world.time + 6; const A = VT[w.mods[0]], B = VT[w.mods[1]];
    W11.push({ kind: 'fuse', owner: p.id, t: 0.7, T: 0.7, c1: A.col, c2: B.col });
    [A, B].forEach(M => { try { M.S.fn(p, w); } catch (e) { } });
    floatText(p.x, p.y - 56, `⚡ ÉP XUNG ${A.icon}+${B.icon} (6s)`, '#f0abfc', 16); flash('#c084fc', 0.08); addShake(6); AudioSys.playAt('legend', p.x, p.y, 0.5);
}
// Ép Xung của mould Tia Lazer: LASER TUYỆT DIỆT — cắm gậy, cảnh báo, tia khổng lồ từ bạn theo hướng chọn
function vtLineAnnihilate(p) {
    const a = aimDir(p), L = 1100, ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L, warn = 1.3;
    p.st.root = Math.max(p.st.root || 0, warn + 0.4); p.st.shield = Math.min(200, (p.st.shield || 0) + 60); p.st.shieldT = Math.max(p.st.shieldT || 0, warn + 1);
    warnLine(p, p.x, p.y, ex, ey, warn, true); W10.push({ kind: 'giantWarn', owner: p.id, x1: p.x, y1: p.y, x2: ex, y2: ey, t: warn, T: warn });
    p.shotQueue.push({ t: warn, fn: () => {
        if (p.hp <= 0) return;
        W10.push({ kind: 'giant', owner: p.id, x1: p.x, y1: p.y, x2: ex, y2: ey, t: 0.8, T: 0.8 });
        enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 45) { trueDamage(e, 260 * vD(p), p.id); e.stun = Math.max(e.stun, 0.8); floatText(e.x, e.y - 50, '〰️ LASER TUYỆT DIỆT', '#f0abfc', 14); } });
        flash('#e879f9', 0.18); addShake(14); hitStop(0.08); AudioSys.playAt('explosion', p.x, p.y, 0.8); AudioSys.playAt('rail', p.x, p.y, 1);
    } });
    floatText(p.x, p.y - 56, '〰️ ÉP XUNG · LASER TUYỆT DIỆT', '#f0abfc', 15);
}
defS('overclock', '⚡', 'Ép Xung', 14, 'engage', 'Cả 2 mould của cây gậy cùng xuất trận 6 giây (đòn thường tung kèm đòn mould kia, nhận buff cả 2, tung lại 2 chiêu chuyển). Đang ở mould Tia Lazer: LASER TUYỆT DIỆT — tia khổng lồ theo hướng chọn, 260 sát thương chuẩn.', p => vtOverclock(p), 1100);
CARDS.overclock.aim = 'dir'; CARDS.overclock.aimR = 1100; CARDS.overclock.masterOnly = true;
HT.VANTUONG = ['ĐỔI MOULD / TUYỆT DIỆT QUANG', p => { const w = getCurrentWeapon(p); if (!w || !w.mods) return; if (vtCur(w) === 'marker') return vtGiant(p); vtSwap(p, w); p.cooldown = 0; }];
CARDS.commander.desc = 'Chỉ xuất hiện ở LẦN CHỌN ĐẦU TIÊN. Cố định 2 cây VẠN TƯỢNG ở 2 túi (không gãy, không ném, không nhặt vũ khí khác), mở khoá 4 mould độc quyền. 3 kỹ năng: BẬC THẦY (chiêu riêng của mould) · KỸ THUẬT (đổi mould tức thì) · ÉP XUNG (2 mould cùng xuất trận; mould Tia Lazer: Laser Tuyệt Diệt). Skill phụ HIỆU CHỈNH (nút 🎛️ / phím 4): tự chọn 2 mould cho gậy đang cầm. ⚠ Xoá lợi thế hiện tại, thay bằng lợi thế Chỉ Huy Sư Đoàn. Không bao giờ được chọn nâng cấp.';
ADVANTAGES.cmdAdv.desc = CARDS.commander.desc;
const _skillProfileR10 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (id === 'overclock') return w && w.mods && vtCur(w) === 'beam' ? { aim: 'dir', R: 1100, shape: 'line', w: 90, col: '232,121,249', tag: '〰️ LASER TUYỆT DIỆT' } : { aim: null, shape: 'selfaoe', aoe: 80, col: '240,171,252', tag: w && w.mods ? `ÉP XUNG ${VT[w.mods[0]].icon}+${VT[w.mods[1]].icon}` : 'ÉP XUNG' };
    if (id === 'hightech' && w && w.id === 'VANTUONG' && w.mods && vtCur(w) !== 'marker') { const N = VT[vtOther(w)]; return { aim: null, shape: 'self', aoe: 40, col: '196,181,253', tag: `ĐỔI → ${N.icon} ${N.name}` }; }
    return _skillProfileR10(p, id);
};

/* ============================== CẬP NHẬT ============================== */
const _upeR10 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR10(dt);
    players.forEach(p => {
        if (p.calCd > 0) p.calCd -= dt;
        if (p.vtBeaconT > world.time && p.hp > 0) { enemiesOf(p).forEach(e => spotFor(p, e.id, 0.3)); zones.forEach(z => { if (z.type === 'selfBeacon' && z.owner === p.id) { z.x = p.x; z.y = p.y; } }); }
    });
    const me = localPlayer(), w = me && me.hp > 0 && getCurrentWeapon(me), on = !!(w && w.id === 'VANTUONG' && w.mods);
    const s = $('vt-swap'), c = $('vt-calb');
    if (s) { s.style.display = on ? 'block' : 'none'; if (on) s.textContent = VT[vtOther(w)].icon; }
    if (c) { const show = on && isCmd(me); c.style.display = show ? 'block' : 'none'; if (show) c.textContent = me.calCd > 0 ? Math.ceil(me.calCd) : '🎛️'; }
};

/* ============================== 4) HÌNH VẼ: Bộ Định Vị Vệ Tinh + quỹ đạo huỷ diệt + cột sáng lộ vị trí ============================== */
ART2.ORBITAB = (c, w, r, x0, ch, now) => {
    // thân máy tính bảng viền kim loại, màn hình radar quét, chảo vệ tinh xoay, hologram vệ tinh lơ lửng
    c.save();
    metal(c, x0 - 5, -9, 22, 18, '#312e81', 3); c.fillStyle = '#05071a'; c.fillRect(x0 - 3, -7, 18, 14);
    c.save(); c.beginPath(); c.rect(x0 - 3, -7, 18, 14); c.clip();
    c.strokeStyle = 'rgba(129,140,248,0.35)'; c.lineWidth = 0.6; for (let i = 1; i < 3; i++) { c.beginPath(); c.arc(x0 + 6, 0, i * 3.4, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(x0 - 3, 0); c.lineTo(x0 + 15, 0); c.moveTo(x0 + 6, -7); c.lineTo(x0 + 6, 7); c.stroke();
    const sw = now * 3; c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x0 + 6, 0, 0, x0 + 6, 0, 9); g.addColorStop(0, 'rgba(167,139,250,0.7)'); g.addColorStop(1, 'rgba(167,139,250,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x0 + 6, 0); c.arc(x0 + 6, 0, 9, sw - 0.7, sw); c.closePath(); c.fill();
    c.fillStyle = `rgba(244,114,182,${0.5 + Math.sin(now * 8) * 0.5})`; c.beginPath(); c.arc(x0 + 6 + Math.cos(1.3) * 4.5, Math.sin(1.3) * 4.5, 1.1, 0, Math.PI * 2); c.fill();
    c.restore();
    c.strokeStyle = '#a5b4fc'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 12, -9); c.lineTo(x0 + 14, -14); c.stroke(); // cần ăng-ten
    c.save(); c.translate(x0 + 14, -15); c.rotate(Math.sin(now * 1.5) * 0.5); c.fillStyle = '#c7d2fe'; c.beginPath(); c.ellipse(0, 0, 3.4, 1.6, 0, Math.PI, 0); c.fill(); c.strokeStyle = '#6366f1'; c.lineWidth = 0.6; c.stroke(); c.restore();
    // hologram vệ tinh
    const hy = -21 + Math.sin(now * 2.2) * 1.2; c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(167,139,250,0.18)'; c.beginPath(); c.moveTo(x0 + 1, -9); c.lineTo(x0 + 11, -9); c.lineTo(x0 + 8, hy + 3); c.lineTo(x0 + 4, hy + 3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(221,214,254,0.9)'; c.fillRect(x0 + 4.6, hy - 1.2, 2.8, 2.4); c.fillStyle = 'rgba(129,140,248,0.85)'; c.fillRect(x0 + 0.6, hy - 0.8, 3.4, 1.6); c.fillRect(x0 + 8, hy - 0.8, 3.4, 1.6);
    c.restore();
};
const _drawNetZonesR10 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZonesR10(now);
    zones.forEach(z => {
        const pink = z.pink, C1 = pink ? '244,114,182' : '167,139,250', C2 = pink ? '251,207,232' : '221,214,254';
        if (z.type === 'orbitalWarn2') { // tâm ngắm quỹ đạo: vòng ngoài xoay, vạch chia độ, tâm co lại, chữ đếm ngược
            const k = 1 - Math.max(0, z.t) / (z.maxT || 1), R = z.r;
            ctx.save();
            ctx.fillStyle = `rgba(${C1},${0.06 + k * 0.18})`; ctx.beginPath(); ctx.arc(z.x, z.y, R, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${C1},${0.6 + Math.sin(now * 14) * 0.3})`; ctx.lineWidth = 3; ctx.setLineDash([16, 8]); ctx.lineDashOffset = -now * 90; ctx.beginPath(); ctx.arc(z.x, z.y, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.lineWidth = 1.5; for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18 + now * 0.4, l = i % 3 ? 6 : 14; ctx.beginPath(); ctx.moveTo(z.x + Math.cos(a) * (R - l), z.y + Math.sin(a) * (R - l)); ctx.lineTo(z.x + Math.cos(a) * R, z.y + Math.sin(a) * R); ctx.stroke(); }
            ctx.strokeStyle = `rgba(${C2},0.9)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, R * (1 - k) + 12, 0, Math.PI * 2); ctx.stroke();
            [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 - now * 1.4; ctx.beginPath(); ctx.moveTo(z.x + Math.cos(a) * R * 0.25, z.y + Math.sin(a) * R * 0.25); ctx.lineTo(z.x + Math.cos(a) * R * 0.55, z.y + Math.sin(a) * R * 0.55); ctx.stroke(); });
            ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createLinearGradient(z.x, z.y - 900, z.x, z.y); lg.addColorStop(0, `rgba(${C1},0)`); lg.addColorStop(1, `rgba(${C1},${0.15 + k * 0.35})`); ctx.fillStyle = lg; ctx.fillRect(z.x - 3 - k * 6, z.y - 900, 6 + k * 12, 900);
            ctx.globalCompositeOperation = 'source-over'; ctx.font = `700 ${18 + k * 6}px ${FONT}`; ctx.fillStyle = `rgba(255,241,242,${0.6 + Math.sin(now * 12) * 0.4})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.max(0, z.t).toFixed(1), z.x, z.y);
            ctx.restore();
        } else if (z.type === 'orbitalBeam2') { // cột vệ tinh giáng xuống
            const life = z.maxT - z.t; if (life < (z.t0 || 0)) return;
            const fade = Math.min(1, z.t / 0.3), R = z.r; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
            const cg = ctx.createLinearGradient(z.x - R, 0, z.x + R, 0); cg.addColorStop(0, `rgba(${C1},0)`); cg.addColorStop(0.5, `rgba(${C1},0.4)`); cg.addColorStop(1, `rgba(${C1},0)`); ctx.fillStyle = cg; ctx.fillRect(z.x - R, z.y - 1400, R * 2, 1400);
            ctx.fillStyle = `rgba(${C2},0.85)`; const cw = R * 0.35 * (1 + Math.sin(now * 34) * 0.08); ctx.fillRect(z.x - cw / 2, z.y - 1400, cw, 1400);
            const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, R * 1.15); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, `rgba(${C2},0.75)`); g.addColorStop(1, `rgba(${C1},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, R * 1.15, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${C2},0.9)`; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const rr = ((now * 1.6 + i / 3) % 1) * R; ctx.globalAlpha = fade * (1 - rr / R); ctx.beginPath(); ctx.arc(z.x, z.y, rr, 0, Math.PI * 2); ctx.stroke(); }
            ctx.restore();
            for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28, r = Math.random() * R; particles.push({ x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r, vx: (Math.random() - 0.5) * 60, vy: -220 - Math.random() * 260, life: 0.45, maxLife: 0.45, color: Math.random() < 0.5 ? `rgb(${C2})` : '#ffffff', size: 3, glow: true }); }
        } else if (z.type === 'selfBeacon') { // cột sáng từ người gọi chiếu lên trời (lộ vị trí)
            const k = Math.min(1, z.t / 0.3); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
            const g = ctx.createLinearGradient(z.x - 16, 0, z.x + 16, 0); g.addColorStop(0, 'rgba(244,114,182,0)'); g.addColorStop(0.5, 'rgba(251,207,232,0.55)'); g.addColorStop(1, 'rgba(244,114,182,0)'); ctx.fillStyle = g; ctx.fillRect(z.x - 16, z.y - 1400, 32, 1400);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(z.x - 2, z.y - 1400, 4, 1400);
            ctx.strokeStyle = `rgba(244,114,182,${0.5 + Math.sin(now * 10) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, 26 + Math.sin(now * 6) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
    });
};
