/** ==================== LỢI THẾ TÙY HỨNG · TẦM NHÌN LỘ BẪY / THÙNG GIẢ / TÀNG HÌNH · BỔ SUNG KỸ THUẬT CAO CẤP ====================
 *  Nạp sau tactical2.js.
 */

/* ============================== LỢI THẾ: TÙY HỨNG (gacha kỹ năng) ============================== */
ADVANTAGES.whim = { icon: '🎰', name: 'Tùy Hứng', desc: 'Luôn có 3 ô kỹ năng NGẪU NHIÊN (có thể ra bản tiến hoá). Dùng xong một kỹ năng, ô đó tự quay gacha ra kỹ năng mới. Hồi chiêu cố định 12 giây, mỗi hòm bạn nhặt giảm 0.25 giây. Bù lại: mất lần nâng cấp đầu và không được chọn thẻ kỹ năng khi nâng cấp.' };
ADV_IDS.push('whim');
const WHIM_BAN = ['meleeTech', 'gunMod']; // cần đúng loại vũ khí → dễ ra ô chết
function whimPool() { return Object.keys(CARDS).filter(id => CARDS[id].kind === 'S' && !CARDS[id].evo && !CARDS[id].masterOnly && !WHIM_BAN.includes(id)); }
function whimEvoPool() { return Object.keys(CARDS).filter(id => CARDS[id].kind === 'S' && CARDS[id].evo); }
function whimRoll(p, avoid) {
    const evo = whimEvoPool(), useEvo = evo.length && Math.random() < 0.2; // 20%: ra bản đã nâng cấp (tiến hoá)
    const pool = (useEvo ? evo : whimPool()).filter(id => !avoid.includes(id));
    return pool[Math.floor(Math.random() * pool.length)] || 'dash';
}
function whimCd(p) { return Math.max(3, 12 - 0.25 * ((p.stats && p.stats.crates) || 0)); }
const _skipsPick19 = skipsPick;
skipsPick = function (p) { return _skipsPick19(p) || (!!p && p.adv === 'whim' && pickCount === 0); };
const _cardsForPick19 = cardsForPick;
cardsForPick = function (p, kind, n) {
    if (kind !== 'build' || !p || p.adv !== 'whim') return _cardsForPick19(p, kind, n);
    let out = _cardsForPick19(p, kind, n + 4).filter(id => CARDS[id] && CARDS[id].kind !== 'S');
    if (out.length < n) { const own = new Set(p.build.concat(out)), rest = Object.keys(CARDS).filter(id => CARDS[id].kind === 'P' && !own.has(id) && !CARDS[id].evo && !CARDS[id].masterOnly); while (out.length < n && rest.length) out.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]); }
    return out.slice(0, n);
};
const _applyBuild19 = applyBuild;
applyBuild = function (p) {
    _applyBuild19(p);
    if (p.adv !== 'whim') return;
    const ids = []; for (let i = 0; i < 3; i++) ids.push(whimRoll(p, ids));
    p.skills = ids.map(id => ({ id, cd: 0 }));
};
const _skillCd19 = skillCooldown;
skillCooldown = function (p, id) { return p && p.adv === 'whim' ? whimCd(p) : _skillCd19(p, id); };
const _castSkill19 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p && p.skills && p.skills[slot], ready = s && s.cd <= 0, id0 = s && s.id;
    const r = _castSkill19(p, slot, aimVec);
    if (p.adv === 'whim' && ready && s.cd > 0 && s.id === id0 && gameState === 'PLAYING') { // vừa dùng xong → quay gacha
        s.id = whimRoll(p, p.skills.map(q => q.id)); s.cd = whimCd(p);
        const c = CARDS[s.id]; floatText(p.x, p.y - 50, `🎰 ${c.icon} ${c.name}${c.evo ? ' ✦' : ''}`, c.evo ? '#f0abfc' : '#fde68a', 13);
    }
    return r;
};

/* ============================== TẦM NHÌN CHUẨN: lộ rõ bẫy, thùng giả, địch tàng hình ==============================
 *  Nguồn tầm nhìn chuẩn: thẻ tầm nhìn (quanh bạn), Ưng Trạm, Drone, Drone Trinh Sát, Pháo Sáng, UAV, Radar, nón đèn pin.
 *  Trong vùng nguồn → thấy RÕ (có nhãn cảnh báo). Người thường chỉ thấy dấu hiệu MỜ khi đứng rất gần. */
function detectRadius(v, forEnemy = true) {
    if (!v || v.hp <= 0) return 0;
    let r = 0; const still = (v.stillT || 0) >= 0.8;
    if (has(v, 'thermal')) r = Math.max(r, combo(v, 'chemSight') ? 380 : 260);
    if (has(v, 'sixthSense')) r = Math.max(r, 220);
    if (has(v, 'nightVision')) r = Math.max(r, 190);
    if (!forEnemy && has(v, 'controlEye')) r = Math.max(r, 200); // Mắt Kiểm Soát: chỉ lộ bẫy
    if (has(v, 'sonar')) r = Math.max(r, 200);
    if (has(v, 'catEye')) r = Math.max(r, 170);
    if (has(v, 'eagle')) r = Math.max(r, 150);
    if (has(v, 'periscope') && still) r = Math.max(r, 340);
    if (has(v, 'watchman') && still) r = Math.max(r, 240);
    return r;
}
const sameSide = (v, ownerId) => { if (ownerId === v.id) return true; const o = players.find(q => q.id === ownerId); return !!o && sameTeam(v, o); };
let _vsCache = { t: -1, id: null, list: [] };
function visionSources(v) {
    if (!v) return [];
    if (_vsCache.t === world.time && _vsCache.id === v.id) return _vsCache.list;
    const out = [], r = detectRadius(v, true), rt = detectRadius(v, false);
    if (r) out.push({ x: v.x, y: v.y, r, kind: 'self' });
    if (rt > r) out.push({ x: v.x, y: v.y, r: rt, kind: 'self', trapOnly: true });
    if (v.st && v.st.radarT > 0) out.push({ x: v.x, y: v.y, r: RADAR_R, kind: 'radar' }); // Radar: xuyên tường
    decoys.forEach(d => {
        if (!(d.hp > 0) || !sameSide(v, d.owner)) return;
        const o = players.find(q => q.id === d.owner);
        if (d.kind === 'ward') out.push({ x: d.x, y: d.y, r: o && combo(o, 'skyEye') ? 450 : 300, kind: 'ward' });
        else if (d.kind === 'drone') out.push({ x: d.x, y: d.y, r: 260, kind: 'drone' });
        else if (smKind(d.label) === 'rdrone') out.push({ x: d.x, y: d.y, r: 220, kind: 'drone' });
    });
    zones.forEach(z => { if (z.type === 'flareLight' && sameSide(v, z.owner) && z.t > 0) out.push({ x: z.x, y: z.y, r: z.r, kind: 'flare' }); });
    _vsCache = { t: world.time, id: v.id, list: out };
    return out;
}
function inBeam(v, x, y) {
    if (!(has(v, 'wideLens') || has(v, 'focusBeam'))) return false;
    const d = dist(v.x, v.y, x, y), L = has(v, 'focusBeam') ? 520 : 400, half = has(v, 'wideLens') ? 0.6 : 0.35;
    return d < L && Math.abs(angleDiff(Math.atan2(y - v.y, x - v.x), v.angle)) < half && lineOfSight(v.x, v.y, x, y);
}
/** Có nguồn tầm nhìn chuẩn nào nhìn rõ điểm này không */
const RADAR_R = 650;
function detects(v, x, y, trap) {
    if (!v || v.hp <= 0) return false;
    return visionSources(v).some(s => (trap || !s.trapOnly) && dist(s.x, s.y, x, y) < s.r && (s.kind !== 'self' || lineOfSight(v.x, v.y, x, y))) || inBeam(v, x, y);
}
const _targetable19 = targetable;
targetable = function (viewer, t) {
    if (_targetable19(viewer, t)) return true;
    if (!viewer || !t || t.hp <= 0 || viewer === t || viewer.x === undefined || viewer.hp === undefined) return false;
    return detects(viewer, t.x, t.y);
};
// host gắn "lộ" để máy khách và sương mù cũng thấy (Ưng Trạm / drone nay lộ cả địch tàng hình)
const _upe19 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe19(dt);
    if (gameState !== 'PLAYING') return;
    players.forEach(v => {
        if (v.hp <= 0) return;
        if (!visionSources(v).length && !has(v, 'wideLens') && !has(v, 'focusBeam')) return;
        enemiesOf(v).forEach(e => { if ((e.st.invis > 0 || inSmoke(e.x, e.y) || inBush(e.x, e.y)) && detects(v, e.x, e.y)) spotFor(e, v.id, 0.3); });
    });
};
const enemyOwned = (me, id) => id !== me.id && !sameSide(me, id);
const FAINT_R = 150; // người thường: đứng rất gần mới thấy dấu hiệu mờ
const _drawMines19 = drawMines;
drawMines = function (now) {
    _drawMines19(now);
    const me = localPlayer(); if (!me || me.hp <= 0) return;
    const tag = (x, y, r, label, col) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -now * 20;
        ctx.globalAlpha = 0.75 + Math.sin(now * 6) * 0.2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(label).width + 10; ctx.fillStyle = 'rgba(15,10,20,0.8)'; rrect(ctx, x - tw / 2, y - r - 17, tw, 14, 6); ctx.fill();
        ctx.fillStyle = col; ctx.fillText(label, x, y - r - 10); ctx.restore();
    };
    const faint = (x, y, r, col) => { ctx.save(); ctx.globalAlpha = 0.14 + Math.max(0, Math.sin(now * 3 + x)) * 0.14; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
    mines.forEach(m => {
        if (!enemyOwned(me, m.owner)) return;
        if (detects(me, m.x, m.y, true)) {
            ctx.save(); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + now; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * 6, m.y + Math.sin(a) * 6); ctx.lineTo(m.x + Math.cos(a) * 14, m.y + Math.sin(a) * 14); ctx.stroke(); }
            ctx.restore(); tag(m.x, m.y, 20, '⚠ BẪY', '#f87171');
        } else if (dist(me.x, me.y, m.x, m.y) < FAINT_R && canSee(m.x, m.y, 4)) faint(m.x, m.y, 11, '#fca5a5'); // chỉ thấy mờ mờ
    });
    crates.forEach(c => {
        const bad = c.type === 'TRAP' || (c.type === 'FAKE' && enemyOwned(me, c.owner)); if (!bad) return;
        const r = (c.size || 28) * 0.8;
        if (detects(me, c.x, c.y, true)) tag(c.x, c.y, r, c.type === 'TRAP' ? '💣 HÒM BẪY' : '🎭 THÙNG GIẢ', c.type === 'TRAP' ? '#fb923c' : '#f472b6');
        else if (dist(me.x, me.y, c.x, c.y) < FAINT_R + 30 && canSee(c.x, c.y, 4)) faint(c.x, c.y, r, '#fca5a5');
    });
    // vùng nhìn của Ưng Trạm / drone / pháo sáng: viền mảnh để biết chỗ nào đang được soi rõ
    visionSources(me).forEach(s => { if (s.kind === 'self' || s.kind === 'radar') return; ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); });
};
// địch tàng hình: nguồn tầm nhìn chuẩn → viền rõ; người thường đứng gần → chỉ thấy gợn méo mờ
const _drawPlayer19 = drawPlayer;
drawPlayer = function (p, now) {
    _drawPlayer19(p, now);
    const me = localPlayer();
    if (!me || p === me || p.hp <= 0 || !(p.st && p.st.invis > 0) || sameTeam(me, p)) return;
    ctx.save();
    if (detects(me, p.x, p.y)) { ctx.strokeStyle = `rgba(244,114,182,${0.6 + Math.sin(now * 8) * 0.3})`; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 7, 0, Math.PI * 2); ctx.stroke(); }
    else if (dist(me.x, me.y, p.x, p.y) < FAINT_R + 50 && canSee(p.x, p.y, p.radius)) { ctx.globalAlpha = 0.12 + Math.max(0, Math.sin(now * 5)) * 0.12; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x + Math.sin(now * 7 + i) * 2, p.y + Math.cos(now * 6 + i) * 2, p.radius - 2 + i * 3, 0, Math.PI * 2); ctx.stroke(); } }
    ctx.restore();
};
const VISION_NOTE = '<br><b>Phát hiện:</b> lộ bẫy, hòm bẫy, thùng giả và địch tàng hình trong bán kính ';
[['thermal', '260 (Kính Hoá Học: 380)'], ['sixthSense', '220'], ['nightVision', '190'], ['sonar', '200'], ['catEye', '170'], ['eagle', '150'], ['periscope', '340 khi đứng yên'], ['watchman', '240 khi đứng yên']]
    .forEach(([id, r]) => { if (CARDS[id]) CARDS[id].desc += VISION_NOTE + r + '.'; });
['wideLens', 'focusBeam'].forEach(id => { if (CARDS[id]) CARDS[id].desc += '<br><b>Phát hiện:</b> nón đèn pin soi ra bẫy, hòm bẫy, thùng giả và địch tàng hình.'; });
if (CARDS.controlEye) CARDS.controlEye.desc += '<br><b>Phát hiện bẫy:</b> lộ bẫy, hòm bẫy, thùng giả trong bán kính 200 (không lộ địch tàng hình).';
if (SPELLS.radar) SPELLS.radar.desc = 'Trong 5 giây: TẦM NHÌN CHUẨN bán kính 650 quanh bạn — soi sáng toàn bộ khu vực, xuyên tường và sương mù; lộ mọi địch (kể cả trong bụi, khói, tàng hình), bẫy, hòm bẫy và thùng giả.';
if (SPELLS.flareScan) SPELLS.flareScan.desc += ' Vùng sáng lộ rõ bẫy, thùng giả và địch tàng hình.';
['elsu', 'scout', 'droneRecon', 'uavScan'].forEach(id => { if (CARDS[id]) CARDS[id].desc += '<br><b>Tầm nhìn chuẩn:</b> trong vùng nhìn thấy rõ bẫy, hòm bẫy, thùng giả và địch tàng hình.'; });

/* ============================== KỸ THUẬT CAO CẤP: đủ kỹ năng cho mọi vũ khí ============================== */
// Trang Bị Phụ dùng được với vũ khí ném (Lựu đạn, Lựu Đạn Điện Từ)
const _castSkill19b = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p && p.skills && p.skills[slot], w = s && s.id === 'gunMod' && getCurrentWeapon(p);
    if (w && w.type === 'THROWABLE') { w.type = 'GUN'; try { return _castSkill19b(p, slot, aimVec); } finally { w.type = 'THROWABLE'; } }
    return _castSkill19b(p, slot, aimVec);
};
const throwG = (p, a, n, spread, blast, vel = 800) => { for (let i = 0; i < n; i++) { const o = n > 1 ? (i / (n - 1) - 0.5) * spread : 0; items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(a + o) * vel, vy: Math.sin(a + o) * vel, thrown: true, ownerId: p.id, fuse: 1.0, z: 0, vz: 260, blast }); } };
const GUNMOD_EXTRA = {
    SPISTOL:   ['🔇 ĐẠN XUYÊN GIẢM THANH', p => { const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a); [0, 0.12].forEach(t => p.shotQueue.push({ t, fn: () => { if (p.hp > 0) spawnBullet(p, m.x, m.y, a, { speed: 30, damage: 38, range: 700, color: '#cbd5e1', size: 3, pierce: true, trail: 50 }); } })); p.st.invis = Math.max(p.st.invis || 0, 1.2); }],
    SAR:       ['🌫 LỰU KHÓI DƯỚI NÒNG', p => { const a = aimDir(p), x = p.x + Math.cos(a) * 300, y = p.y + Math.sin(a) * 300; zones.push({ type: 'smoke', x, y, r: 130, t: 6, maxT: 6, owner: p.id, tick: 0 }); smoke(x, y, 12, 'rgba(180,190,210,0.5)', 26); p.st.invis = Math.max(p.st.invis || 0, 1); }],
    GRENADE:   ['💥 LỰU ĐẠN CHÙM', p => throwG(p, aimDir(p), 3, 0.6, [80, 140])],
    EMPGREN:   ['⚡ ĐIỆN TỪ LAN', p => { const a = aimDir(p), x = p.x + Math.cos(a) * 260, y = p.y + Math.sin(a) * 260; zones.push({ type: 'emp', x, y, r: 190, t: 3, maxT: 3, owner: p.id, tick: 0 }); ring(x, y, 10, 190, '#38bdf8', 0.5, 5); AudioSys.playAt('rail', x, y, 0.4); }],
    AIRCALL:   ['🛩 GỌI CHI VIỆN', p => { const a = aimDir(p); planeStrike(p, a, p.x + Math.cos(a) * 250, p.y + Math.sin(a) * 250, { from: 0, to: 350, gap: 90, dmg: 45, R: 80, warn: 0.8, label: '🛩 CHI VIỆN NHANH' }); }],
    BOMBTAB:   ['💣 BOM CẦM TAY', p => throwG(p, aimDir(p), 2, 0.4, [90, 150])],
    LASERDES:  ['🔴 TIA CHỈ ĐIỂM', p => { const a = aimDir(p); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 900 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.3) { spotFor(e, p.id, 5); e.painted = { by: p.id, t: world.time + 5 }; } }); beams.push({ x1: p.x, y1: p.y, x2: p.x + Math.cos(a) * 900, y2: p.y + Math.sin(a) * 900, life: 0.4, maxLife: 0.4, color: '#f43f5e' }); }],
    SMOKETAB:  ['🌫 KHÓI TẠI CHỖ', p => { zones.push({ type: 'smoke', x: p.x, y: p.y, r: 150, t: 7, maxT: 7, owner: p.id, tick: 0 }); smoke(p.x, p.y, 14, 'rgba(180,190,210,0.5)', 26); p.st.invis = Math.max(p.st.invis || 0, 1.5); }],
    ORBITAB:   ['☄ XUNG VỆ TINH', p => { const a = aimDir(p), x = p.x + Math.cos(a) * 320, y = p.y + Math.sin(a) * 320; zones.push({ type: 'artyWarn', x, y, r: 100, t: 0.7, maxT: 0.7, owner: p.id, tick: 0 }); dropBomb(p, x, y, 70, 100, 0.7); }],
    MARKBOMB:  ['🎯 NẠP THÊM 1 BOM', p => { const w = getCurrentWeapon(p); w.mag = Math.min(w.magSize, w.mag + 1); }],
    MARKPARA:  ['🪖 LÍNH HỘ TỐNG', p => { const d = summon(p, 'para', p.x - Math.cos(p.angle) * 40, p.y - Math.sin(p.angle) * 40); d.home = null; }],
    GUIDEBOMB: ['🧭 NẠP 50 ĐIỆN LƯỢNG', p => { const w = getCurrentWeapon(p); w.mag = Math.min(w.magSize, w.mag + 50); }]
};
const _gunModCast19 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), X = GUNMOD_EXTRA[w.id];
    if (!X) return _gunModCast19(p);
    X[1](p); floatText(p.x, p.y - 36, X[0], '#fde68a', 14);
};
// Song Đao: không có địch sát bên → ném quạt 6 phi đao
const _meleeTechCast19 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    const near = w.id === 'DAGGERS' && enemiesOf(p).some(q => dist(p.x, p.y, q.x, q.y) < 240);
    const r = _meleeTechCast19(p);
    if (w.id === 'DAGGERS' && !near) {
        const a = aimDir(p), m = muzzle(p, w, a);
        for (let i = 0; i < 6; i++) spawnBullet(p, m.x, m.y, a + (i / 5 - 0.5) * 0.9, { speed: 20, damage: 14 * (p.meleeMult || 1), range: 380, color: '#e9d5ff', size: 3.5, trail: 24 });
        floatText(p.x, p.y - 36, '🗡 PHI ĐAO QUẠT', '#e9d5ff', 15);
    }
    return r;
};
CARDS.gunMod.desc += '<br>Thêm: Lục Giảm Thanh = đạn xuyên giảm thanh · AR Giảm Thanh = lựu khói · Lựu đạn = lựu chùm · Lựu Đạn Điện Từ = điện từ lan · mọi vũ khí gọi hoả lực đều có phụ kiện riêng.';


/* ============================== SƯƠNG MÙ: Radar soi sáng xuyên tường · nguồn tầm nhìn soi sáng ============================== */
const _canSee20 = canSee;
canSee = function (x, y, pad = 0) {
    const me = localPlayer();
    if (me && me.hp > 0 && me.st && me.st.radarT > 0 && dist(me.x, me.y, x, y) < RADAR_R + pad) return true;
    if (me && me.hp > 0 && visionSources(me).some(s => (s.kind === 'drone' || s.kind === 'flare') && dist(s.x, s.y, x, y) < s.r + pad && lineOfSight(s.x, s.y, x, y))) return true;
    return _canSee20(x, y, pad);
};
drawFogOfWar = function (zoom) {
    const me = localPlayer(), W = SCREEN_W, H = SCREEN_H;
    const fw = Math.max(1, Math.ceil(W * FOG_RES)), fh = Math.max(1, Math.ceil(H * FOG_RES));
    if (fogSmall.width !== fw || fogSmall.height !== fh) { fogSmall.width = fw; fogSmall.height = fh; }
    const c = fogSmallCtx;
    c.setTransform(FOG_RES, 0, 0, FOG_RES, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.clearRect(0, 0, W, H);
    if (me.hp <= 0) return;
    c.fillStyle = 'rgba(2, 3, 8, 0.955)'; c.fillRect(0, 0, W, H);
    const sx = x => (x - camera.x) * zoom + W / 2, sy = y => (y - camera.y) * zoom + H / 2;
    c.globalCompositeOperation = 'destination-out';
    if (FOG_BLUR) c.filter = `blur(${Math.max(1.5, 14 * zoom * FOG_RES).toFixed(1)}px)`;
    const cut = (px, py, Rf, near, Rmax) => {
        const pts = visPolyFn(px, py, Rf, Rmax);
        const g = c.createRadialGradient(sx(px), sy(py), 0, sx(px), sy(py), Rmax * zoom);
        if (Rmax <= near * 1.05) { g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,1)'); g.addColorStop(0.85, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
        else {
            const k = near / Rmax;
            g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(k * 0.7, 'rgba(0,0,0,1)');
            g.addColorStop(Math.min(0.6, k * 1.1), 'rgba(0,0,0,0.9)'); // đèn pin: sáng đều rồi tắt dần ở cuối
            g.addColorStop(0.75, 'rgba(0,0,0,0.72)'); g.addColorStop(0.92, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        }
        c.fillStyle = g; c.beginPath();
        for (let i = 0; i < pts.length; i += 2) { const X = sx(pts[i]), Y = sy(pts[i + 1]); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
        c.closePath(); c.fill();
    };
    const coneCut = q => { const near = nearRadius(q); let Rmax = near; for (let a = -Math.PI; a < Math.PI; a += 0.05) Rmax = Math.max(Rmax, visionAt(q, a)); cut(q.x, q.y, a => visionAt(q, a), near, Rmax); };
    coneCut(me);
    players.forEach(q => { if (q.hp > 0 && q !== me && sameTeam(me, q)) coneCut(q); });
    myWards(me).forEach(d => cut(d.x, d.y, () => 300, 300, 300));
    // Radar: soi sáng toàn bộ vùng 650 quanh bạn, xuyên tường
    if (me.st && me.st.radarT > 0) { const g = c.createRadialGradient(sx(me.x), sy(me.y), 0, sx(me.x), sy(me.y), RADAR_R * zoom); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.8, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(sx(me.x), sy(me.y), RADAR_R * zoom, 0, Math.PI * 2); c.fill(); }
    // drone / drone trinh sát / pháo sáng của bạn cũng soi sáng
    visionSources(me).forEach(s => { if (s.kind === 'drone' || s.kind === 'flare') cut(s.x, s.y, () => s.r, s.r, s.r); });
    // ánh lửa / vụ nổ lớn hắt sáng vùng xung quanh
    particles.forEach(pt => { if (!pt.glow || pt.size < 20) return; c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(sx(pt.x), sy(pt.y), pt.size * 1.6 * zoom, 0, Math.PI * 2); c.fill(); });
    c.filter = 'none';
    ctx.save();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fogSmall, 0, 0, fw / FOG_RES, fh / FOG_RES);
    ctx.restore();
};

/* ============================== KHÓI: ai đứng trong khói (kể cả bạn) chỉ nhìn thấy sát bên mình ============================== */
const SMOKE_SIGHT = 115;
const inMySmoke = v => !!(v && v.x !== undefined && inSmoke(v.x, v.y) && !(v.st && v.st.radarT > 0));
const _visionAt20 = visionAt;
visionAt = function (v, ang) { const r = _visionAt20(v, ang); return inMySmoke(v) ? Math.min(r, SMOKE_SIGHT) : r; };
const _nearRadius20 = nearRadius;
nearRadius = function (v) { const r = _nearRadius20(v); return inMySmoke(v) ? Math.min(r, SMOKE_SIGHT) : r; };
const _visionRange20 = visionRange;
visionRange = function (viewer) { const v = viewer || localPlayer(), r = _visionRange20(viewer); return inMySmoke(v) ? Math.min(r, SMOKE_SIGHT) : r; };

/* ============================== THẺ: KHÓI CÁCH ÂM ============================== */
defP('silentSmoke', '🔇', 'Khói Cách Âm', 'Khi đứng trong khói (bất kỳ khói nào), bạn không phát ra âm thanh: không tiếng bước chân, tiếng súng, tiếng chém, không dấu chân — địch không nghe/thấy gợn âm.', p => {});
COMBOS.push({ id: 'ghostFog', a: 'silentSmoke', b: 'silent', name: 'Bóng Ma Trong Sương', desc: 'Trong khói được tăng tốc (+50% tốc chạy). Ra khỏi khói vẫn im lặng thêm 3 giây.' });
['silentSmoke', 'silent'].forEach(id => (COMBOS_OF[id] = COMBOS_OF[id] || []).push(COMBOS[COMBOS.length - 1]));
function smokeMuted(p) { return !!p && p.hp > 0 && has(p, 'silentSmoke') && (inSmoke(p.x, p.y) || (combo(p, 'ghostFog') && (p.fogQuietT || 0) > world.time)); }
const _applyBuild20 = applyBuild;
applyBuild = function (p) { _applyBuild20(p); p.silent0 = !!p.silent; p.fogQuietT = 0; };
const _upe20 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe20(dt);
    players.forEach(p => {
        if (!has(p, 'silentSmoke')) return;
        const inS = inSmoke(p.x, p.y);
        if (inS && combo(p, 'ghostFog')) { p.fogQuietT = world.time + 3; p.st.haste = Math.max(p.st.haste || 0, 0.15); }
        p.silent = (p.silent0 !== undefined ? p.silent0 : false) || smokeMuted(p); // không dấu chân / tiếng bước
    });
};
// âm thanh phát ra từ người đang được Khói Cách Âm che: người khác không nghe thấy
const _playAt20 = AudioSys.playAt.bind(AudioSys);
AudioSys.playAt = function (type, x, y, vol, range) {
    const me = localPlayer();
    const src = players.find(q => q.hp > 0 && q !== me && dist(q.x, q.y, x, y) < 50 && smokeMuted(q));
    if (src && !(me && sameTeam(me, src))) return;
    return _playAt20(type, x, y, vol, range);
};
