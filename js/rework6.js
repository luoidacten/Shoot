/** ==================== KATANA (xoay chém cuối) · SÚNG GIẢM THANH · LỰU ĐẠN ĐIỆN TỪ · NỎ NỔ · VẠN TƯỢNG ====================
 *  Nạp sau rework5.js.
 */
const W10 = [];
const vM = p => p.meleeMult || 1, vD = p => p.dmgMult || 1;
let R6tgt = null, R6at = -1, R6atk = -1;

/* ============================== 1) KATANA: lướt lần 2 kết thúc bằng xoay kiếm chém tròn ============================== */
const _katFireR6 = katFire;
katFire = function (p, w, ang, charge, mult) {
    const second = charge >= 0.9 && p.katDashT > world.time;
    _katFireR6(p, w, ang, charge, mult);
    if (!second) return;
    p.shotQueue.push({ t: 0.17, fn: () => {
        if (p.hp <= 0) return;
        W10.push({ kind: 'katSpin', owner: p.id, t: 0.35, T: 0.35 });
        enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 118 + e.radius) { dealDamage(e, w.damage * vM(p) * mult * 0.85, p.id, { melee: true, knock: e.air > 0 ? 1 : 300, angle: Math.atan2(e.y - p.y, e.x - p.x) }); spark(e.x, e.y, '#e0f2fe', 8, 240); } });
        for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 120) bullets.splice(i, 1); }
        AudioSys.playAt('swing', p.x, p.y, 0.7); hitStop(0.05); addShake(5); floatText(p.x, p.y - 44, '⚔ XOAY KIẾM!', '#e0f2fe', 14);
    } });
};

/* ============================== 2) SÚNG GIẢM THANH: buff ============================== */
Object.assign(WEAPONS.SPISTOL, { damage: 21, fireRate: 16, magSize: 10, mag: 10, reserve: 30, range: 430, reloadTime: 1.2 });
Object.assign(WEAPONS.SAR, { damage: 12, magSize: 6, mag: 6, reserve: 12, range: 380, spread: 0.16, reloadTime: 1.3 });
WEAPONS.SPISTOL.desc = 'Không lộ tiếng, không vệt đạn. Sau 1.5 giây không bắn: phát kế CHÍ MẠNG ×1.8 và làm chậm.';
WEAPONS.SAR.desc = 'Bắn chùm 7 viên giảm thanh, không lộ tiếng. Bắn trúng kẻ đang quay lưng: +40% sát thương.';

/* ============================== 3) LỰU ĐẠN ĐIỆN TỪ: buff mạnh ============================== */
Object.assign(WEAPONS.EMPGREN, { magSize: 3, mag: 3, range: 360 });
WEAPONS.EMPGREN.desc = 'BÃO ĐIỆN TỪ bán kính 230 trong 5 giây: nổ 45 sát thương + CHOÁNG 1.2 giây, xoá sạch khiên, phá đạn bay vào, lộ vị trí; ai đứng trong bão bị khoá kỹ năng, chậm 50% và giật điện liên tục.';
const _landSkillItemR6 = landSkillItem;
landSkillItem = function (it) {
    if (it.type.id !== 'EMPGREN') return _landSkillItemR6(it);
    const o = players.find(q => q.id === it.ownerId), R = 230;
    zones.push({ type: 'emp', x: it.x, y: it.y, r: R, t: 5, maxT: 5, owner: it.ownerId, tick: 0, storm: true });
    if (o) enemiesOf(o).forEach(e => { if (dist(e.x, e.y, it.x, it.y) > R + e.radius) return; e.st.shield = 0; dealDamage(e, 45 * vD(o), o.id, { knock: 200, angle: Math.atan2(e.y - it.y, e.x - it.x), zone: true }); e.stun = Math.max(e.stun, 1.2); spotFor(e, o.id, 4); floatText(e.x, e.y - 44, '⚡ BÃO ĐIỆN TỪ!', '#38bdf8', 14); });
    for (let i = 0; i < 10; i++) { const a = i * 0.628; beams.push({ x1: it.x, y1: it.y, x2: it.x + Math.cos(a) * R, y2: it.y + Math.sin(a) * R, life: 0.35, maxLife: 0.35, color: '#7dd3fc', zig: true }); }
    ring(it.x, it.y, 12, R, '#38bdf8', 0.6, 8); flash('#38bdf8', 0.12); addShake(8); AudioSys.playAt('explosion', it.x, it.y, 0.5); AudioSys.playAt('rail', it.x, it.y, 0.6);
};

/* ============================== 4) NỎ NỔ: tên ghim lên địch, 1 giây sau mới nổ ============================== */
WEAPONS.XBOWX.desc = 'Mũi tên GHIM lên người địch, 1 giây sau mới nổ (tên nổ lớn mỗi phát thứ 4 nếu có Trang Bị Phụ). Ghim nhiều mũi = nổ dồn.';
function xbStick(b, e) {
    const a = Math.atan2(b.y - e.y, b.x - e.x);
    W10.push({ kind: 'bolt', owner: b.owner, tid: e.id, ox: Math.cos(a) * e.radius * 0.8, oy: Math.sin(a) * e.radius * 0.8, a: b.angle, big: !!b.xbBig, t: 1, T: 1 });
    floatText(e.x, e.y - 40, '📌', '#fb923c', 12);
}

/* ============================== 5) VẠN TƯỢNG (12 mould, mỗi lần nhặt kích hoạt 2) ============================== */
WEAPONS.VANTUONG = { id: 'VANTUONG', name: 'Vạn Tượng', icon: '🪄', type: 'MELEE', mode: 'charge', chargeTime: 0.6, aim: 'arc', color: '#a78bfa', damage: 18, fireRate: 22, range: 110, durability: 60, maxDurability: 60, moveScale: 1.0, width: 5, len: 40, tier: 4, mag: 1 };
BASE_WEIGHTS.VANTUONG = 3;
const vtCur = w => w.mods[w.mi || 0], vtOther = w => w.mods[1 - (w.mi || 0)];
const vtNear = (p, R, a, cone) => enemiesOf(p).filter(e => e.hp > 0 && dist(e.x, e.y, p.x, p.y) < R && (a === undefined || Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < cone) && lineOfSight(p.x, p.y, e.x, e.y)).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0];
const vtTxt = (p, s, c) => floatText(p.x, p.y - 46, s, c || '#c4b5fd', 14);
function vtLine(p, a, L, pad, fn) { const ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L; enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + pad) fn(e); }); return { ex, ey }; }
function vtSlash(p, a, R, col, swing, arc) { slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: R + p.radius, color: col, width: 10, life: 0.2, maxLife: 0.2, swing: swing || ((p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1), line: false, arc: arc || 1.0 }); }
function vtDur(p, w, hit) { if (hit && hit.length) { reduceDurability(p, w, 1); hitStop(0.03); } }

const VT = {
    thunder: { name: 'LÔI TÍCH', icon: '⚡', col: '#facc15', type: 'MELEE', buff: { spd: 1.12 }, bt: 'chạy nhanh +12%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 22); vtSlash(p, a, 105, '#facc15'); const h = cubeArc(p, a, 105, 1.0, 16 * vM(p) * m, { knock: 150, stun: 0.35 }); h.forEach(e => spark(e.x, e.y, '#fde047', 6, 200)); vtDur(p, w, h); AudioSys.playAt('swing', p.x, p.y, 0.45); },
        S: { mirror: true, fn: p => { const a = p.angle, r = vtLine(p, a, 360, 26, e => { dealDamage(e, 15 * vD(p), p.id, { knock: 1 }); e.stun = Math.max(e.stun, 0.8); }); beams.push({ x1: p.x, y1: p.y, x2: r.ex, y2: r.ey, life: 0.3, maxLife: 0.3, color: '#fde047', zig: true }); vtTxt(p, '⚡ LUỒNG ĐIỆN CHOÁNG'); AudioSys.playAt('rail', p.x, p.y, 0.4); } },
        K: ['M', 'TIA SÉT', { mirror: true, fn: p => { const a = aimDir(p), free = rayFree(p.x, p.y, a, 650), r = vtLine(p, a, free.d, 24, e => { dealDamage(e, 32 * vD(p), p.id, { knock: 200, angle: a }); e.stun = Math.max(e.stun, 1.2); }); [0, 1, 2].forEach(() => beams.push({ x1: p.x, y1: p.y, x2: r.ex, y2: r.ey, life: 0.4, maxLife: 0.4, color: '#fef08a', zig: true })); addShake(5); AudioSys.playAt('rail', p.x, p.y, 0.7); } }],
        prof: { aim: 'dir', R: 650, shape: 'line', w: 48 } },
    steel: { name: 'THÉP ĐẶC', icon: '🔩', col: '#94a3b8', type: 'MELEE', buff: { inn: 0.85 }, bt: 'nhận ít hơn 15% sát thương',
        A: (p, w, a, m) => { meleeBook(p, w, a, 30); vtSlash(p, a, 100, '#cbd5e1'); const h = arcFoes(p, a, 100, 0.9); h.forEach(e => { trueDamage(e, 26 * vM(p) * m, p.id); spark(e.x, e.y, '#e2e8f0', 8, 220); }); if (h.length) addShake(4); vtDur(p, w, h); AudioSys.playAt('slam', p.x, p.y, 0.35); },
        S: { fn: p => { const a = p.angle, s = umbFreeSpot(p, p.x + Math.cos(a) * 200, p.y + Math.sin(a) * 200); startTravel(p, s.x, s.y, 0.35, null, null, 70); p.shotQueue.push({ t: 0.36, fn: () => cubeAoe(p, p.x, p.y, 80, 15 * vM(p), { knock: 220, col: '#cbd5e1' }) }); vtTxt(p, '🔩 NHẢY THÉP'); } },
        K: ['M', 'TRẤN SƠN', { fn: p => { const a = aimDir(p), d = Math.max(100, Math.min(300, p.skillDist || 260)); cubeAoe(p, p.x, p.y, 90, 20 * vM(p), { knock: 260, col: '#cbd5e1' }); const s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); startTravel(p, s.x, s.y, 0.5, null, null, 130); p.st.invuln = Math.max(p.st.invuln || 0, 0.5); p.shotQueue.push({ t: 0.51, fn: () => { if (p.hp <= 0) return; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 140 + e.radius) { trueDamage(e, 40 * vM(p), p.id); k5Lift(p, e, Math.atan2(e.y - p.y, e.x - p.x), 0.8); } }); ring(p.x, p.y, 10, 140, '#cbd5e1', 0.5, 7); addShake(10); hitStop(0.07); AudioSys.playAt('slam', p.x, p.y, 0.7); } }); } }],
        prof: { aim: 'point', R: 300, shape: 'point', aoe: 140, arc: true } },
    laser: { name: 'LAZER', icon: '🔴', col: '#f43f5e', type: 'GUN', buff: { out: 1.12 }, bt: 'sát thương +12%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 16); const mz = muzzle(p, w, a), free = rayFree(mz.x, mz.y, a, 480), ex = mz.x + Math.cos(a) * free.d, ey = mz.y + Math.sin(a) * free.d; beams.push({ x1: mz.x, y1: mz.y, x2: ex, y2: ey, life: 0.14, maxLife: 0.14, color: '#fb7185' }); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, mz.x, mz.y, ex, ey) < e.radius + 6) dealDamage(e, 16 * vD(p) * m, p.id, { knock: 60, angle: a }); }); AudioSys.playAt('rail', p.x, p.y, 0.2); },
        S: { fn: p => { const a = p.angle, s = umbFreeSpot(p, p.x - Math.cos(a) * 120, p.y - Math.sin(a) * 120); startTravel(p, s.x, s.y, 0.2, null, null, 20); const T = enemiesOf(p).filter(e => e.hp > 0 && dist(e.x, e.y, p.x, p.y) < 440); T.forEach(e => W10.push({ kind: 'lock', owner: p.id, tid: e.id, t: 1, T: 1 })); vtTxt(p, `🔴 KHOÁ ${T.length} MỤC TIÊU`); } },
        K: ['G', 'TIA CỰC ĐẠI', { fn: p => { const a0 = aimDir(p); p.st.root = Math.max(p.st.root || 0, 0.35); W10.push({ kind: 'charge', owner: p.id, a: a0, t: 0.3, T: 0.3 }); p.shotQueue.push({ t: 0.3, fn: () => { if (p.hp <= 0) return; const a = aimDir(p), mz = muzzle(p, getCurrentWeapon(p), a), ex = mz.x + Math.cos(a) * 1000, ey = mz.y + Math.sin(a) * 1000; [-1, 0, 1].forEach(k => beams.push({ x1: mz.x + Math.sin(a) * k * 10, y1: mz.y - Math.cos(a) * k * 10, x2: ex, y2: ey, life: 0.45, maxLife: 0.45, color: k ? '#f43f5e' : '#ffe4e6' })); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, mz.x, mz.y, ex, ey) < e.radius + 34) dealDamage(e, 90 * vD(p), p.id, { knock: 450, angle: a }); }); p.kx -= Math.cos(a) * 320; p.ky -= Math.sin(a) * 320; addShake(10); AudioSys.playAt('rail', p.x, p.y, 0.9); } }); } }],
        prof: { aim: 'dir', R: 1000, shape: 'line', w: 68 } },
    cannon: { name: 'PHÁO', icon: '💣', col: '#fb923c', type: 'GUN', buff: { out: 1.08, inn: 0.92 }, bt: 'sát thương +8%, nhận ít hơn 8%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 38); const tg = vtNear(p, 520, a, 0.35), d = Math.max(120, Math.min(480, (p.manualEngaged && p.aimDist) || (tg ? dist(tg.x, tg.y, p.x, p.y) : 320))), s = rayFree(p.x, p.y, a, d), x = p.x + Math.cos(a) * s.d, y = p.y + Math.sin(a) * s.d, mz = muzzle(p, w, a); W9.push({ kind: 'axShell', owner: p.id, x0: mz.x, y0: mz.y, x, y, t: 0.45, T: 0.45 }); dropBomb(p, x, y, 38 * vD(p) * m, 85, 0.45); p.kx -= Math.cos(a) * 80; p.ky -= Math.sin(a) * 80; AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); },
        S: { fn: p => { const a = p.angle; zones.push({ type: 'fire', x: p.x, y: p.y, r: 75, t: 3, maxT: 3, owner: p.id, tick: 0 }); explode(p.x, p.y, p.id, 18 * vD(p), 70); const s = umbFreeSpot(p, p.x + Math.cos(a) * 230, p.y + Math.sin(a) * 230); startTravel(p, s.x, s.y, 0.7, null, null, 180); p.st.invuln = Math.max(p.st.invuln || 0, 0.6); vtTxt(p, '💣 CẮM GẬY · BAY LÊN'); } },
        K: ['G', 'ĐẠI PHÁO', { mirror: true, fn: p => { const a = aimDir(p), d = Math.max(150, Math.min(520, p.skillDist || 380)), s = rayFree(p.x, p.y, a, d), x = p.x + Math.cos(a) * s.d, y = p.y + Math.sin(a) * s.d; W9.push({ kind: 'axShell', owner: p.id, x0: p.x, y0: p.y, x, y, t: 0.8, T: 0.8, big: true }); dropBomb(p, x, y, 80 * vD(p), 150, 0.8); p.kx -= Math.cos(a) * 180; p.ky -= Math.sin(a) * 180; addShake(6); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.8); } }],
        prof: { aim: 'point', R: 520, shape: 'point', aoe: 150, arc: true } },
    marker: { name: 'ĐIỂM ĐÁNH DẤU', icon: '📍', col: '#f472b6', type: 'GUN', buff: { spd: 1.06, out: 1.05 }, bt: 'chạy +6%, sát thương +5%',
        A: (p, w, a, m, pt) => { meleeBook(p, w, a, 40); let x, y; if (pt) { const d = Math.min(450, dist(p.x, p.y, pt.x, pt.y)), b = Math.atan2(pt.y - p.y, pt.x - p.x); x = p.x + Math.cos(b) * d; y = p.y + Math.sin(b) * d; } else { const tg = vtNear(p, 450, a, 0.5); x = tg ? tg.x : p.x + Math.cos(a) * 300; y = tg ? tg.y : p.y + Math.sin(a) * 300; } zones.push({ type: 'artyWarn', x, y, r: 55, t: 0.6, maxT: 0.6, owner: p.id, tick: 0 }); W10.push({ kind: 'mark', owner: p.id, x, y, dmg: 34 * vD(p) * m, t: 0.6, T: 0.6 }); AudioSys.playAt('ui', p.x, p.y, 0.3); },
        S: { fn: p => { const a = p.angle, ox = p.x, oy = p.y, s = umbFreeSpot(p, p.x - Math.cos(a) * 180, p.y - Math.sin(a) * 180); decoys.push({ x: ox, y: oy, angle: a, speed: 380, owner: p.id, t: 1, hp: 30, color: p.color, radius: p.radius, label: p.label }); afterImages(p, ox, oy, s.x, s.y, 4, '#f472b6'); p.x = s.x; p.y = s.y; p.st.invis = Math.max(p.st.invis || 0, 1.5); vtTxt(p, '📍 TÀNG HÌNH · ẢO ẢNH LAO LÊN'); } },
        K: ['G', 'TUYỆT DIỆT QUANG', { fn: p => vtGiant(p) }],
        prof: { aim: null, shape: 'self', aoe: 40 } },
    white: { name: 'ĐẦU TRẮNG', icon: '🎩', col: '#f8fafc', type: 'MELEE', buff: { dodge: 0.15 }, bt: '15% né mọi đòn',
        A: (p, w, a, m) => { meleeBook(p, w, a, 20); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 130, color: '#f8fafc', width: 6, life: 0.16, maxLife: 0.16, swing: 1, line: true }); const h = []; vtLine(p, a, 130, 16, e => { dealDamage(e, 18 * vM(p) * m, p.id, { melee: true, knock: 160, angle: a }); h.push(e); }); vtDur(p, w, h); if (!p._vtMirror && !(p.vtIllCd > world.time)) vtIllusion(p); AudioSys.playAt('swing', p.x, p.y, 0.4); },
        S: { fn: p => { const e = vtNear(p, 420, p.angle, 1.2) || vtNear(p, 420); p.st.haste = Math.max(p.st.haste || 0, 2.5); if (e && !e.travel) { const x = p.x, y = p.y; afterImages(p, x, y, e.x, e.y, 4, '#f8fafc'); p.x = e.x; p.y = e.y; e.x = x; e.y = y; smoke(x, y, 5, 'rgba(248,250,252,0.4)', 14); vtTxt(p, '🎩 HOÁN ĐỔI VỊ TRÍ!'); } else vtTxt(p, '🎩 TĂNG TỐC'); } },
        K: ['M', 'CÁ MẬP ẢO THUẬT', { fn: p => { W10.push({ kind: 'shark', owner: p.id, x: p.x, y: p.y, t: 2, T: 2 }); zones.push({ type: 'artyWarn', x: p.x, y: p.y, r: 140, t: 2, maxT: 2, owner: p.id, tick: 0 }); if ((p.lastMoveIn || 0) > 0.2) { p.dashTime = 0.16; p.dashAngle = p.moveDir; } const w = getCurrentWeapon(p); if (w.id === 'VANTUONG') p.shotQueue.push({ t: 0.18, fn: () => { if (getCurrentWeapon(p) === w) vtSwap(p, w); } }); } }],
        prof: { aim: null, shape: 'selfaoe', aoe: 140 } },
    frost: { name: 'BĂNG GIÁ', icon: '❄️', col: '#7dd3fc', type: 'MELEE', buff: { inn: 0.9, out: 1.04 }, bt: 'nhận ít hơn 10%, sát thương +4%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 22); vtSlash(p, a, 100, '#bae6fd'); const h = cubeArc(p, a, 100, 1.0, 15 * vM(p) * m, { knock: 100 }); h.forEach(e => { e.st.slow = Math.max(e.st.slow || 0, 1.5); e.vtFrost = (e.vtFrostBy === p.id && world.time - (e.vtFrostT || 0) < 3 ? e.vtFrost || 0 : 0) + 1; e.vtFrostBy = p.id; e.vtFrostT = world.time; if (e.vtFrost >= 3) { e.vtFrost = 0; e.st.root = Math.max(e.st.root || 0, 0.8); floatText(e.x, e.y - 44, '❄ ĐÓNG BĂNG', '#bae6fd', 13); } }); vtDur(p, w, h); AudioSys.playAt('swing', p.x, p.y, 0.4); },
        S: { mirror: true, fn: p => { enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 140 + e.radius) { dealDamage(e, 12 * vM(p), p.id, { melee: true, knock: 1 }); e.st.root = Math.max(e.st.root || 0, 1); } }); ring(p.x, p.y, 10, 140, '#bae6fd', 0.5, 6); vtTxt(p, '❄️ BĂNG HOÀN'); AudioSys.playAt('block', p.x, p.y, 0.5); } },
        K: ['M', 'BĂNG TRỤ', { mirror: true, fn: p => { const a = aimDir(p), hit = new Set(); for (let i = 1; i <= 10; i++) p.shotQueue.push({ t: i * 0.03, fn: () => { const x = p.x + Math.cos(a) * i * 42, y = p.y + Math.sin(a) * i * 42; if (pointInObstacle(x, y, 0)) return; W10.push({ kind: 'spike', owner: p.id, x, y, t: 1.2, T: 1.2 }); enemiesOf(p).forEach(e => { if (!hit.has(e.id) && dist(e.x, e.y, x, y) < e.radius + 30) { hit.add(e.id); dealDamage(e, 30 * vM(p), p.id, { melee: true, knock: 1 }); e.st.root = Math.max(e.st.root || 0, 1.5); } }); } }); AudioSys.playAt('block', p.x, p.y, 0.6); } }],
        prof: { aim: 'dir', R: 420, shape: 'line', w: 60 } },
    flame: { name: 'HOẢ DIỆM', icon: '🔥', col: '#f97316', type: 'GUN', buff: { out: 1.1 }, bt: 'sát thương +10%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 18); const mz = muzzle(p, w, a); spawnBullet(p, mz.x, mz.y, a, { speed: 17, damage: 13 * vD(p) * m, range: 420, color: '#fb923c', size: 6, trail: 30, burn: true, knock: 80 }); for (let i = 0; i < 4; i++) particles.push({ x: mz.x, y: mz.y, vx: Math.cos(a + (Math.random() - 0.5) * 0.6) * 160, vy: Math.sin(a + (Math.random() - 0.5) * 0.6) * 160, life: 0.3, maxLife: 0.3, color: '#fdba74', size: 4, drag: 0.9 }); AudioSys.playAt('flame', p.x, p.y, 0.3); },
        S: { fn: p => { const a = p.angle, x0 = p.x, y0 = p.y; p.dashTime = 0.2; p.dashAngle = a; for (let i = 0; i < 3; i++) zones.push({ type: 'fire', x: x0 + Math.cos(a) * i * 55, y: y0 + Math.sin(a) * i * 55, r: 42, t: 2.5, maxT: 2.5, owner: p.id, tick: 0 }); vtTxt(p, '🔥 HOẢ BỘ'); } },
        K: ['G', 'HOẢ LONG', { mirror: true, fn: p => { p.vtFlame = { t: 1.2, tick: 0 }; AudioSys.playAt('flame', p.x, p.y, 0.6); } }],
        prof: { aim: 'dir', R: 230, shape: 'cone', half: 0.4 } },
    gravity: { name: 'TRỌNG LỰC', icon: '🌀', col: '#8b5cf6', type: 'GUN', buff: { inn: 0.92, spd: 1.05 }, bt: 'nhận ít hơn 8%, chạy +5%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 24); const tg = vtNear(p, 400, a, 0.35), d = Math.min(400, tg ? dist(tg.x, tg.y, p.x, p.y) : 320), s = rayFree(p.x, p.y, a, d); W10.push({ kind: 'gorb', owner: p.id, x: p.x, y: p.y, x0: p.x, y0: p.y, tx: p.x + Math.cos(a) * s.d, ty: p.y + Math.sin(a) * s.d, dmg: 15 * vD(p) * m, t: 0.4, T: 0.4 }); AudioSys.playAt('whoosh', p.x, p.y, 0.3); },
        S: { mirror: true, fn: p => { const a = p.angle; W10.push({ kind: 'well', owner: p.id, x: p.x + Math.cos(a) * 200, y: p.y + Math.sin(a) * 200, R: 170, pull: 160, dmg: 0, t: 1.5, T: 1.5, tick: 0 }); vtTxt(p, '🌀 GIẾNG TRỌNG LỰC'); } },
        K: ['M', 'HỐ ĐEN', { mirror: true, fn: p => { const a = aimDir(p), d = Math.max(80, Math.min(320, p.skillDist || 260)), s = rayFree(p.x, p.y, a, d); W10.push({ kind: 'well', owner: p.id, x: p.x + Math.cos(a) * s.d, y: p.y + Math.sin(a) * s.d, R: 220, pull: 230, dmg: 5 * vM(p), burst: 40 * vM(p), t: 2.5, T: 2.5, tick: 0, big: true }); AudioSys.playAt('rail', p.x, p.y, 0.5); } }],
        prof: { aim: 'point', R: 320, shape: 'point', aoe: 220, arc: true } },
    wind: { name: 'PHONG VŨ', icon: '🌪️', col: '#6ee7b7', type: 'GUN', buff: { spd: 1.18 }, bt: 'chạy nhanh +18%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 18); htBullet(p, a, { damage: 14 * vD(p) * m, speed: 22, size: 7, pierce: true, color: '#a7f3d0', life: 0.45, trail: 40, knock: 300 }); AudioSys.playAt('whoosh', p.x, p.y, 0.35); },
        S: { mirror: true, fn: p => { p.st.haste = Math.max(p.st.haste || 0, 3); cubeAoe(p, p.x, p.y, 130, 10 * vD(p), { knock: 480, col: '#a7f3d0' }); vtTxt(p, '🌪️ CUỒNG PHONG BỘ'); AudioSys.playAt('whoosh', p.x, p.y, 0.6); } },
        K: ['M', 'LỐC XOÁY', { mirror: true, fn: p => { const a = aimDir(p); W9.push({ kind: 'tornado', owner: p.id, x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, a, d: 0, max: 540, hit: new Set(), t: 3, T: 3 }); AudioSys.playAt('whoosh', p.x, p.y, 0.8); } }],
        prof: { aim: 'dir', R: 540, shape: 'line', w: 120 } },
    blood: { name: 'HUYẾT TẾ', icon: '🩸', col: '#dc2626', type: 'MELEE', buff: { steal: 0.12 }, bt: 'hút máu 12%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 22); vtSlash(p, a, 100, '#ef4444'); const dmg = 17 * vM(p) * m, h = cubeArc(p, a, 100, 1.0, dmg, { knock: 140 }); if (h.length) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.3 * h.length); vtDur(p, w, h); AudioSys.playAt('swing', p.x, p.y, 0.4); },
        S: { fn: p => { p.hp = Math.min(p.maxHp, p.hp + 25); ['burn', 'slow', 'root', 'silence', 'poison', 'blind'].forEach(k => { if (p.st[k]) p.st[k] = 0; }); vtTxt(p, '🩸 HUYẾT HỒI +25', '#fca5a5'); ring(p.x, p.y, 6, 60, '#ef4444', 0.4, 4); } },
        K: ['M', 'HUYẾT THỨ', { mirror: true, fn: p => { let n = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 160 + e.radius) { dealDamage(e, 35 * vM(p), p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - p.y, e.x - p.x) }); n++; } }); if (!p._vtMirror) p.hp = Math.min(p.maxHp, p.hp + 8 * n); W10.push({ kind: 'bspikes', owner: p.id, x: p.x, y: p.y, t: 0.6, T: 0.6 }); addShake(6); AudioSys.playAt('slam', p.x, p.y, 0.5); } }],
        prof: { aim: null, shape: 'selfaoe', aoe: 160 } },
    chain: { name: 'XÍCH HỒN', icon: '⛓️', col: '#94a3b8', type: 'MELEE', buff: { out: 1.06, spd: 1.06 }, bt: 'sát thương +6%, chạy +6%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 24); W2FX.push({ kind: 'whip', owner: p.id, a, len: 190, t: 0.22, maxT: 0.22, col: '#94a3b8' }); const h = []; vtLine(p, a, 190, 16, e => { dealDamage(e, 16 * vM(p) * m, p.id, { melee: true, knock: 120, angle: a }); e.st.slow = Math.max(e.st.slow || 0, 1); h.push(e); }); vtDur(p, w, h); AudioSys.playAt('swing', p.x, p.y, 0.4); },
        S: { fn: p => { const e = vtNear(p, 380, p.angle, 1.0) || vtNear(p, 380); if (!e) { vtTxt(p, '⛓️ (không có mục tiêu)'); return; } const a = Math.atan2(p.y - e.y, p.x - e.x), d = dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 10, nx = e.x + Math.cos(a) * d, ny = e.y + Math.sin(a) * d; W2FX.push({ kind: 'whip', owner: p.id, a: a + Math.PI, len: dist(p.x, p.y, e.x, e.y), t: 0.25, maxT: 0.25, col: '#94a3b8', pull: true }); if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } dealDamage(e, 12 * vM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.5); vtTxt(p, '⛓️ XÍCH KÉO'); } },
        K: ['G', 'XÍCH PHI', { fn: p => { const a = aimDir(p), free = rayFree(p.x, p.y, a, 400), e = lineFoes(p, a, free.d, 16)[0]; W2FX.push({ kind: 'whip', owner: p.id, a, len: e ? dist(p.x, p.y, e.x, e.y) : free.d, t: 0.3, maxT: 0.3, col: '#cbd5e1', pull: !!e }); if (e) { const b = Math.atan2(p.y - e.y, p.x - e.x), d = dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 10, nx = e.x + Math.cos(b) * d, ny = e.y + Math.sin(b) * d; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } dealDamage(e, 25 * vM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.8); } else { const s = umbFreeSpot(p, p.x + Math.cos(a) * (free.d - p.radius - 6), p.y + Math.sin(a) * (free.d - p.radius - 6)); startTravel(p, s.x, s.y, Math.max(0.15, free.d / 1400), null, null, 10); } AudioSys.playAt('whoosh', p.x, p.y, 0.6); } }],
        prof: { aim: 'dir', R: 400, shape: 'line', w: 30 } }
};
const VT_IDS = Object.keys(VT);
WEAPONS.VANTUONG.desc = `Gậy biến hình 12 MOULD (${VT_IDS.map(k => VT[k].icon + ' ' + VT[k].name).join(' · ')}). Nội tại VẠN TƯỢNG: mỗi lần nhặt chỉ KÍCH HOẠT NGẪU NHIÊN 2 mould — luôn 1 mould ĐÁNH GẦN + 1 mould ĐÁNH XA. TÀN DƯ: rời 1 mould thì đòn đánh đầu tiên của mould kế mang hiệu ứng của mould vừa rời. Mỗi mould: đòn đánh riêng + 1 buff riêng + chiêu khi chuyển tới + kỹ năng Bậc Thầy / Trang Bị Phụ riêng. Giữ rồi thả hoặc Kỹ Thuật Cao: đổi mould ngay lập tức.`;
function vtSetType(w) { const M = VT[vtCur(w)]; w.type = M.type; w.range = M.type === 'GUN' ? 450 : 110; w.aim = M.type === 'GUN' ? 'line' : 'arc'; w.color = M.col; w.mag = 1; }
const _makeWeaponR6 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponR6(id, p);
    if (w && w.id === 'VANTUONG' && !w.mods) { const pick = L => L[Math.floor(Math.random() * L.length)], a = pick(VT_IDS.filter(k => VT[k].type === 'MELEE')), b = pick(VT_IDS.filter(k => VT[k].type === 'GUN')); w.mods = Math.random() < 0.5 ? [a, b] : [b, a]; w.mi = 0; vtSetType(w); }
    return w;
};
function vtSwap(p, w) {
    if (!w || w.id !== 'VANTUONG' || !w.mods) return;
    const prev = vtCur(w); if (!p._vtMirror) p.vtRes = { id: prev, until: world.time + 4 };
    w.mi = 1 - (w.mi || 0); vtSetType(w); const M = VT[vtCur(w)];
    W10.push({ kind: 'morph', owner: p.id, col: M.col, t: 0.35, T: 0.35 }); floatText(p.x, p.y - 62, `${M.icon} ${M.name} · ${M.bt}`, M.col, 12); AudioSys.playAt('rail', p.x, p.y, 0.3);
    try { M.S.fn(p, w); } catch (e) { console.error(e); }
    if (M.S.mirror) vtMirror(p, () => M.S.fn(p, w));
}
// ảo ảnh (mould Đầu Trắng): đánh cùng bạn, dùng chiêu cùng bạn, 10% sát thương, 1 máu
const VTI = [];
function vtIllusion(p) {
    p.vtIllCd = world.time + 6;
    const d = { x: p.x, y: p.y, angle: p.angle, speed: 0, owner: p.id, t: 5, hp: 1, color: p.color, radius: p.radius, label: p.label, vtIll: true };
    decoys.push(d); VTI.push({ owner: p.id, d }); vtTxt(p, '🎩 ẢO ẢNH CHIẾN ĐẤU (5s)', '#f8fafc');
}
function vtMirror(p, fn) {
    VTI.forEach(c => {
        if (c.owner !== p.id || !decoys.includes(c.d) || c.d.hp <= 0) return;
        const sx = p.x, sy = p.y, cd = p.cooldown, dm = p.dmgMult, mm = p.meleeMult, sq = p.shotQueue.length, lf = p.lastFireT;
        p.x = c.d.x; p.y = c.d.y; p.dmgMult = (dm || 1) * 0.1; p.meleeMult = (mm || 1) * 0.1; p._vtMirror = true;
        try { fn(); } catch (e) { } finally { p.x = sx; p.y = sy; p.cooldown = cd; p.dmgMult = dm; p.meleeMult = mm; p._vtMirror = false; p.lastFireT = lf; p.shotQueue.length = Math.min(p.shotQueue.length, sq); }
    });
}
// Tuyệt Diệt Quang: cắm gậy, khiên quanh người, laser khổng lồ từ bạn tới điểm chọn; đốt sạch năng lượng gậy
function vtGiant(p) {
    const w = getCurrentWeapon(p); let pt = p.pickTarget && p.pickTarget.a;
    if (!pt) { const e = enemiesOf(p).filter(q => q.hp > 0).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0]; pt = e && dist(e.x, e.y, p.x, p.y) < 1400 ? { x: e.x, y: e.y } : { x: p.x + Math.cos(aimDir(p)) * 800, y: p.y + Math.sin(aimDir(p)) * 800 }; }
    const a = Math.atan2(pt.y - p.y, pt.x - p.x), L = Math.max(200, dist(p.x, p.y, pt.x, pt.y) + 60), ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L, warn = 1.5;
    p.st.root = Math.max(p.st.root || 0, warn + 0.5); p.st.shield = Math.min(200, (p.st.shield || 0) + 80); p.st.shieldT = Math.max(p.st.shieldT || 0, warn + 1);
    warnLine(p, p.x, p.y, ex, ey, warn, true);
    W10.push({ kind: 'giantWarn', owner: p.id, x1: p.x, y1: p.y, x2: ex, y2: ey, t: warn, T: warn });
    p.shotQueue.push({ t: warn, fn: () => {
        if (p.hp <= 0) return;
        W10.push({ kind: 'giant', owner: p.id, x1: p.x, y1: p.y, x2: ex, y2: ey, t: 0.8, T: 0.8 });
        enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 45) { trueDamage(e, e.hp + (e.st.shield || 0) + 50, p.id); floatText(e.x, e.y - 50, '☠ TIÊU DIỆT', '#f472b6', 16); } });
        decoys.forEach(d => { if (d.owner !== p.id && segDist(d.x, d.y, p.x, p.y, ex, ey) < 50) d.hp = 0; });
        flash('#f472b6', 0.2); addShake(16); hitStop(0.1); AudioSys.playAt('explosion', p.x, p.y, 0.9); AudioSys.playAt('rail', p.x, p.y, 1);
        const i = p.inventory.indexOf(w); if (i >= 0) { p.inventory[i] = { ...WEAPONS.NONE }; floatText(p.x, p.y - 60, '🪄 VẠN TƯỢNG CẠN NĂNG LƯỢNG', '#94a3b8', 13); }
    } });
    vtTxt(p, '📍 TUYỆT DIỆT QUANG — CẢNH BÁO!', '#f472b6');
}
// TÀN DƯ: hiệu ứng của mould vừa rời gắn vào đòn đầu tiên của mould mới
const VT_RES = {
    thunder: (p, e) => { enemiesOf(p).filter(q => q !== e && q.hp > 0 && dist(q.x, q.y, e.x, e.y) < 220).slice(0, 2).forEach(q => { beams.push({ x1: e.x, y1: e.y, x2: q.x, y2: q.y, life: 0.25, maxLife: 0.25, color: '#fde047', zig: true }); dealDamage(q, 12 * vD(p), p.id, { knock: 1 }); q.stun = Math.max(q.stun, 0.3); }); },
    steel: (p, e) => { trueDamage(e, 10 * vM(p), p.id); e.stun = Math.max(e.stun, 0.3); },
    laser: (p, e) => { spotFor(e, p.id, 3); dealDamage(e, 10 * vD(p), p.id, { knock: 1 }); beams.push({ x1: e.x + 30, y1: e.y - 300, x2: e.x, y2: e.y, life: 0.2, maxLife: 0.2, color: '#fb7185' }); },
    cannon: (p, e) => explode(e.x, e.y, p.id, 12 * vD(p), 55),
    marker: (p, e) => { spotFor(e, p.id, 4); e.st.slow = Math.max(e.st.slow || 0, 1.2); },
    white: (p, e, d) => { dealDamage(e, d * 0.25, p.id, { knock: 1 }); floatText(e.x, e.y - 50, '🎩 BẤT NGỜ!', '#f8fafc', 12); },
    frost: (p, e) => { e.st.slow = Math.max(e.st.slow || 0, 1.8); ring(e.x, e.y, 4, 30, '#bae6fd', 0.3, 3); },
    flame: (p, e) => { if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.burnBy = p.id; } },
    gravity: (p, e) => { const b = Math.atan2(p.y - e.y, p.x - e.x), k = Math.max(0, Math.min(60, dist(e.x, e.y, p.x, p.y) - p.radius - e.radius - 8)), nx = e.x + Math.cos(b) * k, ny = e.y + Math.sin(b) * k; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } },
    wind: (p, e) => { e.kx = (e.kx || 0) + Math.cos(Math.atan2(e.y - p.y, e.x - p.x)) * 420; e.ky = (e.ky || 0) + Math.sin(Math.atan2(e.y - p.y, e.x - p.x)) * 420; },
    blood: (p, e, d) => { p.hp = Math.min(p.maxHp, p.hp + d * 0.5); },
    chain: (p, e) => { e.st.root = Math.max(e.st.root || 0, 0.6); }
};
function vtResidue(p, e, d) { const id = p.vtResOn.id, f = VT_RES[id]; if (!f) return; f(p, e, d); floatText(e.x, e.y - 34, `TÀN DƯ ${VT[id].icon}`, VT[id].col, 11); }
const vtSk = p => { const w = getCurrentWeapon(p), M = VT[vtCur(w)], K = M.K; vtTxt(p, `${M.icon} ${K[1]}`, M.col); K[2].fn(p, w); if (K[2].mirror) vtMirror(p, () => K[2].fn(p, w)); };

/* ---------- bảng chiến thuật cho mould Điểm Đánh Dấu ---------- */
Object.assign(TAC, {
    vtMark: { name: '📍 ĐIỂM ĐÁNH DẤU · LASER', need: 1, r: 55, col: '#f472b6', steps: ['CHẠM ĐIỂM BẮN LASER (gần bạn, tối đa 450)'] },
    vtGiant: { name: '📍 TUYỆT DIỆT QUANG (toàn bản đồ)', need: 1, r: 45, col: '#f472b6', steps: ['CHẠM ĐIỂM ĐÍCH — LASER KHỔNG LỒ TỪ BẠN TỚI ĐÓ'] }
});
const vtLocalMarker = () => { const p = localPlayer(), w = p && getCurrentWeapon(p); return !!(w && w.id === 'VANTUONG' && w.mods && vtCur(w) === 'marker'); };
Object.defineProperty(PICKER_WEAPONS, 'VANTUONG', { get: () => vtLocalMarker() ? 'vtMark' : undefined, enumerable: false, configurable: true });
Object.defineProperty(CARDS.gunMod, 'picker', { get: () => vtLocalMarker() ? 'vtGiant' : undefined, configurable: true });
const _execTargetR6 = execTarget;
execTarget = function (p, src, slot, a, b, pts) {
    const w = p && getCurrentWeapon(p);
    if (src === 'weapon' && w && w.id === 'VANTUONG' && w.mods) { if (!p || p.hp <= 0 || p.stun > 0 || p.cooldown > 0 || vtCur(w) !== 'marker') return; VT.marker.A(p, w, Math.atan2(a.y - p.y, a.x - p.x), attackMult(p, w), a); vtMirror(p, () => VT.marker.A(p, w, p.angle, 1, a)); return; }
    return _execTargetR6(p, src, slot, a, b, pts);
};

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _fireWeaponR6 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'VANTUONG' && w.mods) {
        if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; }
        if ((charge || 0) >= 0.9) { meleeBook(p, w, ang, 16); return vtSwap(p, w); }
        const M = VT[vtCur(w)], m = attackMult(p, w); if (p.vtRes && p.vtRes.until > world.time) { p.vtResOn = { id: p.vtRes.id, until: world.time + 0.7, hit: new Set() }; p.vtRes = null; } M.A(p, w, ang, m); vtMirror(p, () => M.A(p, w, ang, m)); return;
    }
    if (w && w.id === 'XBOWX') { // tên ghim
        const n = bullets.length; const r = _fireWeaponR6(p, w, ang, charge, enemy);
        bullets.slice(n).filter(b => b.owner === p.id).forEach(b => { b.xbBig = b.color === '#ef4444'; b.explosive = false; b.blastSmall = false; Object.defineProperty(b, 'root', { configurable: true, get() { if (!this._stuck && R6tgt && R6at === world.time && R6atk === this.owner && dist(this.x, this.y, R6tgt.x, R6tgt.y) < R6tgt.radius + 40) { this._stuck = true; xbStick(this, R6tgt); } return 0; } }); });
        return r;
    }
    if (w && w.id === 'SPISTOL' && world.time - (p.lastFireT || -9) > 1.5) p.nextShotMult = Math.max(p.nextShotMult || 1, 1.8);
    return _fireWeaponR6(p, w, ang, charge, enemy);
};
const _castSkillR6 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (w && w.id === 'VANTUONG' && w.mods && s && (s.id === 'meleeTech' || s.id === 'gunMod')) { w.type = s.id === 'meleeTech' ? 'MELEE' : 'GUN'; try { return _castSkillR6(p, slot, aimVec); } finally { vtSetType(w); } }
    return _castSkillR6(p, slot, aimVec);
};
const _meleeTechR6 = meleeTechCast; meleeTechCast = function (p) { const w = getCurrentWeapon(p); if (w.id === 'VANTUONG' && w.mods) return vtSk(p); return _meleeTechR6(p); };
const _gunModR6 = gunModCast; gunModCast = function (p) { const w = getCurrentWeapon(p); if (w.id === 'VANTUONG' && w.mods) return vtSk(p); return _gunModR6(p); };
HT.VANTUONG = ['ĐỔI MOULD TỨC THÌ', p => { const w = getCurrentWeapon(p); vtSwap(p, w); p.cooldown = 0; }];
HT_PROFILE.VANTUONG = { aim: null, shape: 'self', aoe: 40, col: '196,181,253', tag: 'ĐỔI MOULD NGAY' };
const _skillProfileR6 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'VANTUONG' && w.mods && (id === 'meleeTech' || id === 'gunMod')) { const M = VT[vtCur(w)]; return { ...M.prof, col: '196,181,253', tag: `${M.icon} ${M.K[1]}` }; }
    if (w && w.id === 'VANTUONG' && w.mods && id === 'hightech') { const N = VT[vtOther(w)]; return { aim: null, shape: 'self', aoe: 40, col: '196,181,253', tag: `→ ${N.icon} ${N.name}` }; }
    return _skillProfileR6(p, id);
};
const _ammoTextR6 = ammoText;
ammoText = function (w) { if (w && w.id === 'VANTUONG' && w.mods) return `${VT[vtCur(w)].icon}▸${VT[vtOther(w)].icon} ${Math.round(100 * w.durability / w.maxDurability)}%`; return _ammoTextR6(w); };
MELEE_P.VANTUONG = 'Đổi mould hồi 15 máu.';
const _dealDamageR6 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    R6tgt = target; R6at = world.time; R6atk = attackerId;
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target) {
        const w = getCurrentWeapon(atk);
        if (w && w.id === 'VANTUONG' && w.mods) { const B = VT[vtCur(w)].buff; if (B.out) dmg *= B.out; if (B.steal && target.hp > 0) atk.hp = Math.min(atk.maxHp, atk.hp + dmg * B.steal); }
        if (w && w.id === 'SAR' && Math.abs(angleDiff(Math.atan2(atk.y - target.y, atk.x - target.x), target.angle)) > 1.9) dmg *= 1.4;
    }
    if (atk && atk !== target && atk.vtResOn && atk.vtResOn.until > world.time && !atk._vtResIn && !atk.vtResOn.hit.has(target.id) && target.hp > 0) { atk.vtResOn.hit.add(target.id); atk._vtResIn = true; try { vtResidue(atk, target, dmg); } finally { atk._vtResIn = false; } }
    const tw = target && target.inventory && getCurrentWeapon(target);
    if (tw && tw.id === 'VANTUONG' && tw.mods && atk && atk !== target) { const B = VT[vtCur(tw)].buff; if (B.inn) dmg *= B.inn; if (B.dodge && Math.random() < B.dodge) { floatText(target.x, target.y - 40, 'NÉ!', '#f8fafc', 12); return; } }
    return _dealDamageR6(target, dmg, attackerId, opts);
};
const _resetRoundR6 = resetPlayerForRound;
resetPlayerForRound = function (p) { for (const A of [W10, VTI]) for (let i = A.length - 1; i >= 0; i--) if (A[i].owner === p.id) A.splice(i, 1); p.vtFlame = null; p.vtIllCd = 0; p.vtRes = null; p.vtResOn = null; return _resetRoundR6(p); };
// đổi mould với Bậc Thầy: hồi 15 máu
const _vtSwapR6 = vtSwap;
vtSwap = function (p, w) { _vtSwapR6(p, w); if (has(p, 'meleeTech') && !p._vtMirror) p.hp = Math.min(p.maxHp, p.hp + 15); };

const _upeR6 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR6(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => {
        // buff tốc chạy của mould (áp lên moveMult, tự khớp khi applyBuild đặt lại)
        const w = p.hp > 0 && getCurrentWeapon(p), spd = w && w.id === 'VANTUONG' && w.mods ? (VT[vtCur(w)].buff.spd || 1) : 1;
        const base = p.moveMult === p._vtAfter ? p._vtBase : p.moveMult; if (base !== undefined) { p._vtBase = base; p.moveMult = base * spd; p._vtAfter = p.moveMult; }
        if (p.hp <= 0) { p.vtFlame = null; return; }
        const F = p.vtFlame;
        if (F) { F.t -= dt; F.tick += dt; if (F.tick >= 0.08) { F.tick = 0; const a = p.angle; for (let i = 0; i < 3; i++) particles.push({ x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, vx: Math.cos(a + (Math.random() - 0.5) * 0.7) * 520, vy: Math.sin(a + (Math.random() - 0.5) * 0.7) * 520, life: 0.4, maxLife: 0.4, color: i ? '#fb923c' : '#fde047', size: 7, drag: 0.9 }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 230 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.42 && lineOfSight(p.x, p.y, e.x, e.y)) { dealDamage(e, 5 * vD(p), p.id, { knock: 20, angle: a }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 2); e.st.burnBy = p.id; } } }); } if (F.t <= 0) p.vtFlame = null; }
    });
    // ảo ảnh bám theo chủ
    for (let i = VTI.length - 1; i >= 0; i--) { const c = VTI[i], o = players.find(q => q.id === c.owner); if (!o || o.hp <= 0 || !decoys.includes(c.d) || c.d.hp <= 0 || c.d.t <= 0) { const k = decoys.indexOf(c.d); if (k >= 0 && (!o || o.hp <= 0)) decoys.splice(k, 1); VTI.splice(i, 1); continue; } const a = o.angle + 2.4, tx = o.x + Math.cos(a) * 48, ty = o.y + Math.sin(a) * 48; if (!pointInObstacle(tx, ty, o.radius)) { c.d.x += (tx - c.d.x) * Math.min(1, dt * 10); c.d.y += (ty - c.d.y) * Math.min(1, dt * 10); } c.d.angle = o.angle; c.d.speed = 0; }
    // bão điện từ: chậm + giật điện liên tục
    zones.forEach(z => { if (z.type !== 'emp' || !z.storm) return; const o = players.find(q => q.id === z.owner); z.vtk = (z.vtk || 0) + dt; const tick = z.vtk >= 0.3; if (tick) z.vtk = 0; if (!o) return; enemiesOf(o).forEach(e => { if (dist(e.x, e.y, z.x, z.y) > z.r) return; e.st.slow = Math.max(e.st.slow || 0, 0.4); if (tick) { dealDamage(e, 4, o.id, { zone: true }); if (Math.random() < 0.5) beams.push({ x1: z.x, y1: z.y, x2: e.x, y2: e.y, life: 0.12, maxLife: 0.12, color: '#7dd3fc', zig: true }); } }); for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && !sameTeam(o, players.find(q => q.id === b.owner) || {}) && dist(b.x, b.y, z.x, z.y) < z.r) { spark(b.x, b.y, '#7dd3fc', 3, 120); bullets.splice(j, 1); } } });
    for (let i = W10.length - 1; i >= 0; i--) {
        const f = W10[i], o = players.find(q => q.id === f.owner); if (!o) { W10.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'gorb') { const u = Math.min(1, 1 - f.t / f.T); f.x = f.x0 + (f.tx - f.x0) * u; f.y = f.y0 + (f.ty - f.y0) * u; const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 8); if (e) f.t = 0; if (f.t <= 0) { enemiesOf(o).forEach(q => { if (q.air > 0) return; const d = dist(q.x, q.y, f.x, f.y); if (d < 85 + q.radius) { const b = Math.atan2(f.y - q.y, f.x - q.x), k = Math.min(Math.max(0, d - 10), 45), nx = q.x + Math.cos(b) * k, ny = q.y + Math.sin(b) * k; if (!pointInObstacle(nx, ny, q.radius)) { q.x = nx; q.y = ny; } dealDamage(q, f.dmg, o.id, { knock: 1 }); } }); W10.push({ kind: 'implode', owner: o.id, x: f.x, y: f.y, t: 0.3, T: 0.3 }); AudioSys.playAt('block', f.x, f.y, 0.3); W10.splice(i, 1); continue; } }
        if (f.kind === 'well') { f.tick += dt; enemiesOf(o).forEach(e => { if (e.air > 0) return; const d = dist(e.x, e.y, f.x, f.y); if (d < f.R + e.radius) { if (d > 8) { const b = Math.atan2(f.y - e.y, f.x - e.x), k = Math.min(d - 6, f.pull * dt), nx = e.x + Math.cos(b) * k, ny = e.y + Math.sin(b) * k; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } } if (f.dmg && f.tick >= 0.25) dealDamage(e, f.dmg, o.id, { melee: true, knock: 1 }); } }); if (f.tick >= 0.25) f.tick = 0; if (f.t <= 0 && f.burst) { cubeAoe(o, f.x, f.y, 120, f.burst, { knock: 420, col: '#a78bfa' }); addShake(6); } }
        if (f.t > 0) continue;
        if (f.kind === 'bolt') { const e = players.find(q => q.id === f.tid), x = e && e.hp > 0 ? e.x + f.ox : null; if (x !== null) { explode(x, e.y + f.oy, o.id, f.big ? 32 : 17, f.big ? 115 : 72); } }
        else if (f.kind === 'mark') { beams.push({ x1: f.x + 30, y1: f.y - 400, x2: f.x, y2: f.y, life: 0.3, maxLife: 0.3, color: '#f472b6' }); enemiesOf(o).forEach(e => { if (dist(e.x, e.y, f.x, f.y) < 55 + e.radius) dealDamage(e, f.dmg, o.id, { knock: 120, angle: Math.atan2(e.y - f.y, e.x - f.x) }); }); ring(f.x, f.y, 6, 55, '#f472b6', 0.35, 5); AudioSys.playAt('rail', f.x, f.y, 0.35); }
        else if (f.kind === 'lock') { const e = players.find(q => q.id === f.tid); if (e && e.hp > 0) { beams.push({ x1: e.x + 40, y1: e.y - 420, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#fb7185' }); dealDamage(e, 30 * vD(o), o.id, { knock: 100 }); spark(e.x, e.y, '#fecdd3', 10, 220); AudioSys.playAt('rail', e.x, e.y, 0.3); } }
        else if (f.kind === 'shark') { enemiesOf(o).forEach(e => { if (dist(e.x, e.y, f.x, f.y) < 140 + e.radius) { dealDamage(e, 120 * vM(o), o.id, { melee: true, knock: 380, angle: Math.atan2(e.y - f.y, e.x - f.x) }); k5Lift(o, e, Math.atan2(e.y - f.y, e.x - f.x), 0.8); } }); W10.push({ kind: 'sharkBite', owner: o.id, x: f.x, y: f.y, t: 0.7, T: 0.7 }); addShake(12); hitStop(0.08); AudioSys.playAt('explosion', f.x, f.y, 0.6); floatText(f.x, f.y - 40, '🦈 CÁ MẬP!', '#e2e8f0', 18); }
        W10.splice(i, 1);
    }
};

/* ============================== HÌNH VẼ ============================== */
ART2.VANTUONG = (c, w, r, x0, ch, now, p) => {
    const M = w.mods ? VT[vtCur(w)] : VT.thunder;
    wood(c, x0 - 10, -2.2, 44, 4.4, 2); metal(c, x0 + 30, -3, 4, 6, '#475569', 1);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = M.col + '66'; c.beginPath(); c.arc(x0 + 40, 0, 9 + Math.sin(now * 6) * 1.5, 0, Math.PI * 2); c.fill(); c.restore();
    c.fillStyle = M.col; c.beginPath(); c.arc(x0 + 40, 0, 5.5, 0, Math.PI * 2); c.fill(); outl(c, 0.8);
    c.save(); c.translate(x0 + 40, 0); c.rotate(-c.getTransform().b > 0 ? 0 : 0); c.font = '7px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(M.icon, 0, 0.5); c.restore();
    MUZ.VANTUONG = x0 + 46;
};
const _drawW2FxR6 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR6(now);
    ctx.save(); ctx.lineCap = 'round';
    W10.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T, k = 1 - u;
        if (f.kind === 'katSpin') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a0 = o.angle + u * Math.PI * 2.2; ctx.strokeStyle = `rgba(186,230,253,${0.7 * k})`; ctx.lineWidth = 16 * k + 2; ctx.beginPath(); ctx.arc(o.x, o.y, 100, a0 - 2.6, a0); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(o.x, o.y, 116, a0 - 1.6, a0); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'bolt') { const e = players.find(q => q.id === f.tid); if (!e) return; const x = e.x + f.ox, y = e.y + f.oy; ctx.save(); ctx.translate(x, y); ctx.rotate(f.a); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(2, 0); ctx.stroke(); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(251,146,60,${0.4 + Math.sin(now * (10 + u * 30)) * 0.35})`; ctx.beginPath(); ctx.arc(x, y, (f.big ? 7 : 4) + u * 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'morph') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 6 + u * 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'lock') { const e = players.find(q => q.id === f.tid); if (!e) return; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(now * 3); ctx.strokeStyle = `rgba(251,113,133,${0.6 + u * 0.4})`; ctx.lineWidth = 2; const R = e.radius + 14 - u * 6; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(R - 5, 0); ctx.lineTo(R + 6, 0); ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'mark') { ctx.strokeStyle = `rgba(244,114,182,${0.5 + u * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x - 14, f.y); ctx.lineTo(f.x + 14, f.y); ctx.moveTo(f.x, f.y - 14); ctx.lineTo(f.x, f.y + 14); ctx.stroke(); ctx.beginPath(); ctx.arc(f.x, f.y, 55 * (1 - u * 0.6), 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'charge') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(251,113,133,${0.3 + u * 0.6})`; ctx.lineWidth = 1 + u * 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(f.a) * 1000, o.y + Math.sin(f.a) * 1000); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        else if (f.kind === 'giantWarn') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(244,114,182,${0.2 + u * 0.5 + Math.sin(now * 20) * 0.15})`; ctx.lineWidth = 90 * u + 4; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.restore(); ctx.strokeStyle = 'rgba(244,114,182,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 14, 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'giant') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [[110, 'rgba(244,114,182,'], [70, 'rgba(251,207,232,'], [26, 'rgba(255,255,255,']].forEach(([wd, c]) => { ctx.strokeStyle = c + k + ')'; ctx.lineWidth = wd * (0.6 + k * 0.4); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }); ctx.restore(); }
        else if (f.kind === 'shark') { ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#334155'; const s = 0.6 + u * 0.6; ctx.translate(f.x, f.y); ctx.rotate(now * 2); ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(10 * s, 8 * s); ctx.lineTo(-10 * s, 8 * s); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.strokeStyle = `rgba(148,163,184,${0.4 + u * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 140 * (0.4 + u * 0.6), 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'sharkBite') { ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = k; ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.ellipse(0, -u * 30, 46, 70 * (0.6 + u * 0.4), 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f8fafc'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 12 - 5, -u * 30); ctx.lineTo(i * 12, -u * 30 - 14); ctx.lineTo(i * 12 + 5, -u * 30); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(-18, -u * 30 - 40, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.strokeStyle = `rgba(186,230,253,${k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 60 + u * 90, 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'spike') { const h = Math.min(1, u * 6) * 22 * (k < 0.2 ? k / 0.2 : 1); ctx.fillStyle = '#bae6fd'; ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f.x - 9, f.y + 4); ctx.lineTo(f.x, f.y - h); ctx.lineTo(f.x + 9, f.y + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else if (f.kind === 'well') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let r = 0; r < 4; r++) { const a0 = -now * (5 + r) + r; ctx.strokeStyle = `rgba(167,139,250,${0.5 - r * 0.1})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.R * (0.25 + r * 0.22), a0, a0 + 2.4); ctx.stroke(); } ctx.restore(); ctx.fillStyle = '#0f0a1e'; ctx.beginPath(); ctx.arc(f.x, f.y, f.big ? 18 : 10, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.stroke(); }
        else if (f.kind === 'gorb') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(167,139,250,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + Math.sin(now * 20) * 2, now * 8, now * 8 + 4); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#1e1b4b'; ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1.5; ctx.stroke(); }
        else if (f.kind === 'implode') { ctx.strokeStyle = `rgba(167,139,250,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 85 * k + 6, 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'bspikes') { ctx.fillStyle = `rgba(220,38,38,${k})`; for (let i = 0; i < 16; i++) { const a = i * 0.39, r0 = 30, r1 = 60 + 100 * Math.min(1, u * 3); ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a - 0.08) * r0, f.y + Math.sin(a - 0.08) * r0); ctx.lineTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); ctx.lineTo(f.x + Math.cos(a + 0.08) * r0, f.y + Math.sin(a + 0.08) * r0); ctx.closePath(); ctx.fill(); } }
    });
    ctx.restore();
};
