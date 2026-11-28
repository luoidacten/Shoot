/** ==================== REWORK 22 ====================
 *  1) RÌU SĂN có lại 2 dạng (vũ khí đa hình): RÌU ↔ SHOTGUN, mỗi lần chuyển dạng là 1 chiêu.
 *  2) TRƯỜNG KIẾM: vệt chém riêng từng hệ (Kim mảnh sắc · Thủy sóng nước · Mộc lá xoáy · Hỏa lưỡi lửa · Thổ đá văng),
 *     hiệu ứng trúng + chữ rõ ràng (XUYÊN GIÁP / CHẬM / HÚT MÁU / ĐỐT / ĐẨY), trạng thái hiện trên người địch.
 *  3) Kỹ Thuật Cao 5 hệ vẽ lại; Mộc làm lại thành CÂY NGỤC (cây cổ thụ mọc lên, dây roi quất kéo & trói địch, hồi máu cho mình).
 *  4) Bậc Thầy: sau Ngũ Hành Luân Trảm, 5 thanh kiếm 5 hệ rơi xuống quanh người — nhặt 1 cây → đòn kế là ĐÒN ĐẶC TRƯNG của hệ đó.
 */
const W22 = [];
const now22 = () => world.time;

/* ============================== 1) RÌU SĂN 2 DẠNG ============================== */
Object.assign(WEAPONS.AXEGUN, {
    desc: 'Đa hình 2 dạng dùng chung 2 NÒNG ĐẠN. 🪓 RÌU: chém – chém – BỔ, mỗi lần chém trúng nạp 1 đạn & gắn DẤU SĂN. Giữ thả: NỆN ĐẤT nổ + bật lùi → chuyển SHOTGUN. 🔫 SHOTGUN: chạm = bắn 1 nòng (7 viên), giữ thả khi đủ 2 nòng = SONG NÒNG (14 viên, giật lùi); trúng kẻ có Dấu Săn +35%; ở dạng súng tự nạp 1 đạn mỗi 2 giây. Hết đạn: giữ thả = LAO XOAY chém xuyên → về RÌU (nạp 1 đạn).'
});
function agSetForm22(w, f) { w.form = f; w.type = f === 'axe' ? 'MELEE' : 'GUN'; w.aim = f === 'axe' ? 'arc' : 'line'; w.range = f === 'axe' ? 95 : 240; }
function agShoot22(p, w, ang, n) {
    const m0 = muzzle(p, w, ang);
    for (let i = 0; i < 7 * n; i++) { const b = spawnBullet(p, m0.x, m0.y, ang + (Math.random() - 0.5) * (n > 1 ? 0.7 : 0.42), { speed: 18 + Math.random() * 6, damage: 13 * attackMult(p, w), range: 250, knock: 130, size: 3.2, trail: 22, color: n > 1 ? '#fb923c' : '#fde68a', burn: n > 1 }); b.ag21 = true; }
    p.kx -= Math.cos(ang) * 170 * n; p.ky -= Math.sin(ang) * 170 * n;
    if (n > 1) { p.dashTime = 0.14; p.dashAngle = ang + Math.PI; }
    directionalSpark(m0.x, m0.y, ang, '#fde68a', 9 * n, 460, 0.5); smoke(m0.x, m0.y, 3 * n, 'rgba(214,211,209,0.4)', 14);
    AudioSys.playAt('shotgun', p.x, p.y, 0.6 + 0.2 * n); addShake(4 + 3 * n); p.muzzle = 0.08;
}
agFire21 = function (p, w, ang, charge) { // thay hẳn bản rework21 (kể cả đường AI gọi axeFire)
    const now = now22(); w.ch = w.ch || 0; if (w.form !== 'gun') w.form = 'axe';
    if (w.out21) w.out21 = false;
    if (w.form === 'axe') {
        if (charge >= 0.9) { // NỆN ĐẤT → SHOTGUN
            meleeBook(p, w, ang, 22);
            const x = p.x + Math.cos(ang) * 55, y = p.y + Math.sin(ang) * 55;
            ring(x, y, 8, 95, '#f97316', 0.4, 7); spark(x, y, '#fdba74', 18, 300); smoke(x, y, 5, 'rgba(120,113,108,0.4)', 16); addShake(7); AudioSys.playAt('ground', x, y, 0.6); AudioSys.playAt('explosion', x, y, 0.3);
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < 95 + e.radius) { dealDamage(e, 30 * (p.meleeMult || 1), p.id, { melee: true, knock: 380, angle: Math.atan2(e.y - y, e.x - x) }); e.stun = Math.max(e.stun, 0.4); e.ag21Mark = now + 2.5; e.ag21By = p.id; } });
            const s = umbFreeSpot(p, p.x - Math.cos(ang) * 170, p.y - Math.sin(ang) * 170); startTravel(p, s.x, s.y, 0.32, null, null, 55); p.st.invuln = Math.max(p.st.invuln || 0, 0.2);
            agSetForm22(w, 'gun'); w.reg22 = 0; floatText(p.x, p.y - 46, '💥 NỆN ĐẤT → 🔫 SHOTGUN', '#fdba74', 14);
            return;
        }
        const n = (p.ag21N = now - (p.ag21T || -9) < 1.2 ? ((p.ag21N || 0) % 3) + 1 : 1); p.ag21T = now;
        meleeBook(p, w, ang, n === 3 ? 28 : 18);
        const m = attackMult(p, w) * (p.meleeMult || 1), R = n === 3 ? 112 : 96, half = n === 3 ? 0.55 : 1.05, dmg = (n === 3 ? 40 : 26) * m;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: R + p.radius, color: n === 3 ? '#fca5a5' : '#e5e7eb', width: n === 3 ? 14 : 10, life: 0.2, maxLife: 0.2, swing: n === 2 ? -1 : 1, line: n === 3 });
        const hit = arcFoes(p, ang, R, half);
        hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: n === 3 ? 320 : 160, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.ag21Mark = now + 2.5; e.ag21By = p.id; if (n === 3) e.stun = Math.max(e.stun, 0.35); p.stats.hits++; });
        if (hit.length) { const b0 = w.ch; w.ch = Math.min(2, w.ch + 1); if (w.ch > b0) floatText(p.x, p.y - 30, `🔶 NẠP ${w.ch}/2`, '#fdba74', 12); hitStop(n === 3 ? 0.06 : 0.035); addShake(n === 3 ? 5 : 2); }
        AudioSys.playAt(n === 3 ? 'slam' : 'swing', p.x, p.y, 0.5);
        hitDecoysObs(p, p.x + Math.cos(ang) * 60, p.y + Math.sin(ang) * 60, 40, dmg);
        return;
    }
    // ---- dạng SHOTGUN ----
    p.lastFireT = now; p.angle = ang; onAttack(p); p.stats.shots++; if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    if (charge >= 0.9) {
        if (w.ch >= 2) { p.cooldown = 30 * p.fireRateMult; w.ch = 0; agShoot22(p, w, ang, 2); floatText(p.x, p.y - 40, '💥💥 SONG NÒNG!', '#fb923c', 15); return; }
        if (w.ch === 0) { // LAO XOAY → RÌU
            p.cooldown = 22 * p.fireRateMult;
            const D = Math.max(60, rayFree(p.x, p.y, ang, 240).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(ang) * D, by = p.y + Math.sin(ang) * D;
            startTravel(p, bx, by, 0.3, null, null, 12); p.st.invuln = Math.max(p.st.invuln || 0, 0.3);
            W22.push({ kind: 'agSpin', owner: p.id, t: 0.4, T: 0.4 });
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 44) { dealDamage(e, 32 * (p.meleeMult || 1), p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - ay, e.x - ax) }); e.ag21Mark = now + 2.5; e.ag21By = p.id; } });
            agSetForm22(w, 'axe'); w.ch = 1; floatText(p.x, p.y - 46, '🌀 LAO XOAY → 🪓 RÌU', '#fdba74', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
            return;
        }
        // còn 1 nòng: bắn nốt
    }
    if (w.ch <= 0) { p.cooldown = 12; if (!p.isBot) floatText(p.x, p.y - 30, '🔶 Hết đạn — giữ thả để LAO XOAY về rìu', '#fdba74', 11); AudioSys.playAt('tick', p.x, p.y, 0.3); return; }
    p.cooldown = 24 * p.fireRateMult; w.ch--; agShoot22(p, w, ang, 1); floatText(p.x, p.y - 34, '💥 BÙM', '#fde68a', 12);
};
// Trang Bị Phụ (dạng súng): ĐẠN SÊN SĂN — 1 viên đạn sên to xuyên người, gắn Dấu Săn, nạp đầy 2 nòng
function agSlug22(p) {
    const w = getCurrentWeapon(p), a = aimDir(p), m0 = muzzle(p, w, a);
    const b = spawnBullet(p, m0.x, m0.y, a, { speed: 28, damage: 45, range: 600, knock: 320, size: 6, pierce: true, trail: 70, color: '#fdba74' }); b.ag21 = true; b.huntSlug22 = true;
    if (w && w.id === 'AXEGUN') w.ch = 2; AudioSys.playAt('cannon', p.x, p.y, 0.7); addShake(6); p.kx -= Math.cos(a) * 200; p.ky -= Math.sin(a) * 200;
    floatText(p.x, p.y - 44, '🎯 ĐẠN SÊN SĂN · NẠP ĐẦY', '#fdba74', 14);
}
const _gunModR22 = gunModCast;
gunModCast = function (p) { const w = getCurrentWeapon(p); if (w && w.id === 'AXEGUN') return agSlug22(p); return _gunModR22(p); };
Object.assign(GUN_P, { AXEGUN: 'Dạng súng tự nạp nhanh hơn (1.3 giây/viên).' });
const _ammoTextR22 = ammoText;
ammoText = function (w) { if (w && w.id === 'AXEGUN') return (w.form === 'gun' ? '🔫' : '🪓') + '🔶'.repeat(w.ch || 0) + '▫'.repeat(2 - (w.ch || 0)); return _ammoTextR22(w); };
const _skillProfileR22 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'AXEGUN' && id === 'gunMod') return { aim: 'dir', R: 600, shape: 'line', w: 16, col: '253,186,116', tag: 'XUYÊN · NẠP ĐẦY 2 NÒNG' };
    return _skillProfileR22(p, id);
};

/* ============================== 2) TRƯỜNG KIẾM: VỆT CHÉM & HIỆU ỨNG RÕ RÀNG ============================== */
// thay slashes của Trường Kiếm bằng vệt chém riêng từng hệ
const _slashPush22 = slashes.push.bind(slashes);
slashes.push = function (...a) {
    if (net.role === 'guest') return _slashPush22(...a); // máy khách: giữ nguyên vệt chém nhận từ chủ phòng
    const rest = [];
    a.forEach(s => {
        const o = s && players.find(q => q.id === s.ownerId), w = o && getCurrentWeapon(o);
        if (s && w && w.id === 'LONGSWORD' && NH21[w.elem] && !s.line && s.color === NH21[w.elem].col) { W22.push({ kind: 'nhSlash', owner: o.id, E: w.elem, a: s.angle, R: s.range, side: s.swing || 1, t: 0.26, T: 0.26, big: s.width >= 12 }); if (net.role === 'host') rest.push(s); }
        else rest.push(s);
    });
    return rest.length ? _slashPush22(...rest) : slashes.length;
};
const NH_TXT22 = { KIM: '⚙️ XUYÊN GIÁP', THUY: '💧 CHẬM', MOC: '🌿 HÚT MÁU', HOA: '🔥 ĐỐT', THO: '⛰️ ĐẨY' };
function nhBurst22(E, x, y, a) {
    const N = NH21[E], P = (vx, vy, col, sz, life, glow) => particles.push({ x, y, vx, vy, life, maxLife: life, color: col, size: sz, glow, drag: 0.9 });
    for (let i = 0; i < 9; i++) {
        const t = a + (Math.random() - 0.5) * 1.6, s = 120 + Math.random() * 220;
        if (E === 'KIM') P(Math.cos(t) * s * 1.4, Math.sin(t) * s * 1.4, i % 2 ? '#ffffff' : '#cbd5e1', 2, 0.25, true);
        else if (E === 'THUY') P(Math.cos(t) * s * 0.7, Math.sin(t) * s * 0.7 - 60, i % 2 ? '#7dd3fc' : '#e0f2fe', 3, 0.5, true);
        else if (E === 'MOC') P(Math.cos(t) * s * 0.5, Math.sin(t) * s * 0.5, i % 2 ? '#4ade80' : '#a3e635', 3.5, 0.6, false);
        else if (E === 'HOA') P(Math.cos(t) * s * 0.6, Math.sin(t) * s * 0.6 - 80, i % 2 ? '#fde047' : '#f97316', 3, 0.5, true);
        else P(Math.cos(t) * s * 0.6, Math.sin(t) * s * 0.6, i % 2 ? '#a16207' : '#78716c', 4, 0.5, false);
    }
}
const _nhHitR22 = nhHit21;
nhHit21 = function (p, e, E, dmg, K, small) {
    const hp0 = p.hp, r = _nhHitR22(p, e, E, dmg, K, small), now = now22();
    if (!e || !NH21[E]) return r;
    nhBurst22(E, e.x, e.y, Math.atan2(e.y - p.y, e.x - p.x));
    e.nhMark22 = { E, t: now + 1.6 };
    if ((e.nhTxt22 || 0) < now) { e.nhTxt22 = now + 0.55; const extra = E === 'MOC' && p.hp > hp0 ? ` +${Math.round(p.hp - hp0)}` : ''; floatText(e.x + (Math.random() - 0.5) * 16, e.y - 36, NH_TXT22[E] + extra, NH21[E].col, 12); }
    return r;
};

/* ============================== 3) KỸ THUẬT CAO 5 HỆ (vẽ lại, Mộc làm lại) ============================== */
lsUlt21 = function (p) {
    const w = getCurrentWeapon(p), E = (w && NH21[w.elem]) ? w.elem : 'KIM', a = aimDir(p), d = Math.max(120, Math.min(380, p.skillDist || 300)), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d, N = NH21[E];
    if (E === 'KIM') { // VẠN KIẾM QUY TÔNG: kiếm thật rơi xuống
        zones.push({ type: 'artyWarn', x: cx, y: cy, r: 130, t: 0.35, maxT: 0.35, owner: p.id, tick: 0 });
        for (let i = 0; i < 14; i++) { const r = Math.sqrt(Math.random()) * 130, t = Math.random() * 6.28; W22.push({ kind: 'fallSword', owner: p.id, x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, delay: 0.3 + i * 0.05, fall: 0.25, t: 2, done: false, rot: (Math.random() - 0.5) * 0.4 }); }
    } else if (E === 'THUY') { // HỒNG THỦY: bức tường nước cuốn tới
        W22.push({ kind: 'tsunami', owner: p.id, x: p.x, y: p.y, a, d: 0, max: 440, sp: 520, W: 230, hit: new Set(), t: 1.4, T: 1.4 });
        AudioSys.playAt('whoosh', p.x, p.y, 0.8);
    } else if (E === 'MOC') { // CÂY NGỤC
        W22.push({ kind: 'tree', owner: p.id, x: cx, y: cy, t: 4, T: 4, tick: 0.3, vines: [] });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, cx, cy) < 70 + e.radius) { dealDamage(e, 20, p.id, { knock: 300, angle: Math.atan2(e.y - cy, e.x - cx) }); e.stun = Math.max(e.stun, 0.5); } });
        ring(cx, cy, 8, 90, '#4ade80', 0.5, 7); AudioSys.playAt('ground', cx, cy, 0.6); addShake(6);
    } else if (E === 'HOA') { // PHƯỢNG HOÀNG HỎA VŨ
        W22.push({ kind: 'phoenix', owner: p.id, x: p.x, y: p.y, a, d: 0, max: Math.max(160, d + 60), sp: 640, hit: new Set(), drop: 0, t: 1.2, T: 1.2 });
        AudioSys.playAt('flame', p.x, p.y, 0.8);
    } else { // SƠN BĂNG ĐỊA LIỆT
        for (let k = 0; k < 3; k++) { W22.push({ kind: 'quake', owner: p.id, x: cx, y: cy, R: 90 + k * 55, delay: k * 0.25, t: 0.25 * k + 0.8, T: 0.8, hit: false }); }
    }
    floatText(p.x, p.y - 46, `${N.icon} ${{ KIM: 'VẠN KIẾM QUY TÔNG', THUY: 'HỒNG THỦY', MOC: 'CÂY NGỤC', HOA: 'PHƯỢNG HOÀNG HỎA VŨ', THO: 'SƠN BĂNG ĐỊA LIỆT' }[E]}`, N.col, 15);
};
HT_PROFILE.LONGSWORD = { aim: 'point', R: 380, shape: 'point', aoe: 140, arc: true, col: '253,230,138', tag: 'TUYỆT KỸ THEO HỆ' };

/* ============================== 4) BẬC THẦY: 5 THANH KIẾM RƠI · ĐÒN ĐẶC TRƯNG ============================== */
const _lsMasterR22 = lsMaster21;
lsMaster21 = function (p) {
    const r = _lsMasterR22(p);
    for (let i = W22.length - 1; i >= 0; i--) if (W22[i] && W22[i].kind === 'pickSword' && W22[i].owner === p.id) W22.splice(i, 1);
    NH_ORDER21.forEach((E, i) => { const t = -Math.PI / 2 + i * Math.PI * 2 / 5, x = p.x + Math.cos(t) * 95, y = p.y + Math.sin(t) * 95, s = pointInObstacle(x, y, 14) ? { x: p.x + Math.cos(t) * 50, y: p.y + Math.sin(t) * 50 } : { x, y };
        W22.push({ kind: 'pickSword', owner: p.id, E, x: s.x, y: s.y, drop: 0.55 + i * 0.08, t: 9, T: 9 }); });
    floatText(p.x, p.y - 62, '🗡️ 5 THANH KIẾM RƠI — NHẶT 1 CÂY', '#fde68a', 13);
    return r;
};
const NH_SIG22 = { KIM: 'THIÊN KIM NHẤT KÍCH', THUY: 'BĂNG PHONG TOÀN TRẢM', MOC: 'VẠN MỘC HỒI XUÂN', HOA: 'PHƯỢNG VŨ TRẢM', THO: 'THÁI SƠN ÁP ĐỈNH' };
function nhSignature22(p, w, ang, E) {
    const m = attackMult(p, w) * (p.meleeMult || 1), K = elemBoost21(p), N = NH21[E];
    meleeBook(p, w, ang, 34);
    floatText(p.x, p.y - 50, `${N.icon} ${NH_SIG22[E]}!`, N.col, 16); hitStop(0.06); addShake(9);
    if (E === 'KIM') { // lướt chém 1 đường dài, sát thương chuẩn
        const D = Math.max(80, rayFree(p.x, p.y, ang, 280).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(ang) * D, by = p.y + Math.sin(ang) * D;
        p.dashTime = D / 1400; p.dashAngle = ang; p.st.invuln = Math.max(p.st.invuln || 0, 0.25);
        W22.push({ kind: 'sigLine', owner: p.id, E, x1: ax, y1: ay, x2: bx, y2: by, t: 0.45, T: 0.45 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 30) { dealDamage(e, 55 * m, p.id, { melee: true, knock: 200, angle: ang }); trueDamage(e, 35 * m, p.id); nhHit21(p, e, 'KIM', 55 * m, K); } });
        AudioSys.playAt('clang', p.x, p.y, 0.8);
    } else if (E === 'THUY') { // xoay 360°, đóng băng tất cả xung quanh
        W22.push({ kind: 'sigRing', owner: p.id, E, R: 160, t: 0.5, T: 0.5 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 160 + e.radius) { dealDamage(e, 40 * m, p.id, { melee: true, knock: 120, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.frozenT = now22() + 1.3; e.stun = Math.max(e.stun, 1.3); floatText(e.x, e.y - 44, '❄️ ĐÓNG BĂNG', '#7dd3fc', 13); } });
        AudioSys.playAt('freeze', p.x, p.y, 0.8);
    } else if (E === 'MOC') { // nón dây leo trói + hồi 25% máu
        W22.push({ kind: 'sigCone', owner: p.id, E, a: ang, R: 190, t: 0.6, T: 0.6 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 190 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.75) { dealDamage(e, 35 * m, p.id, { melee: true, knock: 1 }); e.st.root = Math.max(e.st.root || 0, 1.6); floatText(e.x, e.y - 44, '🌿 TRÓI', N.col, 13); } });
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25); floatText(p.x, p.y - 34, `💚 +${Math.round(p.maxHp * 0.25)}`, '#4ade80', 14); AudioSys.playAt('heal', p.x, p.y, 0.7);
    } else if (E === 'HOA') { // lướt để lại vệt lửa, cuối đường nổ
        const D = Math.max(80, rayFree(p.x, p.y, ang, 240).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(ang) * D, by = p.y + Math.sin(ang) * D;
        p.dashTime = D / 1100; p.dashAngle = ang; p.st.invuln = Math.max(p.st.invuln || 0, 0.25);
        for (let k = 0; k <= 4; k++) zones.push({ type: 'fire', x: ax + (bx - ax) * k / 4, y: ay + (by - ay) * k / 4, r: 42, t: 3, maxT: 3, owner: p.id, tick: 0 });
        W22.push({ kind: 'sigLine', owner: p.id, E, x1: ax, y1: ay, x2: bx, y2: by, t: 0.5, T: 0.5 });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 34) { dealDamage(e, 35 * m, p.id, { melee: true, knock: 160, angle: ang }); nhHit21(p, e, 'HOA', 35 * m, K); nhHit21(p, e, 'HOA', 35 * m, K); } });
        p.shotQueue.push({ t: D / 1100 + 0.02, fn: () => { if (p.hp > 0) explode(p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, p.id, 40, 110); } });
        AudioSys.playAt('flame', p.x, p.y, 0.9);
    } else { // nhảy lên nện xuống, vòng vách đá
        const s = umbFreeSpot(p, p.x + Math.cos(ang) * 200, p.y + Math.sin(ang) * 200);
        startTravel(p, s.x, s.y, 0.45, 'umbLand', { fn: q => {
            W22.push({ kind: 'sigRing', owner: q.id, E: 'THO', R: 150, t: 0.6, T: 0.6 });
            enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, q.x, q.y) < 150 + e.radius) { dealDamage(e, 60 * m, q.id, { melee: true, knock: 420, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 0.8); } });
            for (let k = 0; k < 4; k++) { const t = k * Math.PI / 2 + Math.PI / 4, x = q.x + Math.cos(t) * 120, y = q.y + Math.sin(t) * 120; if (!pointInObstacle(x, y, 20)) obstacles.push({ x: x - 20, y: y - 20, w: 40, h: 40, wood: false, temp: 4, hp: 200, maxHp: 200, rock21: true }); }
            addShake(12); AudioSys.playAt('ground', q.x, q.y, 0.9);
        } }, 120);
    }
}
const _lsFireR22 = lsFire21;
lsFire21 = function (p, w, ang, charge) {
    if (charge < 0.9 && p.nhSig22 && p.nhSig22.t > now22()) { const E = p.nhSig22.E; p.nhSig22 = null; return nhSignature22(p, w, ang, E); }
    return _lsFireR22(p, w, ang, charge);
};

/* ============================== CẬP NHẬT ============================== */
function step22(f, dt, now) {
    const o = players.find(q => q.id === f.owner); if (!o) return true;
    if (f.kind === 'fallSword') {
        f.delay -= dt; if (f.delay > 0) return false;
        if (!f.done && -f.delay >= f.fall) { f.done = true; beams.push({ x1: f.x, y1: f.y - 40, x2: f.x, y2: f.y, life: 0.15, maxLife: 0.15, color: '#f8fafc' }); spark(f.x, f.y, '#f8fafc', 6, 220); AudioSys.playAt('clang', f.x, f.y, 0.25);
            enemiesOf(o).forEach(e => { if (dist(e.x, e.y, f.x, f.y) < e.radius + 28) { dealDamage(e, 12, o.id, { knock: 1 }); trueDamage(e, 4, o.id); } }); }
        return f.t <= 0;
    }
    if (f.kind === 'tsunami') {
        const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
        const nx = -Math.sin(f.a), ny = Math.cos(f.a), x1 = f.x + nx * f.W / 2, y1 = f.y + ny * f.W / 2, x2 = f.x - nx * f.W / 2, y2 = f.y - ny * f.W / 2;
        enemiesOf(o).forEach(e => { if (e.air > 0) return; if (segDist(e.x, e.y, x1, y1, x2, y2) < e.radius + 22) { if (!f.hit.has(e.id)) { f.hit.add(e.id); dealDamage(e, 30, o.id, { knock: 1 }); floatText(e.x, e.y - 40, '🌊 CUỐN TRÔI', '#38bdf8', 13); } e.kx += Math.cos(f.a) * 70; e.ky += Math.sin(f.a) * 70; e.st.slow = Math.max(e.st.slow || 0, 1.6); } });
        for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b && b.owner !== o.id && segDist(b.x, b.y, x1, y1, x2, y2) < 20) bullets.splice(j, 1); }
        return f.d >= f.max || f.t <= 0;
    }
    if (f.kind === 'tree') {
        f.tick -= dt;
        if (f.tick <= 0) { f.tick = 0.6; f.vines = [];
            enemiesOf(o).filter(e => e.hp > 0 && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < 230).slice(0, 4).forEach(e => {
                f.vines.push({ id: e.id, t: 0.45 });
                const a = Math.atan2(f.y - e.y, f.x - e.x), d = dist(e.x, e.y, f.x, f.y);
                if (d > 70) { e.kx += Math.cos(a) * 260; e.ky += Math.sin(a) * 260; }
                e.st.root = Math.max(e.st.root || 0, 0.7); dealDamage(e, 8, o.id, { knock: 1 }); spark(e.x, e.y, '#4ade80', 4, 140);
            });
            if (f.vines.length) AudioSys.playAt('whip', f.x, f.y, 0.4);
        }
        f.vines.forEach(v => { v.t -= dt; });
        if (dist(o.x, o.y, f.x, f.y) < 160 && o.hp > 0) o.hp = Math.min(o.maxHp, o.hp + 3 * dt * HEALK);
        return f.t <= 0;
    }
    if (f.kind === 'phoenix') {
        const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st; f.drop += st;
        if (f.drop >= 55) { f.drop = 0; zones.push({ type: 'fire', x: f.x, y: f.y, r: 46, t: 3.5, maxT: 3.5, owner: o.id, tick: 0 }); }
        enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 50) { f.hit.add(e.id); dealDamage(e, 22, o.id, { knock: 200, angle: f.a }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 4); e.st.burnBy = o.id; } } });
        if (f.d >= f.max || pointInObstacle(f.x, f.y, 6) || f.t <= 0) { explode(f.x, f.y, o.id, 30, 130); for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3; zones.push({ type: 'fire', x: f.x + Math.cos(t) * 70, y: f.y + Math.sin(t) * 70, r: 40, t: 3, maxT: 3, owner: o.id, tick: 0 }); } return true; }
        return false;
    }
    if (f.kind === 'quake') {
        f.delay -= dt;
        if (f.delay <= 0 && !f.hit) { f.hit = true; addShake(7); AudioSys.playAt('ground', f.x, f.y, 0.7);
            enemiesOf(o).forEach(e => { const dd = dist(e.x, e.y, f.x, f.y); if (!(e.air > 0) && dd < f.R + e.radius && dd > f.R - 70) { dealDamage(e, 18, o.id, { knock: 260, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.stun = Math.max(e.stun, 0.4); } }); }
        return f.t <= 0;
    }
    if (f.kind === 'pickSword') {
        f.drop -= dt;
        if (f.drop <= 0 && o.hp > 0 && dist(o.x, o.y, f.x, f.y) < o.radius + 16 && !(o.air > 0)) { // nhặt
            o.nhSig22 = { E: f.E, t: now + 12 };
            for (let i = W22.length - 1; i >= 0; i--) { const q = W22[i]; if (q && q.kind === 'pickSword' && q.owner === o.id) W22.splice(i, 1); }
            const N = NH21[f.E]; ring(o.x, o.y, 6, 60, N.col, 0.45, 5); AudioSys.playAt('magic', o.x, o.y, 0.6);
            floatText(o.x, o.y - 56, `${N.icon} NHẬN: ${NH_SIG22[f.E]}`, N.col, 15);
            return false; // đã xoá cả nhóm ở trên
        }
        // bot: tự đi nhặt cây gần nhất
        if (o.isBot && f.drop <= 0 && !o.nhSig22 && !o.travel) { const near = W22.filter(q => q && q.kind === 'pickSword' && q.owner === o.id).sort((u, v) => dist(o.x, o.y, u.x, u.y) - dist(o.x, o.y, v.x, v.y))[0]; if (near === f) { const a = Math.atan2(f.y - o.y, f.x - o.x); o.kx += Math.cos(a) * 30; o.ky += Math.sin(a) * 30; } }
        return f.t <= 0;
    }
    return f.t <= 0;
}
const _upeR22 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR22(dt);
    const now = now22();
    for (let i = W22.length - 1; i >= 0; i--) {
        const f = W22[i]; if (!f) continue; f.t -= dt;
        const sk = !!f._skill && typeof SRC19 !== 'undefined'; if (sk) SRC19.skill++; let rm = false;
        try { rm = step22(f, dt, now); } finally { if (sk) SRC19.skill--; }
        if (rm) { const j = W22.indexOf(f); if (j >= 0) W22.splice(j, 1); }
    }
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => { // dạng súng: tự nạp dần
        const w = p.hp > 0 && getCurrentWeapon(p); if (!w || w.id !== 'AXEGUN' || w.form !== 'gun') return;
        if ((w.ch || 0) < 2) { w.reg22 = (w.reg22 || 0) + dt; if (w.reg22 >= (has(p, 'gunMod') ? 1.3 : 2)) { w.reg22 = 0; w.ch = (w.ch || 0) + 1; } } else w.reg22 = 0;
    });
};
const _push22 = W22.push.bind(W22);
W22.push = function (...a) { a.forEach(f => { if (f && typeof SRC19 !== 'undefined' && SRC19.skill > 0) f._skill = true; }); return _push22(...a); };
const _resetR22 = resetPlayerForRound;
resetPlayerForRound = function (p) { const r = _resetR22(p); p.nhSig22 = null; p.nhMark22 = null; for (let i = W22.length - 1; i >= 0; i--) if (W22[i] && W22[i].owner === p.id) W22.splice(i, 1); return r; };

/* ============================== VẼ ============================== */
function drawNhSlash22(c, f, o, now) {
    const N = NH21[f.E], u = 1 - Math.max(0, f.t) / f.T, k = 1 - u, half = f.big ? 1.15 : 0.95, R = f.R;
    const a0 = f.a - f.side * half, sweep = Math.min(1, u * 2.2), a1 = a0 + f.side * half * 2 * sweep;
    const A = Math.min(a0, a1), B = Math.max(a0, a1);
    c.save(); c.translate(o.x, o.y - (o.airH || 0)); c.lineCap = 'round';
    if (f.E === 'KIM') { // nhiều đường mảnh sắc + sao lấp lánh
        c.globalCompositeOperation = 'lighter';
        [0, 6, -6].forEach((dr, i) => { c.strokeStyle = `rgba(248,250,252,${(i ? 0.45 : 0.95) * k})`; c.lineWidth = i ? 1.2 : 2.4; c.beginPath(); c.arc(0, 0, R + dr, A, B); c.stroke(); });
        const tx = Math.cos(a1) * R, ty = Math.sin(a1) * R; c.fillStyle = `rgba(255,255,255,${k})`; c.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? 2 : 8, t = j * Math.PI / 4 + now * 6; c.lineTo(tx + Math.cos(t) * rr, ty + Math.sin(t) * rr); } c.fill();
    } else if (f.E === 'THUY') { // dải nước dày, mép sóng, bọt
        const g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R + 10); g.addColorStop(0, 'rgba(56,189,248,0)'); g.addColorStop(0.7, `rgba(56,189,248,${0.55 * k})`); g.addColorStop(1, `rgba(224,242,254,${0.9 * k})`);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 10, A, B); c.arc(0, 0, R * 0.55, B, A, true); c.closePath(); c.fill();
        c.strokeStyle = `rgba(240,249,255,${0.9 * k})`; c.lineWidth = 2; c.beginPath(); for (let t = A; t <= B; t += 0.05) { const rr = R + 10 + Math.sin(t * 18 + now * 20) * 3; c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } c.stroke();
        c.fillStyle = `rgba(224,242,254,${k})`; for (let j = 0; j < 7; j++) { const t = A + (B - A) * j / 6, rr = R + 14 + (j % 3) * 4; c.beginPath(); c.arc(Math.cos(t) * rr, Math.sin(t) * rr, 2, 0, Math.PI * 2); c.fill(); }
    } else if (f.E === 'MOC') { // dây leo + lá xoáy
        c.strokeStyle = `rgba(22,101,52,${k})`; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, R, A, B); c.stroke(); c.strokeStyle = `rgba(74,222,128,${k})`; c.lineWidth = 2.5; c.stroke();
        for (let j = 0; j < 9; j++) { const t = A + (B - A) * j / 8, rr = R + Math.sin(j * 1.7 + now * 8) * 9; c.save(); c.translate(Math.cos(t) * rr, Math.sin(t) * rr); c.rotate(t + now * 5 + j); c.fillStyle = j % 2 ? `rgba(134,239,172,${k})` : `rgba(163,230,53,${k})`; c.beginPath(); c.ellipse(0, 0, 6, 2.6, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    } else if (f.E === 'HOA') { // lưỡi lửa
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R + 16); g.addColorStop(0, 'rgba(220,38,38,0)'); g.addColorStop(0.75, `rgba(249,115,22,${0.6 * k})`); g.addColorStop(1, `rgba(254,240,138,${0.9 * k})`);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 8, A, B); c.arc(0, 0, R * 0.6, B, A, true); c.closePath(); c.fill();
        for (let j = 0; j < 12; j++) { const t = A + (B - A) * j / 11, h = 8 + Math.random() * 14, x = Math.cos(t), y = Math.sin(t); c.fillStyle = `rgba(253,186,116,${0.8 * k})`; c.beginPath(); c.moveTo(x * (R + 2) - y * 4, y * (R + 2) + x * 4); c.lineTo(x * (R + 2 + h), y * (R + 2 + h)); c.lineTo(x * (R + 2) + y * 4, y * (R + 2) - x * 4); c.fill(); }
    } else { // THỔ: dải đá nặng + mảnh đá
        c.strokeStyle = `rgba(120,53,15,${0.85 * k})`; c.lineWidth = f.big ? 18 : 14; c.beginPath(); c.arc(0, 0, R - 4, A, B); c.stroke();
        c.strokeStyle = `rgba(214,161,90,${0.7 * k})`; c.lineWidth = 3; c.stroke();
        for (let j = 0; j < 7; j++) { const t = A + (B - A) * j / 6, rr = R + 6 + u * 26 * ((j % 3) + 1) / 3; c.save(); c.translate(Math.cos(t) * rr, Math.sin(t) * rr); c.rotate(j + now * 4); c.fillStyle = `rgba(146,64,14,${k})`; c.beginPath(); c.moveTo(-4, -3); c.lineTo(3, -4); c.lineTo(5, 2); c.lineTo(-2, 4); c.closePath(); c.fill(); c.restore(); }
    }
    c.restore();
}
function drawStatus22(c, p, now) { // trạng thái nguyên tố hiện trên người
    if (p.hp <= 0 || p.x === undefined) return;
    const st = p.st || {}, h = p.airH || 0, y0 = p.y - h;
    if (st.burn > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const t = now * 3 + k * 1.6, x = p.x + Math.cos(t) * p.radius * 0.7, y = y0 + Math.sin(t) * p.radius * 0.4, fl = 9 + Math.sin(now * 20 + k) * 4; const g = c.createLinearGradient(x, y, x, y - fl); g.addColorStop(0, 'rgba(249,115,22,0.85)'); g.addColorStop(1, 'rgba(254,240,138,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x, y - fl * 1.3, x + 4, y); c.fill(); } c.restore(); }
    if (st.slow > 0) { c.save(); c.strokeStyle = `rgba(125,211,252,${0.35 + Math.sin(now * 6) * 0.15})`; c.lineWidth = 2; for (let k = 0; k < 2; k++) { const r = p.radius + 4 + ((now * 20 + k * 8) % 14); c.beginPath(); c.ellipse(p.x, p.y + p.radius * 0.6, r, r * 0.35, 0, 0, Math.PI * 2); c.stroke(); } c.restore(); }
    if (st.root > 0) { c.save(); c.translate(p.x, p.y); for (let k = 0; k < 2; k++) { c.rotate(now * (k ? -1.5 : 1.2)); c.strokeStyle = k ? '#15803d' : '#4ade80'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, p.radius + 4 + k * 3, 0.3, 2.6); c.stroke(); c.fillStyle = '#86efac'; c.beginPath(); c.ellipse(Math.cos(2.6) * (p.radius + 4), Math.sin(2.6) * (p.radius + 4), 4, 2, 2.6, 0, Math.PI * 2); c.fill(); } c.restore(); }
    const M = p.nhMark22; if (M && M.t > now && NH21[M.E]) { c.save(); c.font = '11px sans-serif'; c.textAlign = 'center'; c.globalAlpha = Math.min(1, (M.t - now) * 2); c.fillText(NH21[M.E].icon, p.x + p.radius + 6, y0 - p.radius - 4); c.restore(); }
    if (p.em21 && p.em21.set && p.em21.set.size) { c.save(); let k = 0; NH_ORDER21.forEach(E => { const on = p.em21.set.has(E); c.fillStyle = on ? NH21[E].col : 'rgba(100,116,139,0.35)'; c.beginPath(); c.arc(p.x - 16 + k * 8, y0 - p.radius - 22, on ? 3 : 2, 0, Math.PI * 2); c.fill(); k++; }); c.restore(); }
}
const _drawW2FxR22 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR22(now);
    const c = ctx; c.save();
    players.forEach(p => drawStatus22(c, p, now));
    W22.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = f.T ? 1 - Math.max(0, f.t) / f.T : 0;
        if (f.kind === 'nhSlash') drawNhSlash22(c, f, o, now);
        else if (f.kind === 'agSpin') { c.save(); c.translate(o.x, o.y); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(253,186,116,${0.7 * (1 - u)})`; c.lineWidth = 10 * (1 - u) + 2; c.beginPath(); c.arc(0, 0, 44, now * 25, now * 25 + 4.5); c.stroke(); c.restore(); drawSpinWep21(c, 'AXEGUN', o.x, o.y, now * 30, 1.3); }
        else if (f.kind === 'fallSword') { if (f.delay > 0) { c.save(); c.strokeStyle = 'rgba(248,250,252,0.35)'; c.setLineDash([3, 4]); c.beginPath(); c.arc(f.x, f.y, 14, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); c.restore(); return; }
            const fk = Math.min(1, -f.delay / f.fall), hgt = (1 - fk) * 320; c.save(); c.translate(f.x, f.y - hgt); c.rotate(Math.PI / 2 + f.rot); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(248,250,252,0.35)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-60 * (1 - fk), 0); c.lineTo(0, 0); c.stroke(); c.globalCompositeOperation = 'source-over';
            c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(26, 0); c.lineTo(4, -3); c.lineTo(4, 3); c.closePath(); c.fill(); c.fillRect(-10, -1.6, 15, 3.2); c.fillStyle = '#a16207'; c.fillRect(-3, -6, 3, 12); c.fillStyle = '#292524'; c.fillRect(-12, -1.5, 9, 3); c.restore();
            if (f.done) { c.save(); c.globalAlpha = Math.max(0, f.t / 1.5); c.fillStyle = '#cbd5e1'; c.fillRect(f.x - 1.5, f.y - 22, 3, 22); c.fillStyle = '#a16207'; c.fillRect(f.x - 6, f.y - 22, 12, 3); c.restore(); } }
        else if (f.kind === 'tsunami') { const nx = -Math.sin(f.a), ny = Math.cos(f.a); c.save(); c.translate(f.x, f.y); c.rotate(f.a); const W = f.W;
            const g = c.createLinearGradient(-60, 0, 14, 0); g.addColorStop(0, 'rgba(14,116,144,0)'); g.addColorStop(0.6, 'rgba(56,189,248,0.6)'); g.addColorStop(1, 'rgba(224,242,254,0.95)'); c.fillStyle = g;
            c.beginPath(); c.moveTo(-60, -W / 2); for (let y = -W / 2; y <= W / 2; y += 8) c.lineTo(10 + Math.sin(y * 0.08 + now * 12) * 6, y); c.lineTo(-60, W / 2); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.9)'; for (let y = -W / 2; y <= W / 2; y += 14) { c.beginPath(); c.arc(12 + Math.sin(y * 0.08 + now * 12) * 6, y, 3 + Math.random() * 2, 0, Math.PI * 2); c.fill(); } c.restore(); }
        else if (f.kind === 'tree') { const grow = Math.min(1, (f.T - f.t) * 3), fade = Math.min(1, f.t * 2); c.save(); c.globalAlpha = fade;
            c.strokeStyle = 'rgba(74,222,128,0.25)'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(f.x, f.y, 230, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
            f.vines.forEach(v => { const e = players.find(q => q.id === v.id); if (!e || v.t <= 0) return; const mx = (f.x + e.x) / 2 + Math.sin(now * 10) * 20, my = (f.y + e.y) / 2 - 30; c.strokeStyle = '#166534'; c.lineWidth = 5; c.beginPath(); c.moveTo(f.x, f.y - 20 * grow); c.quadraticCurveTo(mx, my, e.x, e.y); c.stroke(); c.strokeStyle = '#4ade80'; c.lineWidth = 2; c.stroke(); });
            c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(f.x, f.y + 6, 50 * grow, 16 * grow, 0, 0, Math.PI * 2); c.fill();
            const th = 56 * grow; c.fillStyle = '#78350f'; c.beginPath(); c.moveTo(f.x - 12, f.y + 4); c.lineTo(f.x - 7, f.y - th); c.lineTo(f.x + 7, f.y - th); c.lineTo(f.x + 12, f.y + 4); c.closePath(); c.fill(); c.strokeStyle = '#451a03'; c.lineWidth = 1.5; c.stroke();
            [[-26, -th - 6, 30], [24, -th - 4, 28], [0, -th - 26, 34], [-12, -th - 14, 26], [14, -th - 18, 24]].forEach(([dx, dy, r], i) => { const sw = Math.sin(now * 2 + i) * 2; c.fillStyle = i % 2 ? '#15803d' : '#22c55e'; c.beginPath(); c.arc(f.x + dx * grow + sw, f.y + dy, r * grow, 0, Math.PI * 2); c.fill(); });
            c.fillStyle = 'rgba(187,247,208,0.8)'; for (let k = 0; k < 6; k++) { const t = now * 1.5 + k, x = f.x + Math.cos(t) * 40 * grow, y = f.y - th - 10 + Math.sin(t * 1.3) * 20; c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill(); }
            c.restore(); }
        else if (f.kind === 'phoenix') { c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.globalCompositeOperation = 'lighter'; const fl = Math.sin(now * 18) * 0.35;
            const g = c.createRadialGradient(0, 0, 4, 0, 0, 60); g.addColorStop(0, 'rgba(254,240,138,0.95)'); g.addColorStop(0.4, 'rgba(249,115,22,0.7)'); g.addColorStop(1, 'rgba(220,38,38,0)'); c.fillStyle = g;
            [1, -1].forEach(sd => { c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(-10, sd * (40 + fl * 30), -46, sd * (52 + fl * 20)); c.quadraticCurveTo(-26, sd * 16, -8, 0); c.fill(); });
            c.beginPath(); c.moveTo(18, 0); c.lineTo(-4, -8); c.lineTo(-30, 0); c.lineTo(-4, 8); c.closePath(); c.fill();
            c.strokeStyle = 'rgba(254,215,170,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-28, 0); c.quadraticCurveTo(-60, 10 * Math.sin(now * 9), -90, 0); c.stroke(); c.restore(); }
        else if (f.kind === 'quake') { if (f.delay > 0) return; const k2 = 1 - u; c.save(); c.globalAlpha = k2; for (let j = 0; j < 16; j++) { const t = j * Math.PI / 8 + f.R, x = f.x + Math.cos(t) * f.R, y = f.y + Math.sin(t) * f.R, hh = (12 + (j % 3) * 5) * Math.min(1, u * 4); c.fillStyle = '#92400e'; c.beginPath(); c.moveTo(x - 7, y + 4); c.lineTo(x, y - hh); c.lineTo(x + 7, y + 4); c.closePath(); c.fill(); c.strokeStyle = '#451a03'; c.lineWidth = 1; c.stroke(); } c.strokeStyle = 'rgba(214,161,90,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, f.R, 0, Math.PI * 2); c.stroke(); c.restore(); }
        else if (f.kind === 'pickSword') { const N = NH21[f.E], fk = f.drop > 0 ? 1 - f.drop / 0.6 : 1, hgt = Math.max(0, 1 - fk) * 220; c.save(); c.translate(f.x, f.y);
            c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, hexA(N.col, 0.6)); g.addColorStop(1, hexA(N.col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 30 + Math.sin(now * 5) * 3, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
            c.translate(0, -hgt - 6); c.rotate(-Math.PI / 2 + Math.sin(now * 2 + f.x) * 0.05);
            c.fillStyle = N.col; c.beginPath(); c.moveTo(34, 0); c.lineTo(4, -3.2); c.lineTo(4, 3.2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1; c.stroke();
            c.fillStyle = '#a16207'; c.fillRect(0, -7, 3.5, 14); c.fillStyle = '#292524'; c.fillRect(-10, -1.8, 10, 3.6); c.restore();
            c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText(N.icon, f.x, f.y + 22); }
        else if (f.kind === 'sigLine') { const N = NH21[f.E]; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; [[30, 0.25], [14, 0.6], [4, 1]].forEach(([wd, al]) => { c.strokeStyle = hexA(f.E === 'KIM' ? '#ffffff' : N.col, al * (1 - u)); c.lineWidth = wd * (1 - u * 0.5); c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); }); c.restore(); }
        else if (f.kind === 'sigRing') { const N = NH21[f.E]; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA(N.col, 0.8 * (1 - u)); c.lineWidth = 16 * (1 - u) + 2; c.beginPath(); c.arc(o.x, o.y, f.R * (0.4 + u * 0.6), 0, Math.PI * 2); c.stroke(); if (f.E === 'THUY') { c.fillStyle = `rgba(224,242,254,${0.9 * (1 - u)})`; for (let j = 0; j < 12; j++) { const t = j * Math.PI / 6; c.save(); c.translate(o.x + Math.cos(t) * f.R * u, o.y + Math.sin(t) * f.R * u); c.rotate(t); c.beginPath(); c.moveTo(8, 0); c.lineTo(0, -3); c.lineTo(-8, 0); c.lineTo(0, 3); c.closePath(); c.fill(); c.restore(); } } c.restore(); }
        else if (f.kind === 'sigCone') { c.save(); c.globalAlpha = 1 - u; for (let j = 0; j < 7; j++) { const t = f.a - 0.7 + j * 0.23, L = f.R * Math.min(1, u * 3); c.strokeStyle = '#166534'; c.lineWidth = 4; c.beginPath(); c.moveTo(o.x, o.y); for (let s = 0; s <= L; s += 12) c.lineTo(o.x + Math.cos(t) * s + Math.sin(s * 0.1 + j) * 5, o.y + Math.sin(t) * s + Math.cos(s * 0.1 + j) * 5); c.stroke(); c.strokeStyle = '#4ade80'; c.lineWidth = 1.6; c.stroke(); } c.restore(); }
    });
    // đang giữ đòn đặc trưng
    players.forEach(p => { const S = p.nhSig22; if (!S || S.t <= now || p.hp <= 0) return; const N = NH21[S.E]; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA(N.col, 0.5 + Math.sin(now * 10) * 0.3); c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.radius + 10, now * 3, now * 3 + 4.5); c.stroke(); c.restore(); c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText(N.icon, p.x, p.y - p.radius - 30); });
    c.restore();
};

/* ---------- Rìu Săn: hình 2 dạng ---------- */
const _artAxeGunR22 = ART2.AXEGUN;
ART2.AXEGUN = (c, w, r, x0, ch, now, p) => {
    if (w.form !== 'gun') return _artAxeGunR22(c, w, r, x0, ch, now, p);
    // dạng SHOTGUN: 2 nòng chĩa thẳng, lưỡi rìu gập ngược ra sau dưới cán
    wood(c, x0 - 10, -2.6, 18, 5.2, 2); // báng
    metal(c, x0 + 6, -4.6, 30, 3.6, '#3f3f46', 1.2, 0.5); metal(c, x0 + 6, -0.6, 30, 3.6, '#3f3f46', 1.2, 0.5);
    c.fillStyle = '#0a0a0a'; c.fillRect(x0 + 35, -4, 1.6, 2.4); c.fillRect(x0 + 35, 0, 1.6, 2.4);
    metal(c, x0 + 4, -6, 6, 10, '#52525b', 1.5);
    c.beginPath(); c.moveTo(x0 + 8, 3); c.quadraticCurveTo(x0 + 2, 12, x0 - 8, 13); c.quadraticCurveTo(x0 - 2, 7, x0 + 2, 3); c.closePath(); c.fillStyle = '#94a3b8'; c.fill(); outl(c, 0.8); // lưỡi rìu gập
    const n = w.ch || 0; for (let k = 0; k < 2; k++) { c.fillStyle = k < n ? '#fb923c' : '#3f3f46'; c.beginPath(); c.arc(x0 + 14 + k * 5, -7.5, 1.6, 0, Math.PI * 2); c.fill(); }
    MUZ.AXEGUN = x0 + 37;
};
