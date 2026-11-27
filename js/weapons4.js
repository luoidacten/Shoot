/** ==================== ĐỢT VŨ KHÍ MỚI ====================
 *  Pháo Rìu · Rìu Săn (đa hình, dùng chung băng đạn) · Bộ Cơ Động · Ám Khí · Urumi · Kiếm Xà · Cây Gậy
 *  + nerf Súng Hỏa Mai. Nạp sau weapons3.js.
 */
/* ============================== NERF SÚNG HỎA MAI: chỉ 3 phát, nạp rất lâu, hết đạn thì ném súng ============================== */
Object.assign(WEAPONS.MUSKET, { reserve: 2, reloadTime: 4.2, desc: 'Giữ để ngắm. 1 viên 500 SÁT THƯƠNG CHUẨN. Chỉ có 3 PHÁT — nạp đạn rất lâu (4.2 giây), bắn hết thì tự ném súng đi. Tiếng nổ cực lớn.' });
const _musketFixW4 = musketFix;
musketFix = function (p, w, ang, charge, mine) { const r = _musketFixW4(p, w, ang, charge, mine); w.reloadTime = has(p, 'gunMod') ? 2.8 : 4.2; return r; };
GUN_P.MUSKET = 'Nạp đạn nhanh hơn (2.8 giây thay vì 4.2).';

Object.assign(WEAPONS, {
    AXECANNON: { id: 'AXECANNON', name: 'Pháo Rìu', icon: '🪓', type: 'MELEE', mode: 'charge', chargeTime: 0.75, aim: 'arc', color: '#f97316', damage: 22, fireRate: 34, range: 92, durability: 40, maxDurability: 40, moveScale: 0.95, width: 7, len: 40, tier: 3, desc: 'Đa hình, 2 dạng dùng chung băng 4 đạn (tự nạp dần). Rìu: còn đạn → nện đất nổ, choáng, đẩy lùi; hết đạn → chém thường. Giữ: tốn 1 đạn nổ cháy tại chỗ, bay ngược ra sau → thành Pháo. Pháo: bắn đạn pháo rơi từ trời xuống. Giữ: tốn 1 đạn, xoay tròn lao tới → thành Rìu.' },
    AXEGUN:    { id: 'AXEGUN', name: 'Rìu Săn', icon: '🪓', type: 'MELEE', mode: 'charge', chargeTime: 0.75, aim: 'arc', color: '#a3a3a3', damage: 20, fireRate: 30, range: 88, durability: 40, maxDurability: 40, moveScale: 1.0, width: 6, len: 38, tier: 2, desc: 'Đa hình như Pháo Rìu nhưng dạng súng là SHOTGUN: bắn chùm 7 viên tốn 1 đạn. Rìu: còn đạn → nện đất nổ; hết đạn → chém. Giữ để đổi dạng (bật lùi bằng vụ nổ / xoay lao tới).' },
    MOBGEAR:   { id: 'MOBGEAR', name: 'Bộ Cơ Động', icon: '🪢', type: 'MELEE', mode: 'tap', aim: 'line', color: '#94a3b8', damage: 20, fireRate: 24, range: 380, durability: 45, maxDurability: 45, moveScale: 1.1, width: 4, len: 30, tier: 3, desc: 'Đánh thường: bắn dây móc. Dính người → lướt theo và vượt ra sau họ, chém khi lướt qua; dính tường → kéo tới tường. Nội tại PHI ẢNH: hai lưỡi kiếm tự xoay chém vòng tròn quanh người khi có địch ở gần.' },
    DARTS:     { id: 'DARTS', name: 'Ám Khí', icon: '🪡', type: 'GUN', mode: 'tap', aim: 'line', color: '#e2e8f0', damage: 16, fireRate: 16, speed: 30, spread: 0.02, range: 560, magSize: 6, mag: 6, reserve: 18, reloadTime: 1.4, moveScale: 1.05, width: 3, len: 14, tier: 2, desc: 'Ném kim gần như VÔ HÌNH, bay rất nhanh — cực khó né. Nội tại: mỗi lần ĐỔI VŨ KHÍ (sang hoặc rời Ám Khí) tự ném 12 kim toả tròn quanh người: làm chậm và NGẮT đòn đánh thường của địch.' },
    URUMI:     { id: 'URUMI', name: 'Urumi', icon: '〰️', type: 'MELEE', mode: 'tap', aim: 'arc', color: '#e5e7eb', damage: 18, fireRate: 26, range: 200, durability: 40, maxDurability: 40, moveScale: 1.0, width: 3, len: 34, tier: 3, desc: 'Kiếm roi mềm. Gần (dưới 95): quét rộng hình quạt. Xa (95–200): quất thẳng dài trúng mọi kẻ trên đường. Mọi đòn BỎ QUA PHÒNG THỦ (giáp, khiên, giảm sát thương).' },
    SNAKESWORD:{ id: 'SNAKESWORD', name: 'Kiếm Xà', icon: '🐍', type: 'MELEE', mode: 'charge', chargeTime: 0.6, aim: 'arc', color: '#4ade80', damage: 16, fireRate: 22, range: 86, durability: 40, maxDurability: 40, moveScale: 1.0, width: 4, len: 38, tier: 2, desc: 'Chém gây ĐỘC (cộng dồn). Giữ: lưỡi kiếm tách đốt vươn xa như roi. Mỗi đòn thứ 3 trúng → TÊ LIỆT 1 giây (không thể đánh trả).' },
    STAFF:     { id: 'STAFF', name: 'Cây Gậy', icon: '🦯', type: 'MELEE', mode: 'tap', strike: 'combo', aim: 'arc', color: '#a16207', damage: 15, fireRate: 18, range: 104, durability: 50, maxDurability: 50, moveScale: 1.05, width: 4, len: 48, tier: 1, desc: 'Chỉ là một cây gậy — combo 4 đòn: quét trái, quét phải, THỌC xa, rồi XOAY TRÒN đánh bật mọi thứ xung quanh.' }
});
Object.assign(BASE_WEIGHTS, { AXECANNON: 4, AXEGUN: 5, MOBGEAR: 4, DARTS: 6, URUMI: 4, SNAKESWORD: 5, STAFF: 7 });
const W4FX = [];
const w4MM = p => p.meleeMult || 1, w4DM = p => p.dmgMult || 1;
const isAxeForm = w => (w.form || 'axe') === 'axe';

/* ============================== PHÁO RÌU · RÌU SĂN ============================== */
const _makeWeaponW4 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponW4(id, p);
    if (w && (w.id === 'AXECANNON' || w.id === 'AXEGUN') && w.shells === undefined) { w.form = 'axe'; w.shells = 4; w.maxShells = 4; w.shellT = 0; }
    return w;
};
function axeSetForm(w, f) { w.form = f; w.type = f === 'axe' ? 'MELEE' : 'GUN'; w.range = f === 'axe' ? 92 : (w.id === 'AXECANNON' ? 520 : 260); w.aim = f === 'axe' ? 'arc' : 'line'; }
function useShell(p, w) { if ((w.shells || 0) <= 0) { if (!p.isBot) floatText(p.x, p.y - 30, '🔶 Hết đạn!', '#fdba74', 12); return false; } w.shells--; w.shellT = 0; return true; }
const _ammoTextW4 = ammoText;
ammoText = function (w) { if (w && w.shells !== undefined) return `🔶${w.shells}/${w.maxShells}`; return _ammoTextW4(w); };
function axeFire(p, w, ang, charge, mult, enemy) {
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    const cannon = w.id === 'AXECANNON';
    if (isAxeForm(w)) {
        if (charge >= 0.9) { // → dạng súng: nổ cháy tại chỗ, bay ngược ra sau
            p.cooldown = 20;
            const had = useShell(p, w);
            if (had) { explode(p.x + Math.cos(ang) * 10, p.y + Math.sin(ang) * 10, p.id, 22, 85); zones.push({ type: 'fire', x: p.x, y: p.y, r: 60, t: 3, maxT: 3, owner: p.id, tick: 0 }); }
            const s = umbFreeSpot(p, p.x - Math.cos(ang) * 210, p.y - Math.sin(ang) * 210);
            startTravel(p, s.x, s.y, 0.38, null, null, 70); p.st.invuln = Math.max(p.st.invuln || 0, 0.25);
            axeSetForm(w, 'gun'); floatText(p.x, p.y - 44, cannon ? '💥 → 🔫 PHÁO' : '💥 → 🔫 SHOTGUN', '#fdba74', 14);
            return;
        }
        p.cooldown = w.fireRate * p.fireRateMult;
        if ((w.shells || 0) > 0) { // nện đất nổ
            w.shells--; w.shellT = 0;
            const x = p.x + Math.cos(ang) * 62, y = p.y + Math.sin(ang) * 62;
            slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 92 + p.radius, color: '#fb923c', width: 14, life: 0.22, maxLife: 0.22, swing: 1, line: false });
            ring(x, y, 8, 95, '#f97316', 0.4, 7); spark(x, y, '#fdba74', 18, 300); smoke(x, y, 5, 'rgba(120,113,108,0.4)', 16); addShake(7); hitStop(0.05);
            AudioSys.playAt('explosion', x, y, 0.35); AudioSys.playAt('slam', x, y, 0.4);
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < 95 + e.radius) { dealDamage(e, 34 * w4MM(p) * mult, p.id, { melee: true, knock: 420, angle: Math.atan2(e.y - y, e.x - x) }); e.stun = Math.max(e.stun, 0.6); p.stats.hits++; } });
            obstacles.slice().forEach(o => { const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h)); if (dist(cx, cy, x, y) < 70) damageObstacle(o, 50, p); });
        } else { // chém thường
            AudioSys.playAt('swing', p.x, p.y, 0.5);
            slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 88 + p.radius, color: '#e5e7eb', width: 10, life: 0.2, maxLife: 0.2, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false });
            const hit = arcFoes(p, ang, 88, Math.PI / 2.4);
            hit.forEach(e => { dealDamage(e, w.damage * w4MM(p) * mult, p.id, { melee: true, knock: 200, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++; });
            if (hit.length) { reduceDurability(p, w, 1); hitStop(0.04); addShake(3); }
            hitDecoysObs(p, p.x + Math.cos(ang) * 55, p.y + Math.sin(ang) * 55, 40, w.damage);
        }
        return;
    }
    // dạng súng
    if (charge >= 0.9) { // → rìu: xoay tròn lao tới
        p.cooldown = 22;
        if (!useShell(p, w)) { axeSetForm(w, 'axe'); return; }
        const D = Math.max(60, rayFree(p.x, p.y, ang, 270).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(ang) * D, by = p.y + Math.sin(ang) * D;
        startTravel(p, bx, by, 0.32, null, null, 10); p.st.invuln = Math.max(p.st.invuln || 0, 0.3);
        W4FX.push({ kind: 'spinDash', owner: p.id, t: 0.4, maxT: 0.4 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 44) { dealDamage(e, 30 * w4MM(p) * mult, p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++; } });
        axeSetForm(w, 'axe'); floatText(p.x, p.y - 44, '🌀 → 🪓 RÌU', '#fdba74', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
        return;
    }
    if (!useShell(p, w)) { p.cooldown = 12; return; }
    p.cooldown = (cannon ? 40 : 30) * p.fireRateMult; p.muzzle = 0.08; p.recoil = 1;
    if (cannon) { // đạn pháo rơi từ trời
        const d = w3AimDist(p, enemy, 320, 520), x = p.x + Math.cos(ang) * d, y = p.y + Math.sin(ang) * d;
        dropBomb(p, x, y, 55 * mult * w4DM(p), 110, 0.85);
        AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); addShake(4); p.kx -= Math.cos(ang) * 120; p.ky -= Math.sin(ang) * 120;
        smoke(p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, 4, 'rgba(214,211,209,0.4)', 14);
    } else { // shotgun
        const m = muzzle(p, w, ang);
        for (let i = 0; i < 7; i++) spawnBullet(p, m.x, m.y, ang + (Math.random() - 0.5) * 0.5, { speed: 18 + Math.random() * 5, damage: 10 * mult, range: 260, knock: 130, size: 3, trail: 18 });
        AudioSys.playAt('shotgun', p.x, p.y, 0.5); addShake(5); p.kx -= Math.cos(ang) * 140; p.ky -= Math.sin(ang) * 140;
    }
}

/* ============================== BỘ CƠ ĐỘNG ============================== */
function gearFire(p, w, ang, mult) {
    p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const R = w.range, free = rayFree(p.x, p.y, ang, R);
    const foe = lineFoes(p, ang, free.d + 10, 14)[0];
    AudioSys.playAt('whoosh', p.x, p.y, 0.4);
    if (foe) { // dính người: lướt theo, vượt ra sau họ, chém khi lướt qua
        const a = Math.atan2(foe.y - p.y, foe.x - p.x), past = dist(p.x, p.y, foe.x, foe.y) + foe.radius + p.radius + 55;
        const s = umbFreeSpot(p, p.x + Math.cos(a) * past, p.y + Math.sin(a) * past);
        W4FX.push({ kind: 'line', owner: p.id, x: foe.x, y: foe.y, tid: foe.id, t: 0.3, maxT: 0.3 });
        startTravel(p, s.x, s.y, Math.max(0.12, dist(p.x, p.y, s.x, s.y) / 1400), 'umbLand', { fn: q => {
            slashes.push({ x: q.x, y: q.y, ownerId: q.id, angle: a + Math.PI, range: 80, color: '#e2e8f0', width: 10, life: 0.18, maxLife: 0.18, swing: 1, line: false });
        } }, 10);
        dealDamage(foe, w.damage * w4MM(p) * mult, p.id, { melee: true, knock: 60, angle: a }); p.stats.hits++;
        spark(foe.x, foe.y, '#e2e8f0', 10, 240); afterImages(p, p.x, p.y, s.x, s.y, 4, '#94a3b8'); reduceDurability(p, w, 1);
    } else if (free.wall && free.d > 60) { // dính tường: kéo tới tường
        const tx = p.x + Math.cos(ang) * free.d, ty = p.y + Math.sin(ang) * free.d, s = umbFreeSpot(p, p.x + Math.cos(ang) * (free.d - p.radius - 4), p.y + Math.sin(ang) * (free.d - p.radius - 4));
        W4FX.push({ kind: 'line', owner: p.id, x: tx, y: ty, t: 0.3, maxT: 0.3 });
        startTravel(p, s.x, s.y, Math.max(0.12, dist(p.x, p.y, s.x, s.y) / 1300), null, null, 8);
    } else W4FX.push({ kind: 'line', owner: p.id, x: p.x + Math.cos(ang) * free.d, y: p.y + Math.sin(ang) * free.d, t: 0.18, maxT: 0.18, miss: true });
}
function phiAnh(p, R, dmg) { // nội tại: kiếm xoay chém vòng tròn
    W4FX.push({ kind: 'phiAnh', owner: p.id, R, t: 0.32, maxT: 0.32 });
    AudioSys.playAt('swing', p.x, p.y, 0.35);
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < R + e.radius) { dealDamage(e, dmg * w4MM(p), p.id, { melee: true, knock: 140, angle: Math.atan2(e.y - p.y, e.x - p.x) }); spark(e.x, e.y, '#e2e8f0', 6, 200); } });
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < R && Math.random() < 0.5) { spark(b.x, b.y, '#e2e8f0', 3, 140); bullets.splice(i, 1); } }
}

/* ============================== ÁM KHÍ ============================== */
function needle(p, a, o = {}) {
    const m = muzzle(p, getCurrentWeapon(p), a);
    const b = spawnBullet(p, o.x !== undefined ? o.x : m.x, o.y !== undefined ? o.y : m.y, a, { speed: o.speed || 30, damage: o.dmg || 16, range: o.range || 560, size: 1.6, trail: 8, knock: 20, slow: o.slow || 0.6, color: 'rgba(226,232,240,0.9)' });
    b.needle = true; b.interrupt = !!o.interrupt; b.silence = o.silence || 0; return b;
}
function needleRing(p, n, dmg) {
    for (let i = 0; i < n; i++) needle(p, i * Math.PI * 2 / n, { x: p.x, y: p.y, dmg: dmg * w4DM(p), slow: 1.2, range: 260, speed: 22, interrupt: true });
    ring(p.x, p.y, 6, 70, '#e2e8f0', 0.3, 2); AudioSys.playAt('whoosh', p.x, p.y, 0.35);
}
// kim gần như vô hình (người ném thấy rõ hơn)
const _drawBulletFxW4 = drawBulletFx;
drawBulletFx = function (b) {
    if (!b.needle) return _drawBulletFxW4(b);
    const me = localPlayer(), mine = me && b.owner === me.id, a = mine ? 0.9 : 0.16;
    ctx.save(); ctx.strokeStyle = `rgba(226,232,240,${a})`; ctx.lineWidth = mine ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(b.angle) * 12, b.y - Math.sin(b.angle) * 12); ctx.stroke(); ctx.restore();
};
// kim ngắt đòn đánh thường / khoá kỹ năng
const _dealDamageW4 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    let b = null;
    if (atk && target && !opts.melee && !opts.zone) for (const q of bullets) if (q.needle && q.owner === attackerId && (q.interrupt || q.silence) && dist(q.x, q.y, target.x, target.y) < target.radius + 40) { b = q; break; }
    const r = _dealDamageW4(target, dmg, attackerId, opts);
    if (b && target.hp > 0) {
        if (b.interrupt) { target.cooldown = Math.max(target.cooldown || 0, 36); target.charge = 0; target.aiming = false; floatText(target.x, target.y - 40, '✋ NGẮT ĐÒN', '#e2e8f0', 12); }
        if (b.silence) { target.st.silence = Math.max(target.st.silence || 0, b.silence); target.disarmT = world.time + b.silence; floatText(target.x, target.y - 52, '⚡ TÊ LIỆT', '#fde68a', 13); }
        b.interrupt = false; b.silence = 0;
    }
    return r;
};

/* ============================== URUMI ============================== */
function urumiStrike(p, w, ang, enemy, mult) {
    p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const d = p.manualEngaged && p.aimDist ? p.aimDist : enemy && enemy.hp > 0 && targetable(p, enemy) ? dist(p.x, p.y, enemy.x, enemy.y) : 140;
    const dmg = w.damage * w4MM(p) * mult;
    if (d < 95) { // gần: quét rộng
        AudioSys.playAt('swing', p.x, p.y, 0.55);
        for (let k = -2; k <= 2; k++) W2FX.push({ kind: 'whip', owner: p.id, a: ang + k * 0.28, len: 95, t: 0.22, maxT: 0.22, col: '#f1f5f9' });
        const hit = arcFoes(p, ang, 95, 1.15);
        hit.forEach(e => { trueDamage(e, dmg, p.id); spark(e.x, e.y, '#f8fafc', 6, 200); p.stats.hits++; });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
    } else { // xa: quất thẳng dài, trúng cả hàng
        AudioSys.playAt('swing', p.x, p.y, 0.45);
        const free = rayFree(p.x, p.y, ang, w.range);
        W2FX.push({ kind: 'whip', owner: p.id, a: ang, len: free.d, t: 0.26, maxT: 0.26, col: '#f1f5f9' });
        const hit = lineFoes(p, ang, free.d + 10, 12);
        hit.forEach(e => { trueDamage(e, dmg * 1.15, p.id); spark(e.x, e.y, '#f8fafc', 8, 220); p.stats.hits++; });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
    }
}

/* ============================== KIẾM XÀ ============================== */
function snakeHit(p, e, dmg) {
    dealDamage(e, dmg, p.id, { melee: true, knock: 120, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++;
    e.snakePoison = Math.min(5, (e.snakePoison || 0) + 1); e.snakePoisonT = world.time + 3; e.snakeBy = p.id;
    p.snakeN = (p.snakeN || 0) + 1;
    if (p.snakeN % 3 === 0) { e.disarmT = world.time + 1; e.charge = 0; e.cooldown = Math.max(e.cooldown || 0, 60); floatText(e.x, e.y - 52, '🐍 TÊ LIỆT', '#4ade80', 14); ring(e.x, e.y, 5, 40, '#4ade80', 0.4, 3); }
    spark(e.x, e.y, '#86efac', 6, 180);
}
function snakeStrike(p, w, ang, charge, mult) {
    p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const dmg = w.damage * w4MM(p) * mult;
    if (charge >= 0.9) { // tách đốt, vươn xa như roi
        const free = rayFree(p.x, p.y, ang, 180);
        W2FX.push({ kind: 'whip', owner: p.id, a: ang, len: free.d, t: 0.28, maxT: 0.28, col: '#4ade80' });
        AudioSys.playAt('swing', p.x, p.y, 0.5);
        const hit = lineFoes(p, ang, free.d + 10, 14); hit.forEach(e => snakeHit(p, e, dmg * 1.2));
        if (hit.length) reduceDurability(p, w, 1);
        return;
    }
    AudioSys.playAt('swing', p.x, p.y, 0.45);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 86 + p.radius, color: '#4ade80', width: 8, life: 0.18, maxLife: 0.18, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false });
    const hit = arcFoes(p, ang, 86, Math.PI / 2.3); hit.forEach(e => snakeHit(p, e, dmg));
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
    hitDecoysObs(p, p.x + Math.cos(ang) * 50, p.y + Math.sin(ang) * 50, 34, dmg);
}

/* ============================== CÂY GẬY ============================== */
function staffStrike(p, w, ang, mult) {
    const n = (p.staffN = ((p.staffN || 0) % 4) + 1);
    p.cooldown = (n === 4 ? 30 : w.fireRate) * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const dmg = w.damage * w4MM(p) * mult;
    let hit = [];
    if (n <= 2) { // quét trái / phải
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 100 + p.radius, color: '#d6a15a', width: 8, life: 0.18, maxLife: 0.18, swing: n === 1 ? -1 : 1, line: false });
        hit = arcFoes(p, ang + (n === 1 ? -0.35 : 0.35), 100, 1.0);
        hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: 150, angle: Math.atan2(e.y - p.y, e.x - p.x) + (n === 1 ? -0.8 : 0.8) }); });
        AudioSys.playAt('swing', p.x, p.y, 0.4);
    } else if (n === 3) { // thọc xa
        p.kx += Math.cos(ang) * 140; p.ky += Math.sin(ang) * 140;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 150 + p.radius, color: '#fde68a', width: 7, life: 0.16, maxLife: 0.16, swing: 1, line: true });
        hit = lineFoes(p, ang, 150 + p.radius, 16);
        hit.forEach(e => { dealDamage(e, dmg * 1.4, p.id, { melee: true, knock: 340, angle: ang }); e.stun = Math.max(e.stun, 0.25); });
        floatText(p.x, p.y - 34, 'THỌC!', '#fde68a', 12); AudioSys.playAt('swing', p.x, p.y, 0.5);
    } else { // xoay tròn
        W4FX.push({ kind: 'staffSpin', owner: p.id, t: 0.35, maxT: 0.35 });
        hit = enemiesOf(p).filter(e => !(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 112 + e.radius);
        hit.forEach(e => dealDamage(e, dmg * 1.5, p.id, { melee: true, knock: 480, angle: Math.atan2(e.y - p.y, e.x - p.x) }));
        for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 115 && !b.explosive) { b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = Math.max(b.life, 0.6); b.color = '#fde68a'; } }
        ring(p.x, p.y, 8, 115, '#d6a15a', 0.35, 6); floatText(p.x, p.y - 34, 'XOAY GẬY!', '#fde68a', 13); AudioSys.playAt('whoosh', p.x, p.y, 0.6); addShake(4);
    }
    p.stats.hits += hit.length;
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
}

/* ============================== MÓC VÀO HỆ THỐNG BẮN ============================== */
const _fireWeaponW4 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!w) return _fireWeaponW4(p, w, ang, charge, enemy);
    if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; } // đang tê liệt: không đánh được
    const id = w.id, mult = () => attackMult(p, w);
    if (id === 'AXECANNON' || id === 'AXEGUN') { if (w.shells === undefined) { w.form = 'axe'; w.shells = 4; w.maxShells = 4; w.shellT = 0; } return axeFire(p, w, ang, charge || 0, mult(), enemy); }
    if (id === 'MOBGEAR') return gearFire(p, w, ang, mult());
    if (id === 'URUMI') return urumiStrike(p, w, ang, enemy, mult());
    if (id === 'SNAKESWORD') return snakeStrike(p, w, ang, charge || 0, mult());
    if (id === 'STAFF') return staffStrike(p, w, ang, mult());
    if (id === 'DARTS') {
        const n = bullets.length, r = _fireWeaponW4(p, w, ang, charge, enemy);
        bullets.slice(n).filter(b => b.owner === p.id).forEach(b => { b.needle = true; b.size = 1.6; b.trail = 8; b.slowHit = Math.max(b.slowHit || 0, 0.6); });
        return r;
    }
    return _fireWeaponW4(p, w, ang, charge, enemy);
};
const _upeW4 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeW4(dt);
    for (let i = W4FX.length - 1; i >= 0; i--) { W4FX[i].t -= dt; if (W4FX[i].t <= 0) W4FX.splice(i, 1); }
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    const now = world.time;
    players.forEach(p => {
        if (p.hp <= 0) return;
        // băng đạn chung của Pháo Rìu / Rìu Săn: tự nạp dần
        (p.inventory || []).forEach(w => { if (w && w.shells !== undefined && w.shells < w.maxShells) { w.shellT = (w.shellT || 0) + dt; const need = has(p, 'meleeTech') || has(p, 'gunMod') ? 1.3 : 1.8; if (w.shellT >= need) { w.shellT = 0; w.shells++; } } });
        const w = getCurrentWeapon(p);
        // Bộ Cơ Động: Phi Ảnh
        if (w && w.id === 'MOBGEAR') { p.phiT = (p.phiT || 0) - dt; if (p.phiT <= 0 && enemiesOf(p).some(e => !(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 110 + e.radius)) { p.phiT = p.phiBoost > now ? 0.7 : 1.4; phiAnh(p, 100, p.phiBoost > now ? 20 : 14); } }
        // Ám Khí: đổi vũ khí → tự ném vòng kim
        if (p._w4Idx === undefined) { p._w4Idx = p.weaponIdx; p._w4Id = w && w.id; }
        if (p.weaponIdx !== p._w4Idx) {
            const prevId = p._w4Id; p._w4Idx = p.weaponIdx; p._w4Id = w && w.id;
            if ((prevId === 'DARTS' || (w && w.id === 'DARTS')) && (p.dartRingT || 0) <= now && (p.inventory || []).some(q => q && q.id === 'DARTS')) { p.dartRingT = now + 3; needleRing(p, has(p, 'gunMod') ? 16 : 12, 8); }
        } else p._w4Id = w && w.id;
        // Kiếm Xà: độc
        if (p.snakePoison > 0) { if (p.snakePoisonT < now) p.snakePoison = 0; else { p.snakeTick = (p.snakeTick || 0) + dt; if (p.snakeTick >= 0.5) { p.snakeTick = 0; dealDamage(p, 1.5 * p.snakePoison, p.snakeBy, { zone: true, knock: 1 }); if (Math.random() < 0.5) particles.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y, vx: 0, vy: -30, life: 0.5, maxLife: 0.5, color: '#4ade80', size: 2.5 }); } } }
        if (p.disarmT > now) p.charge = 0;
    });
};
// bot không giữ-thả ngẫu nhiên với Pháo Rìu: đổi dạng theo khoảng cách
const _fireMeleeW4 = fireMelee;
updatePartyExtras = (f => function (dt) {
    f(dt);
    if (gameState !== 'PLAYING') return;
    players.forEach(p => {
        if (!p.isBot || p.hp <= 0) return; const w = getCurrentWeapon(p); if (!w || (w.id !== 'AXECANNON' && w.id !== 'AXEGUN') || (p.axeAI || 0) > world.time || p.cooldown > 0 || p.travel) return;
        const e = enemyOf(p); if (!e || !targetable(p, e)) return; const d = dist(p.x, p.y, e.x, e.y), a = Math.atan2(e.y - p.y, e.x - p.x);
        const far = w.id === 'AXECANNON' ? 260 : 170;
        if ((isAxeForm(w) && d > far && w.shells > 0) || (!isAxeForm(w) && d < 130 && w.shells > 0)) { p.axeAI = world.time + 2; axeFire(p, w, a, 1, attackMult(p, w), e); }
    });
})(updatePartyExtras);

/* ============================== BẬC THẦY · KỸ THUẬT CAO ============================== */
Object.assign(MELEE_P, { AXECANNON: 'Đạn tự nạp nhanh hơn (1.3 giây/viên).', AXEGUN: 'Đạn tự nạp nhanh hơn (1.3 giây/viên).', MOBGEAR: 'Phi Ảnh xoay nhanh gấp đôi khi vừa dùng kỹ năng.', URUMI: 'Đòn xa trúng 3 kẻ trở lên hồi 1 giây kỹ năng.', SNAKESWORD: 'Độc cộng dồn tới 5 tầng.', STAFF: 'Đòn xoay tròn phản đạn.' });
Object.assign(GUN_P, { DARTS: 'Vòng kim khi đổi vũ khí có 16 kim.', AXECANNON: 'Đạn tự nạp nhanh hơn (1.3 giây/viên).', AXEGUN: 'Đạn tự nạp nhanh hơn (1.3 giây/viên).' });
const _meleeTechW4 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'AXECANNON' || w.id === 'AXEGUN') { // Địa Chấn Rìu: nhảy tới, nện nổ lớn, nạp 2 đạn
        const d = Math.max(80, Math.min(260, p.skillDist || 220)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
        floatText(p.x, p.y - 44, '🪓 ĐỊA CHẤN RÌU!', '#fdba74', 15);
        startTravel(p, s.x, s.y, 0.42, 'umbLand', { fn: q => { const ww = getCurrentWeapon(q); explode(q.x + Math.cos(a) * 20, q.y + Math.sin(a) * 20, q.id, 40 * w4MM(q), 150); enemiesOf(q).forEach(e => { if (dist(e.x, e.y, q.x, q.y) < 160 + e.radius) e.stun = Math.max(e.stun, 1); }); if (ww.shells !== undefined) ww.shells = Math.min(ww.maxShells, ww.shells + 2); addShake(10); } }, 100);
        return;
    }
    if (w.id === 'MOBGEAR') { // Xoáy Cơ Động: lướt xoay chém, Phi Ảnh tăng tốc 4 giây
        const D = Math.max(60, rayFree(p.x, p.y, a, 240).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(a) * D, by = p.y + Math.sin(a) * D;
        startTravel(p, bx, by, 0.22, null, null, 12); afterImages(p, ax, ay, bx, by, 5, '#94a3b8');
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 50) dealDamage(e, 28 * w4MM(p), p.id, { melee: true, knock: 220, angle: a }); });
        W4FX.push({ kind: 'phiAnh', owner: p.id, R: 110, t: 0.4, maxT: 0.4 }); p.phiBoost = world.time + 4; p.phiT = 0;
        floatText(p.x, p.y - 44, '🌀 XOÁY CƠ ĐỘNG', '#e2e8f0', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
        return;
    }
    if (w.id === 'URUMI') { // Vũ Điệu Xoáy: xoay 1.5 giây, bỏ qua phòng thủ
        let k = 0; const tick = () => { if (p.hp <= 0 || k++ >= 6) return; for (let j = 0; j < 4; j++) W2FX.push({ kind: 'whip', owner: p.id, a: world.time * 6 + j * Math.PI / 2, len: 125, t: 0.22, maxT: 0.22, col: '#f8fafc' }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 130 + e.radius) trueDamage(e, 8 * w4MM(p), p.id); }); AudioSys.playAt('swing', p.x, p.y, 0.3); p.shotQueue.push({ t: 0.25, fn: tick }); };
        tick(); p.st.haste = Math.max(p.st.haste || 0, 1.5); floatText(p.x, p.y - 44, '〰️ VŨ ĐIỆU XOÁY', '#f8fafc', 15);
        return;
    }
    if (w.id === 'SNAKESWORD') { // Xà Vũ: quất 3 hướng, mỗi đòn độc
        [-0.5, 0, 0.5].forEach(o => { const free = rayFree(p.x, p.y, a + o, 200); W2FX.push({ kind: 'whip', owner: p.id, a: a + o, len: free.d, t: 0.3, maxT: 0.3, col: '#4ade80' }); lineFoes(p, a + o, free.d + 10, 14).forEach(e => snakeHit(p, e, 18 * w4MM(p))); });
        floatText(p.x, p.y - 44, '🐍 XÀ VŨ', '#4ade80', 15); AudioSys.playAt('swing', p.x, p.y, 0.6);
        return;
    }
    if (w.id === 'STAFF') { // Gậy Vươn Dài: thọc cực xa, đẩy lùi mạnh
        const free = rayFree(p.x, p.y, a, 320); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: free.d, color: '#fde68a', width: 12, life: 0.25, maxLife: 0.25, swing: 1, line: true });
        lineFoes(p, a, free.d + 10, 22).forEach(e => { dealDamage(e, 34 * w4MM(p), p.id, { melee: true, knock: 700, angle: a }); e.stun = Math.max(e.stun, 0.6); });
        floatText(p.x, p.y - 44, '🦯 GẬY VƯƠN DÀI', '#fde68a', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.6); addShake(5);
        return;
    }
    return _meleeTechW4(p);
};
const _gunModW4 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'AXECANNON') { // Pháo Liên Hoàn: 4 quả pháo dọc hướng ngắm, nạp 1 đạn
        for (let i = 0; i < 4; i++) { const d = 180 + i * 95; dropBomb(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 45 * w4DM(p), 95, 0.7 + i * 0.18); }
        if (w.shells !== undefined) w.shells = Math.min(w.maxShells, w.shells + 1);
        floatText(p.x, p.y - 44, '💣 PHÁO LIÊN HOÀN', '#fdba74', 15); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5);
        return;
    }
    if (w.id === 'AXEGUN') { // Đạn Rồng: 3 loạt shotgun lửa
        for (let k = 0; k < 3; k++) p.shotQueue.push({ t: k * 0.14, fn: () => { if (p.hp <= 0) return; const m = muzzle(p, w, a); for (let i = 0; i < 7; i++) spawnBullet(p, m.x, m.y, a + (Math.random() - 0.5) * 0.55, { speed: 17 + Math.random() * 5, damage: 8 * w4DM(p), range: 250, knock: 100, size: 3.4, color: '#fb923c', burn: true, trail: 16 }); AudioSys.playAt('shotgun', p.x, p.y, 0.4); addShake(3); } });
        floatText(p.x, p.y - 44, '🔥 ĐẠN RỒNG', '#fb923c', 15);
        return;
    }
    if (w.id === 'DARTS') { // Bạo Vũ Lê Hoa: 3 vòng kim
        for (let k = 0; k < 3; k++) p.shotQueue.push({ t: k * 0.15, fn: () => { if (p.hp > 0) for (let i = 0; i < 12; i++) needle(p, i * Math.PI / 6 + k * 0.17, { x: p.x, y: p.y, dmg: 10 * w4DM(p), slow: 1, range: 380, speed: 26, interrupt: true }); } });
        floatText(p.x, p.y - 44, '🌸 BẠO VŨ LÊ HOA', '#f1f5f9', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        return;
    }
    return _gunModW4(p);
};
Object.assign(HT, {
    AXECANNON: ['CUỒNG PHỦ ĐẠI PHÁO', p => axeFormHT(p)], AXEGUN: ['CUỒNG PHỦ SONG PHÁT', p => axeFormHT(p)],
    MOBGEAR: ['BÃO LƯỠI', p => { p.st.invuln = Math.max(p.st.invuln || 0, 0.9); startTravel(p, p.x, p.y, 0.9, null, null, 70); for (let k = 0; k < 3; k++) p.shotQueue.push({ t: 0.15 + k * 0.25, fn: () => { if (p.hp > 0) phiAnh(p, 160, 22); } }); floatText(p.x, p.y - 44, '🌪 BÃO LƯỠI', '#e2e8f0', 15); }],
    DARTS: ['TRUY HỒN CHÂM', p => { const T = enemiesOf(p).filter(e => dist(e.x, e.y, p.x, p.y) < 600 && targetable(p, e)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y)).slice(0, 5); if (!T.length) { for (let i = -2; i <= 2; i++) needle(p, aimDir(p) + i * 0.08, { dmg: 18 * w4DM(p), silence: 1.5, speed: 34 }); } else T.forEach((e, i) => p.shotQueue.push({ t: i * 0.06, fn: () => { if (p.hp > 0 && e.hp > 0) needle(p, Math.atan2(e.y - p.y, e.x - p.x), { dmg: 20 * w4DM(p), silence: 1.5, speed: 36, range: 640 }); } })); floatText(p.x, p.y - 44, '🪡 TRUY HỒN CHÂM', '#f1f5f9', 15); }],
    URUMI: ['NGÀN LƯỠI MỀM', p => { const a = aimDir(p); [-0.5, -0.25, 0, 0.25, 0.5].forEach((o, i) => p.shotQueue.push({ t: i * 0.06, fn: () => { if (p.hp <= 0) return; const free = rayFree(p.x, p.y, a + o, 240); W2FX.push({ kind: 'whip', owner: p.id, a: a + o, len: free.d, t: 0.26, maxT: 0.26, col: '#f8fafc' }); lineFoes(p, a + o, free.d + 10, 12).forEach(e => trueDamage(e, 16 * w4MM(p), p.id)); AudioSys.playAt('swing', p.x, p.y, 0.3); } })); floatText(p.x, p.y - 44, '〰️ NGÀN LƯỠI MỀM', '#f8fafc', 15); }],
    SNAKESWORD: ['MÃNG XÀ TRIỀN', p => { const e = enemiesOf(p).filter(q => dist(q.x, q.y, p.x, p.y) < 260 && targetable(p, q)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0]; if (!e) { floatText(p.x, p.y - 34, 'Không có mục tiêu', '#94a3b8', 12); return; } W2FX.push({ kind: 'whip', owner: p.id, a: Math.atan2(e.y - p.y, e.x - p.x), len: dist(p.x, p.y, e.x, e.y), t: 0.5, maxT: 0.5, col: '#22c55e' }); e.st.root = Math.max(e.st.root || 0, 1.5); for (let k = 0; k < 3; k++) snakeHit(p, e, 12 * w4MM(p)); floatText(e.x, e.y - 60, '🐍 BỊ QUẤN', '#4ade80', 15); }],
    STAFF: ['PHONG HOẢ LUÂN', p => { let k = 0; const tick = () => { if (p.hp <= 0 || k++ >= 8) return; W4FX.push({ kind: 'staffSpin', owner: p.id, t: 0.26, maxT: 0.26 }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 120 + e.radius) dealDamage(e, 9 * w4MM(p), p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - p.y, e.x - p.x) }); }); for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 120 && !b.explosive) { b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = Math.max(b.life, 0.6); } } AudioSys.playAt('swing', p.x, p.y, 0.25); p.shotQueue.push({ t: 0.25, fn: tick }); }; tick(); floatText(p.x, p.y - 44, '🌀 PHONG HOẢ LUÂN', '#fde68a', 15); }]
});
function axeFormHT(p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (isAxeForm(w)) { // Cuồng Phủ: xoay rìu hút địch rồi nổ theo số đạn
        W4FX.push({ kind: 'spinDash', owner: p.id, t: 1.2, maxT: 1.2 });
        for (let k = 0; k < 5; k++) p.shotQueue.push({ t: k * 0.22, fn: () => { if (p.hp <= 0) return; enemiesOf(p).forEach(e => { const d = dist(e.x, e.y, p.x, p.y); if (e.air > 0 || d > 220) return; const ea = Math.atan2(p.y - e.y, p.x - e.x), mv = Math.min(d - 40, 30); if (mv > 0 && !pointInObstacle(e.x + Math.cos(ea) * mv, e.y + Math.sin(ea) * mv, e.radius)) { e.x += Math.cos(ea) * mv; e.y += Math.sin(ea) * mv; } if (d < 110 + e.radius) dealDamage(e, 8 * w4MM(p), p.id, { melee: true, knock: 1 }); }); AudioSys.playAt('swing', p.x, p.y, 0.3); } });
        p.shotQueue.push({ t: 1.15, fn: () => { if (p.hp <= 0) return; const n = w.shells || 0; w.shells = 0; explode(p.x, p.y, p.id, (30 + 18 * n) * w4MM(p), 130 + 15 * n); floatText(p.x, p.y - 50, `🪓 CUỒNG PHỦ ×${n} ĐẠN`, '#fdba74', 16); } });
        return;
    }
    if (w.id === 'AXECANNON') { // Đại Pháo: tụ 0.5 giây, bắn 1 quả đạn lớn thẳng hàng, nổ lớn
        p.st.root = Math.max(p.st.root || 0, 0.5); floatText(p.x, p.y - 44, '💥 ĐẠI PHÁO…', '#fdba74', 15);
        p.shotQueue.push({ t: 0.5, fn: () => { if (p.hp <= 0) return; const aa = aimDir(p), m = muzzle(p, w, aa); const b = spawnBullet(p, m.x, m.y, aa, { speed: 24, damage: 30 * w4DM(p), range: 800, size: 9, color: '#f97316', explosive: true, trail: 60, knock: 300 }); b.blastSmall = false; p.kx -= Math.cos(aa) * 420; p.ky -= Math.sin(aa) * 420; addShake(9); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.7); } });
        return;
    }
    // Song Phát (shotgun): nổ 2 phát cực gần, giật lùi mạnh
    const m = muzzle(p, w, a);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) spawnBullet(p, m.x, m.y, a + (Math.random() - 0.5) * 0.7, { speed: 20 + Math.random() * 5, damage: 11 * w4DM(p), range: 220, knock: 320, size: 3.5, trail: 18 });
    const s = umbFreeSpot(p, p.x - Math.cos(a) * 200, p.y - Math.sin(a) * 200); startTravel(p, s.x, s.y, 0.3, null, null, 40);
    AudioSys.playAt('shotgun', p.x, p.y, 0.8); addShake(8); floatText(p.x, p.y - 44, '💥 SONG PHÁT', '#e5e7eb', 15);
}
CARDS.meleeTech.desc += '<br>Pháo Rìu / Rìu Săn = Địa Chấn Rìu · Bộ Cơ Động = Xoáy Cơ Động · Urumi = Vũ Điệu Xoáy · Kiếm Xà = Xà Vũ · Cây Gậy = Gậy Vươn Dài.';
CARDS.gunMod.desc += '<br>Pháo Rìu = Pháo Liên Hoàn · Rìu Săn = Đạn Rồng · Ám Khí = Bạo Vũ Lê Hoa.';
Object.assign(HT_PROFILE, {
    AXECANNON: { aim: 'dir', R: 220, shape: 'cone', half: 3.14, col: '249,115,22' }, AXEGUN: { aim: 'dir', R: 220, shape: 'cone', half: 0.6, col: '229,229,229' },
    MOBGEAR: { aim: null, shape: 'selfaoe', aoe: 160, col: '226,232,240' }, DARTS: { aim: null, shape: 'selfaoe', aoe: 600, col: '226,232,240' },
    URUMI: { aim: 'dir', R: 240, shape: 'cone', half: 0.55, col: '248,250,252' }, SNAKESWORD: { aim: null, shape: 'selfaoe', aoe: 260, col: '74,222,128' }, STAFF: { aim: null, shape: 'selfaoe', aoe: 120, col: '214,161,90' }
});
const _skillProfileW4 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && (w.id === 'AXECANNON' || w.id === 'AXEGUN')) {
        if (id === 'meleeTech') return { aim: 'point', R: 260, shape: 'point', aoe: 150, arc: true, col: '249,115,22', tag: '+2 ĐẠN' };
        if (id === 'gunMod') return w.id === 'AXECANNON' ? { aim: 'dir', R: 470, shape: 'line', w: 90, col: '249,115,22' } : { aim: 'dir', R: 250, shape: 'cone', half: 0.3, col: '251,146,60' };
        if (id === 'hightech') return isAxeForm(w) ? { aim: null, shape: 'selfaoe', aoe: 220, col: '249,115,22', tag: '🪓 HÚT · NỔ THEO ĐẠN' } : w.id === 'AXECANNON' ? { aim: 'dir', R: 800, shape: 'line', w: 30, col: '249,115,22', tag: '💥 ĐẠI PHÁO' } : { aim: 'dir', R: 220, shape: 'cone', half: 0.4, col: '229,229,229', tag: '💥 + GIẬT LÙI' };
    }
    if (w && w.id === 'MOBGEAR' && id === 'meleeTech') return { aim: 'dir', R: 240, shape: 'line', w: 90, col: '226,232,240' };
    if (w && w.id === 'URUMI' && id === 'meleeTech') return { aim: null, shape: 'selfaoe', aoe: 130, col: '248,250,252' };
    if (w && w.id === 'SNAKESWORD' && id === 'meleeTech') return { aim: 'dir', R: 200, shape: 'cone', half: 0.55, col: '74,222,128' };
    if (w && w.id === 'STAFF' && id === 'meleeTech') return { aim: 'dir', R: 320, shape: 'line', w: 40, col: '253,230,138' };
    if (w && w.id === 'DARTS' && id === 'gunMod') return { aim: null, shape: 'selfaoe', aoe: 380, col: '226,232,240' };
    return _skillProfileW4(p, id);
};

/* ============================== HÌNH VẼ ============================== */
Object.assign(ART2, {
    AXECANNON: (c, w, r, x0, ch, now) => axeArt(c, w, r, x0, ch, now, true),
    AXEGUN: (c, w, r, x0, ch, now) => axeArt(c, w, r, x0, ch, now, false),
    MOBGEAR: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 6, -6, 12, 12, '#475569', 2.5); c.fillStyle = '#0f172a'; c.beginPath(); c.arc(x0, 0, 3, 0, Math.PI * 2); c.fill(); // bộ phóng dây
        metal(c, x0 + 6, -1.5, 10, 3, '#94a3b8', 1); c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(x0 + 16, -3); c.lineTo(x0 + 21, 0); c.lineTo(x0 + 16, 3); c.fill(); outl(c, 0.6); // đầu móc
        [-11, 11].forEach(oy => { c.save(); c.translate(x0 - 2, oy); c.rotate(oy < 0 ? -0.5 : 0.5); blade(c, [[0, -1.5], [20, -1], [24, 0], [20, 1], [0, 1.5]], '#f1f5f9', '#64748b'); c.restore(); }); // 2 lưỡi kiếm phi ảnh
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(148,163,184,${0.3 + Math.sin(now * 8) * 0.15})`; c.beginPath(); c.arc(x0, 0, 8, 0, Math.PI * 2); c.fill(); c.restore();
        MUZ.MOBGEAR = x0 + 20;
    },
    DARTS: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 3, -4, 7, 8, '#292524', 2); // ống kim
        for (let i = -1; i <= 1; i++) { c.strokeStyle = '#e2e8f0'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0 + 4, i * 2); c.lineTo(x0 + 17, i * 2.2); c.stroke(); glint(c, x0 + 17, i * 2.2, 0.6); }
        MUZ.DARTS = x0 + 17;
    },
    URUMI: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 4, -2, 8, 4, '#78350f', 1.5); metal(c, x0 + 3, -4, 3, 8, '#ca8a04', 1);
        for (let k = 0; k < 3; k++) { c.strokeStyle = k ? 'rgba(226,232,240,0.65)' : '#f1f5f9'; c.lineWidth = 1.4 - k * 0.3; c.beginPath(); c.moveTo(x0 + 6, (k - 1) * 1.5); for (let i = 1; i <= 8; i++) c.lineTo(x0 + 6 + i * 4, (k - 1) * 1.5 + Math.sin(now * 7 + i * 0.9 + k) * (1.5 + i * 0.5)); c.stroke(); }
    },
    SNAKESWORD: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 5, -2, 9, 4, '#14532d', 1.5); c.fillStyle = '#4ade80'; c.beginPath(); c.arc(x0 + 5, 0, 3.4, 0, Math.PI * 2); c.fill(); outl(c, 0.8); // chắn tay đầu rắn
        const sep = ch * 3; for (let i = 0; i < 6; i++) { const x = x0 + 8 + i * (5 + sep), y = Math.sin(now * 5 + i) * ch * 2; c.save(); c.translate(x, y); blade(c, [[0, -2.4], [5, -1.8], [6.5, 0], [5, 1.8], [0, 2.4]], '#dcfce7', '#15803d'); c.restore(); }
        c.fillStyle = '#bbf7d0'; c.beginPath(); c.moveTo(x0 + 8 + 6 * (5 + sep), -2); c.lineTo(x0 + 13 + 6 * (5 + sep), 0); c.lineTo(x0 + 8 + 6 * (5 + sep), 2); c.fill();
    },
    STAFF: (c, w, r, x0, ch, now, p) => {
        const n = p ? (p.staffN || 0) : 0; c.rotate(n === 1 ? -0.3 : n === 2 ? 0.3 : 0);
        wood(c, x0 - 22, -2, 70, 4, 2); [x0 - 20, x0 + 44].forEach(x => metal(c, x, -2.6, 4, 5.2, '#ca8a04', 1, 0.5));
    }
});
function axeArt(c, w, r, x0, ch, now, cannon) {
    if (isAxeForm(w)) {
        wood(c, x0 - 6, -2, 34, 4, 2); // cán
        c.save(); c.translate(x0 + 24, 0);
        const g = c.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#e5e7eb'); g.addColorStop(0.5, '#9ca3af'); g.addColorStop(1, '#4b5563');
        c.fillStyle = g; c.beginPath(); c.moveTo(-4, -4); c.lineTo(6, -14); c.quadraticCurveTo(14, 0, 6, 14); c.lineTo(-4, 4); c.closePath(); c.fill(); outl(c, 1.1); // lưỡi rìu
        metal(c, -7, -5, 6, 10, cannon ? '#c2410c' : '#52525b', 1.5); // khối nòng sau lưỡi
        c.fillStyle = '#111827'; c.beginPath(); c.arc(-4, 0, 2, 0, Math.PI * 2); c.fill();
        c.restore();
    } else {
        metal(c, x0 - 8, -4, 14, 8, '#3f3f46', 2); // thân
        if (cannon) { metal(c, x0 + 4, -5.5, 26, 11, '#7c2d12', 3, 0.5); metal(c, x0 + 28, -6.5, 5, 13, '#431407', 2); c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(x0 + 31, 0, 3.6, 0, Math.PI * 2); c.fill(); MUZ.AXECANNON = x0 + 33; }
        else { metal(c, x0 + 4, -3.6, 22, 3.4, '#52525b', 1.2, 0.6); metal(c, x0 + 4, 0.2, 22, 3.4, '#52525b', 1.2, 0.6); MUZ.AXEGUN = x0 + 26; }
        c.fillStyle = '#9ca3af'; c.beginPath(); c.moveTo(x0 - 2, 4); c.lineTo(x0 + 6, 12); c.lineTo(x0 + 2, 4); c.fill(); outl(c, 0.6); // lưỡi rìu gập
    }
    // số đạn (đèn nhỏ)
    for (let i = 0; i < (w.maxShells || 4); i++) { c.fillStyle = i < (w.shells || 0) ? '#fb923c' : 'rgba(64,64,64,0.8)'; c.fillRect(x0 - 6 + i * 3.5, 6, 2.6, 2.6); }
}

/* ============================== VẼ HIỆU ỨNG ============================== */
const _drawW2FxW4 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxW4(now);
    ctx.save(); ctx.lineCap = 'round';
    W4FX.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return;
        const k = Math.max(0, f.t / f.maxT);
        if (f.kind === 'line') { // dây móc
            let tx = f.x, ty = f.y; if (f.tid !== undefined) { const e = players.find(q => q.id === f.tid); if (e) { tx = e.x; ty = e.y; } }
            ctx.strokeStyle = `rgba(203,213,225,${0.4 + k * 0.6})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
        } else if (f.kind === 'phiAnh') { // 2 lưỡi xoay vòng tròn
            const R = f.R, sp = (1 - k) * Math.PI * 2.4;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(226,232,240,${0.55 * k})`; ctx.lineWidth = 10 * k + 2;
            [0, Math.PI].forEach(o2 => { ctx.beginPath(); ctx.arc(o.x, o.y, R * 0.85, sp + o2 - 1.1, sp + o2); ctx.stroke(); });
            ctx.restore();
            [0, Math.PI].forEach(o2 => { ctx.save(); ctx.translate(o.x + Math.cos(sp + o2) * R * 0.85, o.y + Math.sin(sp + o2) * R * 0.85); ctx.rotate(sp + o2 + Math.PI / 2); blade(ctx, [[-12, -1.8], [10, -1.2], [14, 0], [10, 1.2], [-12, 1.8]], '#f8fafc', '#64748b'); ctx.restore(); });
        } else if (f.kind === 'spinDash') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(251,146,60,${0.6 * k})`; ctx.lineWidth = 6;
            for (let j = 0; j < 2; j++) { const a = now * 22 + j * Math.PI; ctx.beginPath(); ctx.arc(o.x, o.y, 46, a, a + 1.6); ctx.stroke(); }
            ctx.restore();
        } else if (f.kind === 'staffSpin') {
            const a = (1 - k) * Math.PI * 3; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(a);
            ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,230,138,${0.5 * k})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
            ctx.globalCompositeOperation = 'source-over'; wood(ctx, -60, -2.5, 120, 5, 2); ctx.restore();
        }
    });
    // đang tê liệt
    players.forEach(e => { if (e.hp > 0 && e.disarmT > world.time) { ctx.font = `14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('⛓', e.x, e.y - e.radius - 18); } });
    ctx.restore();
};
