'use strict';
/* =====================================================================
 *  KỸ THUẬT CAO MẠNH & ĐẸP HƠN · HIỆU ỨNG KHI DÙNG KỸ NĂNG · 3 LOẠI TÀNG HÌNH
 *  Nạp sau tabletui.js.
 * ===================================================================== */

/* ============================== HIỆU ỨNG CHUNG KHI DÙNG KỸ NĂNG ============================== */
function castFx(p, col = '#a5f3fc', big = false) {
    if (!p || p.hp <= 0) return;
    ring(p.x, p.y, p.radius, p.radius + (big ? 90 : 55), col, big ? 0.4 : 0.3, big ? 5 : 3);
    for (let i = 0; i < (big ? 18 : 10); i++) { const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * (big ? 260 : 160); particles.push({ x: p.x + Math.cos(a) * p.radius, y: p.y + Math.sin(a) * p.radius, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.45, maxLife: 0.45, color: col, size: 2 + Math.random() * 2, glow: true, drag: 0.9 }); }
    if (big) { fx.zoomPunch = Math.max(fx.zoomPunch, 0.35); addShake(4); }
}
const _castSkill35 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p && p.skills && p.skills[slot], ready = s && s.cd <= 0;
    const r = _castSkill35(p, slot, aimVec);
    if (ready && s.cd > 0 && targetableLocal(p) && canSee(p.x, p.y, 30)) castFx(p, s.id === 'hightech' ? '#fde68a' : '#a5f3fc', s.id === 'hightech');
    return r;
};

/* ============================== KỸ THUẬT CAO: làm lại các chiêu yếu ============================== */
const htCol = p => { const w = getCurrentWeapon(p); return w.color && w.color.length === 7 ? w.color : '#fde68a'; };
Object.assign(HT, {
    DAGGERS:    ['MƯA PHI ĐAO', p => { const a = aimDir(p); fan(p, 12, 1.3, a, { damage: 18 * (p.meleeMult || 1), speed: 21, color: '#e5e7eb', size: 4, life: 0.65, trail: 40 }); p.shotQueue.push({ t: 0.18, fn: () => p.hp > 0 && fan(p, 12, 1.3, a + 0.05, { damage: 18 * (p.meleeMult || 1), speed: 21, color: '#f1f5f9', size: 4, life: 0.65, trail: 40 }) }); }],
    SPEAR:      ['THƯƠNG LONG XUẤT HẢI', p => { const a = aimDir(p); p.dashTime = 0.16; p.dashAngle = a; fan(p, 3, 0.3, a, { damage: 58 * (p.meleeMult || 1), speed: 25, size: 8, pierce: true, color: '#fcd34d', knock: 320, life: 0.85, trail: 70 }); ring(p.x, p.y, 10, 90, '#fcd34d', 0.3, 5); }],
    LIGHTSABER: ['SÓNG KIẾM SÁNG', p => { const a = aimDir(p); [0, 0.14, 0.28].forEach((t, i) => p.shotQueue.push({ t, fn: () => { if (p.hp > 0) htBullet(p, a + (i - 1) * 0.18, { damage: 46 * (p.meleeMult || 1), speed: 15, size: 15, pierce: true, color: '#67e8f9', knock: 170, life: 0.9, trail: 70 }); } })); }],
    SHIELD:     ['THÀNH TRÌ', p => { const a = aimDir(p), cx = p.x + Math.cos(a) * 70, cy = p.y + Math.sin(a) * 70; placeTempWall(cx, cy, Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)), 170, 6, true); p.st.kevlar = Math.max(p.st.kevlar || 0, 3);
        ring(p.x, p.y, 10, 170, '#cbd5e1', 0.4, 6); addShake(6); enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (!(e.air > 0) && d < 170 + e.radius) { dealDamage(e, 22, p.id, { melee: true, knock: 520, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.5); } }); }],
    AXE:        ['LỐC RÌU', p => { zones.push({ type: 'htOrbit', x: p.x, y: p.y, r: 78, t: 2.4, maxT: 2.4, owner: p.id, tick: 0, phase: 3 }); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }],
    PISTOL:     ['BẮN QUẠT NẢY', p => strikes.push({ kind: 'htBurst2', owner: p.id, n: 8, gap: 0.055, tick: 0, dmg: 22, spread: 0.16, color: '#fde68a', snd: 'pistol', bounces: 1 })],
    DUAL:       ['VŨ ĐIỆU SONG SÚNG', p => strikes.push({ kind: 'htSpiral', owner: p.id, n: 40, gap: 0.02, tick: 0, a: aimDir(p), dmg: 12 })],
    AR:         ['LOẠT LỰU GẮN NÒNG', p => { const a = aimDir(p), w = getCurrentWeapon(p); [0, 0.2, 0.4].forEach((t, i) => p.shotQueue.push({ t, fn: () => { if (p.hp > 0) htBullet(p, a + (i - 1) * 0.12, { damage: 18, speed: 15, size: 6, explosive: true, blastSmall: i > 0, color: '#a3e635', life: 1.0, trail: 40 }); } })); if (w.magSize) w.mag = effMag(p, w); }],
    SAR:        ['BÓNG MA', p => { setInvis(p, 'ghost', 4); const w = getCurrentWeapon(p); if (w.magSize) w.mag = effMag(p, w); p.st.haste = Math.max(p.st.haste || 0, 2); }],
    SPISTOL:    ['ÁM SÁT', p => { setInvis(p, 'camo', 3); p.nextShotMult = 2.5; }],
    ROCKET:     ['TÊN LỬA CHÙM', p => { const a = aimDir(p); for (let i = 0; i < 6; i++) p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp > 0) htBullet(p, a + (i - 2.5) * 0.11, { damage: 0, speed: 13, size: 6, explosive: true, blastSmall: true, color: '#fb923c', life: 1.3, trail: 60 }); } }); }],
    EMPGREN:    ['XUNG ĐIỆN TỪ', p => { zones.push({ type: 'emp', x: p.x, y: p.y, r: 240, t: 2.5, maxT: 2.5, owner: p.id, tick: 0 }); ring(p.x, p.y, 10, 240, '#38bdf8', 0.5, 6); AudioSys.playAt('rail', p.x, p.y, 0.5);
        enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 240 + e.radius) { dealDamage(e, 30, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 120 }); e.st.silence = Math.max(e.st.silence || 0, 2); e.stun = Math.max(e.stun, 0.3); beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.25, maxLife: 0.25, color: '#7dd3fc', zig: 1 }); } }); }],
    ENERGY:     ['QUẢ CẦU PLASMA', p => { const a = aimDir(p); zones.push({ type: 'htOrb', x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, r: 62, t: 2.4, maxT: 2.4, owner: p.id, tick: 0, phase: Math.round(a * 1000) / 1000 }); AudioSys.playAt('rail', p.x, p.y, 0.4); }],
    MINIGUN:    ['QUÁ NHIỆT', p => { p.st.rage = Math.max(p.st.rage, 3); p.fireBoost = 3; const w = getCurrentWeapon(p); if (w.magSize) w.mag = effMag(p, w); p.htFree = world.time + 3;
        ring(p.x, p.y, 10, 150, '#f97316', 0.4, 6); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 150 + e.radius) { dealDamage(e, 20, p.id, { burn: true, knock: 360, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.st.burn = Math.max(e.st.burn || 0, 2); e.st.burnBy = p.id; } }); smoke(p.x, p.y, 10, 'rgba(226,232,240,0.35)', 22); }],
    NONE:       ['LIÊN HOÀN THIẾT QUYỀN', p => { const a = aimDir(p); p.dashTime = 0.12; p.dashAngle = a; [0, 0.12, 0.24].forEach((t, i) => p.shotQueue.push({ t, fn: () => {
        if (p.hp <= 0) return; const fx2 = p.x + Math.cos(a) * 55, fy2 = p.y + Math.sin(a) * 55; ring(fx2, fy2, 8, 70 + i * 25, '#fde68a', 0.25, 6); addShake(3 + i * 2);
        enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (!(e.air > 0) && d < 195 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.8) { dealDamage(e, (i === 2 ? 34 : 18) * (p.meleeMult || 1), p.id, { melee: true, knock: i === 2 ? 600 : 140, angle: a }); if (i === 2) e.stun = Math.max(e.stun, 0.6); } }); } })); }]
});
// đạn nảy cho Bắn Quạt Nảy · đạn xoắn ốc · rìu xoay · cầu plasma
const _updateStrikes35 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes35(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (!s) continue; if (s.kind !== 'htBurst2' && s.kind !== 'htSpiral') continue;
        const o = players.find(q => q.id === s.owner); if (!o || o.hp <= 0) { strikes.splice(i, 1); continue; }
        s.tick -= dt;
        while (s.tick <= 0 && s.n > 0) {
            s.tick += s.gap; s.n--;
            if (s.kind === 'htBurst2') { const a = (s.a !== undefined ? s.a : (s.a = aimDir(o))) + (Math.random() - 0.5) * s.spread; htBullet(o, a, { damage: s.dmg, color: s.color, size: 3.8, bounces: s.bounces, speed: 22, trail: 36 }); AudioSys.playAt(s.snd, o.x, o.y, 0.15); o.muzzle = 0.05; }
            else { const k = 40 - s.n; [0, Math.PI].forEach(off => htBullet(o, s.a + k * 0.32 + off, { damage: s.dmg, color: k % 2 ? '#fde68a' : '#fca5a5', size: 3.6, speed: 17, life: 0.7, trail: 26 })); if (k % 4 === 0) AudioSys.playAt('smg', o.x, o.y, 0.2); }
        }
        if (s.n <= 0) strikes.splice(i, 1);
    }
};
const _upe35 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe35(dt);
    if (net.role === 'guest' || gameState !== 'PLAYING') return;
    zones.forEach(z => {
        if (z.type !== 'htOrbit' && z.type !== 'htOrb') return;
        const o = players.find(q => q.id === z.owner); if (!o || o.hp <= 0) { z.t = 0; return; }
        z.tick -= dt; z.hit = z.hit || {};
        if (z.type === 'htOrbit') { z.x = o.x; z.y = o.y; z.r = 60 + 80 * (1 - z.t / (z.maxT || 1)); }
        else { const near = enemiesOf(o).some(e => dist(z.x, z.y, e.x, e.y) < z.r + e.radius), spd = near ? 90 : 230; z.x += Math.cos(z.phase) * spd * dt; z.y += Math.sin(z.phase) * spd * dt; if (pointInObstacle(z.x, z.y, 10) || z.t < 0.05) { explode(z.x, z.y, o.id, 50, 140); z.t = 0; return; } }
        enemiesOf(o).forEach(e => {
            if (e.air > 0) return;
            const hitR = z.type === 'htOrbit' ? z.r + 16 : z.r;
            if (dist(z.x, z.y, e.x, e.y) > hitR + e.radius || (z.hit[e.id] || 0) > world.time) return;
            z.hit[e.id] = world.time + (z.type === 'htOrbit' ? 0.3 : 0.15);
            dealDamage(e, z.type === 'htOrbit' ? 20 * (o.meleeMult || 1) : 13, o.id, { melee: z.type === 'htOrbit', knock: z.type === 'htOrbit' ? 240 : 40, angle: Math.atan2(e.y - z.y, e.x - z.x) });
            spark(e.x, e.y, z.type === 'htOrbit' ? '#e5e7eb' : '#c4b5fd', 6, 180);
        });
    });
};
const _drawNetZones35 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones35(now);
    zones.forEach(z => {
        if (z.type === 'htOrbit') {
            const n = z.phase || 3, spin = now * 9;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            for (let i = 0; i < n; i++) {
                const a = spin + i * Math.PI * 2 / n, x = z.x + Math.cos(a) * z.r, y = z.y + Math.sin(a) * z.r;
                ctx.save(); ctx.translate(x, y); ctx.rotate(a + now * 20);
                const g = ctx.createLinearGradient(-6, -12, 8, 12); g.addColorStop(0, '#f1f5f9'); g.addColorStop(1, '#64748b');
                ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, -12); ctx.quadraticCurveTo(13, -2, 4, 12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = '#78350f'; ctx.fillRect(-10, -1.5, 12, 3); ctx.restore();
            }
        } else if (z.type === 'htOrb') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const pr = z.r * (0.9 + Math.sin(now * 14) * 0.08);
            const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, pr); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.3, 'rgba(196,181,253,0.7)'); g.addColorStop(1, 'rgba(124,58,237,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, pr, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(221,214,254,0.8)'; ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) { const a = now * 6 + i * 1.57; ctx.beginPath(); ctx.moveTo(z.x, z.y); for (let k = 1; k <= 4; k++) ctx.lineTo(z.x + Math.cos(a + (Math.random() - 0.5) * 0.6) * pr * k / 4, z.y + Math.sin(a + (Math.random() - 0.5) * 0.6) * pr * k / 4); ctx.stroke(); }
            ctx.restore();
        }
    });
};
CARDS.hightech.desc = 'Kỹ năng riêng theo vũ khí đang cầm (mỗi vũ khí một chiêu). Mạnh nhất: Lốc Rìu (rìu xoay quanh người), Quả Cầu Plasma (cầu điện bay chậm đốt mọi thứ trên đường rồi nổ), Liên Hoàn Thiết Quyền, Thương Long Xuất Hải, Vũ Điệu Song Súng (đạn xoắn ốc), Thành Trì (dựng tường + đẩy văng), Xung Điện Từ (câm lặng 2 giây), Bóng Ma (tàng hình chập chờn)…';

/* ============================== 3 LOẠI TÀNG HÌNH ==============================
 *  NGỤY TRANG (camo): người khác vẫn thấy BÓNG MỜ lay động (không ngắm/tự nhắm được).
 *  VÔ HÌNH (void): hoàn toàn không thấy, không bóng mờ.
 *  BÓNG MA (ghost): lúc ẩn lúc hiện — hiện ra chớp nhoáng (bị nhắm/bắn được), lúc ẩn nhận ít hơn 50% sát thương. */
function setInvis(p, kind, t) { p.st.invis = Math.max(p.st.invis || 0, t); p.invisKind = kind; if (kind === 'ghost') p.ghostSeed = Math.random() * 2; }
const invisKind = p => p && p.st && p.st.invis > 0 ? (p.invisKind || 'camo') : null;
const ghostShown = p => ((world.time + (p.ghostSeed || p.id * 0.53)) % 1.3) < 0.3;
// thẻ Vô Hình = loại không bóng
{ const c = CARDS.invis, f = c.cast; c.desc = 'VÔ HÌNH 4 giây: hoàn toàn không thấy, KHÔNG có bóng mờ (chỉ tầm nhìn chuẩn mới lộ). Vẫn để lại dấu chân. Tấn công sẽ hiện hình.'; c.cast = (p, e) => { f(p, e); p.invisKind = 'void'; }; }
defS('camoCloak', '🦎', 'Ngụy Trang', 11, 'escape', 'NGỤY TRANG 6 giây: hoà vào nền — người khác chỉ thấy bóng mờ lay động, không ngắm hay tự nhắm vào bạn được. Đứng yên thì gần như không thấy. Tấn công sẽ hiện hình.', p => { setInvis(p, 'camo', 6); smoke(p.x, p.y, 6, 'rgba(120,140,110,0.35)', 16); AudioSys.playAt('trick', p.x, p.y, 0.3); });
defS('phantom', '👤', 'Bóng Ma', 14, 'escape', 'BÓNG MA 5 giây: lúc ẩn lúc hiện — chớp hiện ra 0.3 giây mỗi 1.3 giây (lúc hiện bị nhắm & bắn được), lúc ẩn nhận ít hơn 50% sát thương; luôn được tăng tốc. Tấn công không làm hiện hình.', p => { setInvis(p, 'ghost', 5); p.phantomT = world.time + 5; ring(p.x, p.y, 8, 70, '#c4b5fd', 0.35, 3); AudioSys.playAt('trick', p.x, p.y, 0.4); });
{ const c = { id: 'shadowArts', a: 'camoCloak', b: 'phantom', name: 'Nhẫn Thuật Bóng Tối', desc: 'Ngụy Trang và Bóng Ma kéo dài thêm 2 giây; khi hết, đòn đánh kế tiếp +60% sát thương.' }; COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); }
const _setInvis35 = setInvis;
setInvis = function (p, kind, t) { if (combo(p, 'shadowArts')) { t += 2; p.shadowNext = true; } return _setInvis35(p, kind, t); };
// Bóng Ma: tấn công không phá tàng hình; tăng tốc
const _onAttack35 = typeof onAttack === 'function' ? onAttack : null;
if (_onAttack35) onAttack = function (p) { if (p && p.invisKind === 'ghost' && p.st && p.st.invis > 0) { const t = p.st.invis; p.st.invis = 0; try { return _onAttack35(p); } finally { p.st.invis = t; } } return _onAttack35(p); };
const _targetable35 = targetable;
targetable = function (viewer, t) {
    if (t && t.st && t.st.invis > 0 && t.invisKind === 'ghost' && ghostShown(t) && viewer !== t) {
        const keep = t.st.invis; t.st.invis = 0;
        try { return _targetable35(viewer, t); } finally { t.st.invis = keep; }
    }
    return _targetable35(viewer, t);
};
const _dealDamage35 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.st && target.st.invis > 0 && target.invisKind === 'ghost' && !ghostShown(target)) dmg *= 0.5;
    const a = attackerId >= 0 && players.find(q => q.id === attackerId);
    if (a && a.shadowNext && !(a.st && a.st.invis > 0) && !opts.zone) { dmg *= 1.6; a.shadowNext = false; floatText(a.x, a.y - 40, 'ĐÒN TRONG BÓNG TỐI!', '#c4b5fd', 13); }
    return _dealDamage35(target, dmg, attackerId, opts);
};
const _upe35b = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe35b(dt);
    players.forEach(p => {
        if (!(p.st && p.st.invis > 0)) { p.invisKind = null; return; }
        if (p.invisKind === 'ghost') p.st.haste = Math.max(p.st.haste || 0, 0.05); // chạy nhanh (dùng hiệu ứng tăng tốc ngắn)
    });
};
// vẽ: ngụy trang = bóng mờ lay động · vô hình = không gì cả · bóng ma = chớp hiện có nhiễu
let _voidDraw = false;
const _blinkAlpha35 = blinkAlpha;
blinkAlpha = function (...a) { return _voidDraw ? 0 : _blinkAlpha35(...a); };
const _drawPlayer35 = drawPlayer;
drawPlayer = function (p, now) {
    const me = localPlayer(), k = invisKind(p), enemy = me && p !== me && !sameTeam(me, p);
    if (!k || !enemy || p.hp <= 0) return _drawPlayer35(p, now);
    if (k === 'void') { _voidDraw = true; try { return _drawPlayer35(p, now); } finally { _voidDraw = false; } }
    if (k === 'ghost' && ghostShown(p)) { // lúc hiện: vẽ thật + nhiễu sọc
        _drawPlayer35(p, now);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(196,181,253,0.35)';
        for (let i = 0; i < 4; i++) { const y = p.y - p.radius + Math.random() * p.radius * 2; ctx.fillRect(p.x - p.radius - 6 + (Math.random() - 0.5) * 8, y, p.radius * 2 + 12, 2); }
        ctx.restore(); return;
    }
    _drawPlayer35(p, now); // (đang ẩn: AI gốc không vẽ thân)
    if (!canSee(p.x, p.y, p.radius) || detects(me, p.x, p.y)) return;
    if (k === 'camo') { // bóng mờ lay động như sóng nhiệt
        const still = Math.hypot(p.vx || 0, p.vy || 0) < 30, a = (still ? 0.07 : 0.16) + Math.sin(now * 3 + p.id) * 0.03;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x + Math.sin(now * 7 + p.id) * 1.5, p.y); ctx.rotate(p.angle);
        ctx.strokeStyle = 'rgba(226,232,240,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, p.radius * 0.8, p.radius * 1.04, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.radius * 0.1, 0, p.radius * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.beginPath(); ctx.ellipse(0, 0, p.radius * 0.8, p.radius * 1.04, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else if (k === 'ghost') { // đang ẩn: vài sợi khói tím mỏng
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12 + Math.random() * 0.06; ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) { const a = now * 2 + i * 2.1; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * (0.6 + i * 0.25), a, a + 1.2); ctx.stroke(); }
        ctx.restore();
    }
};
// đồng bộ loại tàng hình cho máy khách
const _buildSnap35 = buildSnapshot;
buildSnapshot = function () { const s = _buildSnap35(); s.ik = {}; players.forEach(p => { if (p.invisKind && p.st && p.st.invis > 0) s.ik[p.id] = [p.invisKind, Math.round((p.ghostSeed || 0) * 100) / 100]; }); return s; };
const _applySnap35 = applySnapshot;
applySnapshot = function (s) { _applySnap35(s); players.forEach(p => { const v = s.ik && s.ik[p.id]; p.invisKind = v ? v[0] : null; if (v) p.ghostSeed = v[1]; }); };
