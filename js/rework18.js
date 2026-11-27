/** ==================== REWORK 18 — GẮN ÂM THANH NHÓM C ====================
 *  17 âm mới (xem AUDIO_MOI.md): laser, teleport, zap, ground, clang, glass, ricochet, sniper, cannon, magic, spell,
 *  whip, freeze, heal, shield, shield_up, throw.
 *  Cách gắn: một lớp ĐỔI TÊN ÂM THEO NGỮ CẢNH bọc AudioSys.playAt / AudioSys.play — biết âm đang phát thuộc vũ khí /
 *  mould Vạn Tượng / kỹ năng / phép nào (ngăn xếp SND_CTX18), nếu không có thì đoán theo người đứng tại chỗ phát âm.
 *  Cộng thêm vài âm phát kèm (tiếng nổ đầu roi, đạn nảy tường, đóng băng, ném vũ khí, phép hồi máu / khiên / dịch chuyển).
 *  Âm mới chưa nạp được (thiếu file) → giữ âm cũ, không bị câm.
 */
const SND_CTX18 = [];
const SND_MAP18 = {
    // ---- theo vũ khí đang ra đòn ----
    SNIPER: { shoot_heavy: 'sniper' },
    MUSKET: { shoot_heavy: 'cannon', explosion: 'cannon' }, ROCKET: { shoot_heavy: 'cannon' }, LAUNCHER: { shoot_heavy: 'cannon' }, AXECANNON: { shoot_heavy: 'cannon' },
    RAILGUN: { rail: 'laser' }, LASERDES: { rail: 'laser' }, ORBITAB: { rail: 'laser' },
    TESLA: { rail: 'zap', smg: 'zap', shoot: 'zap' }, EWHIP: { rail: 'zap' }, EMPGREN: { rail: 'zap' },
    ICEGUN: { smg: 'freeze', shoot: 'freeze', rail: 'freeze' },
    HAMMER: { slam: 'ground' }, GREATSWORD: { slam: 'ground' }, AXE: { slam: 'ground' },
    DARTS: { whoosh: 'throw' }, SHURIKEN: { whoosh: 'throw' }, BOMB: { whoosh: 'throw' }, FIREBOMBW: { whoosh: 'throw' }, GRENADE: { whoosh: 'throw' },
    SHIELD: { block: 'shield' }, ROUNDSHIELD: { block: 'shield' },
    LIGHTSABER: { block: 'clang' }, KATANA: { block: 'clang' },
    // ---- theo mould Vạn Tượng ----
    'VT:laser': { rail: 'laser' }, 'VT:beam': { rail: 'laser' }, 'VT:marker': { rail: 'laser' }, 'VT:thunder': { rail: 'zap', swing: 'zap' },
    'VT:cannon': { shoot_heavy: 'cannon' }, 'VT:frost': { rail: 'freeze', block: 'freeze' }, 'VT:steel': { slam: 'ground' },
    'VT:esword': { block: 'clang' }, 'VT:eshield': { block: 'shield' }, 'VT:egun': { shoot_heavy: 'sniper' },
    // ---- theo kỹ năng / phép ----
    'S:blink': { '*': 'teleport' }, 'S:portal': { '*': 'teleport' }, 'S:portalSPS': { '*': 'teleport' }, 'SP:flash': { '*': 'teleport' },
    'S:heal': { '*': 'heal' }, 'S:beacon': { '*': 'heal' }, 'S:healDrone': { '*': 'heal' }, 'SP:heal': { '*': 'heal' },
    'S:shieldS': { '*': 'shield_up' }, 'S:roboShield': { '*': 'shield_up' },
    skill: { legend: 'magic', trick: 'spell' },
    // ---- theo hàm ----
    land: { slam: 'ground' }, laser: { rail: 'laser' }, zap: { rail: 'zap' }, glass: { block: 'glass' }, throwW: { whoosh: 'throw', swing: 'throw' }
};
// kỹ năng/phép: nếu trong lúc dùng không phát âm nào → phát âm này
const SND_ENSURE18 = { 'S:blink': 'teleport', 'S:portal': 'teleport', 'S:portalSPS': 'teleport', 'SP:flash': 'teleport', 'S:heal': 'heal', 'S:beacon': 'heal', 'S:healDrone': 'heal', 'SP:heal': 'heal', 'S:shieldS': 'shield_up', 'S:roboShield': 'shield_up' };
Object.assign(SFX_GAP, { zap: 0.07, freeze: 0.25, whip: 0.05, throw: 0.05, ricochet: 0.07, clang: 0.06, shield: 0.06, laser: 0.12, ground: 0.08, teleport: 0.1, heal: 0.3, shield_up: 0.3, glass: 0.05 });
Object.assign(SFX_VOL, { sniper: 1.1, cannon: 1.2, laser: 0.9, zap: 0.7, freeze: 0.7, whip: 0.9, throw: 0.7, ricochet: 0.6, clang: 0.85, shield: 0.85, ground: 1.1, glass: 0.9, teleport: 0.8, heal: 0.8, shield_up: 0.8, magic: 0.9, spell: 0.8 });

const sndHas18 = t => !!(typeof SND !== 'undefined' && SND.buf && SND.buf[t] && SND.buf[t].length);
function wKeys18(p) { const w = p && getCurrentWeapon(p); if (!w) return []; return w.id === 'VANTUONG' && w.mods ? ['VT:' + vtCur(w), w.id] : [w.id]; }
function sndMap18(type, x, y) {
    let keys = SND_CTX18.length ? SND_CTX18[SND_CTX18.length - 1] : null;
    if (!keys && x !== undefined) { // đoán theo người đứng đúng chỗ phát âm
        const p = players.find(q => q.hp > 0 && Math.abs(q.x - x) < 6 && Math.abs(q.y - y) < 6);
        if (p) keys = wKeys18(p);
        if (type === 'rail' && zones.some(z => (z.type === 'laserBeam2' || z.type === 'orbitalBeam2' || z.type === 'laser') && dist(z.x, z.y, x, y) < 120)) keys = ['laser'];
    }
    let out = type;
    if (keys) for (const k of keys) { const m = SND_MAP18[k]; if (m && (m[type] || m['*'])) { out = m[type] || m['*']; break; } }
    if (out === type && type === 'block' && x !== undefined) { // đỡ đạn: khiên → shield, cận chiến → clang
        const p = players.find(q => q.hp > 0 && dist(q.x, q.y, x, y) < q.radius + 45 && durWepR16(getCurrentWeapon(q)));
        if (p) out = ['SHIELD', 'ROUNDSHIELD'].includes(getCurrentWeapon(p).id) ? 'shield' : 'clang';
    }
    if (out !== type) { if (!sndHas18(out)) return type; if (SND_CTX18.length) SND_CTX18[SND_CTX18.length - 1].played = true; }
    return out;
}
const _playAtR18 = AudioSys.playAt, _playR18 = AudioSys.play;
AudioSys.playAt = function (type, x, y, vol, range) { return _playAtR18.call(this, sndMap18(type, x, y), x, y, vol, range); };
AudioSys.play = function (type, vol, pan) { return _playR18.call(this, SND_CTX18.length ? sndMap18(type) : type, vol, pan); };
function withSnd18(keys, fn, ensure, p) {
    keys.played = false; SND_CTX18.push(keys);
    try { return fn(); }
    finally { SND_CTX18.pop(); if (ensure && !keys.played && p && sndHas18(ensure)) AudioSys.playAt(ensure, p.x, p.y, 0.5); }
}

/* ---------- ngữ cảnh: đòn đánh, kỹ năng, phép ---------- */
const _fireWeaponR18 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) { return withSnd18(w ? (w.id === 'VANTUONG' && w.mods ? ['VT:' + vtCur(w), w.id] : [w.id]) : [], () => _fireWeaponR18(p, w, ang, charge, enemy)); };
const _castSkillR18 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], k = s ? 'S:' + s.id : 'skill';
    return withSnd18([k, ...wKeys18(p), 'skill'], () => _castSkillR18(p, slot, aimVec), s && s.cd <= 0 ? SND_ENSURE18[k] : null, p);
};
const _castSpellR18 = castSpell;
castSpell = function (p, i) {
    const s = p.spells && p.spells[i], k = s ? 'SP:' + s.id : 'skill';
    return withSnd18([k, 'skill'], () => _castSpellR18(p, i), s && s.cd <= 0 ? SND_ENSURE18[k] : null, p);
};
const _landEffectR18 = landEffect;
landEffect = function (p, kind, o) { return withSnd18(['land', ...wKeys18(p)], () => _landEffectR18(p, kind, o)); };
const _laserStrikeR18 = laserStrike;
laserStrike = function (p, a, b, opt) { return withSnd18(['laser'], () => _laserStrikeR18(p, a, b, opt)); };
const _orbitalStrikeR18 = orbitalStrike;
orbitalStrike = function (p, x, y) { return withSnd18(['laser'], () => _orbitalStrikeR18(p, x, y)); };
const _chainZapR18 = chainZap;
chainZap = function (p, from, dmg, n) { return withSnd18(['zap'], () => _chainZapR18(p, from, dmg, n), 'zap', from); };
const _fireShatterR18 = fireShatter;
fireShatter = function (f) { return withSnd18(['glass'], () => _fireShatterR18(f), 'glass', f); };
const _throwWeaponR18 = throwWeapon;
throwWeapon = function (p, wep, enemy) { return withSnd18(['throwW'], () => _throwWeaponR18(p, wep, enemy), 'throw', p); };
const _dinhThanR18 = dinhThan;
dinhThan = function (e, T, by) { return withSnd18(['skill'], () => _dinhThanR18(e, T, by)); };

/* ---------- âm phát kèm: nổ đầu roi · đạn nảy tường · đóng băng ---------- */
const whipQ18 = [];
const _upeR18 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR18(dt);
    const now = world.time;
    W2FX.forEach(f => { if (f.kind === 'whip' && !f._s18) { f._s18 = true; const o = players.find(q => q.id === f.owner); if (o) whipQ18.push({ t: now + f.maxT * 0.45, x: o.x + Math.cos(f.a) * f.len, y: o.y + Math.sin(f.a) * f.len }); } });
    for (let i = whipQ18.length - 1; i >= 0; i--) if (whipQ18[i].t <= now) { const q = whipQ18[i]; whipQ18.splice(i, 1); AudioSys.playAt('whip', q.x, q.y, 0.45); }
    players.forEach(p => { if ((p.frozenT || 0) > now && !p._frz18) { p._frz18 = true; AudioSys.playAt('freeze', p.x, p.y, 0.55); } else if (!((p.frozenT || 0) > now)) p._frz18 = false; });
};
const _updateBulletsR18 = updateBullets;
updateBullets = function (dt) {
    const snap = bullets.map(b => [b, b.bounces || 0]);
    const r = _updateBulletsR18(dt);
    for (const [b, n] of snap) if ((b.bounces || 0) < n && bullets.includes(b)) { AudioSys.playAt('ricochet', b.x, b.y, 0.3); break; }
    return r;
};
