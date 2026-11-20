'use strict';
/* =====================================================================
 *  ĐỨNG MÉP KHÓI / BỤI NHÌN RA NGOÀI · ÁNH ỐNG NGẮM SNIPER · TRƯỜNG KIẾM: KIẾM Ý & KIẾM KHÍ
 *  Nạp sau artpass.js.
 * ===================================================================== */

/* ============================== 1) MÉP KHÓI: nhìn ra ngoài được ==============================
 * Trước đây đứng TRONG khói (kể cả sát mép) là tầm nhìn bị ép còn 115 mọi hướng.
 * Giờ tầm nhìn tính theo từng tia: tia nào phải xuyên qua > ~110 khói mới bị chặn
 * → đứng mép nhìn ra ngoài rõ, đứng sâu giữa khói vẫn chỉ thấy sát bên. Người ngoài vẫn không thấy bạn trong khói. */
let _noSmokeAt = null;
const _inSmoke33 = inSmoke;
inSmoke = function (x, y) { if (_noSmokeAt && x === _noSmokeAt.x && y === _noSmokeAt.y) return undefined; return _inSmoke33(x, y); };
const noSelfSmoke = fn => function (v, ...a) {
    const who = v || localPlayer(); if (!who || who.x === undefined) return fn(v, ...a);
    const prev = _noSmokeAt; _noSmokeAt = who;
    try { return fn(v, ...a); } finally { _noSmokeAt = prev; }
};
visionAt = noSelfSmoke(visionAt); nearRadius = noSelfSmoke(nearRadius); visionRange = noSelfSmoke(visionRange);

/* ============================== 2) SNIPER: ÁNH ỐNG NGẮM ============================== */
const scopeGlint = p => p && p.hp > 0 && getCurrentWeapon(p).id === 'SNIPER' && p.aiming && (p.charge || 0) > 0.05;
function drawScopeGlints(zoom) {
    const me = localPlayer(), W = SCREEN_W, H = SCREEN_H, now = performance.now() / 1000;
    players.forEach(p => {
        if (!scopeGlint(p) || p === me || (me && sameTeam(me, p))) return;
        const a = p.aimAngle !== undefined ? p.aimAngle : p.angle;
        let toward = 1;
        if (me && me.hp > 0) { toward = Math.cos(angleDiff(Math.atan2(me.y - p.y, me.x - p.x), a)); if (toward < 0.25) return; } // chỉ thấy lóe khi ống ngắm hướng về phía bạn
        const gx = p.x + Math.cos(a) * 26, gy = p.y + Math.sin(a) * 26;
        let sx = (gx - camera.x) * zoom + W / 2, sy = (gy - camera.y) * zoom + H / 2;
        const off = sx < 14 || sy < 14 || sx > W - 14 || sy > H - 14;
        if (off) { sx = Math.max(14, Math.min(W - 14, sx)); sy = Math.max(14, Math.min(H - 14, sy)); }
        const s = (off ? 6 : 9) + 16 * toward * Math.min(1, p.charge || 0), k = 0.75 + 0.25 * Math.sin(now * 26 + p.id);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, s * 2.2); g.addColorStop(0, `rgba(255,255,255,${0.95 * k})`); g.addColorStop(0.25, `rgba(216,180,254,${0.6 * k})`); g.addColorStop(1, 'rgba(168,85,247,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, s * 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * k})`; ctx.lineWidth = 1.6; // tia lóe chữ thập
        ctx.beginPath(); ctx.moveTo(sx - s * 3, sy); ctx.lineTo(sx + s * 3, sy); ctx.moveTo(sx, sy - s * 1.6); ctx.lineTo(sx, sy + s * 1.6); ctx.stroke();
        ctx.restore();
    });
}
const _drawEnemyArrows33 = drawEnemyArrows;
drawEnemyArrows = function (zoom) { _drawEnemyArrows33(zoom); if (gameState === 'PLAYING' || gameState === 'KO') drawScopeGlints(zoom); };

/* ============================== 3) TRƯỜNG KIẾM: KIẾM Ý · KIẾM KHÍ · CHÉM CHẶN ĐẠN ==============================
 * - Mỗi đòn trúng liên tiếp +1 Kiếm Ý (tối đa 5, mất sau 2 giây không trúng): mỗi tầng +6% sát thương.
 * - Đòn chém (1, 2) chém rơi đạn bay tới trước mặt.
 * - Đòn đâm (3) phóng KIẾM KHÍ màu hành bay xa 380, xuyên địch, mang hiệu ứng ngũ hành.
 * - Đủ 5 Kiếm Ý: đòn đâm thành VẠN KIẾM — 5 đạo kiếm khí hình quạt, rồi hết Kiếm Ý. */
WEAPONS.LONGSWORD.desc = 'Chém – chém – đâm. Mỗi thanh mang 1 hành. Trúng liên tiếp tích KIẾM Ý (tối đa 5, +6% sát thương mỗi tầng); đòn chém chặn đạn; đòn đâm phóng KIẾM KHÍ; đủ 5 tầng → VẠN KIẾM.';
const SWAVE_SPD = 900;
const _swordSwing33 = swordSwing;
swordSwing = function (p, w, ang, mult, isSuper) {
    const h0 = p.stats.hits, stk = (p.swordStkT || 0) > world.time ? (p.swordStk || 0) : 0;
    _swordSwing33(p, w, ang, (mult || 1) * (1 + 0.06 * stk), isSuper);
    const stab = p.strikeN % 3 === 0, E = w.elem || 'KIM', col = (ELEMS[E] || ELEMS.KIM).col;
    if (p.stats.hits > h0) { p.swordStk = Math.min(5, stk + 1); p.swordStkT = world.time + 2; if (p.swordStk === 5 && stk < 5) floatText(p.x, p.y - 44, '⚔ KIẾM Ý ĐẦY!', col, 14); }
    if (!stab) cutBullets(p, ang, w.range + p.radius + 12, 0.85);
    else {
        const full = (p.swordStk || 0) >= 5, n = full ? 5 : 1;
        const dmg = w.damage * (p.meleeMult || 1) * 0.7 * (1 + 0.15 * (p.swordStk || 0)) * (full ? 1.2 : 1);
        for (let i = 0; i < n; i++) {
            const a = ang + (i - (n - 1) / 2) * 0.24;
            zones.push({ type: 'swordWave', x: p.x + Math.cos(a) * 26, y: p.y + Math.sin(a) * 26, r: full ? 40 : 34, t: 380 / SWAVE_SPD, maxT: 380 / SWAVE_SPD, owner: p.id, tick: 0, phase: Math.round(a * 1000) / 1000, dmg, E, hit: [] });
        }
        if (full) { p.swordStk = 0; floatText(p.x, p.y - 46, '⚔ VẠN KIẾM!', col, 18); addShake(6); ring(p.x, p.y, 10, 90, col, 0.3, 5); }
        AudioSys.playAt('whoosh', p.x, p.y, 0.4);
    }
};
const _upe33 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe33(dt);
    players.forEach(p => { if (p.swordStk && (p.swordStkT || 0) < world.time) p.swordStk = 0; });
    if (net.role === 'guest' || gameState !== 'PLAYING') return;
    zones.forEach(z => {
        if (z.type !== 'swordWave' || !(z.t > 0)) return;
        const o = players.find(q => q.id === z.owner), a = z.phase;
        z.x += Math.cos(a) * SWAVE_SPD * dt; z.y += Math.sin(a) * SWAVE_SPD * dt;
        if (pointInObstacle(z.x, z.y, 4)) { const ob = pointInObstacle(z.x, z.y, 4); if (ob && ob.wood && o) damageObstacle(ob, z.dmg, o); spark(z.x, z.y, '#e5e7eb', 6, 160); z.t = 0; return; }
        if (!o) return;
        players.forEach(e => {
            if (e.hp <= 0 || e === o || sameTeam(o, e) || e.air > 0 || (z.hit || (z.hit = [])).includes(e.id)) return;
            if (dist(z.x, z.y, e.x, e.y) > z.r + e.radius) return;
            z.hit.push(e.id);
            const done = dealDamage(e, z.dmg || 20, o.id, { angle: a, knock: 200, melee: true, burn: z.E === 'HOA', slow: z.E === 'THUY' ? 1 : 0 });
            elemHit(o, e, z.E || 'KIM', false, typeof done === 'number' ? done : z.dmg || 20, elemK(o));
            spark(e.x, e.y, (ELEMS[z.E] || ELEMS.KIM).col, 8, 220);
        });
    });
};
// vẽ kiếm khí: vầng trăng lưỡi liềm màu hành
const _drawNetZones33 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones33(now);
    zones.forEach(z => {
        if (z.type !== 'swordWave') return;
        const o = players.find(q => q.id === z.owner), w = o && getCurrentWeapon(o);
        const col = (ELEMS[z.E || (w && w.elem)] || ELEMS.KIM).col, k = Math.max(0, Math.min(1, z.t / (z.maxT || 1))), a = z.phase || 0;
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.65 * k;
        ctx.strokeStyle = hexA(col, 0.45); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(-z.r * 0.6, 0, z.r, -1.05, 1.05); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-z.r * 0.6, 0, z.r, -1.0, 1.0); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-z.r * 0.6, 0, z.r, -0.85, 0.85); ctx.stroke();
        ctx.restore();
    });
};
// Kiếm Ý: các chấm sáng quanh người cầm kiếm
const _drawPlayerExtras33 = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras33(p, w, now);
    if (!w || w.id !== 'LONGSWORD' || !(p.swordStk > 0) || (p.swordStkT || 0) < world.time) return;
    const col = (ELEMS[w.elem] || ELEMS.KIM).col;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.swordStk; i++) {
        const a = now * 3 + i * Math.PI * 2 / 5;
        ctx.fillStyle = hexA(col.length === 7 ? col : '#e5e7eb', 0.85); ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * (p.radius + 12), p.y + Math.sin(a) * (p.radius + 12), 2.6, 0, Math.PI * 2); ctx.fill();
    }
    if (p.swordStk >= 5) { ctx.strokeStyle = hexA(col.length === 7 ? col : '#e5e7eb', 0.5 + Math.sin(now * 10) * 0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
};
// bot cũng thấy ánh ống ngắm khi bị chĩa vào → biết hướng tay bắn tỉa
const _upe33b = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe33b(dt);
    if (gameState !== 'PLAYING' || net.role === 'guest') return;
    players.forEach(s => {
        if (!scopeGlint(s)) return;
        const a = s.aimAngle !== undefined ? s.aimAngle : s.angle;
        players.forEach(b => {
            if (!b.isBot || !b.brain || b.hp <= 0 || b === s || sameTeam(b, s)) return;
            const d = dist(b.x, b.y, s.x, s.y); if (d > 1900) return;
            if (Math.cos(angleDiff(Math.atan2(b.y - s.y, b.x - s.x), a)) < 0.6 || !_los30(b.x, b.y, s.x, s.y)) return;
            b.brain.heard = { x: s.x, y: s.y, t: world.time, id: s.id, gun: true };
            if (!b.brain.lastSeen || world.time - b.brain.lastSeen.t > 0.5) b.brain.lastSeen = { x: s.x, y: s.y, t: world.time, guess: true };
        });
    });
};
