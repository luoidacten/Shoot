'use strict';
/* =====================================================================
 *  HIỆU ỨNG CHỚP (bật/giảm/tắt) · KHÓI CHẶN TẦM NHÌN NHƯ TƯỜNG · PHÓNG XA KHI NGẮM
 *  TỰ BẮN cho súng bắn từng phát · Khai Sáng · Tầm Nhìn Bá Chủ · Khói Tốc Hành · Tắt Đèn
 *  NÉM VŨ KHÍ: bật lại nhẹ, nằm 2 giây ai cũng nhặt được · Tay Bắt Dính · Gọi Vũ Khí · Lợi thế Ném mạnh hơn
 *  Nạp sau consolidate.js (trước icons.js).
 * ===================================================================== */

/* ============================== 1) HIỆU ỨNG CHỚP & RUNG ============================== */
if (settings.fxLv === undefined) settings.fxLv = 1; // 2 đầy đủ · 1 giảm (mặc định) · 0 tắt
const fxLv = () => settings.fxLv === undefined ? 1 : settings.fxLv;
(function fxMenu() {
    const seg = document.querySelector('.seg[data-opt="fx"]'); if (!seg) return;
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('active', +b.dataset.val === fxLv()));
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; settings.fxLv = +b.dataset.val; if (typeof saveSettings === 'function') saveSettings(); });
})();
let _lastFlashT = -9;
const _flash30 = flash;
flash = function (color, a = 0.5) {
    const lv = fxLv(), now = performance.now() / 1000;
    if (lv === 0) return;
    if (lv === 1) { if (now - _lastFlashT < 0.7) return; a *= 0.35; }
    else if (now - _lastFlashT < 0.1 && a <= fx.flash) return;
    _lastFlashT = now; _flash30(color, a);
};
const _addShake30 = addShake;
addShake = function (amt) { const lv = fxLv(); _addShake30(amt * (lv === 2 ? 1 : lv === 1 ? 0.45 : 0.12)); };
const _explosionFx30 = explosionFx;
explosionFx = function (x, y, radius) {
    const lv = fxLv(), n = particles.length, hs = fx.hitStop;
    _explosionFx30(x, y, radius);
    if (lv === 2) return;
    fx.hitStop = hs; // nhiều bom liên tục không còn khựng hình
    for (let i = particles.length - 1; i >= n; i--) {
        const pt = particles[i];
        if (pt.glow && pt.size >= 20) { pt.glow = false; pt.size *= 0.6; pt.color = 'rgba(255,220,170,0.35)'; } // không còn chớp sáng cả vùng sương mù
        if (lv === 0 && i % 2) particles.splice(i, 1);
    }
};

/* ============================== 2) KHÓI = TƯỜNG CỦA TẦM NHÌN (đi xuyên & bắn xuyên được) ============================== */
const SMOKE_THICK = 110; // nhìn xuyên được tối đa ~110 đơn vị khói (đứng trong khói chỉ thấy sát bên)
/** t (0..1) trên đoạn thẳng nơi lượng khói đã xuyên qua vượt ngưỡng; 1 = không bị chặn */
function smokeCutT(x1, y1, x2, y2, thick = SMOKE_THICK) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; if (L2 < 1) return 1;
    const L = Math.sqrt(L2), iv = [];
    for (const z of zones) {
        if (z.type !== 'smoke' || !(z.t > 0)) continue;
        const r = z.r * 0.9, fx0 = x1 - z.x, fy0 = y1 - z.y, b = 2 * (fx0 * dx + fy0 * dy), c = fx0 * fx0 + fy0 * fy0 - r * r, disc = b * b - 4 * L2 * c;
        if (disc <= 0) continue;
        const s = Math.sqrt(disc), t1 = Math.max(0, (-b - s) / (2 * L2)), t2 = Math.min(1, (-b + s) / (2 * L2));
        if (t2 > t1) iv.push([t1, t2]);
    }
    if (!iv.length) return 1;
    iv.sort((a, b) => a[0] - b[0]);
    let acc = 0, cur = -1;
    for (const [a, b] of iv) {
        const s = Math.max(a, cur); if (b <= s) continue;
        const len = (b - s) * L;
        if (acc + len >= thick) return s + (thick - acc) / L;
        acc += len; cur = b;
    }
    return 1;
}
const smokeThick = v => v && combo(v, 'smokeHunter') ? 260 : v && combo(v, 'fogEyes') ? 220 : SMOKE_THICK;
const smokeBlocks = (x1, y1, x2, y2, v) => smokeCutT(x1, y1, x2, y2, smokeThick(v)) < 1;
const _los30 = lineOfSight;
lineOfSight = function (x1, y1, x2, y2) { return _los30(x1, y1, x2, y2) && !smokeBlocks(x1, y1, x2, y2); };
const _targetable30 = targetable;
targetable = function (viewer, t) {
    if (!_targetable30(viewer, t)) return false;
    if ((t.st && t.st.reveal > 0) || (viewer && viewer.id !== undefined && isSpotted(t, viewer.id)) || (viewer && viewer.st && viewer.st.radarT > 0)) return true;
    return !(viewer && viewer.x !== undefined && smokeBlocks(viewer.x, viewer.y, t.x, t.y, viewer));
};
// sương mù: tia nhìn dừng lại khi đi qua quá nhiều khói → khói che như bức tường
const _visPoly30 = visPolyFn;
visPolyFn = function (px, py, Rf, Rmax) {
    const pts = _visPoly30(px, py, Rf, Rmax);
    if (!zones.some(z => z.type === 'smoke' && z.t > 0 && dist(px, py, z.x, z.y) < Rmax + z.r)) return pts;
    const me = localPlayer(), th = smokeThick(me) + 20;
    for (let i = 0; i < pts.length; i += 2) { const t = smokeCutT(px, py, pts[i], pts[i + 1], th); if (t < 1) { pts[i] = px + (pts[i] - px) * t; pts[i + 1] = py + (pts[i + 1] - py) * t; } }
    return pts;
};

/* ============================== 3) NGẮM = PHÓNG XA MÀN HÌNH ============================== */
const AIM_ZOOM = { SNIPER: 0.55, RAILGUN: 0.7, BOW: 0.84 };
camera.aimK = 1; camera.aimOx = 0; camera.aimOy = 0;
const aimingScope = p => p && p.hp > 0 && AIM_ZOOM[getCurrentWeapon(p).id] && p.aiming && (p.charge || 0) > 0;
const _updateCamera30 = updateCamera;
updateCamera = function (dt) {
    camera.zoom /= camera.aimK; camera.x -= camera.aimOx; camera.y -= camera.aimOy;
    _updateCamera30(dt);
    const me = localPlayer(), live = gameState === 'PLAYING' || gameState === 'KO';
    let K = 1, ox = 0, oy = 0;
    if (live && aimingScope(me)) {
        K = AIM_ZOOM[getCurrentWeapon(me).id];
        const a = me.aimAngle !== undefined ? me.aimAngle : me.angle, off = (1 / K - 1) * 320;
        ox = Math.cos(a) * off; oy = Math.sin(a) * off;
    }
    camera.aimK += (K - camera.aimK) * Math.min(1, dt * (K < camera.aimK ? 3 : 6));
    camera.aimOx += (ox - camera.aimOx) * Math.min(1, dt * 4); camera.aimOy += (oy - camera.aimOy) * Math.min(1, dt * 4);
    camera.zoom *= camera.aimK; camera.x += camera.aimOx; camera.y += camera.aimOy;
};
// ngắm cũng nhìn xa hơn một chút (Sniper xa nhất, cung ít nhất)
const _visionAt30 = visionAt;
visionAt = function (v, ang) { const r = _visionAt30(v, ang); return aimingScope(v) ? r * (1 + (1 - AIM_ZOOM[getCurrentWeapon(v).id]) * 0.6) : r; };

/* ============================== 4) SÚNG BẮN TỪNG PHÁT: GIỮ HƯỚNG LÀ TỰ BẮN ============================== */
const AUTO_TAP = new Set(['PISTOL', 'SPISTOL', 'AR', 'SAR', 'SHOTGUN', 'ENERGY', 'XBOWX']);
const AUTO_GAP = 21; // tối thiểu ~0.35 giây giữa 2 phát tự bắn
const _handleAttack30 = handleAttack;
handleAttack = function (p, w, input, dt, allowAct, enemy) {
    const auto = !p.isBot && !p.mech && AUTO_TAP.has(w.id), held = !!input.a && allowAct;
    if (auto && !held && p.wasHeldA && p.autoTapN > 0) p.cancelShot = true; // đã tự bắn rồi → thả tay không bắn thêm
    _handleAttack30(p, w, input, dt, allowAct, enemy);
    if (!auto || !held) { p.autoTapN = 0; return; }
    if (p.manualEngaged && !p.cancelShot && (p.aHeldT || 0) > 0.2 && getCurrentWeapon(p) === w) {
        const ready = p.cooldown <= 0 && !w.reloading && (!w.magSize || w.mag > 0);
        if (ready) { fireWeapon(p, w, p.aimAngle, 0, enemy); p.cooldown = Math.max(p.cooldown, AUTO_GAP); p.autoTapN = (p.autoTapN || 0) + 1; }
    }
};

/* ============================== 5) THẺ PHỐI HỢP: KHAI SÁNG · TẦM NHÌN BÁ CHỦ ============================== */
Object.assign(TAC, {
    enlight:  { name: '💡 KHAI SÁNG', need: 1, r: 420, col: '#fde68a', steps: ['CHẠM VÙNG CẦN SOI SÁNG'] },
    overlord: { name: '👁️ TẦM NHÌN BÁ CHỦ', cell: true, need: 1, col: '#facc15', steps: ['CHẠM 1 Ô · LỘ Ô ĐÓ VÀ 8 Ô QUANH'] }
});
defS('enlight', '💡', 'Khai Sáng', 20, 'engage', 'Mở bảng chiến thuật, chạm 1 vùng: tạo vùng TẦM NHÌN bán kính 420 trong 8 giây (soi sáng sương mù, tầm nhìn chuẩn: lộ bẫy, thùng giả, kẻ tàng hình).', p => {
    const c = p.pickTarget ? p.pickTarget.a : autoPoint(p);
    zones.push({ type: 'flareLight', x: c.x, y: c.y, r: 420, t: 8, maxT: 8, owner: p.id, tick: 0 });
    ring(c.x, c.y, 20, 420, '#fde68a', 0.8, 3); AudioSys.playAt('legend', c.x, c.y, 0.25);
    floatText(p.x, p.y - 42, '💡 KHAI SÁNG!', '#fde68a', 15);
}, 2000);
defS('overlordEye', '👁️', 'Tầm Nhìn Bá Chủ', 26, 'engage', 'Mở bảng chiến thuật, chọn 1 Ô: lộ vị trí ô đó và 8 ô xung quanh (vùng 3×3) trong 6 giây — soi sáng sương mù, mọi địch bên trong bị lộ.', p => {
    const c = pickedCells(p, 1)[0] || autoCell(p);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const x = c.x + dx * CELL, y = c.y + dy * CELL; if (x < 0 || y < 0 || x > MAP_W || y > MAP_H) continue;
        const q = cellOf(x, y); zones.push({ type: 'flareLight', x: q.x, y: q.y, r: q.h * 1.42, t: 6, maxT: 6, owner: p.id, tick: 0 });
    }
    zones.push({ type: 'overCell', x: c.x, y: c.y, r: CELL * 1.5, t: 6, maxT: 6, owner: p.id, tick: 0 });
    strikes.push({ kind: 'overSpot', owner: p.id, x: c.x, y: c.y, R: CELL * 1.5, t: 6 });
    AudioSys.playAt('legend', c.x, c.y, 0.3); floatText(p.x, p.y - 42, `👁️ BÁ CHỦ ${cellName(c)}!`, '#facc15', 15);
}, 2000);
CARDS.enlight.picker = 'enlight'; CARDS.overlordEye.picker = 'overlord';
FIRE_SKILLS.push('enlight', 'overlordEye');
FUSE.enlight = ['tacSmoke', 'wideLens']; FUSE.overlordEye = ['markCells', 'periscope'];
['enlight', 'overlordEye'].forEach(id => { CARDS[id].evo = { need: FUSE[id], replaces: FUSE[id][0] }; CARDS[id].fuse = true; });
const _updateStrikes30 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes30(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (s.kind !== 'overSpot') continue;
        const o = players.find(q => q.id === s.owner);
        if (o) enemiesOf(o).forEach(e => { if (e.hp > 0 && Math.abs(e.x - s.x) <= s.R && Math.abs(e.y - s.y) <= s.R) spotFor(e, o.id, 0.4); });
        if (s.t <= 0) strikes.splice(i, 1);
    }
};
// bảng: xem trước vùng 3×3 khi chọn ô
const _drawPicker30 = drawPicker;
drawPicker = function (me, W, H, now) {
    _drawPicker30(me, W, H, now);
    if (!picker || picker.kind !== 'overlord') return;
    const R = pickerRect(), q = picker.pts[0] || picker.hover; if (!q) return;
    const c = cellOf(q.x, q.y), X = x => R.x + x * R.k, Y = y => R.y + y * R.k;
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    const x0 = Math.max(0, c.x0 - CELL), y0 = Math.max(0, c.y0 - CELL), x1 = Math.min(MAP_W, c.x1 + CELL), y1 = Math.min(MAP_H, c.y1 + CELL);
    ctx.fillStyle = `rgba(250,204,21,${0.1 + 0.05 * Math.sin(now * 5)})`; ctx.fillRect(X(x0), Y(y0), (x1 - x0) * R.k, (y1 - y0) * R.k);
    ctx.strokeStyle = 'rgba(250,204,21,0.8)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeRect(X(x0), Y(y0), (x1 - x0) * R.k, (y1 - y0) * R.k);
    ctx.restore();
};

/* ============================== 6) THẺ MỚI: KHÓI TỐC HÀNH · TẮT ĐÈN ============================== */
const HASTE_SMOKE = 7; // z.phase = 7 → khói tốc hành (phase được đồng bộ online)
defS('speedSmoke', '💨', 'Khói Tốc Hành', 15, 'escape', 'Ném 1 quả bom khói (6 giây). Bạn và đồng đội đi trong màn khói này được TĂNG TỐC (+50% tốc chạy). Khói vẫn che tầm nhìn như khói thường.', p => { throwSkillItem(p, 'SMOKE', '#7dd3fc', 340); const it = items[items.length - 1]; if (it) it.hsmoke = true; }, 340);
const _landSkillItem30 = landSkillItem;
landSkillItem = function (it) {
    const n = zones.length; _landSkillItem30(it);
    if (it.hsmoke) for (let i = n; i < zones.length; i++) if (zones[i].type === 'smoke') { zones[i].phase = HASTE_SMOKE; zones[i].r *= 1.1; }
};
const BLACKOUT_T = 7;
defS('blackout', '🌑', 'Tắt Đèn', 30, 'engage', 'Cả bản đồ TỐI ĐI trong 7 giây (sương mù bật cho mọi người kể cả khi đang tắt): địch chỉ nhìn được 45% tầm nhìn, còn bạn và đồng đội nhìn xa hơn 35%.', p => {
    world.blackout = { t: BLACKOUT_T, owner: p.id };
    showBanner('🌑 TẮT ĐÈN!', `${p.label} làm cả bản đồ tối đi`, '#94a3b8', 1.4, 44);
    AudioSys.playAt('legend', p.x, p.y, 0.4, 99999);
});
const blackoutOn = () => !!(world.blackout && world.blackout.t > 0);
const blackK = v => !v || !blackoutOn() ? 1 : sameSide(v, world.blackout.owner) ? 1.35 : 0.45;
const _visionAt30b = visionAt;
visionAt = function (v, ang) { return _visionAt30b(v, ang) * blackK(v); };
const _nearRadius30 = nearRadius;
nearRadius = function (v) { return _nearRadius30(v) * blackK(v); };
const _visionRange30 = visionRange;
visionRange = function (viewer) { return _visionRange30(viewer) * blackK(viewer || localPlayer()); };
const _fowActive30 = fowActive;
fowActive = function () { return _fowActive30() || (blackoutOn() && !!localPlayer()); };
const _fogGameplay30 = fogGameplay;
fogGameplay = function () { return _fogGameplay30() || blackoutOn(); };
const _upe30 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe30(dt);
    if (world.blackout && net.role !== 'guest') { world.blackout.t -= dt; if (world.blackout.t <= 0) world.blackout = null; }
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    zones.forEach(z => {
        if (z.type !== 'smoke' || z.phase !== HASTE_SMOKE) return;
        players.forEach(q => { if (q.hp > 0 && sameSide(q, z.owner) && dist(q.x, q.y, z.x, z.y) < z.r) q.st.haste = Math.max(q.st.haste || 0, 0.2); });
    });
};
const _buildSnap30 = buildSnapshot;
buildSnapshot = function () { const s = _buildSnap30(); if (world.blackout) s.bo = [Math.round(world.blackout.t * 10) / 10, world.blackout.owner]; return s; };
const _applySnap30 = applySnapshot;
applySnapshot = function (s) { _applySnap30(s); world.blackout = s.bo ? { t: s.bo[0], owner: s.bo[1] } : null; };
// vẽ: dấu hiệu khói tốc hành + ô Bá Chủ + tối toàn bản đồ
const _drawNetZones30 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones30(now);
    zones.forEach(z => {
        if (z.type === 'smoke' && z.phase === HASTE_SMOKE) {
            ctx.save(); ctx.strokeStyle = 'rgba(125,211,252,0.55)'; ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) { const a = now * 2 + i * 2.1; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (0.45 + 0.15 * i), a, a + 1.2); ctx.stroke(); }
            ctx.font = `700 22px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(186,230,253,0.7)'; ctx.fillText('»', z.x, z.y); ctx.restore();
        } else if (z.type === 'overCell') {
            const x0 = Math.max(0, z.x - z.r), y0 = Math.max(0, z.y - z.r), x1 = Math.min(MAP_W, z.x + z.r), y1 = Math.min(MAP_H, z.y + z.r);
            ctx.save(); ctx.strokeStyle = `rgba(250,204,21,${0.5 + 0.2 * Math.sin(now * 4)})`; ctx.lineWidth = 4; ctx.setLineDash([26, 14]); ctx.lineDashOffset = -now * 60; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
        }
    });
};
const _drawHUD30 = drawHUD;
drawHUD = function (W, H, now) {
    if (blackoutOn() && gameState === 'PLAYING') { ctx.save(); ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0); ctx.fillStyle = 'rgba(2,4,12,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    _drawHUD30(W, H, now);
};

/* ============================== 7) NÉM VŨ KHÍ: bật lại nhẹ · nằm lại 2 giây · ai cũng nhặt được ============================== */
const groundTime = o => o && o.adv === 'thrower' ? 3.5 : 2;
const _throwWeapon30 = throwWeapon;
throwWeapon = function (p, wep, enemy) {
    const n = items.length; _throwWeapon30(p, wep, enemy);
    for (let i = n; i < items.length; i++) {
        const it = items[i]; if (it.ownerId !== p.id || !it.dmg || it.custom || it.skill) continue;
        Object.assign(it, { custom: true, wt: true, wep, hitIds: [] });
        if (p.adv === 'thrower') it.dmg *= 2 / 1.8; // Ném Đồ: ×2 (trước ×1.8)
        if (has(p, 'catchBack')) it.dmg *= 1.15;
    }
};
function wepAllowed(p, w) {
    if (!w || p.mech || p.air > 0) return false;
    if (p.adv === 'meleeMaster' && !isMeleeOrFist(w)) return false;
    if (p.adv === 'rangeMaster' && !isGunWep(w)) return false;
    return true;
}
function dropGroundWeapon(p, w, x, y, t) {
    items.push({ x, y, type: { id: w.id, color: w.color, len: w.len }, angle: Math.random() * 6, spin: 0, vx: 0, vy: 0, thrown: false, custom: true, wt: true, wep: w, ground: t, pickDelay: 0, noPick: { [p.id]: world.time + 1.2 }, ownerId: p.id, hitIds: [] });
}
/** nhặt: có ô trống thì nhặt ngay; hai tay đều có vũ khí thì đứng lên 0.6 giây để đổi với vũ khí đang cầm */
function tryPickWeapon(p, it, force) {
    const w = it.wep; if (!wepAllowed(p, w)) return false;
    let idx = p.inventory.findIndex(x => x.id === 'NONE');
    if (idx < 0) {
        if (!force) { it.stand = it.stand || {}; it.stand[p.id] = (it.stand[p.id] || 0) + 1 / 60; if (it.stand[p.id] < 0.6) return false; }
        idx = p.weaponIdx; const cur = p.inventory[idx];
        if (cur && cur.id !== 'NONE') dropGroundWeapon(p, cur, p.x, p.y, 2);
    }
    w.out = false; p.inventory[idx] = w; p.weaponIdx = idx;
    if (p.id === it.ownerId && p.adv === 'thrower' && w.magSize && !w.noReload) w.mag = Math.max(w.mag, effMag(p, w)); // Ném Đồ: nhặt lại đồ của mình = nạp đầy
    if (p.id === it.ownerId && has(p, 'catchBack')) p.st.catchBuff = 3;
    floatText(p.x, p.y - 28, `🫴 ${w.icon || ''} ${w.name}`, p.id === it.ownerId ? '#fde68a' : '#f87171', 13);
    AudioSys.playAt('pickup', p.x, p.y, 0.4);
    return true;
}
function updateThrownWep(it, dt) {
    const owner = players.find(q => q.id === it.ownerId);
    // bay về tay (Tay Bắt Dính / Gọi Vũ Khí)
    if (it.recall !== undefined) {
        const p = players.find(q => q.id === it.recall);
        if (!p || p.hp <= 0) { it.recall = undefined; it.thrown = false; it.ground = 1.5; it.pickDelay = 0; return false; }
        const a = Math.atan2(p.y - it.y, p.x - it.x), d = dist(it.x, it.y, p.x, p.y), sp = 1050 * dt;
        it.angle += 22 * dt;
        if (d < p.radius + 14 || d < sp) { if (tryPickWeapon(p, it, true)) return true; it.recall = undefined; it.thrown = false; it.ground = 2; it.pickDelay = 0.5; it.x = p.x; it.y = p.y; return false; }
        it.x += Math.cos(a) * sp; it.y += Math.sin(a) * sp;
        if (it.rdmg) players.forEach(e => {
            if (e.hp <= 0 || e.id === p.id || sameTeam(p, e) || it.hitIds.includes(e.id) || dist(it.x, it.y, e.x, e.y) > e.radius + 16) return;
            it.hitIds.push(e.id); dealDamage(e, it.rdmg, p.id, { angle: a, knock: 220 }); if (it.rstun) e.stun = Math.max(e.stun, it.rstun);
            spark(e.x, e.y, '#fde68a', 6, 160); hitStop(0.03);
        });
        return false;
    }
    if (it.thrown) {
        const ox = it.x, oy = it.y;
        it.x += it.vx * dt; it.y += it.vy * dt;
        const k = Math.pow(0.95, dt * 60); it.vx *= k; it.vy *= k; it.angle += it.spin * dt;
        if (it.x < 5 || it.x > MAP_W - 5) { it.vx *= -0.35; it.x = ox; }
        if (it.y < 5 || it.y > MAP_H - 5) { it.vy *= -0.35; it.y = oy; }
        const impact = () => { it.spent = true; it.spin *= 0.4; if (owner && owner.hp > 0 && has(owner, 'catchBack')) { it.recall = owner.id; it.rdmg = 0; } };
        const o = pointInObstacle(it.x, it.y, 4);
        if (o) {
            const fromSide = ox < o.x - 4 || ox > o.x + o.w + 4;
            if (fromSide) it.vx *= -0.3; else it.vy *= -0.3; // bật lại nhẹ
            it.x = ox; it.y = oy;
            if (!it.spent) { if (o.wood) damageObstacle(o, it.dmg || 20); spark(it.x, it.y, '#cbd5e1', 5, 150); impact(); }
        }
        if (!it.spent) for (const p of players) {
            if (p.hp <= 0 || p.id === it.ownerId || (owner && sameTeam(owner, p)) || p.air > 0) continue;
            if (dist(it.x, it.y, p.x, p.y) < p.radius + 12) {
                dealDamage(p, it.dmg || 20, it.ownerId, { angle: Math.atan2(it.vy, it.vx), knock: 380 });
                p.stun = Math.max(p.stun, 0.35); floatText(p.x, p.y - 30, 'CHOÁNG!', '#f5b100', 14); hitStop(0.06);
                it.vx *= -0.22; it.vy *= -0.22; it.x = ox; it.y = oy; // bật ngược ra nhẹ
                impact(); break;
            }
        }
        if (it.recall === undefined && Math.abs(it.vx) < 25 && Math.abs(it.vy) < 25) { it.thrown = false; it.spin = 0; it.ground = groundTime(owner); it.pickDelay = 0.35; it.spent = true; }
        return false;
    }
    // nằm trên đất: ai đi qua cũng nhặt được
    it.ground -= dt; it.pickDelay -= dt;
    if (it.pickDelay <= 0) for (const p of players) {
        if (p.hp <= 0 || (it.noPick && it.noPick[p.id] > world.time)) continue;
        if (dist(p.x, p.y, it.x, it.y) < p.radius + 16) { if (tryPickWeapon(p, it, false)) return true; }
        else if (it.stand) it.stand[p.id] = 0;
    }
    if (it.ground <= 0) { spark(it.x, it.y, '#94a3b8', 4, 60); return true; }
    return false;
}
const _updateCustomItem30 = updateCustomItem;
updateCustomItem = function (it, dt) { return it.wt ? updateThrownWep(it, dt) : _updateCustomItem30(it, dt); };
// dấu hiệu vũ khí nằm trên đất (vòng thời gian còn lại)
const _drawMines30 = drawMines;
drawMines = function (now) {
    _drawMines30(now);
    items.forEach(it => {
        if (!it.wt || it.thrown || it.recall !== undefined || !(it.ground > 0)) return;
        const k = it.ground / groundTime(players.find(q => q.id === it.ownerId)), blink = it.ground < 0.7 && Math.sin(now * 20) < 0;
        ctx.save(); ctx.strokeStyle = blink ? 'rgba(248,113,113,0.8)' : 'rgba(253,230,138,0.75)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(it.x, it.y, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, k))); ctx.stroke();
        ctx.fillStyle = 'rgba(253,230,138,0.08)'; ctx.beginPath(); ctx.arc(it.x, it.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
};
// Lợi thế Ném Đồ mạnh hơn nhẹ
ADVANTAGES.thrower.desc = 'Vũ khí ném đi gây gấp 2 sát thương và bay nhanh hơn; vũ khí ném ra nằm lại 3.5 giây (thay vì 2), nhặt lại vũ khí của mình được nạp đầy đạn; lựu đạn nổ mạnh và rộng hơn 30%, ném xa hơn; khiên / rìu ném mạnh hơn 40%.';

// 2 thẻ ném
defP('catchBack', '🫴', 'Tay Bắt Dính', 'Vũ khí bạn ném (+15% sát thương) trúng người hoặc tường sẽ tự bay ngược về tay bạn. Bắt lại được: 3 giây sau đó đòn đánh +20% sát thương.', p => {});
defS('recallWep', '🧲', 'Gọi Vũ Khí', 10, 'engage', 'Gọi mọi vũ khí đang nằm trên đất hoặc đang bay trong bán kính 700 (của ai cũng được) bay về tay bạn; vũ khí bay xuyên qua địch gây 30 sát thương mỗi cái. Nếu hai tay đã đầy, vũ khí rơi xuống cạnh bạn.', p => {
    const list = items.filter(it => it.wt && it.recall === undefined && dist(it.x, it.y, p.x, p.y) < 700);
    if (!list.length) { floatText(p.x, p.y - 34, 'KHÔNG CÓ VŨ KHÍ ĐỂ GỌI', '#94a3b8', 13); return; }
    const thor = combo(p, 'thorHammer');
    list.forEach(it => { it.recall = p.id; it.thrown = true; it.hitIds = []; it.rdmg = 30 * (thor ? 2 : 1) * (p.adv === 'thrower' ? 1.4 : 1); it.rstun = thor ? 0.6 : 0; });
    ring(p.x, p.y, 10, 120, '#fde68a', 0.4, 4); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    floatText(p.x, p.y - 40, `🧲 GỌI ${list.length} VŨ KHÍ!`, '#fde68a', 15);
});
{ const c = { id: 'thorHammer', a: 'catchBack', b: 'recallWep', name: 'Búa Thần Sấm', desc: 'Gọi Vũ Khí gây gấp đôi sát thương và làm choáng 0.6 giây mỗi địch bị xuyên qua.' }; COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); }
const _dealDamage30 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const a = attackerId >= 0 && players.find(q => q.id === attackerId);
    if (a && a.st && a.st.catchBuff > 0 && !opts.zone) dmg *= 1.2;
    return _dealDamage30(target, dmg, attackerId, opts);
};
const _upe30b = updatePartyExtras;
updatePartyExtras = function (dt) { _upe30b(dt); players.forEach(p => { if (p.st && p.st.catchBuff > 0) p.st.catchBuff = Math.max(0, p.st.catchBuff - dt); }); };
const _initRound30 = initRound;
initRound = function () { world.blackout = null; camera.aimK = 1; camera.aimOx = camera.aimOy = 0; return _initRound30(); };
