/** ==================== VŨ KHÍ · 2 LỢI THẾ BẬC THẦY · KỸ THUẬT CẬN CHIẾN · TRANG BỊ PHỤ · GIÁP CHỐNG ĐẠN
 *  · CỔNG KHÔNG GIAN · XUYÊN TƯỜNG · CHUỖI HẠ GỤC / CHUỖI THẮNG · HOẠT ẢNH ĐÁNH ====================
 *  Nạp sau stats.js.
 */

/* ============================== VŨ KHÍ ============================== */
// Đại Đao: chỉ rơi từ hòm thính huyền thoại, nerf nhẹ
delete BASE_WEIGHTS.GREATSWORD;
if (!LEGEND_POOL.includes('GREATSWORD')) LEGEND_POOL.push('GREATSWORD');
Object.assign(WEAPONS.GREATSWORD, { damage: Math.round(WEAPONS.GREATSWORD.damage * 0.9), fireRate: Math.round(WEAPONS.GREATSWORD.fireRate * 1.1), desc: (WEAPONS.GREATSWORD.desc || '') + ' (chỉ có trong hòm thính huyền thoại)' });
// Gatling (Minigun): bắn xa hơn, sấy đủ 2 giây thì đạn xuyên tường
WEAPONS.MINIGUN.range = Math.round(WEAPONS.MINIGUN.range * 1.35);
WEAPONS.MINIGUN.desc = 'Càng sấy càng nhanh; sấy liên tục 2 giây: đạn xuyên tường';
// Phun lửa: phun càng lâu lửa càng xa (tối đa ~1.9 lần), đốt được bụi rậm
WEAPONS.FLAME.desc = 'Phun càng lâu lửa càng xa; đốt cháy được bụi rậm';

const _fireWeapon7 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const last = p.lastFireT || -9, cont = world.time - last < 0.3;
    if (w.id === 'FLAME' || w.id === 'MINIGUN') p.holdFireT = cont ? (p.holdFireT || 0) + (world.time - last) : 0;
    const n0 = bullets.length;
    const r = _fireWeapon7(p, w, ang, charge, enemy);
    for (let i = n0; i < bullets.length; i++) {
        const b = bullets[i]; if (b.owner !== p.id) continue;
        if (w.id === 'FLAME' && b.flame) b.life *= 1 + Math.min(1, (p.holdFireT || 0) / 1.5) * 0.9;
        if (w.id === 'MINIGUN' && p.holdFireT >= 2) { b.ghostN = 99; b.color = '#c4b5fd'; }
    }
    if (w.id === 'MINIGUN') { if (p.holdFireT >= 2 && !p.gatGhost) { p.gatGhost = true; floatText(p.x, p.y - 34, 'ĐẠN XUYÊN TƯỜNG!', '#c4b5fd', 14); } else if (p.holdFireT < 2) p.gatGhost = false; }
    if (has(p, 'portalSPS')) portalExtraShot(p, w);
    return r;
};

/* ============================== 2 LỢI THẾ BẬC THẦY (bỏ lần nâng cấp đầu) ============================== */
Object.assign(ADVANTAGES, {
    meleeMaster: { icon: '⚔️', name: 'Bậc Thầy Cận Chiến', desc: 'Khởi đầu có thẻ Kỹ Thuật Cận Chiến Cao Cấp. Nhận ít hơn 18% sát thương đạn & nổ. Bù lại: mất lần nâng cấp đầu tiên.' },
    rangeMaster: { icon: '🏹', name: 'Bậc Thầy Tầm Xa', desc: 'Khởi đầu có thẻ Trang Bị Phụ. Tầm nhìn, tầm bắn, tốc bắn +15%. Bù lại: -20 máu tối đa và mất lần nâng cấp đầu tiên.' }
});
ADV_IDS.push('meleeMaster', 'rangeMaster');
const SKIP_R1 = ['meleeMaster', 'rangeMaster'];
const _advPhase7 = advPhase;
advPhase = function () {
    const ph = _advPhase7(), op = ph.onPick;
    ph.onPick = (p, id) => { op(p, id); if (id === 'meleeMaster' && !p.build.includes('meleeTech')) p.build.push('meleeTech'); if (id === 'rangeMaster' && !p.build.includes('gunMod')) p.build.push('gunMod'); };
    return ph;
};
const R1_SKIP = '⏭ BỎ QUA LẦN NÂNG CẤP ĐẦU (lợi thế Bậc Thầy)';
const _openAug7 = openAugmentScreen;
openAugmentScreen = function () {
    const first = isPickRound(currentRound) && pickCount === 0 && matchPreDone, lp = players.find(q => q.id === localId());
    if (first && lp && SKIP_R1.includes(lp.adv)) pickCtx = { label: R1_SKIP };
    _openAug7();
    if (!first || gameState !== 'AUGMENT' || augState.phase) return;
    players.forEach(p => {
        if (!SKIP_R1.includes(p.adv) || augState.picked[p.id]) return;
        augState.picked[p.id] = '__solo';
        const side = pickSide(p.id); if (side) { $(`p${side}-cards`).innerHTML = ''; $(`p${side}-wait`).classList.remove('hidden'); }
    });
    if (players.every(q => augState.picked[q.id])) pickAugmentByIndex(-1, 0, true);
};
const _netSendTo7 = netSendTo;
netSendTo = function (id, msg) {
    if (msg && msg.t === 'aug' && msg.kind === 'build' && pickCount === 0) { const p = players.find(q => q.id === id); if (p && SKIP_R1.includes(p.adv)) { msg.ids = []; msg.ctx = { label: R1_SKIP }; } }
    return _netSendTo7(id, msg);
};

/* ============================== KỸ THUẬT CẬN CHIẾN CAO CẤP (tính là S) ============================== */
const MELEE_GROUP = { KNIFE: 'assassin', DAGGERS: 'assassin', KATANA: 'blade', LIGHTSABER: 'blade', RAPIER: 'blade', SPEAR: 'spear', HAMMER: 'heavy', AXE: 'heavy', GREATSWORD: 'heavy', SHIELD: 'guard', ROUNDSHIELD: 'guard', CHAINSAW: 'saw' };
function hitLine(p, a, L, half, dmg, opts) {
    const ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L, dx = ex - p.x, dy = ey - p.y, hit = [];
    enemiesOf(p).forEach(e => {
        if (e.air > 0) return;
        const t = Math.max(0, Math.min(1, ((e.x - p.x) * dx + (e.y - p.y) * dy) / (dx * dx + dy * dy)));
        if (dist(e.x, e.y, p.x + dx * t, p.y + dy * t) < half + e.radius) { dealDamage(e, dmg, p.id, Object.assign({ melee: true, angle: a, knock: 220 }, opts)); hit.push(e); }
    });
    return hit;
}
function meleeTechCast(p) {
    const w = getCurrentWeapon(p), g = MELEE_GROUP[w.id], a = aimDir(p), m = (p.meleeMult || 1) * (combo(p, 'swordSaint') ? 1.2 : 1);
    if (g === 'assassin') {
        const e = enemiesOf(p).filter(q => targetable(p, q) && dist(p.x, p.y, q.x, q.y) < 240).sort((x, y) => dist(p.x, p.y, x.x, x.y) - dist(p.x, p.y, y.x, y.y))[0];
        if (e) {
            const bx = e.x - Math.cos(e.angle) * (e.radius + p.radius + 6), by = e.y - Math.sin(e.angle) * (e.radius + p.radius + 6);
            smoke(p.x, p.y, 5, 'rgba(120,90,160,0.35)', 12);
            if (!pointInObstacle(bx, by, p.radius)) { p.x = bx; p.y = by; }
            p.angle = Math.atan2(e.y - p.y, e.x - p.x);
            dealDamage(e, w.damage * 2.2 * m, p.id, { melee: true, angle: p.angle, knock: 160 });
            floatText(p.x, p.y - 36, '🗡 ÁM SÁT!', '#c084fc', 16);
        } else { p.dashTime = 0.18; p.dashAngle = a; }
    } else if (g === 'blade') {
        p.dashTime = 0.18; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln, 0.2);
        hitLine(p, a, 230, 22, 35 * m);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 230, color: '#e0f2fe', width: 8, life: 0.25, maxLife: 0.25, swing: 1, line: true });
        floatText(p.x, p.y - 36, '⚔ NHẤT KIẾM!', '#e0f2fe', 16);
    } else if (g === 'spear') {
        const hit = hitLine(p, a, 290, 18, 40 * m, { knock: 0 });
        hit.forEach(e => { e.kx -= Math.cos(a) * 520; e.ky -= Math.sin(a) * 520; });
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 290, color: '#fde68a', width: 6, life: 0.25, maxLife: 0.25, swing: 1, line: true });
        floatText(p.x, p.y - 36, '🔱 GIÁO XUYÊN!', '#fde68a', 16);
    } else if (g === 'heavy') {
        ring(p.x, p.y, 12, 170, '#fca5a5', 0.5, 8); addShake(10); AudioSys.playAt('slam', p.x, p.y, 0.5);
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 170 + e.radius) { dealDamage(e, 30 * m, p.id, { melee: true, knock: 350, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.8); } });
        floatText(p.x, p.y - 36, '💥 ĐỊA CHẤN!', '#fca5a5', 16);
    } else if (g === 'guard') {
        p.st.reflect = Math.max(p.st.reflect, 2); p.st.shield = Math.max(p.st.shield, 40); p.st.shieldT = Math.max(p.st.shieldT, 2.5);
        floatText(p.x, p.y - 36, '🛡 PHẢN ĐÒN!', '#93c5fd', 16);
    } else if (g === 'saw') {
        p.st.rage = Math.max(p.st.rage, 3); p.st.haste = Math.max(p.st.haste, 3);
        floatText(p.x, p.y - 36, '⚙ CUỒNG CƯA!', '#f97316', 16);
    } else { shockwave(p.x, p.y, p.id, 140, 28 * m); floatText(p.x, p.y - 36, '👊 ĐẤM NGÀN CÂN!', '#fde047', 16); }
}
defS('meleeTech', '🥋', 'Kỹ Thuật Cận Chiến Cao Cấp', 8, 'engage',
    '<b>Nội tại:</b> cận chiến +15% sát thương, +20% chí mạng.<br><b>Kỹ năng đổi theo vũ khí:</b> Dao/Song Đao = Ám Sát (dịch ra sau lưng địch, đâm ×2.2) · Katana/Kiếm = Nhất Kiếm (lướt chém xuyên) · Giáo = Giáo Xuyên (đâm xa & kéo về) · Búa/Rìu/Đại Đao = Địa Chấn (choáng vùng) · Khiên = Phản Đòn · Cưa Máy = Cuồng Cưa · tay không = Đấm Ngàn Cân.',
    p => meleeTechCast(p), 240);
CARDS.meleeTech.aim = 'dir'; CARDS.meleeTech.aimR = 240;

/* ============================== TRANG BỊ PHỤ (tính là S) ============================== */
const GUN_GROUP = { AR: 'launcher', SAR: 'launcher', SMG: 'drum', MINIGUN: 'drum', SHOTGUN: 'slug', SNIPER: 'scope', BOW: 'scope', RAILGUN: 'scope', PISTOL: 'ricochet', SPISTOL: 'ricochet', REVOLVER: 'ricochet', DUAL: 'ricochet' };
function gunModCast(p) {
    const w = getCurrentWeapon(p), g = GUN_GROUP[w.id], a = aimDir(p), m0 = muzzle(p, w, a);
    if (g === 'launcher') {
        spawnBullet(p, m0.x, m0.y, a, { speed: 16, damage: 20, range: 520, color: '#ff7a1a', explosive: true, blastSmall: true, size: 5, bounces: 0, trail: 40 });
        floatText(p.x, p.y - 36, '🚀 PHÓNG LỰU DƯỚI NÒNG', '#fb923c', 14); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.4);
    } else if (g === 'drum') {
        if (w.magSize) { w.mag = Math.max(w.mag, effMag(p, w)); w.reloading = false; }
        p.st.rage = Math.max(p.st.rage, 3); floatText(p.x, p.y - 36, '🥁 BĂNG TRỐNG', '#fde047', 14);
    } else if (g === 'slug') {
        spawnBullet(p, m0.x, m0.y, a, { speed: 28, damage: 60, range: 520, color: '#e5e7eb', size: 4, pierce: true, knock: 320, trail: 60 });
        floatText(p.x, p.y - 36, '🔘 ĐẠN SÊN', '#e5e7eb', 14); AudioSys.playAt('shotgun', p.x, p.y, 0.5);
    } else if (g === 'scope') {
        enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (d < 1000 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.35) spotFor(e, p.id, 5); });
        p.st.sureCrit = Math.max(p.st.sureCrit || 0, 1.5);
        floatText(p.x, p.y - 36, '🔭 ỐNG NGẮM NHIỆT', '#a5b4fc', 14);
    } else if (g === 'ricochet') {
        const extra = combo(p, 'cowboyMod') ? 1 : 0;
        for (let i = 0; i < 6; i++) { const aa = a - 0.45 + i * 0.18, b = spawnBullet(p, m0.x, m0.y, aa, { speed: 22, damage: 14, range: 420, color: '#fde68a', size: 2.5, bounces: 2 + extra, trail: 20 }); b.bounces = 2 + extra; }
        floatText(p.x, p.y - 36, '🎱 ĐẠN NẢY', '#fde68a', 14);
    } else if (w.type === 'GUN' || w.type === 'THROWABLE') {
        [-0.3, 0, 0.3].forEach(o => items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(a + o) * 820, vy: Math.sin(a + o) * 820, thrown: true, ownerId: p.id, fuse: 1.0, z: 0, vz: 260, blast: [55, 110] }));
        floatText(p.x, p.y - 36, '💣 ỐNG PHÓNG PHỤ', '#fb923c', 14);
    } else {
        for (let i = 0; i < 3; i++) p.shotQueue.push({ t: i * 0.1, fn: () => { if (p.hp > 0) spawnBullet(p, p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, a + (Math.random() - 0.5) * 0.08, { speed: 22, damage: 15, range: 380, color: '#e2e8f0', size: 2.5, trail: 18 }); } });
        floatText(p.x, p.y - 36, '🔫 SÚNG LỤC DỰ PHÒNG', '#e2e8f0', 14);
    }
}
defS('gunMod', '🔩', 'Trang Bị Phụ', 7, 'engage',
    '<b>Nội tại:</b> súng bắn xa hơn 10%.<br><b>Phụ kiện đổi theo súng:</b> AR = phóng lựu dưới nòng · SMG/Gatling = băng trống (nạp đầy + cuồng nộ) · Shotgun = đạn sên xuyên · Bắn tỉa/Cung/Railgun = ống ngắm nhiệt (lộ địch + chí mạng) · Súng lục = 6 viên đạn nảy · súng khác = ống phóng 3 lựu · cận chiến = súng lục dự phòng.',
    p => gunModCast(p), 400);
CARDS.gunMod.aim = 'dir'; CARDS.gunMod.aimR = 400;

/* ============================== GIÁP CHỐNG ĐẠN (tính là S) ============================== */
defS('bulletArmor', '🦺', 'Giáp Chống Đạn', 14, 'defend', '<b>Nội tại:</b> +25 máu tối đa, nhận ít hơn 15% sát thương đạn.<br><b>Kỹ năng – Tấm Kevlar:</b> 3 giây nhận ít hơn 60% sát thương đạn.', p => { p.st.kevlar = 3; ring(p.x, p.y, 6, 50, '#94a3b8', 0.4); AudioSys.playAt('block', p.x, p.y, 0.4); floatText(p.x, p.y - 36, '🦺 KEVLAR', '#cbd5e1', 14); });

/* ============================== CỔNG KHÔNG GIAN · XUYÊN TƯỜNG ============================== */
let portalGid = 0;
function placePortals(p, life) {
    // xoá cặp cổng cũ
    for (let i = zones.length - 1; i >= 0; i--) if (zones[i].type === 'portal' && zones[i].owner === p.id) zones.splice(i, 1);
    const a = aimDir(p); let D = Math.max(120, Math.min(420, p.skillDist || 320));
    let bx, by;
    for (; D > 60; D -= 20) { bx = p.x + Math.cos(a) * D; by = p.y + Math.sin(a) * D; if (!pointInObstacle(bx, by, 16) && bx > 30 && by > 30 && bx < MAP_W - 30 && by < MAP_H - 30) break; }
    const gid = ++portalGid;
    zones.push({ type: 'portal', x: p.x, y: p.y, r: 24, t: life, maxT: life, owner: p.id, tick: 0, phase: gid * 2 });
    zones.push({ type: 'portal', x: bx, y: by, r: 24, t: life, maxT: life, owner: p.id, tick: 0, phase: gid * 2 + 1 });
    p.portT = world.time + 0.8; // vừa mở cổng dưới chân: chưa bị hút ngay
    ring(p.x, p.y, 8, 40, '#a78bfa', 0.4, 4); ring(bx, by, 8, 40, '#22d3ee', 0.4, 4); AudioSys.playAt('trick', p.x, p.y, 0.4);
}
defS('portal', '🌀', 'Cổng Không Gian', 14, 'escape', 'Mở 2 cổng A (chỗ bạn đứng) và B (theo hướng chọn, tối đa 420) trong 8 giây. Người và đạn đi vào cổng này sẽ ra ở cổng kia.', p => placePortals(p, 8), 420);
CARDS.portal.aim = 'point'; CARDS.portal.aimR = 420;
defP('phaseWalk', '🧱', 'Xuyên Tường', 'Đi thẳng vào tường 0.35 giây thì xuyên qua sang phía bên kia. Mỗi bức tường có hồi chiêu riêng 6 giây.', p => { p.phaseWalk = true; });
defS('portalSPS', '🌌', 'Cổng Không Gian (S-P-S)', 9, 'escape',
    '<b>S:</b> mở cặp cổng A/B (10 giây), hồi chiêu chỉ 9 giây.<br><b>P:</b> đạn của bạn bay xuyên được 1 bức tường.<br><b>Đặc biệt – Cổng Bắn Phụ:</b> khi cổng đang mở, mỗi lần bạn bắn thì cổng xa bạn hơn cũng bắn 1 viên vào địch gần nó.',
    p => placePortals(p, 10), 420);
CARDS.portalSPS.aim = 'point'; CARDS.portalSPS.aimR = 420;
CARDS.portalSPS.evo = { need: ['portal', 'phaseWalk'], replaces: 'portal' };

function portalPairs() {
    const g = {};
    zones.forEach(z => { if (z.type === 'portal') (g[Math.floor(z.phase / 2)] = g[Math.floor(z.phase / 2)] || [])[z.phase % 2] = z; });
    return Object.values(g).filter(x => x[0] && x[1]);
}
function portalExtraShot(p, w) {
    if (w.type !== 'GUN' || world.time < (p.portalShotT || 0)) return;
    const pair = portalPairs().find(x => x[0].owner === p.id); if (!pair) return;
    const far = dist(p.x, p.y, pair[0].x, pair[0].y) > dist(p.x, p.y, pair[1].x, pair[1].y) ? pair[0] : pair[1];
    const e = enemiesOf(p).filter(q => dist(far.x, far.y, q.x, q.y) < 520 && lineOfSight(far.x, far.y, q.x, q.y) && !(q.st.invis > 0)).sort((x, y) => dist(far.x, far.y, x.x, x.y) - dist(far.x, far.y, y.x, y.y))[0];
    if (!e) return;
    p.portalShotT = world.time + 0.35;
    const a = Math.atan2(e.y - far.y, e.x - far.x);
    bullets.push({ x: far.x, y: far.y, px: far.x, py: far.y, angle: a, speed: 22, damage: Math.max(8, (w.damage || 10) * 0.7), life: 520 / (22 * 60), owner: p.id, color: '#22d3ee', size: 2.6, knock: 40, bounces: 0, trail: 20 });
}
function updatePortals(dt) {
    portalPairs().forEach(([A, B]) => {
        [[A, B], [B, A]].forEach(([from, to]) => {
            players.forEach(p => {
                if (p.hp <= 0 || p.air > 0 || world.time < (p.portT || 0) || dist(p.x, p.y, from.x, from.y) > from.r) return;
                const a = p.moveDir !== undefined ? p.moveDir : p.angle;
                p.x = to.x + Math.cos(a) * 30; p.y = to.y + Math.sin(a) * 30; if (pointInObstacle(p.x, p.y, p.radius)) { p.x = to.x; p.y = to.y; }
                p.portT = world.time + 0.9; spark(to.x, to.y, '#a78bfa', 10, 180); AudioSys.playAt('trick', to.x, to.y, 0.25);
                const o = players.find(q => q.id === from.owner);
                if (o && p.id === o.id && combo(o, 'iceGate')) { p.st.shield = Math.max(p.st.shield, 20); p.st.shieldT = Math.max(p.st.shieldT, 2); }
            });
            bullets.forEach(b => {
                if ((b.portT || 0) > world.time || dist(b.x, b.y, from.x, from.y) > from.r + (b.size || 2)) return;
                b.x = to.x + Math.cos(b.angle) * (to.r + 4); b.y = to.y + Math.sin(b.angle) * (to.r + 4); b.px = b.x; b.py = b.y; b.portT = world.time + 0.5;
            });
        });
    });
}
function updatePhaseWalk(p, dt) {
    if (!p.phaseWalk || (p.lastMoveIn || 0) < 0.5 || p.air > 0 || p.dashTime > 0) { p.phaseT = 0; return; }
    const a = p.moveDir, ax = p.x + Math.cos(a) * (p.radius + 6), ay = p.y + Math.sin(a) * (p.radius + 6);
    const o = obstacles.find(q => ax > q.x && ax < q.x + q.w && ay > q.y && ay < q.y + q.h);
    if (!o) { p.phaseT = 0; return; }
    o.pid = o.pid || ('o' + Math.random().toString(36).slice(2, 8));
    p.phaseCd = p.phaseCd || {};
    if ((p.phaseCd[o.pid] || 0) > world.time) return;
    p.phaseT = (p.phaseT || 0) + dt;
    if (p.phaseT < 0.35) return;
    for (let d = p.radius + 10; d < 260; d += 8) {
        const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (x < p.radius || y < p.radius || x > MAP_W - p.radius || y > MAP_H - p.radius) break;
        if (!pointInObstacle(x, y, p.radius + 2)) {
            smoke(p.x, p.y, 5, 'rgba(167,139,250,0.35)', 12);
            p.x = x; p.y = y; p.phaseT = 0; p.phaseCd[o.pid] = world.time + (combo(p, 'phaseRun') ? 4 : 6);
            ring(x, y, 6, 40, '#a78bfa', 0.35, 3); AudioSys.playAt('trick', x, y, 0.3); floatText(x, y - 30, 'XUYÊN TƯỜNG', '#c4b5fd', 12);
            if (combo(p, 'ghostWall')) p.st.invis = Math.max(p.st.invis, 1.5);
            return;
        }
    }
    p.phaseT = 0; p.phaseCd[o.pid] = world.time + 1; // tường quá dày
}

/* ============================== PHỐI HỢP MỚI ============================== */
[
    { id: 'swordSaint', a: 'meleeTech', b: 'nomind', name: 'Kiếm Thánh', desc: 'Kỹ năng cận chiến cao cấp mạnh hơn 20% và hồi nhanh hơn 3 giây.' },
    { id: 'steelWarrior', a: 'meleeTech', b: 'bulletArmor', name: 'Chiến Binh Thép', desc: 'Cầm vũ khí cận chiến: nhận ít hơn 10% sát thương đạn nữa.' },
    { id: 'lastStandBlade', a: 'meleeTech', b: 'desperate', name: 'Liều Mạng Cận Chiến', desc: 'Dưới 40% máu: kỹ năng cận chiến cao cấp hồi gấp đôi.' },
    { id: 'gunMaster', a: 'gunMod', b: 'marksman', name: 'Thợ Súng Bậc Thầy', desc: 'Trang Bị Phụ hồi nhanh hơn 2 giây.' },
    { id: 'cowboyMod', a: 'gunMod', b: 'pistolPro', name: 'Phụ Kiện Cao Bồi', desc: 'Đạn nảy của súng lục nảy thêm 1 lần.' },
    { id: 'laserSight', a: 'gunMod', b: 'headshot', name: 'Ống Ngắm Laser', desc: 'Vùng headshot rộng hơn 30%.' },
    { id: 'fullArmor', a: 'bulletArmor', b: 'armorPlate', name: 'Áo Giáp Toàn Diện', desc: 'Giáp Chống Đạn giảm thêm 10% sát thương đạn.' },
    { id: 'iceGate', a: 'portal', b: 'freeze', name: 'Cổng Băng', desc: 'Đi qua cổng của mình được khiên 20 trong 2 giây.' },
    { id: 'ghostWall', a: 'phaseWalk', b: 'invis', name: 'Bóng Ma Xuyên Tường', desc: 'Xuyên tường xong được tàng hình 1.5 giây.' },
    { id: 'phaseRun', a: 'phaseWalk', b: 'momentum', name: 'Lướt Xuyên', desc: 'Mỗi bức tường chỉ hồi 4 giây.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3 && id !== 'invis') console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);

const _skillCd7 = skillCooldown;
skillCooldown = function (p, id) {
    let cd = _skillCd7(p, id);
    if (id === 'meleeTech' && combo(p, 'swordSaint')) cd -= 3;
    if (id === 'meleeTech' && combo(p, 'lastStandBlade') && p.hp < p.maxHp * 0.4) cd *= 0.5;
    if (id === 'gunMod' && combo(p, 'gunMaster')) cd -= 2;
    return Math.max(1, cd);
};

/* ============================== ÁP DỤNG · SÁT THƯƠNG ============================== */
const _applyBuild7 = applyBuild;
applyBuild = function (p) {
    p.phaseWalk = false; p.phaseCd = {}; p.portT = 0; p.holdFireT = 0;
    _applyBuild7(p);
    p.meleeTech = has(p, 'meleeTech'); p.gunModP = has(p, 'gunMod'); p.bulletArmorP = has(p, 'bulletArmor');
    if (p.bulletArmorP) p.maxHp += 25;
    if (p.adv === 'rangeMaster') { p.maxHp -= 20; p.statVis *= 1.15; p.fireRateMult *= 0.87; }
    if (combo(p, 'laserSight')) p.headBonusR = 1.3; else p.headBonusR = 1;
};
const _spawnBullet7 = spawnBullet;
spawnBullet = function (p, x, y, ang, o) {
    const b = _spawnBullet7(p, x, y, ang, o);
    if (p && p.st) {
        if (p.adv === 'rangeMaster') b.life *= 1.15;
        if (p.gunModP) b.life *= 1.1;
        if (has(p, 'portalSPS') && !b.ghostN) b.ghostN = 1;
        if (p.headBonusR > 1) b.headR = (b.headR || 0.45) * p.headBonusR;
    }
    return b;
};
const _dealDamage7 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (target && target.st && target.hp > 0) {
        if (target.adv === 'meleeMaster' && (opts.bullet || opts.blast)) dmg *= 0.82;
        if (opts.bullet) {
            if (target.bulletArmorP) dmg *= combo(target, 'fullArmor') ? 0.75 : 0.85;
            if (target.st.kevlar > 0) dmg *= 0.4;
            if (combo(target, 'steelWarrior') && ['MELEE', 'SHIELD'].includes(getCurrentWeapon(target).type)) dmg *= 0.9;
        }
    }
    if (atk && atk !== target && atk.meleeTech && opts.melee) {
        dmg *= 1.15; atk.critChance = (atk.critChance || 0) + 0.2;
        try { return _dealDamage7(target, dmg, attackerId, opts); } finally { atk.critChance -= 0.2; }
    }
    return _dealDamage7(target, dmg, attackerId, opts);
};

/* ============================== CHUỖI HẠ GỤC · CHUỖI THẮNG ============================== */
const MULTI = { 2: 'HẠ GỤC KÉP!', 3: 'HẠ GỤC BA!', 4: 'TỨ SÁT!', 5: 'HUỶ DIỆT!' };
let firstBloodDone = false;
const _killPlayer7 = killPlayer;
killPlayer = function (dead, killerId) {
    const was = dead.dead;
    _killPlayer7(dead, killerId);
    if (was || !dead.dead) return;
    const k = players.find(q => q.id === killerId && q !== dead);
    if (!k) return;
    k.roundKills = (k.roundKills || 0) + 1;
    k.chain = world.time - (k.chainT || -9) < 5 ? (k.chain || 1) + 1 : 1; k.chainT = world.time;
    if (!firstBloodDone) { firstBloodDone = true; showBanner('🩸 CHIẾN CÔNG ĐẦU', `${k.label} mở màn hiệp đấu!`, k.color, 1.6, 34); }
    else if (k.chain >= 2) showBanner('⚡ ' + (MULTI[Math.min(5, k.chain)]), `${k.label} · ${k.chain} mạng liên tiếp`, k.color, 1.8, 38 + k.chain * 3);
    else if (k.roundKills >= 3) showBanner('🔥 ĐANG HỦY DIỆT', `${k.label} · ${k.roundKills} mạng hiệp này`, k.color, 1.6, 34);
};
const _resetRound7 = resetPlayerForRound;
resetPlayerForRound = function (p) { firstBloodDone = false; p.roundKills = 0; p.chain = 0; return _resetRound7(p); };
let lastScores = {};
function updateStreaks() {
    const changed = players.filter(p => lastScores[p.id] !== undefined && p.score > lastScores[p.id]);
    if (changed.length) {
        players.forEach(p => { if (changed.includes(p)) p.winStreak = (p.winStreak || 0) + 1; else p.winStreak = 0; });
        changed.forEach(p => { if (p.winStreak >= 2) showBanner(`🏆 CHUỖI THẮNG x${p.winStreak}`, `${p.label} thắng ${p.winStreak} hiệp liền!`, p.color, 2, 40); });
    }
    players.forEach(p => lastScores[p.id] = p.score);
}
const _startMatch7 = startMatch;
startMatch = function () { lastScores = {}; const r = _startMatch7(); players.forEach(p => { p.winStreak = 0; lastScores[p.id] = 0; }); return r; };

const _upe7 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe7(dt);
    players.forEach(p => { if (p.hp > 0 && p.st) { if (p.st.kevlar > 0) p.st.kevlar -= dt; updatePhaseWalk(p, dt); } });
    updatePortals(dt);
    updateStreaks();
};
const _snapPlayer7 = snapPlayer;
snapPlayer = function (p) { return Object.assign(_snapPlayer7(p), { rk: p.roundKills || 0, ws: p.winStreak || 0 }); };

/* ============================== VẼ: cổng · huy hiệu chuỗi · hoạt ảnh đánh ============================== */
const _drawNetZones7 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones7(now);
    zones.forEach(z => {
        if (z.type !== 'portal') return;
        const isB = z.phase % 2 === 1, col = isB ? '#22d3ee' : '#a78bfa', k = Math.min(1, z.t / 0.5);
        ctx.save(); ctx.translate(z.x, z.y); ctx.globalAlpha = k;
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, z.r * 1.4); g.addColorStop(0, '#0b0620'); g.addColorStop(0.55, hexA(col, 0.55)); g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, z.r * 1.4, z.r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, z.r * (0.5 + i * 0.3), z.r * (0.4 + i * 0.25), now * (2 + i) * (isB ? -1 : 1), 0, Math.PI * 1.3); ctx.stroke(); }
        ctx.fillStyle = '#fff'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(isB ? 'B' : 'A', 0, -z.r - 10);
        ctx.restore();
    });
};
const _drawHUD7 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD7(W, H, now);
    const me = localPlayer();
    if (!me || !['PLAYING', 'KO', 'COUNTDOWN', 'ROUND_OVER'].includes(gameState)) return;
    const rk = me.rk !== undefined ? me.rk : (me.roundKills || 0), ws = me.ws !== undefined ? me.ws : (me.winStreak || 0);
    const tags = [];
    if (rk > 0) tags.push({ t: `🔥 ${rk} MẠNG`, c: rk >= 3 ? '#f87171' : '#fdba74' });
    if (ws >= 2) tags.push({ t: `🏆 THẮNG x${ws}`, c: '#fde047' });
    let x = Math.min(300, Math.max(220, SCREEN_W * 0.3)) + 20; const y = 14; // cạnh bảng máu, không đè bảng hạ gục
    tags.forEach(tg => {
        ctx.font = `700 11px ${FONT}`; const w = ctx.measureText(tg.t).width + 16;
        const pulse = 0.75 + Math.sin(now * 6) * 0.25;
        ctx.fillStyle = 'rgba(6,10,24,0.75)'; rrect(ctx, x, y, w, 20, 10); ctx.fill();
        ctx.strokeStyle = hexA(tg.c, pulse); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = tg.c; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(tg.t, x + 8, y + 10.5);
        x += w + 6;
    });
};
/** Hoạt ảnh đánh: vung vũ khí cận chiến, lao người khi đâm, giật lùi khi bắn, lắc lư khi chạy */
const _drawPlayer7 = drawPlayer;
drawPlayer = function (p, now) {
    if (p.hp <= 0 || p.x === undefined) return _drawPlayer7(p, now);
    const w = getCurrentWeapon(p), t = world.time - (p.lastFireT || -9), a0 = p.angle;
    let dx = 0, dy = 0, rot = 0, sq = 1;
    const melee = w.type === 'MELEE' || w.type === 'SHIELD' || w.id === 'NONE';
    if (melee && t >= 0 && t < 0.26) {
        const k = t / 0.26;
        if (w.strike === 'stab' || w.id === 'SPEAR' || w.id === 'RAPIER') { const l = Math.sin(k * Math.PI) * 13; dx = Math.cos(a0) * l; dy = Math.sin(a0) * l; sq = 1 + Math.sin(k * Math.PI) * 0.08; }
        else { rot = (k < 0.3 ? -1.0 * (k / 0.3) : -1.0 + 1.7 * ((k - 0.3) / 0.7)) * (1 - k * 0.6); const l = Math.sin(k * Math.PI) * 6; dx = Math.cos(a0) * l; dy = Math.sin(a0) * l; }
    } else if (!melee && t >= 0 && t < 0.14) {
        const k = 1 - t / 0.14, kick = (['SHOTGUN', 'SNIPER', 'RAILGUN', 'ROCKET', 'REVOLVER'].includes(w.id) ? 6 : 3) * k;
        dx = -Math.cos(a0) * kick; dy = -Math.sin(a0) * kick; rot = (Math.random() - 0.5) * 0.05 * k;
    } else if (p.aiming && (p.charge || 0) > 0 && melee) rot = -0.6 * Math.min(1, p.charge); // gồng tụ lực
    const sp = Math.hypot(p.vx || 0, p.vy || 0);
    const bob = sp > 40 ? Math.sin(now * 16 + p.id) * 0.05 : 0;
    if (!dx && !dy && !rot && !bob && sq === 1) return _drawPlayer7(p, now);
    ctx.save();
    ctx.translate(p.x + dx, p.y + dy); ctx.scale(sq * (1 - bob * 0.5), (1 / sq) * (1 + bob)); ctx.translate(-p.x, -p.y);
    p.angle = a0 + rot;
    try { _drawPlayer7(p, now); } finally { p.angle = a0; ctx.restore(); }
};
