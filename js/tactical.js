/** ==================== MÁY TÍNH BẢNG CHIẾN THUẬT (kiểu Brimstone) · 4 ĐÒN GỌI HOẢ LỰC MỚI ====================
 *  Mọi kỹ năng gọi hoả lực mở bảng chiến thuật: bản đồ toàn trận có lưới toạ độ, chạm chọn điểm / hướng ngay trên bản đồ.
 *  Trận đấu không dừng. Nạp sau meleefx.js (dùng lại hệ thống picker trong strikes.js).
 */

/* ============================== LOẠI MỤC TIÊU ============================== */
// need: số điểm cần chọn · line: nối 2 điểm (độ dài tối đa) · dir: điểm + hướng bay · r: bán kính vùng · multi: chọn nhiều rồi XÁC NHẬN
const TAC = {
    airstrike: { name: '✈️ KHÔNG KÍCH', need: 2, dir: true, col: '#fbbf24', steps: ['CHẠM ĐIỂM MỤC TIÊU', 'CHẠM HƯỚNG MÁY BAY BAY TỚI'] },
    carpet:    { name: '💣 THẢ BOM', need: 2, line: 700, col: '#fb923c', steps: ['CHẠM ĐIỂM A', 'CHẠM ĐIỂM B (tối đa 700)'] },
    laser:     { name: '🛰️ LASER VỆ TINH', need: 2, line: 700, col: '#f472b6', steps: ['CHẠM ĐIỂM A', 'CHẠM ĐIỂM B (tối đa 700)'] },
    napalm:    { name: '🔥 BOM NAPALM', need: 2, line: 380, col: '#f97316', steps: ['CHẠM ĐẦU VỆT LỬA', 'CHẠM CUỐI VỆT LỬA (tối đa 380)'] },
    arty:      { name: '🎯 PHÁO KÍCH', need: 1, r: 130, col: '#fca5a5', steps: ['CHẠM VÙNG PHÁO KÍCH'] },
    orbital:   { name: '☄️ QUỸ ĐẠO HUỶ DIỆT', need: 1, r: 190, col: '#a78bfa', steps: ['CHẠM VÙNG HUỶ DIỆT'] },
    incend:    { name: '🔥 BOM CHÁY', need: 1, r: 140, col: '#fb923c', steps: ['CHẠM ĐIỂM THẢ'] },
    cluster:   { name: '💥 BOM CHÙM', need: 1, r: 170, col: '#facc15', steps: ['CHẠM ĐIỂM THẢ'] },
    smokes:    { name: '🌫️ KHÓI CHIẾN THUẬT', need: 3, multi: true, r: 135, col: '#cbd5e1', steps: ['CHẠM TỐI ĐA 3 ĐIỂM KHÓI · BẤM XÁC NHẬN'] }
};

/* ============================== 4 ĐÒN MỚI ============================== */
function orbitalStrike(p, x, y) {
    const warn = strikeWarnT(p, 1.6), R = 190 * payload(p);
    zones.push({ type: 'orbitalWarn', x, y, r: R, t: warn, maxT: warn, owner: p.id, tick: 0 });
    strikes.push({ kind: 'orbital', owner: p.id, x, y, R, t: warn, dur: 2.6, tick: 0 });
    floatText(p.x, p.y - 42, '☄️ QUỸ ĐẠO HUỶ DIỆT!', '#c4b5fd', 18); AudioSys.playAt('alarm', x, y, 0.5, 4000);
}
function incendiary(p, x, y) {
    const warn = strikeWarnT(p, 0.7);
    zones.push({ type: 'artyWarn', x, y, r: 140, t: warn, maxT: warn, owner: p.id, tick: 0 });
    strikes.push({ kind: 'incend', owner: p.id, x, y, t: warn });
}
function clusterBomb(p, x, y) {
    const warn = strikeWarnT(p, 1.0);
    zones.push({ type: 'artyWarn', x, y, r: 170, t: warn, maxT: warn, owner: p.id, tick: 0 });
    for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 170; dropBomb(p, x + Math.cos(a) * r, y + Math.sin(a) * r, 60 * payload(p), 70 * payload(p), warn + 0.3 + Math.random() * 0.6); }
    floatText(p.x, p.y - 42, '💥 BOM CHÙM!', '#facc15', 16);
}
function tacSmokes(p, pts) {
    pts.slice(0, 3).forEach((q, i) => strikes.push({ kind: 'smokeDrop', owner: p.id, x: q.x, y: q.y, t: 0.6 + i * 0.15 }));
    floatText(p.x, p.y - 42, '🌫️ KHÓI CHIẾN THUẬT', '#e2e8f0', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
}
function napalmLine(p, a, b) {
    const warn = strikeWarnT(p, 0.6), L = dist(a.x, a.y, b.x, b.y);
    warnLine(p, a.x, a.y, b.x, b.y, warn, false);
    for (let d = 0; d <= L; d += 50) { const k = L ? d / L : 0; strikes.push({ kind: 'napalm2', owner: p.id, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, t: warn + d / 900 }); }
    floatText(p.x, p.y - 42, '🔥 NAPALM!', '#fb923c', 16);
}
const _updateStrikes16 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes16(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i], o = players.find(q => q.id === s.owner);
        if (s.kind === 'orbital') {
            if (s.t > 0) continue; // updateStrikes gốc đã trừ t
            if (!s.z) { s.z = { type: 'orbitalBeam', x: s.x, y: s.y, r: s.R, t: s.dur, maxT: s.dur, owner: s.owner, tick: 0 }; zones.push(s.z); flash('#c4b5fd', 0.2); addShake(14); AudioSys.playAt('rail', s.x, s.y, 0.8, 4000); }
            s.dur -= dt; s.tick -= dt;
            if (s.tick <= 0 && o) {
                s.tick = 0.1; addShake(3);
                players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && dist(e.x, e.y, s.x, s.y) < s.R + e.radius) { dealDamage(e, 26 * payload(o), o.id, { angle: Math.atan2(e.y - s.y, e.x - s.x), knock: 30, noCharge: true }); e.st.slow = Math.max(e.st.slow || 0, 0.3); } });
                obstacles.slice().forEach(ob => { if (ob.wood && dist(ob.x + ob.w / 2, ob.y + ob.h / 2, s.x, s.y) < s.R) damageObstacle(ob, 25, o); });
            }
            if (s.dur <= 0) { strikes.splice(i, 1); explosionFx(s.x, s.y, s.R * 0.8); }
        } else if (s.kind === 'incend' && s.t <= 0) {
            strikes.splice(i, 1); explosionFx(s.x, s.y, 60);
            zones.push({ type: 'fire', x: s.x, y: s.y, r: 140, t: 5, maxT: 5, owner: s.owner, tick: 0 });
            strikes.push({ kind: 'burnZone', owner: s.owner, x: s.x, y: s.y, R: 140, t: 5, tick: 0 });
        } else if (s.kind === 'napalm2' && s.t <= 0) {
            strikes.splice(i, 1); explosionFx(s.x, s.y, 45);
            zones.push({ type: 'fire', x: s.x, y: s.y, r: 60, t: 4.5, maxT: 4.5, owner: s.owner, tick: 0 });
            strikes.push({ kind: 'burnZone', owner: s.owner, x: s.x, y: s.y, R: 60, t: 4.5, tick: 0 });
        } else if (s.kind === 'burnZone') { // lửa của gọi hoả lực đốt mạnh hơn lửa thường
            s.tick -= dt;
            if (s.tick <= 0 && o) { s.tick = 0.25; players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && !(e.air > 0) && dist(e.x, e.y, s.x, s.y) < s.R + e.radius) dealDamage(e, 9 * payload(o), o.id, { zone: true, burn: true }); }); }
            if (s.t <= 0) strikes.splice(i, 1);
        } else if (s.kind === 'smokeDrop' && s.t <= 0) {
            strikes.splice(i, 1);
            zones.push({ type: 'smoke', x: s.x, y: s.y, r: 135, t: 9, maxT: 9, owner: s.owner, tick: 0 });
            smoke(s.x, s.y, 14, 'rgba(180,190,210,0.5)', 30); AudioSys.playAt('whoosh', s.x, s.y, 0.35);
        }
    }
};

/* ============================== THẺ: mọi đòn gọi hoả lực dùng bảng chiến thuật ============================== */
defS('orbitalStrike', '☄️', 'Quỹ Đạo Huỷ Diệt', 45, 'engage', 'Mở bảng chiến thuật, chọn 1 vùng. Cảnh báo 1.6 giây rồi cột năng lượng từ vệ tinh thiêu cháy vùng bán kính 190 trong 2.6 giây (~260 sát thương/giây).', p => { const t = p.pickTarget; const c = t ? t.a : autoPoint(p); orbitalStrike(p, c.x, c.y); }, 2000);
defS('incendiary', '🔥', 'Bom Cháy', 16, 'engage', 'Mở bảng chiến thuật, chọn 1 điểm: thả bom cháy tạo biển lửa bán kính 140 trong 5 giây.', p => { const c = p.pickTarget ? p.pickTarget.a : autoPoint(p); incendiary(p, c.x, c.y); }, 2000);
defS('clusterBomb', '💥', 'Bom Chùm', 22, 'engage', 'Mở bảng chiến thuật, chọn 1 điểm: 14 quả bom nhỏ rơi rải rác trong bán kính 170.', p => { const c = p.pickTarget ? p.pickTarget.a : autoPoint(p); clusterBomb(p, c.x, c.y); }, 2000);
defS('tacSmoke', '🌫️', 'Khói Chiến Thuật', 18, 'escape', 'Mở bảng chiến thuật, chọn tối đa 3 điểm rồi xác nhận: khói dày rơi xuống từng điểm (9 giây).', p => { const pts = p.pickPts && p.pickPts.length ? p.pickPts : [autoPoint(p)]; tacSmokes(p, pts); }, 2000);
function autoPoint(p) { const e = enemyOf(p); return e && e.hp > 0 ? { x: e.x, y: e.y } : { x: p.x + Math.cos(p.angle) * 350, y: p.y + Math.sin(p.angle) * 350 }; }
Object.assign(CARDS.airstrike, { picker: 'airstrike', aim: undefined, desc: 'Mở bảng chiến thuật: chạm điểm mục tiêu rồi chạm hướng bay. Máy bay bay xuyên bản đồ qua điểm đó, rải bom (100 sát thương mỗi quả).', cast: p => {
    const t = p.pickTarget;
    if (t) planeStrike(p, Math.atan2(t.b.y - t.a.y, t.b.x - t.a.x), t.a.x, t.a.y, { from: -300, to: 300 });
    else { const c = autoPoint(p), a = Math.atan2(c.y - p.y, c.x - p.x); planeStrike(p, a, c.x, c.y, { from: -300, to: 300 }); }
} });
Object.assign(CARDS.artyCall, { picker: 'arty', aim: undefined, desc: 'Mở bảng chiến thuật, chọn 1 vùng: 3 loạt pháo (75 sát thương mỗi quả) rơi quanh đó.', cast: p => { const c = p.pickTarget ? p.pickTarget.a : autoPoint(p); artyStrike(p, c.x, c.y); } });
Object.assign(CARDS.napalmStrike, { picker: 'napalm', aim: undefined, desc: 'Mở bảng chiến thuật, chọn đầu và cuối vệt lửa (tối đa 380): rải napalm cháy 4.5 giây.', cast: p => { const t = p.pickTarget; if (t) napalmLine(p, t.a, clampLen(t.a, t.b, 380)); else { const c = autoPoint(p), a = Math.atan2(c.y - p.y, c.x - p.x); napalmLine(p, { x: c.x - Math.cos(a) * 190, y: c.y - Math.sin(a) * 190 }, { x: c.x + Math.cos(a) * 190, y: c.y + Math.sin(a) * 190 }); } } });
CARDS.carpetBomb.desc = 'Mở bảng chiến thuật: chạm điểm A rồi điểm B (tối đa 700). Bom rải dọc từ A tới B (95 sát thương mỗi quả).';
CARDS.orbitalLaser.desc = 'Mở bảng chiến thuật: chạm A rồi B. Laser vệ tinh quét từ A tới B trong 2 giây (~180 sát thương/giây).';
CARDS.orbitalStrike.picker = 'orbital'; CARDS.incendiary.picker = 'incend'; CARDS.clusterBomb.picker = 'cluster'; CARDS.tacSmoke.picker = 'smokes';
CARDS.carpetBomb.picker = 'carpet'; CARDS.orbitalLaser.picker = 'laser';
FIRE_SKILLS.push('orbitalStrike', 'incendiary', 'clusterBomb', 'tacSmoke');
function clampLen(a, b, L) { const d = dist(a.x, a.y, b.x, b.y); return d <= L ? b : { x: a.x + (b.x - a.x) / d * L, y: a.y + (b.y - a.y) / d * L }; }
[
    { id: 'doomsday', a: 'orbitalStrike', b: 'bigPayload', name: 'Ngày Tận Thế', desc: 'Quỹ Đạo Huỷ Diệt kéo dài thêm 1 giây.' },
    { id: 'firestorm', a: 'incendiary', b: 'napalmStrike', name: 'Bão Lửa', desc: 'Bom Cháy và Napalm cháy lâu gấp rưỡi.' },
    { id: 'smokeScreen', a: 'tacSmoke', b: 'fastComms', name: 'Màn Khói Thần Tốc', desc: 'Khói Chiến Thuật hồi chiêu nhanh hơn 6 giây.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
const _skillCd16 = skillCooldown;
skillCooldown = function (p, id) { let cd = _skillCd16(p, id); if (id === 'tacSmoke' && combo(p, 'smokeScreen')) cd -= 6; return Math.max(1, cd); };
const _orbital16 = orbitalStrike; orbitalStrike = function (p, x, y) { _orbital16(p, x, y); if (combo(p, 'doomsday')) { const s = strikes[strikes.length - 1]; if (s && s.kind === 'orbital') s.dur += 1; } };
// Bão Lửa: kéo dài vùng lửa của Bom Cháy / Napalm
const _upStr16b = updateStrikes;
updateStrikes = function (dt) { const n = strikes.length; _upStr16b(dt); for (let i = 0; i < strikes.length; i++) { const s = strikes[i]; if (s.kind === 'burnZone' && !s.fs) { s.fs = true; const o = players.find(q => q.id === s.owner); if (o && combo(o, 'firestorm')) { s.t *= 1.5; const z = zones.find(q => q.type === 'fire' && q.owner === s.owner && Math.abs(q.x - s.x) < 1 && Math.abs(q.y - s.y) < 1); if (z) { z.t *= 1.5; z.maxT = z.t; } } } } };

/* ============================== BẢNG CHIẾN THUẬT: mở · chọn · xác nhận ============================== */
openPicker = function (src, slot, kind) { picker = { src, slot, kind, pts: [], hover: null, t0: world.time }; AudioSys.play('select', 0.4); };
pickerRect = function () {
    const W = SCREEN_W, H = SCREEN_H, padX = 22, head = 44, foot = 46;
    const k = Math.min((W * 0.94 - padX * 2) / MAP_W, (H * 0.92 - head - foot - 16) / MAP_H), w = MAP_W * k, h = MAP_H * k;
    const fw = w + padX * 2, fh = h + head + foot + 16, fx = (W - fw) / 2, fy = (H - fh) / 2;
    const x = fx + padX, y = fy + head;
    return { x, y, w, h, k, fx, fy, fw, fh, cancel: { x: fx + fw - 120, y: fy + fh - foot + 6, w: 100, h: 32 }, ok: { x: fx + fw - 236, y: fy + fh - foot + 6, w: 106, h: 32 } };
};
const inBox = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
pickerPoint = function (cx, cy) {
    const R = pickerRect();
    if (inBox(R.cancel, cx, cy)) return 'cancel';
    if (picker && TAC[picker.kind] && TAC[picker.kind].multi && inBox(R.ok, cx, cy)) return 'ok';
    if (cx < R.x || cx > R.x + R.w || cy < R.y || cy > R.y + R.h) return cx >= R.fx && cx <= R.fx + R.fw && cy >= R.fy && cy <= R.fy + R.fh ? 'frame' : null;
    return { x: (cx - R.x) / R.k, y: (cy - R.y) / R.k };
};
pickerTap = function (cx, cy) {
    const pt = pickerPoint(cx, cy), T = TAC[picker.kind] || TAC.carpet;
    if (pt === 'cancel') { picker = null; AudioSys.play('ui'); return true; }
    if (pt === 'frame') return true;
    if (pt === 'ok') { if (picker.pts.length) finishTac(); return true; }
    if (!pt) return false;
    let q = pt;
    if (T.line && picker.pts.length === 1) q = clampLen(picker.pts[0], pt, T.line);
    picker.pts.push(q); AudioSys.play('tick', 0.35);
    if (picker.pts.length >= T.need) finishTac();
    return true;
};
function finishTac() {
    const pk = picker; picker = null;
    const a = pk.pts[0], b = pk.pts[1] || pk.pts[0];
    if (net.role === 'guest') netSend({ t: 'tgt', src: pk.src, slot: pk.slot, a: [Math.round(a.x), Math.round(a.y)], b: [Math.round(b.x), Math.round(b.y)], pts: pk.pts.map(q => [Math.round(q.x), Math.round(q.y)]) });
    else execTarget(localPlayer(), pk.src, pk.slot, a, b, pk.pts);
    AudioSys.play('confirm', 0.4); flash('#fde68a', 0.05);
}
const _execTarget16 = execTarget;
execTarget = function (p, src, slot, a, b, pts) { if (p) p.pickPts = pts || null; try { return _execTarget16(p, src, slot, a, b); } finally { if (p) p.pickPts = null; } };
const _onHostData16 = onHostData;
onHostData = function (g, m) {
    if (m && m.t === 'tgt' && Array.isArray(m.a) && Array.isArray(m.b)) {
        const p = players.find(q => q.id === g.id), pts = Array.isArray(m.pts) ? m.pts.slice(0, 3).map(q => ({ x: +q[0], y: +q[1] })) : null;
        execTarget(p, m.src === 'weapon' ? 'weapon' : 'skill', +m.slot || 0, { x: +m.a[0], y: +m.a[1] }, { x: +m.b[0], y: +m.b[1] }, pts); return;
    }
    return _onHostData16(g, m);
};
window.addEventListener('keydown', e => { if (picker && (e.code === 'Enter' || e.code === 'Space') && TAC[picker.kind] && TAC[picker.kind].multi && picker.pts.length) { finishTac(); e.stopPropagation(); e.preventDefault(); } }, { capture: true });

/* ============================== VẼ BẢNG CHIẾN THUẬT ============================== */
drawPicker = function (me, W, H, now) {
    const R = pickerRect(), X = x => R.x + x * R.k, Y = y => R.y + y * R.k, T = TAC[picker.kind] || TAC.carpet, full = me.adv === 'minimap';
    const open = Math.min(1, (world.time - (picker.t0 || 0)) / 0.18);
    ctx.save();
    ctx.globalAlpha = open;
    ctx.fillStyle = 'rgba(2,6,14,0.55)'; ctx.fillRect(0, 0, W, H);
    // vỏ máy tính bảng
    ctx.translate(0, (1 - open) * 40);
    const bez = ctx.createLinearGradient(0, R.fy, 0, R.fy + R.fh); bez.addColorStop(0, '#1f2937'); bez.addColorStop(1, '#0b1220');
    ctx.fillStyle = bez; rrect(ctx, R.fx, R.fy, R.fw, R.fh, 18); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = hexA(T.col, 0.7); ctx.lineWidth = 1.5; rrect(ctx, R.fx + 6, R.fy + 6, R.fw - 12, R.fh - 12, 14); ctx.stroke();
    // tiêu đề
    ctx.fillStyle = '#94a3b8'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('◉ BẢNG CHIẾN THUẬT · TRỰC TUYẾN', R.fx + 22, R.fy + 15);
    ctx.fillStyle = T.col; ctx.font = `700 15px ${FONT}`; ctx.fillText(T.name, R.fx + 22, R.fy + 32);
    ctx.fillStyle = '#e2e8f0'; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'right';
    ctx.fillText(`▸ ${T.steps[Math.min(T.steps.length - 1, picker.pts.length)]}`, R.fx + R.fw - 22, R.fy + 32);
    // nền bản đồ + lưới toạ độ
    ctx.fillStyle = '#0f1b2b'; ctx.fillRect(R.x, R.y, R.w, R.h);
    const cell = 400, cols = Math.ceil(MAP_W / cell), rows = Math.ceil(MAP_H / cell);
    ctx.strokeStyle = 'rgba(56,189,248,0.12)'; ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(X(i * cell), R.y); ctx.lineTo(X(i * cell), R.y + R.h); ctx.stroke(); }
    for (let j = 0; j <= rows; j++) { ctx.beginPath(); ctx.moveTo(R.x, Y(j * cell)); ctx.lineTo(R.x + R.w, Y(j * cell)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(125,211,252,0.55)'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center';
    for (let i = 0; i < cols; i++) ctx.fillText(String.fromCharCode(65 + i), X(i * cell + cell / 2), R.y - 6);
    ctx.textAlign = 'right'; for (let j = 0; j < rows; j++) ctx.fillText(String(j + 1), R.x - 5, Y(j * cell + cell / 2));
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    if (full) { // có lợi thế Bản Đồ Nhỏ: hiện thêm thông tin
        ctx.fillStyle = 'rgba(34,197,94,0.32)'; bushes.forEach(b => { ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), Math.max(2, b.r * R.k), 0, Math.PI * 2); ctx.fill(); });
        obstacles.forEach(o => { ctx.fillStyle = o.wood ? 'rgba(180,120,70,0.85)' : 'rgba(148,163,184,0.85)'; ctx.fillRect(X(o.x), Y(o.y), Math.max(1, o.w * R.k), Math.max(1, o.h * R.k)); });
        const z = world.zone; if (z && z.r) { ctx.strokeStyle = 'rgba(96,165,250,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(z.x), Y(z.y), z.r * R.k, 0, Math.PI * 2); ctx.stroke(); }
        players.forEach(q => { if (q.hp > 0 && q !== me && (sameTeam(me, q) || targetable(me, q) || isSpotted(q, me.id))) { ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 1.5; ctx.stroke(); } });
        pings.forEach(pg => { ctx.strokeStyle = 'rgba(248,113,113,0.7)'; ctx.beginPath(); ctx.arc(X(pg.x), Y(pg.y), 6, 0, Math.PI * 2); ctx.stroke(); });
    }
    // tia quét radar
    const sweep = (now * 0.6) % 1, sx = R.x + R.w * sweep;
    const sg = ctx.createLinearGradient(sx - 60, 0, sx, 0); sg.addColorStop(0, 'rgba(56,189,248,0)'); sg.addColorStop(1, 'rgba(56,189,248,0.16)');
    ctx.fillStyle = sg; ctx.fillRect(sx - 60, R.y, 60, R.h);
    // bạn
    ctx.fillStyle = hexA(me.color, 0.25); ctx.beginPath(); ctx.moveTo(X(me.x), Y(me.y)); ctx.arc(X(me.x), Y(me.y), 26, me.angle - 0.5, me.angle + 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = me.color; ctx.beginPath(); ctx.arc(X(me.x), Y(me.y), 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // xem trước mục tiêu
    const pts = picker.pts, h = picker.hover, col = T.col;
    const circle = (q, r, a) => { ctx.fillStyle = hexA(col, a); ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), r * R.k, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); };
    const marker = (q, label) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0b1020'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, X(q.x), Y(q.y) + 0.5); };
    if (T.r) {
        pts.forEach((q, i) => { circle(q, T.r, 0.22); marker(q, String(i + 1)); });
        if (h && pts.length < T.need) { circle(h, T.r, 0.1 + 0.06 * Math.sin(now * 8)); }
    } else if (T.dir) {
        if (pts[0]) {
            const a0 = pts[0], dir = h ? Math.atan2(h.y - a0.y, h.x - a0.x) : 0, L = Math.hypot(MAP_W, MAP_H);
            ctx.strokeStyle = hexA(col, 0.5); ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
            ctx.beginPath(); ctx.moveTo(X(a0.x - Math.cos(dir) * L), Y(a0.y - Math.sin(dir) * L)); ctx.lineTo(X(a0.x + Math.cos(dir) * L), Y(a0.y + Math.sin(dir) * L)); ctx.stroke(); ctx.setLineDash([]);
            ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = Math.max(6, 105 * 2 * R.k); ctx.globalAlpha = open * 0.35;
            ctx.beginPath(); ctx.moveTo(X(a0.x - Math.cos(dir) * 300), Y(a0.y - Math.sin(dir) * 300)); ctx.lineTo(X(a0.x + Math.cos(dir) * 300), Y(a0.y + Math.sin(dir) * 300)); ctx.stroke(); ctx.globalAlpha = open;
            marker(a0, '✕');
            if (h) { const px = X(a0.x + Math.cos(dir) * 300), py = Y(a0.y + Math.sin(dir) * 300); ctx.save(); ctx.translate(px, py); ctx.rotate(dir); ctx.fillStyle = col; ctx.font = `16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈', 0, 0); ctx.restore(); }
        } else if (h) circle(h, 30, 0.12);
    } else if (T.line) {
        if (pts[0]) {
            const b = h ? clampLen(pts[0], h, T.line) : null;
            if (b) { ctx.strokeStyle = hexA(col, 0.4); ctx.lineWidth = Math.max(6, 90 * R.k); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(pts[0].x), Y(pts[0].y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(X(pts[0].x), Y(pts[0].y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke(); ctx.setLineDash([]); marker(b, 'B'); ctx.fillStyle = '#e2e8f0'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(`${Math.round(dist(pts[0].x, pts[0].y, b.x, b.y))}/${T.line}`, X(b.x) + 12, Y(b.y)); }
            marker(pts[0], 'A');
        } else if (h) circle(h, 30, 0.12);
    }
    // tâm ngắm theo tay
    if (h) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; const hx = X(h.x), hy = Y(h.y); ctx.beginPath(); ctx.moveTo(hx - 12, hy); ctx.lineTo(hx - 4, hy); ctx.moveTo(hx + 4, hy); ctx.lineTo(hx + 12, hy); ctx.moveTo(hx, hy - 12); ctx.lineTo(hx, hy - 4); ctx.moveTo(hx, hy + 4); ctx.lineTo(hx, hy + 12); ctx.stroke(); ctx.fillStyle = 'rgba(148,163,184,0.85)'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(`${String.fromCharCode(65 + Math.floor(h.x / cell))}${Math.floor(h.y / cell) + 1}`, hx + 14, hy - 10); }
    ctx.restore();
    // nút dưới
    const btn = (b, label, bg, fg) => { ctx.fillStyle = bg; rrect(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill(); ctx.fillStyle = fg; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1); };
    btn(R.cancel, '✖ HUỶ', '#7f1d1d', '#fecaca');
    if (T.multi) btn(R.ok, `✔ XÁC NHẬN (${pts.length}/${T.need})`, pts.length ? '#166534' : '#334155', '#dcfce7');
    ctx.fillStyle = 'rgba(148,163,184,0.75)'; ctx.font = `600 10px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(full ? '🗺 Bản Đồ Nhỏ: hiện tường, bụi, vòng bo, địch, tiếng động' : 'Bản đồ tĩnh: chỉ thấy vị trí của bạn (lợi thế Bản Đồ Nhỏ hiện thêm)', R.fx + 22, R.fy + R.fh - 23);
    ctx.restore();
};

/* ============================== HUD RIÊNG: bảng nhỏ hiện các đòn gọi hoả lực & hồi chiêu ============================== */
const _drawHUD16 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD16(W, H, now);
    const me = localPlayer();
    if (!me || me.hp <= 0 || picker || !['PLAYING', 'KO', 'COUNTDOWN'].includes(gameState)) return;
    const list = (me.skills || []).filter(s => CARDS[s.id] && CARDS[s.id].picker);
    if (!list.length) return;
    const x0 = 14, y0 = Math.round(H * 0.34), w = 190, rh = 26;
    ctx.save();
    ctx.fillStyle = 'rgba(11,18,32,0.82)'; rrect(ctx, x0, y0, w, 22 + list.length * rh, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('📟 BẢNG CHIẾN THUẬT', x0 + 9, y0 + 11);
    list.forEach((s, i) => {
        const c = CARDS[s.id], y = y0 + 22 + i * rh, ready = s.cd <= 0, max = skillCooldown(me, s.id);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; rrect(ctx, x0 + 6, y + 2, w - 12, rh - 5, 6); ctx.fill();
        if (!ready) { ctx.fillStyle = 'rgba(251,191,36,0.25)'; rrect(ctx, x0 + 6, y + 2, (w - 12) * (1 - s.cd / Math.max(0.1, max)), rh - 5, 6); ctx.fill(); }
        ctx.font = `13px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(c.icon, x0 + 12, y + rh / 2);
        ctx.font = `700 9px ${FONT}`; ctx.fillStyle = ready ? '#fde68a' : '#94a3b8'; ctx.fillText(ready ? `${c.name} · SẴN SÀNG` : `${c.name} · ${Math.ceil(s.cd)}s`, x0 + 30, y + rh / 2);
        if (ready) { ctx.strokeStyle = `rgba(253,224,71,${0.4 + Math.sin(now * 6) * 0.3})`; ctx.lineWidth = 1.2; rrect(ctx, x0 + 6, y + 2, w - 12, rh - 5, 6); ctx.stroke(); }
    });
    ctx.restore();
};

/* ============================== VẼ: Quỹ Đạo Huỷ Diệt ============================== */
const _drawNetZones16 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones16(now);
    zones.forEach(z => {
        if (z.type === 'orbitalWarn') {
            const k = 1 - Math.max(0, z.t) / (z.maxT || 1);
            ctx.save(); ctx.strokeStyle = `rgba(196,181,253,${0.6 + Math.sin(now * 14) * 0.3})`; ctx.lineWidth = 3; ctx.setLineDash([14, 8]); ctx.lineDashOffset = -now * 80;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = `rgba(139,92,246,${0.1 + k * 0.25})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(221,214,254,0.8)'; ctx.lineWidth = 1.5; [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + now; ctx.beginPath(); ctx.moveTo(z.x + Math.cos(a) * z.r * 0.3, z.y + Math.sin(a) * z.r * 0.3); ctx.lineTo(z.x + Math.cos(a) * z.r * 0.6, z.y + Math.sin(a) * z.r * 0.6); ctx.stroke(); });
            ctx.font = `700 22px ${FONT}`; ctx.fillStyle = `rgba(254,226,226,${0.5 + Math.sin(now * 10) * 0.4})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚠', z.x, z.y);
            ctx.restore();
        } else if (z.type === 'orbitalBeam') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(196,181,253,0.7)'); g.addColorStop(1, 'rgba(124,58,237,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + Math.sin(now * 30) * 0.03), 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(196,181,253,0.25)'; ctx.fillRect(z.x - z.r * 0.4, z.y - 1400, z.r * 0.8, 1400);
            ctx.strokeStyle = 'rgba(237,233,254,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, r = Math.random() * z.r; particles.push({ x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r, vx: 0, vy: -200 - Math.random() * 200, life: 0.4, maxLife: 0.4, color: Math.random() < 0.5 ? '#c4b5fd' : '#ffffff', size: 3, glow: true }); }
        }
    });
};
