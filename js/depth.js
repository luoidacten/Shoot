'use strict';
/* =====================================================================
 *  CHIỀU SÂU: tàng hình đúng loại cho mọi nguồn · Bậc Thầy có VFX & mạnh hơn · Bậc Thầy Vũ Khí mới
 *  Giáp Chống Nổ mạnh · bot khôn hơn (lắc né, sợ bắn tỉa xa, liều mạng) · vùng ngắm đúng tác dụng
 *  THẺ PHỐI HỢP BẬC 3 · KỸ NĂNG PHỐI HỢP (2–3 kỹ năng gộp thành 1) · Tàn Phá Diện Rộng
 *  Nạp sau htplus.js.
 * ===================================================================== */

/* ============================== 1) TÀNG HÌNH: loại theo nguồn ============================== */
const INVIS_PRI = { camo: 1, ghost: 2, void: 3 };
/** gán loại tàng hình cho nguồn vừa kích hoạt (giữ loại mạnh hơn nếu đang có) */
function invisAs(p, k) { if (!p) return; if (!p.invisKind || INVIS_PRI[k] >= INVIS_PRI[p.invisKind]) p.invisKind = k; }

/* ============================== 2) BẬC THẦY: VFX + buff vài vũ khí ============================== */
const MASTER_COL = { KNIFE: '#c4b5fd', DAGGERS: '#c084fc', KATANA: '#7dd3fc', LIGHTSABER: '#86efac', RAPIER: '#e0f2fe', SPEAR: '#fde68a', HAMMER: '#fca5a5', AXE: '#fca5a5', GREATSWORD: '#fb7185', SHIELD: '#93c5fd', ROUNDSHIELD: '#7dd3fc', CHAINSAW: '#f97316', NONE: '#fde047', BAT: '#fbbf24', LONGSWORD: '#e5e7eb' };
function masterFx(p, col, big) {
    const a = aimDir(p);
    castFx(p, col, true);
    ring(p.x, p.y, p.radius + 6, p.radius + 140, col, 0.45, 7);
    for (let i = 0; i < 14; i++) { const t = a + (Math.random() - 0.5) * 1.4, s = 220 + Math.random() * 380; particles.push({ x: p.x + Math.cos(t) * 20, y: p.y + Math.sin(t) * 20, vx: Math.cos(t) * s, vy: Math.sin(t) * s, life: 0.35, maxLife: 0.35, color: col, size: 2.5, glow: true, drag: 0.86 }); }
    if (big) { flash(col, 0.12); hitStop(0.04); }
}
const _meleeTechCast36 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), col = MASTER_COL[w.id] || '#fde68a', a = aimDir(p);
    _meleeTechCast36(p);
    masterFx(p, col, true);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 150, color: col, width: 12, life: 0.28, maxLife: 0.28, swing: 1, line: false }); // vệt chém lớn
    // buff những chiêu yếu: Khiên (chỉ phản đòn) · Cưa (chỉ cuồng nộ) · Song Đao
    if (w.id === 'SHIELD' || w.id === 'ROUNDSHIELD') { shockwave(p.x, p.y, p.id, 160, 26 * (p.meleeMult || 1)); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 160 + e.radius) e.stun = Math.max(e.stun, 0.6); }); }
    if (w.id === 'CHAINSAW') strikes.push({ kind: 'htSpin', owner: p.id, x: p.x, y: p.y, t: 1.0, tick: 0 });
    if (w.id === 'DAGGERS') fan(p, 7, 0.9, a, { damage: 14 * (p.meleeMult || 1), speed: 20, color: '#e9d5ff', size: 3.5, life: 0.5 });
};
const _gunModCast36 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), col = w.color && w.color.length === 7 ? w.color : '#fde68a', a = aimDir(p);
    _gunModCast36(p);
    masterFx(p, col, true);
    const mx = p.x + Math.cos(a) * 30, my = p.y + Math.sin(a) * 30;
    ring(mx, my, 6, 80, '#fff7ed', 0.25, 4); // sóng đầu nòng
    for (let i = 0; i < 4; i++) particles.push({ x: p.x, y: p.y, vx: Math.cos(a + Math.PI / 2) * (120 + i * 30), vy: Math.sin(a + Math.PI / 2) * (120 + i * 30) - 60, life: 0.5, maxLife: 0.5, color: '#fbbf24', size: 2, drag: 0.92 }); // vỏ đạn
    // buff: SMG / Minigun / Railgun / Tesla (chiêu tại chỗ) thêm xung lực
    if (['SMG', 'MINIGUN'].includes(w.id)) strikes.push({ kind: 'htBurst', owner: p.id, n: 12, gap: 0.04, tick: 0, dmg: 9, spread: 0.25, color: col });
    if (w.id === 'TESLA') enemiesOf(p).filter(e => dist(p.x, p.y, e.x, e.y) < 380).slice(0, 3).forEach(e => { beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.25, maxLife: 0.25, color: '#93c5fd', zig: 1 }); dealDamage(e, 22, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.3); });
    if (w.id === 'RAILGUN') { const bx = p.x + Math.cos(a) * 1200, by = p.y + Math.sin(a) * 1200; beams.push({ x1: p.x, y1: p.y, x2: bx, y2: by, life: 0.3, maxLife: 0.3, color: '#67e8f9' }); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, p.x, p.y, bx, by) < 26 + e.radius) dealDamage(e, 45, p.id, { angle: a, knock: 260 }); }); }
};

/* ============================== 3) BẬC THẦY VŨ KHÍ: dùng kỹ năng của vũ khí phụ + đòn khi đổi vũ khí ============================== */
ADVANTAGES.weaponMaster.desc += ' MỚI: kỹ năng Bậc Thầy của vũ khí ở TAY KIA vẫn dùng được (tự rút ra dùng rồi cất lại). Mỗi lần đổi vũ khí: ĐÒN RÚT VŨ KHÍ — cận chiến chém vòng cung (tốn 3 độ bền), súng bắn nhanh 2 phát (tốn 2 viên).';
const _castSkill36 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p && p.skills && p.skills[slot];
    if (p && p.adv === 'weaponMaster' && s && s.cd <= 0 && (s.id === 'meleeTech' || s.id === 'gunMod')) {
        const cur = getCurrentWeapon(p), o = otherSlot(p), ow = p.inventory[o];
        const need = s.id === 'meleeTech' ? isMeleeOrFist : isGunWep;
        if (!need(cur) && ow && need(ow) && ow.id !== 'NONE') { // rút vũ khí phụ ra dùng chiêu rồi cất lại
            const keep = p.weaponIdx; p.weaponIdx = o;
            try { return _castSkill36(p, slot, aimVec); } finally { p.weaponIdx = keep; floatText(p.x, p.y - 52, `🔁 ${ow.name}`, '#fde68a', 12); }
        }
    }
    return _castSkill36(p, slot, aimVec);
};
function drawStrike(p, w) {
    if ((p.drawCdT || 0) > world.time || w.id === 'NONE' || p.hp <= 0) return;
    p.drawCdT = world.time + 1.2;
    const a = p.angle;
    if (w.type === 'MELEE' || w.type === 'SHIELD') {
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 125, color: MASTER_COL[w.id] || '#fde68a', width: 10, life: 0.22, maxLife: 0.22, swing: 1, line: false });
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 125 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 1.1) dealDamage(e, 30 * (p.meleeMult || 1), p.id, { melee: true, knock: 260, angle: a }); });
        if (typeof reduceDurability === 'function' && w.durability !== undefined) reduceDurability(p, w, 3);
        floatText(p.x, p.y - 44, '⚔ RÚT KIẾM CHÉM!', '#fde68a', 13);
    } else if (w.type === 'GUN' && w.magSize && w.mag > 0) {
        const n = Math.min(2, w.mag);
        for (let i = 0; i < n; i++) p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp > 0) htBullet(p, p.angle + (Math.random() - 0.5) * 0.05, { damage: Math.max(14, (w.damage || 12) * 1.2), speed: 24, color: '#fde68a', size: 4, life: 0.8, trail: 40 }); } });
        w.mag -= n; p.muzzle = 0.06;
        floatText(p.x, p.y - 44, '🔫 RÚT SÚNG NHANH!', '#fde68a', 13);
    } else return;
    ring(p.x, p.y, p.radius, p.radius + 50, '#fde68a', 0.25, 3); AudioSys.playAt('whoosh', p.x, p.y, 0.35);
}

/* ============================== 4) GIÁP CHỐNG NỔ: mạnh hơn nhiều ============================== */
ADVANTAGES.blastArmor.desc = 'Mỗi hiệp khởi đầu với 160 giáp; nhận ít hơn 55% sát thương nổ và KHÔNG bị nổ đẩy lùi; mỗi vụ nổ trúng bạn hồi lại 10 giáp. Kháng 15% mọi sát thương khác khi còn giáp.';
let _blastDepth = 0;
const _explode36 = explode;
explode = function (...a) { _blastDepth++; try { return _explode36(...a); } finally { _blastDepth--; } };
const _applyBuild36a = applyBuild;
applyBuild = function (p) { _applyBuild36a(p); if (p.adv === 'blastArmor') { p.maxArmor += 60; p.armor = Math.max(p.armor || 0, p.maxArmor); } };
const _dealDamage36 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.adv === 'blastArmor') {
        if (opts.blast || _blastDepth > 0) { dmg *= 0.45; opts = Object.assign({}, opts, { knock: 1 }); target.armor = Math.min(Math.max(150, target.maxArmor || 0), (target.armor || 0) + 10); }
        else if (target.armor > 0 && !opts.zone) dmg *= 0.85;
    }
    // bot: bị bắn từ rất xa → cảnh giác
    const a = attackerId >= 0 && players.find(q => q.id === attackerId);
    if (a && target && target.isBot && target.brain && a !== target && dist(a.x, a.y, target.x, target.y) > 560 && !opts.zone) { target.brain.longT = world.time + 3.5; target.brain.longFrom = { x: a.x, y: a.y }; }
    return _dealDamage36(target, dmg, attackerId, opts);
};

/* ============================== 5) BOT: lắc né khi chạy, sợ bắn tỉa xa, LIỀU MẠNG khi hết đường ============================== */
INTENT_NAME.cover = 'NÉ BẮN TỈA'; INTENT_NAME.allin = 'LIỀU MẠNG';
const LONG_W = ['SNIPER', 'RAILGUN', 'BOW', 'XBOWX'];
const _scoreIntents36 = scoreIntents;
scoreIntents = function (p) {
    const info = _scoreIntents36(p), B = p.brain, now = world.time, e = info.e;
    // thấy kẻ cầm súng tầm xa chĩa về mình từ xa → cảnh giác
    enemiesOf(p).forEach(q => { const w = getCurrentWeapon(q), d = dist(p.x, p.y, q.x, q.y); if (LONG_W.includes(w.id) && d > 520 && targetable(p, q) && Math.cos(angleDiff(Math.atan2(p.y - q.y, p.x - q.x), q.aimAngle !== undefined ? q.aimAngle : q.angle)) > 0.85) { B.longT = now + 2.5; B.longFrom = { x: q.x, y: q.y }; } });
    const myLong = LONG_W.includes(getCurrentWeapon(p).id);
    // liều mạng: bị đuổi lâu / bị dồn sát mà không có chỗ nấp
    if (!(B.allinT > now) && e && info.vis) {
        const cornered = B.chased && info.d < 260 && !coverPoint(p, e), longChase = (B.chaseT || 0) >= 3.5 && info.d < 320, dying = p.hp < p.maxHp * 0.22 && info.d < 200 && B.chased;
        if (cornered || longChase || dying) { B.allinT = now + 4.5; floatText(p.x, p.y - 46, '💢 LIỀU MẠNG!', '#f87171', 15); p.st.rage = Math.max(p.st.rage || 0, 2); }
    }
    if (B.allinT > now) { info.best = 'allin'; return info; }
    if (B.longT > now && !myLong && !(TRAITS[B.persona] && TRAITS[B.persona].noRetreat) && (!e || !info.vis || info.d > 380)) info.best = 'cover';
    return info;
};
const _intentMove36 = intentMove;
intentMove = function (p, info, dt) {
    const B = p.brain, e = info.e, now = world.time;
    if (B.intent === 'cover') { // chạy lắt léo vào chỗ khuất tay bắn tỉa
        const from = B.longFrom || (e ? { x: e.x, y: e.y } : p), c = coverPoint(p, from);
        B.zigT = (B.zigT || 0) - dt; if (B.zigT <= 0) { B.zigT = rr(0.2, 0.38); B.zig = -(B.zig || 0.8); }
        if (c && dist(p.x, p.y, c.x, c.y) > 24) return Math.atan2(c.y - p.y, c.x - p.x) + B.zig * 0.6;
        if (c) return 'hold';
        return Math.atan2(p.y - from.y, p.x - from.x) + B.zig;
    }
    if (B.intent === 'allin') { // lao thẳng vào, lắc nhẹ né đạn
        if (!e) return null; B.zigT = (B.zigT || 0) - dt; if (B.zigT <= 0) { B.zigT = rr(0.25, 0.45); B.zig = -(B.zig || 0.35); }
        return Math.atan2(e.y - p.y, e.x - p.x) + B.zig;
    }
    if (B.intent === 'evade') { // lắc mạnh hơn khi chạy trốn
        const r = _intentMove36(p, info, dt);
        if (typeof r === 'number') { B.jigT = (B.jigT || 0) - dt; if (B.jigT <= 0) { B.jigT = rr(0.18, 0.32); B.jig = -(B.jig || 0.45); } return r + B.jig; }
        return r;
    }
    return _intentMove36(p, info, dt);
};
const _botThink36 = botThink;
botThink = function (p, dt) {
    const out = _botThink36(p, dt), B = p.brain;
    if (!B || gameState !== 'PLAYING') return out;
    if (B.allinT > world.time) { // dốc hết: mọi kỹ năng, phép, vật phẩm, bóp cò liên tục
        (p.skills || []).forEach((s, i) => { if (s.cd <= 0 && Math.random() < 0.25) out['s' + (i + 1)] = true; });
        const e = players.find(q => q.id === B.targetId && q.hp > 0); if (e && targetable(p, e)) { const w = getCurrentWeapon(p); out.a = w.mode === 'auto' ? true : w.mode === 'charge' ? (p.charge || 0) < 0.6 : !B.prevA2; B.prevA2 = out.a; }
    }
    return out;
};
const _botSpells36 = botSpells;
botSpells = function (p, dt) {
    const B = p.brain;
    if (B && gameState === 'PLAYING') {
        const e = players.find(q => q.id === B.targetId && q.hp > 0);
        if (B.allinT > world.time) { (p.spells || []).forEach((s, i) => { if (s.cd <= 0 && Math.random() < dt * 2) castSpell(p, i); }); (p.items || []).forEach((it, i) => { if (Math.random() < dt) useItem(p, i); }); }
        else if (B.chased && e) { // chặn đường: quay mặt về kẻ đuổi rồi dựng tường / màn khói
            (p.spells || []).forEach((s, i) => { if (s.cd <= 0 && ['iceWall', 'smokeLine'].includes(s.id) && Math.random() < dt * 3) { const keep = p.angle; p.angle = Math.atan2(e.y - p.y, e.x - p.x); p.spellAng = p.angle; castSpell(p, i); p.angle = keep; } });
        }
    }
    return _botSpells36(p, dt);
};

/* ============================== 6) VÙNG NGẮM ĐÚNG TÁC DỤNG ============================== */
const HT_PROFILE = {
    NONE: { aim: 'dir', R: 195, shape: 'cone', half: 0.8 }, KNIFE: { aim: null, shape: 'selfaoe', aoe: 340 }, DAGGERS: { aim: 'dir', R: 450, shape: 'cone', half: 0.65 },
    KATANA: { aim: 'dir', R: 280, shape: 'line', w: 50 }, SPEAR: { aim: 'dir', R: 600, shape: 'cone', half: 0.15 }, HAMMER: { aim: null, shape: 'selfaoe', aoe: 310 }, CHAINSAW: { aim: null, shape: 'selfaoe', aoe: 95 },
    LIGHTSABER: { aim: 'dir', R: 600, shape: 'cone', half: 0.2 }, SHIELD: { aim: 'dir', R: 170, shape: 'selfaoe', aoe: 170 }, ROUNDSHIELD: { aim: null, shape: 'selfaoe', aoe: 420 }, RAPIER: { aim: 'dir', R: 120, shape: 'line', w: 30 },
    GREATSWORD: { aim: 'dir', R: 210, shape: 'cone', half: 1.1 }, AXE: { aim: null, shape: 'selfaoe', aoe: 140 }, PISTOL: { aim: 'dir', R: 600, shape: 'cone', half: 0.1 }, REVOLVER: { aim: 'dir', R: 650, shape: 'cone', half: 0.45 },
    SMG: { aim: 'dir', R: 600, shape: 'cone', half: 0.12 }, DUAL: { aim: null, shape: 'selfaoe', aoe: 300 }, AR: { aim: 'dir', R: 600, shape: 'cone', half: 0.15 }, SAR: { aim: null, shape: 'selfaoe', aoe: 40 }, SPISTOL: { aim: null, shape: 'selfaoe', aoe: 40 },
    SHOTGUN: { aim: 'dir', R: 300, shape: 'cone', half: 0.4 }, SNIPER: { aim: 'dir', R: 1300, shape: 'line', w: 12 }, RAILGUN: { aim: 'dir', R: 1400, shape: 'line', w: 60 }, BOW: { aim: 'dir', R: 330, shape: 'point', aoe: 120 },
    ROCKET: { aim: 'dir', R: 800, shape: 'cone', half: 0.3 }, LAUNCHER: { aim: 'dir', R: 500, shape: 'cone', half: 0.5 }, GRENADE: { aim: 'dir', R: 450, shape: 'cone', half: 0.6 }, EMPGREN: { aim: null, shape: 'selfaoe', aoe: 240 },
    FLAME: { aim: 'dir', R: 360, shape: 'line', w: 110 }, TESLA: { aim: null, shape: 'selfaoe', aoe: 460 }, ENERGY: { aim: 'dir', R: 560, shape: 'line', w: 124 }, MINIGUN: { aim: null, shape: 'selfaoe', aoe: 150 },
    NET: { aim: 'dir', R: 250, shape: 'point', aoe: 150 }, BOOMERANG: { aim: 'dir', R: 400, shape: 'cone', half: 0.7 }
};
const SKILL_PROFILE = {
    dash: { aim: 'dir', R: 170, shape: 'line', w: 30 }, smoke: { aim: 'point', R: 320, shape: 'point', aoe: 182, arc: true, col: '203,213,225' }, speedSmoke: { aim: 'point', R: 340, shape: 'point', aoe: 200, arc: true, col: '125,211,252' },
    blink: { aim: 'dir', R: 260, shape: 'line', w: 30, col: '196,181,253' }, hook: { aim: 'dir', R: 520, shape: 'line', w: 24, col: '250,204,21' }, shock: { aim: null, shape: 'selfaoe', aoe: 150 },
    wall: { aim: 'dir', R: 120, shape: 'bar', len: 170, col: '125,211,252' }, barricade: { aim: 'dir', R: 110, shape: 'bar', len: 120, col: '214,191,142' }, decoy: { aim: 'dir', R: 220, shape: 'line', w: 30 },
    freeze: { aim: 'dir', R: 600, shape: 'line', w: 30, col: '186,230,253' }, firebomb: { aim: 'point', R: 360, shape: 'point', aoe: 110, arc: true, col: '249,115,22' }, gravity: { aim: 'point', R: 380, shape: 'point', aoe: 160, col: '168,85,247' },
    claymore: { aim: 'dir', R: 160, shape: 'cone', half: 0.7, col: '248,113,113' }, tripwire: { aim: 'dir', R: 220, shape: 'line', w: 8 }, glueBomb: { aim: 'point', R: 340, shape: 'point', aoe: 100, arc: true, col: '250,204,21' },
    grapple: { aim: 'dir', R: 420, shape: 'line', w: 20 }, leap: { aim: 'point', R: 300, shape: 'point', aoe: 70, arc: true }, poisonGas: { aim: 'point', R: 360, shape: 'point', aoe: 120, arc: true, col: '132,204,22' },
    scout: { aim: 'dir', R: 500, shape: 'line', w: 30 }, portal: { aim: 'point', R: 420, shape: 'point', aoe: 40, col: '168,85,247' }, portalSPS: { aim: 'point', R: 420, shape: 'point', aoe: 40, col: '168,85,247' },
    emp: { aim: null, shape: 'selfaoe', aoe: 260 }, storm: { aim: null, shape: 'selfaoe', aoe: 260 }, elsuSPS: { aim: 'dir', R: 200, shape: 'line', w: 30 },
    turret: { aim: 'dir', R: 90, shape: 'point', aoe: 30 }, mgNest: { aim: 'dir', R: 90, shape: 'point', aoe: 30 }, mortar: { aim: 'dir', R: 90, shape: 'point', aoe: 30 }, flameTurret: { aim: 'dir', R: 90, shape: 'point', aoe: 30 }, teslaTower: { aim: 'dir', R: 90, shape: 'point', aoe: 30 },
    shadowStep: { aim: 'dir', R: 300, shape: 'line', w: 30, col: '196,181,253' }, frostFire: { aim: 'point', R: 380, shape: 'point', aoe: 150, arc: true, col: '186,230,253' }, chainHook: { aim: 'dir', R: 520, shape: 'line', w: 24, col: '250,204,21' },
    holyLight: { aim: null, shape: 'selfaoe', aoe: 260, col: '253,224,71' }, blackPoison: { aim: 'point', R: 380, shape: 'point', aoe: 170, arc: true, col: '132,204,22' }
};
const _skillProfile36 = skillProfile;
skillProfile = function (p, id) {
    const r = _skillProfile36(p, id); if (r) return r;
    if (id === 'hightech') { const w = getCurrentWeapon(p).id; return HT_PROFILE[w] || { aim: 'dir', R: 400, shape: 'line', w: 30 }; }
    return SKILL_PROFILE[id] || null;
};
const _drawExtraAim36 = drawExtraAim;
drawExtraAim = function (p, w, now) {
    const v = p.skillAimView;
    if (v && v.shape && (v.shape.shape === 'bar' || v.shape.shape === 'selfaoe') && !v.cancel) {
        const S = v.shape, col = v.ready === false ? '148,163,184' : (S.col || '34,211,238'), pulse = 0.75 + Math.sin(now * 8) * 0.25;
        ctx.save();
        if (S.shape === 'selfaoe') {
            const g = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, S.aoe); g.addColorStop(0, `rgba(${col},0.04)`); g.addColorStop(1, `rgba(${col},0.3)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, S.aoe, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${col},${0.9 * pulse})`; ctx.lineWidth = 2; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -now * 30; ctx.stroke(); ctx.setLineDash([]);
        } else {
            const d = S.R, cx = p.x + Math.cos(v.ang) * d, cy = p.y + Math.sin(v.ang) * d;
            ctx.translate(cx, cy); ctx.rotate(v.ang + Math.PI / 2);
            ctx.fillStyle = `rgba(${col},0.35)`; rrect(ctx, -S.len / 2, -9, S.len, 18, 4); ctx.fill();
            ctx.strokeStyle = `rgba(${col},${0.95 * pulse})`; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
        p.skillAimView = null; try { return _drawExtraAim36(p, w, now); } finally { p.skillAimView = v; }
    }
    return _drawExtraAim36(p, w, now);
};

/* ============================== 7) THẺ PHỐI HỢP BẬC 3 ============================== */
const COMBO3 = [
    { id: 'infernoLord', need: ['pyro', 'lavaWalker', 'firebomb'], name: 'Hoả Thần Giáng Thế', desc: 'Mọi vùng lửa của bạn to hơn 40%; đứng trong lửa hồi 5 máu/giây.' },
    { id: 'nightReaper', need: ['silent', 'silentSmoke', 'camoCloak'], name: 'Sát Thủ Bóng Đêm', desc: 'Ngụy Trang thành VÔ HÌNH (không bóng mờ); đòn đầu tiên sau khi hiện hình ×1.8.' },
    { id: 'walkingFort', need: ['armorP', 'armorPlate', 'juggernaut'], name: 'Pháo Đài Di Động', desc: 'Nhận ít hơn 15% sát thương và miễn mọi đẩy lùi.' },
    { id: 'godShot', need: ['marksman', 'headshot', 'critEye'], name: 'Thần Xạ', desc: 'Súng +18% sát thương; đạn bay nhanh hơn 20%.' },
    { id: 'steelStorm', need: ['fastReload', 'bigMag', 'hotBarrel'], name: 'Bão Thép', desc: 'Súng bắn nhanh hơn 18%; cứ 4 giây tự nạp 30% băng đạn.' },
    { id: 'skyCommand', need: ['radioman', 'fastComms', 'bigPayload'], name: 'Tổng Chỉ Huy Không Quân', desc: 'Mọi đòn gọi hoả lực cảnh báo nhanh hơn 30% và sát thương +20%.' },
    { id: 'shadowTrinity', need: ['invis', 'phantom', 'camoCloak'], name: 'Tam Ảnh', desc: 'Mọi tàng hình của bạn kéo dài thêm 50%; khi đang tàng hình hồi 3 máu/giây.' },
    { id: 'beastKing', need: ['wolfPack', 'beastMaster', 'packLeader'], name: 'Vua Muông Thú', desc: 'Mỗi con thú / lính triệu hồi ở gần (300) giúp bạn gây thêm 5% và nhận ít hơn 4% sát thương (tối đa 20%).' }
].filter(c => c.need.every(n => CARDS[n]));
const COMBO3_OF = {}; COMBO3.forEach(c => c.need.forEach(n => (COMBO3_OF[n] = COMBO3_OF[n] || []).push(c)));
const combo3 = (p, id) => { const c = COMBO3.find(x => x.id === id); return !!(p && c && c.need.every(n => has(p, n))); };
const _cardHTML36 = cardHTML;
cardHTML = function (id, kind, owned, keyLabel, ...rest) {
    let html = _cardHTML36(id, kind, owned, keyLabel, ...rest);
    if (kind === 'stat' || kind === 'adv' || kind === 'spell' || !CARDS[id]) return html;
    const own = new Set(owned || []), rows = (COMBO3_OF[id] || []).map(c => { const others = c.need.filter(n => n !== id), have = others.filter(n => own.has(n)).length, on = have === others.length;
        return `<div class="combo ${on ? 'on' : ''}">⭐ <b>${c.name}</b> <span>+ ${others.map(n => (own.has(n) ? '✔' : '') + CARDS[n].icon + ' ' + CARDS[n].name).join(' + ')}</span>${on ? `<i>${c.desc}</i>` : ''}</div>`; }).join('');
    if (rows) html += `<div class="combos">${rows}</div>`;
    return html;
};
// hiệu ứng bậc 3
const _dealDamage36b = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const a = attackerId >= 0 && players.find(q => q.id === attackerId);
    if (target && combo3(target, 'walkingFort')) { dmg *= 0.85; opts = Object.assign({}, opts, { knock: 1 }); }
    if (a && combo3(a, 'godShot') && getCurrentWeapon(a).type === 'GUN' && !opts.melee && !opts.zone) dmg *= 1.18;
    if (a && a.reaperNext && !(a.st && a.st.invis > 0) && !opts.zone) { dmg *= 1.8; a.reaperNext = false; floatText(a.x, a.y - 40, 'ĐOẠT MỆNH!', '#a78bfa', 14); }
    const pets = q => decoys.filter(d => d.owner === q.id && d.hp > 0 && dist(d.x, d.y, q.x, q.y) < 300).length;
    if (target && combo3(target, 'beastKing')) dmg *= 1 - Math.min(0.2, pets(target) * 0.04);
    if (a && combo3(a, 'beastKing')) dmg *= 1 + Math.min(0.2, pets(a) * 0.05);
    return _dealDamage36b(target, dmg, attackerId, opts);
};
const _payload36 = payload;
payload = function (p) { return _payload36(p) * (combo3(p, 'skyCommand') ? 1.2 : 1); };
const _strikeWarnT36 = strikeWarnT;
strikeWarnT = function (p, base) { return _strikeWarnT36(p, base) * (combo3(p, 'skyCommand') ? 0.7 : 1); };
const _applyBuild36 = applyBuild;
applyBuild = function (p) {
    // kỹ năng phối hợp thay CẢ các kỹ năng gốc (giải phóng ô kỹ năng)
    (p.build || []).slice().forEach(id => { const e = CARDS[id] && CARDS[id].evo; if (e && e.also) p.build = p.build.filter(x => !e.also.includes(x)); });
    _applyBuild36(p);
    if (combo3(p, 'steelStorm')) p.fireRateMult = (p.fireRateMult || 1) * 0.82;
};
const _upe36 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe36(dt);
    players.forEach(p => {
        if (p.hp <= 0) return;
        // Bậc Thầy Vũ Khí: đòn khi đổi vũ khí
        if (p._wIdx === undefined) p._wIdx = p.weaponIdx;
        if (p.weaponIdx !== p._wIdx) { p._wIdx = p.weaponIdx; if (p.adv === 'weaponMaster' && gameState === 'PLAYING') drawStrike(p, getCurrentWeapon(p)); }
        if (gameState !== 'PLAYING' || net.role === 'guest') return;
        if (combo3(p, 'infernoLord') && zones.some(z => (z.type === 'fire' || z.type === 'cellFire') && dist(p.x, p.y, z.x, z.y) < z.r)) p.hp = Math.min(p.maxHp, p.hp + (5 * dt) * HEALK);
        if (combo3(p, 'shadowTrinity') && p.st.invis > 0) p.hp = Math.min(p.maxHp, p.hp + (3 * dt) * HEALK);
        if (combo3(p, 'nightReaper') && p.st.invis > 0) { if (p.invisKind === 'camo') p.invisKind = 'void'; p.reaperNext = true; }
        if (combo3(p, 'steelStorm')) { p.ssT = (p.ssT || 0) + dt; if (p.ssT > 4) { p.ssT = 0; const w = getCurrentWeapon(p); if (w.magSize && !w.noReload) w.mag = Math.min(effMag(p, w), w.mag + Math.ceil(effMag(p, w) * 0.3)); } }
    });
    if (net.role === 'guest') return;
    zones.forEach(z => { if ((z.type === 'fire') && !z._inf) { z._inf = true; const o = players.find(q => q.id === z.owner); if (combo3(o, 'infernoLord')) z.r *= 1.4; } });
};
const _setInvis36 = setInvis;
setInvis = function (p, kind, t) { return _setInvis36(p, kind, combo3(p, 'shadowTrinity') ? t * 1.5 : t); };
const _spawnBullet36 = typeof spawnBullet === 'function' ? spawnBullet : null;
if (_spawnBullet36) spawnBullet = function (p, x, y, a, o) { const b = _spawnBullet36(p, x, y, a, o); if (b && p && p.inventory && combo3(p, 'godShot')) b.speed *= 1.2; return b; };

/* ============================== 8) KỸ NĂNG PHỐI HỢP (gộp kỹ năng) + TÀN PHÁ DIỆN RỘNG ============================== */
function skillFuse(id, need, extra) { if (!CARDS[id] || !need.every(n => CARDS[n])) return; CARDS[id].evo = { need, replaces: need.find(n => CARDS[n].kind === 'S'), also: need.filter(n => CARDS[n].kind === 'S') }; CARDS[id].skillFuse = true; Object.assign(CARDS[id], extra || {}); }
defS('shadowStep', '🌑', 'Bước Ảnh', 10, 'escape', '<b>Dịch Chuyển + Vô Hình</b>: dịch chuyển 300 (xuyên tường), để lại PHÂN THÂN ở chỗ cũ và VÔ HÌNH 2.5 giây.', p => {
    const a = aimDir(p), ox = p.x, oy = p.y;
    for (let d = 300; d > 20; d -= 20) { const nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d; if (nx > p.radius && ny > p.radius && nx < MAP_W - p.radius && ny < MAP_H - p.radius && !pointInObstacle(nx, ny, p.radius)) { p.x = nx; p.y = ny; break; } }
    decoys.push({ x: ox, y: oy, angle: p.angle, speed: 0, owner: p.id, t: 3, hp: 40, color: p.color, radius: p.radius, label: p.label });
    setInvis(p, 'void', 2.5); smoke(ox, oy, 8, 'rgba(91,33,182,0.4)', 18); ring(p.x, p.y, 8, 70, '#c4b5fd', 0.3, 3); AudioSys.playAt('trick', p.x, p.y, 0.4);
});
defS('frostFire', '🧊', 'Băng Hoả', 12, 'engage', '<b>Băng Phong + Bom Lửa</b>: ném quả cầu băng hoả, nổ vùng 150: 60 sát thương, đóng băng 1 giây rồi cháy 4 giây.', p => {
    const a = aimDir(p), d = Math.max(80, Math.min(380, p.skillDist || 300)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    strikes.push({ kind: 'frostFire', owner: p.id, x, y, t: 0.45 }); htBullet(p, a, { damage: 0, speed: d / 27, size: 9, color: '#bae6fd', life: 0.45, trail: 40 });
});
defS('chainHook', '⛓️', 'Móc Sấm', 10, 'engage', '<b>Móc Câu + Sóng Chấn</b>: móc kéo địch về rồi nổ sóng chấn 160 quanh bạn (40 sát thương, choáng 0.8 giây).', p => {
    if (CARDS.hook && CARDS.hook.cast) CARDS.hook.cast(p, enemyOf(p));
    p.shotQueue.push({ t: 0.35, fn: () => { if (p.hp <= 0) return; shockwave(p.x, p.y, p.id, 160, 40); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 160 + e.radius) e.stun = Math.max(e.stun, 0.8); }); ring(p.x, p.y, 10, 160, '#facc15', 0.4, 6); addShake(6); } });
});
defS('holyLight', '✨', 'Thánh Quang', 16, 'heal', '<b>Hồi Phục + Khiên</b>: hồi 40% máu và nhận khiên 60 trong 4 giây — cả đồng đội trong bán kính 260.', p => {
    players.forEach(q => { if (q.hp > 0 && (q === p || sameTeam(p, q)) && dist(p.x, p.y, q.x, q.y) < 260) { q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.4); q.st.shield = Math.max(q.st.shield || 0, 60); q.st.shieldT = Math.max(q.st.shieldT || 0, 4); spark(q.x, q.y, '#fde68a', 14, 160); } });
    ring(p.x, p.y, 10, 260, '#fde68a', 0.5, 6); flash('#fef3c7', 0.1); AudioSys.playAt('legend', p.x, p.y, 0.35);
});
defS('blackPoison', '🕳️', 'Hố Đen Độc', 14, 'engage', '<b>Hố Đen + Bom Độc</b>: tạo hố đen kéo địch vào giữa 3 giây, kèm vùng độc 170 (12 sát thương/giây).', p => {
    const a = aimDir(p), d = Math.max(80, Math.min(380, p.skillDist || 300)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    zones.push({ type: 'gravity', x, y, r: 170, t: 3, maxT: 3, owner: p.id, tick: 0 }); zones.push({ type: 'poison', x, y, r: 170, t: 5, maxT: 5, owner: p.id, tick: 0 });
    ring(x, y, 10, 170, '#84cc16', 0.5, 5); AudioSys.playAt('rail', x, y, 0.4);
});
defS('devastation', '☢️', 'Tàn Phá Diện Rộng', 45, 'engage', '<b>Đợt Càn + Không Kích + Tải Trọng Lớn</b> (kỹ năng phối hợp bậc 3): mở bảng chiến thuật, chọn 1 vị trí — cả một DẢI RỘNG xuyên bản đồ đi qua điểm đó bị cảnh báo 5 giây, rồi phi đội rải thảm bom từ đầu này sang đầu kia bản đồ (mỗi quả 70 sát thương).', p => {
    const c = p.pickTarget ? p.pickTarget.a : autoPoint(p); devastate(p, c.x, c.y);
}, 2000);
skillFuse('shadowStep', ['blink', 'invis']); skillFuse('frostFire', ['freeze', 'firebomb']); skillFuse('chainHook', ['hook', 'shock']);
skillFuse('holyLight', ['heal', 'shieldS']); skillFuse('blackPoison', ['gravity', 'poisonGas']); skillFuse('devastation', ['sweepStrike', 'airstrike', 'bigPayload']);
Object.assign(TAC, { devast: { name: '☢️ TÀN PHÁ DIỆN RỘNG', need: 1, r: 330, col: '#ef4444', steps: ['CHẠM 1 ĐIỂM — CẢ DẢI NGANG BẢN ĐỒ SẼ BỊ RẢI BOM'] } });
TAB_KIND.devast = 'air';
CARDS.devastation.picker = 'devast'; FIRE_SKILLS.push('devastation');
function devastate(p, x, y) {
    const H = 330, warn = strikeWarnT(p, 5), dur = 2.6;
    zones.push({ type: 'devastWarn', x: MAP_W / 2, y, r: H, t: warn + dur, maxT: warn + dur, owner: p.id, tick: 0, phase: warn });
    for (let bx = 60; bx < MAP_W; bx += 150) [-210, -70, 70, 210].forEach(off => dropBomb(p, bx + (Math.random() - 0.5) * 60, y + off + (Math.random() - 0.5) * 50, 70 * payload(p), 120, warn + (bx / MAP_W) * dur));
    showBanner('☢️ TÀN PHÁ DIỆN RỘNG', `${p.label} gọi phi đội rải thảm — tránh khỏi dải đỏ!`, '#f87171', 2, 40);
    AudioSys.playAt('alarm', p.x, p.y, 0.6, 99999);
}
const _updateStrikes36 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes36(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (!s) continue; if (s.kind !== 'frostFire' || s.t > 0) continue;
        strikes.splice(i, 1); const o = players.find(q => q.id === s.owner); if (!o) continue;
        ring(s.x, s.y, 10, 150, '#bae6fd', 0.4, 6); explosionFx(s.x, s.y, 90);
        enemiesOf(o).forEach(e => { if (dist(s.x, s.y, e.x, e.y) < 150 + e.radius) { dealDamage(e, 60, o.id, { angle: Math.atan2(e.y - s.y, e.x - s.x), knock: 120 }); e.stun = Math.max(e.stun, 1); e.st.slow = Math.max(e.st.slow || 0, 2); } });
        zones.push({ type: 'fire', x: s.x, y: s.y, r: 120, t: 4, maxT: 4, owner: o.id, tick: 0 });
    }
};
const _drawNetZones36 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones36(now);
    zones.forEach(z => {
        if (z.type !== 'devastWarn') return;
        const el = (z.maxT || 0) - z.t, warn = z.phase || 5, y0 = z.y - z.r, h = z.r * 2;
        ctx.save();
        if (el < warn) { // cảnh báo: dải đỏ nhấp nháy + sọc chạy + đếm ngược
            const k = el / warn;
            ctx.fillStyle = `rgba(239,68,68,${0.08 + k * 0.12 + Math.max(0, Math.sin(now * (5 + k * 12))) * 0.08})`; ctx.fillRect(0, y0, MAP_W, h);
            ctx.strokeStyle = 'rgba(248,113,113,0.9)'; ctx.lineWidth = 5; ctx.setLineDash([30, 16]); ctx.lineDashOffset = -now * 160;
            ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(MAP_W, y0); ctx.moveTo(0, y0 + h); ctx.lineTo(MAP_W, y0 + h); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = `800 90px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(254,202,202,${0.35 + 0.25 * Math.sin(now * 10)})`;
            for (let x = 300; x < MAP_W; x += 900) ctx.fillText(`☢ ${Math.ceil(warn - el)}`, x, z.y);
        } else { // phi đội bay ngang
            const px = ((el - warn) / Math.max(0.1, z.maxT - warn)) * (MAP_W + 400) - 200;
            for (let k = -1; k <= 1; k++) { ctx.save(); ctx.translate(px - Math.abs(k) * 80, z.y + k * 150); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(10, 30, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.moveTo(46, 0); ctx.lineTo(-10, -8); ctx.lineTo(-24, -44); ctx.lineTo(-36, -44); ctx.lineTo(-28, -8); ctx.lineTo(-44, -8); ctx.lineTo(-52, -20); ctx.lineTo(-58, -20); ctx.lineTo(-54, 0); ctx.lineTo(-58, 20); ctx.lineTo(-52, 20); ctx.lineTo(-44, 8); ctx.lineTo(-28, 8); ctx.lineTo(-36, 44); ctx.lineTo(-24, 44); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
        }
        ctx.restore();
    });
};
// thẻ kỹ năng phối hợp: hiện đủ các thẻ cần + ghi rõ thay thế cả kỹ năng gốc
const _cardHTML36b = cardHTML;
cardHTML = function (id, kind, owned, keyLabel, ...rest) {
    const c = kind !== 'stat' && kind !== 'adv' && kind !== 'spell' && CARDS[id];
    if (!c || !c.skillFuse) return _cardHTML36b(id, kind, owned, keyLabel, ...rest);
    const e = c.evo, tier = e.need.length >= 3;
    return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity tag-S">${tier ? 'KỸ NĂNG PHỐI HỢP BẬC 3' : 'KỸ NĂNG PHỐI HỢP'} · ${c.cd}s</span><div class="aug-icon">${c.icon}</div><div class="aug-name">${c.name}</div><div class="aug-desc">${c.desc}</div><div class="combos"><div class="combo on">🧬 ${e.need.map(n => CARDS[n].icon + ' ' + CARDS[n].name).join(' + ')}<i>Gộp ${e.also.map(n => CARDS[n].name).join(' & ')} thành 1 kỹ năng (giải phóng ô kỹ năng).</i></div></div>`;
};
