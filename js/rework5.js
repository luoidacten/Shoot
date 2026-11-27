/** ==================== KATANA · TAM KHÚC CÔN · RÌU PHÁO · ĐA KHÍ CỤ (báo trước dạng kế) ====================
 *  Nạp sau rework4.js.
 */
const W9 = [];
const k5M = p => p.meleeMult || 1;
function k5Lift(p, e, a, T = 0.75) { // hất tung
    if (!e || e.hp <= 0 || e.air > 0) return;
    const s = umbFreeSpot(e, e.x + Math.cos(a) * 25, e.y + Math.sin(a) * 25);
    startTravel(e, s.x, s.y, T, null, null, 75); e.stun = Math.max(e.stun, T);
    W9.push({ kind: 'lift', owner: p.id, x: e.x, y: e.y, t: 0.45, T: 0.45 });
    floatText(e.x, e.y - 50, '⤴ HẤT TUNG', '#7dd3fc', 12);
}

/* ============================== KATANA ============================== */
WEAPONS.KATANA.desc = 'Chạm: chém trái → chém phải → CHÉM DỌC hất tung. Giữ rồi thả: LƯỚT TRẢM về trước; lướt lần 2 (trong 1.6 giây) hất tung mọi kẻ trên đường. Bậc Thầy: đâm (trúng giảm 90% hồi chiêu), trúng 2 lần thì lần kế chém ra LỐC KIẾM hút tung. Kỹ Thuật Cao: Bạt Đao — nếu quanh bạn có kẻ đang choáng/bị hất tung thì THIỂM ẢNH NGŨ TRẢM.';
function katFire(p, w, ang, charge, mult) {
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const D = w.damage * k5M(p) * mult;
    if (charge >= 0.9) { // lướt trảm
        const second = p.katDashT > world.time; p.katDashT = second ? 0 : world.time + 1.6;
        p.cooldown = 24 * p.fireRateMult;
        const L = Math.max(50, rayFree(p.x, p.y, ang, 200).d - p.radius), ax = p.x, ay = p.y, bx = ax + Math.cos(ang) * L, by = ay + Math.sin(ang) * L;
        startTravel(p, bx, by, 0.15, null, null, 4); p.st.invuln = Math.max(p.st.invuln || 0, 0.18);
        afterImages(p, ax, ay, bx, by, 5, '#7dd3fc'); USK.push({ kind: 'katLine', x1: ax, y1: ay, x2: bx, y2: by, t: 0.4, maxT: 0.4 });
        const hit = enemiesOf(p).filter(e => !(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 36);
        hit.forEach(e => { dealDamage(e, D * (second ? 1.15 : 0.9), p.id, { melee: true, knock: second ? 1 : 160, angle: ang }); p.stats.hits++; if (second) k5Lift(p, e, ang); });
        floatText(p.x, p.y - 44, second ? '⚔ LƯỚT 2 · HẤT TUNG!' : '⚔ LƯỚT TRẢM', '#7dd3fc', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.05); addShake(4); }
        return;
    }
    if (world.time - (p.katLast || -9) > 1.2) p.katCN = 0; p.katLast = world.time;
    const n = (p.katCN = ((p.katCN || 0) % 3) + 1);
    let hit;
    if (n < 3) { // chém trái / chém phải
        p.cooldown = w.fireRate * p.fireRateMult * 0.75; p.kx += Math.cos(ang) * 90; p.ky += Math.sin(ang) * 90;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 92 + p.radius, color: '#7dd3fc', width: 10, life: 0.2, maxLife: 0.2, swing: n === 1 ? -1 : 1, line: false, arc: 1.1 });
        hit = arcFoes(p, ang, 92, 1.1); hit.forEach(e => { dealDamage(e, D, p.id, { melee: true, knock: 180, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++; });
        AudioSys.playAt('swing', p.x, p.y, 0.5);
    } else { // chém dọc: hất tung
        p.cooldown = 36 * p.fireRateMult;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 108 + p.radius, color: '#e0f2fe', width: 14, life: 0.22, maxLife: 0.22, swing: 1, line: false, arc: 0.3 });
        W9.push({ kind: 'vcut', owner: p.id, a: ang, t: 0.35, T: 0.35 });
        hit = arcFoes(p, ang, 108, 0.5); hit.forEach(e => { dealDamage(e, D * 1.3, p.id, { melee: true, knock: 1 }); k5Lift(p, e, ang); p.stats.hits++; });
        AudioSys.playAt('swing', p.x, p.y, 0.7);
    }
    if (hit.length) { reduceDurability(p, w, 1); hitStop(n === 3 ? 0.07 : 0.04); addShake(n === 3 ? 5 : 3); }
}
// BẬC THẦY: đâm kiếm → trúng giảm 90% hồi chiêu; trúng đủ 2 lần → lần kế là LỐC KIẾM
function katMaster(p) {
    const a = aimDir(p);
    if ((p.katStabHits || 0) >= 2) {
        p.katStabHits = 0;
        W9.push({ kind: 'tornado', owner: p.id, x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, a, d: 0, max: 540, hit: new Set(), t: 3, T: 3 });
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 120 + p.radius, color: '#e0f2fe', width: 16, life: 0.25, maxLife: 0.25, swing: 1, line: false, arc: 1.3 });
        floatText(p.x, p.y - 46, '🌪 LỐC KIẾM!', '#e0f2fe', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.8); addShake(6); return;
    }
    p.dashTime = 0.1; p.dashAngle = a;
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 210, color: '#bae6fd', width: 8, life: 0.2, maxLife: 0.2, swing: 1, line: true });
    const hit = lineFoes(p, a, 210, 18);
    hit.forEach(e => { dealDamage(e, 40 * k5M(p), p.id, { melee: true, knock: 220, angle: a }); spark(e.x, e.y, '#e0f2fe', 8, 220); });
    if (hit.length) { p.katStabHits = (p.katStabHits || 0) + 1; p.katCdCut = true; hitStop(0.05); floatText(p.x, p.y - 46, p.katStabHits >= 2 ? '⚔ ĐÂM TRÚNG 2/2 → LỐC KIẾM' : '⚔ ĐÂM TRÚNG 1/2', '#bae6fd', 14); }
    AudioSys.playAt('swing', p.x, p.y, 0.55);
}
// KỸ THUẬT CAO: trong lúc thủ thế, có kẻ choáng / bị hất tung gần → THIỂM ẢNH NGŨ TRẢM
const _updKatHTR5 = updateKatanaHT;
updateKatanaHT = function (p, dt) {
    if (p.katHT) {
        const e = enemiesOf(p).filter(q => q.hp > 0 && (q.stun > 0 || q.air > 0) && dist(q.x, q.y, p.x, p.y) < 300).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0];
        if (e) { p.katHT = null; return katShadow(p, e); }
    }
    return _updKatHTR5(p, dt);
};
function katShadow(p, e) {
    const a = Math.atan2(e.y - p.y, e.x - p.x), s = umbFreeSpot(p, e.x + Math.cos(a) * (e.radius + p.radius + 12), e.y + Math.sin(a) * (e.radius + p.radius + 12));
    afterImages(p, p.x, p.y, s.x, s.y, 6, '#7dd3fc'); startTravel(p, s.x, s.y, 0.1, null, null, 4);
    p.st.invuln = Math.max(p.st.invuln || 0, 1); p.st.root = Math.max(p.st.root || 0, 0.8); e.stun = Math.max(e.stun, 1);
    floatText(p.x, p.y - 50, '⚔ THIỂM ẢNH NGŨ TRẢM', '#e0f2fe', 16);
    for (let k = 0; k < 5; k++) p.shotQueue.push({ t: 0.14 + k * 0.09, fn: () => {
        if (e.hp <= 0) return; const ca = k * Math.PI * 2 / 5 + a;
        W9.push({ kind: 'shadow', owner: p.id, tid: e.id, x: e.x + Math.cos(ca) * 46, y: e.y + Math.sin(ca) * 46, a: ca + Math.PI, t: 0.35, T: 0.35 });
        dealDamage(e, 14 * k5M(p), p.id, { melee: true, knock: 1 }); spark(e.x, e.y, '#bae6fd', 6, 200); AudioSys.playAt('swing', e.x, e.y, 0.35);
    } });
    p.shotQueue.push({ t: 0.72, fn: () => {
        if (p.hp <= 0) return;
        p.angle = Math.atan2(e.y - p.y, e.x - p.x);
        if (e.hp > 0) { dealDamage(e, 85 * k5M(p), p.id, { melee: true, knock: 300, angle: p.angle }); USK.push({ kind: 'xcut', x: e.x, y: e.y, a: p.angle, t: 0.5, maxT: 0.5 }); }
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: p.angle, range: 120 + p.radius, color: '#e0f2fe', width: 16, life: 0.25, maxLife: 0.25, swing: 1, line: false, arc: 1.2 });
        p.st.shield = Math.min(120, (p.st.shield || 0) + 40); p.st.shieldT = Math.max(p.st.shieldT || 0, 5);
        floatText(p.x, p.y - 50, '🛡 +40 GIÁP', '#bae6fd', 14); hitStop(0.1); addShake(9); AudioSys.playAt('crit', p.x, p.y, 0.8);
    } });
}

/* ============================== TAM KHÚC CÔN: 2 dạng ============================== */
WEAPONS.SANJIE.desc = '2 dạng: TRƯỜNG CÔN (đánh tầm trung, gây choáng — kỹ năng khống chế & chiếm vị trí) · TAM KHÚC (đánh gần, liên đòn, đỡ đạn phía trước — kỹ năng dồn sát thương). Nội tại TAM VŨ KHÚC: cứ 3 đòn đánh thường tự đổi dạng kèm 1 đòn chuyển. Giữ rồi thả: đổi dạng ngay.';
SJ_FORMS.length = 2;
function sjSwap(p, w, ang) {
    const to = ((w.form || 0) + 1) % 2; w.form = to; p.sjCount = 0;
    if (to === 1) { // → Tam Khúc: vung xoay
        W5FX.push({ kind: 'sjSpin', owner: p.id, t: 0.35, maxT: 0.35 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 115 + e.radius) dealDamage(e, 16 * w5MM(p), p.id, { melee: true, knock: 300, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
    } else { // → Trường Côn: duỗi côn đâm thẳng, choáng
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 175, color: '#fbbf24', width: 8, life: 0.2, maxLife: 0.2, swing: 1, line: true });
        lineFoes(p, ang, 175, 18).forEach(e => { dealDamage(e, 18 * w5MM(p), p.id, { melee: true, knock: 260, angle: ang }); e.stun = Math.max(e.stun, 0.5); });
    }
    if (has(p, 'meleeTech')) p.hp = Math.min(p.maxHp, p.hp + 10);
    floatText(p.x, p.y - 58, `🥢 TAM VŨ KHÚC → ${SJ_FORMS[to].name.toUpperCase()}`, SJ_FORMS[to].col, 13); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
}
sjFire = function (p, w, ang, charge, mult) {
    w.form = (w.form || 0) % 2; const f = w.form, dmg = w.damage * w5MM(p) * mult;
    if (charge >= 0.9) { meleeBook(p, w, ang, 16); return sjSwap(p, w, ang); }
    let hit;
    if (f === 0) { // Trường Côn: tầm trung, choáng
        meleeBook(p, w, ang, 24);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 150 + p.radius, color: '#d97706', width: 9, life: 0.22, maxLife: 0.22, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false, arc: 0.75 });
        hit = arcFoes(p, ang, 150, 0.75); hit.forEach(e => { dealDamage(e, dmg * 1.15, p.id, { melee: true, knock: 240, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.35); p.stats.hits++; });
        AudioSys.playAt('swing', p.x, p.y, 0.5);
    } else { // Tam Khúc: gần, 2 nhịp, thủ
        meleeBook(p, w, ang, 15); p.sjGuardT = world.time + 0.7; const side = (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1;
        W5FX.push({ kind: 'sjFlail', owner: p.id, a: ang, side, t: 0.22, maxT: 0.22 });
        hit = arcFoes(p, ang, 88, 1.2); hit.forEach(e => { dealDamage(e, dmg * 0.75, p.id, { melee: true, knock: 60, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++; });
        p.shotQueue.push({ t: 0.09, fn: () => { if (p.hp <= 0) return; arcFoes(p, ang, 88, 1.2).forEach(e => dealDamage(e, dmg * 0.75, p.id, { melee: true, knock: 100, angle: Math.atan2(e.y - p.y, e.x - p.x) })); AudioSys.playAt('swing', p.x, p.y, 0.3); } });
        AudioSys.playAt('swing', p.x, p.y, 0.4);
    }
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
    p.sjCount = (p.sjCount || 0) + 1;
    if (p.sjCount >= 3) p.shotQueue.push({ t: 0.16, fn: () => { if (p.hp > 0 && getCurrentWeapon(p) === w) sjSwap(p, w, p.angle); } });
};
const SJ_SK = {
    M: [['CÔN CHỐNG NHẢY', p => { // Trường Côn: chống côn nhảy vọt tới điểm, đáp xuống choáng vùng
        const a = aimDir(p), d = Math.max(100, Math.min(300, p.skillDist || 240)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
        startTravel(p, s.x, s.y, 0.42, null, null, 95); p.st.invuln = Math.max(p.st.invuln || 0, 0.4);
        p.shotQueue.push({ t: 0.43, fn: () => { if (p.hp <= 0) return; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 120 + e.radius) { dealDamage(e, 26 * w5MM(p), p.id, { melee: true, knock: 220, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.9); } }); ring(p.x, p.y, 8, 120, '#d97706', 0.4, 6); addShake(6); AudioSys.playAt('slam', p.x, p.y, 0.5); } });
    }], ['LIÊN HOÀN TAM KHÚC', p => { // Tam Khúc: 9 nhịp quất + 1 cú chốt
        const a = aimDir(p); p.sjGuardT = world.time + 1.1;
        for (let k = 0; k < 9; k++) p.shotQueue.push({ t: k * 0.08, fn: () => { if (p.hp <= 0) return; W5FX.push({ kind: 'sjFlail', owner: p.id, a, side: k % 2 ? 1 : -1, t: 0.14, maxT: 0.14 }); arcFoes(p, a, 98, 0.9).forEach(e => dealDamage(e, 8 * w5MM(p), p.id, { melee: true, knock: 20, angle: a })); AudioSys.playAt('swing', p.x, p.y, 0.2); } });
        p.shotQueue.push({ t: 0.8, fn: () => { if (p.hp <= 0) return; arcFoes(p, a, 105, 1.0).forEach(e => { dealDamage(e, 30 * w5MM(p), p.id, { melee: true, knock: 420, angle: a }); }); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 105 + p.radius, color: '#fbbf24', width: 14, life: 0.22, maxLife: 0.22, swing: 1, line: false }); hitStop(0.06); addShake(5); } });
    }]],
    H: [['TRƯỜNG CÔN QUÉT TRẬN', p => { // Trường Côn: quét 360° gom địch về 1 điểm trước mặt, choáng
        const a = aimDir(p), px = p.x + Math.cos(a) * 110, py = p.y + Math.sin(a) * 110;
        W9.push({ kind: 'sweep', owner: p.id, t: 0.5, T: 0.5 }); W9.push({ kind: 'gather', owner: p.id, x: px, y: py, t: 0.6, T: 0.6 });
        enemiesOf(p).forEach(e => { if (e.air > 0 || dist(e.x, e.y, p.x, p.y) > 230 + e.radius) return; const b = Math.atan2(py - e.y, px - e.x), d = Math.max(0, dist(e.x, e.y, px, py) - 36), nx = e.x + Math.cos(b) * d, ny = e.y + Math.sin(b) * d; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } dealDamage(e, 30 * w5MM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 1.0); floatText(e.x, e.y - 44, '🥢 GOM TRẬN', '#fbbf24', 12); });
        addShake(7); AudioSys.playAt('whoosh', p.x, p.y, 0.8);
    }], ['BÁCH CÔN LOẠN ĐẢ', p => { // Tam Khúc: lướt xuyên rồi lốc côn 1.4 giây
        const a = aimDir(p), L = Math.max(50, rayFree(p.x, p.y, a, 200).d - p.radius), ax = p.x, ay = p.y, bx = ax + Math.cos(a) * L, by = ay + Math.sin(a) * L;
        startTravel(p, bx, by, 0.16, null, null, 6); afterImages(p, ax, ay, bx, by, 4, '#fbbf24');
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 34) dealDamage(e, 20 * w5MM(p), p.id, { melee: true, knock: 120, angle: a }); });
        p.sjWhirl = { t: 1.4, tick: 0 }; p.sjGuardT = world.time + 1.6; W5FX.push({ kind: 'sjSpin', owner: p.id, t: 1.5, maxT: 1.5 });
    }]]
};
const sjSk = (p, k) => { const w = getCurrentWeapon(p), f = (w.form || 0) % 2, S = SJ_SK[k][f]; floatText(p.x, p.y - 46, `🥢 ${S[0]}`, SJ_FORMS[f].col, 14); S[1](p); };

/* ============================== RÌU PHÁO: bắn pháo vòng cung như Đa Khí Cụ ============================== */
const _axeFireR5 = axeFire;
axeFire = function (p, w, ang, charge, mult, enemy) {
    if (w.id !== 'AXECANNON' || isAxeForm(w) || charge >= 0.9) return _axeFireR5(p, w, ang, charge, mult, enemy);
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++; if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    if (!useShell(p, w)) { p.cooldown = 12; return; }
    p.cooldown = 38 * p.fireRateMult; p.muzzle = 0.08; p.recoil = 1;
    const tg = enemiesOf(p).filter(e => e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 560 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.35).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0];
    const d = Math.max(120, Math.min(520, (p.manualEngaged && p.aimDist) || (tg ? dist(tg.x, tg.y, p.x, p.y) : 340))), s = rayFree(p.x, p.y, ang, d);
    const m = muzzle(p, w, ang), x = p.x + Math.cos(ang) * s.d, y = p.y + Math.sin(ang) * s.d;
    W9.push({ kind: 'axShell', owner: p.id, x0: m.x, y0: m.y, x, y, t: 0.5, T: 0.5 }); dropBomb(p, x, y, 55 * mult * w4DM(p), 105, 0.5);
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.55); addShake(4); p.kx -= Math.cos(ang) * 110; p.ky -= Math.sin(ang) * 110;
    smoke(m.x, m.y, 4, 'rgba(214,211,209,0.4)', 14);
};

/* ============================== ĐA KHÍ CỤ: biết trước dạng kế tiếp ============================== */
const cubeRoll = cur => { let r = cur; while (r === cur) r = Math.floor(Math.random() * CUBE_FORMS.length); return r; };
const _cubeSetFormR5 = cubeSetForm;
cubeSetForm = function (p, w, i) {
    if (p._cubeExact) _cubeSetFormR5(p, w, i);
    else { const cur = w.form || 0; let nx = w.cubeNext; if (nx === undefined || nx === cur) nx = cubeRoll(cur); p._cubeExact = true; try { _cubeSetFormR5(p, w, nx); } finally { p._cubeExact = false; } }
    w.cubeNext = cubeRoll(w.form || 0); const N = CUBE_FORMS[w.cubeNext];
    if (p === localPlayer()) floatText(p.x, p.y - 64, `kế tiếp: ${N.icon} ${N.name}`, '#94a3b8', 11);
};
const _ammoTextR5 = ammoText;
ammoText = function (w) { if (w && w.id === 'MULTICUBE') { if (w.cubeNext === undefined || w.cubeNext === (w.form || 0)) w.cubeNext = cubeRoll(w.form || 0); return `${_ammoTextR5(w)} ▸${CUBE_FORMS[w.cubeNext].icon}`; } return _ammoTextR5(w); };
WEAPONS.MULTICUBE.desc = WEAPONS.MULTICUBE.desc.replace('biến sang một dạng NGẪU NHIÊN khác', 'biến sang dạng NGẪU NHIÊN đã báo trước (ô đạn hiện ▸ dạng kế tiếp)');

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _fireWeaponR5 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'KATANA') { if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; } return katFire(p, w, ang, charge || 0, attackMult(p, w)); }
    return _fireWeaponR5(p, w, ang, charge, enemy);
};
const _meleeTechR5 = meleeTechCast;
meleeTechCast = function (p) { const w = getCurrentWeapon(p); if (w.id === 'KATANA') return katMaster(p); if (w.id === 'SANJIE') return sjSk(p, 'M'); return _meleeTechR5(p); };
HT.SANJIE = ['TAM KHÚC TUYỆT KỸ', p => sjSk(p, 'H')];
const _castSkillR5 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], r = _castSkillR5(p, slot, aimVec);
    if (s && s.id === 'meleeTech' && p.katCdCut) { p.katCdCut = false; s.cd *= 0.1; }
    return r;
};
const _skillProfileR5 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'KATANA' && id === 'meleeTech') return (p.katStabHits || 0) >= 2 ? { aim: 'dir', R: 540, shape: 'line', w: 120, col: '224,242,254', tag: '🌪 LỐC KIẾM' } : { aim: 'dir', R: 210, shape: 'line', w: 36, col: '186,230,253', tag: `ĐÂM ${p.katStabHits || 0}/2 · TRÚNG −90% HỒI CHIÊU` };
    if (w && w.id === 'SANJIE' && (id === 'meleeTech' || id === 'hightech')) { const f = (w.form || 0) % 2; return id === 'meleeTech' ? (f ? { aim: 'dir', R: 105, shape: 'cone', half: 0.9, col: '251,191,36', tag: 'LIÊN HOÀN TAM KHÚC' } : { aim: 'point', R: 300, shape: 'point', aoe: 120, arc: true, col: '217,119,6', tag: 'CÔN CHỐNG NHẢY' }) : (f ? { aim: 'dir', R: 200, shape: 'line', w: 70, col: '251,191,36', tag: 'BÁCH CÔN LOẠN ĐẢ' } : { aim: null, shape: 'selfaoe', aoe: 230, col: '217,119,6', tag: 'QUÉT TRẬN · GOM & CHOÁNG' }); }
    return _skillProfileR5(p, id);
};
MELEE_P.SANJIE = 'Mỗi lần đổi dạng hồi 10 máu.';
MELEE_P.KATANA = 'Hút 10% sát thương; đòn đâm trúng giảm 90% hồi chiêu Bậc Thầy.';
const _dealDamageR5 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) { // Tam Khúc: thủ thế giảm 25% sát thương phía trước
    if (target && target.sjGuardT > world.time && holdingId(target, 'SANJIE') && (getCurrentWeapon(target).form || 0) % 2 === 1) { const atk = players.find(q => q.id === attackerId); if (!atk || Math.abs(angleDiff(Math.atan2(atk.y - target.y, atk.x - target.x), target.angle)) < 1.3) dmg *= 0.75; }
    return _dealDamageR5(target, dmg, attackerId, opts);
};
const _resetRoundR5 = resetPlayerForRound;
resetPlayerForRound = function (p) { for (let i = W9.length - 1; i >= 0; i--) if (W9[i].owner === p.id) W9.splice(i, 1); p.katStabHits = 0; p.katDashT = 0; p.sjWhirl = null; p.sjCount = 0; return _resetRoundR5(p); };

const _upeR5 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR5(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => {
        if (p.hp <= 0) { p.sjWhirl = null; return; }
        const w = getCurrentWeapon(p);
        if (w && w.id === 'SANJIE' && (w.form || 0) % 2 === 1 && p.sjGuardT > world.time) // Tam Khúc: đỡ đạn phía trước
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (!b) continue; if (b.owner === p.id || b.explosive || dist(b.x, b.y, p.x, p.y) > p.radius + 34 || Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 1.0) continue; spark(b.x, b.y, '#fbbf24', 4, 140); bullets.splice(j, 1); }
        const S = p.sjWhirl;
        if (S) { S.t -= dt; S.tick += dt; if (S.tick >= 0.1) { S.tick = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 112 + e.radius) dealDamage(e, 7 * w5MM(p), p.id, { melee: true, knock: 30, angle: Math.atan2(e.y - p.y, e.x - p.x) }); }); AudioSys.playAt('swing', p.x, p.y, 0.15); } if (S.t <= 0) p.sjWhirl = null; }
    });
    for (let i = W9.length - 1; i >= 0; i--) {
        const f = W9[i]; if (!f) continue; const o = players.find(q => q.id === f.owner); if (!o) { W9.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'tornado') { // lốc kiếm: hút và hất tung mọi kẻ trên đường
            const st = 520 * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            enemiesOf(o).forEach(e => { if (f.hit.has(e.id) || e.air > 0) return; const d = dist(e.x, e.y, f.x, f.y); if (d < 95 + e.radius) { const b = Math.atan2(f.y - e.y, f.x - e.x), k = Math.min(d, 380 * dt); if (!pointInObstacle(e.x + Math.cos(b) * k, e.y + Math.sin(b) * k, e.radius)) { e.x += Math.cos(b) * k; e.y += Math.sin(b) * k; } } if (d < 42 + e.radius) { f.hit.add(e.id); dealDamage(e, 35 * k5M(o), o.id, { melee: true, knock: 1 }); k5Lift(o, e, f.a, 0.9); } });
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (!b) continue; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 60) bullets.splice(j, 1); }
            if (f.d >= f.max || pointInObstacle(f.x, f.y, 10)) { W9.splice(i, 1); continue; }
        }
        if (f.t <= 0) W9.splice(i, 1);
    }
};

/* ============================== HÌNH VẼ ============================== */
const _drawW2FxR5 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR5(now);
    ctx.save(); ctx.lineCap = 'round';
    W9.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T, k = 1 - u;
        if (f.kind === 'vcut') { // chém dọc: vệt sáng dựng đứng dọc theo hướng chém
            const L = 120, g = Math.min(1, u / 0.35); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(186,230,253,${0.8 * k})`; ctx.lineWidth = 14 * k + 2; ctx.beginPath(); ctx.moveTo(o.radius, 0); ctx.lineTo(o.radius + L * g, 0); ctx.stroke();
            ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.radius, 0); ctx.lineTo(o.radius + L * g + 8, 0); ctx.stroke();
            for (let i = 0; i < 4; i++) { const x = o.radius + 20 + i * 26; ctx.strokeStyle = `rgba(224,242,254,${0.6 * k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 6, -14 - u * 20); ctx.stroke(); } ctx.restore();
        } else if (f.kind === 'lift') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(125,211,252,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(f.x, f.y + 6, 18 + u * 22, 7 + u * 8, 0, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(f.x - 12 + i * 12, f.y); ctx.lineTo(f.x - 12 + i * 12, f.y - 20 - u * 40); ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'tornado') {
            ctx.save(); ctx.translate(f.x, f.y); ctx.globalCompositeOperation = 'lighter';
            for (let r = 0; r < 4; r++) { const R = 22 + r * 18, a0 = now * (12 - r * 2) + r; ctx.strokeStyle = `rgba(${r % 2 ? '186,230,253' : '255,255,255'},${0.55 - r * 0.1})`; ctx.lineWidth = 4 - r * 0.6; ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R, a0 + Math.PI, a0 + Math.PI + 2.2); ctx.stroke(); }
            const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 95); g.addColorStop(0, 'rgba(224,242,254,0.35)'); g.addColorStop(1, 'rgba(125,211,252,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 95, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (f.kind === 'shadow') { // bóng kiếm sĩ chém
            const e = players.find(q => q.id === f.tid); ctx.save(); ctx.globalAlpha = 0.7 * k; ctx.fillStyle = '#0c4a6e'; ctx.beginPath(); ctx.arc(f.x, f.y, o.radius * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2; ctx.stroke();
            if (e) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(224,242,254,${k})`; ctx.lineWidth = 3; const a = f.a; ctx.beginPath(); ctx.moveTo(e.x - Math.cos(a + 1) * 34, e.y - Math.sin(a + 1) * 34); ctx.lineTo(e.x + Math.cos(a + 1) * 34, e.y + Math.sin(a + 1) * 34); ctx.stroke(); } ctx.restore();
        } else if (f.kind === 'sweep') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(251,191,36,${0.6 * k})`; ctx.lineWidth = 16 * k + 2; const a0 = o.angle + u * Math.PI * 2; ctx.beginPath(); ctx.arc(o.x, o.y, 200, a0 - 1.8, a0); ctx.stroke(); ctx.strokeStyle = `rgba(254,243,199,${k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, 225, a0 - 1.2, a0); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'gather') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(251,191,36,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + k * 60, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'axShell') { const t = Math.min(1, u), x = f.x0 + (f.x - f.x0) * t, y = f.y0 + (f.y - f.y0) * t - Math.sin(t * Math.PI) * 100; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(f.x0 + (f.x - f.x0) * t, f.y0 + (f.y - f.y0) * t, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(251,146,60,0.45)'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.fillStyle = '#292524'; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fdba74'; ctx.lineWidth = 1.5; ctx.stroke(); }
    });
    players.forEach(p => { if (p.hp > 0 && p.sjWhirl) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(now * 22); for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); wood(ctx, p.radius, -2.5, 80, 5, 2); } ctx.restore(); } });
    ctx.restore();
};
