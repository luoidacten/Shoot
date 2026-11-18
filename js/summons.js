/** ==================== 4 LỢI THẾ MỚI · 6 THẺ THOÁT CHẾT · 20 THẺ TRIỆU HỒI & Ụ SÚNG ====================
 *  Nạp sau tactics.js. Lính triệu hồi / ụ súng dùng chung mảng decoys (tự bị đạn bắn trúng, tự đồng bộ online),
 *  phân biệt bằng nhãn (label) và kind 'sm'.
 */

/* ============================== LỢI THẾ MỚI ============================== */
Object.assign(ADVANTAGES, {
    manyChoices: { icon: '🃏', name: 'Nhiều Lựa Chọn', desc: 'Mỗi lần nâng cấp có thêm 1 lá. Luôn có 1 lá hợp với bạn, may mắn thì 2.' },
    gunsOnly:    { icon: '🎯', name: 'Bắn Chuẩn', desc: 'Hòm chỉ ra súng, không ra vũ khí cận chiến. Súng chính xác hơn 35%.' },
    meleeOnly:   { icon: '🗡️', name: 'Cận Chiến', desc: 'Hòm chỉ ra vũ khí cận chiến. Cận chiến +25% sát thương, chạy nhanh hơn 10%.' },
    stealth:     { icon: '🥷', name: 'Lẩn Trốn', desc: 'Tiếng chân nhỏ, chỉ nghe được ở gần; ít dấu chân; người nhỏ hơn nên khó bị bắn trúng.' }
});
ADV_IDS.push('manyChoices', 'gunsOnly', 'meleeOnly', 'stealth');
function weightedWeapon(ok) {
    const keys = Object.keys(BASE_WEIGHTS).filter(k => WEAPONS[k] && ok(WEAPONS[k]));
    let total = keys.reduce((s, k) => s + BASE_WEIGHTS[k], 0), r = Math.random() * total;
    for (const k of keys) { if (r < BASE_WEIGHTS[k]) return k; r -= BASE_WEIGHTS[k]; }
    return keys[0];
}
const isMeleeW = w => w.type === 'MELEE' || w.type === 'SHIELD';
const _makeWeapon4 = makeWeapon;
makeWeapon = function (id, p) {
    const W = WEAPONS[id];
    if (p && W && id !== 'NONE') {
        if (p.adv === 'gunsOnly' && W.type !== 'GUN') id = weightedWeapon(w => w.type === 'GUN');
        else if (p.adv === 'meleeOnly' && !isMeleeW(W)) id = weightedWeapon(isMeleeW);
    }
    return _makeWeapon4(id, p);
};

/* ============================== THẺ THOÁT CHẾT (mỗi hiệp 1 lần mỗi thẻ) ============================== */
defP('adrenaline', '💉', 'Adrenaline', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì còn 1 máu, BẤT TỬ 3 giây, +40% sát thương và chạy nhanh. Hết 3 giây mà chưa hạ được ai thì chết; hạ được thì sống với 30% máu.', p => {});
defP('secondWind', '🪢', 'Thập Tử Nhất Sinh', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì còn 1 máu và bất tử 1 giây.', p => {});
defP('joker', '🃏', 'Joker', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì bất tử 0.5 giây, hồi 25% máu và dịch chuyển tới một chỗ khác.', p => {});
defP('phoenix', '🪶', 'Phượng Hoàng', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì bùng nổ lửa quanh mình (35 sát thương + bỏng), bất tử 1.5 giây rồi hồi 30% máu.', p => {});
defP('bloodPact', '⚱️', 'Hiến Tế', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì hiến 30 máu tối đa (trong hiệp này) để sống lại với 50% máu.', p => {});
defP('ghostForm', '👻', 'Hồn Ma', 'Mỗi hiệp 1 lần: dính đòn kết liễu thì hoá hồn ma 2.5 giây (tàng hình, bất tử, chạy nhanh, không tấn công được) rồi hiện lại với 15% máu.', p => {});

function safeSpot(p, minD) {
    const z = world.zone || { x: MAP_W / 2, y: MAP_H / 2, r: Math.max(MAP_W, MAP_H) };
    for (let k = 0; k < 40; k++) {
        const a = Math.random() * 6.28, r = Math.random() * Math.min(z.r * 0.8, Math.max(MAP_W, MAP_H) / 2);
        const x = z.x + Math.cos(a) * r, y = z.y + Math.sin(a) * r;
        if (x < 40 || y < 40 || x > MAP_W - 40 || y > MAP_H - 40 || pointInObstacle(x, y, p.radius + 4) || dist(x, y, p.x, p.y) < minD) continue;
        return { x, y };
    }
    return null;
}
function survive(p, hp, invuln, text, color) {
    p.hp = Math.max(1, hp); p.dead = false; p.st.invuln = Math.max(p.st.invuln || 0, invuln);
    floatText(p.x, p.y - 40, text, color, 20, { life: 1.4 }); ring(p.x, p.y, 10, 90, color, 0.5, 6); addShake(8); AudioSys.playAt('trick', p.x, p.y, 0.5);
}
/** Trả về true nếu thoát chết */
function cheatDeath(p, killerId) {
    const u = p.deathUsed = p.deathUsed || {}, can = id => has(p, id) && !u[id];
    if (can('joker')) {
        u.joker = true;
        smoke(p.x, p.y, 8, 'rgba(192,132,252,0.4)', 18);
        const s = safeSpot(p, 350); if (s) { p.x = s.x; p.y = s.y; p.vx = p.vy = p.kx = p.ky = 0; }
        survive(p, p.maxHp * 0.25, 0.5, '🃏 JOKER!', '#c084fc');
        if (combo(p, 'jokerInvis')) p.st.invis = Math.max(p.st.invis, 2.5);
        return true;
    }
    if (can('phoenix')) {
        u.phoenix = true;
        const big = combo(p, 'firebird'), R = big ? 220 : 140;
        explosionFx(p.x, p.y, R); ring(p.x, p.y, 12, R, '#fb923c', 0.6, 8);
        enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < R + e.radius) { dealDamage(e, big ? 60 : 35, p.id, { burn: true, knock: 300, angle: Math.atan2(e.y - p.y, e.x - p.x) }); } });
        zones.push({ type: 'fire', x: p.x, y: p.y, r: R * 0.6, t: 2, maxT: 2, owner: p.id, tick: 0 });
        survive(p, 1, 1.5, '🪶 PHƯỢNG HOÀNG!', '#fb923c');
        p.phoenixHeal = world.time + 1.5;
        return true;
    }
    if (can('bloodPact')) {
        u.bloodPact = true;
        p.maxHp = Math.max(30, p.maxHp - (combo(p, 'freshBlood') ? 15 : 30));
        survive(p, p.maxHp * 0.5, 0.6, '⚱️ HIẾN TẾ!', '#dc2626');
        return true;
    }
    if (can('ghostForm')) {
        u.ghostForm = true;
        const t = combo(p, 'ghostInvis') ? 4 : 2.5;
        p.ghostForm = world.time + t;
        survive(p, 1, t, '👻 HỒN MA!', '#e2e8f0');
        p.st.invis = Math.max(p.st.invis, t); p.st.haste = Math.max(p.st.haste, t);
        return true;
    }
    if (can('secondWind')) {
        u.secondWind = true;
        survive(p, combo(p, 'willIron') ? p.maxHp * 0.2 : 1, 1, '🪢 THẬP TỬ NHẤT SINH!', '#fde047');
        return true;
    }
    if (can('adrenaline')) {
        u.adrenaline = true;
        p.adren = { t: 3, kills: p.stats.kills || 0, killer: killerId };
        survive(p, 1, 3, '💉 ADRENALINE!', '#f43f5e');
        p.st.rage = Math.max(p.st.rage, 3); p.st.haste = Math.max(p.st.haste, 3);
        if (combo(p, 'adrenInvis')) p.st.invis = Math.max(p.st.invis, 3);
        return true;
    }
    return false;
}
const _killPlayer4 = killPlayer;
killPlayer = function (dead, killerId) {
    if (!dead.dead && !dead.temp && dead.st && gameState === 'PLAYING' && !dead.adrenDying && cheatDeath(dead, killerId)) return;
    return _killPlayer4(dead, killerId);
};
function updateDeathCards(p, dt) {
    if (p.adren) {
        const A = p.adren; A.t -= dt;
        if ((p.stats.kills || 0) > A.kills) { p.adren = null; p.hp = Math.max(p.hp, p.maxHp * 0.3); floatText(p.x, p.y - 40, '💉 SỐNG SÓT!', '#4ade80', 18); }
        else if (A.t <= 0 || gameState !== 'PLAYING') {
            p.adren = null;
            if (gameState === 'PLAYING') { p.st.invuln = 0; p.hp = 0; p.adrenDying = true; floatText(p.x, p.y - 40, 'HẾT ADRENALINE', '#f43f5e', 15); _killPlayer4(p, A.killer); p.adrenDying = false; }
        } else p.st.invuln = Math.max(p.st.invuln, 0.1);
    }
    if (p.ghostForm) {
        if (world.time < p.ghostForm) { p.cooldown = Math.max(p.cooldown || 0, 0.2 * 60); p.st.silence = Math.max(p.st.silence || 0, 0.1); }
        else { p.ghostForm = 0; p.hp = Math.max(p.hp, p.maxHp * 0.15); p.st.invis = 0; floatText(p.x, p.y - 40, 'HIỆN HÌNH', '#e2e8f0', 14); }
    }
    if (p.phoenixHeal && world.time >= p.phoenixHeal) { p.phoenixHeal = 0; p.hp = Math.max(p.hp, p.maxHp * 0.3); spark(p.x, p.y, '#fb923c', 16, 220); }
}

/* ============================== TRIỆU HỒI & Ụ SÚNG ============================== */
const SUMMON = {
    wolf:   { label: 'SÓI', icon: '🐺', hp: 60, r: 12, sp: 260, t: 10, melee: 10, rate: 0.6, beast: true },
    golem:  { label: 'NGƯỜI ĐÁ', icon: '🗿', hp: 220, r: 20, sp: 110, t: 12, melee: 18, rate: 1.2, stun: 0.5, beast: true },
    skel:   { label: 'XƯƠNG', icon: '💀', hp: 25, r: 11, sp: 200, t: 8, melee: 6, rate: 0.5, beast: true },
    bee:    { label: 'ONG MÁY', icon: '🐝', hp: 20, r: 8, t: 7, shoot: 5, rate: 0.35, range: 300, orbit: 55, fly: true },
    medic:  { label: 'DRONE Y TẾ', icon: '🚑', hp: 40, r: 10, t: 8, heal: 5, orbit: 42, fly: true },
    gun:    { label: 'THÁP PHÁO', icon: '🗼', hp: 80, r: 14, t: 8, shoot: 7, rate: 0.42, range: 470, turret: true },
    mg:     { label: 'Ụ SÚNG MÁY', icon: '🔫', hp: 120, r: 16, t: 10, shoot: 4, rate: 0.12, range: 420, spread: 0.15, turret: true },
    mortar: { label: 'PHÁO CỐI', icon: '💣', hp: 100, r: 16, t: 10, lob: 55, rate: 1.6, range: 650, minR: 140, turret: true },
    flame:  { label: 'THÁP LỬA', icon: '🔥', hp: 110, r: 15, t: 9, flame: 3, rate: 0.08, range: 170, turret: true },
    tesla:  { label: 'THÁP TESLA', icon: '⚡', hp: 90, r: 14, t: 10, zap: 14, rate: 0.9, range: 260, turret: true }
};
const SM_BY_LABEL = {};
for (const k in SUMMON) { SM_BY_LABEL[SUMMON[k].label] = k; KIND_BY_LABEL[SUMMON[k].label] = 'sm'; }
const TURRET_SKILLS = ['turret', 'mgNest', 'mortar', 'flameTurret', 'teslaTower'], SUMMON_SKILLS = TURRET_SKILLS.concat(['wolfPack', 'golem', 'droneSwarm', 'healDrone', 'raiseDead']);

function summon(p, kind, x, y) {
    const S = SUMMON[kind];
    let hp = S.hp, t = S.t;
    if (S.turret && p.engineer) { hp *= 1.5; t *= 1.3; }
    if (S.beast && p.beastMaster) hp *= 1.4;
    if (kind === 'golem' && combo(p, 'bigGolem')) hp += 100;
    if (kind === 'mg' && combo(p, 'heavyMg')) hp *= 1.6;
    if (S.turret) { // tối đa 2 ụ mỗi loại
        const mine = decoys.filter(d => d.kind === 'sm' && d.sk === kind && d.owner === p.id);
        if (mine.length >= 2) mine[0].hp = 0;
    }
    if (pointInObstacle(x, y, S.r)) { x = p.x; y = p.y; }
    const d = { x, y, angle: p.angle, speed: 0, owner: p.id, t, hp, maxHp: hp, color: p.color, radius: S.r, label: S.label, kind: 'sm', sk: kind, cd: 0.4, ph: Math.random() * 6.28 };
    decoys.push(d);
    spark(x, y, p.color, 8, 160); AudioSys.playAt(S.turret ? 'slam' : 'trick', x, y, 0.25);
    return d;
}
function around(p, i, n, r) { const a = p.angle + Math.PI + (i - (n - 1) / 2) * 0.7; return [p.x + Math.cos(a) * r, p.y + Math.sin(a) * r]; }
function summonMany(p, kind, n) { for (let i = 0; i < n; i++) summon(p, kind, ...around(p, i, n, 34)); }
function placeTurret(p, kind) { const a = aimDir(p); return summon(p, kind, p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 40); }
const extra1 = p => p.packLeader ? 1 : 0;

// --- 9 kỹ năng ---
defS('wolfPack', '🐺', 'Bầy Sói', 16, 'engage', 'Gọi 2 con sói (60 máu, 10 giây) lao vào cắn địch gần nhất.', p => summonMany(p, 'wolf', 2 + extra1(p)));
defS('golem', '🗿', 'Người Đá', 20, 'engage', 'Gọi Người Đá 220 máu (12 giây): chậm, đấm mạnh và làm choáng, hút đạn của địch.', p => summon(p, 'golem', ...around(p, 0, 1, 40)));
defS('droneSwarm', '🐝', 'Bầy Ong Máy', 15, 'engage', 'Thả 3 ong máy bay quanh bạn, tự bắn địch trong 300 (7 giây).', p => summonMany(p, 'bee', 3 + extra1(p) + (combo(p, 'squadron') ? 2 : 0)));
defS('healDrone', '🚑', 'Drone Y Tế', 18, 'escape', 'Thả drone bay theo bạn, hồi 5 máu/giây trong 8 giây.', p => summon(p, 'medic', p.x, p.y));
defS('raiseDead', '💀', 'Gọi Hồn', 14, 'engage', 'Gọi 3 bộ xương (25 máu, 8 giây) xông vào địch.', p => summonMany(p, 'skel', 3 + extra1(p) + (combo(p, 'darkArmy') ? 2 : 0)));
defS('mgNest', '🔫', 'Ụ Súng Máy', 18, 'place', 'Dựng ụ súng máy bắn rất nhanh (120 máu, 10 giây, tầm 420).', p => placeTurret(p, 'mg'));
defS('mortar', '💣', 'Pháo Cối', 20, 'place', 'Dựng pháo cối bắn đạn nổ vòng cầu vào địch ở xa (tầm 140–650, 10 giây).', p => placeTurret(p, 'mortar'));
defS('flameTurret', '🔥', 'Tháp Lửa', 16, 'place', 'Dựng tháp phun lửa tầm ngắn (170), gây bỏng (9 giây).', p => placeTurret(p, 'flame'));
defS('teslaTower', '⚡', 'Tháp Tesla', 18, 'place', 'Dựng tháp Tesla phóng điện vào địch trong 260, nảy sang 1 mục tiêu nữa và làm chậm (10 giây).', p => placeTurret(p, 'tesla'));
['mgNest', 'mortar', 'flameTurret', 'teslaTower'].forEach(id => { CARDS[id].aim = 'dir'; CARDS[id].aimR = 90; });
// Tháp Pháo cũ chuyển sang hệ thống mới: phá được, hưởng thẻ Kỹ Sư...
Object.assign(CARDS.turret, { desc: 'Dựng tháp pháo tự bắn địch (80 máu, 8 giây). Địch phá được.', cast: p => {
    const d = placeTurret(p, 'gun'), a = aimDir(p);
    if (combo(p, 'turret_wall')) placeTempWall(d.x + Math.cos(a) * 40, d.y + Math.sin(a) * 40, Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)), 70, 8, false);
} });

// --- 11 nội tại ---
defP('engineer', '🔧', 'Kỹ Sư', 'Ụ súng & tháp: +50% máu, tồn tại lâu hơn 30%.', p => { p.engineer = true; });
defP('overclockT', '⚙️', 'Ép Xung', 'Ụ súng & tháp bắn nhanh hơn 30%.', p => { p.overclockT = true; });
defP('beastMaster', '🦴', 'Chủ Thú', 'Sói, Người Đá, Xương: +40% máu và sát thương.', p => { p.beastMaster = true; });
defP('packLeader', '👑', 'Thủ Lĩnh Bầy', 'Bầy Sói, Gọi Hồn, Bầy Ong Máy gọi thêm 1 con.', p => { p.packLeader = true; });
defP('summonerSoul', '🔮', 'Linh Hồn Triệu Hồi', 'Mỗi khi lính / ụ súng của bạn bị phá: hồi 10 máu và mọi kỹ năng hồi nhanh 2 giây.', p => { p.summonerSoul = true; });
defP('explosiveTurret', '💥', 'Ụ Tự Huỷ', 'Ụ súng & tháp hết giờ hoặc bị phá sẽ phát nổ.', p => { p.explosiveTurret = true; });
defP('linkedTurret', '📡', 'Ụ Liên Kết', 'Địch mà lính / ụ súng của bạn nhìn thấy sẽ bị lộ vị trí với bạn.', p => { p.linkedTurret = true; });
defP('scrapper', '🔩', 'Nhặt Phế Liệu', 'Mỗi hòm mở được: kỹ năng triệu hồi & ụ súng hồi nhanh 3 giây.', p => { p.scrapper = true; });
defP('bloodBond', '🩸', 'Khế Ước Máu', 'Bạn hồi máu bằng 20% sát thương lính / ụ súng gây ra.', p => { p.bloodBond = true; });
defP('fortress', '🏰', 'Pháo Đài', 'Ụ súng & tháp ở gần bạn (dưới 220) gây thêm 25% sát thương.', p => { p.fortress = true; });
defP('commander', '🎖️', 'Chỉ Huy', 'Lính & ụ súng ưu tiên đánh kẻ bạn vừa bắn trúng, gây thêm 15% sát thương lên kẻ đó.', p => { p.commander = true; });

/* ============================== PHỐI HỢP ============================== */
[
    // thoát chết (có phối hợp với Vô Hình)
    { id: 'jokerInvis', a: 'joker', b: 'invis', name: 'Trò Đùa Cuối', desc: 'Joker dịch chuyển xong được tàng hình 2.5 giây.' },
    { id: 'adrenInvis', a: 'adrenaline', b: 'invis', name: 'Sát Thủ Bóng Đêm', desc: 'Trong 3 giây Adrenaline được tàng hình (tấn công sẽ lộ).' },
    { id: 'ghostInvis', a: 'ghostForm', b: 'invis', name: 'Bóng Ma Thật Sự', desc: 'Hồn Ma kéo dài 4 giây.' },
    { id: 'willIron', a: 'secondWind', b: 'antiMelee', name: 'Ý Chí Sắt', desc: 'Thập Tử Nhất Sinh để lại 20% máu thay vì 1.' },
    { id: 'firebird', a: 'phoenix', b: 'lavaWalker', name: 'Hoả Điểu', desc: 'Vụ nổ Phượng Hoàng rộng hơn và gây 60 sát thương.' },
    { id: 'freshBlood', a: 'bloodPact', b: 'vitality', name: 'Máu Tươi', desc: 'Hiến Tế chỉ mất 15 máu tối đa.' },
    { id: 'frenzy', a: 'adrenaline', b: 'berserk', name: 'Điên Cuồng', desc: 'Trong Adrenaline gây thêm 50% sát thương.' },
    // triệu hồi & ụ súng
    { id: 'alphaWolf', a: 'wolfPack', b: 'packLeader', name: 'Sói Đầu Đàn', desc: 'Sói chạy nhanh và cắn mạnh hơn 50%.' },
    { id: 'bigGolem', a: 'golem', b: 'vitality', name: 'Người Đá Khổng Lồ', desc: 'Người Đá +100 máu.' },
    { id: 'squadron', a: 'droneSwarm', b: 'scout', name: 'Phi Đội', desc: 'Bầy Ong Máy thêm 2 con.' },
    { id: 'medicSoul', a: 'healDrone', b: 'summonerSoul', name: 'Linh Hồn Y Tế', desc: 'Drone Y Tế hồi 9 máu/giây.' },
    { id: 'darkArmy', a: 'raiseDead', b: 'scarecrow', name: 'Đội Quân Bóng Tối', desc: 'Gọi Hồn thêm 2 bộ xương.' },
    { id: 'heavyMg', a: 'mgNest', b: 'barricade', name: 'Ụ Kiên Cố', desc: 'Ụ Súng Máy +60% máu.' },
    { id: 'bigMortar', a: 'mortar', b: 'demolisher', name: 'Pháo Phá Dỡ', desc: 'Pháo Cối nổ rộng hơn 40%.' },
    { id: 'artillery', a: 'mortar', b: 'fortress', name: 'Trận Địa Pháo', desc: 'Ụ súng & tháp gần bạn bắn nhanh thêm 20%.' },
    { id: 'toxicFlame', a: 'flameTurret', b: 'gasMask', name: 'Lửa Độc', desc: 'Tháp Lửa làm chậm địch.' },
    { id: 'overload', a: 'teslaTower', b: 'saboteur', name: 'Quá Tải', desc: 'Tháp Tesla nảy thêm 2 mục tiêu.' },
    { id: 'workshop', a: 'engineer', b: 'overclockT', name: 'Xưởng Chế Tạo', desc: 'Kỹ năng ụ súng & tháp hồi nhanh hơn 20%.' },
    { id: 'feral', a: 'beastMaster', b: 'bloodBond', name: 'Thú Khát Máu', desc: 'Lính hồi máu cho chính nó bằng 50% sát thương gây ra.' },
    { id: 'trapBlast', a: 'explosiveTurret', b: 'claymore', name: 'Bẫy Nổ', desc: 'Ụ Tự Huỷ nổ to gấp đôi.' },
    { id: 'netWatch', a: 'linkedTurret', b: 'controlEye', name: 'Mạng Lưới Giám Sát', desc: 'Lính & ụ súng phát hiện địch xa hơn 50%.' },
    { id: 'pointMan', a: 'commander', b: 'markShot', name: 'Chỉ Điểm', desc: 'Lính & ụ súng gây thêm 30% lên địch bị đánh dấu.' },
    { id: 'techDrop', a: 'scrapper', b: 'airdropCall', name: 'Tiếp Tế Kỹ Thuật', desc: 'Gọi Tiếp Tế làm mới mọi kỹ năng triệu hồi & ụ súng.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3 && id !== 'invis') console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);

const _skillCd4 = skillCooldown;
skillCooldown = function (p, id) { let cd = _skillCd4(p, id); if (combo(p, 'workshop') && TURRET_SKILLS.includes(id)) cd *= 0.8; return cd; };
const _airdrop4 = CARDS.airdropCall.cast;
CARDS.airdropCall.cast = (p, e) => { const r = _airdrop4(p, e); if (combo(p, 'techDrop')) (p.skills || []).forEach(s => { if (SUMMON_SKILLS.includes(s.id)) s.cd = 0; }); return r; };
const _openCrate4 = openCrate;
openCrate = function (p, index) {
    const before = p.stats.crates;
    const r = _openCrate4(p, index);
    if (p.scrapper && p.stats.crates > before) (p.skills || []).forEach(s => { if (SUMMON_SKILLS.includes(s.id) && s.cd > 0) s.cd = Math.max(0, s.cd - 3); });
    return r;
};

/* ============================== ÁP DỤNG MỖI HIỆP ============================== */
const _applyBuild4 = applyBuild;
applyBuild = function (p) {
    ['engineer', 'overclockT', 'beastMaster', 'packLeader', 'summonerSoul', 'explosiveTurret', 'linkedTurret', 'scrapper', 'bloodBond', 'fortress', 'commander'].forEach(k => p[k] = false);
    p.deathUsed = {}; p.adren = null; p.ghostForm = 0; p.phoenixHeal = 0; p.lastHitId = null;
    _applyBuild4(p);
    if (p.adv === 'gunsOnly') p.spreadMult *= 0.65;
    if (p.adv === 'meleeOnly') { p.meleeMult = (p.meleeMult || 1) * 1.25; p.moveMult *= 1.1; }
    if (p.adv === 'stealth') p.radius = Math.max(11, p.radius - 2);
};
const _dealDamage4 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (atk && atk !== target && atk.adren && combo(atk, 'frenzy')) dmg *= 1.5;
    if (atk && atk !== target && opts.bullet && !opts.summon) atk.lastHitId = target.id;
    return _dealDamage4(target, dmg, attackerId, opts);
};

/* ============================== AI LÍNH & Ụ SÚNG (máy chủ) ============================== */
function summonTarget(d, o, range) {
    if (combo(o, 'netWatch')) range *= 1.5;
    let best = null, bd = range;
    const prefer = o.commander && players.find(q => q.id === o.lastHitId && q.hp > 0);
    for (const e of enemiesOf(o)) {
        if (e.air > 0) continue;
        const dd = dist(d.x, d.y, e.x, e.y);
        if (dd > range || (e.st.invis > 0 && dd > 60) || !lineOfSight(d.x, d.y, e.x, e.y)) continue;
        if (prefer === e) { best = e; break; }
        if (dd < bd) { bd = dd; best = e; }
    }
    if (best && o.linkedTurret) spotFor(best, o.id, 0.4);
    return best;
}
function summonHit(d, o, e, dmg, opts = {}) {
    const S = SUMMON[d.sk];
    if (S.beast && o.beastMaster) dmg *= 1.4;
    if (d.sk === 'wolf' && combo(o, 'alphaWolf')) dmg *= 1.5;
    if (S.turret && o.fortress && dist(d.x, d.y, o.x, o.y) < 220) dmg *= 1.25;
    if (o.commander && e.id === o.lastHitId) dmg *= 1.15;
    if (combo(o, 'pointMan') && e.st.mark > 0) dmg *= 1.3;
    const hp0 = e.hp;
    dealDamage(e, dmg, o.id, Object.assign({ summon: true, noCharge: true, angle: Math.atan2(e.y - d.y, e.x - d.x) }, opts));
    const done = Math.max(0, hp0 - Math.max(0, e.hp));
    if (done > 0 && o.bloodBond && o.hp > 0) o.hp = Math.min(o.maxHp, o.hp + done * 0.2);
    if (done > 0 && combo(o, 'feral')) d.hp = Math.min(d.maxHp, d.hp + done * 0.5);
}
function turretRate(d, o, base) {
    let r = base;
    if (o.overclockT) r *= 0.7;
    if (combo(o, 'artillery') && dist(d.x, d.y, o.x, o.y) < 220) r *= 0.8;
    if (d.sk === 'gun' && combo(o, 'turret_rage') && o.st.rage > 0) r *= 0.5;
    return r;
}
let prevSummons = [];
function updateSummons(dt) {
    decoys.forEach(d => {
        if (d.kind !== 'sm') return;
        const S = SUMMON[d.sk], o = players.find(q => q.id === d.owner);
        if (!o || o.hp <= 0) { d.hp = 0; return; }
        d.cd -= dt;
        if (S.orbit) { // bay quanh chủ
            d.ph += dt * 2.4;
            const tx = o.x + Math.cos(d.ph) * S.orbit, ty = o.y + Math.sin(d.ph) * S.orbit;
            d.x += (tx - d.x) * Math.min(1, dt * 8); d.y += (ty - d.y) * Math.min(1, dt * 8);
            if (S.heal) { const rate = combo(o, 'medicSoul') ? 9 : S.heal; if (o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + rate * dt); if (Math.random() < 0.15) spark(o.x, o.y, '#4ade80', 1, 60, 0.5, 2); } return; }
            const e = summonTarget(d, o, S.range);
            if (e) { d.angle = Math.atan2(e.y - d.y, e.x - d.x); if (d.cd <= 0) { d.cd = S.rate; bullets.push({ x: d.x, y: d.y, px: d.x, py: d.y, angle: d.angle + (Math.random() - 0.5) * 0.12, speed: 19, damage: S.shoot * (o.dmgMult || 1), life: S.range / (19 * 60), owner: o.id, color: '#fde047', size: 2, knock: 20, bounces: 0, trail: 10 }); AudioSys.playAt('smg', d.x, d.y, 0.08); } }
            return;
        }
        if (S.turret) {
            const e = summonTarget(d, o, S.range);
            if (!e) return;
            const dd = dist(d.x, d.y, e.x, e.y), a = Math.atan2(e.y - d.y, e.x - d.x);
            d.angle += angleDiff(a, d.angle) * Math.min(1, dt * 10);
            if (d.cd > 0) return;
            if (d.sk === 'gun' || d.sk === 'mg') {
                d.cd = turretRate(d, o, S.rate);
                bullets.push({ x: d.x + Math.cos(d.angle) * 16, y: d.y + Math.sin(d.angle) * 16, px: d.x, py: d.y, angle: d.angle + (Math.random() - 0.5) * (S.spread || 0.08), speed: 20, damage: S.shoot * (o.fortress && dist(d.x, d.y, o.x, o.y) < 220 ? 1.25 : 1), life: S.range / (20 * 60), owner: o.id, color: '#fde68a', size: 2.5, knock: 30, bounces: 0, trail: 16 });
                AudioSys.playAt('smg', d.x, d.y, 0.1);
            } else if (d.sk === 'mortar') {
                if (dd < S.minR) return;
                d.cd = turretRate(d, o, S.rate);
                const R = combo(o, 'bigMortar') ? 155 : 110, lead = Math.min(dd, S.range);
                items.push({ x: d.x, y: d.y, type: { id: 'GRENADE', color: '#a3e635' }, angle: 0, spin: 10, vx: Math.cos(a) * lead * 3.1, vy: Math.sin(a) * lead * 3.1, thrown: true, ownerId: o.id, fuse: 1.0, z: 0, vz: 300, blast: [S.lob, R] });
                AudioSys.playAt('shoot_heavy', d.x, d.y, 0.25);
            } else if (d.sk === 'flame') {
                d.cd = turretRate(d, o, S.rate);
                const sp = 9 + Math.random() * 4;
                bullets.push({ x: d.x, y: d.y, px: d.x, py: d.y, angle: d.angle + (Math.random() - 0.5) * 0.3, speed: sp, damage: S.flame, life: S.range / (sp * 60), owner: o.id, color: '#fb923c', size: 6, knock: 10, bounces: 0, flame: true, burn: true, trail: 1, slowHit: combo(o, 'toxicFlame') ? 0.6 : 0 });
            } else if (d.sk === 'tesla') {
                d.cd = turretRate(d, o, S.rate);
                const hit = [e]; let last = e;
                const jumps = 1 + (combo(o, 'overload') ? 2 : 0);
                for (let k = 0; k < jumps; k++) {
                    const nx = enemiesOf(o).filter(q => !hit.includes(q) && dist(q.x, q.y, last.x, last.y) < 220).sort((x, y) => dist(x.x, x.y, last.x, last.y) - dist(y.x, y.y, last.x, last.y))[0];
                    if (!nx) break; hit.push(nx); last = nx;
                }
                let px = d.x, py = d.y;
                hit.forEach(q => { beams.push({ x1: px, y1: py, x2: q.x, y2: q.y, life: 0.15, maxLife: 0.15, color: '#7dd3fc', zig: 1 }); summonHit(d, o, q, S.zap, { slow: 1 }); px = q.x; py = q.y; });
                AudioSys.playAt('rail', d.x, d.y, 0.15);
            }
            return;
        }
        // lính đi bộ: sói, người đá, xương
        const e = summonTarget(d, o, 520);
        let tx = null, ty = null;
        if (e) { tx = e.x; ty = e.y; } else if (dist(d.x, d.y, o.x, o.y) > 90) { tx = o.x; ty = o.y; }
        if (tx !== null) {
            const a = Math.atan2(ty - d.y, tx - d.x), sp = S.sp * (d.sk === 'wolf' && combo(o, 'alphaWolf') ? 1.5 : 1);
            d.angle = a;
            if (!e || dist(d.x, d.y, e.x, e.y) > d.radius + e.radius + 4) { d.x += Math.cos(a) * sp * dt; d.y += Math.sin(a) * sp * dt; resolveCircle(d, d.radius); }
        }
        if (e && d.cd <= 0 && dist(d.x, d.y, e.x, e.y) < d.radius + e.radius + 10) {
            d.cd = S.rate;
            summonHit(d, o, e, S.melee, { knock: d.sk === 'golem' ? 260 : 90 });
            if (S.stun) { e.stun = Math.max(e.stun, S.stun); floatText(e.x, e.y - 30, 'CHOÁNG!', '#a8a29e', 13); }
            slashes.push({ x: d.x, y: d.y, ownerId: o.id, angle: d.angle, range: d.radius + 26, color: '#e5e7eb', width: 6, life: 0.18, maxLife: 0.18, swing: 1, line: false });
            AudioSys.playAt('swing', d.x, d.y, 0.25);
        }
    });
    // lính / ụ bị phá hoặc hết giờ
    prevSummons.forEach(d => {
        if (decoys.includes(d)) return;
        const o = players.find(q => q.id === d.owner); if (!o) return;
        if (SUMMON[d.sk].turret && o.explosiveTurret) { const big = combo(o, 'trapBlast'); explode(d.x, d.y, o.id, big ? 90 : 55, big ? 200 : 120); }
        if (o.summonerSoul && o.hp > 0 && d.hp <= 0) { o.hp = Math.min(o.maxHp, o.hp + 10); (o.skills || []).forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - 2); }); floatText(o.x, o.y - 36, '🔮 +10', '#c4b5fd', 13); }
    });
    prevSummons = decoys.filter(d => d.kind === 'sm');
}
const _upe4 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe4(dt);
    players.forEach(p => { if (p.hp > 0 && p.st) updateDeathCards(p, dt); });
    updateSummons(dt);
};
const _resetRound4 = resetPlayerForRound;
resetPlayerForRound = function (p) { prevSummons = []; return _resetRound4(p); };

/* ============================== VẼ LÍNH & Ụ SÚNG (chạy được ở máy khách nhờ nhãn) ============================== */
const _drawDecoys4 = drawDecoys;
drawDecoys = function (now) {
    const all = decoys.slice(), mine = all.filter(d => SM_BY_LABEL[d.label]);
    if (mine.length) { decoys.length = 0; decoys.push(...all.filter(d => !SM_BY_LABEL[d.label])); }
    _drawDecoys4(now);
    if (!mine.length) return;
    decoys.length = 0; decoys.push(...all);
    mine.forEach(d => {
        if (localId() !== null && d.owner !== localId() && !canSee(d.x, d.y, 12)) return;
        const S = SUMMON[SM_BY_LABEL[d.label]], r = d.radius || S.r;
        ctx.save(); ctx.translate(d.x, d.y);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, r * 0.7, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        if (S.turret) {
            ctx.fillStyle = '#1e293b'; rrect(ctx, -r, -r, r * 2, r * 2, 5); ctx.fill();
            ctx.strokeStyle = d.color; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.save(); ctx.rotate(d.angle || 0); ctx.fillStyle = '#94a3b8'; ctx.fillRect(r * 0.2, -3, r + 6, 6); ctx.restore();
        } else {
            ctx.strokeStyle = d.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI * 2); ctx.stroke();
            if (S.fly) { ctx.globalAlpha = 0.5 + Math.sin(now * 20) * 0.2; ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
        }
        ctx.font = `${Math.round(r * 1.5)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(S.icon, 0, S.turret ? -2 : 0);
        if (d.maxHp && d.hp > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-r, -r - 9, r * 2, 3); ctx.fillStyle = d.color; ctx.fillRect(-r, -r - 9, r * 2 * Math.max(0, d.hp / d.maxHp), 3); }
        ctx.restore();
    });
};
