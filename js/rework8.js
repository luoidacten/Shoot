/** ==================== ĐIỂM ĐÁNH DẤU (Vạn Tượng) · BỘ CHỈ ĐIỂM LASER (buff + vẽ lại) · LASER VỆ TINH (hiệu ứng mới) ====================
 *  Nạp sau rework7.js.
 */

/* ============================== 1) LASER VỆ TINH: hiệu ứng mới + bản tăng cường ============================== */
// mọi laser vệ tinh dùng lớp vẽ mới 'laserBeam2'; bản tăng cường (Bộ Chỉ Điểm Laser / mould Điểm Đánh Dấu) bám mục tiêu, rộng hơn, đốt + chậm + lộ vị trí
const _laserStrikeR8 = laserStrike;
laserStrike = function (p, a, b, opt = {}) {
    const n = strikes.length, zn = zones.length;
    _laserStrikeR8(p, a, b, opt);
    const s = strikes[strikes.length - 1]; if (!s || strikes.length === n || s.kind !== 'laser') return;
    s.z = { type: 'laserBeam2', x: a.x, y: a.y, r: opt.boost ? 60 : 40, t: s.t + s.dur + 0.25, maxT: s.t + s.dur + 0.25, owner: p.id, tick: 0, boost: !!opt.boost, t0: s.t }; zones.push(s.z);
    if (opt.boost) { s.boost = true; s.t = opt.warn || 0.6; s.z.t0 = s.t; for (let i = zones.length - 1; i >= zn; i--) if (zones[i].type === 'warnLine') { zones[i].t = zones[i].maxT = s.t; } }
};
// Bộ Chỉ Điểm Laser: 2 lượt, laser tăng cường
Object.assign(WEAPONS.LASERDES, { magSize: 2, mag: 2 });
WEAPONS.LASERDES.desc = 'Bắn = mở bảng chiến thuật, chọn A rồi B: LASER VỆ TINH TĂNG CƯỜNG (2 lượt) — cảnh báo chỉ 0.6 giây, tia rộng, tự BÁM theo kẻ địch gần đường quét, đốt cháy + làm chậm + lộ vị trí, ~300 sát thương/giây.';
const _useStrikeWeaponR8 = useStrikeWeapon;
useStrikeWeapon = function (p, w, a, b) {
    if (w.id !== 'LASERDES') return _useStrikeWeaponR8(p, w, a, b);
    if (!world.infiniteAmmo) w.mag--;
    const t = a ? { a, b: clampLine(a, b) } : autoLine(p);
    laserStrike(p, t.a, t.b, { dmg: 30, dur: 2.4, boost: true });
    if (w.mag <= 0) { const i = p.inventory.indexOf(w); if (i >= 0) p.inventory[i] = { ...WEAPONS.NONE }; }
};
function laserBoostTick(s, o, dt) { // bám mục tiêu + hiệu ứng phụ
    const x = s.a.x + (s.b.x - s.a.x) * Math.min(1, s.k), y = s.a.y + (s.b.y - s.a.y) * Math.min(1, s.k);
    const e = enemiesOf(o).filter(q => q.hp > 0 && !(q.air > 0) && dist(q.x, q.y, x, y) < 170).sort((u, v) => dist(u.x, u.y, x, y) - dist(v.x, v.y, x, y))[0];
    if (e) { const d = dist(e.x, e.y, x, y), k = Math.min(d, 220 * dt), ax = (e.x - x) / (d || 1) * k, ay = (e.y - y) / (d || 1) * k; s.a.x += ax; s.a.y += ay; s.b.x += ax; s.b.y += ay; }
    s.bt = (s.bt || 0) - dt; if (s.bt > 0) return; s.bt = 0.1;
    enemiesOf(o).forEach(q => { const d = dist(q.x, q.y, x, y); if (q.hp <= 0 || q.air > 0 || d > 60 + q.radius) return; if (d > 38 + q.radius) dealDamage(q, s.dmg * 0.6, o.id, { knock: 1 }); q.st.slow = Math.max(q.st.slow || 0, 0.6); if (!q.pyro) { q.st.burn = Math.max(q.st.burn || 0, 1.5); q.st.burnBy = o.id; } spotFor(q, o.id, 2); });
}

/* ============================== 2) MOULD ĐIỂM ĐÁNH DẤU ============================== */
// Trang Bị Phụ: laser vệ tinh tăng cường A→B (như Bộ Chỉ Điểm Laser) · Kỹ Thuật Cao: mở bảng → TUYỆT DIỆT QUANG
VT.marker.K = ['G', 'LASER VỆ TINH', { fn: p => { const t = p.pickTarget ? { a: p.pickTarget.a, b: clampLine(p.pickTarget.a, p.pickTarget.b) } : autoLine(p); laserStrike(p, t.a, t.b, { dmg: 15 * vD(p), dur: 2, boost: true }); } }];
VT.marker.prof = { aim: null, shape: 'self', aoe: 40 };
VT.marker.bt = 'chạy +6%, sát thương +5% · bảng chiến thuật thấy đủ như có minimap';
Object.defineProperty(CARDS.gunMod, 'picker', { get: () => vtLocalMarker() ? 'laser' : undefined, configurable: true });
Object.defineProperty(CARDS.hightech, 'picker', { get: () => vtLocalMarker() ? 'vtGiant' : undefined, configurable: true });
const _htVTR8 = HT.VANTUONG[1];
HT.VANTUONG = ['ĐỔI MOULD / QUY NHẤT / TUYỆT DIỆT', p => { const w = getCurrentWeapon(p); if (w && w.mods && vtCur(w) === 'marker') return vtGiant(p); return _htVTR8(p); }];
const _skillProfileR8 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'VANTUONG' && w.mods && vtCur(w) === 'marker') { if (id === 'hightech') return { aim: null, shape: 'self', aoe: 40, col: '244,114,182', tag: '🗺️ BẢNG → TUYỆT DIỆT QUANG' }; if (id === 'gunMod') return { aim: null, shape: 'self', aoe: 40, col: '244,114,182', tag: '🗺️ BẢNG → LASER VỆ TINH A→B' }; }
    return _skillProfileR8(p, id);
};
WEAPONS.VANTUONG.desc += ' 📍 Điểm Đánh Dấu: Trang Bị Phụ = laser vệ tinh A→B, Kỹ Thuật Cao = mở bảng chọn điểm TUYỆT DIỆT QUANG. Nội tại: cầm Vạn Tượng mở bảng chiến thuật thấy đầy đủ như có minimap.';
// nội tại: cầm Vạn Tượng mở bảng chiến thuật = như có minimap
const _drawPickerR8 = drawPicker;
drawPicker = function (me, W, H, now) {
    const w = me && getCurrentWeapon(me), on = w && w.id === 'VANTUONG' && me.adv !== 'minimap', a0 = me && me.adv;
    if (on) me.adv = 'minimap';
    try { return _drawPickerR8(me, W, H, now); } finally { if (on) me.adv = a0; }
};

/* ============================== MÓC CẬP NHẬT ============================== */
const _upeR8 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR8(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    strikes.forEach(s => { if (s.kind === 'laser' && s.boost && s.t <= 0) { const o = players.find(q => q.id === s.owner); if (o) laserBoostTick(s, o, dt); } });
};

/* ============================== 3) HÌNH VẼ ============================== */
// máy chỉ điểm laser: thân ngắm dài, ống kính hồng, ăng-ten vệ tinh, màn hình nhỏ; tia ngắm khi cầm
ART2.LASERDES = (c, w, r, x0, ch, now) => {
    metal(c, x0 - 6, -4.5, 24, 9, '#1f2937', 2.5);                       // thân
    metal(c, x0 + 16, -3.5, 7, 7, '#831843', 1.5);                       // đầu phát
    c.fillStyle = '#0f172a'; c.fillRect(x0 - 3, -3, 9, 6);                // màn hình
    c.fillStyle = `rgba(244,114,182,${0.7 + Math.sin(now * 5) * 0.3})`; c.fillRect(x0 - 2, -2, 7 * ((now * 0.8) % 1), 1.2); c.fillRect(x0 - 2, 0.5, 4, 1);
    c.strokeStyle = '#94a3b8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 6, -4.5); c.lineTo(x0 + 3, -11); c.stroke(); c.beginPath(); c.arc(x0 + 3, -12, 2.4, Math.PI * 0.9, Math.PI * 2.1); c.stroke(); // ăng-ten chảo
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x0 + 23, 0, 0, x0 + 23, 0, 6); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(244,63,94,0.8)'); g.addColorStop(1, 'rgba(244,63,94,0)'); c.fillStyle = g; c.beginPath(); c.arc(x0 + 23, 0, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = `rgba(244,63,94,${0.25 + Math.sin(now * 14) * 0.1})`; c.lineWidth = 1; c.setLineDash([4, 5]); c.lineDashOffset = -now * 40; c.beginPath(); c.moveTo(x0 + 26, 0); c.lineTo(x0 + 120, 0); c.stroke(); c.setLineDash([]);
    c.fillStyle = Math.sin(now * 6) > 0 ? '#f43f5e' : '#4c0519'; c.beginPath(); c.arc(x0 + 3, -12, 1, 0, Math.PI * 2); c.fill(); c.restore();
    MUZ.LASERDES = x0 + 24;
};
// bộ định vị vệ tinh: máy tính bảng có quỹ đạo vệ tinh xoay trên màn hình
ART2.ORBITAB = (c, w, r, x0, ch, now) => {
    metal(c, x0 - 4, -8, 20, 16, '#1e1b4b', 3); c.fillStyle = '#0b1026'; c.fillRect(x0 - 2, -6, 16, 12);
    c.save(); c.beginPath(); c.rect(x0 - 2, -6, 16, 12); c.clip();
    c.strokeStyle = 'rgba(167,139,250,0.5)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x0 + 6, 0, 6.5, 3.2, -0.4, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(x0 + 6, 0, 2, 0, Math.PI * 2); c.fill();
    const a = now * 2.4; c.fillStyle = '#f5d0fe'; c.beginPath(); c.arc(x0 + 6 + Math.cos(a) * 6.5 * Math.cos(-0.4) - Math.sin(a) * 3.2 * Math.sin(-0.4), Math.cos(a) * 6.5 * Math.sin(-0.4) + Math.sin(a) * 3.2 * Math.cos(-0.4), 1.3, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(167,139,250,${0.5 + Math.sin(now * 4) * 0.3})`; c.fillRect(x0 + 15, -5, 1.4, 10); c.restore();
};
const _drawW2FxR8 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR8(now);
    ctx.save();
    // cột laser vệ tinh mới
    zones.forEach(z => {
        if (z.type !== 'laserBeam2') return;
        const life = z.maxT - z.t; if (life < (z.t0 || 0)) return; // còn trong thời gian cảnh báo
        const fade = Math.min(1, z.t / 0.25), R = z.r, x = z.x, y = z.y, pk = z.boost ? '236,72,153' : '244,114,182';
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
        // cột sáng từ trời
        const g = ctx.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, `rgba(${pk},0)`); g.addColorStop(0.5, `rgba(${pk},0.35)`); g.addColorStop(1, `rgba(${pk},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - R, y - 1000, R * 2, 1000);
        ctx.fillStyle = 'rgba(255,240,250,0.85)'; ctx.fillRect(x - 3.5 - Math.sin(now * 40) * 1.2, y - 1000, 7 + Math.sin(now * 40) * 2.4, 1000);
        // vết cháy + vòng phù văn dưới đất
        const rg = ctx.createRadialGradient(x, y, 2, x, y, R * 1.5); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.3, `rgba(${pk},0.7)`); rg.addColorStop(1, `rgba(${pk},0)`); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, R * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${pk},0.8)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, now * 3, now * 3 + Math.PI * 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, R * 0.7, -now * 4, -now * 4 + Math.PI * 1.2); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = now * 3 + i * 1.047; ctx.fillStyle = 'rgba(255,228,240,0.9)'; ctx.fillRect(x + Math.cos(a) * R - 1.5, y + Math.sin(a) * R - 1.5, 3, 3); }
        ctx.restore();
        if (Math.random() < 0.8) particles.push({ x: x + (Math.random() - 0.5) * R, y: y + (Math.random() - 0.5) * R, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 160, life: 0.45, maxLife: 0.45, color: Math.random() < 0.5 ? '#fbcfe8' : '#f472b6', size: 3, glow: true });
        if (Math.random() < 0.12) zones.push({ type: 'scorch2', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, r: R * 0.6, t: 2.5, maxT: 2.5, owner: z.owner, tick: 0 });
    });
    zones.forEach(z => { if (z.type !== 'scorch2') return; const k = Math.max(0, z.t / z.maxT); ctx.fillStyle = `rgba(30,10,25,${0.18 * k})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); });
    // Tuyệt Diệt Quang: tâm ngắm + quả cầu năng lượng nạp ở gậy, vết cháy dài sau khi bắn
    W10.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T;
        if (f.kind === 'giantWarn') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const R = 70 - u * 40; ctx.strokeStyle = `rgba(244,114,182,${0.5 + u * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x2, f.y2, R, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + now * 2; ctx.beginPath(); ctx.moveTo(f.x2 + Math.cos(a) * (R + 4), f.y2 + Math.sin(a) * (R + 4)); ctx.lineTo(f.x2 + Math.cos(a) * (R + 18), f.y2 + Math.sin(a) * (R + 18)); ctx.stroke(); }
            const og = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 18 + u * 26); og.addColorStop(0, 'rgba(255,255,255,0.95)'); og.addColorStop(0.5, 'rgba(244,114,182,0.6)'); og.addColorStop(1, 'rgba(244,114,182,0)'); ctx.fillStyle = og; ctx.beginPath(); ctx.arc(o.x, o.y, 18 + u * 26, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 10; i++) { const a = i * 0.628 + now * 4, r = (1 - ((u * 3 + i * 0.1) % 1)) * 90; ctx.fillStyle = 'rgba(251,207,232,0.9)'; ctx.beginPath(); ctx.arc(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, 2, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        } else if (f.kind === 'giant') {
            const k = 1 - u; ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 14; i++) { const t = ((now * 1.6 + i / 14) % 1), x = f.x1 + (f.x2 - f.x1) * t, y = f.y1 + (f.y2 - f.y1) * t, a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1) + Math.PI / 2, off = Math.sin(i * 7 + now * 20) * 40; ctx.fillStyle = `rgba(255,240,250,${k})`; ctx.beginPath(); ctx.arc(x + Math.cos(a) * off, y + Math.sin(a) * off, 3, 0, Math.PI * 2); ctx.fill(); }
            ctx.strokeStyle = `rgba(236,72,153,${0.5 * k})`; ctx.lineWidth = 3; [-1, 1].forEach(sd => { const a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1) + Math.PI / 2, o2 = 58 + Math.sin(now * 30) * 4; ctx.beginPath(); ctx.moveTo(f.x1 + Math.cos(a) * o2 * sd, f.y1 + Math.sin(a) * o2 * sd); ctx.lineTo(f.x2 + Math.cos(a) * o2 * sd, f.y2 + Math.sin(a) * o2 * sd); ctx.stroke(); });
            ctx.restore();
            if (!f.scorched && u > 0.5) { f.scorched = true; const L = dist(f.x1, f.y1, f.x2, f.y2); for (let d = 0; d < L; d += 40) zones.push({ type: 'scorch2', x: f.x1 + (f.x2 - f.x1) * d / L, y: f.y1 + (f.y2 - f.y1) * d / L, r: 48, t: 6, maxT: 6, owner: o.id, tick: 0 }); }
        }
    });
    ctx.restore();
};
