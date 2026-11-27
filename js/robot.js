/** ==================== ROBOT · TITAN ====================
 *  Biến hình: thay vũ khí + bộ kỹ năng bằng bộ riêng, có lượng "máu giáp" riêng (hết thì bật ra).
 *  Máu Robot dựa vào số địch còn sống lúc gọi → công bằng cho 1v1.
 *  Thẻ: Gọi Robot (nhặt bánh răng → Robot bản yếu) · phối hợp Gọi Robot Tự Động (Gọi Robot + Kỹ Sư) · thẻ phối hợp Hóa Titan (Khổng Lồ + Bước Nhảy Vọt).
 *  Nạp sau weapons4.js.
 */
Object.assign(WEAPONS, {
    ROBOGUN:   { id: 'ROBOGUN', name: 'Pháo Tay Robot', icon: '🦾', type: 'GUN', mode: 'auto', aim: 'line', color: '#38bdf8', damage: 9, fireRate: 7, speed: 24, spread: 0.06, range: 520, magSize: 999, mag: 999, reserve: 0, noReload: true, reloadTime: 1, moveScale: 0.9, width: 9, len: 26, tier: 4, robo: true },
    ROBOFIST:  { id: 'ROBOFIST', name: 'Búa Tay Robot', icon: '🤜', type: 'MELEE', mode: 'tap', aim: 'arc', color: '#fbbf24', damage: 38, fireRate: 36, range: 110, durability: 9999, maxDurability: 9999, moveScale: 0.95, width: 10, len: 26, tier: 4, robo: true },
    TITANFIST: { id: 'TITANFIST', name: 'Nắm Đấm Titan', icon: '🦍', type: 'MELEE', mode: 'tap', aim: 'arc', color: '#a16207', damage: 34, fireRate: 32, range: 120, durability: 9999, maxDurability: 9999, moveScale: 1.0, width: 12, len: 20, tier: 4, robo: true }
});
const FORMS = {
    robot: { name: 'ROBOT', col: '#38bdf8', weps: ['ROBOGUN', 'ROBOFIST'], skills: ['roboMissile', 'roboStomp', 'roboShield'] },
    titan: { name: 'TITAN', col: '#f59e0b', weps: ['TITANFIST'], skills: ['titanLeap', 'titanRoar', 'titanBoulder'] }
};
/** biến hình: kind = 'robot' | 'titan'; k = sức mạnh (1 = đầy đủ, 0.6 = bản yếu) */
function transformInto(p, kind, k = 1, dur) {
    if (!p || p.hp <= 0) return;
    if (p.form) endForm(p, true);
    const F = FORMS[kind], foes = enemiesOf(p).length;
    const hp = Math.round((kind === 'robot' ? 150 + 75 * foes : 120 + 55 * foes) * k);
    p.form = { kind, k, hp, maxHp: hp, until: world.time + (dur || (kind === 'robot' ? (k >= 1 ? 30 : 20) : 14)), save: { inv: p.inventory, idx: p.weaponIdx, skills: p.skills, radius: p.radius } };
    p.inventory = F.weps.map(id => makeWeapon(id, p)); p.weaponIdx = 0;
    p.skills = F.skills.map(id => ({ id, cd: 0 }));
    if (kind === 'titan') p.radius = Math.round(p.radius * 1.5);
    p.charge = 0; p.cooldown = 0; p.st.invuln = Math.max(p.st.invuln || 0, 0.8);
    ring(p.x, p.y, 10, 140, F.col, 0.6, 8); spark(p.x, p.y, F.col, 30, 360); addShake(8); flash(F.col, 0.12);
    AudioSys.playAt('legend', p.x, p.y, 0.5); AudioSys.playAt('slam', p.x, p.y, 0.5);
    floatText(p.x, p.y - 60, `${kind === 'robot' ? '🤖' : '🦍'} ${F.name}${k < 1 ? ' (bản yếu)' : ''} · ${hp} giáp`, F.col, 18);
    if (p === localPlayer()) showBanner(kind === 'robot' ? '🤖 BIẾN THÀNH ROBOT!' : '🦍 HÓA TITAN!', `${hp} máu giáp · ${Math.round(p.form.until - world.time)} giây · vũ khí & kỹ năng mới`, F.col, 2, 40);
}
function endForm(p, quiet) {
    const f = p.form; if (!f) return;
    p.form = null;
    p.inventory = f.save.inv; p.weaponIdx = Math.min(f.save.idx, p.inventory.length - 1); p.skills = f.save.skills; p.radius = f.save.radius;
    p.charge = 0; p.cooldown = 0;
    if (!quiet) {
        p.st.invuln = Math.max(p.st.invuln || 0, 1);
        explode(p.x, p.y, p.id, 25, 110); smoke(p.x, p.y, 8, 'rgba(148,163,184,0.4)', 20);
        floatText(p.x, p.y - 50, f.kind === 'robot' ? '🤖 ROBOT HỎNG — BẬT RA!' : '🦍 HẾT TITAN', '#cbd5e1', 15);
    }
}
// lượng giáp riêng của dạng biến hình nhận sát thương trước
const _dealDamageForm = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.form && target.hp > 0 && dmg > 0 && !(target.st && target.st.invuln > 0) && !(target.spawnShield > 0 && !opts.zone)) {
        const f = target.form;
        f.hp -= dmg; target.hitFlash = 0.1; target.lastHurt = world.time;
        const atk = attackerId !== -1 && players.find(q => q.id === attackerId); if (atk) atk.stats.dmg += Math.min(dmg, dmg + Math.min(0, f.hp));
        if (Math.random() < 0.4) spark(target.x, target.y, f.kind === 'robot' ? '#7dd3fc' : '#fcd34d', 4, 160);
        if (f.hp > 0) return 0;
        const left = -f.hp; endForm(target);
        return left > 0 ? _dealDamageForm(target, left, attackerId, opts) : 0;
    }
    return _dealDamageForm(target, dmg, attackerId, opts);
};
// vũ khí biến hình không ném / nhặt / rơi được
const _wepAllowedForm = wepAllowed;
wepAllowed = function (p, w) { if (w && w.robo) return false; if (p && p.form) return false; return _wepAllowedForm(p, w); };
const _throwWeaponForm = throwWeapon;
throwWeapon = function (p, wep, enemy) { if (p.form || (wep && wep.robo)) return; return _throwWeaponForm(p, wep, enemy); };

/* ============================== ĐÁNH THƯỜNG CỦA ROBOT / TITAN ============================== */
const _fireWeaponForm = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && (w.id === 'ROBOFIST' || w.id === 'TITANFIST')) {
        p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
        const titan = w.id === 'TITANFIST', R = w.range * (p.form ? 1 : 1), dmg = w.damage * (p.meleeMult || 1) * (p.form ? p.form.k : 1);
        const x = p.x + Math.cos(ang) * (p.radius + 40), y = p.y + Math.sin(ang) * (p.radius + 40);
        ring(x, y, 8, 80, titan ? '#d97706' : '#fbbf24', 0.35, 7); spark(x, y, '#fde68a', 14, 280); addShake(6); AudioSys.playAt('slam', x, y, 0.45);
        if (titan) for (let i = 0; i < 6; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.5, maxLife: 0.5, color: '#78716c', size: 4 });
        const hit = arcFoes(p, ang, R + p.radius * 0.5, 1.0);
        hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: titan ? 560 : 480, angle: Math.atan2(e.y - p.y, e.x - p.x) }); if (titan) e.stun = Math.max(e.stun, 0.35); p.stats.hits++; });
        obstacles.slice().forEach(o => { const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h)); if (dist(cx, cy, x, y) < 60) damageObstacle(o, 60, p); });
        if (hit.length) hitStop(0.05);
        return;
    }
    const r = _fireWeaponForm(p, w, ang, charge, enemy);
    if (w && w.id === 'ROBOGUN' && p.form) w.mag = 999;
    return r;
};

/* ============================== BỘ KỸ NĂNG RIÊNG ============================== */
const formK = p => (p.form ? p.form.k : 1);
defS('roboMissile', '🚀', 'Tên Lửa Vai', 6, 'engage', 'ROBOT: bắn loạt 6 tên lửa nổ nhỏ toả về phía trước.', p => {
    const a = aimDir(p);
    for (let i = 0; i < 6; i++) p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp <= 0) return; const m = muzzle(p, getCurrentWeapon(p), a); spawnBullet(p, m.x, m.y, a + (i - 2.5) * 0.1, { speed: 17, damage: 0, range: 520, color: '#fb923c', size: 5, explosive: true, blastSmall: true, trail: 50 }); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.2); } });
    floatText(p.x, p.y - 50, '🚀 TÊN LỬA VAI', '#7dd3fc', 14);
}, 520);
defS('roboStomp', '🦶', 'Dậm Đất', 8, 'engage', 'ROBOT: nhảy tới điểm chọn, dậm đất: sóng chấn 170 (40 sát thương, choáng 0.8 giây).', p => {
    const a = aimDir(p), d = Math.max(60, Math.min(260, p.skillDist || 220)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    startTravel(p, s.x, s.y, 0.45, 'umbLand', { fn: q => { enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, q.x, q.y) < 170 + e.radius) { dealDamage(e, 40 * formK(q), q.id, { melee: true, knock: 420, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 0.8); } }); ring(q.x, q.y, 10, 170, '#38bdf8', 0.5, 8); addShake(10); AudioSys.playAt('slam', q.x, q.y, 0.6); } }, 100);
}, 260);
defS('roboShield', '🛡️', 'Khiên Năng Lượng', 12, 'defend', 'ROBOT: vòm năng lượng 3 giây phá mọi viên đạn bay vào bán kính 95 và hồi 60 giáp robot.', p => {
    p.roboDomeT = world.time + 3; if (p.form) p.form.hp = Math.min(p.form.maxHp, p.form.hp + 60 * HEALK);
    ring(p.x, p.y, 10, 95, '#7dd3fc', 0.5, 5); floatText(p.x, p.y - 50, '🛡 KHIÊN NĂNG LƯỢNG', '#7dd3fc', 14); AudioSys.playAt('rail', p.x, p.y, 0.4);
});
defS('titanLeap', '💥', 'Titan Giáng Thế', 8, 'engage', 'TITAN: nhảy cao giáng xuống điểm chọn: 50 sát thương vùng 180, hất văng.', p => {
    const a = aimDir(p), d = Math.max(60, Math.min(300, p.skillDist || 240)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    startTravel(p, s.x, s.y, 0.55, 'umbLand', { fn: q => { explode(q.x, q.y, -1, 0, 1); enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, q.x, q.y) < 180 + e.radius) { dealDamage(e, 50 * formK(q), q.id, { melee: true, knock: 700, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 0.6); } }); ring(q.x, q.y, 10, 180, '#f59e0b', 0.5, 9); addShake(12); hitStop(0.08); AudioSys.playAt('slam', q.x, q.y, 0.8); } }, 140);
}, 300);
defS('titanRoar', '🗣️', 'Titan Gầm', 12, 'defend', 'TITAN: gầm lên — địch quanh 260 bị chậm mạnh 2.5 giây và giảm 30% sát thương; bạn nhận 80 giáp titan.', p => {
    enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 260 + e.radius) { e.st.slow = Math.max(e.st.slow || 0, 2.5); e.titanFearT = world.time + 2.5; floatText(e.x, e.y - 40, '😱 SỢ HÃI', '#fcd34d', 13); } });
    if (p.form) p.form.hp = Math.min(p.form.maxHp + 80 * HEALK, p.form.hp + 80 * HEALK);
    ring(p.x, p.y, 10, 260, '#f59e0b', 0.6, 8); ring(p.x, p.y, 10, 180, '#fde68a', 0.5, 5); addShake(8); AudioSys.playAt('alarm', p.x, p.y, 0.4);
    floatText(p.x, p.y - 56, '🗣 TITAN GẦM!', '#fcd34d', 16);
});
defS('titanBoulder', '🪨', 'Ném Tảng Đá', 7, 'engage', 'TITAN: ném tảng đá lớn — trúng địch 45 sát thương, choáng 1.2 giây, vỡ thành mảnh văng.', p => {
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    const b = spawnBullet(p, m.x, m.y, a, { speed: 15, damage: 45 * formK(p), range: 560, size: 14, color: '#78716c', knock: 500, trail: 20 }); b.boulder = true;
    floatText(p.x, p.y - 50, '🪨 NÉM ĐÁ', '#d6d3d1', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
}, 560);
['roboMissile', 'roboStomp', 'roboShield', 'titanLeap', 'titanRoar', 'titanBoulder'].forEach(id => { CARDS[id].comboOnly = true; CARDS[id].formSkill = true; });
// tảng đá: choáng khi trúng · sợ hãi: giảm sát thương gây ra
const _dealDamageTitan = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk.titanFearT > world.time) dmg *= 0.7;
    if (atk && target && !opts.melee) { const b = bullets.find(q => q.boulder && q.owner === attackerId && dist(q.x, q.y, target.x, target.y) < target.radius + 30); if (b) { b.boulder = false; target.stun = Math.max(target.stun, 1.2); ring(target.x, target.y, 6, 60, '#a8a29e', 0.4, 5); for (let i = 0; i < 8; i++) particles.push({ x: target.x, y: target.y, vx: (Math.random() - 0.5) * 360, vy: (Math.random() - 0.5) * 360, life: 0.6, maxLife: 0.6, color: '#78716c', size: 4 }); } }
    return _dealDamageTitan(target, dmg, attackerId, opts);
};

/* ============================== THẺ ============================== */
defP('roboGear', '⚙️', 'Gọi Robot', 'BÁNH RĂNG xuất hiện rải rác trên bản đồ. Nhặt đủ 5 bánh răng → biến thành ROBOT (bản yếu: 60% sức mạnh, 20 giây). Robot có 2 vũ khí riêng (Pháo Tay / Búa Tay — đổi vũ khí để chuyển) và bộ kỹ năng riêng (Tên Lửa Vai · Dậm Đất · Khiên Năng Lượng). Máu giáp robot tính theo số địch còn sống lúc gọi.', p => { p.roboGear = true; });
{ const c = { id: 'roboAuto', a: 'roboGear', b: 'engineer', name: 'Gọi Robot Tự Động', desc: 'Mỗi hiệp, lần đầu tụt dưới 40% máu → tự động gọi ROBOT BẢN ĐẦY ĐỦ (30 giây). Chỉ cần 4 bánh răng.' }; COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); }
defS('titanForm', '🦍', 'Hóa Titan', 30, 'engage', '<b>Khổng Lồ + Bước Nhảy Vọt</b>: hóa TITAN 14 giây — to gấp rưỡi, đánh thường thành Nắm Đấm Titan (hất văng, choáng) và bộ kỹ năng mới: Titan Giáng Thế · Titan Gầm · Ném Tảng Đá. Máu giáp titan tính theo số địch còn sống.', p => transformInto(p, 'titan', 1));
skillFuse('titanForm', ['titan', 'leap']);
// bánh răng trên bản đồ
const _openCrateGear = openCrate;
openCrate = function (p, index) {
    const c = crates[index];
    if (!c || c.type !== 'GEAR') return _openCrateGear(p, index);
    crates.splice(index, 1);
    spark(c.x, c.y, '#94a3b8', 10, 200); AudioSys.playAt('pickup', c.x, c.y, 0.3);
    if (!p.roboGear || p.form) return;
    p.gears = (p.gears || 0) + 1;
    const need = combo(p, 'roboAuto') ? 4 : 5;
    floatText(p.x, p.y - 44, `⚙ ${p.gears}/${need}`, '#cbd5e1', 14);
    if (p.gears >= need) { p.gears = 0; transformInto(p, 'robot', 0.6); }
};
const _resetRoundForm = resetPlayerForRound;
resetPlayerForRound = function (p) { if (p.form) endForm(p, true); p.roboAutoUsed = false; p.roboDomeT = 0; return _resetRoundForm(p); };
let gearSpawnT = 0;
const _upeForm = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeForm(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    const now = world.time;
    players.forEach(p => {
        if (p.hp <= 0) { if (p.form) endForm(p, true); return; }
        if (p.form) {
            if (now > p.form.until) { endForm(p); return; }
            p.st.slow = 0; p.stun = Math.min(p.stun, 0.25); p.kx *= 0.5; p.ky *= 0.5; // thân nặng: gần như miễn khống chế
        }
        if (p.roboDomeT > now) for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 95) { spark(b.x, b.y, '#7dd3fc', 4, 160); bullets.splice(i, 1); } }
        if (combo(p, 'roboAuto') && !p.roboAutoUsed && !p.form && p.hp < p.maxHp * 0.4) { p.roboAutoUsed = true; transformInto(p, 'robot', 1); }
    });
    // bánh răng xuất hiện khi có người cầm thẻ Gọi Robot
    if (players.some(p => p.hp > 0 && p.roboGear)) {
        gearSpawnT -= dt;
        const n = crates.filter(c => c.type === 'GEAR').length;
        if (gearSpawnT <= 0 && n < 8) {
            gearSpawnT = n < 4 ? 2 : 6;
            const z = world.zone;
            for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * Math.max(100, Math.min(z.r, Math.max(MAP_W, MAP_H)) - 80), x = z.x + Math.cos(a) * r, y = z.y + Math.sin(a) * r; if (x < 60 || y < 60 || x > MAP_W - 60 || y > MAP_H - 60 || pointInObstacle(x, y, 24)) continue; const c = makeCrate(x, y, 'GEAR'); c.size = 22; crates.push(c); break; }
        }
    }
};

/* ============================== VẼ ============================== */
Object.assign(ART2, {
    ROBOGUN: (c, w, r, x0) => { metal(c, x0 - 6, -6, 16, 12, '#1e3a5f', 3); metal(c, x0 + 8, -4, 18, 8, '#38bdf8', 2); metal(c, x0 + 24, -5, 6, 10, '#0c4a6e', 2); c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(x0 + 28, 0, 2.6, 0, Math.PI * 2); c.fill(); MUZ.ROBOGUN = x0 + 30; },
    ROBOFIST: (c, w, r, x0) => { metal(c, x0 - 6, -5, 12, 10, '#334155', 3); metal(c, x0 + 4, -8, 16, 16, '#f59e0b', 4); c.fillStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 3; i++) c.fillRect(x0 + 16, -6 + i * 4.5, 3, 3); },
    TITANFIST: (c, w, r, x0) => { c.fillStyle = '#92400e'; c.beginPath(); c.arc(x0 + 8, 0, 10, 0, Math.PI * 2); c.fill(); outl(c, 1.2); c.fillStyle = '#b45309'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x0 + 15, -6 + i * 4, 2.6, 0, Math.PI * 2); c.fill(); } }
});
const _drawW2FxForm = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxForm(now);
    const me = localPlayer();
    // bánh răng
    crates.forEach(c => { if (c.type !== 'GEAR') return; ctx.save(); ctx.translate(c.x, c.y + Math.sin(now * 3 + c.blinkOffset) * 2); ctx.rotate(now * 1.5); ctx.fillStyle = '#94a3b8'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? 9 : 12, t = i * Math.PI / 8; ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.form) { // thân máy / thân titan phủ lên người chơi
            const f = p.form, R = p.radius, robot = f.kind === 'robot', step = Math.sin(now * 9 + p.id) * (Math.hypot(p.vx || 0, p.vy || 0) > 20 ? 4 : 0.5);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
            if (robot) {
                [-1, 1].forEach(sd => { ctx.fillStyle = '#334155'; rrect(ctx, -R * 0.9 + sd * step, sd * R * 0.85 - 5, R * 1.1, 10, 4); ctx.fill(); }); // chân
                const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#1e3a5f');
                rrect(ctx, -R * 1.15, -R * 1.15, R * 2.3, R * 2.3, 8); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(R * 0.2, 0, R * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); // buồng lái
                ctx.fillStyle = `rgba(56,189,248,${0.5 + Math.sin(now * 6) * 0.3})`; ctx.fillRect(-R * 1.1, -3, 5, 6); // động cơ
            } else {
                ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.05, R * 0.95, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.arc(R * 0.45, 0, R * 0.45, 0, Math.PI * 2); ctx.fill(); // đầu
                ctx.fillStyle = '#fde68a'; [-0.25, 0.25].forEach(o => { ctx.beginPath(); ctx.arc(R * 0.7, o * R, 2.2, 0, Math.PI * 2); ctx.fill(); });
                [-1, 1].forEach(sd => { ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.arc(R * 0.5 + step, sd * R * 0.95, R * 0.38, 0, Math.PI * 2); ctx.fill(); }); // vai/tay
            }
            ctx.restore();
            // thanh giáp biến hình + thời gian
            const k = Math.max(0, f.hp / f.maxHp), tl = Math.max(0, (f.until - world.time) / ((robot ? (f.k >= 1 ? 30 : 20) : 14)));
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(p.x - 26, p.y - R - 30, 52, 6); ctx.fillStyle = robot ? '#38bdf8' : '#f59e0b'; ctx.fillRect(p.x - 26, p.y - R - 30, 52 * k, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(p.x - 26, p.y - R - 23, 52 * tl, 2);
        }
        if (p.roboDomeT > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(125,211,252,${0.55 + Math.sin(now * 10) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 95, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(56,189,248,0.07)'; ctx.fill(); ctx.restore(); }
    });
    if (me && me.roboGear && !me.form && me.hp > 0) { const need = combo(me, 'roboAuto') ? 4 : 5; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#cbd5e1'; ctx.fillText(`⚙ ${me.gears || 0}/${need}`, me.x, me.y + me.radius + 22); }
};
