/** ==================== REWORK 13 ====================
 *  · Rìu Săn: Dấu Săn (đạn shotgun đánh dấu → rìu Xẻ Thịt), chém trúng nạp đạn nhanh, Phát Cuối gấp đôi + cháy
 *  · Vũ khí mới: BOM (nảy / giữ = bom dính) · BOM LỬA (chai lửa / giữ = tường lửa) · PHI TIÊU (nảy tường, Ấn Tiêu / giữ = Phong Ma Tiêu)
 *  · Roi: vẽ lại (thân thon, cong mượt, vệt mờ, tiếng nổ đầu roi)
 *  · Như Ý Kim Cô Bổng: ĐỊNH THÂN (Kim Cô đầy / Trang Bị Phụ Định Thân Thuật); Bậc Thầy = chống gậy đứng trên đỉnh (miễn chọn mục tiêu) rồi chọn điểm đáp
 *  Hiệu ứng riêng: mảng W13 (không đồng bộ online, sát thương tính ở chủ phòng).
 */
const W13 = [];
const r13Now = () => world.time;

/* ============================== ĐỊNH NGHĨA VŨ KHÍ ============================== */
Object.assign(WEAPONS, {
    BOMB:      { id: 'BOMB', name: 'Bom', icon: '💣', type: 'GUN', mode: 'charge', chargeTime: 0.7, aim: 'line', color: '#334155', damage: 60, fireRate: 32, speed: 1, spread: 0, range: 420, magSize: 3, mag: 3, reserve: 9, reloadTime: 2.2, moveScale: 1.0, width: 8, len: 10, tier: 2, desc: 'Ném bom vòng cung, nảy & lăn rồi nổ sau 1.2 giây (bay qua được vật cản thấp). Giữ rồi thả: BOM DÍNH bay thẳng, dính vào địch / tường, kêu bíp rồi nổ mạnh hơn. Bom nổ trong biển lửa của mình → NỔ LỬA (rộng hơn, văng lửa).' },
    FIREBOMBW: { id: 'FIREBOMBW', name: 'Bom Lửa', icon: '🔥', type: 'GUN', mode: 'charge', chargeTime: 0.7, aim: 'line', color: '#f97316', damage: 15, fireRate: 30, speed: 1, spread: 0, range: 400, magSize: 3, mag: 3, reserve: 9, reloadTime: 2.4, moveScale: 1.0, width: 8, len: 10, tier: 2, desc: 'Ném chai lửa: vỡ khi chạm đất / trúng người → biển lửa 4 giây, đốt cháy. Chai rơi vào biển lửa cũ → HOẢ HẢI (lửa lan rộng & cháy lâu hơn). Giữ rồi thả: 3 chai thành TƯỜNG LỬA chắn ngang.' },
    SHURIKEN:  { id: 'SHURIKEN', name: 'Phi Tiêu', icon: '⭐', type: 'GUN', mode: 'charge', chargeTime: 0.6, aim: 'line', color: '#cbd5e1', damage: 14, fireRate: 12, speed: 1, spread: 0, range: 520, magSize: 8, mag: 8, reserve: 24, reloadTime: 1.5, moveScale: 1.08, width: 4, len: 8, tier: 2, desc: 'Phi tiêu xoay bay nhanh, NẢY TƯỜNG 1 lần. Mỗi phát thứ 3 liên tiếp ném quạt 3 tiêu. 3 tiêu cắm trên cùng 1 địch → ẤN TIÊU bùng (sát thương + chậm). Giữ rồi thả (tốn 2): PHONG MA TIÊU khổng lồ bay ra rồi quay về, xuyên mọi kẻ, chém đứt đạn.' }
});
Object.assign(BASE_WEIGHTS, { BOMB: 5, FIREBOMBW: 4, SHURIKEN: 6 });
const R13_IDS = ['BOMB', 'FIREBOMBW', 'SHURIKEN'];

function r13Book(p, w, ang, cdK = 1) {
    const rof = p.fireRateMult * (p.st.rage > 0 ? 0.75 : 1);
    p.cooldown = w.fireRate * rof * cdK; p.ghostT = 0; p.angle = ang; p.lastFireT = world.time;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    onAttack(p); p.stats.shots++; p.recoil = 1;
}
function r13Use(w, n = 1) { for (let i = 0; i < n && w.mag > 0; i++) { if (!world.infiniteAmmo) w.mag--; } }
function r13Lob(p, kind, x0, y0, tx, ty, o = {}) {
    const d = dist(x0, y0, tx, ty), a = Math.atan2(ty - y0, tx - x0), T = Math.max(0.32, Math.min(0.75, d / 650)), g = 1600;
    const f = Object.assign({ kind, owner: p.id, x: x0, y: y0, vx: Math.cos(a) * d / T, vy: Math.sin(a) * d / T, z: 10, vz: g * T / 2, g, spin: 0, t: 6, landed: 0 }, o);
    W13.push(f); return f;
}
const r13Fire = (x, y, owner) => zones.find(z => z.type === 'fire' && z.owner === owner && z.t > 0 && dist(x, y, z.x, z.y) < z.r);

/* ---------- BOM ---------- */
function bombBlow(f) {
    const o = players.find(q => q.id === f.owner); if (!o) return;
    const fz = r13Fire(f.x, f.y, f.owner), R = f.R * (fz ? 1.25 : 1);
    explode(f.x, f.y, f.owner, f.dmg * (fz ? 1.2 : 1), R);
    if (fz) { // NỔ LỬA
        for (let i = 0; i < 5; i++) { const t = i / 5 * Math.PI * 2 + Math.random() * 0.5, r = R * 0.75; zones.push({ type: 'fire', x: f.x + Math.cos(t) * r, y: f.y + Math.sin(t) * r, r: 50, t: 3, maxT: 3, owner: f.owner, tick: 0 }); }
        fz.t = Math.max(fz.t, 3); floatText(f.x, f.y - 40, '🔥💥 NỔ LỬA!', '#fb923c', 15); spark(f.x, f.y, '#fdba74', 24, 380);
    }
    addShake(f.sticky ? 9 : 7);
}
/* ---------- BOM LỬA ---------- */
function fireShatter(f) {
    const o = players.find(q => q.id === f.owner); if (!o) return;
    const old = r13Fire(f.x, f.y, f.owner), r = (f.r || 80);
    if (old) { old.r = Math.min(170, old.r + 25); old.t = Math.max(old.t, 5); old.maxT = Math.max(old.maxT, old.t); floatText(f.x, f.y - 36, '🔥 HOẢ HẢI', '#f97316', 14); }
    zones.push({ type: 'fire', x: f.x, y: f.y, r, t: f.dur || 4, maxT: f.dur || 4, owner: f.owner, tick: 0 });
    enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < r + e.radius) { dealDamage(e, f.dmg, o.id, { angle: Math.atan2(e.y - f.y, e.x - f.x), knock: 80 }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.burnBy = o.id; } } });
    for (let i = 0; i < 14; i++) particles.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 360, vy: (Math.random() - 0.5) * 360, life: 0.5, maxLife: 0.5, color: Math.random() < 0.5 ? '#fb923c' : '#fde047', size: 4, glow: true });
    spark(f.x, f.y, '#a7f3d0', 8, 220); // mảnh chai
    AudioSys.playAt('block', f.x, f.y, 0.35); AudioSys.playAt('explosion', f.x, f.y, 0.15);
}
/* ---------- PHI TIÊU ---------- */
function starHit(o, e, f) {
    dealDamage(e, f.dmg, o.id, { angle: f.a, knock: f.big ? 220 : 90 });
    spark(e.x, e.y, '#e2e8f0', 6, 220); o.stats.hits++;
    if (f.big) return;
    const now = r13Now();
    e.shuN = (e.shuBy === o.id && now - (e.shuT || -9) < 4 ? (e.shuN || 0) : 0) + 1; e.shuBy = o.id; e.shuT = now;
    if (e.shuN >= 3) {
        e.shuN = 0; dealDamage(e, 22 * (o.dmgMult ? 1 : 1), o.id, { knock: 1 }); e.st.slow = Math.max(e.st.slow || 0, 1.4);
        floatText(e.x, e.y - 46, '✴ ẤN TIÊU!', '#f8fafc', 15); ring(e.x, e.y, 6, 46, '#f1f5f9', 0.35, 4); AudioSys.playAt('crit', e.x, e.y, 0.35);
    }
}
function throwStar(p, a, o = {}) {
    W13.push(Object.assign({ kind: 'star', owner: p.id, x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, a, sp: 950, d: 0, max: 520, dmg: 14, bounce: 1, t: 2, spin: 0 }, o));
}

/* ============================== MÓC BẮN ============================== */
const _fireWeaponR13 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!w || !R13_IDS.includes(w.id)) return _fireWeaponR13(p, w, ang, charge, enemy);
    if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; }
    if (w.mag <= 0) return;
    const mult = attackMult(p, w); charge = charge || 0;
    if (w.id === 'BOMB') {
        if (charge >= 0.9) { // bom dính
            r13Book(p, w, ang, 1.2); r13Use(w);
            W13.push({ kind: 'bomb', sticky: true, owner: p.id, x: p.x + Math.cos(ang) * 16, y: p.y + Math.sin(ang) * 16, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, z: 8, vz: 0, g: 0, flat: true, travel: 0, fuse: 2.2, armed: false, dmg: 85 * mult, R: 150, t: 6 });
            floatText(p.x, p.y - 34, '🧲 BOM DÍNH', '#f87171', 13); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
            return;
        }
        r13Book(p, w, ang); r13Use(w);
        const d = w3AimDist(p, enemy, 300, w.range);
        r13Lob(p, 'bomb', p.x, p.y, p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, { fuse: 1.2, dmg: 60 * mult, R: 125 });
        AudioSys.playAt('whoosh', p.x, p.y, 0.3);
        return;
    }
    if (w.id === 'FIREBOMBW') {
        const d = w3AimDist(p, enemy, 280, w.range), cx = p.x + Math.cos(ang) * d, cy = p.y + Math.sin(ang) * d;
        if (charge >= 0.9) { // tường lửa
            r13Book(p, w, ang, 1.4); r13Use(w);
            [-1, 0, 1].forEach(k => r13Lob(p, 'fire', p.x, p.y, cx + Math.cos(ang + Math.PI / 2) * k * 75, cy + Math.sin(ang + Math.PI / 2) * k * 75, { dmg: 10 * mult, r: 55, dur: 4.5 }));
            floatText(p.x, p.y - 34, '🔥 TƯỜNG LỬA', '#fb923c', 13); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
            return;
        }
        r13Book(p, w, ang); r13Use(w);
        r13Lob(p, 'fire', p.x, p.y, cx, cy, { dmg: 15 * mult, r: 80, dur: 4 });
        AudioSys.playAt('whoosh', p.x, p.y, 0.3);
        return;
    }
    // PHI TIÊU
    if (charge >= 0.9) {
        r13Book(p, w, ang, 2.4); r13Use(w, 2);
        W13.push({ kind: 'bigstar', owner: p.id, x: p.x, y: p.y, a: ang, sp: 720, d: 0, max: 360, back: false, dmg: 26 * mult, hit: new Set(), t: 4, spin: 0, big: true });
        floatText(p.x, p.y - 34, '✴ PHONG MA TIÊU', '#e2e8f0', 13); AudioSys.playAt('whoosh', p.x, p.y, 0.55);
        return;
    }
    r13Book(p, w, ang); r13Use(w);
    p.shuSeq = world.time - (p.shuLast || -9) < 0.9 ? (p.shuSeq || 0) + 1 : 1; p.shuLast = world.time;
    const fan = p.shuSeq % 3 === 0;
    (fan ? [-0.16, 0, 0.16] : [0]).forEach(o => throwStar(p, ang + o + (Math.random() - 0.5) * 0.03, { dmg: 14 * mult }));
    AudioSys.playAt('whoosh', p.x, p.y, fan ? 0.35 : 0.2);
};

/* ============================== RÌU SĂN ============================== */
WEAPONS.AXEGUN.desc = 'Đa hình, 2 dạng dùng chung 4 đạn. SHOTGUN: chùm 7 viên, mỗi viên trúng để lại DẤU SĂN (tối đa 7). Viên CUỐI băng: 14 viên đạn lửa. RÌU: còn đạn → nện đất nổ; hết đạn → chém (trúng thì nạp đạn nhanh hơn). Rìu đánh trúng kẻ mang Dấu Săn: +10%/dấu, đủ 4 dấu → XẺ THỊT (choáng + hoàn 1 đạn). Giữ để đổi dạng.';
const _axeFireR13 = axeFire;
axeFire = function (p, w, ang, charge, mult, enemy) {
    if (w.id !== 'AXEGUN' || isAxeForm(w) || charge >= 0.9) return _axeFireR13(p, w, ang, charge, mult, enemy);
    const last = w.shells === 1, n0 = bullets.length;
    const r = _axeFireR13(p, w, ang, charge, mult, enemy);
    if (bullets.length > n0 && last) { // PHÁT CUỐI: gấp đôi + lửa
        const m = muzzle(p, w, ang);
        for (let i = 0; i < 7; i++) spawnBullet(p, m.x, m.y, ang + (Math.random() - 0.5) * 0.6, { speed: 17 + Math.random() * 5, damage: 9 * mult, range: 240, knock: 150, size: 3.2, trail: 20, color: '#fb923c', burn: true });
        floatText(p.x, p.y - 40, '🔥 PHÁT CUỐI!', '#fb923c', 14); addShake(4);
    }
    for (let i = n0; i < bullets.length; i++) if (bullets[i].owner === p.id) bullets[i].hunt = true;
    return r;
};

/* ============================== NHƯ Ý KIM CÔ BỔNG ============================== */
WEAPONS.RUYIBANG.desc = 'Gậy co giãn: chạm = đánh thường (3 đòn, đòn 3 choáng). Giữ càng lâu gậy càng DÀI (tới 420) rồi thọc thẳng; giữ đầy = QUÉT vòng cung khổng lồ. Mỗi đòn trúng tích Kim Cô — đủ 5 thì đòn kế ĐỊNH THÂN địch 1.2 giây (đứng im, không bị đẩy, chịu thêm 20% sát thương).';
function dinhThan(e, T, by) {
    const now = r13Now();
    e.dinhT = Math.max(e.dinhT || 0, now + T); e.dinhMax = T; e.stun = Math.max(e.stun || 0, T);
    e.st.root = Math.max(e.st.root || 0, T); e.kx = e.ky = 0;
    floatText(e.x, e.y - 56, '定 ĐỊNH THÂN!', '#facc15', 16); ring(e.x, e.y, 6, 54, '#facc15', 0.45, 5); AudioSys.playAt('legend', e.x, e.y, 0.3);
}
const _ruyiHitR13 = ruyiHit;
ruyiHit = function (p, e, dmg, knock, ang) {
    const before = p.kimco || 0;
    _ruyiHitR13(p, e, dmg, knock, ang);
    if (before > 0 && p.kimco === 0 && e.hp > 0) dinhThan(e, 1.2, p.id);
};
// Bậc Thầy: Chống Gậy
function ruyiPerchStart(p) {
    p.ruyiPerch = { x: p.x, y: p.y, t0: r13Now(), until: r13Now() + 2.5, fresh: true };
    p.travel = null; p.dashTime = 0;
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 90 + e.radius) dealDamage(e, 14 * w5MM(p), p.id, { melee: true, knock: 380, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
    ring(p.x, p.y, 6, 90, '#facc15', 0.35, 5); addShake(5); AudioSys.playAt('slam', p.x, p.y, 0.4);
    floatText(p.x, p.y - 50, '🥢 CHỐNG GẬY — chọn điểm đáp', '#facc15', 14);
}
function ruyiPerchLand(p, x, y) {
    const P = p.ruyiPerch; if (!P) return; p.ruyiPerch = null;
    p.x = P.x; p.y = P.y; p.air = 0;
    const s = umbFreeSpot(p, x, y), d = dist(p.x, p.y, s.x, s.y);
    W13.push({ kind: 'pole', owner: p.id, x: P.x, y: P.y, t: 0.5, T: 0.5 });
    startTravel(p, s.x, s.y, Math.max(0.3, Math.min(0.55, d / 800)), 'umbLand', { fn: q => {
        enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, q.x, q.y) < 140 + e.radius) { dealDamage(e, 42 * w5MM(q), q.id, { melee: true, knock: 420, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 0.8); q.stats.hits++; } });
        obstacles.slice().forEach(o => { const cx = Math.max(o.x, Math.min(q.x, o.x + o.w)), cy = Math.max(o.y, Math.min(q.y, o.y + o.h)); if (dist(cx, cy, q.x, q.y) < 90) damageObstacle(o, 60, q); });
        ring(q.x, q.y, 10, 140, '#facc15', 0.5, 8); spark(q.x, q.y, '#fde047', 20, 340); addScorch(q.x, q.y, 50); addShake(11); hitStop(0.07);
        AudioSys.playAt('slam', q.x, q.y, 0.7); floatText(q.x, q.y - 50, '🔱 THIÊN BỔNG GIÁNG ĐỊA', '#facc15', 15);
    } }, 120);
    p.st.invuln = Math.max(p.st.invuln || 0, 0.3);
}
const _meleeTechR13 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'RUYIBANG') {
        if (p.ruyiPerch) { const a = aimDir(p), d = Math.max(60, Math.min(420, p.skillDist || 260)); return ruyiPerchLand(p, p.ruyiPerch.x + Math.cos(a) * d, p.ruyiPerch.y + Math.sin(a) * d); }
        return ruyiPerchStart(p);
    }
    return _meleeTechR13(p);
};
const _castSkillR13 = castSkill;
castSkill = function (p, slot, aimVec) {
    const r = _castSkillR13(p, slot, aimVec);
    const s = p.skills && p.skills[slot];
    if (s && s.id === 'meleeTech' && p.ruyiPerch && p.ruyiPerch.fresh) { p.ruyiPerch.fresh = false; s.cd = 0.3; }
    return r;
};
// Trang Bị Phụ: Định Thân Thuật
const _gunModR13 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w && w.id === 'RUYIBANG') {
        W13.push({ kind: 'dinh', owner: p.id, x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18, a, sp: 760, d: 0, max: 460, t: 2 });
        floatText(p.x, p.y - 44, '定 ĐỊNH THÂN THUẬT', '#facc15', 15); AudioSys.playAt('legend', p.x, p.y, 0.35);
        return;
    }
    if (w && w.id === 'BOMB') { // Bom Chùm
        const d = Math.max(100, Math.min(360, p.skillDist || 280));
        r13Lob(p, 'bomb', p.x, p.y, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, { fuse: 0.9, dmg: 50, R: 110, cluster: true, big: true });
        floatText(p.x, p.y - 44, '💣 BOM CHÙM', '#cbd5e1', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.4); return;
    }
    if (w && w.id === 'FIREBOMBW') { // Napalm
        const d = Math.max(100, Math.min(360, p.skillDist || 280));
        r13Lob(p, 'fire', p.x, p.y, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, { dmg: 25, r: 140, dur: 5, big: true });
        floatText(p.x, p.y - 44, '🔥 BOM NAPALM', '#fb923c', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.4); return;
    }
    if (w && w.id === 'SHURIKEN') { // Ảnh Tiêu: ném tiêu ấn, tới nơi thì dịch chuyển tới đó
        throwStar(p, a, { dmg: 20, max: 480, sp: 1100, bounce: 0, warp: true });
        floatText(p.x, p.y - 44, '✴ ẢNH TIÊU — DỊCH CHUYỂN', '#e2e8f0', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.4); return;
    }
    return _gunModR13(p);
};
Object.assign(HT, {
    BOMB: ['MƯA BOM', p => { const a = aimDir(p), d = Math.max(100, Math.min(380, p.skillDist || 300)), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d; for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2, r = i ? 110 : 0; p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp > 0) r13Lob(p, 'bomb', p.x, p.y, cx + Math.cos(t) * r * (i ? 1 : 0), cy + Math.sin(t) * r * (i ? 1 : 0), { fuse: 1.0, dmg: 45, R: 105 }); } }); } floatText(p.x, p.y - 44, '💣 MƯA BOM', '#cbd5e1', 15); }],
    FIREBOMBW: ['HOẢ LONG', p => { const a = aimDir(p); for (let i = 1; i <= 7; i++) p.shotQueue.push({ t: i * 0.06, fn: () => { if (p.hp > 0) r13Lob(p, 'fire', p.x, p.y, p.x + Math.cos(a) * i * 60, p.y + Math.sin(a) * i * 60, { dmg: 12, r: 50, dur: 4 }); } }); floatText(p.x, p.y - 44, '🐉 HOẢ LONG', '#f97316', 15); }],
    SHURIKEN: ['VẠN TIÊU LUÂN', p => { for (let k = 0; k < 2; k++) p.shotQueue.push({ t: k * 0.25, fn: () => { if (p.hp <= 0) return; for (let i = 0; i < 12; i++) throwStar(p, i / 12 * Math.PI * 2 + k * 0.26, { dmg: 14, max: 400 }); AudioSys.playAt('whoosh', p.x, p.y, 0.4); } }); floatText(p.x, p.y - 44, '✴ VẠN TIÊU LUÂN', '#e2e8f0', 15); }]
});
Object.assign(HT_PROFILE, {
    BOMB: { aim: 'point', R: 380, shape: 'point', aoe: 160, arc: true, col: '148,163,184', tag: '6 QUẢ BOM' },
    FIREBOMBW: { aim: 'dir', R: 420, shape: 'line', w: 90, col: '249,115,22', tag: 'DẢI LỬA' },
    SHURIKEN: { aim: null, shape: 'selfaoe', aoe: 400, col: '226,232,240', tag: '2 VÒNG × 12 TIÊU' }
});
Object.assign(GUN_P, { BOMB: 'Bom nổ rộng hơn.', FIREBOMBW: 'Lửa cháy lâu hơn.', SHURIKEN: 'Ấn Tiêu bùng mạnh hơn.' });
const _skillProfileR13 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'RUYIBANG') {
        if (id === 'meleeTech') return p.ruyiPerch ? { aim: 'point', R: 420, shape: 'point', aoe: 140, arc: true, col: '250,204,21', tag: '🔱 CHỌN ĐIỂM ĐÁP' } : { aim: null, shape: 'selfaoe', aoe: 90, col: '250,204,21', tag: '🥢 CHỐNG GẬY · MIỄN CHỌN' };
        if (id === 'gunMod') return { aim: 'dir', R: 460, shape: 'line', w: 24, col: '250,204,21', tag: '定 ĐỊNH THÂN 1.6s' };
    }
    if (w && id === 'gunMod') {
        if (w.id === 'BOMB') return { aim: 'point', R: 360, shape: 'point', aoe: 170, arc: true, col: '148,163,184', tag: 'NỔ → 5 BOM CON' };
        if (w.id === 'FIREBOMBW') return { aim: 'point', R: 360, shape: 'point', aoe: 140, arc: true, col: '249,115,22', tag: 'NAPALM 5s' };
        if (w.id === 'SHURIKEN') return { aim: 'dir', R: 480, shape: 'line', w: 16, col: '226,232,240', tag: 'DỊCH CHUYỂN TỚI TIÊU' };
    }
    return _skillProfileR13(p, id);
};
CARDS.meleeTech.desc += '<br>Kim Cô Bổng = CHỐNG GẬY (đứng trên đỉnh gậy, miễn chọn mục tiêu; dùng lại để chọn điểm đáp, tự đáp sau 2.5 giây).';
CARDS.gunMod.desc += '<br>Kim Cô Bổng = Định Thân Thuật · Bom = Bom Chùm · Bom Lửa = Napalm · Phi Tiêu = Ảnh Tiêu (dịch chuyển).';

/* ============================== SÁT THƯƠNG: Dấu Săn · Định Thân ============================== */
const _dealDamageR13 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (!target || target.hp <= 0) return _dealDamageR13(target, dmg, attackerId, opts);
    const now = r13Now(), A = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if ((target.dinhT || 0) > now) { opts = Object.assign({}, opts, { knock: 0 }); if (A && A !== target) dmg *= 1.2; }
    if (A && A !== target) {
        if (opts.bullet && opts.bullet.hunt) { target.huntN = Math.min(7, ((target.huntBy === A.id && (target.huntT || 0) > now) ? target.huntN || 0 : 0) + 1); target.huntBy = A.id; target.huntT = now + 4; }
        const w = getCurrentWeapon(A);
        if (opts.melee && w && w.id === 'AXEGUN' && isAxeForm(w)) {
            if (w.shells !== undefined && w.shells < w.maxShells) w.shellT = (w.shellT || 0) + 0.5;
            if (target.huntBy === A.id && (target.huntT || 0) > now && target.huntN > 0) {
                const n = target.huntN; target.huntN = 0; dmg *= 1 + 0.1 * n;
                if (n >= 4) { target.stun = Math.max(target.stun || 0, 0.6); if (w.shells < w.maxShells) w.shells++; floatText(target.x, target.y - 52, `🪓 XẺ THỊT ×${n}`, '#f87171', 15); spark(target.x, target.y, '#ef4444', 14, 300); AudioSys.playAt('crit', target.x, target.y, 0.45); }
                else floatText(target.x, target.y - 44, `🎯 +${n * 10}%`, '#fca5a5', 12);
            }
        }
    }
    return _dealDamageR13(target, dmg, attackerId, opts);
};

/* ============================== CẬP NHẬT MỖI KHUNG ============================== */
function r13Wall(f, nx, ny) {
    const o = pointInObstacle(nx, ny, 4); if (!o && nx > 4 && nx < MAP_W - 4 && ny > 4 && ny < MAP_H - 4) return false;
    const side = o ? (f.x < o.x || f.x > o.x + o.w) : (nx <= 4 || nx >= MAP_W - 4);
    return side ? 'x' : 'y';
}
const _upeR13 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR13(dt);
    const now = r13Now();
    for (let i = W13.length - 1; i >= 0; i--) {
        const f = W13[i]; f.t -= dt; f.spin = (f.spin || 0) + dt;
        const o = players.find(q => q.id === f.owner);
        if (!o && f.kind !== 'pole') { W13.splice(i, 1); continue; }
        if (f.kind === 'bomb' || f.kind === 'fire') {
            if (f.flat) { // bom dính bay thẳng
                if (f.stick !== undefined) { const e = players.find(q => q.id === f.stick); if (e && e.hp > 0) { f.x = e.x + f.ox; f.y = e.y + f.oy; } else f.stick = undefined; }
                else if (!f.armed) {
                    const st = 900 * dt, nx = f.x + Math.cos(Math.atan2(f.vy, f.vx)) * st, ny = f.y + Math.sin(Math.atan2(f.vy, f.vx)) * st; f.travel += st;
                    const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, nx, ny) < q.radius + 8);
                    if (e) { f.stick = e.id; f.ox = f.x - e.x; f.oy = f.y - e.y; f.armed = true; f.fuse = 1.2; floatText(e.x, e.y - 40, '🧲 DÍNH BOM!', '#f87171', 14); }
                    else if (r13Wall(f, nx, ny) || f.travel > 440) { f.armed = true; f.fuse = 1.2; }
                    else { f.x = nx; f.y = ny; }
                }
                if (f.armed) { f.beep = (f.beep || 0) - dt; if (f.beep <= 0) { f.beep = f.fuse > 0.5 ? 0.3 : 0.12; AudioSys.playAt('tick', f.x, f.y, 0.3); } }
            } else { // vòng cung
                const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
                const wall = f.z < 34 ? r13Wall(f, nx, ny) : false;
                if (wall) {
                    if (f.kind === 'fire') { fireShatter(f); W13.splice(i, 1); continue; }
                    if (wall === 'x') f.vx *= -0.5; else f.vy *= -0.5;
                } else { f.x = nx; f.y = ny; }
                f.vz -= f.g * dt; f.z += f.vz * dt;
                if (f.z <= 0) {
                    f.z = 0;
                    if (f.kind === 'fire') { fireShatter(f); W13.splice(i, 1); continue; }
                    if (f.cluster && !f.split) { f.split = true; f.fuse = 0; }
                    if (Math.abs(f.vz) > 140) { f.vz = -f.vz * 0.32; f.vx *= 0.45; f.vy *= 0.45; AudioSys.playAt('tick', f.x, f.y, 0.15); } else f.vz = 0;
                    const k = Math.pow(0.86, dt * 60); f.vx *= k; f.vy *= k;
                }
                if (f.kind === 'fire' && f.z < 26) { const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 8); if (e) { fireShatter(f); W13.splice(i, 1); continue; } }
                if (f.kind === 'bomb' && f.z < 20) enemiesOf(o).forEach(q => { if (!(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 9) { const a = Math.atan2(f.y - q.y, f.x - q.x); f.vx = Math.cos(a) * 160; f.vy = Math.sin(a) * 160; } });
            }
            if (f.kind === 'bomb') {
                f.fuse -= dt;
                if (f.fuse <= 0) {
                    if (f.cluster) { explode(f.x, f.y, f.owner, 30, 90); for (let k = 0; k < 5; k++) { const t = k / 5 * Math.PI * 2 + Math.random() * 0.4, r = 70 + Math.random() * 60; r13Lob(o, 'bomb', f.x, f.y, f.x + Math.cos(t) * r, f.y + Math.sin(t) * r, { fuse: 0.55 + k * 0.08, dmg: 32, R: 85 }); } }
                    else bombBlow(f);
                    W13.splice(i, 1); continue;
                }
            }
        } else if (f.kind === 'star' || f.kind === 'bigstar' || f.kind === 'dinh') {
            let a = f.a;
            if (f.kind === 'bigstar' && f.back) { const d = dist(f.x, f.y, o.x, o.y); if (d < 26 || o.hp <= 0) { W13.splice(i, 1); continue; } a = f.a = Math.atan2(o.y - f.y, o.x - f.x); }
            const st = f.sp * dt, nx = f.x + Math.cos(a) * st, ny = f.y + Math.sin(a) * st;
            const wall = f.kind === 'bigstar' && f.back ? false : r13Wall(f, nx, ny);
            if (wall) {
                if (f.kind === 'star' && f.bounce > 0) { f.bounce--; f.a = wall === 'x' ? Math.PI - f.a : -f.a; spark(f.x, f.y, '#e2e8f0', 4, 160); AudioSys.playAt('block', f.x, f.y, 0.15); }
                else if (f.kind === 'bigstar') { f.back = true; f.hit.clear(); }
                else { if (f.warp) r13Warp(o, f); W13.splice(i, 1); continue; }
            } else { f.x = nx; f.y = ny; f.d += st; }
            if (f.kind === 'bigstar') {
                enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 26) { f.hit.add(e.id); starHit(o, e, f); } });
                for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 30) { spark(b.x, b.y, '#f1f5f9', 3, 140); bullets.splice(j, 1); } }
                if (!f.back && f.d >= f.max) { f.back = true; f.hit.clear(); }
                if (f.t <= 0) { W13.splice(i, 1); continue; }
                continue;
            }
            const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + (f.kind === 'dinh' ? 14 : 7));
            if (e) {
                if (f.kind === 'dinh') { dinhThan(e, 1.6, o.id); dealDamage(e, 10 * w5MM(o), o.id, { knock: 1 }); }
                else { starHit(o, e, f); if (f.warp) r13Warp(o, f, e); }
                W13.splice(i, 1); continue;
            }
            if (f.d >= f.max || f.t <= 0) { if (f.warp) r13Warp(o, f); else if (f.kind === 'dinh') ring(f.x, f.y, 4, 40, '#facc15', 0.3, 3); W13.splice(i, 1); continue; }
        } else if (f.t <= 0) { W13.splice(i, 1); continue; }
    }
    // trạng thái theo người
    players.forEach(p => {
        if ((p.dinhT || 0) > now) { p.kx = p.ky = 0; p.vx = p.vy = 0; p.dashTime = 0; }
        const P = p.ruyiPerch; if (!P) return;
        if (p.hp <= 0 || (gameState !== 'PLAYING' && gameState !== 'KO')) { p.ruyiPerch = null; p.air = 0; p.airH = 0; return; }
        const w = getCurrentWeapon(p);
        p.x = P.x; p.y = P.y; p.vx = p.vy = p.kx = p.ky = 0; p.travel = null; p.dashTime = 0;
        p.air = 0.3; p.airH = Math.min(78, (now - P.t0) * 420); p.st.invuln = Math.max(p.st.invuln || 0, 0.12); p.cooldown = Math.max(p.cooldown, 3);
        let auto = now >= P.until || !w || w.id !== 'RUYIBANG';
        if (p.isBot && now - P.t0 > 0.9) auto = true;
        if (auto) {
            const e = enemiesOf(p).filter(q => targetable(p, q) && dist(q.x, q.y, p.x, p.y) < 460).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0];
            const a = e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle, d = e ? Math.min(420, dist(p.x, p.y, e.x, e.y)) : 220;
            ruyiPerchLand(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
            const s = (p.skills || []).find(q => q.id === 'meleeTech'); if (s) s.cd = skillCooldown(p, s.id);
        }
    });
};
function r13Warp(o, f, e) {
    if (o.hp <= 0) return;
    let x = f.x, y = f.y;
    if (e) { const a = Math.atan2(e.y - o.y, e.x - o.x); x = e.x + Math.cos(a) * (e.radius + o.radius + 8); y = e.y + Math.sin(a) * (e.radius + o.radius + 8); }
    const s = umbFreeSpot(o, x, y);
    afterImages(o, o.x, o.y, s.x, s.y, 4, '#e2e8f0'); smoke(o.x, o.y, 5, 'rgba(226,232,240,0.35)', 14);
    o.x = s.x; o.y = s.y; o.st.ambush = Math.max(o.st.ambush || 0, 1); o.st.invuln = Math.max(o.st.invuln || 0, 0.2);
    ring(s.x, s.y, 4, 40, '#f1f5f9', 0.3, 3); AudioSys.playAt('whoosh', s.x, s.y, 0.4);
}
const _resetR13 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    const r = _resetR13(p);
    p.ruyiPerch = null; p.dinhT = 0; p.huntN = 0; p.shuN = 0; p.shuSeq = 0;
    for (let i = W13.length - 1; i >= 0; i--) if (W13[i].owner === p.id) W13.splice(i, 1);
    return r;
};

/* ============================== VẼ ============================== */
const ease13 = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
// ---- roi ----
function whipShape(f, o, pr) {
    const ext = pr < 0.42 ? ease13(pr / 0.42) : pr < 0.62 ? 1 : 1 - Math.pow((pr - 0.62) / 0.38, 2) * 0.94;
    const L = f.len * Math.max(0.05, ext), ca = Math.cos(f.a), sa = Math.sin(f.a), nx = -sa, ny = ca;
    const sx = o.x + ca * o.radius * 0.7, sy = o.y + sa * o.radius * 0.7 - (o.airH || 0);
    const wave = 1 - Math.min(1, pr / 0.55), side = f.side, slackK = pr > 0.62 ? (pr - 0.62) / 0.38 : 0;
    const pts = [], N = 30;
    for (let i = 0; i <= N; i++) {
        const s = i / N;
        const bend = side * 0.32 * L * wave * Math.sin(Math.PI * s) * (1 - 0.35 * s);           // quỹ đạo vung từ một bên
        const rip = (f.pull ? 0.45 : 1) * 11 * Math.sin(s * Math.PI * 3.2 - pr * 16) * s * (1 - pr);  // sóng chạy dọc thân
        const slack = -side * 18 * Math.sin(Math.PI * s) * slackK;                               // thu về: chùng xuống
        const lat = bend + rip + slack;
        pts.push({ x: sx + ca * L * s + nx * lat, y: sy + sa * L * s + ny * lat });
    }
    return pts;
}
function strokeSmooth(c, pts) {
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2; c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my); }
    const l = pts[pts.length - 1]; c.lineTo(l.x, l.y);
}
function drawWhip13(f, o, now) {
    if (f.side === undefined) { o._whipSide = -(o._whipSide || 1); f.side = o._whipSide; }
    const pr = Math.max(0, Math.min(1, 1 - f.t / f.maxT)), col = f.col || '#d6d3d1', glow = f.elec ? '#67e8f9' : col;
    const c = ctx; c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // vệt mờ lúc vung
    if (pr < 0.6) for (let g = 3; g >= 1; g--) {
        const gp = whipShape(f, o, Math.max(0, pr - g * 0.045));
        c.globalAlpha = 0.16 * (1 - g / 4) * (1 - pr / 0.6) + 0.04; c.strokeStyle = glow; c.lineWidth = 6 - g; strokeSmooth(c, gp); c.stroke();
    }
    c.globalAlpha = 1;
    const pts = whipShape(f, o, pr), N = pts.length - 1;
    if (f.elec) { // quầng điện + tia lởm chởm
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA('#67e8f9', 0.35 + 0.25 * Math.sin(now * 40)); c.lineWidth = 9; strokeSmooth(c, pts); c.stroke();
        c.strokeStyle = 'rgba(224,250,255,0.85)'; c.lineWidth = 1.2; c.beginPath();
        pts.forEach((q, i) => { const j = i % 2 ? 4 : -4; (i ? c.lineTo : c.moveTo).call(c, q.x + (Math.random() - 0.5) * 6, q.y + j * Math.random()); }); c.stroke(); c.restore();
    }
    // thân thon dần: viền tối + màu + ánh sáng
    for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < N; i++) {
            const s = i / N, wd = 4.6 * (1 - s) + 1.2;
            const a = pts[i], b = pts[i + 1], m0 = i ? { x: (pts[i - 1].x + a.x) / 2, y: (pts[i - 1].y + a.y) / 2 } : a, m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            c.beginPath(); c.moveTo(m0.x, m0.y); c.quadraticCurveTo(a.x, a.y, m1.x, m1.y);
            if (pass === 0) { c.strokeStyle = 'rgba(15,10,8,0.85)'; c.lineWidth = wd + 2.2; }
            else if (pass === 1) { c.strokeStyle = i % 4 < 2 ? col : shade13(col); c.lineWidth = wd; }
            else { c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = Math.max(0.6, wd * 0.28); }
            c.stroke();
        }
    }
    // cán roi
    const h0 = pts[0], h1 = pts[3]; c.strokeStyle = '#3f2a1d'; c.lineWidth = 6; c.beginPath(); c.moveTo(h0.x, h0.y); c.lineTo(h1.x, h1.y); c.stroke();
    c.strokeStyle = '#a16207'; c.lineWidth = 1.5; c.stroke();
    // đầu roi + tiếng nổ khi duỗi thẳng
    const tip = pts[N], pre = pts[N - 2], ta = Math.atan2(tip.y - pre.y, tip.x - pre.x);
    c.fillStyle = f.elec ? '#e0f2fe' : '#fef3c7'; c.beginPath(); c.arc(tip.x, tip.y, 2.4, 0, Math.PI * 2); c.fill();
    if (pr > 0.34 && pr < 0.66) {
        const k = 1 - Math.abs(pr - 0.48) / 0.16;
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 20 * k + 6); g.addColorStop(0, hexA(f.elec ? '#e0f2fe' : '#fffbeb', 0.95 * k)); g.addColorStop(0.5, hexA(glow, 0.45 * k)); g.addColorStop(1, hexA(glow, 0));
        c.fillStyle = g; c.beginPath(); c.arc(tip.x, tip.y, 20 * k + 6, 0, Math.PI * 2); c.fill();
        c.strokeStyle = hexA('#ffffff', 0.8 * k); c.lineWidth = 1.6;
        for (let r = 0; r < 6; r++) { const ra = ta + (r - 2.5) * 0.5, l0 = 5, l1 = 9 + 10 * k; c.beginPath(); c.moveTo(tip.x + Math.cos(ra) * l0, tip.y + Math.sin(ra) * l0); c.lineTo(tip.x + Math.cos(ra) * l1, tip.y + Math.sin(ra) * l1); c.stroke(); }
        c.strokeStyle = hexA(glow, 0.7 * k); c.lineWidth = 2; c.beginPath(); c.arc(tip.x, tip.y, 10 + 16 * (1 - k), ta - 0.9, ta + 0.9); c.stroke();
        c.restore();
        if (!f.cracked && pr > 0.44) { f.cracked = true; spark(tip.x, tip.y + (o.airH || 0), f.elec ? '#a5f3fc' : '#fde68a', 5, 200); }
    }
    c.restore();
}
function shade13(hex) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) * 0.72 | 0, g = ((n >> 8) & 255) * 0.72 | 0, b = (n & 255) * 0.72 | 0; return `rgb(${r},${g},${b})`; }
// ---- vật ném ----
function drawStar13(c, x, y, R, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? R * 0.32 : R, t = i * Math.PI / 4; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); } c.closePath();
    const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#f8fafc'); g.addColorStop(0.5, col); g.addColorStop(1, '#475569'); c.fillStyle = g; c.fill();
    c.lineWidth = 1; c.strokeStyle = 'rgba(15,23,42,0.8)'; c.stroke();
    c.fillStyle = '#1e293b'; c.beginPath(); c.arc(0, 0, R * 0.16, 0, Math.PI * 2); c.fill(); c.restore();
}
function drawBomb13(c, x, y, r, now, blink, rot) {
    c.save(); c.translate(x, y);
    const g = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r); g.addColorStop(0, '#64748b'); g.addColorStop(1, '#0f172a');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#020617'; c.stroke();
    c.rotate(rot || -0.7); c.fillStyle = '#475569'; c.fillRect(-2.5, -r - 3, 5, 4);
    c.strokeStyle = '#a8a29e'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -r - 3); c.quadraticCurveTo(4, -r - 8, 2, -r - 11); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,224,71,${0.6 + Math.random() * 0.4})`; c.beginPath(); c.arc(2, -r - 11, 2 + Math.random() * 1.5, 0, Math.PI * 2); c.fill();
    c.restore();
    if (blink) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(239,68,68,0.85)'; c.beginPath(); c.arc(x, y, r * 0.45, 0, Math.PI * 2); c.fill(); c.restore(); }
}
function drawBottle13(c, x, y, rot, s = 1) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = 'rgba(52,211,153,0.85)'; c.beginPath(); c.ellipse(0, 2, 5, 7, 0, 0, Math.PI * 2); c.fill(); c.lineWidth = 1; c.strokeStyle = '#064e3b'; c.stroke();
    c.fillStyle = 'rgba(249,115,22,0.9)'; c.fillRect(-4, 2, 8, 5);
    c.fillStyle = '#065f46'; c.fillRect(-2, -9, 4, 6); c.fillStyle = '#fef3c7'; c.fillRect(-1.5, -12, 3, 4);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(251,146,60,${0.6 + Math.random() * 0.4})`; c.beginPath(); c.arc(0, -14, 3 + Math.random() * 2, 0, Math.PI * 2); c.fill();
    c.restore();
}
const _drawW2FxR13 = drawW2Fx;
drawW2Fx = function (now) {
    const all = W2FX.slice(), whips = all.filter(f => f.kind === 'whip');
    if (whips.length) { W2FX.length = 0; all.forEach(f => { if (f.kind !== 'whip') W2FX.push(f); }); }
    try { _drawW2FxR13(now); } finally { if (whips.length) { W2FX.length = 0; all.forEach(f => W2FX.push(f)); } }
    whips.forEach(f => { const o = players.find(q => q.id === f.owner); if (o) drawWhip13(f, o, now); });
    const c = ctx; c.save();
    W13.forEach(f => {
        const o = players.find(q => q.id === f.owner);
        if (f.kind === 'bomb' || f.kind === 'fire') {
            const z = f.z || 0; c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(f.x, f.y + 4, 8 - Math.min(4, z / 30), 4 - Math.min(2, z / 60), 0, 0, Math.PI * 2); c.fill();
            if (f.kind === 'fire') { if (o && f.z > 0) { c.strokeStyle = 'rgba(251,146,60,0.25)'; c.lineWidth = 1.5; c.setLineDash([3, 5]); c.beginPath(); c.arc(f.x, f.y, 6, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); } drawBottle13(c, f.x, f.y - z, f.spin * 14, f.big ? 1.5 : 1); }
            else {
                const r = f.big ? 10 : f.sticky ? 6.5 : 7.5, blink = f.sticky ? (f.armed && Math.sin(now * (f.fuse < 0.5 ? 50 : 22)) > 0) : f.fuse < 0.45 && Math.sin(now * 40) > 0;
                drawBomb13(c, f.x, f.y - z, r, now, blink, f.flat ? Math.atan2(f.vy, f.vx) + Math.PI / 2 : f.spin * 6);
                if (!f.flat && f.fuse < 0.6) { c.strokeStyle = `rgba(239,68,68,${0.3 + 0.4 * (1 - f.fuse / 0.6)})`; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(f.x, f.y, f.R * (f.big ? 0.9 : 1), 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
                if (f.sticky && f.armed) { c.strokeStyle = `rgba(248,113,113,${0.25 + 0.35 * Math.sin(now * 20) ** 2})`; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, f.R, 0, Math.PI * 2); c.stroke(); }
            }
        } else if (f.kind === 'star') {
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(226,232,240,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - Math.cos(f.a) * 26, f.y - Math.sin(f.a) * 26); c.stroke(); c.restore();
            drawStar13(c, f.x, f.y, f.warp ? 8 : 6.5, f.spin * 30, f.warp ? '#a5b4fc' : '#cbd5e1');
        } else if (f.kind === 'bigstar') {
            c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(f.x, f.y, 4, f.x, f.y, 34); g.addColorStop(0, 'rgba(241,245,249,0.5)'); g.addColorStop(1, 'rgba(148,163,184,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 34, 0, Math.PI * 2); c.fill();
            c.strokeStyle = 'rgba(226,232,240,0.35)'; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, 24, f.spin * 24, f.spin * 24 + 2); c.stroke(); c.restore();
            drawStar13(c, f.x, f.y, 22, f.spin * 24, '#94a3b8');
        } else if (f.kind === 'dinh') {
            c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(f.x, f.y, 2, f.x, f.y, 20); g.addColorStop(0, 'rgba(254,249,195,0.95)'); g.addColorStop(1, 'rgba(250,204,21,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 20, 0, Math.PI * 2); c.fill();
            c.strokeStyle = 'rgba(250,204,21,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - Math.cos(f.a) * 40, f.y - Math.sin(f.a) * 40); c.stroke(); c.restore();
            c.fillStyle = '#78350f'; c.font = '900 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('定', f.x, f.y + 1);
        } else if (f.kind === 'pole') { // gậy thu về sau khi nhảy
            const k = f.t / f.T; c.save(); c.globalAlpha = k; c.translate(f.x, f.y); metal(c, -3, -78 * k, 6, 78 * k, '#7f1d1d', 2, 0.4); c.fillStyle = '#facc15'; c.fillRect(-4, -78 * k - 3, 8, 7); c.fillRect(-4, -4, 8, 6); c.restore();
        }
    });
    // gậy đang chống + người đứng trên đỉnh
    players.forEach(p => {
        const now2 = r13Now();
        if (p.ruyiPerch && p.hp > 0) {
            const h = p.airH || 0; c.save(); c.translate(p.x, p.y);
            c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 4, 10, 4, 0, 0, Math.PI * 2); c.fill();
            metal(c, -3, -h + p.radius * 0.6, 6, h - p.radius * 0.6 + 4, '#7f1d1d', 2, 0.45);
            c.fillStyle = '#facc15'; c.fillRect(-4.5, -4, 9, 7); c.fillRect(-4.5, -h + p.radius * 0.6 - 2, 9, 6);
            c.strokeStyle = `rgba(250,204,21,${0.3 + 0.25 * Math.sin(now * 6)})`; c.lineWidth = 2; c.setLineDash([4, 6]); c.lineDashOffset = -now * 20; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
            const left = Math.max(0, p.ruyiPerch.until - now2) / 2.5; c.strokeStyle = 'rgba(254,240,138,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(0, -h - p.radius - 10, 7, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2); c.stroke();
            c.restore();
        }
        if ((p.dinhT || 0) > now2 && p.hp > 0) { // ấn Định Thân
            const k = Math.min(1, (p.dinhT - now2) / (p.dinhMax || 1.2)); c.save(); c.translate(p.x, p.y);
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(250,204,21,${0.5 + 0.3 * k})`; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, p.radius + 10, 0, Math.PI * 2); c.stroke();
            c.rotate(now * 1.5); c.setLineDash([2, 6]); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, p.radius + 16, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
            c.globalCompositeOperation = 'source-over'; c.rotate(-now * 1.5);
            c.fillStyle = `rgba(254,240,138,${0.6 + 0.4 * k})`; c.font = '900 15px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('定', 0, -p.radius - 24);
            c.restore();
        }
        if ((p.huntT || 0) > now2 && p.huntN > 0 && p.hp > 0) { // Dấu Săn
            for (let i = 0; i < p.huntN; i++) { const t = -Math.PI / 2 + (i - (p.huntN - 1) / 2) * 0.32; c.fillStyle = p.huntN >= 4 ? '#ef4444' : '#fca5a5'; c.beginPath(); c.arc(p.x + Math.cos(t) * (p.radius + 9), p.y + Math.sin(t) * (p.radius + 9), 2.4, 0, Math.PI * 2); c.fill(); }
        }
        if ((p.shuT || 0) > now2 - 4 && p.shuN > 0 && p.hp > 0) { for (let i = 0; i < p.shuN; i++) drawStar13(c, p.x - 8 + i * 8, p.y + p.radius + 8, 3.5, 0.4, '#e2e8f0'); }
    });
    c.restore();
};

/* ============================== HÌNH CẦM TAY ============================== */
Object.assign(ART2, {
    BOMB: (c, w, r, x0, ch, now) => { drawBomb13(c, x0 + 6, 0, 6.5 + ch * 1.2, now, ch > 0.9 && Math.sin(now * 30) > 0, -0.6); MUZ.BOMB = x0 + 8; },
    FIREBOMBW: (c, w, r, x0, ch) => { drawBottle13(c, x0 + 6, 0, Math.PI / 2 + 0.2, 0.9 + ch * 0.15); MUZ.FIREBOMBW = x0 + 10; },
    SHURIKEN: (c, w, r, x0, ch, now) => { drawStar13(c, x0 + 6, 0, 5.5 + ch * 2.5, ch > 0.05 ? now * 20 : 0.4, '#cbd5e1'); if (w.mag > 1) drawStar13(c, x0 + 2, 5, 4, 0.8, '#94a3b8'); MUZ.SHURIKEN = x0 + 10; }
});
