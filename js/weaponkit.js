/** ==================== BỘ KỸ NĂNG VŨ KHÍ (BẬC THẦY) · LÀM LẠI ĐÒN ĐÁNH THƯỜNG ====================
 *  Đòn đánh thường (mọi người chơi): Dao 50% chí mạng · Đại Đao cảnh báo 1 giây rồi chém rộng · nhảy đập có cảnh báo
 *  · Cưa Máy chạm/giữ · Cung bắn liên tên thì lướt + vô hình, giữ thêm thì mũi tên xuyên thủng.
 *  Nội tại (P) + kỹ năng (S) mới theo vũ khí cho Bậc Thầy. Nạp sau strikes.js.
 */
const NOW = () => world.time;
const holdingId = (p, id) => getCurrentWeapon(p).id === id;
const isMaster = (p, card) => has(p, card);

/* ============================== ĐÒN ĐÁNH THƯỜNG (mọi người chơi) ============================== */
WEAPONS.KNIFE.crit = 0.5;
WEAPONS.GREATSWORD.desc = 'Chém cảnh báo 1 giây rồi bổ cực rộng; giữ để lấy đà (1.5 giây) rồi nhảy đập';
WEAPONS.CHAINSAW.desc = 'Chạm = chém mạnh · Giữ = rồ máy: chạy nhanh, giảm sát thương nhận, cưa liên tục thẳng phía trước (rất ồn)';
WEAPONS.BOW.desc = 'Chạm = 3 mũi liên tiếp + lướt nhẹ & vô hình · Giữ = tụ lực, giữ thêm 0.6 giây sau khi đầy = mũi tên xuyên thủng mọi thứ';
const LEAP_WIND = { HAMMER: 1.0, GREATSWORD: 1.5, SPEAR: 1.0 };

const _fireMelee11 = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper, enemy) {
    // Đại Đao: cảnh báo 1 giây rồi mới chém (rộng hơn)
    if (w.id === 'GREATSWORD' && charge < 0.9 && !p.gsBypass) {
        if (p.gsWind) return;
        const R = (w.range * 1.2 + p.radius);
        p.gsWind = { t: 1.0, ang, mult, isSuper, z: { type: 'meleeWarn', x: p.x, y: p.y, r: R, t: 1, maxT: 1, owner: p.id, tick: 0, phase: Math.round(ang * 1000) } };
        zones.push(p.gsWind.z); AudioSys.playAt('whoosh', p.x, p.y, 0.3);
        return;
    }
    // Cưa Máy: chạm = chém mạnh 1 lần; giữ = rồ máy cưa thẳng
    if (w.id === 'CHAINSAW') {
        const hold = p.aHeldT || 0;
        if (hold < 0.35) { if (p.sawTapLock) return; p.sawTapLock = true; return _fireMelee11(p, w, ang, charge, mult * 3, isSuper, enemy); }
        p.sawRevT = NOW() + 0.25; p.st.haste = Math.max(p.st.haste, 0.25);
        const R = 140, m = (p.meleeMult || 1) * mult;
        hitLine(p, ang, R, 16, w.damage * 0.9 * m, { melee: true, knock: 15 });
        if (Math.random() < 0.5) slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: R, color: '#fb923c', width: 7, life: 0.08, maxLife: 0.08, swing: 1, line: true });
        if (Math.random() < 0.35) { AudioSys.playAt('smg', p.x, p.y, 0.55, 1600); AudioSys.playAt('swing', p.x, p.y, 0.4, 1600); }
        if (Math.random() < 0.3) spark(p.x + Math.cos(ang) * 40, p.y + Math.sin(ang) * 40, '#fbbf24', 3, 160);
        if (Math.random() < 0.1) reduceDurability(p, w, 1);
        return;
    }
    // Kiếm Ánh Sáng (Bậc Thầy): 3 đòn cường hoá, đòn cuối chém tròn, mỗi đòn có hư ảnh
    if (w.id === 'LIGHTSABER' && p.saberEmp && p.saberEmp.t > NOW()) {
        const E = p.saberEmp, last = E.left === 1, r0 = w.range;
        w.range = r0 * 1.3;
        try { _fireMelee11(p, w, ang, charge, mult * (E.left > 0 ? 1.4 : 1.15), isSuper, enemy); } finally { w.range = r0; }
        if (E.left > 0) E.left--;
        const R = r0 * 1.3 + p.radius;
        if (last) {
            [0, 1, 2, 3].forEach(i => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang + i * Math.PI / 2, range: R, color: saberColor(p), width: 10, life: 0.3, maxLife: 0.3, swing: 1, line: false }));
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius) dealDamage(e, w.damage * 1.6 * (p.meleeMult || 1), p.id, { melee: true, knock: 300, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
            floatText(p.x, p.y - 36, '🌀 XOÁY KIẾM!', saberColor(p), 15);
        }
        p.shotQueue.push({ t: 0.3, fn: () => { // hư ảnh chém lại 1 lần
            if (p.hp <= 0) return;
            slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: R, color: hexA(saberColor(p), 0.5), width: 8, life: 0.2, maxLife: 0.2, swing: 1, line: false });
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 1.1) dealDamage(e, w.damage * 0.65 * (p.meleeMult || 1), p.id, { melee: true, knock: 80 }); });
        } });
        return;
    }
    const r = _fireMelee11(p, w, ang, charge, mult, isSuper, enemy);
    if (w.id === 'AXE' && p.dualAxe > NOW()) p.cooldown *= 0.55; // Song Rìu: đánh nhanh
    return r;
};
// nhảy đập: lấy đà có cảnh báo vùng đáp
const _startLeap11 = startLeapSlam;
startLeapSlam = function (p, w, ang, o) {
    if (p.leapBypass) return _startLeap11(p, w, ang, o);
    const wind = o.wind !== undefined ? o.wind : (LEAP_WIND[w.id] || 1.0);
    const d = o.dist !== undefined ? o.dist : slamDistance(p, w, o.range);
    const tx = p.x + Math.cos(ang) * d, ty = p.y + Math.sin(ang) * d;
    const z = { type: 'slamWarn', x: tx, y: ty, r: o.r, t: wind + 0.5, maxT: wind + 0.5, owner: p.id, tick: 0 };
    zones.push(z);
    p.leapWind = { t: wind, wind, ang, o: { ...o, dist: d }, w, z };
    floatText(p.x, p.y - 34, 'LẤY ĐÀ…', o.color || '#fde68a', 13);
};
function releaseLeap(p) {
    const L = p.leapWind; p.leapWind = null;
    if (p.hp <= 0 || gameState !== 'PLAYING') { if (L.z) L.z.t = 0; return; }
    p.leapBypass = true;
    try { startTravel(p, p.x + Math.cos(L.ang) * L.o.dist, p.y + Math.sin(L.ang) * L.o.dist, 0.5, 'slam', L.o, 90); floatText(p.x, p.y - 34, L.w.id === 'GREATSWORD' ? 'PHÓNG THIÊN!' : 'NHẢY ĐẬP!', L.o.color || '#fde68a', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }
    finally { p.leapBypass = false; }
}
// Cung: bắn liên tên → lướt + vô hình; giữ thêm sau khi đầy → xuyên thủng
const _fireWeapon11 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const n0 = bullets.length, i0 = items.length;
    const pierceAll = w.id === 'BOW' && charge >= 0.98 && (p.bowOver || 0) >= 0.6;
    const r = _fireWeapon11(p, w, ang, charge, enemy);
    const mine = bullets.slice(n0).filter(b => b.owner === p.id);
    if (w.id === 'BOW') {
        if (charge < 0.35) { p.dashTime = 0.1; p.dashAngle = p.lastMoveIn > 0.3 ? p.moveDir : ang + Math.PI; p.st.invis = Math.max(p.st.invis, 0.35); invisAs(p, 'void'); }
        if (pierceAll) { mine.forEach(b => { b.ghostN = 99; b.pierce = true; b.size *= 2; b.damage *= 1.3; b.color = '#bef264'; }); floatText(p.x, p.y - 34, '🏹 XUYÊN THỦNG!', '#bef264', 15); p.bowOver = 0; }
        if (isMaster(p, 'gunMod')) { p.dashTime = Math.max(p.dashTime, 0.08); p.dashAngle = p.dashAngle !== undefined ? p.dashAngle : ang + Math.PI; }
    }
    if (isMaster(p, 'gunMod')) {
        if (w.id === 'FLAME' && NOW() > (p.flameTrailT || 0)) { p.flameTrailT = NOW() + 0.3; const d = w.range * 0.8; zones.push({ type: 'fire', x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d, r: 32, t: 1.5, maxT: 1.5, owner: p.id, tick: 0 }); }
        if (w.id === 'LAUNCHER') items.slice(i0).forEach(it => { if (it.ownerId === p.id && it.blast) it.blast = [it.blast[0], it.blast[1] * 1.25]; });
        if (w.id === 'ROCKET') mine.forEach(b => { if (b.explosive) b.homing = true; });
    }
    return r;
};

/* ============================== KỸ NĂNG CẬN CHIẾN THEO VŨ KHÍ (Bậc Thầy) ============================== */
const _meleeTechCast11 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p), m = (p.meleeMult || 1);
    switch (w.id) {
        case 'KATANA': {
            p.katN = (p.katN || 0) + 1; p.katBlockT = NOW() + 4;
            if (p.katN % 3 === 0) { // tuyệt kỹ: lướt xa, bất tử, đánh dấu
                const L = 380; p.dashTime = 0.28; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln, 0.4);
                const ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L, dx = ex - p.x, dy = ey - p.y;
                p.katMarks = p.katMarks || [];
                enemiesOf(p).forEach(e => {
                    const t = Math.max(0, Math.min(1, ((e.x - p.x) * dx + (e.y - p.y) * dy) / (dx * dx + dy * dy)));
                    if (dist(e.x, e.y, p.x + dx * t, p.y + dy * t) > 34 + e.radius) return;
                    const dmg = 95 * m; e.st.katMark = 2; p.katMarks.push({ id: e.id, at: NOW() + 2, dmg });
                    if (dmg >= e.hp) e.stun = Math.max(e.stun, 2); // đủ kết liễu: choáng trong 2 giây chờ
                });
                slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: L, color: '#7dd3fc', width: 12, life: 0.35, maxLife: 0.35, swing: 1, line: true });
                floatText(p.x, p.y - 38, '⚔ TUYỆT KỸ: ĐOẠN KIẾM!', '#7dd3fc', 17);
            } else {
                p.dashTime = 0.18; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln, 0.2);
                hitLine(p, a, 230, 26, 46 * m);
                slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 230, color: '#e0f2fe', width: 8, life: 0.25, maxLife: 0.25, swing: 1, line: true });
                floatText(p.x, p.y - 36, `⚔ NHẤT KIẾM ${p.katN % 3}/3`, '#e0f2fe', 15);
            }
            return;
        }
        case 'LIGHTSABER':
            p.dashTime = 0.18; p.dashAngle = a; p.st.shield = Math.max(p.st.shield, 40); p.st.shieldT = Math.max(p.st.shieldT, 6);
            p.saberEmp = { t: NOW() + 6, left: 3 };
            floatText(p.x, p.y - 36, '✨ KIẾM ÁNH SÁNG CƯỜNG HOÁ', saberColor(p), 15); AudioSys.playAt('rail', p.x, p.y, 0.3);
            return;
        case 'RAPIER': {
            p.rapN = (p.rapN || 0) + 1;
            if (p.rapN % 2 === 0) { // lần 2: lướt vẽ ngôi sao
                const cx = p.x + Math.cos(a) * 120, cy = p.y + Math.sin(a) * 120, R = 110, pts = [];
                for (let i = 0; i < 5; i++) { const t = -Math.PI / 2 + i * Math.PI * 2 / 5; pts.push({ x: cx + Math.cos(t) * R, y: cy + Math.sin(t) * R }); }
                p.star = { seq: [0, 2, 4, 1, 3, 0].map(i => pts[i]), i: 0, t: 0, cx, cy };
                p.st.invuln = Math.max(p.st.invuln, 1.0); p.st.root = Math.max(p.st.root || 0, 0.1);
                floatText(p.x, p.y - 38, '⭐ TINH KIẾM!', '#e0f2fe', 17);
            } else {
                const m0 = muzzle(p, w, a);
                const qi = spawnBullet(p, m0.x, m0.y, a, { speed: 28, damage: 50 * m, range: 480, color: '#e0f2fe', size: 6, pierce: true, trail: 60, bounces: 0 }); qi.fxQi = true;
                floatText(p.x, p.y - 36, `🗡 KIẾM KHÍ ${p.rapN % 2}/2`, '#e0f2fe', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
            }
            return;
        }
        case 'SPEAR': { // nhảy lên đâm xuống điểm chọn
            const d = Math.max(80, Math.min(300, p.skillDist || 250));
            startLeapSlam(p, w, a, { r: 90, dmg: 60 * m, stun: 0.5, knock: 320, range: 300, dist: d, color: '#fde68a', wind: 1.0 });
            return;
        }
        case 'AXE':
            p.dualAxe = NOW() + 5; floatText(p.x, p.y - 36, '🪓🪓 SONG RÌU!', '#fca5a5', 15); AudioSys.playAt('swing', p.x, p.y, 0.5);
            return;
        case 'GREATSWORD': {
            const hold = NOW() - ((p.skDownAt && p.skDownAt[p.castSlot]) || NOW());
            if (p.gsParry && p.gsParry.t > NOW()) { // tái kích hoạt: chém đáp trả
                const blocked = p.gsParry.blocked; p.gsParry = null;
                const R = 185, dmg = (50 + blocked * 1.0) * m;
                [-0.6, 0, 0.6].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: R, color: '#fb7185', width: 16, life: 0.3, maxLife: 0.3, swing: 1, line: false }));
                enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < R + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 1.2) { dealDamage(e, dmg, p.id, { melee: true, knock: 500, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.5); } });
                floatText(p.x, p.y - 38, `💢 PHẢN KÍCH ${Math.round(dmg)}`, '#fb7185', 17); addShake(10); hitStop(0.08);
                return;
            }
            if (hold >= 0.35) { // giữ rồi thả: nhảy lên chém xuống hất tung
                startLeapSlam(p, w, a, { r: 140, dmg: 72 * m, stun: 1.0, knock: 420, range: 260, dist: Math.max(80, Math.min(260, p.skillDist || 200)), color: '#fb7185', wind: 0.6 });
                return;
            }
            p.gsParry = { t: NOW() + 3, blocked: 0 };
            floatText(p.x, p.y - 36, '🛡 THẾ ĐỠ KIẾM', '#fb7185', 15); AudioSys.playAt('block', p.x, p.y, 0.5);
            return;
        }
        case 'CHAINSAW':
            p.st.rage = Math.max(p.st.rage, 3); p.st.haste = Math.max(p.st.haste, 3); p.sawRage = NOW() + 3; p.st.cleanseT = Math.max(p.st.cleanseT || 0, 3); cleanseNow(p);
            floatText(p.x, p.y - 36, '⚙ CUỒNG CƯA · MIỄN KHỐNG', '#f97316', 15);
            return;
        case 'ROUNDSHIELD': {
            if (w.out) { floatText(p.x, p.y - 30, 'Khiên đang bay', '#94a3b8', 12); return; }
            const n = items.length; throwSpinner(p, w, a, 1.2, 'chain');
            for (let i = n; i < items.length; i++) if (items[i].ownerId === p.id) { items[i].rsBuff = true; items[i].left += 1; }
            return;
        }
    }
    return _meleeTechCast11(p);
};
// Khiên Tròn: mỗi mục tiêu trúng → hồi máu, +25 giáp, tăng tốc
const _spinnerHit11 = spinnerHit;
spinnerHit = function (it, owner, e) {
    _spinnerHit11(it, owner, e);
    if (it.rsBuff && owner && owner.hp > 0) { owner.hp = Math.min(owner.maxHp, owner.hp + 10); owner.armor = Math.min(Math.max(150, owner.maxArmor), (owner.armor || 0) + 25); owner.st.haste = Math.max(owner.st.haste, 1.2); floatText(owner.x, owner.y - 30, '+10 ❤ +25 🛡', '#7dd3fc', 12); }
};
// ghi lại thời điểm bấm kỹ năng (để biết chạm hay giữ)
const _handleSkillButtons11 = handleSkillButtons;
handleSkillButtons = function (p, input, allowAct) {
    p.skDownAt = p.skDownAt || {}; p.skHeld = p.skHeld || {};
    ['s1', 's2', 's3'].forEach((k, i) => { const d = !!input[k]; if (d && !p.skHeld[i]) p.skDownAt[i] = NOW(); p.skHeld[i] = d; });
    return _handleSkillButtons11(p, input, allowAct);
};
const _castSkill11 = castSkill;
castSkill = function (p, slot, aimVec) { p.castSlot = slot; return _castSkill11(p, slot, aimVec); };

/* ============================== KỸ NĂNG SÚNG THEO VŨ KHÍ (Bậc Thầy) ============================== */
const fireballs = [];
const _gunModCast11 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p), m0 = muzzle(p, w, a);
    switch (w.id) {
        case 'REVOLVER': {
            p.deadEye = { t: NOW() + 0.8, ang: a, z: { type: 'deadeye', x: p.x, y: p.y, r: 600, t: 0.9, maxT: 0.9, owner: p.id, tick: 0, phase: Math.round(a * 1000) } };
            zones.push(p.deadEye.z); floatText(p.x, p.y - 36, '🤠 NHẮM…', '#fbbf24', 15); AudioSys.playAt('select', p.x, p.y, 0.4);
            return;
        }
        case 'DUAL': {
            const b = spawnBullet(p, m0.x, m0.y, a, { speed: 10, damage: 45, range: 520, color: '#a78bfa', size: 11, explosive: true, blastSmall: true, bounces: 0, trail: 30 });
            floatText(p.x, p.y - 36, '🔮 CẦU NĂNG LƯỢNG', '#a78bfa', 15); return;
        }
        case 'MINIGUN': p.gatSpin = { t: 2, tick: 0 }; floatText(p.x, p.y - 36, '🌪 XOAY NÒNG!', '#fb923c', 15); return;
        case 'BOW': {
            const d = Math.min(600, p.skillDist || 400), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
            zones.push({ type: 'arrowRain', x, y, r: 120, t: 1.6, maxT: 1.6, owner: p.id, tick: 0 });
            p.arrowRain = { x, y, lockAt: NOW() + 0.5, end: NOW() + 1.6, tick: 0 };
            floatText(p.x, p.y - 36, '🏹 MƯA TÊN', '#bef264', 15); return;
        }
        case 'RAILGUN':
            p.st.shield = Math.max(p.st.shield, 50); p.st.shieldT = Math.max(p.st.shieldT, 5);
            summon(p, 'rdrone', p.x - 20, p.y); summon(p, 'rdrone', p.x + 20, p.y);
            floatText(p.x, p.y - 36, '🛰 KHIÊN + DRONE TRINH SÁT', '#22d3ee', 14); return;
        case 'FLAME': {
            const b = spawnBullet(p, m0.x, m0.y, a, { speed: 12, damage: 30, range: 480, color: '#f97316', size: 12, bounces: 0, trail: 30, burn: true });
            fireballs.push({ b, owner: p.id }); floatText(p.x, p.y - 36, '☄ CẦU LỬA', '#f97316', 15); return;
        }
        case 'LAUNCHER':
            [-0.45, -0.15, 0.15, 0.45].forEach(o => items.push({ x: p.x, y: p.y, type: { id: 'GRENADE', color: '#84cc16' }, angle: 0, spin: 14, vx: Math.cos(a + o) * 900, vy: Math.sin(a + o) * 900, thrown: true, ownerId: p.id, fuse: 0.9, z: 0, vz: 300, blast: [55, 110] }));
            floatText(p.x, p.y - 36, '🧨 MƯA LỰU', '#84cc16', 15); return;
        case 'ROCKET':
            [-0.25, 0, 0.25].forEach(o => { const b = spawnBullet(p, m0.x, m0.y, a + o, { speed: 13, damage: 0, range: 900, color: '#ff7a1a', explosive: true, blastSmall: true, size: 5, bounces: 0 }); b.homing = true; });
            floatText(p.x, p.y - 36, '🚀 LOẠT TÊN LỬA', '#ff7a1a', 15); return;
        case 'TESLA':
            p.teslaCage = { t: NOW() + 3, tick: 0 }; zones.push({ type: 'teslaCage', x: p.x, y: p.y, r: 150, t: 3, maxT: 3, owner: p.id, tick: 0 });
            floatText(p.x, p.y - 36, '⚡ LỒNG ĐIỆN', '#60a5fa', 15); return;
        case 'ENERGY': {
            const L = 620, ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L;
            [-4, 0, 4].forEach(k => beams.push({ x1: m0.x - Math.sin(a) * k, y1: m0.y + Math.cos(a) * k, x2: ex - Math.sin(a) * k, y2: ey + Math.cos(a) * k, life: 0.3, maxLife: 0.3, color: '#a78bfa' }));
            hitLine(p, a, L, 20, 50, { knock: 260 });
            floatText(p.x, p.y - 36, '🔆 TIA HỘI TỤ', '#a78bfa', 15); AudioSys.playAt('rail', p.x, p.y, 0.5); return;
        }
        case 'NET':
            [-0.3, 0, 0.3].forEach(o => spawnBullet(p, m0.x, m0.y, a + o, { speed: 13, damage: 8, range: 480, size: 9, color: '#e5e7eb', net: true, root: 1.3, slow: 1.5, bounces: 0, trail: 10 }));
            floatText(p.x, p.y - 36, '🕸 LƯỚI BA', '#e5e7eb', 15); return;
        case 'BOOMERANG':
            [-0.4, 0, 0.4].forEach(o => { const b = spawnBullet(p, m0.x, m0.y, a + o, { speed: 16, damage: (w.damage || 26) * 1.2, range: 99999, size: 7, color: '#f59e0b', bounces: 0, trail: 1 }); b.boomerang = true; b.outDist = 380; b.travel = 0; b.hitOut = false; b.hitBack = false; b.life = 6; });
            floatText(p.x, p.y - 36, '🪃 BÃO BOOMERANG', '#f59e0b', 15); return;
    }
    return _gunModCast11(p);
};

/* ============================== NỘI TẠI MỚI (Bậc Thầy) ============================== */
const _effMag11 = effMag;
effMag = function (p, w) { const m = _effMag11(p, w); return p && has(p, 'gunMod') && w && w.id === 'DUAL' ? Math.round(m * 1.5) : m; };
const _makeWeapon11 = makeWeapon;
makeWeapon = function (id, p) { const w = _makeWeapon11(id, p); if (p && has(p, 'gunMod') && w.id === 'RAILGUN') w.chargeTime = (w.chargeTime || 0.9) * 0.7; return w; };
const _spawnBullet11 = spawnBullet;
spawnBullet = function (p, x, y, ang, o) {
    const b = _spawnBullet11(p, x, y, ang, o);
    if (p && p.st && has(p, 'gunMod')) {
        if (b.wid === 'SNIPER') b.trail = 0; // không để lại đường đạn
        if (b.wid === 'MINIGUN') b.life *= 1.3;
        if (b.wid === 'FLAME') b.life *= 1.3;
        if (b.wid === 'NET') b.root = (b.root || 0) + 0.5;
        if (b.wid === 'BOW') b.critC = (b.critC || 0) + 0.15;
    }
    return b;
};
const _dealDamage11 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (target && target.st && target.hp > 0) {
        // Đại Đao: thế đỡ kiếm chặn mọi thứ phía trước (cả nổ), phản đạn, choáng kẻ chém
        const G = target.gsParry;
        if (G && G.t > NOW() && !opts.zone && holdingId(target, 'GREATSWORD') && (!atk || atk === target || Math.abs(angleDiff(Math.atan2(atk.y - target.y, atk.x - target.x), target.angle)) < 1.7 || opts.blast)) {
            G.blocked += dmg; spark(target.x + Math.cos(target.angle) * 18, target.y + Math.sin(target.angle) * 18, '#fecdd3', 6, 200);
            if (atk && atk !== target && opts.melee) { atk.stun = Math.max(atk.stun, 1); floatText(atk.x, atk.y - 30, 'BỊ ĐỠ!', '#fb7185', 13); }
            if (atk && atk !== target && opts.bullet) { const a = Math.atan2(atk.y - target.y, atk.x - target.x); bullets.push({ x: target.x + Math.cos(a) * 24, y: target.y + Math.sin(a) * 24, px: target.x, py: target.y, angle: a, speed: 22, damage: dmg, life: 1, owner: target.id, color: '#fb7185', size: 3, knock: 80, bounces: 0, trail: 20 }); }
            return;
        }
        if (target.sawRevT > NOW()) dmg *= 0.7;           // Cưa Máy rồ máy
        if (target.sawRage > NOW()) dmg *= 0.7;           // Cuồng Cưa
        if (target.gsDrag) dmg *= 0.6;                     // Đại Đao kéo lê
        if (has(target, 'meleeTech') && holdingId(target, 'GREATSWORD')) dmg *= 0.9; // nội tại Đại Đao
    }
    let after = null;
    if (atk && atk !== target && target && target.st && target.hp > 0 && !opts.zone) {
        const w = getCurrentWeapon(atk);
        if (opts.melee && has(atk, 'meleeTech')) {
            if (w.id === 'GREATSWORD') after = d => { atk.hp = Math.min(atk.maxHp, atk.hp + d * 0.15); };
            if (w.id === 'AXE' && atk.dualAxe > NOW() && !target.pyro) { target.st.burn = Math.max(target.st.burn || 0, 2); target.st.burnBy = atk.id; }
            if (w.id === 'CHAINSAW') after = d => { const heal = d * 0.15, over = atk.hp + heal - atk.maxHp; if (over > 0) { atk.st.shield = Math.min(60, (atk.st.shield || 0) + over); atk.st.shieldT = Math.max(atk.st.shieldT, 3); } };
        }
        if (opts.bullet && has(atk, 'gunMod')) {
            const id = opts.bullet.wid;
            if (id === 'SNIPER') target.st.slow = Math.max(target.st.slow || 0, 1.5);
            if (id === 'RAILGUN') after = () => { atk.st.shield = Math.min(80, (atk.st.shield || 0) + 20); atk.st.shieldT = Math.max(atk.st.shieldT, 3); };
            if (id === 'ENERGY') { dmg *= 1.2; atk.st.shield = Math.min(60, (atk.st.shield || 0) + 5); atk.st.shieldT = Math.max(atk.st.shieldT, 3); }
            if (id === 'BOOMERANG') dmg *= 1.25;
            if (id === 'BOW') { atk.critDmgM = (atk.critDmgM || 1.6) + 0.4; const prev = after; after = d => { atk.critDmgM -= 0.4; if (prev) prev(d); }; }
        }
        if (!opts.bullet && !opts.melee && has(atk, 'gunMod') && w.id === 'TESLA') { dmg *= 1.2; target.st.slow = Math.max(target.st.slow || 0, 0.5); }
    }
    const hp0 = target ? target.hp : 0;
    try { return _dealDamage11(target, dmg, attackerId, opts); }
    finally { if (after) after(Math.max(0, hp0 - Math.max(0, target.hp))); }
};

/* ============================== CẬP NHẬT MỖI KHUNG HÌNH ============================== */
function updateWeaponKit(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) { p.gsWind = null; p.leapWind = null; return; }
        const w = getCurrentWeapon(p);
        if (!p.aiming && !(p.aHeldT > 0)) p.sawTapLock = false;
        // Đại Đao: chém sau cảnh báo
        if (p.gsWind) {
            const G = p.gsWind; G.t -= dt; G.z.x = p.x; G.z.y = p.y; G.z.phase = Math.round(G.ang * 1000);
            p.st.slow = Math.max(p.st.slow || 0, 0.1);
            if (w.id !== 'GREATSWORD' || p.stun > 0) { G.z.t = 0; p.gsWind = null; }
            else if (G.t <= 0) { p.gsWind = null; G.z.t = 0; const r0 = w.range; w.range = r0 * 1.2; p.gsBypass = true; try { _fireMelee11(p, w, G.ang, 0, G.mult, G.isSuper); } finally { p.gsBypass = false; w.range = r0; } addShake(6); }
        }
        // nhảy đập: lấy đà
        if (p.leapWind) {
            const L = p.leapWind; L.t -= dt; p.st.root = Math.max(p.st.root || 0, 0.1);
            const k = 1 - Math.max(0, L.t) / (L.wind || 1);
            if (k >= 0.5) { // nửa sau: đã bay lên trời — không bị đánh trúng, không bị khống chế
                if (!L.up) { L.up = true; smoke(p.x, p.y, 6, 'rgba(220,220,235,0.4)', 16); ring(p.x, p.y, 6, 50, '#e2e8f0', 0.3, 3); AudioSys.playAt('whoosh', p.x, p.y, 0.4); }
                p.st.invuln = Math.max(p.st.invuln, 0.1); p.stun = 0; p.air = Math.max(p.air || 0, 0.05); p.airH = (k - 0.5) * 2 * 45;
                if (Math.random() < 0.4) particles.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y + 10, vx: 0, vy: 40, life: 0.3, maxLife: 0.3, color: 'rgba(226,232,240,0.5)', size: 4 });
            } else if (p.stun > 0) { L.z.t = 0; p.leapWind = null; }
            if (p.leapWind && L.t <= 0) releaseLeap(p);
        }
        // Cung: giữ thêm sau khi đầy lực
        if (w.id === 'BOW' && p.aiming && (p.charge || 0) >= 1) { const b0 = p.bowOver || 0; p.bowOver = b0 + dt; if (b0 < 0.6 && p.bowOver >= 0.6) { floatText(p.x, p.y - 34, 'MŨI TÊN XUYÊN THỦNG SẴN SÀNG', '#bef264', 12); AudioSys.playAt('select', p.x, p.y, 0.3); } }
        else if (!p.aiming) p.bowOver = 0;
        // Katana: chém vỡ đạn (25%, sau kỹ năng 75%)
        if (has(p, 'meleeTech') && w.id === 'KATANA') {
            const ch = p.katBlockT > NOW() ? 0.75 : 0.25;
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i]; if (!b) continue;
                if (b.owner === p.id || b.katRolled || b.explosive || sameTeamId(p.id, b.owner) || dist(b.x, b.y, p.x, p.y) > p.radius + 60) continue;
                if (Math.abs(angleDiff(Math.atan2(p.y - b.y, p.x - b.x), b.angle)) > 0.6) continue; // không bay về phía mình
                b.katRolled = true;
                if (Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) < 1.7 && Math.random() < ch) { bullets.splice(i, 1); spark(b.x, b.y, '#7dd3fc', 6, 220); if (Math.random() < 0.4) floatText(p.x, p.y - 30, 'CHÉM ĐẠN!', '#7dd3fc', 12); }
            }
        }
        // Katana: dấu kiếm phát nổ sau 2 giây
        if (p.katMarks && p.katMarks.length) p.katMarks = p.katMarks.filter(k => {
            if (NOW() < k.at) return true;
            const e = players.find(q => q.id === k.id); if (e && e.hp > 0) { e.st.katMark = 0; slashes.push({ x: e.x, y: e.y, ownerId: p.id, angle: Math.random() * 6.28, range: 40, color: '#7dd3fc', width: 10, life: 0.25, maxLife: 0.25, swing: 1, line: true }); dealDamage(e, k.dmg, p.id, { melee: true, knock: 120 }); }
            return false;
        });
        // Kiếm Ánh Sáng cường hoá: chém đạn quanh mình, chạy nhanh, hư ảnh
        if (p.saberEmp) {
            if (p.saberEmp.t <= NOW() || w.id !== 'LIGHTSABER') p.saberEmp = null;
            else {
                p.st.haste = Math.max(p.st.haste, 0.1);
                for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && !sameTeamId(p.id, b.owner) && dist(b.x, b.y, p.x, p.y) < p.radius + 55) { bullets.splice(i, 1); spark(b.x, b.y, saberColor(p), 4, 180); } }
                if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: hexA(saberColor(p), 0.35), size: p.radius, glow: true });
            }
        }
        // Kiếm Liễu: lướt vẽ ngôi sao
        if (p.star) {
            const S = p.star; S.t -= dt; p.st.invuln = Math.max(p.st.invuln, 0.1);
            if (S.t <= 0 && S.i < S.seq.length) {
                const to = S.seq[S.i], fx = p.x, fy = p.y; S.t = 0.09; S.i++;
                p.x = Math.max(p.radius, Math.min(MAP_W - p.radius, to.x)); p.y = Math.max(p.radius, Math.min(MAP_H - p.radius, to.y));
                beams.push({ x1: fx, y1: fy, x2: p.x, y2: p.y, life: 0.6, maxLife: 0.6, color: '#e0f2fe' });
                const dx = p.x - fx, dy = p.y - fy, L2 = dx * dx + dy * dy || 1;
                enemiesOf(p).forEach(e => { const t = Math.max(0, Math.min(1, ((e.x - fx) * dx + (e.y - fy) * dy) / L2)); if (dist(e.x, e.y, fx + dx * t, fy + dy * t) < 45 + e.radius) dealDamage(e, 30 * (p.meleeMult || 1), p.id, { melee: true, knock: 60 }); });
                AudioSys.playAt('swing', p.x, p.y, 0.4);
            } else if (S.i >= S.seq.length && S.t <= 0) { // phát kết liễu
                p.star = null; ring(S.cx, S.cy, 12, 120, '#e0f2fe', 0.5, 8); addShake(10);
                enemiesOf(p).forEach(e => { if (dist(e.x, e.y, S.cx, S.cy) < 120 + e.radius) dealDamage(e, 85 * (p.meleeMult || 1), p.id, { melee: true, knock: 400, angle: Math.atan2(e.y - S.cy, e.x - S.cx) }); });
                floatText(S.cx, S.cy - 30, '⭐ KẾT LIỄU!', '#e0f2fe', 18);
            }
        }
        // Đại Đao: thế đỡ giữ kỹ năng sẵn sàng để tái kích hoạt; giữ nút = kéo lê
        const gsSlot = (p.skills || []).findIndex(s => s.id === 'meleeTech');
        if (gsSlot >= 0) {
            const s = p.skills[gsSlot];
            if (p.gsParry) { if (p.gsParry.t > NOW() && w.id === 'GREATSWORD') s.cd = 0; else { p.gsParry = null; s.cd = skillCooldown(p, 'meleeTech'); } }
            const held = p.skHeld && p.skHeld[gsSlot] && w.id === 'GREATSWORD' && !p.gsParry && s.cd <= 0, ht = held ? NOW() - p.skDownAt[gsSlot] : 0;
            p.gsDrag = held && ht >= 0.35;
            if (p.gsDrag) { p.st.haste = Math.max(p.st.haste, 0.15); if (Math.random() < 0.4) spark(p.x - Math.cos(p.angle) * 20, p.y - Math.sin(p.angle) * 20, '#fca5a5', 2, 80); if (ht >= 3) { p.skHeld[gsSlot] = false; p.gsDrag = false; castSkill(p, gsSlot, null); } }
        }
        // Ổ Quay: nhắm rồi tự bắn hết mục tiêu trong vùng
        if (p.deadEye) {
            const D = p.deadEye; D.z.x = p.x; D.z.y = p.y;
            if (NOW() >= D.t) {
                p.deadEye = null; let n = 0;
                enemiesOf(p).forEach(e => {
                    if (dist(p.x, p.y, e.x, e.y) > 600 || Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), D.ang)) > 0.55 || !lineOfSight(p.x, p.y, e.x, e.y)) return;
                    const a = Math.atan2(e.y - p.y, e.x - p.x); p.shotQueue.push({ t: n * 0.12, fn: () => { if (p.hp <= 0) return; const b = spawnBullet(p, p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20, a, { speed: 30, damage: 38, range: 640, color: '#fbbf24', size: 3.5, knock: 140, trail: 50 }); b.critC = 1; AudioSys.playAt('shoot_heavy', p.x, p.y, 0.35); } }); n++;
                });
                floatText(p.x, p.y - 36, n ? `🤠 BẮN ${n} MỤC TIÊU!` : 'Không có mục tiêu', '#fbbf24', 15);
            }
        }
        // Gatling xoay nòng
        if (p.gatSpin) {
            const G = p.gatSpin; G.t -= dt; G.tick -= dt; p.angle += 4 * dt;
            if (G.tick <= 0) { G.tick = 0.03; [0, 2.094, 4.189].forEach(o => { const aa = p.angle + o; spawnBullet(p, p.x + Math.cos(aa) * 20, p.y + Math.sin(aa) * 20, aa, { speed: 24, damage: 6, range: 520, color: '#fdba74', size: 2.4, trail: 20 }); }); if (Math.random() < 0.3) AudioSys.playAt('smg', p.x, p.y, 0.15); }
            if (G.t <= 0) p.gatSpin = null;
        }
        // Mưa tên: khoá vị trí sau 0.5 giây rồi trút tên
        if (p.arrowRain) {
            const A = p.arrowRain;
            if (NOW() >= A.lockAt) {
                A.tick -= dt;
                if (A.tick <= 0) {
                    A.tick = 0.12;
                    for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, r = Math.random() * 120; particles.push({ x: A.x + Math.cos(a) * r, y: A.y + Math.sin(a) * r - 40, vx: 0, vy: 300, life: 0.15, maxLife: 0.15, color: '#bef264', size: 2, glow: true }); }
                    enemiesOf(p).forEach(e => { if (dist(e.x, e.y, A.x, A.y) < 120 + e.radius) dealDamage(e, 9, p.id, { angle: Math.PI / 2, knock: 20, noCharge: true }); });
                }
            }
            if (NOW() >= A.end) p.arrowRain = null;
        }
        // Lồng điện Tesla
        if (p.teslaCage) {
            const T = p.teslaCage; T.tick -= dt;
            const z = zones.find(q => q.type === 'teslaCage' && q.owner === p.id); if (z) { z.x = p.x; z.y = p.y; }
            if (T.tick <= 0) { T.tick = 0.25; enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 150 + e.radius) { dealDamage(e, 6, p.id, { knock: 0, noCharge: true }); e.st.slow = Math.max(e.st.slow || 0, 0.4); beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.1, maxLife: 0.1, color: '#93c5fd', zig: 1 }); } }); }
            if (T.t <= NOW()) p.teslaCage = null;
        }
    });
    // tên lửa tự dẫn (Bậc Thầy Pháo)
    bullets.forEach(b => {
        if (!b.homing) return;
        const o = players.find(q => q.id === b.owner); if (!o) return;
        const e = enemiesOf(o).filter(q => targetable(o, q)).sort((u, v) => dist(b.x, b.y, u.x, u.y) - dist(b.x, b.y, v.x, v.y))[0];
        if (e) { const d = angleDiff(Math.atan2(e.y - b.y, e.x - b.x), b.angle); b.angle += Math.max(-2 * dt, Math.min(2 * dt, d)); }
    });
    // cầu lửa: nổ thành vùng lửa
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const F = fireballs[i]; if (!F) continue;
        if (bullets.includes(F.b)) { F.x = F.b.x; F.y = F.b.y; if (Math.random() < 0.8) particles.push({ x: F.b.x, y: F.b.y, vx: 0, vy: -30, life: 0.35, maxLife: 0.35, color: Math.random() < 0.5 ? '#f97316' : '#facc15', size: 7, glow: true }); continue; }
        fireballs.splice(i, 1);
        const x = F.x !== undefined ? F.x : F.b.x, y = F.y !== undefined ? F.y : F.b.y;
        explosionFx(x, y, 70); zones.push({ type: 'fire', x, y, r: 85, t: 3, maxT: 3, owner: F.owner, tick: 0 });
    }
}
const _upe11 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe11(dt); updateWeaponKit(dt); };
const _applyBuild11 = applyBuild;
applyBuild = function (p) { _applyBuild11(p); Object.assign(p, { gsWind: null, leapWind: null, saberEmp: null, star: null, gsParry: null, gsDrag: false, deadEye: null, gatSpin: null, arrowRain: null, teslaCage: null, katMarks: [], dualAxe: 0, sawRage: 0, sawRevT: 0, bowOver: 0 }); };

/* ============================== MÔ TẢ THẺ ============================== */
Object.assign(MELEE_P, {
    KATANA: 'Hút 10% sát thương; 25% chém vỡ đạn bay tới từ phía trước (sau kỹ năng: 75% trong 4 giây).',
    LIGHTSABER: 'Mỗi đòn trúng giảm 1 giây hồi chiêu; dùng kỹ năng nhận khiên năng lượng 40.',
    GREATSWORD: '+15% sát thương, +15% hút máu, nhận ít hơn 10% sát thương.',
    CHAINSAW: 'Hút 15% sát thương; máu đầy thì phần dư thành khiên.'
});
CARDS.meleeTech.desc = '<b>Dùng được khi cầm vũ khí cận chiến hoặc tay không.</b> Nội tại & kỹ năng đổi theo vũ khí:<br>'
    + '<b>Katana</b>: P chém vỡ đạn 25% · S lướt chém, lần 3 lướt xa bất tử đánh dấu mọi kẻ trên đường, 2 giây sau nổ sát thương (đủ kết liễu thì choáng trong lúc chờ).<br>'
    + '<b>Kiếm Ánh Sáng</b>: S lướt + khiên, 6 giây cường hoá: 3 đòn mạnh & dài, đòn 3 chém tròn, chém bay mọi đạn, chạy nhanh, mỗi đòn có hư ảnh chém thêm.<br>'
    + '<b>Kiếm Liễu</b>: S kiếm khí bay thẳng; lần thứ 2 lướt vẽ ngôi sao rồi kết liễu.<br>'
    + '<b>Giáo</b>: S nhảy lên đâm xuống điểm chọn. <b>Rìu</b>: S Song Rìu 5 giây (đánh nhanh, gây cháy).<br>'
    + '<b>Đại Đao</b>: P hút máu & giảm sát thương · S chạm = thế đỡ 3 giây (chặn cả nổ, phản đạn, choáng kẻ chém), chạm lại = chém đáp trả theo lượng đã đỡ · giữ = kéo lê kiếm (nhanh, giảm sát thương), thả = nhảy chém hất tung.<br>'
    + '<b>Cưa Máy</b>: S Cuồng Cưa (cuồng nộ, tăng tốc, giảm sát thương, miễn khống). <b>Khiên Tròn</b>: S ném khiên, mỗi mục tiêu trúng hồi máu +25 giáp + tăng tốc.<br>'
    + 'Dao, Song Đao, Búa, Khiên, tay không: như cũ (lướt nhỏ, Ám Sát, Địa Chấn, Phản Đòn, Đấm Ngàn Cân).';
CARDS.gunMod.desc = '<b>Dùng được khi cầm súng.</b> Nội tại & kỹ năng đổi theo súng:<br>'
    + '<b>Ổ Quay</b>: S mở vùng ngắm, 0.8 giây sau tự bắn mọi mục tiêu trong vùng (chí mạng). <b>Song Súng</b>: P băng đạn +50% · S cầu năng lượng.<br>'
    + '<b>Gatling</b>: P đạn bay xa hơn · S xoay nòng bắn 360°. <b>Bắn tỉa</b>: P làm chậm, không để lại đường đạn · S ống ngắm nhiệt.<br>'
    + '<b>Cung</b>: P bắn xong lướt nhẹ, +15% chí mạng, chí mạng mạnh hơn · S mưa tên (khoá vị trí sau 0.5 giây).<br>'
    + '<b>Railgun</b>: P tụ lực nhanh hơn, bắn trúng được khiên · S khiên + 2 drone trinh sát làm chậm địch.<br>'
    + '<b>Phun Lửa</b>: P phun xa hơn, để lại vệt lửa · S cầu lửa. <b>Phóng Lựu</b>: P nổ rộng · S mưa lựu. <b>Pháo</b>: P tên lửa tự dẫn · S loạt 3 tên lửa.<br>'
    + '<b>Súng Điện</b>: P mạnh & làm chậm · S lồng điện. <b>Súng Năng Lượng</b>: P trúng được khiên · S tia hội tụ. <b>Súng Lưới</b>: P trói lâu · S lưới ba. <b>Boomerang</b>: P +25% · S bão boomerang.<br>'
    + 'Súng lục, AR, SMG, Shotgun: như cũ.';

/* ============================== VẼ ============================== */
const _drawNetZones11 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones11(now);
    zones.forEach(z => {
        const k = 1 - Math.max(0, z.t) / (z.maxT || 1);
        if (z.type === 'meleeWarn') {
            const a = (z.phase || 0) / 1000;
            ctx.save(); ctx.fillStyle = `rgba(251,113,133,${0.12 + k * 0.25})`; ctx.strokeStyle = 'rgba(251,113,133,0.9)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, z.r, a - 1.2, a + 1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'rgba(251,113,133,0.35)'; ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, z.r * k, a - 1.2, a + 1.2); ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (z.type === 'slamWarn') {
            ctx.save(); ctx.strokeStyle = `rgba(252,165,165,${0.5 + Math.sin(now * 16) * 0.3})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = `rgba(239,68,68,${0.1 + k * 0.25})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * Math.min(1, k * 1.3), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (z.type === 'deadeye') {
            const a = (z.phase || 0) / 1000;
            ctx.save(); ctx.fillStyle = `rgba(251,191,36,${0.08 + k * 0.12})`; ctx.strokeStyle = 'rgba(251,191,36,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([10, 6]);
            ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, z.r, a - 0.55, a + 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        } else if (z.type === 'arrowRain') {
            ctx.save(); ctx.strokeStyle = 'rgba(190,242,100,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -now * 40;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(190,242,100,0.12)'; ctx.fill(); ctx.font = `16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏹', z.x, z.y); ctx.restore();
        } else if (z.type === 'teslaCage') {
            ctx.save(); ctx.strokeStyle = `rgba(147,197,253,${0.5 + Math.sin(now * 20) * 0.3})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(96,165,250,0.08)'; ctx.fill(); ctx.restore();
            if (Math.random() < 0.4) beams.push({ x1: z.x, y1: z.y, x2: z.x + (Math.random() - 0.5) * z.r * 2, y2: z.y + (Math.random() - 0.5) * z.r * 2, life: 0.08, maxLife: 0.08, color: '#bfdbfe', zig: 1 });
        }
    });
};
const _drawPlayerExtras11 = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras11(p, w, now);
    const st = p.st || {};
    if (st.katMark > 0) { ctx.save(); ctx.font = `16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('⚔', p.x, p.y - p.radius - 30); ctx.strokeStyle = 'rgba(125,211,252,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6 + Math.sin(now * 12) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (w.id === 'BOW' && p.aiming && (p.bowOver || 0) >= 0.6) { ctx.save(); ctx.strokeStyle = `rgba(190,242,100,${0.6 + Math.sin(now * 18) * 0.3})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
};
