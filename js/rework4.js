/** ==================== ĐA KHÍ CỤ (làm lại): 7 dạng × (Bậc Thầy + Trang Bị Phụ + Kỹ Thuật Cao) + chiêu chuyển dạng ====================
 *  Dạng: Khối · Kiếm · Súng · Bắn Tỉa (thay Cung) · Búa · Giáo · Pháo
 *  Dạng tầm xa có đạn riêng, KHÔNG nạp lại — hết đạn tự chuyển sang dạng kế tiếp (vào lại dạng đó thì đầy đạn).
 *  Nạp sau rework3.js.
 */
const W8 = [];
CUBE_FORMS[3] = { id: 'sniper', name: 'BẮN TỈA', icon: '🎯', type: 'GUN', range: 1000 };
CUBE_FORMS.push({ id: 'cannon', name: 'PHÁO', icon: '💣', type: 'GUN', range: 480 });
const CUBE_AMMO = { gun: 24, sniper: 4, cannon: 3 };
const cM = p => p.meleeMult || 1, cD = p => p.dmgMult || 1;
WEAPONS.MULTICUBE.desc = 'Khối biến hình 7 dạng: KHỐI (chắn đạn) · KIẾM · SÚNG · BẮN TỈA · BÚA · GIÁO · PHÁO. Giữ rồi thả: chuyển sang dạng kế tiếp và tung CHIÊU CHUYỂN DẠNG riêng. Dạng tầm xa không nạp đạn — hết đạn tự chuyển dạng. Bậc Thầy, Trang Bị Phụ, Kỹ Thuật Cao dùng được ở MỌI dạng, mỗi dạng một chiêu riêng.';

/* ---------- tiện ích ---------- */
function cubeTxt(p, s, col) { floatText(p.x, p.y - 46, s, col || '#67e8f9', 14); }
function cubeArc(p, a, R, half, dmg, o = {}) { const hit = arcFoes(p, a, R, half); hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: o.knock || 200, angle: Math.atan2(e.y - p.y, e.x - p.x) }); if (o.stun) e.stun = Math.max(e.stun, o.stun); }); return hit; }
function cubeAoe(p, x, y, R, dmg, o = {}) { enemiesOf(p).forEach(e => { if (e.air > 0 || dist(e.x, e.y, x, y) > R + e.radius) return; dealDamage(e, dmg, p.id, { melee: !o.gun, knock: o.knock || 250, angle: Math.atan2(e.y - y, e.x - x) }); if (o.stun) e.stun = Math.max(e.stun, o.stun); }); ring(x, y, 8, R, o.col || '#67e8f9', 0.4, 6); }
function cubeShot(p, a, o) { const m = muzzle(p, getCurrentWeapon(p), a); return spawnBullet(p, m.x, m.y, a, { speed: 26, damage: 10, range: 600, color: '#67e8f9', size: 3, trail: 30, ...o }); }
const cubeAim = (p, lo, hi) => Math.max(lo, Math.min(hi, p.skillDist || (lo + hi) / 2));

/* ---------- đòn đánh thường của các dạng tầm xa (tiêu hao đạn) ---------- */
function cubeUseAmmo(p, w, n) {
    const F = cubeForm(w); w.cubeAmmo = Math.max(0, (w.cubeAmmo === undefined ? CUBE_AMMO[F.id] : w.cubeAmmo) - n);
    if (w.cubeAmmo <= 0) p.shotQueue.push({ t: 0.3, fn: () => { if (getCurrentWeapon(p) === w && cubeForm(w).id === F.id && w.cubeAmmo <= 0) { floatText(p.x, p.y - 30, 'HẾT ĐẠN → CHUYỂN DẠNG', '#fbbf24', 12); cubeSetForm(p, w, (w.form || 0) + 1); } } });
}
const _cubeFireR4 = cubeFire;
cubeFire = function (p, w, ang, charge, mult) {
    const F = cubeForm(w);
    if (charge >= 0.9 || !CUBE_AMMO[F.id]) return _cubeFireR4(p, w, ang, charge, mult);
    if (w.cubeAmmo === undefined) w.cubeAmmo = CUBE_AMMO[F.id];
    if (w.cubeAmmo <= 0) { cubeSetForm(p, w, (w.form || 0) + 1); return; }
    if (F.id === 'gun') {
        meleeBook(p, w, ang, 16); const bnc = p.cubeBounce > 0; if (bnc) p.cubeBounce--;
        for (let i = 0; i < 3; i++) p.shotQueue.push({ t: i * 0.06, fn: () => { if (p.hp <= 0) return; cubeShot(p, p.angle + (Math.random() - 0.5) * 0.06, { speed: 24, damage: 9 * cD(p) * mult * (bnc ? 1.2 : 1), range: 520, size: 2.8, trail: 26, bounces: bnc ? 2 : 0, color: bnc ? '#fde047' : '#67e8f9' }); p.muzzle = 0.04; AudioSys.playAt('smg', p.x, p.y, 0.15); } });
        cubeUseAmmo(p, w, 3);
    } else if (F.id === 'sniper') {
        meleeBook(p, w, ang, 48); const k = (p.cubeSnipe || 1) * mult; p.cubeSnipe = 0; const crit = p.cubeCrit; p.cubeCrit = false;
        if (p.cubeWallShot) { // đạn xuyên tường: tia bỏ qua vật cản
            p.cubeWallShot = false; const m = muzzle(p, w, ang), ex = m.x + Math.cos(ang) * 1100, ey = m.y + Math.sin(ang) * 1100;
            beams.push({ x1: m.x, y1: m.y, x2: ex, y2: ey, life: 0.35, maxLife: 0.35, color: '#a5f3fc' });
            enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, m.x, m.y, ex, ey) < e.radius + 14) { dealDamage(e, 70 * cD(p) * k * (crit ? 2 : 1), p.id, { knock: 300, angle: ang }); spotFor(e, p.id, 3); if (crit) e.stun = Math.max(e.stun, 0.6); } });
        } else { const b = cubeShot(p, ang, { speed: 60, damage: 55 * cD(p) * k * (crit ? 2 : 1), range: 1100, size: 4, trail: 90, pierce: true, color: crit ? '#fde047' : '#e0f2fe' }); if (crit && b) b.stunOnHit = 0.6; }
        addShake(4); AudioSys.playAt('rail', p.x, p.y, 0.5); p.muzzle = 0.06; cubeUseAmmo(p, w, 1);
    } else if (F.id === 'cannon') {
        meleeBook(p, w, ang, 40); const tg = enemiesOf(p).filter(e => e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 520 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.35).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0];
        const d = Math.max(120, Math.min(480, (p.manualEngaged && p.aimDist) || (tg ? dist(tg.x, tg.y, p.x, p.y) : 320))), s = rayFree(p.x, p.y, ang, d);
        const x = p.x + Math.cos(ang) * s.d, y = p.y + Math.sin(ang) * s.d;
        W8.push({ kind: 'shell', owner: p.id, x0: p.x, y0: p.y, x, y, t: 0.45, T: 0.45 }); dropBomb(p, x, y, 40 * cD(p) * mult, 85, 0.45);
        p.kx -= Math.cos(ang) * 60; p.ky -= Math.sin(ang) * 60; AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); addShake(3); cubeUseAmmo(p, w, 1);
    }
};
// vào lại dạng tầm xa → đầy đạn; chiêu chuyển dạng
const _cubeSetFormR4 = cubeSetForm;
cubeSetForm = function (p, w, i) {
    _cubeSetFormR4(p, w, i); const F = cubeForm(w);
    w.cubeAmmo = CUBE_AMMO[F.id];
    if (p.hp > 0 && !(p.cubeEntryT > world.time)) { p.cubeEntryT = world.time + 1.2; try { CUBE_SK[F.id].E(p, w); } catch (e) { console.error(e); } }
};

/* ---------- 7 dạng × 4 chiêu: E = chuyển dạng · M = Bậc Thầy · G = Trang Bị Phụ · H = Kỹ Thuật Cao ---------- */
const CUBE_SK = {
    cube: {
        E: p => { p.st.shield = Math.min(90, (p.st.shield || 0) + 40); p.st.shieldT = Math.max(p.st.shieldT || 0, 3); cubeAoe(p, p.x, p.y, 110, 14 * cM(p), { knock: 320 }); cubeTxt(p, '🧊 KHỐI THÀNH'); },
        M: ['KHỐI LĂN', p => { const a = aimDir(p); W8.push({ kind: 'roll', owner: p.id, x: p.x, y: p.y, a, d: 0, max: 440, hit: new Set(), t: 2, T: 2 }); AudioSys.playAt('slam', p.x, p.y, 0.3); }],
        G: ['LÁ CHẮN PHẢN XẠ', p => { p.cubeReflT = world.time + 2.5; p.st.shield = Math.min(90, (p.st.shield || 0) + 25); p.st.shieldT = Math.max(p.st.shieldT || 0, 2.5); }],
        H: ['KHỐI NỔ', p => { for (let i = 0; i < 10; i++) W5FX.push({ kind: 'mdBlade', owner: p.id, x: p.x, y: p.y, a: i * Math.PI / 5, sp: 720, d: 0, max: 280, dmg: 24 * cM(p), t: 0.85, maxT: 0.85, cube: true }); addShake(6); AudioSys.playAt('explosion', p.x, p.y, 0.4); }]
    },
    sword: {
        E: p => { const a = p.angle; p.dashTime = 0.14; p.dashAngle = a; p.shotQueue.push({ t: 0.14, fn: () => { slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 110 + p.radius, color: '#a5f3fc', width: 11, life: 0.22, maxLife: 0.22, swing: 1, line: false }); cubeArc(p, a, 110, 1.2, 26 * cM(p)); } }); cubeTxt(p, '⚔️ BẠT KIẾM'); },
        M: ['KIẾM ẢNH TAM LIÊN', p => { const done = new Set(); for (let k = 0; k < 3; k++) p.shotQueue.push({ t: k * 0.17, fn: () => { if (p.hp <= 0) return; const e = enemiesOf(p).filter(q => !done.has(q.id) && !(q.air > 0) && dist(q.x, q.y, p.x, p.y) < 300 && targetable(p, q)).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0] || (k === 0 ? null : enemiesOf(p).find(q => done.has(q.id) && q.hp > 0 && dist(q.x, q.y, p.x, p.y) < 300)); const a = e ? Math.atan2(e.y - p.y, e.x - p.x) : aimDir(p); const s = e ? umbFreeSpot(p, e.x - Math.cos(a) * (e.radius + p.radius + 6), e.y - Math.sin(a) * (e.radius + p.radius + 6)) : umbFreeSpot(p, p.x + Math.cos(a) * 120, p.y + Math.sin(a) * 120); afterImages(p, p.x, p.y, s.x, s.y, 4, '#a5f3fc'); p.x = s.x; p.y = s.y; p.angle = a; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 100 + p.radius, color: '#e0f2fe', width: 10, life: 0.18, maxLife: 0.18, swing: k % 2 ? -1 : 1, line: false }); cubeArc(p, a, 100, 1.1, 32 * cM(p)).forEach(q => done.add(q.id)); AudioSys.playAt('swing', p.x, p.y, 0.5); } }); p.st.invuln = Math.max(p.st.invuln || 0, 0.5); }],
        G: ['PHI KIẾM', p => { const a = aimDir(p); [-0.15, 0, 0.15].forEach(o => htBullet(p, a + o, { damage: 24 * cD(p), speed: 28, size: 5, pierce: true, color: '#e0f2fe', life: 0.7, trail: 50 })); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }],
        H: ['THIÊN KIẾM TRẬN', p => { const a = aimDir(p), d = cubeAim(p, 100, 380), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d; zones.push({ type: 'artyWarn', x: cx, y: cy, r: 140, t: 0.5, maxT: 0.5, owner: p.id, tick: 0 }); for (let i = 0; i < 12; i++) p.shotQueue.push({ t: 0.5 + i * 0.05, fn: () => { const r = Math.sqrt(Math.random()) * 140, t = Math.random() * 6.28, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; W8.push({ kind: 'fallSword', owner: p.id, x, y, t: 0.25, T: 0.25 }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < e.radius + 32) dealDamage(e, 16 * cM(p), p.id, { melee: true, knock: 1 }); }); } }); p.shotQueue.push({ t: 1.15, fn: () => { cubeAoe(p, cx, cy, 140, 40 * cM(p), { knock: 380, stun: 0.5 }); addShake(7); AudioSys.playAt('slam', cx, cy, 0.6); } }); }]
    },
    gun: {
        E: p => { const a = p.angle; for (let i = -2; i <= 2; i++) cubeShot(p, a + i * 0.12, { damage: 10 * cD(p), range: 420 }); AudioSys.playAt('shotgun', p.x, p.y, 0.4); cubeTxt(p, '🔫 XẢ MỞ MÀN'); },
        M: ['BÁNG SÚNG', p => { const a = aimDir(p); p.dashTime = 0.1; p.dashAngle = a; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 90 + p.radius, color: '#67e8f9', width: 12, life: 0.18, maxLife: 0.18, swing: 1, line: false }); cubeArc(p, a, 95, 1.0, 30 * cM(p), { knock: 420, stun: 0.45 }); hitStop(0.05); AudioSys.playAt('block', p.x, p.y, 0.5); }],
        G: ['ĐẠN NẢY', p => { p.cubeBounce = 5; cubeTxt(p, '🟡 5 LOẠT ĐẠN NẢY', '#fde047'); }],
        H: ['XOÁY ĐẠN', p => { p.st.root = Math.max(p.st.root || 0, 1.2); for (let i = 0; i < 30; i++) p.shotQueue.push({ t: i * 0.04, fn: () => { if (p.hp <= 0) return; const a = p.angle + i * 0.42; p.angle = a; cubeShot(p, a, { damage: 9 * cD(p), range: 460, size: 2.8 }); AudioSys.playAt('smg', p.x, p.y, 0.12); } }); }]
    },
    sniper: {
        E: p => { const e = enemiesOf(p).filter(q => q.hp > 0 && dist(q.x, q.y, p.x, p.y) < 900).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0]; if (e) { spotFor(e, p.id, 3); floatText(e.x, e.y - 44, '🎯 ĐỊNH VỊ', '#e0f2fe', 12); } p.cubeSnipe = 1.5; cubeTxt(p, '🎯 ĐỊNH VỊ · phát kế ×1.5'); },
        M: ['LÙI NGẮM', p => { const a = aimDir(p), s = umbFreeSpot(p, p.x - Math.cos(a) * 170, p.y - Math.sin(a) * 170); startTravel(p, s.x, s.y, 0.28, null, null, 30); p.cubeCrit = true; cubeTxt(p, '🎯 phát kế CHÍ MẠNG ×2 + choáng', '#fde047'); }],
        G: ['ĐẠN XUYÊN TƯỜNG', p => { p.cubeWallShot = true; const w = getCurrentWeapon(p); if (cubeForm(w).id === 'sniper') w.cubeAmmo = Math.max(1, w.cubeAmmo || 0); cubeTxt(p, '🧱 phát kế XUYÊN TƯỜNG', '#a5f3fc'); }],
        H: ['TIA HỘI TỤ', p => { const a0 = aimDir(p); p.st.root = Math.max(p.st.root || 0, 0.6); W8.push({ kind: 'charge', owner: p.id, a: a0, t: 0.5, T: 0.5 }); p.shotQueue.push({ t: 0.5, fn: () => { if (p.hp <= 0) return; const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a), ex = m.x + Math.cos(a) * 1100, ey = m.y + Math.sin(a) * 1100; [-1, 0, 1].forEach(k => beams.push({ x1: m.x + Math.sin(a) * k * 8, y1: m.y - Math.cos(a) * k * 8, x2: ex, y2: ey, life: 0.4, maxLife: 0.4, color: k ? '#67e8f9' : '#f0f9ff' })); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, m.x, m.y, ex, ey) < e.radius + 26) { dealDamage(e, 110 * cD(p), p.id, { knock: 450, angle: a }); spotFor(e, p.id, 4); } }); addShake(9); AudioSys.playAt('rail', p.x, p.y, 0.8); p.kx -= Math.cos(a) * 200; p.ky -= Math.sin(a) * 200; } }); }]
    },
    hammer: {
        E: p => { const a = p.angle, s = umbFreeSpot(p, p.x + Math.cos(a) * 130, p.y + Math.sin(a) * 130); startTravel(p, s.x, s.y, 0.3, null, null, 60); p.shotQueue.push({ t: 0.31, fn: () => { cubeAoe(p, p.x, p.y, 100, 30 * cM(p), { knock: 300, stun: 0.5 }); addShake(6); AudioSys.playAt('slam', p.x, p.y, 0.5); } }); cubeTxt(p, '🔨 BÚA GIÁNG'); },
        M: ['ĐỊA CHẤN TAM TRÙNG', p => { const a = aimDir(p); [70, 150, 230].forEach((d, k) => p.shotQueue.push({ t: k * 0.15, fn: () => { const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; cubeAoe(p, x, y, 75, 26 * cM(p), { knock: 260, stun: 0.35 }); W8.push({ kind: 'crack', owner: p.id, x, y, t: 0.7, T: 0.7 }); addShake(4); AudioSys.playAt('slam', x, y, 0.4); } })); }],
        G: ['NÉM BÚA', p => { const a = aimDir(p), d = cubeAim(p, 120, 380), s = rayFree(p.x, p.y, a, d); W8.push({ kind: 'hammer', owner: p.id, x: p.x, y: p.y, tx: p.x + Math.cos(a) * s.d, ty: p.y + Math.sin(a) * s.d, back: false, hit: new Set(), t: 3, T: 3 }); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }],
        H: ['BÚA TRỜI', p => { const a = aimDir(p), d = cubeAim(p, 60, 300), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); zones.push({ type: 'artyWarn', x: s.x, y: s.y, r: 170, t: 0.7, maxT: 0.7, owner: p.id, tick: 0 }); startTravel(p, s.x, s.y, 0.7, null, null, 170); p.st.invuln = Math.max(p.st.invuln || 0, 0.7); p.shotQueue.push({ t: 0.71, fn: () => { if (p.hp <= 0) return; cubeAoe(p, p.x, p.y, 170, 70 * cM(p), { knock: 450, stun: 1 }); W8.push({ kind: 'crack', owner: p.id, x: p.x, y: p.y, t: 1, T: 1, big: true }); addShake(14); hitStop(0.08); AudioSys.playAt('explosion', p.x, p.y, 0.6); } }); }]
    },
    spear: {
        E: p => { htBullet(p, p.angle, { damage: 32 * cD(p), speed: 30, size: 5, pierce: true, color: '#a5f3fc', life: 0.6, trail: 60 }); cubeTxt(p, '🔱 PHÓNG THƯƠNG'); AudioSys.playAt('whoosh', p.x, p.y, 0.4); },
        M: ['THƯƠNG LONG XUYÊN', p => { const a = aimDir(p), x0 = p.x, y0 = p.y; p.dashTime = 0.36; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln || 0, 0.3); p.shotQueue.push({ t: 0.37, fn: () => { afterImages(p, x0, y0, p.x, p.y, 5, '#67e8f9'); slashes.push({ x: x0, y: y0, ownerId: p.id, angle: a, range: dist(x0, y0, p.x, p.y) + 40, color: '#a5f3fc', width: 9, life: 0.25, maxLife: 0.25, swing: 1, line: true }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, x0, y0, p.x, p.y) < e.radius + 26) { const side = a + (angleDiff(Math.atan2(e.y - y0, e.x - x0), a) > 0 ? 1.57 : -1.57); dealDamage(e, 42 * cM(p), p.id, { melee: true, knock: 320, angle: side }); } }); AudioSys.playAt('crit', p.x, p.y, 0.4); } }); }],
        G: ['LAO MÓC', p => { const a = aimDir(p); W8.push({ kind: 'hook', owner: p.id, x: p.x, y: p.y, a, d: 0, max: 460, t: 2, T: 2 }); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }],
        H: ['BÁCH THƯƠNG', p => { const a0 = aimDir(p); p.st.root = Math.max(p.st.root || 0, 1.2); for (let i = 0; i < 12; i++) p.shotQueue.push({ t: i * 0.08, fn: () => { if (p.hp <= 0) return; const a = a0 + (Math.random() - 0.5) * 0.5; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 180, color: '#a5f3fc', width: 5, life: 0.1, maxLife: 0.1, swing: 1, line: true }); lineFoes(p, a, 180, 20).forEach(e => dealDamage(e, 9 * cM(p), p.id, { melee: true, knock: 40, angle: a })); AudioSys.playAt('swing', p.x, p.y, 0.2); } }); p.shotQueue.push({ t: 1.0, fn: () => { if (p.hp <= 0) return; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a0, range: 220, color: '#f0f9ff', width: 12, life: 0.22, maxLife: 0.22, swing: 1, line: true }); lineFoes(p, a0, 220, 30).forEach(e => { dealDamage(e, 40 * cM(p), p.id, { melee: true, knock: 520, angle: a0 }); e.stun = Math.max(e.stun, 0.4); }); addShake(6); hitStop(0.05); } }); }]
    },
    cannon: {
        E: p => { const a = p.angle; explode(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, p.id, 22 * cD(p), 80); p.kx -= Math.cos(a) * 260; p.ky -= Math.sin(a) * 260; cubeTxt(p, '💣 PHÁO LÙI'); },
        M: ['PHÁO CẬN', p => { const a = aimDir(p); cubeArc(p, a, 150, 0.6, 50 * cM(p), { knock: 700 }); for (let i = 0; i < 14; i++) particles.push({ x: p.x, y: p.y, vx: Math.cos(a + (Math.random() - 0.5) * 1.1) * 520, vy: Math.sin(a + (Math.random() - 0.5) * 1.1) * 520, life: 0.4, maxLife: 0.4, color: i % 2 ? '#fdba74' : '#67e8f9', size: 6, drag: 0.9 }); smoke(p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 40, 6, 'rgba(100,116,139,0.45)', 18); addShake(8); AudioSys.playAt('explosion', p.x, p.y, 0.5); }],
        G: ['PHÁO CHÙM', p => { const a = aimDir(p), d = cubeAim(p, 150, 420); [-0.2, 0, 0.2].forEach((o, k) => { const x = p.x + Math.cos(a + o) * d, y = p.y + Math.sin(a + o) * d; W8.push({ kind: 'shell', owner: p.id, x0: p.x, y0: p.y, x, y, t: 0.55 + k * 0.08, T: 0.55 + k * 0.08 }); dropBomb(p, x, y, 35 * cD(p), 80, 0.55 + k * 0.08); }); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); }],
        H: ['PHÁO KÍCH LIÊN HOÀN', p => { const a = aimDir(p), d = cubeAim(p, 150, 450), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d; for (let i = 0; i < 7; i++) { const r = i ? 60 + Math.random() * 100 : 0, t = Math.random() * 6.28, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; W8.push({ kind: 'shell', owner: p.id, x0: p.x, y0: p.y, x, y, t: 0.6 + i * 0.18, T: 0.6 + i * 0.18 }); dropBomb(p, x, y, 45 * cD(p), 90, 0.6 + i * 0.18); } AudioSys.playAt('shoot_heavy', p.x, p.y, 0.6); }]
    }
};
const cubeSk = (p, k) => { const w = getCurrentWeapon(p), F = cubeForm(w), S = CUBE_SK[F.id][k]; cubeTxt(p, `${F.icon} ${S[0]}`, '#a5f3fc'); S[1](p, w); };

/* ---------- móc vào hệ thống: dùng được cả 3 kỹ năng ở mọi dạng ---------- */
const _castSkillR4 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (w && w.id === 'MULTICUBE' && s && (s.id === 'meleeTech' || s.id === 'gunMod')) { const t0 = w.type; w.type = s.id === 'meleeTech' ? 'MELEE' : 'GUN'; try { return _castSkillR4(p, slot, aimVec); } finally { w.type = cubeForm(w).type || t0; } }
    return _castSkillR4(p, slot, aimVec);
};
const _meleeTechR4 = meleeTechCast; meleeTechCast = function (p) { if (getCurrentWeapon(p).id === 'MULTICUBE') return cubeSk(p, 'M'); return _meleeTechR4(p); };
const _gunModR4 = gunModCast; gunModCast = function (p) { if (getCurrentWeapon(p).id === 'MULTICUBE') return cubeSk(p, 'G'); return _gunModR4(p); };
HT.MULTICUBE = ['ĐA HÌNH TUYỆT KỸ', p => cubeSk(p, 'H')];
const _skillProfileR4 = skillProfile;
const CUBE_PROF = {
    cube: { M: { aim: 'dir', R: 440, shape: 'line', w: 40 }, G: { aim: null, shape: 'selfaoe', aoe: 60 }, H: { aim: null, shape: 'selfaoe', aoe: 280 } },
    sword: { M: { aim: null, shape: 'selfaoe', aoe: 300 }, G: { aim: 'dir', R: 520, shape: 'cone', half: 0.2 }, H: { aim: 'point', R: 380, shape: 'point', aoe: 140, arc: true } },
    gun: { M: { aim: 'dir', R: 120, shape: 'cone', half: 1.0 }, G: { aim: null, shape: 'self', aoe: 30 }, H: { aim: null, shape: 'selfaoe', aoe: 460 } },
    sniper: { M: { aim: 'dir', R: 170, shape: 'line', w: 30 }, G: { aim: null, shape: 'self', aoe: 30 }, H: { aim: 'dir', R: 1100, shape: 'line', w: 52 } },
    hammer: { M: { aim: 'dir', R: 300, shape: 'line', w: 150 }, G: { aim: 'point', R: 380, shape: 'point', aoe: 110, arc: true }, H: { aim: 'point', R: 300, shape: 'point', aoe: 170, arc: true } },
    spear: { M: { aim: 'dir', R: 260, shape: 'line', w: 52 }, G: { aim: 'dir', R: 460, shape: 'line', w: 24 }, H: { aim: 'dir', R: 220, shape: 'cone', half: 0.3 } },
    cannon: { M: { aim: 'dir', R: 150, shape: 'cone', half: 0.6 }, G: { aim: 'point', R: 420, shape: 'point', aoe: 120, arc: true }, H: { aim: 'point', R: 450, shape: 'point', aoe: 200, arc: true } }
};
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'MULTICUBE') { const F = cubeForm(w), k = id === 'meleeTech' ? 'M' : id === 'gunMod' ? 'G' : id === 'hightech' ? 'H' : null; if (k) return { ...CUBE_PROF[F.id][k], col: '103,232,249', tag: `${F.icon} ${CUBE_SK[F.id][k][0]}` }; }
    return _skillProfileR4(p, id);
};
const _ammoTextR4 = ammoText;
ammoText = function (w) { if (w && w.id === 'MULTICUBE') { const F = cubeForm(w); return CUBE_AMMO[F.id] ? `${F.icon} ${w.cubeAmmo === undefined ? CUBE_AMMO[F.id] : w.cubeAmmo}/${CUBE_AMMO[F.id]}` : `${F.icon} ${F.name}`; } return _ammoTextR4(w); };
MELEE_P.MULTICUBE = 'Mỗi lần biến dạng nhận 35 khiên thay vì 20.';
const _resetRoundR4 = resetPlayerForRound;
resetPlayerForRound = function (p) { for (let i = W8.length - 1; i >= 0; i--) if (W8[i].owner === p.id) W8.splice(i, 1); p.cubeBounce = 0; p.cubeSnipe = 0; p.cubeCrit = false; p.cubeWallShot = false; p.cubeReflT = 0; p.cubeEntryT = 0; return _resetRoundR4(p); };

const _upeR4 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR4(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => { // lá chắn phản xạ
        if (p.hp <= 0 || !(p.cubeReflT > world.time)) return;
        for (const b of bullets) { if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > p.radius + 40 || Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 1.1) continue; b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = Math.max(b.life || 0, 0.8); b.color = '#67e8f9'; spark(b.x, b.y, '#a5f3fc', 4, 140); }
    });
    for (let i = W8.length - 1; i >= 0; i--) {
        const f = W8[i], o = players.find(q => q.id === f.owner); if (!o || o.hp <= 0) { W8.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'roll') { const st = 620 * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st; enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 22) { f.hit.add(e.id); dealDamage(e, 30 * cM(o), o.id, { melee: true, knock: 340, angle: f.a }); e.stun = Math.max(e.stun, 0.6); } }); if (f.d >= f.max || pointInObstacle(f.x, f.y, 10)) { ring(f.x, f.y, 6, 60, '#67e8f9', 0.3, 4); W8.splice(i, 1); } continue; }
        if (f.kind === 'hammer') {
            const tx = f.back ? o.x : f.tx, ty = f.back ? o.y : f.ty, d = dist(f.x, f.y, tx, ty), sp = 760 * dt;
            if (d <= sp + (f.back ? o.radius : 0)) { if (f.back) { W8.splice(i, 1); continue; } f.x = tx; f.y = ty; f.back = true; f.hit.clear(); cubeAoe(o, f.x, f.y, 110, 36 * cM(o), { knock: 300, stun: 0.8 }); addShake(6); AudioSys.playAt('slam', f.x, f.y, 0.5); continue; }
            f.x += (tx - f.x) / d * sp; f.y += (ty - f.y) / d * sp;
            if (f.back) enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 16) { f.hit.add(e.id); dealDamage(e, 14 * cM(o), o.id, { melee: true, knock: 120 }); } });
            continue;
        }
        if (f.kind === 'hook') {
            if (f.caught) { const e = players.find(q => q.id === f.caught); if (!e || e.hp <= 0) { W8.splice(i, 1); continue; } const a = Math.atan2(o.y - e.y, o.x - e.x), d = dist(e.x, e.y, o.x, o.y), sp = 900 * dt; if (d < o.radius + e.radius + 14) { W8.splice(i, 1); continue; } e.x += Math.cos(a) * Math.min(sp, d); e.y += Math.sin(a) * Math.min(sp, d); f.x = e.x; f.y = e.y; continue; }
            const st = 1100 * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 10);
            if (e) { f.caught = e.id; dealDamage(e, 20 * cM(o), o.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.6); floatText(e.x, e.y - 44, '🪝 MÓC!', '#67e8f9', 13); AudioSys.playAt('crit', e.x, e.y, 0.4); }
            else if (f.d >= f.max || pointInObstacle(f.x, f.y, 4)) W8.splice(i, 1);
            continue;
        }
        if (f.t <= 0) W8.splice(i, 1);
    }
};

/* ---------- hình vẽ ---------- */
const _artCubeR4 = ART2.MULTICUBE;
ART2.MULTICUBE = (c, w, r, x0, ch, now, p) => {
    const F = cubeForm(w), glow = `rgba(103,232,249,${0.5 + Math.sin(now * 5) * 0.25})`;
    const cube = (x, s) => { c.fillStyle = '#0e7490'; c.fillRect(x - s, -s, s * 2, s * 2); c.strokeStyle = glow; c.lineWidth = 1.2; c.strokeRect(x - s, -s, s * 2, s * 2); };
    if (F.id === 'sniper') { cube(x0 - 4, 5); metal(c, x0, -2, 36, 4, '#155e75', 1.2); metal(c, x0 + 8, -6, 12, 3.5, '#0e7490', 1); c.fillStyle = glow; c.fillRect(x0 + 4, -0.6, 30, 1.2); c.fillStyle = '#a5f3fc'; c.beginPath(); c.arc(x0 + 20, -4.2, 1.4, 0, Math.PI * 2); c.fill(); MUZ.MULTICUBE = x0 + 38; return; }
    if (F.id === 'cannon') { cube(x0 - 3, 6); metal(c, x0 + 2, -5, 22, 10, '#155e75', 2); c.fillStyle = '#082f49'; c.beginPath(); c.arc(x0 + 24, 0, 4, 0, Math.PI * 2); c.fill(); c.strokeStyle = glow; c.lineWidth = 1.4; c.beginPath(); c.arc(x0 + 24, 0, 5, 0, Math.PI * 2); c.stroke(); MUZ.MULTICUBE = x0 + 26; return; }
    return _artCubeR4(c, w, r, x0, ch, now, p);
};
const _drawW2FxR4 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR4(now);
    ctx.save();
    W8.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T;
        if (f.kind === 'roll') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 14); ctx.fillStyle = '#0e7490'; ctx.fillRect(-14, -14, 28, 28); ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 2; ctx.strokeRect(-14, -14, 28, 28); ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'hammer') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 18); ctx.fillStyle = '#155e75'; ctx.fillRect(-2, -16, 4, 26); ctx.fillStyle = '#0e7490'; ctx.fillRect(-11, -22, 22, 12); ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 1.5; ctx.strokeRect(-11, -22, 22, 12); ctx.restore(); }
        else if (f.kind === 'hook') { ctx.strokeStyle = 'rgba(165,243,252,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(f.x, f.y); ctx.stroke(); ctx.setLineDash([]); ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.caught ? Math.atan2(f.y - o.y, f.x - o.x) : f.a); ctx.fillStyle = '#a5f3fc'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -6); ctx.lineTo(-1, 0); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'shell') { const k = Math.min(1, u), x = f.x0 + (f.x - f.x0) * k, y = f.y0 + (f.y - f.y0) * k - Math.sin(k * Math.PI) * 90; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(f.x0 + (f.x - f.x0) * k, f.y0 + (f.y - f.y0) * k, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0e7490'; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 6, y - 6, 12, 12); }
        else if (f.kind === 'fallSword') { const y = f.y - (1 - u) * 160; ctx.save(); ctx.globalAlpha = 1 - Math.max(0, u - 0.7) / 0.3; ctx.translate(f.x, y); ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(-2.5, -34); ctx.lineTo(2.5, -34); ctx.lineTo(2, 0); ctx.lineTo(0, 8); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#0e7490'; ctx.fillRect(-7, -36, 14, 3); ctx.restore(); if (u > 0.9) { ctx.strokeStyle = 'rgba(165,243,252,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 14, 0, Math.PI * 2); ctx.stroke(); } }
        else if (f.kind === 'charge') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(103,232,249,${0.3 + u * 0.6})`; ctx.lineWidth = 1 + u * 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(f.a) * 1100, o.y + Math.sin(f.a) * 1100); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(224,242,254,${u})`; ctx.beginPath(); ctx.arc(o.x + Math.cos(f.a) * 30, o.y + Math.sin(f.a) * 30, 3 + u * 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'crack') { const k = 1 - u, R = f.big ? 60 : 32; ctx.strokeStyle = `rgba(8,47,73,${0.8 * k})`; ctx.lineWidth = 2.5; for (let j = 0; j < 7; j++) { let a = j * 0.9, x = f.x, y = f.y; ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 4; s++) { a += Math.sin(j * 4 + s * 2) * 0.5; x += Math.cos(a) * R / 4; y += Math.sin(a) * R / 4; ctx.lineTo(x, y); } ctx.stroke(); } ctx.strokeStyle = `rgba(103,232,249,${0.5 * k})`; ctx.lineWidth = 1; ctx.stroke(); }
    });
    players.forEach(p => { if (p.hp > 0 && p.cubeReflT > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(103,232,249,${0.5 + Math.sin(now * 12) * 0.25})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 30, p.angle - 1.1, p.angle + 1.1); ctx.stroke(); ctx.restore(); } });
    ctx.restore();
};
