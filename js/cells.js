/** ==================== CHỌN Ô TRÊN BẢNG CHIẾN THUẬT · PHÁO SÁNG MỚI · ROBOT TRÂU HƠN ====================
 *  Lưới ô 400×400 (giống toạ độ A1, B2… trên bảng). Vũ khí Thiêu Huỷ Ô · Đánh Dấu Ô · Trọng Lực · Lồng Nhốt.
 *  Nạp sau newgear.js.
 */
const CELL = 400;
function cellOf(x, y) {
    const cx = Math.floor(Math.max(0, Math.min(MAP_W - 1, x)) / CELL), cy = Math.floor(Math.max(0, Math.min(MAP_H - 1, y)) / CELL);
    const x0 = cx * CELL, y0 = cy * CELL, x1 = Math.min(MAP_W, x0 + CELL), y1 = Math.min(MAP_H, y0 + CELL);
    return { cx, cy, x0, y0, x1, y1, x: (x0 + x1) / 2, y: (y0 + y1) / 2, h: Math.max(x1 - x0, y1 - y0) / 2 };
}
const cellName = c => `${String.fromCharCode(65 + c.cx)}${c.cy + 1}`;
const inSq = (z, x, y, pad = 0) => Math.abs(x - z.x) <= z.r + pad && Math.abs(y - z.y) <= z.r + pad;

/* ============================== BẢNG: chọn theo ô ============================== */
Object.assign(TAC, {
    burnCell:  { name: '🔥 THIÊU HUỶ Ô', cell: true, need: 1, col: '#f97316', steps: ['CHẠM 1 Ô ĐỂ THIÊU RỤI'] },
    markCells: { name: '🎯 ĐÁNH DẤU Ô', cell: true, need: 3, multi: true, col: '#ef4444', steps: ['CHẠM TỐI ĐA 3 Ô · BẤM XÁC NHẬN'] },
    gravCells: { name: '🌀 TRỌNG LỰC', cell: true, need: 2, multi: true, col: '#a855f7', steps: ['CHẠM TỐI ĐA 2 Ô · BẤM XÁC NHẬN'] },
    cageCell:  { name: '🔒 LỒNG NHỐT', cell: true, need: 1, col: '#22d3ee', steps: ['CHẠM 1 Ô ĐỂ DỰNG LỒNG'] }
});
const _pickerPoint23 = pickerPoint;
pickerPoint = function (cx, cy) {
    const r = _pickerPoint23(cx, cy);
    if (r && typeof r === 'object' && picker && TAC[picker.kind] && TAC[picker.kind].cell) { const c = cellOf(r.x, r.y); return { x: c.x, y: c.y }; }
    return r;
};
const _pickerTap23 = pickerTap;
pickerTap = function (cx, cy) {
    const T = picker && TAC[picker.kind];
    if (T && T.cell) { const q = pickerPoint(cx, cy); if (q && typeof q === 'object' && picker.pts.some(s => s.x === q.x && s.y === q.y)) { picker.pts = picker.pts.filter(s => s.x !== q.x || s.y !== q.y); AudioSys.play('ui', 0.3); return true; } } // chạm lại ô đã chọn = bỏ chọn
    return _pickerTap23(cx, cy);
};
const _drawPicker23 = drawPicker;
drawPicker = function (me, W, H, now) {
    _drawPicker23(me, W, H, now);
    const T = picker && TAC[picker.kind]; if (!T || !T.cell) return;
    const R = pickerRect(), X = x => R.x + x * R.k, Y = y => R.y + y * R.k;
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    const sq = (c, fill, stroke, lw) => { ctx.fillStyle = fill; ctx.fillRect(X(c.x0), Y(c.y0), (c.x1 - c.x0) * R.k, (c.y1 - c.y0) * R.k); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(X(c.x0) + 1, Y(c.y0) + 1, (c.x1 - c.x0) * R.k - 2, (c.y1 - c.y0) * R.k - 2); };
    picker.pts.forEach((q, i) => { const c = cellOf(q.x, q.y); sq(c, hexA(T.col, 0.35), T.col, 3); ctx.fillStyle = '#fff'; ctx.font = `700 16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(T.need > 1 ? `${i + 1}` : '✕', X(c.x), Y(c.y)); ctx.font = `700 10px ${FONT}`; ctx.fillText(cellName(c), X(c.x), Y(c.y) + 16); });
    const h = picker.hover; if (h && picker.pts.length < (picker.need || T.need)) { const c = cellOf(h.x, h.y); sq(c, hexA(T.col, 0.1 + 0.08 * Math.sin(now * 8)), hexA(T.col, 0.8), 1.5); }
    ctx.restore();
};

/* ============================== HIỆU ỨNG Ô ============================== */
function cellWarn(p, c, t, cage) { zones.push({ type: 'cellWarn', x: c.x, y: c.y, r: c.h, t, maxT: t, owner: p.id, tick: 0, phase: cage ? 1 : 0 }); }
function burnCell(p, c, dur = 6, dps = 32, burst = 60) {
    const warn = strikeWarnT(p, 1.5); cellWarn(p, c, warn);
    strikes.push({ kind: 'cellBurn', owner: p.id, x: c.x, y: c.y, R: c.h, t: warn, dur, dps, burst });
    floatText(p.x, p.y - 42, `🔥 THIÊU HUỶ Ô ${cellName(c)}!`, '#fdba74', 15); AudioSys.playAt('alarm', c.x, c.y, 0.4, 3000);
}
function markCell(p, c) {
    const warn = strikeWarnT(p, 1.2); cellWarn(p, c, warn);
    for (let i = 0; i < 5; i++) dropBomb(p, c.x + (Math.random() - 0.5) * c.h * 1.6, c.y + (Math.random() - 0.5) * c.h * 1.6, 60 * payload(p), 95 * payload(p), warn + 0.1 + i * 0.12);
    strikes.push({ kind: 'cellBurn', owner: p.id, x: c.x, y: c.y, R: c.h, t: warn + 0.4, dur: 3.5, dps: 20, burst: 0 });
}
function gravCell(p, c) {
    zones.push({ type: 'gravCell', x: c.x, y: c.y, r: c.h, t: 5, maxT: 5, owner: p.id, tick: 0 });
    ring(c.x, c.y, 10, c.h, '#a855f7', 0.5, 4); AudioSys.playAt('rail', c.x, c.y, 0.35);
}
function cageCell(p, c) {
    const warn = strikeWarnT(p, 2); cellWarn(p, c, warn, true);
    strikes.push({ kind: 'cageUp', owner: p.id, x: c.x, y: c.y, R: c.h, x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, t: warn });
    floatText(p.x, p.y - 42, `🔒 LỒNG NHỐT ${cellName(c)}!`, '#67e8f9', 15); AudioSys.playAt('alarm', c.x, c.y, 0.3, 3000);
}
function raiseCage(s) {
    const T = 6, th = 22, seg = 100, walls = [];
    for (let x = s.x0; x < s.x1; x += seg) { walls.push({ x, y: s.y0, w: Math.min(seg, s.x1 - x), h: th }); walls.push({ x, y: s.y1 - th, w: Math.min(seg, s.x1 - x), h: th }); }
    for (let y = s.y0 + th; y < s.y1 - th; y += seg) { walls.push({ x: s.x0, y, w: th, h: Math.min(seg, s.y1 - th - y) }); walls.push({ x: s.x1 - th, y, w: th, h: Math.min(seg, s.y1 - th - y) }); }
    walls.forEach(w => {
        players.forEach(q => { if (q.hp > 0 && q.x > w.x - q.radius && q.x < w.x + w.w + q.radius && q.y > w.y - q.radius && q.y < w.y + w.h + q.radius) { const a = Math.atan2(s.y - q.y, s.x - q.x); q.x += Math.cos(a) * (th + q.radius + 4); q.y += Math.sin(a) * (th + q.radius + 4); } }); // đẩy vào trong lồng
        obstacles.push({ ...w, wood: false, temp: T, hp: 150, maxHp: 150, cage: true });
    });
    zones.push({ type: 'cageCell', x: s.x, y: s.y, r: s.R, t: T, maxT: T, owner: s.owner, tick: 0 });
    addShake(8); AudioSys.playAt('slam', s.x, s.y, 0.6, 3000); spark(s.x, s.y, '#67e8f9', 20, 300);
}
const _updateStrikes23 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes23(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (!s) continue;
        if (s.kind === 'cellBurn') {
            if (s.t > 0) continue;
            const o = players.find(q => q.id === s.owner);
            if (!s.z) {
                s.z = { type: 'cellFire', x: s.x, y: s.y, r: s.R, t: s.dur, maxT: s.dur, owner: s.owner, tick: 0 }; zones.push(s.z); s.left = s.dur; s.tick = 0;
                explosionFx(s.x, s.y, 80); addShake(6); AudioSys.playAt('explosion', s.x, s.y, 0.5, 3000);
                if (o && s.burst) players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && !(e.air > 0) && inSq(s.z, e.x, e.y, e.radius)) dealDamage(e, s.burst * payload(o), o.id, { burn: true, knock: 0 }); });
                obstacles.slice().forEach(ob => { if (ob.wood && inSq(s.z, ob.x + ob.w / 2, ob.y + ob.h / 2)) damageObstacle(ob, 999, o); }); // thiêu rụi thùng gỗ
                bushes.forEach(b => { if (inSq(s.z, b.x, b.y)) b.burning = Math.max(b.burning || 0, 3); });
            }
            s.left -= dt; s.tick -= dt;
            if (s.tick <= 0 && o) { s.tick = 0.25; players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && !(e.air > 0) && !e.pyro && inSq(s.z, e.x, e.y, e.radius)) dealDamage(e, s.dps * 0.25 * payload(o), o.id, { zone: true, burn: true }); }); }
            if (s.left <= 0) strikes.splice(i, 1);
        } else if (s.kind === 'cageUp' && s.t <= 0) { strikes.splice(i, 1); raiseCage(s); }
    }
};
// trọng lực & lồng: làm chậm địch bên trong
const _upe23 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe23(dt);
    if (gameState !== 'PLAYING') return;
    zones.forEach(z => {
        if (z.type !== 'gravCell' && z.type !== 'cageCell') return;
        const o = players.find(q => q.id === z.owner); if (!o) return;
        players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && inSq(z, e.x, e.y) && !(e.st.cleanseT > 0)) { e.st.slow = Math.max(e.st.slow || 0, 0.25); if (z.type === 'gravCell') e.air = 0; } });
    });
};

/* ============================== VẼ VÙNG Ô ============================== */
const _drawNetZones23 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones23(now);
    zones.forEach(z => {
        const x0 = z.x - z.r, y0 = z.y - z.r, s = z.r * 2;
        if (z.type === 'cellWarn') {
            const k = 1 - Math.max(0, z.t) / (z.maxT || 1), col = z.phase === 1 ? '34,211,238' : '249,115,22';
            ctx.save();
            ctx.fillStyle = `rgba(${col},${0.06 + k * 0.22 + Math.max(0, Math.sin(now * (6 + k * 14))) * 0.08})`; ctx.fillRect(x0, y0, s, s);
            ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 4; ctx.setLineDash([22, 12]); ctx.lineDashOffset = -now * 120; ctx.strokeRect(x0 + 2, y0 + 2, s - 4, s - 4); ctx.setLineDash([]);
            const c = s * (0.5 - k * 0.5); ctx.strokeStyle = `rgba(${col},0.6)`; ctx.lineWidth = 2; ctx.strokeRect(z.x - c, z.y - c, c * 2, c * 2); // ô co dần = sắp tới
            ctx.font = `700 40px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(now * 10) * 0.3})`; ctx.fillText(z.phase === 1 ? '🔒' : '⚠', z.x, z.y);
            ctx.restore();
        } else if (z.type === 'cellFire') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const a = Math.min(1, z.t / 1.2);
            const g = ctx.createRadialGradient(z.x, z.y, 10, z.x, z.y, z.r * 1.4); g.addColorStop(0, `rgba(255,190,80,${0.35 * a})`); g.addColorStop(1, `rgba(220,60,20,${0.18 * a})`);
            ctx.fillStyle = g; ctx.fillRect(x0, y0, s, s);
            ctx.strokeStyle = `rgba(251,146,60,${0.6 * a})`; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, s, s);
            ctx.restore();
            if (Math.random() < 0.9) for (let i = 0; i < 3; i++) particles.push({ x: x0 + Math.random() * s, y: y0 + Math.random() * s, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 80, life: 0.6, maxLife: 0.6, color: Math.random() < 0.5 ? '#fb923c' : '#fde047', size: 5 + Math.random() * 6, glow: true });
        } else if (z.type === 'gravCell') {
            ctx.save();
            ctx.fillStyle = `rgba(168,85,247,${0.12 + Math.sin(now * 3) * 0.04})`; ctx.fillRect(x0, y0, s, s);
            ctx.strokeStyle = 'rgba(192,132,252,0.75)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, s, s);
            ctx.strokeStyle = 'rgba(216,180,254,0.35)'; ctx.lineWidth = 2; // dấu hiệu: mũi tên đè xuống
            for (let gx = x0 + 40; gx < x0 + s; gx += 80) for (let gy = y0 + 40; gy < y0 + s; gy += 80) { const off = ((now * 40 + gx) % 30); ctx.beginPath(); ctx.moveTo(gx - 8, gy - 8 + off * 0.3); ctx.lineTo(gx, gy + off * 0.3); ctx.lineTo(gx + 8, gy - 8 + off * 0.3); ctx.stroke(); }
            ctx.restore();
        } else if (z.type === 'cageCell') {
            ctx.save(); ctx.fillStyle = `rgba(34,211,238,${0.07 + Math.sin(now * 4) * 0.03})`; ctx.fillRect(x0, y0, s, s); ctx.restore();
        }
    });
};

/* ============================== 3 KỸ NĂNG + 1 VŨ KHÍ ============================== */
const autoCell = p => { const c = autoPoint(p); return cellOf(c.x, c.y); };
const pickedCells = (p, n) => { const pts = (p.pickPts || []).filter(q => !(q.x < 0 && q.y < 0)); const out = (pts.length ? pts : p.pickTarget ? [p.pickTarget.a] : [autoPoint(p)]).map(q => cellOf(q.x, q.y)); return out.filter((c, i) => out.findIndex(d => d.cx === c.cx && d.cy === c.cy) === i).slice(0, n); };
defS('markCells', '🎯', 'Đánh Dấu Ô', 30, 'engage', 'Mở bảng chiến thuật, chọn tối đa 3 Ô (theo lưới bảng): mỗi ô cảnh báo vuông 1.2 giây rồi bị dội 5 quả bom (60) và cháy 3.5 giây.', p => pickedCells(p, 3).forEach(c => markCell(p, c)), 2000);
defS('gravCells', '🌀', 'Trọng Lực', 22, 'engage', 'Mở bảng chiến thuật, chọn tối đa 2 Ô: tạo vùng trọng lực 5 giây (có dấu hiệu mũi tên tím) — địch bên trong bị làm chậm và không nhảy/lướt lên được.', p => pickedCells(p, 2).forEach(c => gravCell(p, c)), 2000);
defS('cageCell', '🔒', 'Lồng Nhốt', 28, 'engage', 'Mở bảng chiến thuật, chọn 1 Ô: cảnh báo 2 giây rồi dựng lồng tường quanh cả ô, nhốt mọi người bên trong 6 giây (tường phá được); bên trong bị làm chậm.', p => pickedCells(p, 1).forEach(c => cageCell(p, c)), 2000);
CARDS.markCells.picker = 'markCells'; CARDS.gravCells.picker = 'gravCells'; CARDS.cageCell.picker = 'cageCell';
FIRE_SKILLS.push('markCells', 'gravCells', 'cageCell');
[
    { id: 'cellHell', a: 'markCells', b: 'cageCell', name: 'Lò Sát Sinh', desc: 'Lồng Nhốt bốc cháy bên trong (20 sát thương/giây).' },
    { id: 'heavyGrav', a: 'gravCells', b: 'cageCell', name: 'Ngục Trọng Lực', desc: 'Bên trong Lồng Nhốt còn có vùng Trọng Lực.' },
    { id: 'gravBomb', a: 'gravCells', b: 'markCells', name: 'Bom Trọng Lực', desc: 'Đánh Dấu Ô kéo theo vùng Trọng Lực 3 giây ở mỗi ô.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
const _raiseCage23 = raiseCage;
raiseCage = function (s) {
    _raiseCage23(s); const o = players.find(q => q.id === s.owner); if (!o) return;
    if (combo(o, 'cellHell')) strikes.push({ kind: 'cellBurn', owner: o.id, x: s.x, y: s.y, R: s.R, t: 0, dur: 6, dps: 20, burst: 0 });
    if (combo(o, 'heavyGrav')) zones.push({ type: 'gravCell', x: s.x, y: s.y, r: s.R, t: 6, maxT: 6, owner: o.id, tick: 0 });
};
const _markCell23 = markCell;
markCell = function (p, c) { _markCell23(p, c); if (combo(p, 'gravBomb')) zones.push({ type: 'gravCell', x: c.x, y: c.y, r: c.h, t: 3, maxT: 3, owner: p.id, tick: 0 }); };

WEAPONS.CELLBURN = tacW('CELLBURN', 'Bộ Thiêu Huỷ Ô', '🔥', '#ea580c', 2, 'Mở bảng chiến thuật, chạm 1 Ô (theo lưới bảng): cảnh báo vuông 1.5 giây rồi thiêu rụi cả ô (60 sát thương + cháy 6 giây, đốt sạch thùng gỗ, bụi). Dùng 2 lần.');
PICKER_WEAPONS.CELLBURN = 'burnCell'; BASE_WEIGHTS.CELLBURN = 2; TAC_WEAPONS.push('CELLBURN');
const _useStrikeWeapon23 = useStrikeWeapon;
useStrikeWeapon = function (p, w, a, b) {
    if (w.id !== 'CELLBURN') return _useStrikeWeapon23(p, w, a, b);
    if (!a) tacNoise(p);
    const q = (p.pickPts && p.pickPts[0]) || a || autoPoint(p); burnCell(p, cellOf(q.x, q.y));
    if (!world.infiniteAmmo) w.mag--;
    if (w.mag <= 0) { const i = p.inventory.indexOf(w); if (i >= 0) p.inventory[i] = { ...WEAPONS.NONE }; }
};
GUNMOD_EXTRA.CELLBURN = ['🔥 NẠP THÊM 1 LƯỢT', p => { const w = getCurrentWeapon(p); w.mag = Math.min(w.magSize + 1, w.mag + 1); }];

/* ============================== PHÉP: PHÁO SÁNG (làm lại) ============================== */
const FLARE_R = 1300; // gấp đôi Radar
SPELLS.flareScan.desc = 'Thả pháo sáng NGAY CHỖ BẠN (đứng yên, không đi theo bạn): soi sáng bán kính 1300 (gấp đôi Radar) trong 5 giây — làm lộ vị trí mọi địch trong vùng 5 giây, lộ bẫy & thùng giả; bạn được tăng tốc 3 giây.';
SPELLS.flareScan.cast = p => {
    zones.push({ type: 'flareLight', x: p.x, y: p.y, r: FLARE_R, t: 5, maxT: 5, owner: p.id, tick: 0 });
    strikes.push({ kind: 'flare2', owner: p.id, x: p.x, y: p.y, t: 5 });
    enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < FLARE_R) spotFor(e, p.id, 5); });
    p.st.haste = Math.max(p.st.haste || 0, 3);
    ring(p.x, p.y, 20, FLARE_R, '#fde68a', 0.9, 3); flash('#fff7d6', 0.12); AudioSys.playAt('legend', p.x, p.y, 0.35);
};
{ const i = AIM_SPELLS.indexOf('flareScan'); if (i >= 0) AIM_SPELLS.splice(i, 1); } // thả tại chỗ, không cần kéo
const _updateStrikes23b = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes23b(dt);
    for (let i = strikes.length - 1; i >= 0; i--) { const s = strikes[i]; if (!s) continue; if (s.kind !== 'flare2') continue; const o = players.find(q => q.id === s.owner); if (o) enemiesOf(o).forEach(e => { if (dist(e.x, e.y, s.x, s.y) < FLARE_R) spotFor(e, o.id, 0.3); }); if (s.t <= 0) strikes.splice(i, 1); }
};

/* ============================== ROBOT CỦA MAP: trâu hơn + bộ đòn đánh thường riêng ============================== */
const _upe23b = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe23b(dt);
    players.forEach(p => {
        if (p.mech && !p.mechUp) { p.mechUp = true; p.maxHp += 300; p.hp += 300; p.armor = Math.max(p.armor || 0, 100); floatText(p.x, p.y - 50, '🤖 GIÁP ROBOT +300 MÁU · +100 GIÁP', '#fde047', 14); }
        if (!p.mech) p.mechUp = false;
    });
};
const _dealDamage23 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) { if (target && target.mech) dmg *= 0.65; return _dealDamage23(target, dmg, attackerId, opts); }; // vỏ thép: giảm 35% sát thương
/** Đòn đánh thường của robot: gần = đấm thép · xa = pháo đôi · mỗi đòn thứ 5 = loạt tên lửa */
const _fireWeapon23 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!p.mech) return _fireWeapon23(p, w, ang, charge, enemy);
    p.angle = ang; p.lastFireT = world.time; onAttack(p); p.mechN = (p.mechN || 0) + 1;
    const near = enemiesOf(p).filter(e => !(e.air > 0) && dist(p.x, p.y, e.x, e.y) < p.radius + e.radius + 60 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 1.0);
    if (near.length) { // ĐẤM THÉP
        p.cooldown = 26;
        near.forEach(e => { dealDamage(e, 34 * (p.dmgMult || 1), p.id, { melee: true, knock: 620, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.5); });
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: p.radius + 70, color: '#fde047', width: 14, life: 0.18, maxLife: 0.18, swing: 1, line: false });
        ring(p.x + Math.cos(ang) * 50, p.y + Math.sin(ang) * 50, 6, 60, '#fde047', 0.3, 6); addShake(8); hitStop(0.07); AudioSys.playAt('slam', p.x, p.y, 0.5);
        floatText(p.x, p.y - 44, '🤖 ĐẤM THÉP!', '#fde047', 14); return;
    }
    if (p.mechN % 5 === 0) { // LOẠT TÊN LỬA
        p.cooldown = 30;
        for (let i = 0; i < 4; i++) p.shotQueue.push({ t: i * 0.08, fn: () => { if (p.hp > 0) spawnBullet(p, p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, ang + (i - 1.5) * 0.12, { speed: 13, damage: 0, range: 620, color: '#fb923c', size: 6, explosive: true, blastSmall: true, trail: 50 }); } });
        floatText(p.x, p.y - 44, '🚀 LOẠT TÊN LỬA!', '#fb923c', 14); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); return;
    }
    // PHÁO ĐÔI: 2 nòng bắn so le
    p.cooldown = 9; p.recoil = 1; p.muzzle = 0.06;
    [-14, 14].forEach((side, k) => p.shotQueue.push({ t: k * 0.05, fn: () => { if (p.hp <= 0) return; const sx = p.x + Math.cos(ang) * 28 + Math.cos(ang + Math.PI / 2) * side, sy = p.y + Math.sin(ang) * 28 + Math.sin(ang + Math.PI / 2) * side; spawnBullet(p, sx, sy, ang + (Math.random() - 0.5) * 0.06, { speed: 24, damage: 16 * (p.dmgMult || 1), range: 640, color: '#fde047', size: 4, knock: 90, trail: 40 }); } }));
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.3); addShake(2);
};
const _hasAmmo23 = hasAmmo;
hasAmmo = function (w) { const me = players.find(q => q.mech && q.inventory && q.inventory.includes(w)); return me ? true : _hasAmmo23(w); }; // robot không cần đạn
