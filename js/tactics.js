/** ==================== LỢI THẾ ĐẦU TRẬN · CHỌN PHÉP · PHÉP MỚI · CHÍ MẠNG & HEADSHOT · 20 THẺ MỚI · TIẾN HOÁ S-P-S ====================
 *  Nạp sau maps.js. Giống extra.js: bọc hàm cũ (gọi lại bản gốc) để ít đụng code cũ.
 */

/* ============================== TIỆN ÍCH ============================== */
/** Số phép bổ trợ: 1 · Song Phép +1 · Túi Phép +1 (tối đa 3) */
function spellCount(p) { return Math.min(3, 1 + (p.adv === 'twoSpells' ? 1 : 0) + ((p.build || []).includes('spellbook') ? 1 : 0)); }
function spellAim(p) { return p.aiming && p.aimAngle !== undefined ? p.aimAngle : p.angle; }
function cleanseNow(p) { p.stun = 0; Object.assign(p.st, { slow: 0, root: 0, silence: 0, glued: 0, burn: 0, blind: 0 }); }
const hasSpell = (p, id) => !!(p && p.spells && p.spells.some(s => s.id === id));

/* ============================== SÚNG LỤC MẠNH HƠN ============================== */
Object.assign(WEAPONS.PISTOL, { damage: 24, speed: 28, spread: 0.04, crit: 0.3, desc: 'Đạn bay nhanh, chính xác, 30% chí mạng' });
Object.assign(WEAPONS.SPISTOL, { damage: 17, speed: 32, crit: 0.25 });
WEAPONS.DUAL.crit = 0.1; WEAPONS.REVOLVER.crit = 0.15; WEAPONS.SNIPER.crit = 0.15;

/* ============================== PHÉP BỔ TRỢ: MÔ TẢ + 4 PHÉP MỚI ============================== */
Object.assign(SPELLS.flash, { desc: 'Dịch chuyển tức thời 200 theo hướng đang chạy.' });
Object.assign(SPELLS.heal, { desc: 'Hồi 25% máu tối đa và tăng tốc 1 giây.' });
Object.assign(SPELLS.cleanse, { desc: 'Gỡ mọi hiệu ứng xấu và MIỄN NHIỄM 3 giây: choáng, làm chậm, trói, câm lặng, keo, đốt, độc, mọi sát thương theo thời gian. Dùng được khi đang bị choáng.' });
Object.assign(SPELLS.sprint, { desc: 'Tăng tốc mạnh 3 giây, gỡ làm chậm.' });
Object.assign(SPELLS.execute, { desc: 'Bắn tia vào địch ít máu nhất trong 300: 30 + 20% máu đã mất (sát thương chuẩn).' });
Object.assign(SPELLS.stunS, { desc: 'Choáng 0.8 giây mọi địch trong bán kính 150.' });

Object.assign(SPELLS, {
    iceWall: { icon: '🧊', name: 'Tường Băng', cd: 30, desc: 'Dựng tường băng chắn đạn ngay trước mặt, vuông góc với hướng ngắm (5 giây, phá được).', cast: p => castIceWall(p) },
    missile: { icon: '🚀', name: 'Pháo Tên Lửa', cd: 35, desc: 'Bắn 1 quả tên lửa theo hướng ngắm. Bay càng xa sát thương càng lớn (tối đa ×3.2), nổ lan nhỏ khi chạm.', cast: p => fireMissile(p) },
    blind:   { icon: '💣', name: 'Bom Mù', cd: 35, desc: 'Ném bom khói về phía trước và tăng tốc 2.5 giây. Địch trong vùng nổ bị MÙ 3 giây (tầm nhìn -55%).', cast: p => castBlind(p) },
    radar:   { icon: '📡', name: 'Radar', cd: 40, desc: 'Trong 5 giây: lộ vị trí mọi địch trong bán kính 650 (kể cả trong bụi, khói, tàng hình) và tầm nhìn +20%.', cast: p => castRadar(p) }
});
SPELL_IDS.push('iceWall', 'missile', 'blind', 'radar');

/** Phối hợp phép: có cả 2 phép thì mạnh lên */
const SPELL_COMBOS = [
    { id: 'guided', a: 'radar', b: 'missile', name: 'Tên Lửa Dẫn Đường', desc: 'Khi Radar đang bật, tên lửa tự bám địch bị lộ.' },
    { id: 'frostMissile', a: 'iceWall', b: 'missile', name: 'Tên Lửa Băng', desc: 'Tên lửa nổ làm chậm địch 2 giây.' },
    { id: 'mirage', a: 'blind', b: 'flash', name: 'Ảo Ảnh', desc: 'Tốc Biến để lại một quả Bom Mù ở chỗ cũ.' },
    { id: 'deathMark', a: 'radar', b: 'execute', name: 'Án Tử', desc: 'Trừng Phạt với tới 600 nếu địch đang bị lộ.' },
    { id: 'frostStun', a: 'stunS', b: 'iceWall', name: 'Băng Giá', desc: 'Ngất Ngư làm chậm thêm 2 giây sau khi choáng.' },
    { id: 'shadowRun', a: 'blind', b: 'sprint', name: 'Bóng Ma', desc: 'Gia Tốc khi đứng trong khói → tàng hình 2 giây.' },
    { id: 'holyLight', a: 'cleanse', b: 'heal', name: 'Thánh Quang', desc: 'Thanh Tẩy hồi 15% máu; Hồi Máu cũng gỡ hiệu ứng xấu.' }
];
function sCombo(p, id) { const c = SPELL_COMBOS.find(x => x.id === id); return !!c && hasSpell(p, c.a) && hasSpell(p, c.b); }

function castIceWall(p) {
    const a = spellAim(p), horiz = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)); // ngắm lên/xuống → tường nằm ngang
    for (const d of [70, 100, 135, 170]) {
        const o = placeTempWall(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, horiz, 180, 5, false);
        if (o) { o.hp = o.maxHp = 180; ring(o.x + o.w / 2, o.y + o.h / 2, 10, 90, '#bae6fd', 0.4, 4); AudioSys.playAt('block', p.x, p.y, 0.4); return; }
    }
    if (!p.isBot) floatText(p.x, p.y - 30, 'Không đủ chỗ', '#94a3b8', 12);
    return false;
}
const missiles = [];
function fireMissile(p) {
    const a = spellAim(p), m = muzzle(p, getCurrentWeapon(p), a);
    const b = spawnBullet(p, m.x, m.y, a, { speed: 14, damage: 22, range: 950, color: '#fb7185', size: 6, knock: 280, bounces: 0, trail: 50 });
    b.sx = p.x; b.sy = p.y; b.ramp = 260; b.rampMax = 3.2; b.missile = true; b.critC = 0; b.wid = 'MISSILE';
    missiles.push({ b, owner: p.id, guided: sCombo(p, 'guided') });
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); addShake(4);
    p.kx -= Math.cos(a) * 160; p.ky -= Math.sin(a) * 160;
}
function castBlind(p) {
    p.skillAng = spellAim(p); p.skillDist = 260;
    throwSkillItem(p, 'SMOKE', '#94a3b8', 340);
    const it = items[items.length - 1]; if (it) it.blind = true;
    p.st.haste = Math.max(p.st.haste, 2.5);
}
function castRadar(p) {
    p.st.radarT = 5;
    zones.push({ type: 'radarPulse', x: p.x, y: p.y, r: 650, t: 5, maxT: 5, owner: p.id, tick: 0 });
    ring(p.x, p.y, 20, 650, '#34d399', 0.8, 3); AudioSys.playAt('legend', p.x, p.y, 0.25);
}
function blindArea(x, y, r, ownerId) {
    const owner = players.find(q => q.id === ownerId);
    players.forEach(e => {
        if (e.hp <= 0 || e.id === ownerId || (owner && sameTeam(owner, e)) || dist(x, y, e.x, e.y) > r + e.radius) return;
        if (has(e, 'nightVision') || (e.st.cleanseT > 0)) return;
        e.st.blind = Math.max(e.st.blind || 0, 3); floatText(e.x, e.y - 34, 'MÙ!', '#cbd5e1', 14);
    });
}
const _landSkill3 = landSkillItem;
landSkillItem = function (it) {
    _landSkill3(it);
    if (it.blind) blindArea(it.x, it.y, 150, it.ownerId);
};

// phép cũ có thêm phối hợp
(function () {
    const fl = SPELLS.flash.cast, st = SPELLS.stunS.cast, sp = SPELLS.sprint.cast, cl = SPELLS.cleanse.cast, he = SPELLS.heal.cast;
    SPELLS.flash.cast = p => {
        const x = p.x, y = p.y; fl(p);
        if (sCombo(p, 'mirage')) { zones.push({ type: 'smoke', x, y, r: 120, t: 4, maxT: 4, owner: p.id, tick: 0 }); smoke(x, y, 12, 'rgba(180,190,210,0.45)', 26); blindArea(x, y, 120, p.id); }
    };
    SPELLS.stunS.cast = p => {
        st(p);
        if (sCombo(p, 'frostStun')) enemiesOf(p).forEach(e => { if (e.stun > 0 && dist(p.x, p.y, e.x, e.y) < 150 + e.radius) e.st.slow = Math.max(e.st.slow, 2.8); });
    };
    SPELLS.sprint.cast = p => { sp(p); if (sCombo(p, 'shadowRun') && inSmoke(p.x, p.y)) { p.st.invis = Math.max(p.st.invis, 2); floatText(p.x, p.y - 34, 'BÓNG MA!', '#c4b5fd', 14); } };
    SPELLS.cleanse.cast = p => { cl(p); floatText(p.x, p.y - 52, 'MIỄN NHIỄM 3s', '#e0f2fe', 13); if (sCombo(p, 'holyLight')) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.15); };
    SPELLS.heal.cast = p => { he(p); if (sCombo(p, 'holyLight')) cleanseNow(p); };
    SPELLS.execute.cast = p => {
        const far = sCombo(p, 'deathMark');
        const e = enemiesOf(p).filter(q => targetable(p, q) && dist(p.x, p.y, q.x, q.y) < (far && (isSpotted(q, p.id) || q.st.reveal > 0) ? 600 : 300)).sort((a, b) => a.hp - b.hp)[0];
        if (!e) { if (!p.isBot) floatText(p.x, p.y - 30, 'Không có mục tiêu', '#94a3b8', 12); return false; }
        beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.25, maxLife: 0.25, color: '#f87171' });
        dealDamage(e, 30 + 0.2 * (e.maxHp - e.hp), p.id, { raw: true, angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 150 });
        floatText(e.x, e.y - 36, 'TRỪNG PHẠT!', '#f87171', 15);
    };
})();

/* ============================== LỢI THẾ ĐẦU TRẬN (chọn thoải mái, không ngẫu nhiên) ============================== */
const ADVANTAGES = {
    minimap:     { icon: '🗺️', name: 'Bản Đồ Nhỏ', desc: 'Có minimap ở góc màn hình (tường, bụi, vòng bo, địch đang thấy, tiếng động). Nghe tiếng chân xa hơn 60%.' },
    doubleUp:    { icon: '✖️2', name: 'Khởi Đầu Gấp Đôi', desc: 'Lần nâng cấp đầu tiên được chọn 2 thẻ.' },
    twoSpells:   { icon: '📜', name: 'Song Phép', desc: 'Được 2 phép bổ trợ thay vì 1 (có thêm Túi Phép thì 3).' },
    militaryBag: { icon: '🎖️', name: 'Túi Quân Dụng', desc: 'Mỗi hiệp khởi đầu với 1 vũ khí tầm xa ngẫu nhiên + dao.' },
    medkit:      { icon: '🩹', name: 'Medkit', desc: 'Không bị trúng đòn 2.5 giây thì tự hồi máu, càng lâu hồi càng nhanh (tới 10 máu/giây).' },
    blastArmor:  { icon: '🦺', name: 'Giáp Chống Nổ', desc: 'Mỗi hiệp khởi đầu với 100 giáp; nhận ít hơn 25% sát thương nổ.' },
    techStart:   { icon: '🛠️', name: 'Kỹ Thuật Cao Khởi Động', desc: 'Khởi đầu đã có thẻ Kỹ Thuật Cao. Bù lại, lần nâng cấp tiếp theo bị chọn NGẪU NHIÊN.' }
};
const ADV_IDS = Object.keys(ADVANTAGES);
const MIL_GUNS = ['PISTOL', 'SMG', 'AR', 'SHOTGUN', 'REVOLVER', 'DUAL', 'BOW', 'SPISTOL'];

/* ============================== CHÍ MẠNG · HEADSHOT · CƯỜNG HOÁ SÚNG ============================== */
const PISTOLS = ['PISTOL', 'SPISTOL', 'REVOLVER', 'DUAL'], RIFLES = ['AR', 'SMG', 'SAR', 'MINIGUN'], MARKSMAN = ['SNIPER', 'BOW', 'RAILGUN', 'REVOLVER', 'SPISTOL'];
function gunDmgBonus(p, wid) {
    let m = 1;
    if (p.pistolPro && PISTOLS.includes(wid)) m *= 1.25;
    if (p.rifleman && RIFLES.includes(wid)) m *= 1.18;
    if (p.shotgunPro && wid === 'SHOTGUN') m *= 1.15;
    if (p.marksman && MARKSMAN.includes(wid)) m *= 1.2;
    if (has(p, 'lienHoa') && ['PISTOL', 'SPISTOL', 'DUAL'].includes(wid)) m *= 1.15;
    return m;
}
function classCrit(p, wid) {
    let c = 0;
    if (p.pistolPro && PISTOLS.includes(wid)) c += 0.15;
    if (p.rifleman && RIFLES.includes(wid)) c += 0.08;
    if (p.marksman && MARKSMAN.includes(wid)) c += 0.1;
    if (p.lotusT > world.time) c += 0.25;
    return c;
}
function bulletSpeedMult(p, wid, w) {
    let m = 1;
    if (p.hotBarrel && w && w.type === 'GUN') m *= 1.2;
    if (p.marksman && MARKSMAN.includes(wid)) m *= 1.25;
    return m;
}
const _spawnBullet3 = spawnBullet;
spawnBullet = function (p, x, y, ang, o) {
    const b = _spawnBullet3(p, x, y, ang, o);
    if (p && p.inventory && p.st) {
        const w = getCurrentWeapon(p);
        b.wid = w.id;
        b.critC = (w.crit || 0) + (p.critChance || 0) + classCrit(p, w.id);
        const sm = bulletSpeedMult(p, w.id, w);
        if (sm !== 1) b.speed *= sm;
        if (p.hotBarrel && w.type === 'GUN') b.life *= 1.1;
        if (sm !== 1) b.life /= sm;
        if (p.deadeye) b.headR = 0.65;
        if (p.lotusT > world.time) b.bounces = Math.max(b.bounces, 1);
        if (p.markNext) { b.markShot = true; b.color = '#f472b6'; b.size = Math.max(b.size, 4); p.markNext = false; }
    }
    return b;
};
const _makeWeapon3 = makeWeapon;
makeWeapon = function (id, p) { const w = _makeWeapon3(id, p); if (p && p.shotgunPro && id === 'SHOTGUN') w.count = (w.count || 6) + 2; return w; };
function onCrit(atk, target) {
    if (atk.critChain) { (atk.skills || []).forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - 1.5); }); atk.st.haste = Math.max(atk.st.haste, 0.8); }
    if (atk.hollow && target.st) { target.st.slow = Math.max(target.st.slow || 0, 1); if (!target.pyro) { target.st.burn = Math.max(target.st.burn || 0, 2); target.st.burnBy = atk.id; } }
}

const _dealDamage3 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (!target || target.hp <= 0 || !target.st) return _dealDamage3(target, dmg, attackerId, opts);
    const st = target.st;
    // Thanh Tẩy: miễn nhiễm sát thương theo thời gian / độc / đốt / làm chậm
    if (st.cleanseT > 0) {
        if (opts.zone && (attackerId !== -1 || opts.poison)) return;
        if (opts.slow || opts.burn) opts = { ...opts, slow: 0, burn: false };
    }
    if (target.adv === 'blastArmor' && opts.blast) dmg *= 0.75;
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (atk && atk !== target && atk.st && !opts.raw && !opts.zone && (opts.bullet || opts.melee)) {
        const b = opts.bullet, w = getCurrentWeapon(atk), wid = b ? b.wid : w.id;
        dmg *= gunDmgBonus(atk, wid);
        let chance = b ? (b.critC || 0) : (w.crit || 0) + (atk.critChance || 0);
        const head = !!(b && opts.head && atk.headshot && !b.explosive && !b.flame && !b.missile);
        if (head) dmg *= 1.6;
        if (atk.st.sureCrit > 0 || (head && atk.deadeye)) chance = 1;
        const crit = Math.random() < chance;
        if (crit) dmg *= atk.critDmgM || 1.6;
        if (head) floatText(target.x, target.y - 48, crit ? '🎯 HEADSHOT CHÍ MẠNG!' : '🎯 HEADSHOT!', '#fca5a5', crit ? 16 : 13);
        else if (crit) floatText(target.x, target.y - 48, 'CHÍ MẠNG!', '#fde047', 14);
        if (crit) onCrit(atk, target);
        if (b && b.markShot) { st.mark = Math.max(st.mark || 0, 5); spotFor(target, atk.id, 5); floatText(target.x, target.y - 34, '📍 ĐÁNH DẤU', '#f472b6', 13); }
    }
    if (atk && atk !== target && has(atk, 'controlEye') && !opts.zone) spotFor(target, atk.id, 2);
    return _dealDamage3(target, dmg, attackerId, opts);
};
// đánh dấu sát thương nổ để Giáp Chống Nổ giảm được
const _explode3 = explode;
explode = function (...a) { blastFlag++; try { return _explode3(...a); } finally { blastFlag--; } };
let blastFlag = 0;
const _ddBlast = dealDamage;
dealDamage = function (t, d, a, o = {}) { if (blastFlag > 0 && !o.blast) o = { ...o, blast: true }; return _ddBlast(t, d, a, o); };

/* ============================== 20 THẺ MỚI ============================== */
// --- chí mạng & headshot ---
defP('critEye', '🎯', 'Mắt Chí Mạng', '+12% tỉ lệ chí mạng cho mọi đòn đánh và phát bắn.', p => { p.critChance += 0.12; });
defP('critDmg', '💥', 'Đòn Hiểm', 'Chí mạng gây ×2.2 sát thương thay vì ×1.6.', p => { p.critDmgM = 2.2; });
defP('headshot', '🧠', 'Thiện Xạ', 'Đạn trúng chính giữa người địch = HEADSHOT: +60% sát thương.', p => { p.headshot = true; });
defP('deadeye', '👁️‍🗨️', 'Bách Phát Bách Trúng', 'Vùng headshot rộng hơn 45%; headshot luôn chí mạng (cần Thiện Xạ để có headshot).', p => { p.deadeye = true; });
defP('critChain', '⚡', 'Chuỗi Chí Mạng', 'Mỗi lần chí mạng: kỹ năng hồi nhanh 1.5 giây và tăng tốc 0.8 giây.', p => { p.critChain = true; });
defP('hollowPoint', '🩸', 'Đạn Rỗng Đầu', 'Chí mạng làm địch chảy máu (đốt 2 giây) và chậm 1 giây.', p => { p.hollow = true; });
// --- cường hoá súng ---
defP('pistolPro', '🔫', 'Chuyên Gia Súng Lục', 'Súng lục, Lục Giảm Thanh, Ổ Quay, Song Súng: +25% sát thương, +15% chí mạng.', p => { p.pistolPro = true; });
defP('rifleman', '🪖', 'Xạ Thủ Súng Trường', 'AR, SMG, AR Giảm Thanh, Minigun: +18% sát thương, +8% chí mạng.', p => { p.rifleman = true; });
defP('shotgunPro', '💢', 'Đồ Tể Shotgun', 'Shotgun bắn thêm 2 viên, +15% sát thương.', p => { p.shotgunPro = true; });
defP('marksman', '🎖️', 'Xạ Thủ Kỳ Cựu', 'Bắn tỉa, Cung, Railgun, Ổ Quay, Lục Giảm Thanh: +20% sát thương, đạn bay nhanh hơn 25%, +10% chí mạng.', p => { p.marksman = true; });
defP('dualShooter', '🔫', 'Xạ Thủ Liên Đạn', 'Song Súng / Súng lục: sấy liên tục đủ 1 giây rồi dừng → bắn ra 1 loạt 7 viên hình nón.', p => { p.dualShooter = true; });
defP('hotBarrel', '♨️', 'Nòng Nóng', 'Đạn súng bay nhanh hơn 20% và xa hơn 10%.', p => { p.hotBarrel = true; });
// --- 6 nâng cấp tầm nhìn ---
defP('controlEye', '👁️', 'Mắt Kiểm Soát', 'Tầm nhìn (vùng sáng & đèn pin) +15%. Địch bị bạn gây sát thương sẽ lộ vị trí với bạn 2 giây.', p => { p.controlEye = true; });
defP('nightVision', '🌙', 'Kính Nhìn Đêm', 'Vùng sáng quanh bạn +30%, tầm nhìn +10%, không bị bóng tối thu hẹp; miễn nhiễm MÙ của Bom Mù.', p => { p.nightVision = true; });
defP('thermal', '🌡️', 'Kính Nhiệt', 'Thấy địch ẩn trong bụi rậm, khói, tàng hình trong bán kính 230.', p => { p.thermal = true; });
defP('periscope', '🔭', 'Ống Nhòm', 'Đứng yên 0.8 giây: đèn pin chiếu xa thêm 40%.', p => { p.periscope = true; });
defP('sonar', '📶', 'Sóng Âm', 'Mỗi 7 giây phát sóng âm làm lộ địch trong bán kính 520 (1.2 giây).', p => { p.sonar = true; });
defP('sixthSense', '🦇', 'Giác Quan Thứ Sáu', 'Địch trong bán kính 200 quanh bạn luôn bị lộ, kể cả sau tường.', p => { p.sixthSense = true; });
defP('wideLens', '🔦', 'Đèn Pin Góc Rộng', 'Nón đèn pin rộng hơn 50%.', p => {});
defP('focusBeam', '🔆', 'Đèn Chiếu Xa', 'Nón đèn pin dài hơn 30% nhưng hẹp hơn 20%.', p => {});
defP('catEye', '🐱', 'Mắt Mèo', 'Vùng sáng tròn quanh bạn rộng hơn 60%.', p => {});
defP('backSight', '🪞', 'Gương Chiếu Hậu', 'Có thêm 1 đèn nhỏ chiếu ra sau lưng.', p => {});
// --- 2 kỹ năng ---
defS('precision', '🎯', 'Tâm Ngắm Hoàn Hảo', 16, 'engage', 'Trong 3 giây mọi phát bắn và đòn đánh đều chí mạng.', p => { p.st.sureCrit = 3; ring(p.x, p.y, 5, 50, '#fde047', 0.4); AudioSys.playAt('select', p.x, p.y, 0.4); });
defS('markShot', '📍', 'Đạn Đánh Dấu', 12, 'engage', 'Viên đạn tiếp theo là đạn đánh dấu: trúng địch thì địch bị lộ với bạn và nhận thêm 15% sát thương trong 5 giây. Nạp ngay 1 viên.', p => {
    p.markNext = true; const w = getCurrentWeapon(p); if (w.magSize && w.mag < effMag(p, w)) w.mag++;
    floatText(p.x, p.y - 34, 'NẠP ĐẠN ĐÁNH DẤU', '#f472b6', 13);
});

/* ============================== TIẾN HOÁ S-P-S (Kỹ năng · Nội tại · Đặc biệt) ============================== */
defS('lienHoa', '🪷', 'Liên Hoa (S-P-S)', 10, 'engage',
    '<b>S – Liên Hoa Xoay:</b> xoay tròn bắn 2 vòng đạn hình hoa sen (24 viên) và nạp đầy đạn.<br><b>P – Liên Đạn:</b> nón đạn của Xạ Thủ Liên Đạn chỉ cần sấy 0.6 giây, bắn 11 viên; Súng lục & Song Súng +15% sát thương.<br><b>Đặc biệt – Sen Nở:</b> 3 giây sau khi dùng kỹ năng, đạn nảy 1 lần và +25% chí mạng.',
    p => castLotus(p));
defS('elsuSPS', '🦅', 'Elsu (S-P-S)', 9, 'engage',
    '<b>P:</b> giữ nội tại Elsu (ngắm thì đứng yên, nhìn xa ×1.6, Bắn tỉa không thu hẹp tầm nhìn).<br><b>S – Lướt Ưng:</b> lướt theo hướng chọn, BẤT TỬ khi lướt, nạp đầy đạn, 3 phát kế tiếp ×1.5 sát thương.<br><b>Đặc biệt – Bão Ưng:</b> trong 3 giây sau khi lướt, bấm lại để bay lên xoay tròn xả đạn, tạo vòng sát thương liên tục bán kính 170 quanh bạn (2 giây).',
    p => castElsuSPS(p));
CARDS.lienHoa.evo = { need: ['hightech', 'dualShooter'], replaces: 'hightech' };
CARDS.elsuSPS.evo = { need: ['elsu', 'controlEye', 'marksman'], replaces: 'elsu' };
CARDS.elsuSPS.aim = 'dir'; CARDS.elsuSPS.aimR = 200;
CARDS.markShot.aimR = 300;

function reloadFull(p) { const w = getCurrentWeapon(p); if (w.magSize && !w.noReload) { w.mag = Math.max(w.mag, effMag(p, w)); w.reloading = false; w.reloadT = 0; } }
function castLotus(p) {
    reloadFull(p);
    const w = getCurrentWeapon(p), dmg = Math.max(12, (w.type === 'GUN' ? w.damage : 14) * 0.8), a0 = p.angle;
    for (let wave = 0; wave < 2; wave++) p.shotQueue.push({ t: wave * 0.18, fn: () => {
        if (p.hp <= 0) return;
        for (let i = 0; i < 12; i++) { const a = a0 + i * Math.PI / 6 + wave * Math.PI / 12; const b = spawnBullet(p, p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18, a, { speed: 19, damage: dmg, range: 330, color: '#f9a8d4', size: 3, trail: 22 }); b.critC += 0.1; }
        ring(p.x, p.y, 10, 70, '#f9a8d4', 0.35, 4); AudioSys.playAt('smg', p.x, p.y, 0.4);
    } });
    p.lotusT = world.time + 3;
    floatText(p.x, p.y - 40, '🪷 LIÊN HOA!', '#f9a8d4', 17);
}
function castElsuSPS(p) {
    if (p.elsuArmed && p.elsuWin > world.time) { // Đặc biệt: Bão Ưng
        p.elsuArmed = false; p.elsuWin = 0;
        p.hawkStorm = { t: 2, tick: 0, shot: 0 };
        zones.push({ type: 'hawkRing', x: p.x, y: p.y, r: 170, t: 2, maxT: 2, owner: p.id, tick: 0 });
        p.st.invuln = Math.max(p.st.invuln, 0.6);
        floatText(p.x, p.y - 44, '🦅 BÃO ƯNG!', '#38bdf8', 18); flash('#38bdf8', 0.08); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
        return;
    }
    p.dashTime = 0.24; p.dashAngle = moveDir(p);
    p.st.invuln = Math.max(p.st.invuln, 0.35);
    reloadFull(p); p.st.empower = Math.max(p.st.empower || 0, 3);
    p.elsuArmed = true; p.elsuWin = world.time + 3;
    smoke(p.x, p.y, 6, 'rgba(56,189,248,0.35)', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.45);
}
function evoReady(p, id) { const e = CARDS[id].evo; return e && !p.build.includes(id) && e.need.every(n => p.build.includes(n)); }

// bộ chọn thẻ: ẩn thẻ tiến hoá cho tới khi đủ điều kiện, đủ thì luôn xuất hiện
const _cardsForPick3 = cardsForPick;
cardsForPick = function (p, kind, n) {
    if (kind !== 'build') return _cardsForPick3(p, kind, n);
    const evo = Object.keys(CARDS).filter(id => CARDS[id].evo), stash = {}, owned = p.build || [];
    evo.forEach(id => { if (owned.includes(id)) return; stash[id] = CARDS[id]; delete CARDS[id]; });
    let out;
    try { out = _cardsForPick3(p, kind, n); } finally { Object.assign(CARDS, stash); }
    const ready = evo.filter(id => evoReady(p, id));
    ready.forEach(id => { out.pop(); out.unshift(id); });
    return out;
};
const _randomBuild3 = randomBuild;
randomBuild = function () { return _randomBuild3().filter(id => !CARDS[id].evo); };
const _botPickCard3 = botPickCard;
botPickCard = function (p, ids, kind) { if (kind === 'build') { const i = ids.findIndex(id => CARDS[id] && CARDS[id].evo); if (i >= 0) return i; } return _botPickCard3(p, ids, kind); };
const _cardHTML3 = cardHTML;
cardHTML = function (id, kind, owned, keyLabel) {
    if (kind === 'adv') { const a = ADVANTAGES[id]; return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity">LỢI THẾ</span><div class="aug-icon">${a.icon}</div><div class="aug-name">${a.name}</div><div class="aug-desc">${a.desc}</div>`; }
    if (kind === 'spell') {
        const s = SPELLS[id], mine = (pickCtx && pickCtx.spells) || [];
        const combos = SPELL_COMBOS.filter(c => c.a === id || c.b === id).map(c => { const o = c.a === id ? c.b : c.a, on = mine.includes(o); return `<div class="combo ${on ? 'on' : ''}">${on ? '⚡' : '🔗'} <b>${c.name}</b> <span>+ ${SPELLS[o].icon} ${SPELLS[o].name}</span><i>${c.desc}</i></div>`; }).join('');
        return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity">PHÉP · ${s.cd}s</span><div class="aug-icon">${s.icon}</div><div class="aug-name">${s.name}</div><div class="aug-desc">${s.desc}</div>${combos ? `<div class="combos">${combos}</div>` : ''}`;
    }
    if (kind !== 'stat' && CARDS[id] && CARDS[id].evo) {
        const c = CARDS[id], e = c.evo;
        return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity tag-S">TIẾN HOÁ · ${c.cd}s</span><div class="aug-icon">${c.icon}</div><div class="aug-name">${c.name}</div><div class="aug-desc">${c.desc}</div><div class="combos"><div class="combo on">🧬 Từ ${e.need.map(n => CARDS[n].icon + ' ' + CARDS[n].name).join(' + ')} · thay thế ${CARDS[e.replaces].name}</div></div>`;
    }
    return _cardHTML3(id, kind, owned, keyLabel);
};
const _cardClass3 = cardClass;
cardClass = function (id, kind, owned) {
    if (kind === 'adv') return 'rare';
    if (kind === 'spell') { const mine = (pickCtx && pickCtx.spells) || []; return 'spell' + (SPELL_COMBOS.some(c => (c.a === id && mine.includes(c.b)) || (c.b === id && mine.includes(c.a))) ? ' legend' : ''); }
    if (CARDS[id] && CARDS[id].evo) return 'skill legend evo';
    return _cardClass3(id, kind, owned);
};
const _ownedRow3 = ownedRowHTML;
ownedRowHTML = function (build, minor) { return _ownedRow3((build || []).filter(id => CARDS[id]), minor); };

/* ============================== ÁP DỤNG MỖI HIỆP ============================== */
const NEW_FLAGS = ['headshot', 'deadeye', 'critChain', 'hollow', 'pistolPro', 'rifleman', 'shotgunPro', 'marksman', 'dualShooter', 'hotBarrel', 'controlEye', 'nightVision', 'thermal', 'periscope', 'sonar', 'sixthSense', 'medkit', 'minimap'];
const _applyBuild3 = applyBuild;
applyBuild = function (p) {
    // thẻ tiến hoá thay thế thẻ gốc
    (p.build || []).slice().forEach(id => { const e = CARDS[id] && CARDS[id].evo; if (e) p.build = p.build.filter(x => x !== e.replaces); });
    NEW_FLAGS.forEach(k => p[k] = false);
    p.critChance = 0; p.critDmgM = 1.6; p.markNext = false; p.lotusT = 0; p.elsuArmed = false; p.elsuWin = 0; p.hawkStorm = null; p.sprayT = 0; p.sonarT = 3;
    _applyBuild3(p);
    if (p.adv === 'blastArmor') p.maxArmor += 100;
    if (p.adv === 'medkit') p.medkit = true;
    if (p.adv === 'minimap') p.minimap = true;
    if (p.adv === 'militaryBag' && p.inventory[1] && p.inventory[1].id === 'NONE') p.inventory[1] = makeWeapon(MIL_GUNS[Math.floor(Math.random() * MIL_GUNS.length)], p);
};

/* ============================== MỖI KHUNG HÌNH (máy chủ) ============================== */
function coneBurst(p, w) {
    const n = has(p, 'lienHoa') ? 11 : 7, spread = 0.9, a0 = p.aimAngle !== undefined && p.aiming ? p.aimAngle : p.angle;
    for (let i = 0; i < n; i++) { const a = a0 - spread / 2 + spread * i / (n - 1), m = muzzle(p, w, a); spawnBullet(p, m.x, m.y, a, { speed: 21, damage: w.damage * 0.85, range: 300, color: '#fde68a', size: 2.6, trail: 18 }); }
    floatText(p.x, p.y - 36, 'LIÊN ĐẠN!', '#fde68a', 14); AudioSys.playAt('shotgun', p.x, p.y, 0.4); addShake(3);
}
function updateTactics(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) return;
        const st = p.st;
        ['cleanseT', 'radarT', 'blind', 'sureCrit'].forEach(k => { if (st[k] > 0) st[k] = Math.max(0, st[k] - dt); });
        if (st.cleanseT > 0) { p.stun = 0; Object.assign(st, { slow: 0, silence: 0, glued: 0, burn: 0, blind: 0 }); if (st.root > 0.15) st.root = 0; }
        // Radar: lộ địch trong 650
        if (st.radarT > 0) enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 650) spotFor(e, p.id, 0.3); });
        if (p.sixthSense) enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 200) spotFor(e, p.id, 0.3); });
        if (p.thermal) enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 230 && lineOfSight(p.x, p.y, e.x, e.y)) spotFor(e, p.id, 0.3); });
        if (p.sonar) {
            p.sonarT -= dt;
            if (p.sonarT <= 0) { p.sonarT = 7; ring(p.x, p.y, 20, 520, '#a5b4fc', 0.7, 2); enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 520) spotFor(e, p.id, 1.2); }); }
        }
        // Medkit
        if (p.medkit && gameState === 'PLAYING') {
            const idle = world.time - (p.lastHurt || -10);
            if (idle > 2.5 && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + Math.min(10, 1.5 + (idle - 2.5) * 1.5) * dt); if (Math.random() < 0.1) spark(p.x, p.y, '#4ade80', 1, 50, 0.5, 2); }
        }
        // Xạ Thủ Liên Đạn
        if (p.dualShooter) {
            const w = getCurrentWeapon(p), ok = ['DUAL', 'PISTOL', 'SPISTOL'].includes(w.id);
            const gap = Math.max(0.28, (w.fireRate || 12) / 60 * 1.4 * (p.fireRateMult || 1));
            if (ok && world.time - (p.lastFireT || -9) < gap) p.sprayT += dt;
            else { if (ok && p.sprayT >= (has(p, 'lienHoa') ? 0.6 : 1)) coneBurst(p, w); p.sprayT = 0; }
        }
        // Elsu S-P-S: giữ kỹ năng sẵn sàng trong cửa sổ Bão Ưng
        const es = (p.skills || []).find(s => s.id === 'elsuSPS');
        if (es && p.elsuArmed) {
            if (p.elsuWin > world.time) es.cd = 0;
            else { p.elsuArmed = false; es.cd = skillCooldown(p, 'elsuSPS'); }
        }
        const H = p.hawkStorm;
        if (H) {
            H.t -= dt; H.tick -= dt; H.shot -= dt;
            p.angle += 13 * dt; st.invuln = Math.max(st.invuln, 0.1); st.root = Math.max(st.root || 0, 0.1);
            if (H.shot <= 0) { H.shot = 0.05; spawnBullet(p, p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18, p.angle, { speed: 22, damage: 8, range: 210, color: '#7dd3fc', size: 2.5, trail: 14, bounces: 0 }); }
            if (H.tick <= 0) { H.tick = 0.25; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 170 + e.radius) dealDamage(e, 7, p.id, { noCharge: true, knock: 40 }); }); }
            const z = zones.find(q => q.type === 'hawkRing' && q.owner === p.id); if (z) { z.x = p.x; z.y = p.y; }
            if (H.t <= 0) p.hawkStorm = null;
        }
        const rz = zones.find(q => q.type === 'radarPulse' && q.owner === p.id); if (rz) { rz.x = p.x; rz.y = p.y; }
    });
    // tên lửa: dẫn đường + nổ khi biến mất
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i], b = m.b, owner = players.find(q => q.id === m.owner);
        if (bullets.includes(b)) {
            if (m.guided && owner && owner.st.radarT > 0) {
                const t = enemiesOf(owner).filter(e => isSpotted(e, owner.id)).sort((x, y) => dist(b.x, b.y, x.x, x.y) - dist(b.x, b.y, y.x, y.y))[0];
                if (t) { const d = angleDiff(Math.atan2(t.y - b.y, t.x - b.x), b.angle); b.angle += Math.max(-3.5 * dt, Math.min(3.5 * dt, d)); }
            }
            if (Math.random() < 0.7) particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: 'rgba(200,200,210,0.4)', size: 6, grow: 1 });
            m.lx = b.x; m.ly = b.y; continue;
        }
        missiles.splice(i, 1);
        const x = m.lx !== undefined ? m.lx : b.x, y = m.ly !== undefined ? m.ly : b.y, k = Math.min(b.rampMax || 3.2, 1 + dist(b.sx, b.sy, x, y) / (b.ramp || 260));
        explosionFx(x, y, 70); addShake(5); AudioSys.playAt('explosion', x, y, 0.3);
        if (owner) enemiesOf(owner).forEach(e => {
            if (dist(x, y, e.x, e.y) > 80 + e.radius) return;
            dealDamage(e, 8 * k, owner.id, { angle: Math.atan2(e.y - y, e.x - x), knock: 120, noCharge: true });
            if (sCombo(owner, 'frostMissile') && !(e.st.cleanseT > 0)) { e.st.slow = Math.max(e.st.slow, 2); }
        });
        if (owner && sCombo(owner, 'frostMissile')) ring(x, y, 10, 90, '#93c5fd', 0.4, 4);
    }
}
const _upe3 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe3(dt); updateTactics(dt); };

/* ============================== TẦM NHÌN ============================== */
const _visionRange3 = visionRange;
visionRange = function (viewer) {
    const v = viewer || localPlayer();
    let r = _visionRange3(viewer);
    if (!v) return r;
    if (has(v, 'nightVision')) { if (world.darkness) r *= VISION / 260; r *= 1.1; }
    if (has(v, 'controlEye')) r *= 1.15;
    if (v.st && v.st.radarT > 0) r *= 1.2;
    if (v.st && v.st.blind > 0) r *= 0.45;
    return r;
};

/* ============================== CHỌN ĐẦU TRẬN: LỢI THẾ → PHÉP · SAU NÂNG CẤP: THẺ THỨ 2, PHÉP TÚI PHÉP ============================== */
let pickCtx = {};
let phaseQueue = [], phaseDone = null, matchPreDone = false;
function advPhase() {
    return { kind: 'adv', render: 'adv', title: 'CHỌN LỢI THẾ ĐẦU TRẬN', label: 'CHỌN 1 LỢI THẾ',
        who: p => !p.adv, choices: () => ADV_IDS.slice(),
        bot: (p, ids) => Math.floor(Math.random() * ids.length),
        onPick: (p, id) => { p.adv = id; if (id === 'techStart' && !p.build.includes('hightech')) { p.build.push('hightech'); p.autoPickNext = true; } } };
}
function spellPhase(reason) {
    return { kind: 'spell', render: 'spell', title: reason || 'CHỌN PHÉP BỔ TRỢ',
        label: p => `CHỌN PHÉP BỔ TRỢ ${(p.spells || []).length + 1}/${spellCount(p)}`,
        who: p => (p.spells || []).length < spellCount(p),
        choices: p => SPELL_IDS.filter(id => !hasSpell(p, id)),
        ctx: p => ({ spells: (p.spells || []).map(s => s.id) }),
        bot: (p, ids) => { const pref = ['flash', 'heal', 'cleanse', 'missile', 'radar', 'execute']; const i = ids.findIndex(id => pref.includes(id) && Math.random() < 0.5); return i >= 0 ? i : Math.floor(Math.random() * ids.length); },
        onPick: (p, id) => { (p.spells = p.spells || []).push({ id, cd: 0 }); } };
}
function build2Phase() {
    return { kind: 'build2', render: 'build', title: '✖️2 KHỞI ĐẦU GẤP ĐÔI · THẺ THỨ 2', label: 'CHỌN THÊM 1 THẺ',
        who: p => p.adv === 'doubleUp' && !p.doubleUsed && pickCount >= 1,
        choices: p => cardsForPick(p, 'build', 3),
        bot: (p, ids) => botPickCard(p, ids, 'build'),
        onPick: (p, id) => { p.doubleUsed = true; p.newCombos = (p.newCombos || []).concat((COMBOS_OF[id] || []).filter(c => p.build.includes(c.a === id ? c.b : c.a)).map(c => c.name)); p.build.push(id); } };
}
function runPhases(list, done) { phaseQueue = list.slice(); phaseDone = done; runNextPhase(); }
function runNextPhase() {
    while (phaseQueue.length) { const ph = phaseQueue.shift(); if (players.some(p => ph.who(p))) { openPhase(ph); return; } }
    const d = phaseDone; phaseDone = null; augState.phase = null; if (d) d();
}
function openPhase(ph) {
    gameState = 'AUGMENT';
    showScreen('augment-screen');
    $('augment-screen').classList.toggle('solo', settings.mode !== 'pvp');
    augState.kind = ph.kind; augState.phase = ph; augState.choices = {}; augState.picked = {};
    $('aug-score').textContent = ph.title;
    [1, 2].forEach(side => { $(`p${side}-cards`).innerHTML = ''; $(`p${side}-wait`).classList.remove('hidden'); });
    players.forEach(p => {
        if (!ph.who(p)) { augState.picked[p.id] = '__skip'; return; }
        const ids = ph.choices(p);
        if (!ids.length) { augState.picked[p.id] = '__skip'; return; }
        augState.choices[p.id] = ids;
        const label = typeof ph.label === 'function' ? ph.label(p) : ph.label;
        const ctx = Object.assign({ title: ph.title, label }, ph.ctx ? ph.ctx(p) : {});
        const side = pickSide(p.id);
        if (side) { pickCtx = ctx; renderPickCards(side, p.id, ids, ph.render, p.build, p.minor, false, i => pickAugmentByIndex(p.id, i)); }
        if (p.remote) netSendTo(p.id, { t: 'aug', kind: ph.render, ids, score: ph.title, bonus: false, owned: p.build, minor: p.minor, round: currentRound, n: pickCount + 1, ctx });
        if (p.isBot) setTimeout(() => pickAugmentByIndex(p.id, ph.bot(p, ids), true), 400 + Math.random() * 700);
    });
    pickCtx = {};
    checkPhaseDone();
}
function checkPhaseDone() {
    const ph = augState.phase;
    if (!ph || !players.every(q => augState.picked[q.id])) return;
    gameState = 'AUG_DONE';
    setTimeout(() => {
        if (gameState !== 'AUG_DONE' || augState.phase !== ph) return;
        players.forEach(q => { const v = augState.picked[q.id]; if (v && v !== '__skip') ph.onPick(q, v); });
        augState.phase = null;
        runNextPhase();
    }, 650);
}
const _pickAug3 = pickAugmentByIndex;
pickAugmentByIndex = function (pid, idx, fromRemote) {
    const ph = augState.phase;
    if (!ph) return _pickAug3(pid, idx, fromRemote);
    if (gameState !== 'AUGMENT' || augState.picked[pid]) return;
    const p = players.find(q => q.id === pid); if (!p) return;
    if ((p.isBot || p.remote) && !fromRemote) return;
    const id = augState.choices[pid] && augState.choices[pid][idx]; if (!id) return;
    augState.picked[pid] = id;
    const side = pickSide(pid);
    if (side) {
        AudioSys.play('select', 0.4);
        $(`p${side}-cards`).querySelectorAll('.aug-card').forEach((c, i) => c.classList.add(i === idx ? 'selected' : 'disabled'));
        $(`p${side}-wait`).classList.remove('hidden');
    }
    checkPhaseDone();
};
// nhiều lá (lợi thế 7, phép 10): xếp nhiều hàng; nhãn phím 1..9, 0; tiêu đề theo giai đoạn
/** Nhiều lựa chọn: lưới ô icon + khung chi tiết. Chạm ô để xem, bấm CHỌN (hoặc chạm lại ô đó) để chốt. Phím số chọn thẳng. */
function pickName(id, kind) { return kind === 'adv' ? ADVANTAGES[id].name : kind === 'spell' ? SPELLS[id].name : CARDS[id] ? CARDS[id].name : id; }
function pickIcon(id, kind) { return kind === 'adv' ? ADVANTAGES[id].icon : kind === 'spell' ? SPELLS[id].icon : CARDS[id] ? CARDS[id].icon : '?'; }
function buildPickGrid(box, ids, kind, owned, onPick) {
    const html = ids.map(id => cardHTML(id, kind, owned, '')), cls = ids.map(id => cardClass(id, kind, owned));
    box.innerHTML = '';
    const tiles = document.createElement('div'); tiles.className = 'pick-tiles';
    const detail = document.createElement('div'); detail.className = 'pick-detail';
    let cur = -1;
    const show = i => {
        cur = i;
        tiles.querySelectorAll('.aug-card').forEach((t, k) => t.classList.toggle('focus', k === i));
        detail.className = 'pick-detail ' + cls[i];
        detail.innerHTML = `<div class="pick-info">${html[i]}</div><button class="pick-go">✔ CHỌN ${pickName(ids[i], kind).toUpperCase()}</button>`;
        detail.querySelector('.pick-go').addEventListener('click', () => onPick(i));
    };
    ids.forEach((id, i) => {
        const t = document.createElement('div');
        t.className = 'aug-card pick-tile ' + cls[i];
        t.innerHTML = `<span class="aug-key"></span><div class="tile-icon">${pickIcon(id, kind)}</div><div class="tile-name">${pickName(id, kind)}</div>`;
        t.addEventListener('click', () => { if (cur === i) onPick(i); else { show(i); AudioSys.play('tick', 0.2); } });
        t.addEventListener('mouseenter', () => { if (!isTouch) show(i); });
        tiles.appendChild(t);
    });
    box.append(tiles, detail);
    show(0);
}
const _renderPick3 = renderPickCards;
renderPickCards = function (side, pid, ids, kind, owned, minor, bonus, onPick) {
    _renderPick3(side, pid, ids, kind, owned, minor, bonus, onPick);
    const box = $(`p${side}-cards`);
    box.classList.remove('many');
    box.classList.toggle('grid', ids.length > 4);
    if (ids.length > 4) buildPickGrid(box, ids, kind, owned, onPick);
    if (settings.mode !== 'pvp') box.querySelectorAll('.aug-key').forEach((k, i) => k.textContent = i < 9 ? String(i + 1) : i === 9 ? '0' : '');
    if (pickCtx && pickCtx.label) { const t = document.querySelector(`.p${side}-side .aug-title`); const who = pid === localId() ? 'BẠN' : (players.find(q => q.id === pid) || {}).label || 'P' + pid; t.innerHTML = `<span style="color:${pColor(pid)}">${who}</span> · ${pickCtx.label}`; }
};
const _guestOpen3 = guestOpenAugments;
guestOpenAugments = function (m) {
    pickCtx = m.ctx || {};
    _guestOpen3(m);
    if (m.ctx && m.ctx.title) $('aug-score').textContent = m.ctx.title;
    pickCtx = {};
};
const _netSendTo3 = netSendTo;
netSendTo = function (id, msg) {
    if (msg && msg.t === 'aug' && !msg.ctx) { const p = players.find(q => q.id === id); if (p && p.autoPickNext) msg.ctx = { label: '🎲 NÂNG CẤP NÀY BỊ CHỌN NGẪU NHIÊN' }; }
    return _netSendTo3(id, msg);
};
const _startMatch3 = startMatch;
startMatch = function () { matchPreDone = false; phaseQueue = []; phaseDone = null; augState.phase = null; return _startMatch3(); };
const _openAug3 = openAugmentScreen;
openAugmentScreen = function () {
    augState.phase = null;
    if (currentRound === 1 && pickCount === 0 && !matchPreDone) {
        matchPreDone = true;
        players.forEach(p => { p.adv = p.adv || null; p.spells = p.spells || []; });
        runPhases([advPhase(), spellPhase(), spellPhase(), spellPhase()], () => openAugmentScreen());
        return;
    }
    const pick = isPickRound(currentRound);
    const lp = players.find(q => q.id === localId()); if (pick && lp && lp.autoPickNext) pickCtx = { label: '🎲 NÂNG CẤP NÀY BỊ CHỌN NGẪU NHIÊN' };
    _openAug3();
    pickCtx = {};
    if (!pick || gameState !== 'AUGMENT') return;
    players.forEach(p => {
        if (!p.autoPickNext || !augState.choices[p.id]) return;
        p.autoPickNext = false;
        setTimeout(() => pickAugmentByIndex(p.id, Math.floor(Math.random() * augState.choices[p.id].length), true), 1100);
    });
};
const _sdi3 = startDestinyIntro;
startDestinyIntro = function () {
    if (augState.phase) return;
    const list = [build2Phase(), spellPhase('📖 TÚI PHÉP · CHỌN THÊM PHÉP')];
    if (list.some(ph => players.some(p => ph.who(p)))) { runPhases(list, () => _sdi3()); return; }
    _sdi3();
};

/* ============================== MẠNG: gửi thêm dữ liệu ============================== */
const _snapPlayer3 = snapPlayer;
snapPlayer = function (p) { return Object.assign(_snapPlayer3(p), { adv: p.adv || null, stillT: Math.round((p.stillT || 0) * 10) / 10 }); };

/* ============================== VẼ ============================== */
const _drawNetZones3 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones3(now);
    zones.forEach(z => {
        if (z.type === 'hawkRing') {
            ctx.save();
            const g = ctx.createRadialGradient(z.x, z.y, z.r * 0.3, z.x, z.y, z.r);
            g.addColorStop(0, 'rgba(56,189,248,0)'); g.addColorStop(1, `rgba(56,189,248,${0.22 + Math.sin(now * 20) * 0.08})`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(125,211,252,0.9)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -now * 120;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.restore();
        } else if (z.type === 'radarPulse' && (localId() === null || z.owner === localId())) {
            const k = ((now * 0.8) % 1);
            ctx.save(); ctx.strokeStyle = `rgba(52,211,153,${0.5 * (1 - k)})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(52,211,153,0.25)'; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.restore();
        }
    });
};
const _drawPlayerExtras3 = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras3(p, w, now);
    const st = p.st || {};
    if (st.cleanseT > 0) { ctx.save(); ctx.strokeStyle = `rgba(224,242,254,${0.55 + Math.sin(now * 10) * 0.25})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 7, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (st.blind > 0) { ctx.save(); ctx.font = `14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('😵', p.x, p.y - p.radius - 16); ctx.restore(); }
    if (st.sureCrit > 0) { ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
};
/** Minimap (lợi thế Bản Đồ Nhỏ) */
function drawMinimap(me, W, H, now) {
    const S = Math.round(Math.min(160, Math.max(110, Math.min(W, H) * 0.26))), x0 = W - S - 12, y0 = 64;
    const k = S / Math.max(MAP_W, MAP_H), mw = MAP_W * k, mh = MAP_H * k, ox = x0 + (S - mw) / 2, oy = y0 + (S - mh) / 2;
    const X = x => ox + x * k, Y = y => oy + y * k;
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,24,0.72)'; rrect(ctx, x0 - 4, y0 - 4, S + 8, S + 8, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(30,41,59,0.9)'; ctx.fillRect(ox, oy, mw, mh);
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, mw, mh); ctx.clip();
    ctx.fillStyle = 'rgba(34,197,94,0.35)'; bushes.forEach(b => { ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), Math.max(1.5, b.r * k), 0, Math.PI * 2); ctx.fill(); });
    obstacles.forEach(o => { ctx.fillStyle = o.ice ? 'rgba(186,230,253,0.8)' : o.wood ? 'rgba(180,120,70,0.8)' : 'rgba(148,163,184,0.85)'; ctx.fillRect(X(o.x), Y(o.y), Math.max(1, o.w * k), Math.max(1, o.h * k)); });
    const z = world.zone;
    if (z && z.r) { ctx.strokeStyle = 'rgba(96,165,250,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(z.x), Y(z.y), z.r * k, 0, Math.PI * 2); ctx.stroke(); }
    pings.forEach(pg => { const a = pg.life / pg.maxLife; ctx.strokeStyle = pg.kind === 'step' ? `rgba(226,232,240,${a})` : `rgba(248,113,113,${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(pg.x), Y(pg.y), 3 + (1 - a) * 5, 0, Math.PI * 2); ctx.stroke(); });
    players.forEach(q => {
        if (q.hp <= 0 || q.x === undefined) return;
        const self = q.id === me.id, ally = sameTeam(me, q);
        if (!self && !ally && !(targetable(me, q) || isSpotted(q, me.id) || (q.st && q.st.reveal > 0))) return;
        ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), self ? 3.6 : 3, 0, Math.PI * 2); ctx.fill();
        if (self) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(q.x), Y(q.y)); ctx.lineTo(X(q.x) + Math.cos(q.angle) * 9, Y(q.y) + Math.sin(q.angle) * 9); ctx.stroke(); }
    });
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('🗺 MINIMAP', x0, y0 + S + 12);
    ctx.restore();
}
const _drawHUD3 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD3(W, H, now);
    const me = localPlayer();
    if (me && me.adv === 'minimap' && ['PLAYING', 'KO', 'COUNTDOWN', 'ROUND_OVER'].includes(gameState)) drawMinimap(me, W, H, now);
};
