'use strict';
/* =====================================================================
 *  CÂN BẰNG: buff lợi thế yếu · buff phép bổ trợ yếu · VFX riêng cho từng phép bổ trợ
 *  Nạp sau depth.js.
 * ===================================================================== */

/* ============================== LỢI THẾ ============================== */
const GOOD_GUNS = () => Object.keys(WEAPONS).filter(id => { const w = WEAPONS[id]; return w.type === 'GUN' && (w.tier || 1) >= 2 && !PICKER_WEAPONS[id] && !TAC_WEAPONS.includes(id) && !['AIRCALL', 'BOMBTAB', 'LASERDES', 'NET'].includes(id) && !w.legendary; });
ADVANTAGES.militaryBag.desc = 'Mỗi hiệp khởi đầu với 1 SÚNG TỐT ngẫu nhiên (bậc 2 trở lên) + dao, +40 giáp, mọi súng thêm 2 băng dự trữ.';
ADVANTAGES.stealth.desc = 'Tiếng chân nhỏ, ít dấu chân, người nhỏ hơn. MỚI: chạy nhanh hơn 8%; đầu hiệp được Ngụy Trang 3 giây; đứng yên 1 giây là tự Ngụy Trang (tới khi di chuyển hoặc tấn công).';
ADVANTAGES.doubleUp.desc = 'Lần nâng cấp đầu tiên được chọn 2 thẻ. MỚI: +25 máu tối đa.';
ADVANTAGES.techStart.desc = 'Khởi đầu đã có thẻ Kỹ Thuật Cao, hồi chiêu Kỹ Thuật Cao nhanh hơn 30%. Bù lại, lần nâng cấp tiếp theo bị chọn NGẪU NHIÊN.';
ADVANTAGES.minimap.desc = 'Có minimap ở góc màn hình (tường, bụi, vòng bo, địch đang thấy). Nghe tiếng chân xa hơn 60%. MỚI: MỌI tiếng động nghe được đều hiện đúng vị trí trên minimap & bảng chiến thuật; nhìn xa hơn 8%.';
const _applyBuild37 = applyBuild;
applyBuild = function (p) {
    _applyBuild37(p);
    if (p.adv === 'militaryBag') {
        const g = GOOD_GUNS(); if (g.length && (!p.inventory[1] || p.inventory[1].id === 'NONE' || (p.inventory[1].tier || 1) < 2)) p.inventory[1] = makeWeapon(g[Math.floor(Math.random() * g.length)], p);
        p.maxArmor += 40; p.armor = Math.max(p.armor || 0, 40);
        p.inventory.forEach(w => { if (w && w.magSize && !w.noReload) w.reserve = (w.reserve || 0) + w.magSize * 2; });
    }
    if (p.adv === 'stealth') { p.moveMult *= 1.08; p.stillCamo = 0; }
    if (p.adv === 'doubleUp') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); }
};
const _skillCd37 = skillCooldown;
skillCooldown = function (p, id) { const cd = _skillCd37(p, id); return p && p.adv === 'techStart' && id === 'hightech' ? cd * 0.7 : cd; };
const _withNearPings37 = withNearPings;
withNearPings = function (me, fn) { return me && me.adv === 'minimap' ? fn() : _withNearPings37(me, fn); };
const _visionRange37 = visionRange;
visionRange = function (viewer) { const v = viewer || localPlayer(); return _visionRange37(viewer) * (v && v.adv === 'minimap' ? 1.08 : 1); };
const _initRound37 = initRound;
initRound = function () { const r = _initRound37(); players.forEach(p => { if (p.adv === 'stealth' && p.st) setInvis(p, 'camo', 3); }); return r; };
const _upe37 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe37(dt);
    if (gameState !== 'PLAYING' || net.role === 'guest') return;
    players.forEach(p => { // Lẩn Trốn: đứng yên 1 giây là tự ngụy trang
        if (p.adv !== 'stealth' || p.hp <= 0) return;
        const still = Math.hypot(p.vx || 0, p.vy || 0) < 25 && world.time - (p.lastFireT || -9) > 1;
        p.stillCamo = still ? (p.stillCamo || 0) + dt : 0;
        if (p.stillCamo > 1) { if (!(p.st.invis > 0)) floatText(p.x, p.y - 30, '🦎 NGỤY TRANG', '#86efac', 11); setInvis(p, 'camo', 0.25); }
    });
};

/* ============================== PHÉP BỔ TRỢ: buff phép yếu ============================== */
{
    const h = SPELLS.heal, f = h.cast; h.desc = 'Hồi 35% máu tối đa, hồi thêm 8 máu/giây trong 3 giây và tăng tốc 1 giây.';
    h.cast = p => { f(p); p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.1); p.healOverT = world.time + 3; };
}
{
    const s = SPELLS.stunS; s.desc = 'Choáng 1.2 giây và gây 20 sát thương mọi địch trong bán kính 190.';
    s.cast = p => { ring(p.x, p.y, 10, 190, '#facc15', 0.45, 8); AudioSys.playAt('slam', p.x, p.y, 0.4); addShake(6);
        enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 190 + e.radius && !(e.air > 0)) { e.stun = Math.max(e.stun, 1.2); dealDamage(e, 20, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 160 }); floatText(e.x, e.y - 30, 'CHOÁNG!', '#facc15', 14); } }); };
}
if (SPELLS.miniStrike) { const m = SPELLS.miniStrike; m.desc = 'Máy bay nhỏ rải 6 quả bom (40 sát thương) theo hướng kéo.'; const prev = m.cast;
    m.cast = p => { if (typeof sCombo === 'function' && sCombo(p, 'skyWatch') && zones.some(z => z.type === 'flareLight' && z.owner === p.id)) return prev(p); planeStrike(p, spellAim(p), p.x, p.y, { from: 100, to: 600, gap: 90, dmg: 40, R: 80, warn: 0.9, label: '🛩️ KHÔNG KÍCH NHẸ' }); }; }
if (SPELLS.mineField) { const m = SPELLS.mineField; m.desc = 'Rải 5 quả mìn gai thành vòng cung sau lưng bạn.'; m.cast = p => { for (let i = 0; i < 5; i++) { const a = p.angle + Math.PI + (i - 2) * 0.55; mines.push({ kind: 'spike', x: p.x + Math.cos(a) * 60, y: p.y + Math.sin(a) * 60, owner: p.id, arm: 0.5 }); } AudioSys.playAt('ui', p.x, p.y, 0.3); }; }
if (SPELLS.supplyDrop) { const m = SPELLS.supplyDrop, f = m.cast; m.cd = 38; m.desc = 'Sau 1.5 giây một hộp hỗ trợ rơi ngay cạnh bạn; khi hộp chạm đất bạn nhận ngay +30 giáp và nạp đầy băng đạn.';
    m.cast = p => { f(p); p.shotQueue.push({ t: 1.5, fn: () => { if (p.hp <= 0) return; p.armor = Math.min(Math.max(150, p.maxArmor || 0), (p.armor || 0) + 30); const w = getCurrentWeapon(p); if (w.magSize && !w.noReload) w.mag = effMag(p, w); floatText(p.x, p.y - 34, '+30 GIÁP · ĐẦY ĐẠN', '#93c5fd', 13); } }); }; }
const _upe37b = updatePartyExtras;
updatePartyExtras = function (dt) { _upe37b(dt); players.forEach(p => { if (p.hp > 0 && p.healOverT > world.time) { p.hp = Math.min(p.maxHp, p.hp + 8 * dt); if (Math.random() < dt * 6) particles.push({ x: p.x + (Math.random() - 0.5) * 24, y: p.y, vx: 0, vy: -50, life: 0.6, maxLife: 0.6, color: '#86efac', size: 3, glow: true }); } }); };

/* ============================== VFX RIÊNG CHO TỪNG PHÉP BỔ TRỢ ============================== */
function burst(x, y, col, n, sp, life = 0.5, size = 3, up = 0) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = sp * (0.4 + Math.random() * 0.8); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, life, maxLife: life, color: col, size: size * (0.6 + Math.random() * 0.8), glow: true, drag: 0.9 }); } }
const SPELL_FX = {
    flash: (p, o) => { // vệt dịch chuyển + 2 đầu lóe sáng
        if (o) { for (let k = 0; k <= 8; k++) { const t = k / 8; particles.push({ x: o.x + (p.x - o.x) * t, y: o.y + (p.y - o.y) * t, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, color: '#fde047', size: 10 - k * 0.6, glow: true }); } burst(o.x, o.y, '#fef08a', 10, 160); }
        burst(p.x, p.y, '#fde047', 14, 220); ring(p.x, p.y, 6, 60, '#fef08a', 0.25, 4);
    },
    heal: p => { ring(p.x, p.y, 8, 90, '#4ade80', 0.45, 5); for (let i = 0; i < 10; i++) texts.push({ x: p.x + (Math.random() - 0.5) * 50, y: p.y + (Math.random() - 0.5) * 20, text: '✚', color: '#86efac', size: 12 + Math.random() * 6, life: 0.9, maxLife: 0.9, vy: -60 - Math.random() * 40, pop: 1 }); burst(p.x, p.y, '#86efac', 16, 120, 0.7, 3, 60); },
    cleanse: p => { ring(p.x, p.y, 8, 110, '#fef3c7', 0.5, 6); ring(p.x, p.y, 4, 70, '#ffffff', 0.3, 3); burst(p.x, p.y, '#fde68a', 22, 260, 0.5, 3); flash('#fffbeb', 0.08); },
    sprint: p => { const a = p.angle + Math.PI; for (let i = 0; i < 14; i++) particles.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y + (Math.random() - 0.5) * 20, vx: Math.cos(a) * (200 + Math.random() * 200), vy: Math.sin(a) * (200 + Math.random() * 200), life: 0.35, maxLife: 0.35, color: '#7dd3fc', size: 2.5, glow: true, drag: 0.88 }); ring(p.x, p.y, 6, 70, '#7dd3fc', 0.25, 4); },
    execute: p => { burst(p.x, p.y, '#f87171', 12, 200); ring(p.x, p.y, 6, 60, '#ef4444', 0.25, 4); },
    stunS: p => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; texts.push({ x: p.x + Math.cos(a) * 70, y: p.y + Math.sin(a) * 70, text: '★', color: '#fde047', size: 16, life: 0.7, maxLife: 0.7, vy: -20, pop: 1 }); } burst(p.x, p.y, '#facc15', 20, 300); flash('#fef9c3', 0.08); },
    iceWall: p => { const a = p.angle, x = p.x + Math.cos(a) * 80, y = p.y + Math.sin(a) * 80; burst(x, y, '#bae6fd', 22, 220, 0.6, 3.5); ring(x, y, 6, 90, '#e0f2fe', 0.3, 4); },
    missile: p => { smoke(p.x, p.y, 6, 'rgba(180,180,190,0.45)', 18); burst(p.x, p.y, '#fb923c', 10, 180); },
    blind: p => { burst(p.x, p.y, '#334155', 16, 200, 0.6, 5); ring(p.x, p.y, 8, 90, '#64748b', 0.35, 5); },
    radar: p => { ring(p.x, p.y, 20, 650, '#4ade80', 0.9, 4); ring(p.x, p.y, 10, 420, '#86efac', 0.6, 3); ring(p.x, p.y, 6, 200, '#bbf7d0', 0.4, 3); burst(p.x, p.y, '#4ade80', 12, 160); },
    miniStrike: p => { burst(p.x, p.y, '#fbbf24', 10, 150); ring(p.x, p.y, 6, 70, '#fbbf24', 0.3, 3); },
    flareScan: p => { for (let i = 0; i < 18; i++) particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 80, vy: -200 - Math.random() * 200, life: 0.9, maxLife: 0.9, color: Math.random() < 0.5 ? '#fde68a' : '#fff7ed', size: 3, glow: true, drag: 0.95 }); },
    mineField: p => { smoke(p.x, p.y, 6, 'rgba(120,100,80,0.4)', 16); burst(p.x, p.y, '#a16207', 10, 120); },
    smokeLine: p => { burst(p.x, p.y, '#cbd5e1', 14, 200, 0.6, 4); },
    supplyDrop: p => { ring(p.x, p.y, 8, 80, '#93c5fd', 0.4, 4); burst(p.x, p.y, '#bfdbfe', 12, 160); }
};
const _castSpell37 = castSpell;
castSpell = function (p, i) {
    const s = p && p.spells && p.spells[i], ready = s && s.cd <= 0, o = p ? { x: p.x, y: p.y } : null;
    const r = _castSpell37(p, i);
    if (ready && s.cd > 0) {
        const fxf = SPELL_FX[s.id];
        if (targetableLocal(p) && canSee(p.x, p.y, 40)) { castFx(p, '#fde68a', false); if (fxf) try { fxf(p, o); } catch (e) {} }
    }
    return r;
};

/* ============================== BUFF THÊM: Khởi Đầu Gấp Đôi · Song Phép · Nhiều Lựa Chọn ============================== */
ADVANTAGES.doubleUp.desc = 'HAI lần nâng cấp đầu tiên, mỗi lần được chọn 2 thẻ (tổng cộng thêm 2 thẻ). +25 máu tối đa.';
ADVANTAGES.twoSpells.desc = 'Được 2 phép bổ trợ thay vì 1 (có thêm Túi Phép thì 3). Phép hồi chiêu nhanh hơn 25%; dùng 1 phép thì các phép còn lại hồi ngay 4 giây.';
ADVANTAGES.manyChoices.desc = 'Mỗi lần nâng cấp có thêm 1 lá, luôn có 1 lá hợp với bạn (may mắn thì 2). Mỗi lần nâng cấp đã qua: +10 máu tối đa và +4% sát thương (tối đa 5 lần: +50 máu, +20%).';
const _spellCd38 = spellCd;
spellCd = function (p, id) { return _spellCd38(p, id) * (p && p.adv === 'twoSpells' ? 0.75 : 1); };
const _castSpell38 = castSpell;
castSpell = function (p, i) {
    const s = p && p.spells && p.spells[i], ready = s && s.cd <= 0;
    const r = _castSpell38(p, i);
    if (ready && s.cd > 0 && p.adv === 'twoSpells') p.spells.forEach((q, k) => { if (k !== i && q.cd > 0) q.cd = Math.max(0, q.cd - 4); });
    return r;
};
const manyN = () => Math.min(5, typeof pickCount === 'number' ? pickCount : 0);
const _applyBuild38 = applyBuild;
applyBuild = function (p) { _applyBuild38(p); if (p.adv === 'manyChoices') { const n = manyN(); p.maxHp += 10 * n; p.hp = Math.min(p.maxHp, p.hp + 10 * n); } };
const _dealDamage38 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const a = attackerId >= 0 && players.find(q => q.id === attackerId);
    if (a && a.adv === 'manyChoices' && a !== target) dmg *= 1 + 0.04 * manyN();
    return _dealDamage38(target, dmg, attackerId, opts);
};

/* ============================== BẬC THẦY VŨ KHÍ: đủ 3 kỹ năng, không chọn nâng cấp nữa ============================== */
const WM_CARDS = ['meleeTech', 'gunMod', 'hightech'];
ADVANTAGES.weaponMaster.desc = 'Có sẵn đủ 3 KỸ NĂNG: Kỹ Thuật Cận Chiến + Trang Bị Phụ + Kỹ Thuật Cao (3 ô kỹ năng). Kỹ năng Bậc Thầy của vũ khí ở TAY KIA vẫn dùng được (tự rút ra dùng rồi cất lại). Nội tại ĐỔI VŨ KHÍ: mỗi lần đổi vũ khí tung Đòn Rút Vũ Khí (cận chiến chém vòng cung tốn 3 độ bền · súng bắn nhanh 2 phát tốn 2 viên). Dùng được mọi vũ khí, +10% tốc chạy, +15% sát thương. Bù lại: KHÔNG BAO GIỜ được chọn nâng cấp.';
const _applyBuild39 = applyBuild;
applyBuild = function (p) {
    if (p && p.adv === 'weaponMaster') { p.build = (p.build || []).filter(id => WM_CARDS.includes(id) || (CARDS[id] && CARDS[id].kind !== 'S')); WM_CARDS.forEach(c => { if (!p.build.includes(c)) p.build.push(c); }); }
    return _applyBuild39(p);
};
const _skipsPick39 = skipsPick;
skipsPick = function (p) { return (!!p && p.adv === 'weaponMaster') || _skipsPick39(p); };
