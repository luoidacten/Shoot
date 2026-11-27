/** ==================== 4 VŨ KHÍ MỚI · 2 VẬT PHẨM MỚI ====================
 *  Gậy Bóng Chày · Trường Kiếm (ngũ hành) · Nỏ Nổ · Nỏ Liên Châu · Mìn Nổ · Khiên Năng Lượng
 *  Kèm kỹ năng Bậc Thầy (Kỹ Thuật Cận Chiến / Trang Bị Phụ), nội tại theo vũ khí, Kỹ Thuật Cao. Nạp sau whim.js.
 */

/* ============================== ĐỊNH NGHĨA VŨ KHÍ ============================== */
Object.assign(WEAPONS, {
    BAT:       { id: 'BAT', name: 'Gậy Bóng Chày', icon: '🏏', type: 'MELEE', mode: 'charge', chargeTime: 1.1, aim: 'arc', color: '#d6a15a', damage: 20, fireRate: 32, range: 72, durability: 14, maxDurability: 14, moveScale: 1.0, width: 6, len: 34, tier: 2, desc: 'Chạm: đẩy lùi nhẹ. Giữ càng lâu đánh càng xa; địch bay đập vào tường bị sát thương + choáng theo lực.' },
    LONGSWORD: { id: 'LONGSWORD', name: 'Trường Kiếm', icon: '🗡️', type: 'MELEE', mode: 'tap', strike: 'combo', aim: 'arc', color: '#e5e7eb', damage: 28, fireRate: 26, range: 96, durability: 14, maxDurability: 14, moveScale: 1.0, width: 4, len: 44, tier: 3, desc: 'Chém – chém – đâm. Mỗi thanh mang 1 hành (Kim · Mộc · Thủy · Hỏa · Thổ) với buff và hiệu ứng riêng.' },
    XBOWX:     { id: 'XBOWX', name: 'Nỏ Nổ', icon: '💥', type: 'GUN', mode: 'tap', aim: 'line', color: '#f97316', damage: 10, fireRate: 18, speed: 22, spread: 0.04, range: 540, magSize: 8, mag: 8, reserve: 24, reloadTime: 1.4, moveScale: 0.95, width: 5, len: 20, tier: 3, desc: 'Bắn nhanh, mũi tên nổ nhỏ khi chạm.' },
    XBOWR:     { id: 'XBOWR', name: 'Nỏ Liên Châu', icon: '🏹', type: 'GUN', mode: 'auto', aim: 'line', color: '#a16207', damage: 7, fireRate: 13, speed: 26, spread: 0.015, range: 560, magSize: 40, mag: 40, reserve: 80, reloadTime: 1.6, moveScale: 0.9, width: 6, len: 22, tier: 3, desc: 'Bắn liên tục thẳng tắp; giữ bắn càng lâu tốc độ càng tăng (tối đa ×3).' }
});
Object.assign(BASE_WEIGHTS, { BAT: 6, LONGSWORD: 6, XBOWX: 5, XBOWR: 5 });

/* ============================== TRƯỜNG KIẾM: NGŨ HÀNH ============================== */
const ELEMS = {
    KIM:  { name: 'Kim', icon: '⚙️', col: '#e5e7eb', buff: '+25% sát thương; đòn đâm 30% chí mạng ×1.6.' },
    MOC:  { name: 'Mộc', icon: '🌿', col: '#4ade80', buff: 'Cầm kiếm hồi 2 máu/giây; đòn đánh hút 10% máu; đòn đâm trói 0.6 giây.' },
    THUY: { name: 'Thủy', icon: '💧', col: '#38bdf8', buff: 'Đòn đánh làm chậm 1.2 giây; đòn đâm đóng băng (choáng 0.6 giây).' },
    HOA:  { name: 'Hỏa', icon: '🔥', col: '#f97316', buff: 'Đòn đánh gây bỏng; đòn đâm để lại vùng lửa nhỏ.' },
    THO:  { name: 'Thổ', icon: '⛰️', col: '#a16207', buff: 'Khi cầm nhận ít hơn 15% sát thương; đẩy lùi mạnh; đòn đâm làm choáng 0.4 giây.' }
};
const ELEM_IDS = Object.keys(ELEMS);
const _makeWeapon22 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeapon22(id, p);
    if (w && w.id === 'LONGSWORD' && !w.elem) { const e = ELEM_IDS[Math.floor(Math.random() * 5)], E = ELEMS[e]; w.elem = e; w.color = E.col; w.name = `Trường Kiếm · ${E.name}`; w.desc = `Hành ${E.icon} ${E.name}: ${E.buff} Chém – chém – đâm.`; }
    return w;
};
const elemK = p => has(p, 'meleeTech') ? 1.5 : 1; // nội tại Bậc Thầy: hiệu ứng ngũ hành ×1.5

/* ============================== ĐÒN CẬN CHIẾN: GẬY & TRƯỜNG KIẾM ============================== */
function swingHits(p, ang, reach, arc, stab) {
    return enemiesOf(p).filter(e => {
        if (e.air > 0) return false;
        if (stab) { const ex = p.x + Math.cos(ang) * (p.radius + reach), ey = p.y + Math.sin(ang) * (p.radius + reach); return segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 18; }
        if (dist(p.x, p.y, e.x, e.y) < p.radius + e.radius + 14 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 1.7) return true;
        return dist(p.x, p.y, e.x, e.y) < p.radius + e.radius + reach && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < arc;
    });
}
function meleeAfter(p, w, ang, reach, dmg, any) {
    const hx = p.x + Math.cos(ang) * (p.radius + reach * 0.6), hy = p.y + Math.sin(ang) * (p.radius + reach * 0.6);
    for (const d of decoys) if (d.owner !== p.id && dist(hx, hy, d.x, d.y) < d.radius + reach * 0.7) d.hp = 0;
    const o = pointInObstacle(hx, hy, 10); if (o) damageObstacle(o, dmg, p);
    if (any) { reduceDurability(p, w, 1); hitStop(0.06); addShake(4); }
}
const _fireMelee22 = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper, enemy) {
    if (w.id === 'BAT') return batSwing(p, w, ang, charge || 0, mult || 1, isSuper);
    if (w.id === 'LONGSWORD') return swordSwing(p, w, ang, mult || 1, isSuper);
    return _fireMelee22(p, w, ang, charge, mult, isSuper, enemy);
};
function batSwing(p, w, ang, c, mult, isSuper, power) {
    AudioSys.playAt('swing', p.x, p.y, 0.4 + c * 0.4); p.stats.shots++;
    const pw = power !== undefined ? power : c, reach = w.range * (1 + pw * 0.15);
    const dmg = w.damage * (p.meleeMult || 1) * mult * (1 + pw * 0.8) * (isSuper ? 2.5 : 1), knock = 200 + pw * 1250;
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: reach + p.radius, color: pw >= 0.9 ? '#fde047' : '#fcd34d', width: 7 + pw * 9, life: 0.2, maxLife: 0.2, swing: 1, line: false });
    const hit = swingHits(p, ang, reach, Math.PI / 2.2, false);
    hit.forEach(e => {
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        dealDamage(e, dmg, p.id, { angle: a, knock, melee: true, super: isSuper }); p.stats.hits++;
        if (pw >= 0.3) e.batFly = { by: p.id, t: 0.2 + pw * 0.55, power: pw, ang: a };
        if (pw >= 0.9) { floatText(e.x, e.y - 40, '⚾ HOME RUN!', '#fde047', 17); AudioSys.playAt('crit', e.x, e.y, 0.5); }
    });
    if (isSuper) { p.superCharge = 0; floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18); }
    meleeAfter(p, w, ang, reach, dmg, hit.length > 0);
    if (hit.length && pw >= 0.6) { hitStop(0.09); addShake(8); }
}
function swordSwing(p, w, ang, mult, isSuper) {
    AudioSys.playAt('swing', p.x, p.y, 0.5); p.stats.shots++;
    const kind = strikeKind(p, w), stab = kind === 'stab', E = w.elem || 'KIM', K = elemK(p);
    const reach = w.range * (stab ? 1.45 : 1);
    let dmg = w.damage * (p.meleeMult || 1) * mult * (stab ? 1.4 : 1) * (isSuper ? 2.5 : 1);
    if (E === 'KIM') dmg *= 1 + 0.25 * K;
    const knock = E === 'THO' ? 420 : stab ? 220 : 180;
    if (stab) { p.kx += Math.cos(ang) * 160; p.ky += Math.sin(ang) * 160; floatText(p.x, p.y - 30, 'ĐÂM!', ELEMS[E].col, 13); }
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: reach + p.radius, color: ELEMS[E].col, width: stab ? 6 : 9, life: stab ? 0.15 : 0.22, maxLife: stab ? 0.15 : 0.22, swing: p.strikeN % 2 ? 1 : -1, line: stab });
    const hit = swingHits(p, ang, reach, Math.PI / 1.9, stab);
    hit.forEach(e => {
        let dd = dmg; const a = Math.atan2(e.y - p.y, e.x - p.x);
        if (E === 'KIM' && stab && Math.random() < 0.3 * K) { dd *= 1.6; floatText(e.x, e.y - 40, 'CHÍ MẠNG!', '#f8fafc', 14); }
        const done = dealDamage(e, dd, p.id, { angle: a, knock, melee: true, super: isSuper, burn: E === 'HOA', slow: E === 'THUY' ? 1.2 * K : 0 }); p.stats.hits++;
        elemHit(p, e, E, stab, typeof done === 'number' ? done : dd, K);
    });
    if (isSuper) { p.superCharge = 0; floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18); }
    meleeAfter(p, w, ang, reach, dmg, hit.length > 0);
}
function elemHit(p, e, E, stab, dmg, K) {
    if (E === 'MOC') { p.hp = Math.min(p.maxHp, p.hp + dmg * 0.1 * K); if (stab) { e.st.root = Math.max(e.st.root || 0, 0.6 * K); floatText(e.x, e.y - 34, '🌿 TRÓI!', '#4ade80', 13); } }
    if (E === 'THUY') { e.st.slow = Math.max(e.st.slow || 0, 1.2 * K); if (stab) { e.stun = Math.max(e.stun, 0.6 * K); floatText(e.x, e.y - 34, '💧 ĐÓNG BĂNG!', '#7dd3fc', 13); ring(e.x, e.y, 5, 40, '#bae6fd', 0.3, 3); } }
    if (E === 'HOA') { if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 2 * K); e.st.burnBy = p.id; } if (stab) zones.push({ type: 'fire', x: e.x, y: e.y, r: 60, t: 2.5 * K, maxT: 2.5 * K, owner: p.id, tick: 0 }); }
    if (E === 'THO' && stab) { e.stun = Math.max(e.stun, 0.4 * K); ring(e.x, e.y, 5, 50, '#d6a15a', 0.3, 4); }
}
// Mộc: hồi máu khi cầm · Gậy: địch bay đập tường
const _upe22 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe22(dt);
    if (gameState !== 'PLAYING') return;
    players.forEach(p => {
        if (p.hp <= 0) return;
        const w = getCurrentWeapon(p);
        if (w && w.id === 'LONGSWORD' && w.elem === 'MOC' && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + (2 * elemK(p) * dt) * HEALK);
        const f = p.batFly; if (!f) return;
        f.t -= dt; if (f.t <= 0 || p.air > 0) { p.batFly = null; return; }
        const px = p.x + Math.cos(f.ang) * (p.radius + 5), py = p.y + Math.sin(f.ang) * (p.radius + 5);
        const wall = pointInObstacle(px, py, 2) || px < 4 || py < 4 || px > MAP_W - 4 || py > MAP_H - 4;
        if (!wall) { if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.25, maxLife: 0.25, color: 'rgba(253,224,71,0.35)', size: p.radius * 0.7 }); return; }
        const by = players.find(q => q.id === f.by), k = by && has(by, 'meleeTech') && getCurrentWeapon(by).id === 'BAT' ? 1.5 : 1;
        const dmg = (14 + 46 * f.power) * k * ((by && by.meleeMult) || 1);
        dealDamage(p, dmg, f.by, { angle: f.ang + Math.PI, knock: 0, melee: true });
        p.stun = Math.max(p.stun, 0.35 + 1.15 * f.power); p.kx = p.ky = 0; p.batFly = null;
        ring(px, py, 6, 40 + 50 * f.power, '#fde047', 0.35, 5); spark(px, py, '#fde68a', 12, 260); addShake(6 + 8 * f.power); hitStop(0.06);
        floatText(p.x, p.y - 42, f.power >= 0.9 ? '💥 ĐẬP TƯỜNG!!' : '💥 ĐẬP TƯỜNG!', '#fde047', 15); AudioSys.playAt('slam', p.x, p.y, 0.5);
        const ob = pointInObstacle(px, py, 2); if (ob) damageObstacle(ob, 30 * f.power, by);
    });
};
// Thổ: giảm sát thương nhận khi cầm
const _dealDamage22 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const w = target && target.inventory && getCurrentWeapon(target);
    if (w && w.id === 'LONGSWORD' && w.elem === 'THO') dmg *= 1 - 0.15 * elemK(target);
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target && !opts.melee && !opts.zone) {
        const aw = getCurrentWeapon(atk);
        if (aw && aw.id === 'XBOWR' && has(atk, 'gunMod')) dmg *= 1 + Math.min(0.3, (atk.xbRamp || 0) * 0.025); // nội tại: tốc càng cao càng đau
    }
    return _dealDamage22(target, dmg, attackerId, opts);
};

/* ============================== NỎ NỔ · NỎ LIÊN CHÂU ============================== */
const _fireWeapon22 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!w || (w.id !== 'XBOWX' && w.id !== 'XBOWR')) return _fireWeapon22(p, w, ang, charge, enemy);
    const n = bullets.length, gap = world.time - (p.lastFireT || -9);
    const r = _fireWeapon22(p, w, ang, charge, enemy);
    const mine = bullets.slice(n).filter(b => b.owner === p.id);
    if (w.id === 'XBOWX') {
        p.xbN = (p.xbN || 0) + 1;
        const big = has(p, 'gunMod') && p.xbN % 4 === 0; // nội tại Bậc Thầy: mỗi phát thứ 4 nổ lớn
        mine.forEach(b => { b.explosive = true; b.blastSmall = !big; b.color = big ? '#ef4444' : '#fb923c'; b.size = 4; b.trail = 36; b.bolt = true; });
        AudioSys.playAt('bow', p.x, p.y, 0.3);
    } else {
        p.xbRamp = gap < 0.4 ? Math.min(14, (p.xbRamp || 0) + (has(p, 'gunMod') ? 2 : 1)) : 0;
        if (p.xbMax > world.time) p.xbRamp = 14;
        p.cooldown *= Math.max(0.33, 1 - p.xbRamp * 0.05);
        mine.forEach(b => { b.color = '#fde68a'; b.size = 3; b.trail = 30; b.bolt = true; });
        if (p.xbRamp >= 14 && Math.random() < 0.2) spark(p.x + Math.cos(ang) * 24, p.y + Math.sin(ang) * 24, '#fde047', 2, 120);
        if (p.xbFree > world.time && w.magSize) w.mag = Math.min(effMag(p, w), w.mag + 1);
    }
    return r;
};

/* ============================== HÌNH VŨ KHÍ ============================== */
const NEW_ART = {
    BAT: (c, w, r, ch) => {
        c.rotate(-ch * 1.3); // vung ra sau khi tụ lực
        c.fillStyle = '#1f2937'; c.fillRect(r - 6, -2, 12, 4); // cán quấn băng
        c.fillStyle = '#d6a15a'; c.beginPath(); c.moveTo(r + 4, -2); c.lineTo(r + 34, -5); c.quadraticCurveTo(r + 40, 0, r + 34, 5); c.lineTo(r + 4, 2); c.closePath(); c.fill();
        c.lineWidth = 1.5; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(r + 8, -2.5, 22, 1.2);
        if (ch >= 0.9) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(253,224,71,0.45)'; c.beginPath(); c.ellipse(r + 26, 0, 16, 8, 0, 0, Math.PI * 2); c.fill(); }
    },
    LONGSWORD: (c, w, r, ch, now) => {
        const col = (ELEMS[w.elem] || ELEMS.KIM).col;
        c.fillStyle = '#3f3f46'; c.fillRect(r - 6, -2, 10, 4); // chuôi
        c.fillStyle = '#a1a1aa'; c.fillRect(r + 3, -7, 3, 14); // chắn tay
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.moveTo(r + 6, -2.5); c.lineTo(r + 46, -1.2); c.lineTo(r + 52, 0); c.lineTo(r + 46, 1.2); c.lineTo(r + 6, 2.5); c.closePath(); c.fill();
        c.lineWidth = 1.2; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.stroke();
        c.globalAlpha = 0.85; c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(r + 6, -2.5); c.lineTo(r + 46, -1.2); c.lineTo(r + 52, 0); c.lineTo(r + 46, 1.2); c.lineTo(r + 6, 2.5); c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + Math.sin((now || 0) * 4) * 0.2; c.fillStyle = col; c.fillRect(r + 8, -1, 38, 2); c.shadowColor = col; c.globalAlpha = 1;
        c.fillStyle = col; c.beginPath(); c.arc(r - 6, 0, 2.5, 0, Math.PI * 2); c.fill();
    },
    XBOWX: (c, w, r) => {
        c.fillStyle = '#78350f'; c.fillRect(r - 6, -3, 26, 6); // thân
        c.strokeStyle = '#44403c'; c.lineWidth = 3; c.beginPath(); c.arc(r + 14, 0, 12, -Math.PI / 2.2, Math.PI / 2.2, true); c.stroke(); // cánh nỏ
        c.strokeStyle = '#e5e7eb'; c.lineWidth = 1; c.beginPath(); c.moveTo(r + 10, -11); c.lineTo(r + 4, 0); c.lineTo(r + 10, 11); c.stroke(); // dây
        c.fillStyle = '#d4d4d8'; c.fillRect(r + 4, -1, 20, 2); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(r + 25, 0, 2.8, 0, Math.PI * 2); c.fill(); // đầu nổ
    },
    XBOWR: (c, w, r, ch, now, p) => {
        c.fillStyle = '#713f12'; c.fillRect(r - 6, -3.5, 28, 7);
        c.fillStyle = '#a16207'; c.fillRect(r + 2, -9, 14, 6); // hộp tên trên nóc
        c.strokeStyle = '#44403c'; c.lineWidth = 3; c.beginPath(); c.arc(r + 16, 0, 11, -Math.PI / 2.3, Math.PI / 2.3, true); c.stroke();
        c.strokeStyle = '#e5e7eb'; c.lineWidth = 1; c.beginPath(); c.moveTo(r + 12, -10); c.lineTo(r + 8, 0); c.lineTo(r + 12, 10); c.stroke();
        const k = p ? Math.min(1, (p.xbRamp || 0) / 14) : 0; if (k > 0.2) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,224,71,${0.25 + k * 0.4})`; c.fillRect(r - 4, -4, 30, 8); }
    }
};
const _drawWeaponArt22 = drawWeaponArt;
drawWeaponArt = function (c, w, r, now, p) {
    if (!w || !NEW_ART[w.id]) return _drawWeaponArt22(c, w, r, now, p);
    c.save(); c.scale(1.25, 1.25); NEW_ART[w.id](c, w, r / 1.25, p ? (p.charge || 0) : 0, now, p); c.restore();
};

/* ============================== VẬT PHẨM: MÌN NỔ · KHIÊN NĂNG LƯỢNG ============================== */
Object.assign(ITEMS, {
    blastMine: { icon: '🧨', name: 'Mìn Nổ', cast: p => { mines.push({ kind: 'blast', x: p.x, y: p.y, owner: p.id, arm: 1.0 }); AudioSys.playAt('ui', p.x, p.y, 0.3); floatText(p.x, p.y - 34, '🧨 ĐẶT MÌN', '#fca5a5', 13); } },
    energyShield: { icon: '🔷', name: 'Khiên Năng Lượng', cast: p => placeEnergyShield(p) }
});
ITEM_IDS.push('blastMine', 'energyShield');
const _updateTraps22 = updateTraps;
updateTraps = function (dt) {
    const bl = [];
    for (let i = mines.length - 1; i >= 0; i--) if (mines[i].kind === 'blast') { bl.push(mines[i]); mines.splice(i, 1); }
    try { _updateTraps22(dt); } finally {
        bl.forEach(m => {
            if (m.arm > 0) { m.arm -= dt; mines.push(m); return; }
            const ow = players.find(q => q.id === m.owner);
            const e = ow && enemiesOf(ow).find(q => !(q.air > 0) && dist(q.x, q.y, m.x, m.y) < q.radius + 36);
            if (!e) { mines.push(m); return; }
            const half = e.saboteur ? 0.5 : 1;
            explode(m.x, m.y, m.owner, trapDmg(ow, 95) * half, 150);
            floatText(m.x, m.y - 36, '🧨 MÌN NỔ!', '#f87171', 17);
        });
    }
};
function placeEnergyShield(p) {
    const a = p.angle, horiz = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a));
    let o = null, cx = 0, cy = 0;
    for (const d of [70, 45, 110]) { cx = p.x + Math.cos(a) * d; cy = p.y + Math.sin(a) * d; o = placeTempWall(cx, cy, horiz, 160, 8, false); if (o) break; }
    if (!o) { floatText(p.x, p.y - 34, 'Không đủ chỗ dựng khiên', '#94a3b8', 12); return false; }
    Object.assign(o, { ice: false, energy: true, ownerPass: p.id, hp: 70, maxHp: 70, temp: 8 });
    if (horiz) { o.h = 16; o.y = cy - 8; } else { o.w = 16; o.x = cx - 8; }
    ring(cx, cy, 8, 90, '#67e8f9', 0.4, 3); AudioSys.playAt('rail', cx, cy, 0.3);
    floatText(p.x, p.y - 34, '🔷 KHIÊN NĂNG LƯỢNG', '#67e8f9', 14);
}
// khiên năng lượng: nhìn xuyên được (không chặn tầm nhìn / sương mù); chủ bắn & đi xuyên được
lineOfSight = function (x1, y1, x2, y2) { return !obstacles.some(o => !o.energy && segRect(x1, y1, x2, y2, o) >= 0); };
const _drawFog22 = drawFogOfWar;
drawFogOfWar = function (zoom) {
    const en = obstacles.filter(o => o.energy); if (!en.length) return _drawFog22(zoom);
    en.forEach(o => obstacles.splice(obstacles.indexOf(o), 1));
    try { return _drawFog22(zoom); } finally { obstacles.push(...en); }
};
const _drawMines22 = drawMines;
drawMines = function (now) {
    _drawMines22(now);
    const me = localPlayer();
    // mìn nổ của mình
    mines.forEach(m => { if (m.kind !== 'blast' || !me || m.owner !== me.id) return; ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = m.arm > 0 ? '#fbbf24' : (Math.sin(now * 8) > 0 ? '#ef4444' : '#450a0a'); ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    // khiên năng lượng: tấm kính xanh trong suốt
    obstacles.forEach(o => {
        if (!o.energy) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const k = o.maxHp ? Math.max(0.2, o.hp / o.maxHp) : 1;
        ctx.fillStyle = `rgba(103,232,249,${0.16 + 0.12 * k + (o.hit > 0 ? 0.2 : 0)})`; ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = `rgba(165,243,252,${0.6 + Math.sin(now * 6) * 0.2})`; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = 'rgba(165,243,252,0.25)'; ctx.lineWidth = 1;
        const long = Math.max(o.w, o.h); for (let d = 10; d < long; d += 14) { ctx.beginPath(); if (o.w > o.h) { ctx.moveTo(o.x + d, o.y); ctx.lineTo(o.x + d - 6, o.y + o.h); } else { ctx.moveTo(o.x, o.y + d); ctx.lineTo(o.x + o.w, o.y + d - 6); } ctx.stroke(); }
        ctx.restore();
    });
};
// đồng bộ cờ khiên năng lượng cho máy khách
const _buildSnap22 = buildSnapshot;
buildSnapshot = function () { const s = _buildSnap22(); s.en = []; obstacles.forEach((o, i) => { if (o.energy) s.en.push(i); }); return s; };
const _applySnap22 = applySnapshot;
applySnapshot = function (s) { _applySnap22(s); (s.en || []).forEach(i => { if (obstacles[i]) { obstacles[i].energy = true; obstacles[i].temp = 1; } }); };

/* ============================== BẬC THẦY: kỹ năng & nội tại cho 4 vũ khí ============================== */
Object.assign(MELEE_P, { BAT: 'Địch bị đánh bay đập tường nhận thêm 50% sát thương.', LONGSWORD: 'Hiệu ứng ngũ hành mạnh gấp rưỡi.' });
Object.assign(GUN_P, { XBOWX: 'Mỗi phát thứ 4 là mũi nổ lớn.', XBOWR: 'Tốc độ bắn tăng nhanh gấp đôi; tốc càng cao sát thương càng lớn (tối đa +30%).' });
const _meleeTechCast22 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p), K = 1.5;
    if (w.id === 'BAT') { // Cú Đánh Home Run: vung tức thì với lực vượt mức
        batSwing(p, w, a, 1, 1.2, false, 1.35); p.dashTime = 0.12; p.dashAngle = a;
        floatText(p.x, p.y - 38, '⚾ CÚ ĐÁNH HOME RUN!', '#fde047', 16); return;
    }
    if (w.id === 'LONGSWORD') {
        const E = w.elem || 'KIM', m = (p.meleeMult || 1);
        if (E === 'KIM') { for (let i = 0; i < 5; i++) htBullet(p, a + (i - 2) * 0.12, { damage: 30 * m, speed: 22, size: 5, pierce: true, color: '#f8fafc', life: 0.6, trail: 40 }); floatText(p.x, p.y - 38, '⚙️ KIM: VẠN KIẾM QUY TÔNG', '#f8fafc', 15); }
        else if (E === 'MOC') { enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 220) { e.st.root = Math.max(e.st.root || 0, 1.6); dealDamage(e, 18 * m, p.id, { melee: true }); } }); p.hp = Math.min(p.maxHp, p.hp + (30) * HEALK); ring(p.x, p.y, 10, 220, '#4ade80', 0.5, 5); floatText(p.x, p.y - 38, '🌿 MỘC: RỄ TRÓI', '#4ade80', 15); }
        else if (E === 'THUY') { enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (d < 260 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.7) { dealDamage(e, 26 * m, p.id, { melee: true, knock: 700, angle: a, slow: 2 }); e.stun = Math.max(e.stun, 0.5); } }); for (let i = 0; i < 18; i++) particles.push({ x: p.x, y: p.y, vx: Math.cos(a + (Math.random() - 0.5) * 1.3) * 420, vy: Math.sin(a + (Math.random() - 0.5) * 1.3) * 420, life: 0.5, maxLife: 0.5, color: '#7dd3fc', size: 6, drag: 0.92 }); floatText(p.x, p.y - 38, '💧 THỦY: SÓNG DỮ', '#7dd3fc', 15); }
        else if (E === 'HOA') { for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2; zones.push({ type: 'fire', x: p.x + Math.cos(t) * 110, y: p.y + Math.sin(t) * 110, r: 55, t: 4, maxT: 4, owner: p.id, tick: 0 }); } floatText(p.x, p.y - 38, '🔥 HỎA: VÒNG LỬA', '#fb923c', 15); }
        else { const cx = p.x + Math.cos(a) * 80, cy = p.y + Math.sin(a) * 80; placeTempWall(cx, cy, Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)), 150, 6, false); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 170) { e.stun = Math.max(e.stun, 0.8); dealDamage(e, 22 * m, p.id, { melee: true }); } }); ring(p.x, p.y, 10, 170, '#d6a15a', 0.5, 6); addShake(8); floatText(p.x, p.y - 38, '⛰️ THỔ: ĐỊA THÀNH', '#d6a15a', 15); }
        return;
    }
    return _meleeTechCast22(p);
};
const _gunModCast22 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'XBOWX') { const m = muzzle(p, w, a); for (let i = 0; i < 5; i++) spawnBullet(p, m.x, m.y, a + (i - 2) * 0.14, { speed: 20, damage: 0, range: 480, color: '#ef4444', size: 4, explosive: true, blastSmall: true, trail: 36 }); floatText(p.x, p.y - 36, '💥 MŨI TÊN CHÙM', '#fb923c', 14); return; }
    if (w.id === 'XBOWR') { p.xbMax = world.time + 3; p.xbFree = world.time + 3; p.xbRamp = 14; if (w.magSize) w.mag = effMag(p, w); floatText(p.x, p.y - 36, '⚙ LÊN DÂY TỐI ĐA', '#fde047', 14); return; }
    return _gunModCast22(p);
};
CARDS.meleeTech.desc += '<br>Gậy Bóng Chày = Cú Đánh Home Run · Trường Kiếm = kỹ năng theo hành (Kim: Vạn Kiếm · Mộc: Rễ Trói · Thủy: Sóng Dữ · Hỏa: Vòng Lửa · Thổ: Địa Thành).';
CARDS.gunMod.desc += '<br>Nỏ Nổ = Mũi Tên Chùm · Nỏ Liên Châu = Lên Dây Tối Đa (3 giây tốc tối đa, không tốn tên).';

/* ============================== KỸ THUẬT CAO ============================== */
Object.assign(HT, {
    BAT:       ['VỤT XOAY', p => { const w = getCurrentWeapon(p); for (let k = 0; k < 4; k++) batSwing(p, w, k * Math.PI / 2, 0.8, 1, false, 0.8); }],
    LONGSWORD: ['NGŨ HÀNH TRẢM', p => { const w = getCurrentWeapon(p), a = aimDir(p), E = w.elem || 'KIM'; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 200, color: ELEMS[E].col, width: 16, life: 0.32, maxLife: 0.32, swing: 1, line: false }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 200 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 1.1) { const d = 60 * (p.meleeMult || 1); dealDamage(e, d, p.id, { melee: true, knock: 300, angle: a, burn: E === 'HOA' }); elemHit(p, e, E, true, d, 1.5); } }); hitStop(0.06); addShake(8); }],
    XBOWX:     ['MƯA NỔ', p => { const a = aimDir(p), cx = p.x + Math.cos(a) * 320, cy = p.y + Math.sin(a) * 320; for (let i = 0; i < 8; i++) { const r = Math.sqrt(Math.random()) * 140, t = Math.random() * 6.28; dropBomb(p, cx + Math.cos(t) * r, cy + Math.sin(t) * r, 35, 75, 0.5 + i * 0.08); } }],
    XBOWR:     ['BÃO TÊN', p => strikes.push({ kind: 'htBurst', owner: p.id, n: 24, gap: 0.03, tick: 0, dmg: 8, spread: 0.03, color: '#fde68a', snd: 'bow' })]
});

// Nỏ Nổ: vụ nổ NHỎ riêng (24 sát thương, bán kính 75); mũi nổ lớn của Bậc Thầy giữ nguyên
const _explode22 = explode;
explode = function (x, y, ownerId, dmgMax, radius) {
    if (dmgMax === 40 && radius === 90 && bullets.some(b => b.bolt && b.blastSmall && b.owner === ownerId && dist(b.x, b.y, x, y) < 60)) { dmgMax = 24; radius = 75; }
    return _explode22(x, y, ownerId, dmgMax, radius);
};
