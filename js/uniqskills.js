/** ==================== KỸ THUẬT CAO ĐỘC NHẤT ====================
 *  Thay các chiêu bị trùng (với Bậc Thầy của chính vũ khí hoặc với vũ khí khác) bằng cơ chế riêng, hợp vũ khí.
 *  Katana · Cung · Súng Phóng Lựu · Boomerang · AR · Song Đao · Tên Lửa · Tay Không · Nỏ Nổ · Nỏ Liên Châu · Gậy · Búa · Ổ Quay
 *  Nạp sau weapons2.js.
 */
const USK = []; // vật thể / hiệu ứng của các chiêu này
const uskMM = p => p.meleeMult || 1, uskDM = p => p.dmgMult || 1;
const nearestFoes = (p, R, n, from) => enemiesOf(p).filter(e => !(e.air > 0) && dist((from || p).x, (from || p).y, e.x, e.y) < R && lineOfSight((from || p).x, (from || p).y, e.x, e.y))
    .sort((u, v) => dist((from || p).x, (from || p).y, u.x, u.y) - dist((from || p).x, (from || p).y, v.x, v.y)).slice(0, n);
function afterImages(p, ax, ay, bx, by, n, col) { for (let i = 0; i < n; i++) { const k = i / Math.max(1, n - 1); USK.push({ kind: 'ghost', x: ax + (bx - ax) * k, y: ay + (by - ay) * k, r: p.radius, col, a: p.angle, t: 0.25 + k * 0.2, maxT: 0.45 }); } }

/* ---------- KATANA: Bạt Đao Thiểm Ảnh — thế thủ đỡ & phản đạn, rồi lướt chém xuyên, thu kiếm mới nổ vết chém ---------- */
function katanaHT(p) {
    p.katHT = { t: 0.42, a: aimDir(p), parried: 0 };
    p.st.invuln = Math.max(p.st.invuln || 0, 0.45); p.st.root = Math.max(p.st.root || 0, 0.42);
    floatText(p.x, p.y - 40, '⚔ BẠT ĐAO…', '#7dd3fc', 15); AudioSys.playAt('block', p.x, p.y, 0.3);
}
function updateKatanaHT(p, dt) {
    const K = p.katHT; if (!K) return;
    K.t -= dt;
    // thế thủ: đỡ mọi viên đạn quanh người, bắn ngược về kẻ đã bắn
    for (const b of bullets) {
        if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > p.radius + 70) continue;
        const src = players.find(q => q.id === b.owner);
        b.owner = p.id; b.angle = src ? Math.atan2(src.y - b.y, src.x - b.x) : b.angle + Math.PI; b.damage = (b.damage || 10) * 1.5; b.life = Math.max(b.life, 1); b.color = '#7dd3fc'; b.explosive = false;
        K.parried++; spark(b.x, b.y, '#e0f2fe', 8, 260); hitStop(0.03);
        if (K.parried <= 3) floatText(b.x, b.y - 10, 'KENG!', '#e0f2fe', 13 + K.parried);
        AudioSys.playAt('block', b.x, b.y, 0.35);
    }
    if (K.t > 0) return;
    // lướt chém
    p.katHT = null;
    const a = K.a, D = Math.max(60, rayFree(p.x, p.y, a, 330).d - p.radius);
    const ax = p.x, ay = p.y, bx = p.x + Math.cos(a) * D, by = p.y + Math.sin(a) * D;
    startTravel(p, bx, by, 0.12, null, null, 4);
    p.st.invuln = Math.max(p.st.invuln || 0, 0.35);
    afterImages(p, ax, ay, bx, by, 7, '#7dd3fc');
    USK.push({ kind: 'katLine', x1: ax, y1: ay, x2: bx, y2: by, t: 0.5, maxT: 0.5 });
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && segDist(b.x, b.y, ax, ay, bx, by) < 40) { spark(b.x, b.y, '#e0f2fe', 4, 160); bullets.splice(i, 1); } }
    const bonus = 1 + 0.25 * Math.min(3, K.parried);
    const victims = enemiesOf(p).filter(e => !(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < 46 + e.radius);
    AudioSys.playAt('whoosh', p.x, p.y, 0.7);
    p.shotQueue.push({ t: 0.26, fn: () => { // thu kiếm vào vỏ → vết chém nổ ra
        AudioSys.playAt('crit', p.x, p.y, 0.6); hitStop(0.08); addShake(8);
        floatText(p.x, p.y - 44, K.parried ? `⚔ THIỂM ẢNH ×${bonus.toFixed(2)}` : '⚔ THIỂM ẢNH', '#e0f2fe', 16);
        victims.forEach(e => {
            if (e.hp <= 0) return;
            dealDamage(e, 62 * bonus * uskMM(p), p.id, { melee: true, angle: a, knock: 120 });
            e.st.slow = Math.max(e.st.slow || 0, 1.2); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 1.5); e.st.burnBy = p.id; }
            USK.push({ kind: 'xcut', x: e.x, y: e.y, a, t: 0.4, maxT: 0.4 }); spark(e.x, e.y, '#fecaca', 14, 300);
        });
    } });
}

/* ---------- CUNG: Tên Ghim Hồn — mũi tên lớn ghim địch: trói + lộ vị trí; bị đẩy vào tường thì choáng ---------- */
function bowHT(p) {
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    USK.push({ kind: 'pin', owner: p.id, x: m.x, y: m.y, a, sp: 1500, d: 0, max: 720, t: 1, maxT: 1 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '🏹 TÊN GHIM HỒN', '#a3e635', 15); addShake(3);
}
/* ---------- SÚNG PHÓNG LỰU: Lựu Chùm Mẹ — quả mẹ nổ ra 6 quả con ---------- */
function launcherHT(p) {
    const a = aimDir(p), d = Math.max(120, Math.min(420, p.skillDist || 340)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    dropBomb(p, x, y, 45, 100, 0.7);
    p.shotQueue.push({ t: 0.72, fn: () => { for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3 + Math.random() * 0.4, r = 80 + Math.random() * 60; dropBomb(p, x + Math.cos(t) * r, y + Math.sin(t) * r, 30, 70, 0.35 + i * 0.07); } floatText(x, y - 30, '💥 TÁCH 6 QUẢ CON!', '#a3e635', 14); } });
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.4); floatText(p.x, p.y - 40, '🧨 LỰU CHÙM MẸ', '#a3e635', 15);
}
/* ---------- BOOMERANG: Lốc Xoáy — bay tới điểm, xoáy hút địch 1.2s rồi quay về ---------- */
function boomHT(p) {
    const a = aimDir(p), d = Math.max(120, Math.min(360, p.skillDist || 300));
    const end = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    USK.push({ kind: 'vortex', owner: p.id, x: p.x, y: p.y, ex: end.x, ey: end.y, phase: 0, t: 4, maxT: 4, hov: 1.2, tick: 0, hit: new Set() });
    AudioSys.playAt('whoosh', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '🪃 LỐC XOÁY BOOMERANG', '#fbbf24', 15);
}
/* ---------- AR: Đặt Chân Chế Áp — đứng tại chỗ, đạn vô hạn, bắn nhanh, giảm sát thương nhận; đạn trúng làm chậm ---------- */
function arHT(p) {
    p.st.anchor = Math.max(p.st.anchor || 0, 3); p.arSupT = world.time + 3;
    const w = getCurrentWeapon(p); if (w.magSize) { w.mag = effMag(p, w); w.reloading = false; }
    ring(p.x, p.y, 6, 60, '#a3e635', 0.4, 5); AudioSys.playAt('slam', p.x, p.y, 0.3);
    floatText(p.x, p.y - 40, '🎯 ĐẶT CHÂN CHẾ ÁP', '#a3e635', 15);
}
/* ---------- SONG ĐAO: Ảnh Đao Liên Sát — dịch chuyển ra sau lưng tối đa 4 địch, chém từng tên ---------- */
function daggersHT(p) {
    const T = nearestFoes(p, 360, 4);
    if (!T.length) { p.dashTime = 0.2; p.dashAngle = aimDir(p); floatText(p.x, p.y - 34, 'Không có mục tiêu', '#94a3b8', 12); return; }
    p.st.invuln = Math.max(p.st.invuln || 0, 0.15 * T.length + 0.25);
    floatText(p.x, p.y - 40, `🗡 ẢNH ĐAO LIÊN SÁT ×${T.length}`, '#e5e7eb', 15);
    T.forEach((e, i) => p.shotQueue.push({ t: i * 0.14, fn: () => {
        if (p.hp <= 0 || e.hp <= 0) return;
        const ea = e.angle || 0; let bx = e.x - Math.cos(ea) * (e.radius + p.radius + 4), by = e.y - Math.sin(ea) * (e.radius + p.radius + 4);
        if (pointInObstacle(bx, by, p.radius)) { const s = umbFreeSpot(p, bx, by); bx = s.x; by = s.y; }
        afterImages(p, p.x, p.y, bx, by, 4, '#e5e7eb');
        p.x = bx; p.y = by; p.kx = p.ky = 0; p.angle = Math.atan2(e.y - p.y, e.x - p.x);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: p.angle, range: 70, color: '#f1f5f9', width: 8, life: 0.16, maxLife: 0.16, swing: i % 2 ? 1 : -1, line: false });
        dealDamage(e, 24 * uskMM(p), p.id, { melee: true, knock: 80, angle: p.angle }); e.st.slow = Math.max(e.st.slow || 0, 1);
        spark(e.x, e.y, '#f1f5f9', 8, 220); AudioSys.playAt('swing', p.x, p.y, 0.5); hitStop(0.03);
    } }));
}
/* ---------- TÊN LỬA: Tên Lửa Dẫn Đường — một quả lớn bay theo tâm ngắm (bot: bám địch gần nhất) ---------- */
function rocketHT(p) {
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    USK.push({ kind: 'guided', owner: p.id, x: m.x, y: m.y, a, sp: 360, t: 3.2, maxT: 3.2 });
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.6); addShake(5); floatText(p.x, p.y - 40, '🚀 TÊN LỬA DẪN ĐƯỜNG', '#fb923c', 15);
}
/* ---------- TAY KHÔNG: Thăng Long Quật — tóm địch trước mặt, hất qua vai đập xuống sau lưng ---------- */
function fistHT(p) {
    const a = aimDir(p);
    const grab = () => enemiesOf(p).filter(e => !(e.air > 0) && dist(p.x, p.y, e.x, e.y) < p.radius + e.radius + 60 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 1.1)[0];
    const doIt = e => {
        dealDamage(e, 14 * uskMM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.6);
        const s = umbFreeSpot(p, p.x - Math.cos(a) * 140, p.y - Math.sin(a) * 140);
        startTravel(e, s.x, s.y, 0.42, 'umbLand', { fn: q => {
            dealDamage(q, 40 * uskMM(p), p.id, { melee: true, knock: 1 }); q.stun = Math.max(q.stun, 1.2);
            ring(q.x, q.y, 8, 90, '#fde68a', 0.45, 7); spark(q.x, q.y, '#fde68a', 16, 300); addShake(10); hitStop(0.07); AudioSys.playAt('slam', q.x, q.y, 0.6);
            floatText(q.x, q.y - 44, '💥 QUẬT NGÃ!', '#fde68a', 17);
        } }, 120);
        floatText(p.x, p.y - 40, '🐉 THĂNG LONG QUẬT!', '#fde68a', 15); AudioSys.playAt('swing', p.x, p.y, 0.6);
    };
    const e = grab();
    if (e) return doIt(e);
    p.dashTime = 0.16; p.dashAngle = a; floatText(p.x, p.y - 40, '🐉 TÓM…', '#fde68a', 13);
    p.shotQueue.push({ t: 0.18, fn: () => { const e2 = p.hp > 0 && grab(); if (e2) doIt(e2); } });
}
/* ---------- NỎ NỔ: Tên Bám Nổ — 3 mũi bám vào địch / tường rồi nổ ---------- */
function xbowxHT(p) {
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    [-0.12, 0, 0.12].forEach((o, i) => USK.push({ kind: 'sticky', owner: p.id, x: m.x, y: m.y, a: a + o, sp: 1100, d: 0, max: 520, t: 3, maxT: 3, fuse: 1.1 + i * 0.12 }));
    AudioSys.playAt('whoosh', p.x, p.y, 0.5); floatText(p.x, p.y - 40, '📌 TÊN BÁM NỔ', '#f97316', 15);
}
/* ---------- NỎ LIÊN CHÂU: Màn Tên Quét — quét qua lại một quạt 110° ---------- */
function xbowrHT(p) {
    const a = aimDir(p), N = 22, span = 0.95;
    for (let k = 0; k < 2; k++) for (let i = 0; i < N; i++) {
        const s = k === 0 ? -span + 2 * span * i / (N - 1) : span - 2 * span * i / (N - 1);
        p.shotQueue.push({ t: k * 0.72 + i * 0.03, fn: () => { if (p.hp > 0) { htBullet(p, aimDir(p) + s, { damage: 9 * uskDM(p), speed: 24, size: 3, color: '#fde68a', life: 0.75, trail: 30 }); if (i % 3 === 0) AudioSys.playAt('shoot', p.x, p.y, 0.12); } } });
    }
    floatText(p.x, p.y - 40, '🏹 MÀN TÊN QUÉT', '#fde68a', 15);
}
/* ---------- GẬY: Đỡ Bóng Home Run — 1.6s đánh bật mọi viên đạn bay tới thành cú home run về phía địch ---------- */
function batHT(p) { p.batStance = world.time + 1.6; floatText(p.x, p.y - 40, '⚾ VÀO THẾ ĐÁNH BÓNG', '#fde047', 15); AudioSys.playAt('ui', p.x, p.y, 0.4); }
function updateBatStance(p) {
    if (!(p.batStance > world.time)) { if (p.batStance) { p.batStance = 0; const w = getCurrentWeapon(p); if (w.id === 'BAT' && p.hp > 0) batSwing(p, w, p.angle, 1, 1.2, false, 1); } return; }
    p.st.slow = Math.max(p.st.slow || 0, 0.1);
    for (const b of bullets) {
        if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > p.radius + 58) continue;
        const tgt = nearestFoes(p, 900, 1, b)[0] || players.find(q => q.id === b.owner);
        b.owner = p.id; b.angle = tgt ? Math.atan2(tgt.y - b.y, tgt.x - b.x) : b.angle + Math.PI; b.speed = Math.min(40, (b.speed || 20) * 1.6); b.damage = (b.damage || 10) * 2; b.life = 1.2; b.color = '#fde047'; b.size = Math.max(b.size || 3, 5); b.trail = 60;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: Math.atan2(b.y - p.y, b.x - p.x), range: 70, color: '#fde047', width: 9, life: 0.15, maxLife: 0.15, swing: 1, line: false });
        floatText(b.x, b.y - 12, '⚾ HOME RUN!', '#fde047', 14); AudioSys.playAt('crit', b.x, b.y, 0.4); hitStop(0.03);
    }
}
/* ---------- BÚA: Búa Sấm Ném — ném búa tới điểm, nện gọi sét, rồi bay về tay ---------- */
function hammerHT(p) {
    const a = aimDir(p), d = Math.max(100, Math.min(360, p.skillDist || 300)), D = Math.max(60, rayFree(p.x, p.y, a, d).d);
    USK.push({ kind: 'hammer', owner: p.id, x: p.x, y: p.y, ex: p.x + Math.cos(a) * D, ey: p.y + Math.sin(a) * D, phase: 0, t: 4, maxT: 4, hit: new Set(), wait: 0.45 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '🔨 BÚA SẤM NÉM', '#fde047', 15);
}
/* ---------- Ổ QUAY: Sáu Viên Định Mệnh — khoá tối đa 6 phát lên các địch nhìn thấy, rồi bắn chính xác ---------- */
function revolverHT(p) {
    const T = nearestFoes(p, 700, 6).filter(e => targetable(p, e));
    if (!T.length) { fan(p, 6, 0.6, aimDir(p), { damage: 26 * uskDM(p), speed: 26, color: '#fca5a5', size: 4.5, life: 0.8 }); return; }
    const seq = []; for (let i = 0; i < 6; i++) seq.push(T[i % T.length]);
    seq.forEach(e => USK.push({ kind: 'mark', owner: p.id, tid: e.id, t: 0.55, maxT: 0.55 }));
    p.st.root = Math.max(p.st.root || 0, 0.55); floatText(p.x, p.y - 40, '🤠 ĐỊNH MỆNH…', '#fca5a5', 15); AudioSys.playAt('tick', p.x, p.y, 0.5);
    seq.forEach((e, i) => p.shotQueue.push({ t: 0.55 + i * 0.08, fn: () => {
        if (p.hp <= 0 || e.hp <= 0) return;
        const a = Math.atan2(e.y - p.y, e.x - p.x); p.angle = a;
        htBullet(p, a, { damage: 28 * uskDM(p), speed: 42, size: 4.5, color: '#fecaca', life: 0.9, trail: 70, crit: true, knock: 160 });
        AudioSys.playAt('shoot_heavy', p.x, p.y, 0.35); addShake(3); p.muzzle = 0.06; p.recoil = 1;
    } }));
}

Object.assign(HT, {
    KATANA: ['BẠT ĐAO THIỂM ẢNH', katanaHT], BOW: ['TÊN GHIM HỒN', bowHT], LAUNCHER: ['LỰU CHÙM MẸ', launcherHT], BOOMERANG: ['LỐC XOÁY BOOMERANG', boomHT],
    AR: ['ĐẶT CHÂN CHẾ ÁP', arHT], DAGGERS: ['ẢNH ĐAO LIÊN SÁT', daggersHT], ROCKET: ['TÊN LỬA DẪN ĐƯỜNG', rocketHT], NONE: ['THĂNG LONG QUẬT', fistHT],
    XBOWX: ['TÊN BÁM NỔ', xbowxHT], XBOWR: ['MÀN TÊN QUÉT', xbowrHT], BAT: ['ĐỠ BÓNG HOME RUN', batHT], HAMMER: ['BÚA SẤM NÉM', hammerHT], REVOLVER: ['SÁU VIÊN ĐỊNH MỆNH', revolverHT]
});
Object.assign(HT_PROFILE, {
    KATANA: { aim: 'dir', R: 330, shape: 'line', w: 46, col: '125,211,252', tag: '⚔ ĐỠ ĐẠN → LƯỚT CHÉM' }, BOW: { aim: 'dir', R: 720, shape: 'line', w: 16, col: '163,230,53' },
    LAUNCHER: { aim: 'point', R: 420, shape: 'point', aoe: 190, arc: true, col: '163,230,53' }, BOOMERANG: { aim: 'point', R: 360, shape: 'point', aoe: 140, arc: true, col: '251,191,36' },
    AR: { aim: 'dir', R: 600, shape: 'cone', half: 0.12, col: '163,230,53', tag: '🎯 ĐỨNG YÊN 3s' }, DAGGERS: { aim: null, shape: 'selfaoe', aoe: 360, col: '229,231,235' },
    ROCKET: { aim: 'dir', R: 900, shape: 'line', w: 30, col: '251,146,60', tag: '🚀 BAY THEO TÂM NGẮM' }, NONE: { aim: 'dir', R: 95, shape: 'cone', half: 1.1, col: '253,230,138', tag: '🐉 TÓM & QUẬT' },
    XBOWX: { aim: 'dir', R: 520, shape: 'cone', half: 0.14, col: '249,115,22' }, XBOWR: { aim: 'dir', R: 560, shape: 'cone', half: 0.95, col: '253,230,138' },
    BAT: { aim: null, shape: 'selfaoe', aoe: 75, col: '253,224,71', tag: '⚾ ĐÁNH BẬT ĐẠN 1.6s' }, HAMMER: { aim: 'point', R: 360, shape: 'point', aoe: 220, arc: true, col: '253,224,71' },
    REVOLVER: { aim: null, shape: 'selfaoe', aoe: 700, col: '252,165,165', tag: '🤠 KHOÁ 6 PHÁT' }
});

/* ============================== CẬP NHẬT ============================== */
const _dealDamageUSK = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.arSupT > world.time && !opts.zone) dmg *= 0.75; // Chế Áp: vững chân
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target && atk.arSupT > world.time && !opts.melee && !opts.zone && target && target.st) target.st.slow = Math.max(target.st.slow || 0, 0.5);
    return _dealDamageUSK(target, dmg, attackerId, opts);
};
function uskHitFoe(o, x, y, r, skip) { return enemiesOf(o).find(e => !(e.air > 0) && !(skip && skip.has(e.id)) && dist(e.x, e.y, x, y) < e.radius + r); }
function uskWall(x, y) { return x < 4 || y < 4 || x > MAP_W - 4 || y > MAP_H - 4 || !!pointInObstacle(x, y, 0); }
function updateUSK(dt) {
    for (let i = USK.length - 1; i >= 0; i--) {
        const f = USK[i]; if (!f) continue; f.t -= dt;
        const o = f.owner !== undefined ? players.find(q => q.id === f.owner) : null;
        if (f.kind === 'pin' && o) {
            const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            if (Math.random() < 0.8) particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: 'rgba(163,230,53,0.5)', size: 3 });
            const e = uskHitFoe(o, f.x, f.y, 10);
            if (e) {
                dealDamage(e, 55 * uskDM(o), o.id, { angle: f.a, knock: 1 }); e.st.root = Math.max(e.st.root || 0, 1.5); spotFor(e, o.id, 4);
                // đẩy về sau; chạm tường thì bị ghim
                let pinned = false;
                for (let d = 8; d <= 70; d += 8) { const nx = e.x + Math.cos(f.a) * 8, ny = e.y + Math.sin(f.a) * 8; if (pointInObstacle(nx, ny, e.radius)) { pinned = true; break; } e.x = nx; e.y = ny; }
                if (pinned) { e.stun = Math.max(e.stun, 1.3); dealDamage(e, 25 * uskDM(o), o.id, { knock: 1 }); floatText(e.x, e.y - 50, '📌 GHIM TƯỜNG!', '#a3e635', 16); addShake(6); AudioSys.playAt('slam', e.x, e.y, 0.4); }
                else floatText(e.x, e.y - 44, '🏹 GHIM HỒN!', '#a3e635', 15);
                ring(e.x, e.y, 5, 50, '#a3e635', 0.4, 4); f.t = 0;
            } else if (uskWall(f.x, f.y) || f.d >= f.max) { spark(f.x, f.y, '#a3e635', 6, 150); f.t = 0; }
        } else if (f.kind === 'vortex' && o) {
            const sp = 760 * dt;
            if (f.phase === 0) { const d = dist(f.x, f.y, f.ex, f.ey); if (d <= sp) { f.x = f.ex; f.y = f.ey; f.phase = 1; } else { const a = Math.atan2(f.ey - f.y, f.ex - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp; } }
            else if (f.phase === 1) {
                f.hov -= dt; f.tick += dt;
                enemiesOf(o).forEach(e => { const d = dist(e.x, e.y, f.x, f.y); if (e.air > 0 || d > 150) return; const a = Math.atan2(f.y - e.y, f.x - e.x), mv = Math.min(d, 140 * dt); const nx = e.x + Math.cos(a) * mv, ny = e.y + Math.sin(a) * mv; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } e.st.slow = Math.max(e.st.slow || 0, 0.2); });
                if (f.tick >= 0.2) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 48) dealDamage(e, 9 * uskDM(o), o.id, { knock: 1 }); }); }
                if (Math.random() < 0.6) particles.push({ x: f.x + (Math.random() - 0.5) * 120, y: f.y + (Math.random() - 0.5) * 120, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: 'rgba(251,191,36,0.35)', size: 3 });
                if (f.hov <= 0) { f.phase = 2; f.hit.clear(); }
            } else {
                const d = dist(f.x, f.y, o.x, o.y); if (d <= sp + o.radius) { f.t = 0; continue; }
                const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp;
            }
            if (f.phase !== 1) { const e = uskHitFoe(o, f.x, f.y, 30, f.hit); if (e) { f.hit.add(e.id); dealDamage(e, 22 * uskDM(o), o.id, { knock: 160, angle: Math.atan2(e.y - f.y, e.x - f.x) }); } }
            f.t = Math.max(f.t, 0.1);
        } else if (f.kind === 'guided' && o) {
            let tx, ty;
            if (o.isBot) { const e = nearestFoes(o, 1400, 1, f)[0]; if (e) { tx = e.x; ty = e.y; } }
            else { const D = dist(o.x, o.y, f.x, f.y) + 220; tx = o.x + Math.cos(o.angle) * D; ty = o.y + Math.sin(o.angle) * D; }
            if (tx !== undefined) { const want = Math.atan2(ty - f.y, tx - f.x), da = angleDiff(want, f.a); f.a += Math.max(-3.2 * dt, Math.min(3.2 * dt, da)); }
            f.sp = Math.min(620, f.sp + 140 * dt);
            f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt;
            particles.push({ x: f.x - Math.cos(f.a) * 12, y: f.y - Math.sin(f.a) * 12, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.6, maxLife: 0.6, color: 'rgba(203,213,225,0.45)', size: 6, grow: true });
            if (uskHitFoe(o, f.x, f.y, 14) || uskWall(f.x, f.y) || f.t <= 0) { explode(f.x, f.y, o.id, 110, 150); f.t = 0; }
        } else if (f.kind === 'sticky' && o) {
            if (f.stuckTo !== undefined) { const e = players.find(q => q.id === f.stuckTo); if (e && e.hp > 0) { f.x = e.x + f.ox; f.y = e.y + f.oy; } }
            else if (!f.stuck) {
                const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
                const e = uskHitFoe(o, f.x, f.y, 8);
                if (e) { f.stuckTo = e.id; f.ox = f.x - e.x; f.oy = f.y - e.y; dealDamage(e, 8 * uskDM(o), o.id, { knock: 1 }); floatText(e.x, e.y - 40, '📌 DÍNH!', '#f97316', 13); }
                else if (uskWall(f.x, f.y) || f.d >= f.max) f.stuck = true;
            }
            if (f.stuckTo !== undefined || f.stuck) { f.fuse -= dt; if (f.fuse <= 0) { explode(f.x, f.y, o.id, 42, 85); f.t = 0; } }
        } else if (f.kind === 'hammer' && o) {
            const sp = 900 * dt;
            if (f.phase === 0) {
                const d = dist(f.x, f.y, f.ex, f.ey);
                if (d <= sp) {
                    f.x = f.ex; f.y = f.ey; f.phase = 1;
                    ring(f.x, f.y, 10, 120, '#fde047', 0.5, 8); addShake(9); AudioSys.playAt('slam', f.x, f.y, 0.6);
                    enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < 110 + e.radius) { dealDamage(e, 30 * uskMM(o), o.id, { melee: true, knock: 260, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.stun = Math.max(e.stun, 0.5); } });
                    nearestFoes(o, 230, 3, f).forEach((e, k) => o.shotQueue.push({ t: 0.08 + k * 0.1, fn: () => { if (e.hp <= 0) return; beams.push({ x1: e.x + 30, y1: e.y - 300, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#fde68a', zig: true }); dealDamage(e, 25 * uskMM(o), o.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.4); spark(e.x, e.y, '#fef9c3', 12, 260); AudioSys.playAt('rail', e.x, e.y, 0.4); } }));
                } else { const a = Math.atan2(f.ey - f.y, f.ex - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp; }
            } else if (f.phase === 1) { f.wait -= dt; if (f.wait <= 0) { f.phase = 2; f.hit.clear(); } }
            else {
                const d = dist(f.x, f.y, o.x, o.y); if (d <= sp * 1.1 + o.radius) { f.t = 0; ring(o.x, o.y, 4, 40, '#fde047', 0.3, 3); continue; }
                const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * sp * 1.1; f.y += Math.sin(a) * sp * 1.1;
            }
            if (f.phase !== 1) { const e = uskHitFoe(o, f.x, f.y, 26, f.hit); if (e) { f.hit.add(e.id); dealDamage(e, 20 * uskMM(o), o.id, { melee: true, knock: 220, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.stun = Math.max(e.stun, 0.3); } }
            f.t = Math.max(f.t, 0.1);
        }
        if (f.t <= 0) USK.splice(i, 1);
    }
}
const _upeUSK = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeUSK(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    updateUSK(dt);
    players.forEach(p => {
        if (p.hp <= 0) { p.katHT = null; return; }
        if (p.katHT) updateKatanaHT(p, dt);
        if (p.batStance) updateBatStance(p);
        if (p.arSupT > world.time) { const w = getCurrentWeapon(p); if (w.magSize && w.mag < 2) { w.mag = effMag(p, w); w.reloading = false; } }
    });
};

/* ============================== VẼ ============================== */
const _drawW2FxUSK = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxUSK(now);
    ctx.save(); ctx.lineCap = 'round';
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.katHT) { // thế bạt đao: vòng tròn xanh, tia sáng tụ vào chuôi kiếm
            const k = 1 - p.katHT.t / 0.42;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(125,211,252,${0.5 + k * 0.4})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 70 - k * 30, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4 + now * 2, r0 = p.radius + 70 - k * 50; ctx.strokeStyle = `rgba(224,242,254,${0.3 + k * 0.5})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(t) * r0, p.y + Math.sin(t) * r0); ctx.lineTo(p.x + Math.cos(t) * (r0 - 14), p.y + Math.sin(t) * (r0 - 14)); ctx.stroke(); }
            const a = p.katHT.a; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * 320, p.y + Math.sin(a) * 320); ctx.stroke(); ctx.setLineDash([]);
            ctx.restore();
        }
        if (p.batStance > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,224,71,${0.45 + Math.sin(now * 14) * 0.2})`; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -now * 60; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 58, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        if (p.arSupT > world.time) { ctx.save(); ctx.strokeStyle = 'rgba(163,230,53,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 14, p.angle - 1.1, p.angle + 1.1); ctx.stroke(); ctx.fillStyle = 'rgba(120,113,108,0.85)'; for (let i = -2; i <= 2; i++) { const t = p.angle + i * 0.45; ctx.beginPath(); ctx.ellipse(p.x + Math.cos(t) * (p.radius + 14), p.y + Math.sin(t) * (p.radius + 14), 8, 5, t + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    });
    USK.forEach(f => {
        const k = Math.max(0, f.t / f.maxT);
        if (f.kind === 'ghost') { ctx.save(); ctx.globalAlpha = k * 0.5; ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'katLine') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(224,242,254,${k})`; ctx.lineWidth = 3 * k + 1; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = `rgba(125,211,252,${k * 0.4})`; ctx.lineWidth = 14 * k; ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'xcut') { ctx.save(); ctx.translate(f.x, f.y); ctx.globalCompositeOperation = 'lighter'; const L = 34 * (1.2 - k * 0.2); [f.a + 0.6, f.a - 0.6].forEach(t => { ctx.strokeStyle = `rgba(254,202,202,${k})`; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.moveTo(-Math.cos(t) * L, -Math.sin(t) * L); ctx.lineTo(Math.cos(t) * L, Math.sin(t) * L); ctx.stroke(); }); ctx.restore(); }
        else if (f.kind === 'pin') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#d9f99d'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -6); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(163,230,53,0.5)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'vortex') { ctx.save(); ctx.translate(f.x, f.y); if (f.phase === 1) { ctx.strokeStyle = 'rgba(251,191,36,0.35)'; ctx.lineWidth = 2; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(0, 0, 50 + j * 35, now * (4 - j) , now * (4 - j) + 4); ctx.stroke(); } } ctx.rotate(now * 20); ctx.fillStyle = '#f59e0b'; for (let j = 0; j < 2; j++) { ctx.rotate(Math.PI); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -6, 26, 4); ctx.quadraticCurveTo(12, 4, 0, 6); ctx.closePath(); ctx.fill(); } ctx.restore(); }
        else if (f.kind === 'guided') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-12, -4, 20, 8); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(16, 0); ctx.lineTo(8, 4); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(251,146,60,0.9)'; ctx.beginPath(); ctx.arc(-14, 0, 5 + Math.random() * 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); const o = players.find(q => q.id === f.owner); if (o && o === localPlayer()) { ctx.strokeStyle = 'rgba(251,146,60,0.25)'; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(f.a) * 120, f.y + Math.sin(f.a) * 120); ctx.stroke(); ctx.setLineDash([]); } }
        else if (f.kind === 'sticky') { const blink = (f.stuckTo !== undefined || f.stuck) && Math.sin(now * 30) > 0; ctx.fillStyle = blink ? '#fef08a' : '#ef4444'; ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - Math.cos(f.a) * 14, f.y - Math.sin(f.a) * 14); ctx.stroke(); if (f.stuckTo !== undefined || f.stuck) { ctx.strokeStyle = 'rgba(249,115,22,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, 85 * (1 - Math.max(0, f.fuse) / 1.4), 0, Math.PI * 2); ctx.stroke(); } }
        else if (f.kind === 'hammer') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.phase === 1 ? 0 : now * 16); ctx.fillStyle = '#78716c'; ctx.fillRect(-3, -2, 26, 4); ctx.fillStyle = '#d6d3d1'; ctx.fillRect(-14, -10, 16, 20); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.2; ctx.strokeRect(-14, -10, 16, 20); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,224,71,${0.4 + Math.random() * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-6, 0, 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'mark') { const e = players.find(q => q.id === f.tid); if (e) { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(now * 3); ctx.strokeStyle = `rgba(252,165,165,${0.5 + (1 - k) * 0.5})`; ctx.lineWidth = 2; const r = e.radius + 8 + k * 16; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); for (let j = 0; j < 4; j++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(r - 6, 0); ctx.lineTo(r + 6, 0); ctx.stroke(); } ctx.restore(); } }
    });
    ctx.restore();
};

/* ---------- RÌU: Liệt Địa Trảm — giơ rìu bổ xuống, vết nứt chạy thẳng tới trước hất tung địch, phá vật cản, để lại khe nứt làm chậm ---------- */
function axeHT(p) {
    const a = aimDir(p);
    p.st.root = Math.max(p.st.root || 0, 0.3);
    USK.push({ kind: 'axeWind', owner: p.id, a, t: 0.3, maxT: 0.3 });
    floatText(p.x, p.y - 40, '🪓 LIỆT ĐỊA TRẢM!', '#f97316', 15); AudioSys.playAt('swing', p.x, p.y, 0.5);
    p.shotQueue.push({ t: 0.3, fn: () => {
        if (p.hp <= 0) return;
        const x0 = p.x + Math.cos(a) * (p.radius + 10), y0 = p.y + Math.sin(a) * (p.radius + 10);
        USK.push({ kind: 'fissure', owner: p.id, x0, y0, a, d: 0, max: 400, sp: 950, t: 4, maxT: 4, hit: new Set(), segs: [], broke: new Set() });
        ring(x0, y0, 8, 60, '#f97316', 0.35, 6); addShake(9); hitStop(0.05); AudioSys.playAt('slam', x0, y0, 0.6);
    } });
}
function updateFissure(f, o, dt) {
    if (f.d < f.max) {
        const step = Math.min(f.sp * dt, f.max - f.d); f.d += step;
        const x = f.x0 + Math.cos(f.a) * f.d, y = f.y0 + Math.sin(f.a) * f.d;
        if (!f.segs.length || dist(x, y, f.segs[f.segs.length - 1].x, f.segs[f.segs.length - 1].y) > 22) {
            f.segs.push({ x, y, born: world.time, j: (Math.random() - 0.5) * 14 });
            for (let k = 0; k < 3; k++) particles.push({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, life: 0.5, maxLife: 0.5, color: Math.random() < 0.5 ? '#78350f' : '#a8a29e', size: 3 + Math.random() * 3 });
            if (f.segs.length % 3 === 0) AudioSys.playAt('hit', x, y, 0.2);
        }
        // phá vật cản trên đường nứt (mỗi vật cản 1 lần)
        const ob = pointInObstacle(x, y, 4);
        if (ob && !f.broke.has(ob)) { f.broke.add(ob); damageObstacle(ob, 90, o); spark(x, y, '#d6d3d1', 12, 240); addShake(4); }
        // hất tung địch: bị đẩy sang hai bên vết nứt
        enemiesOf(o).forEach(e => {
            if (e.air > 0 || f.hit.has(e.id) || dist(e.x, e.y, x, y) > e.radius + 34) return;
            f.hit.add(e.id);
            const side = Math.sign(Math.sin(Math.atan2(e.y - f.y0, e.x - f.x0) - f.a)) || 1;
            dealDamage(e, 34 * uskMM(o), o.id, { melee: true, knock: 300, angle: f.a + side * Math.PI / 2 });
            e.stun = Math.max(e.stun, 0.75);
            floatText(e.x, e.y - 44, '⛰ HẤT TUNG!', '#fdba74', 14); spark(e.x, e.y, '#fdba74', 10, 260);
        });
    }
    // khe nứt còn lại: làm chậm địch đứng trên đó
    if (f.segs.length && f.t > 0.4) enemiesOf(o).forEach(e => { if (!(e.air > 0) && f.segs.some(s => dist(e.x, e.y, s.x, s.y) < 26)) e.st.slow = Math.max(e.st.slow || 0, 0.2); });
}
HT.AXE = ['LIỆT ĐỊA TRẢM', axeHT];
HT_PROFILE.AXE = { aim: 'dir', R: 410, shape: 'line', w: 68, col: '249,115,22', tag: '⛰ VẾT NỨT PHÁ VẬT CẢN' };
const _updateUSKAxe = updateUSK;
updateUSK = function (dt) {
    USK.forEach(f => { if (f.kind === 'fissure') { const o = players.find(q => q.id === f.owner); if (o) updateFissure(f, o, dt); } });
    return _updateUSKAxe(dt);
};
const _drawW2FxAxe = drawW2Fx;
drawW2Fx = function (now) {
    USK.forEach(f => { // khe nứt vẽ dưới các hiệu ứng khác
        if (f.kind !== 'fissure' || f.segs.length < 1) return;
        const k = Math.min(1, f.t / 0.6);
        ctx.save(); ctx.globalAlpha = k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const nx = -Math.sin(f.a), ny = Math.cos(f.a);
        const path = () => { ctx.beginPath(); ctx.moveTo(f.x0, f.y0); f.segs.forEach(s => ctx.lineTo(s.x + nx * s.j, s.y + ny * s.j)); };
        path(); ctx.strokeStyle = 'rgba(41,24,12,0.85)'; ctx.lineWidth = 12; ctx.stroke();
        path(); ctx.strokeStyle = 'rgba(15,10,6,0.95)'; ctx.lineWidth = 5; ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        path(); ctx.strokeStyle = `rgba(249,115,22,${0.25 + 0.35 * Math.max(0, 1 - (world.time - f.segs[0].born) / 1.2)})`; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        // đá nhô lên ở đoạn vừa nứt
        f.segs.forEach(s => {
            const age = world.time - s.born; if (age > 0.45) return;
            const h = Math.sin(Math.min(1, age / 0.45) * Math.PI) * 16;
            ctx.fillStyle = '#78716c'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
            [-1, 1].forEach(sd => { const bx = s.x + nx * sd * 10, by = s.y + ny * sd * 10; ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx, by - h); ctx.lineTo(bx + 6, by); ctx.closePath(); ctx.fill(); ctx.stroke(); });
        });
        ctx.restore();
    });
    _drawW2FxAxe(now);
    USK.forEach(f => { // giơ rìu lên trước khi bổ
        if (f.kind !== 'axeWind') return; const o = players.find(q => q.id === f.owner); if (!o) return;
        const k = 1 - Math.max(0, f.t) / f.maxT;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(249,115,22,${0.3 + k * 0.6})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 12 + k * 10, f.a - 0.9, f.a + 0.9); ctx.stroke();
        ctx.setLineDash([6, 6]); ctx.strokeStyle = `rgba(253,186,116,${0.25 + k * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(f.a) * 400, o.y + Math.sin(f.a) * 400); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
    });
};
