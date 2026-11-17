/** ==================== KỸ NĂNG (S) · NỘI TẠI (P) · PHỐI HỢP · THẺ CHỈ SỐ ====================
 *  Hiệp 1, 3, 5, 7: chọn "định hình" (S hoặc P). Tối đa 2 kỹ năng S (2 nút).
 *  Hiệp 2, 4, 6: chọn chỉ số / lợi thế nhỏ.
 *  Hai thẻ có liên kết sẽ tạo PHỐI HỢP (mạnh lên + đánh đổi). Mỗi thẻ phối hợp được tối đa 3 lần.
 */
const zones = [], turrets = [], mines = [], decoys = [];

const CARDS = {};
function defS(id, icon, name, cd, ai, desc, cast, range) { CARDS[id] = { id, kind: 'S', icon, name, cd, ai, desc, cast, range }; }
function defP(id, icon, name, desc, apply) { CARDS[id] = { id, kind: 'P', icon, name, desc, apply }; }
const has = (p, id) => !!(p && p.cardSet && p.cardSet.has(id));
const combo = (p, id) => !!(p && p.comboSet && p.comboSet.has(id));

function freshStatus() {
    return { invis: 0, haste: 0, rage: 0, shield: 0, shieldT: 0, slow: 0, burn: 0, burnBy: -1, mark: 0, reveal: 0, reflect: 0, invuln: 0, empower: 0, heal: 0, healRate: 0, ambush: 0, focus: 0, pendingShock: 0 };
}
function aimDir(p) { return p.angle; }
function moveDir(p) { return p.moveDir !== undefined ? p.moveDir : p.angle; }
function enemyTargetable(p, maxD) {
    const e = enemyOf(p);
    return e && e.hp > 0 && targetable(p, e) && dist(p.x, p.y, e.x, e.y) < maxD ? e : null;
}
function skillText(p, text, color) { floatText(p.x, p.y - 34, text, color || '#e9d5ff', 15); }

/** Ném vật kỹ năng (khói, bom lửa, hố đen) tới gần địch hoặc về phía trước */
function throwSkillItem(p, id, color, maxD) {
    const e = enemyTargetable(p, maxD + 100);
    const ang = e ? Math.atan2(e.y - p.y, e.x - p.x) : aimDir(p);
    const d = Math.max(80, Math.min(maxD, e ? dist(p.x, p.y, e.x, e.y) : maxD * 0.7));
    items.push({ x: p.x, y: p.y, type: { id, color }, skill: true, angle: 0, spin: 10, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 0.6, z: 0, vz: 240 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
}
function landSkillItem(it) {
    const owner = players.find(q => q.id === it.ownerId);
    if (it.type.id === 'SMOKE') {
        let r = 135, t = 6;
        if (combo(owner, 'smoke_fire')) r *= 0.8;
        if (combo(owner, 'smoke_invis')) t = 3;
        zones.push({ type: 'smoke', x: it.x, y: it.y, r, t, maxT: t, owner: it.ownerId, tick: 0 });
        smoke(it.x, it.y, 14, 'rgba(180,190,210,0.45)', 30); AudioSys.playAt('whoosh', it.x, it.y, 0.4);
    } else if (it.type.id === 'FIREBOMB') {
        let r = 110, t = 4;
        if (combo(owner, 'fire_pyro')) { r *= 1.5; t = 6; }
        zones.push({ type: 'fire', x: it.x, y: it.y, r, t, maxT: t, owner: it.ownerId, tick: 0 });
        explosionFx(it.x, it.y, 90); AudioSys.playAt('explosion', it.x, it.y, 0.25);
    } else if (it.type.id === 'GRAVITY') {
        zones.push({ type: 'gravity', x: it.x, y: it.y, r: 175, t: 2.5, maxT: 2.5, owner: it.ownerId, tick: 0 });
        ring(it.x, it.y, 175, 10, '#a855f7', 0.5, 6); AudioSys.playAt('trick', it.x, it.y, 0.4);
    }
}

/** Sóng chấn quanh một điểm */
function shockwave(x, y, ownerId, r = 150, dmg = 25) {
    ring(x, y, 10, r, '#fde68a', 0.35, 8); spark(x, y, '#fde68a', 18, 360, 0.4, 3);
    addShake(8); AudioSys.playAt('slam', x, y, 0.35);
    const owner = players.find(q => q.id === ownerId);
    players.forEach(e => {
        if (e.id === ownerId || e.hp <= 0) return;
        const d = dist(x, y, e.x, e.y);
        if (d < r + e.radius) {
            const dd = combo(owner, 'freeze_shock') && e.st.slow > 0 ? dmg * 2 : dmg;
            if (dd > dmg) floatText(e.x, e.y - 36, 'VỠ BĂNG!', '#93c5fd', 16);
            dealDamage(e, dd, ownerId, { angle: Math.atan2(e.y - y, e.x - x), knock: 720 });
            e.stun = Math.max(e.stun, 0.25);
        }
    });
    obstacles.slice().forEach(o => { if (o.wood && dist(x, y, o.x + o.w / 2, o.y + o.h / 2) < r) damageObstacle(o, 40); });
}

function placeTempWall(cx, cy, horizontal, len, t, reflect) {
    const w = horizontal ? len : 24, h = horizontal ? 24 : len;
    const o = { x: cx - w / 2, y: cy - h / 2, w, h, wood: false, temp: t, ice: true, reflect: !!reflect };
    if (players.some(p => p.hp > 0 && p.x > o.x - p.radius && p.x < o.x + o.w + p.radius && p.y > o.y - p.radius && p.y < o.y + o.h + p.radius)) {
        // không đè lên người — đẩy tường ra xa thêm một chút
        return null;
    }
    obstacles.push(o); return o;
}

/* ============================== 21 KỸ NĂNG (S) ============================== */
defS('invis', '🫥', 'Vô Hình', 12, 'escape', 'Tàng hình 4 giây. Vẫn để lại dấu chân. Tấn công sẽ hiện hình.', p => {
    p.st.invis = combo(p, 'dash_invis') ? 3 : 4;
    smoke(p.x, p.y, 8, 'rgba(160,140,220,0.35)', 16); AudioSys.playAt('trick', p.x, p.y, 0.3);
});
defS('dash', '💨', 'Lướt', 4, 'engage', 'Lướt nhanh theo hướng đang chạy.', p => {
    p.dashTime = 0.2; p.dashAngle = moveDir(p);
    if (combo(p, 'dash_invis') && p.st.invis > 0) p.st.invis += 1;
    smoke(p.x, p.y, 4, 'rgba(200,220,255,0.3)', 10); AudioSys.playAt('whoosh', p.x, p.y, 0.3);
});
defS('smoke', '🌫️', 'Bom Khói', 14, 'escape', 'Ném bom khói: ai đứng trong khói sẽ khuất tầm nhìn đối thủ.', p => throwSkillItem(p, 'SMOKE', '#94a3b8', 320));
defS('blink', '✨', 'Dịch Chuyển', 9, 'escape', 'Dịch chuyển tức thời 260 đơn vị về phía trước, xuyên tường.', p => {
    const a = moveDir(p);
    smoke(p.x, p.y, 6, 'rgba(176,107,255,0.35)', 14);
    for (let d = 260; d > 20; d -= 20) {
        const nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d;
        if (nx > p.radius && ny > p.radius && nx < MAP_W - p.radius && ny < MAP_H - p.radius && !pointInObstacle(nx, ny, p.radius)) { p.x = nx; p.y = ny; break; }
    }
    ring(p.x, p.y, 5, 60, '#c084fc', 0.35); AudioSys.playAt('trick', p.x, p.y, 0.35);
    if (combo(p, 'blink_invis')) p.st.invis = Math.max(p.st.invis, 1.5);
    if (combo(p, 'blink_reload')) { const w = getCurrentWeapon(p); if (w.ammo !== undefined) w.ammo = Math.min(WEAPONS[w.id].ammo, w.ammo + Math.ceil(WEAPONS[w.id].ammo * 0.5)); }
});
defS('heal', '💖', 'Hồi Phục', 16, 'heal', 'Hồi 40 máu trong 2 giây.', p => {
    const total = combo(p, 'regen_heal') ? 30 : 40;
    p.st.heal = 2; p.st.healRate = total / 2;
    ring(p.x, p.y, 5, 50, '#4ade80', 0.5); AudioSys.playAt('pickup', p.x, p.y, 0.3);
});
defS('shieldS', '🔰', 'Khiên Năng Lượng', 14, 'defend', 'Tạo khiên hấp thụ 60 sát thương trong 3 giây.', p => {
    p.st.shield = 60; p.st.shieldT = 3;
    if (combo(p, 'heal_shield')) { p.hp = Math.min(p.maxHp, p.hp + 25); floatText(p.x, p.y - 20, '+25', '#4ade80', 14); }
    AudioSys.playAt('block', p.x, p.y, 0.4);
});
defS('rage', '🔥', 'Cuồng Bạo', 15, 'buff', '4 giây: +40% sát thương, +33% tốc độ đánh.', p => {
    p.st.rage = 4; ring(p.x, p.y, 5, 70, '#ef4444', 0.4); AudioSys.playAt('crit', p.x, p.y, 0.4);
});
defS('trap', '🪤', 'Bẫy Gai', 10, 'place', 'Đặt bẫy ẩn: địch dẫm phải mất 40 máu và bị giữ chân 1 giây (tối đa 3 bẫy).', p => {
    const mine = mines.filter(m => m.owner === p.id);
    if (mine.length >= 3) mines.splice(mines.indexOf(mine[0]), 1);
    mines.push({ x: p.x, y: p.y, owner: p.id, arm: 0.6 });
    AudioSys.playAt('ui', p.x, p.y, 0.3);
});
defS('turret', '🗼', 'Tháp Pháo', 20, 'place', 'Dựng tháp pháo tự bắn địch trong 8 giây.', p => {
    const a = aimDir(p), x = p.x + Math.cos(a) * 34, y = p.y + Math.sin(a) * 34;
    turrets.push({ x, y, owner: p.id, t: 8, fire: 0.3, angle: a, color: p.color });
    if (combo(p, 'turret_wall')) placeTempWall(x + Math.cos(a) * 40, y + Math.sin(a) * 40, Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)), 70, 8, false);
    AudioSys.playAt('slam', x, y, 0.25);
});
defS('hook', '🪝', 'Móc Câu', 11, 'engage', 'Phóng móc: trúng địch sẽ kéo về phía bạn và làm choáng.', p => {
    const a = aimDir(p);
    bullets.push({ x: p.x, y: p.y, px: p.x, py: p.y, angle: a, speed: 22, damage: combo(p, 'hook_vampire') ? 25 : 15, life: 0.55, owner: p.id, color: '#facc15', size: 6, knock: 0, bounces: 0, hook: true, trail: 60 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.4);
}, 520);
defS('shock', '💥', 'Sóng Chấn', 10, 'engage', 'Phát sóng chấn quanh mình: 25 sát thương và hất văng.', p => shockwave(p.x, p.y, p.id), 150);
defS('wall', '🧊', 'Tường Băng', 12, 'place', 'Dựng tường băng chắn trước mặt trong 5 giây.', p => {
    const a = aimDir(p), cx = p.x + Math.cos(a) * 60, cy = p.y + Math.sin(a) * 60;
    const horizontal = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a));
    const o = placeTempWall(cx, cy, horizontal, 150, 5, combo(p, 'wall_reflect'));
    if (o && combo(p, 'wall_trap')) {
        const ends = horizontal ? [[o.x - 20, cy], [o.x + o.w + 20, cy]] : [[cx, o.y - 20], [cx, o.y + o.h + 20]];
        ends.forEach(([x, y]) => mines.push({ x, y, owner: p.id, arm: 0.6 }));
    }
    AudioSys.playAt('block', cx, cy, 0.4);
});
defS('decoy', '👥', 'Phân Thân', 14, 'escape', 'Tạo phân thân chạy về phía trước 4 giây, thu hút đòn ngắm tự động của địch.', p => {
    const fast = combo(p, 'decoy_haste');
    decoys.push({ x: p.x, y: p.y, angle: moveDir(p), speed: fast ? 360 : 190, owner: p.id, t: 4, hp: 40, color: p.color, radius: p.radius, label: p.label });
    if (fast) p.st.haste = Math.max(p.st.haste, 1.5);
    smoke(p.x, p.y, 5, 'rgba(200,200,220,0.3)', 12); AudioSys.playAt('trick', p.x, p.y, 0.3);
});
defS('flare', '🎆', 'Pháo Sáng', 12, 'reveal', 'Bắn pháo sáng: lộ vị trí địch 3 giây (xuyên sương mù) và địch nhận thêm 15% sát thương.', p => {
    const e = enemyOf(p); if (!e) return;
    const t = combo(p, 'flare_hunter') ? 6 : 3;
    e.st.reveal = t; e.st.mark = t;
    ring(e.x, e.y, 10, 120, '#fde047', 0.6, 6); flash('#fde047', 0.08); AudioSys.play('legend', 0.25);
});
defS('haste', '⚡', 'Tăng Tốc', 12, 'buff', '+50% tốc chạy trong 3 giây.', p => {
    p.st.haste = 3;
    if (combo(p, 'haste_dash')) { const s = p.skills.find(s => s.id === 'dash'); if (s) s.cd = 0; }
    if (combo(p, 'haste_silent')) p.st.ambush = 3;
    AudioSys.playAt('go', p.x, p.y, 0.2);
});
defS('freeze', '❄️', 'Băng Phong', 13, 'engage', 'Bắn cầu băng: 20 sát thương, làm chậm 50% trong 2.5 giây.', p => {
    bullets.push({ x: p.x, y: p.y, px: p.x, py: p.y, angle: aimDir(p), speed: 17, damage: 20, life: 1.2, owner: p.id, color: '#93c5fd', size: 7, knock: 80, bounces: 0, freeze: true, trail: 40 });
    AudioSys.playAt('rail', p.x, p.y, 0.15);
}, 600);
defS('firebomb', '🧨', 'Bom Lửa', 12, 'engage', 'Ném bom lửa tạo biển lửa 4 giây (25 sát thương/giây).', p => throwSkillItem(p, 'FIREBOMB', '#f97316', 360), 420);
defS('gravity', '🌀', 'Hố Đen', 16, 'engage', 'Ném hố đen hút địch vào tâm trong 2.5 giây.', p => throwSkillItem(p, 'GRAVITY', '#a855f7', 380), 450);
defS('reflect', '🪞', 'Phản Xạ', 12, 'defend', 'Phản lại mọi viên đạn bắn vào bạn trong 1.2 giây.', p => {
    p.st.reflect = combo(p, 'sword_reflect') ? 2.4 : 1.2; AudioSys.playAt('block', p.x, p.y, 0.4);
});
defS('reload', '🔄', 'Nạp Đạn Thần Tốc', 15, 'buff', 'Nạp đầy vũ khí đang cầm; 3 đòn kế tiếp +50% sát thương.', p => {
    const w = getCurrentWeapon(p);
    if (w.ammo !== undefined) w.ammo = WEAPONS[w.id].ammo;
    if (w.durability !== undefined && w.durability < 900) w.durability = w.maxDurability;
    p.st.empower = 3; AudioSys.playAt('pickup', p.x, p.y, 0.3);
});
defS('storm', '🌧️', 'Mưa Đạn', 15, 'engage', 'Xả 16 viên đạn ra mọi hướng (10 sát thương mỗi viên).', p => {
    const bouncy = combo(p, 'storm_ricochet'), n = bouncy ? 12 : 16;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        bullets.push({ x: p.x, y: p.y, px: p.x, py: p.y, angle: a, speed: 18, damage: 10, life: 0.8, owner: p.id, color: '#fde68a', size: 3, knock: 60, bounces: bouncy ? 3 : 0, storm: true, trail: 22 });
    }
    AudioSys.playAt('shotgun', p.x, p.y, 0.3); addShake(5);
}, 260);

/* ============================== 21 NỘI TẠI (P) ============================== */
defP('aimshot', '🎯', 'Nhắm Bắn', 'Kiểu Brawl Stars: có vạch ngắm, đạn chụm hơn. Trúng 5 đòn sẽ nạp SIÊU ĐÒN cực mạnh.', p => { p.aimshot = true; p.spreadMult *= 0.45; p.superNeed = combo(p, 'aim_eagle') ? 3 : 5; });
defP('nomind', '🗡️', 'Kiếm Vô Niệm', 'Cầm vũ khí cận chiến sẽ tự phản đạn liên tục, nhưng mỗi lần phản kiếm mòn thêm.', p => { p.noMind = true; });
defP('vampire', '🦇', 'Hút Máu', 'Hồi 25% sát thương gây ra.', p => { p.vampire = true; });
defP('thorns', '🌵', 'Giáp Gai', 'Phản 30% sát thương nhận vào.', p => { p.thorns = true; });
defP('titan', '🦍', 'Khổng Lồ', '+60 máu tối đa, thân to hơn.', p => { p.maxHp += 60; p.radius += 5; });
defP('swift', '🐆', 'Nhanh Nhẹn', '+20% tốc chạy.', p => { p.moveMult *= 1.2; });
defP('berserk', '😡', 'Cuồng Nộ', 'Càng ít máu càng mạnh (tối đa +100% sát thương).', p => { p.berserk = true; });
defP('ricochet', '🏓', 'Đạn Nảy', 'Đạn nảy khỏi tường 2 lần.', p => { p.bounces = 2; });
defP('martyr', '💣', 'Tử Vì Đạo', 'Khi chết rơi 3 quả lựu đạn đã rút chốt.', p => { p.martyr = true; });
defP('regen', '💚', 'Tái Tạo', 'Hồi 5 máu/giây khi 3 giây không bị đánh.', p => { p.regen = true; p.regenDelay = combo(p, 'regen_heal') ? 1.5 : 3; });
defP('scavenger', '🧲', 'Kẻ Nhặt Rác', 'Hút hòm thính xung quanh, hòm hỗ trợ hồi gấp đôi.', p => { p.magnet = true; p.scavenger = true; });
defP('eagle', '🦅', 'Mắt Đại Bàng', '+30% tầm nhìn trong sương mù, +15% sát thương khi bắn xa (>300).', p => { p.eagle = true; });
defP('brawler', '🥊', 'Võ Sĩ', 'Đòn cận chiến +50% sát thương.', p => { p.meleeMult = 1.5; });
defP('armorP', '🦺', 'Áo Giáp', 'Mỗi hiệp khởi đầu với 80 giáp.', p => { p.maxArmor = Math.max(p.maxArmor, 80); });
defP('explosive', '☄️', 'Đạn Nổ', 'Cứ phát bắn thứ 5 sẽ phát nổ.', p => { p.blastRounds = true; });
defP('silent', '🐾', 'Bước Chân Mèo', 'Không để lại dấu chân, không phát tiếng bước chân.', p => { p.silent = true; });
defP('laststand', '🛡️', 'Bất Khuất', 'Mỗi hiệp 1 lần: đòn chí mạng chỉ để lại 1 máu và bất tử 1.5 giây.', p => { p.lastStand = true; });
defP('hunter', '🐺', 'Thợ Săn', 'Thấy dấu chân địch lâu gấp đôi, +10% sát thương lên địch dưới 50% máu.', p => { p.hunter = true; });
defP('quick', '🤹', 'Tay Nhanh', '+25% tốc độ đánh, đổi vũ khí tức thì.', p => { p.fireRateMult *= 0.8; p.quickSwap = true; });
defP('pyro', '🔥', 'Hỏa Thần', 'Đòn đánh gây bỏng (8/giây trong 2 giây). Miễn nhiễm lửa.', p => { p.pyro = true; });
defP('meditate', '🧘', 'Thiền Định', 'Hồi chiêu kỹ năng nhanh hơn 25%.', p => { p.cdMult *= 0.75; });

/* ============================== 36 PHỐI HỢP ============================== */
const COMBOS = [
    { id: 'smoke_invis', a: 'smoke', b: 'invis', name: 'Khói Mù Vô Ảnh', desc: 'Đứng trong khói của mình sẽ tàng hình. Đổi lại khói chỉ còn 3 giây.' },
    { id: 'dash_aim', a: 'dash', b: 'aimshot', name: 'Lướt Bắn', desc: 'Mỗi đòn tấn công kèm một cú lướt nhỏ. Lướt (S) hồi chiêu +2 giây.' },
    { id: 'sword_reflect', a: 'nomind', b: 'reflect', name: 'Kiếm Thánh', desc: 'Phản Xạ kéo dài gấp đôi, kiếm không mòn khi đang Phản Xạ.' },
    { id: 'dash_invis', a: 'dash', b: 'invis', name: 'Bóng Ma Lướt', desc: 'Lướt khi tàng hình cộng thêm 1 giây. Vô Hình gốc giảm còn 3 giây.' },
    { id: 'smoke_fire', a: 'smoke', b: 'firebomb', name: 'Khói Độc', desc: 'Khói gây 10 sát thương/giây lên địch. Bán kính khói -20%.' },
    { id: 'hook_shock', a: 'hook', b: 'shock', name: 'Kéo Đập', desc: 'Móc trúng địch sẽ tự phát Sóng Chấn khi kéo về. Móc câu hồi chiêu +3 giây.' },
    { id: 'turret_rage', a: 'turret', b: 'rage', name: 'Tháp Cuồng', desc: 'Khi Cuồng Bạo, tháp pháo bắn nhanh gấp đôi.' },
    { id: 'wall_trap', a: 'wall', b: 'trap', name: 'Pháo Đài', desc: 'Tường Băng đặt thêm 2 bẫy gai ở hai đầu. Tường hồi chiêu +3 giây.' },
    { id: 'blink_invis', a: 'blink', b: 'invis', name: 'Ảo Ảnh', desc: 'Dịch Chuyển xong được tàng hình 1.5 giây.' },
    { id: 'heal_shield', a: 'heal', b: 'shieldS', name: 'Thánh Quang', desc: 'Bật khiên hồi ngay 25 máu. Hồi Phục hồi chiêu +3 giây.' },
    { id: 'freeze_shock', a: 'freeze', b: 'shock', name: 'Vỡ Băng', desc: 'Sóng Chấn gây gấp đôi sát thương lên địch đang bị làm chậm.' },
    { id: 'fire_pyro', a: 'firebomb', b: 'pyro', name: 'Địa Ngục', desc: 'Biển lửa to hơn 50% và cháy 6 giây.' },
    { id: 'grav_fire', a: 'gravity', b: 'firebomb', name: 'Lò Thiêu', desc: 'Hố đen thiêu đốt kẻ bị hút. Hố Đen hồi chiêu +4 giây.' },
    { id: 'grav_shock', a: 'gravity', b: 'shock', name: 'Siêu Tân Tinh', desc: 'Hố đen kết thúc bằng một vụ nổ chấn động.' },
    { id: 'decoy_haste', a: 'decoy', b: 'haste', name: 'Phân Thân Tốc Độ', desc: 'Phân thân chạy nhanh gấp đôi và bạn được tăng tốc 1.5 giây.' },
    { id: 'decoy_martyr', a: 'decoy', b: 'martyr', name: 'Bom Thế Thân', desc: 'Phân thân phát nổ khi bị phá hoặc hết giờ.' },
    { id: 'flare_hunter', a: 'flare', b: 'hunter', name: 'Truy Sát', desc: 'Pháo Sáng lộ địch 6 giây, địch bị đánh dấu nhận +25% sát thương.' },
    { id: 'flare_eagle', a: 'flare', b: 'eagle', name: 'Mắt Thần', desc: 'Pháo Sáng hồi chiêu nhanh hơn 40%.' },
    { id: 'haste_dash', a: 'haste', b: 'dash', name: 'Tia Chớp', desc: 'Tăng Tốc làm mới ngay hồi chiêu Lướt.' },
    { id: 'haste_silent', a: 'haste', b: 'silent', name: 'Sát Thủ Bóng Đêm', desc: 'Trong lúc Tăng Tốc, đòn đầu tiên trúng địch +30% sát thương.' },
    { id: 'reload_explosive', a: 'reload', b: 'explosive', name: 'Băng Đạn Nổ', desc: '3 đòn cường hóa sau khi nạp đạn đều phát nổ.' },
    { id: 'reload_quick', a: 'reload', b: 'quick', name: 'Thợ Súng', desc: 'Nạp Đạn Thần Tốc hồi chiêu nhanh hơn 40%.' },
    { id: 'storm_ricochet', a: 'storm', b: 'ricochet', name: 'Bão Nảy', desc: 'Mưa đạn nảy 3 lần nhưng chỉ còn 12 viên.' },
    { id: 'storm_vampire', a: 'storm', b: 'vampire', name: 'Huyết Vũ', desc: 'Mỗi viên Mưa Đạn trúng địch hồi thêm 8 máu.' },
    { id: 'aim_eagle', a: 'aimshot', b: 'eagle', name: 'Xạ Thủ', desc: 'Siêu đòn chỉ cần 3 lần trúng thay vì 5.' },
    { id: 'aim_explosive', a: 'aimshot', b: 'explosive', name: 'Siêu Đạn Nổ', desc: 'Siêu đòn phát nổ. Đạn Nổ thường cần 7 phát thay vì 5.' },
    { id: 'sword_brawler', a: 'nomind', b: 'brawler', name: 'Đao Kiếm Như Mộng', desc: 'Tầm chém +25%; đạn phản bởi kiếm bay thẳng vào địch.' },
    { id: 'thorns_armor', a: 'thorns', b: 'armorP', name: 'Giáp Gai Thép', desc: 'Khi còn giáp, phản 60% sát thương.' },
    { id: 'titan_last', a: 'titan', b: 'laststand', name: 'Bất Tử Thần', desc: 'Bất Khuất hồi 30% máu và bất tử 3 giây. Tốc chạy -10%.' },
    { id: 'regen_heal', a: 'regen', b: 'heal', name: 'Sinh Mệnh', desc: 'Tái Tạo bắt đầu sau 1.5 giây. Hồi Phục chỉ còn 30 máu.' },
    { id: 'trap_hunter', a: 'trap', b: 'hunter', name: 'Bẫy Săn', desc: 'Địch dẫm bẫy sẽ bị lộ vị trí 4 giây.' },
    { id: 'wall_reflect', a: 'wall', b: 'reflect', name: 'Gương Băng', desc: 'Tường Băng phản lại đạn.' },
    { id: 'hook_vampire', a: 'hook', b: 'vampire', name: 'Móc Hút Máu', desc: 'Móc trúng gây 25 sát thương và hút 25 máu.' },
    { id: 'shield_thorns', a: 'shieldS', b: 'thorns', name: 'Khiên Gai', desc: 'Khiên vỡ sẽ nổ gây 40 sát thương xung quanh.' },
    { id: 'blink_reload', a: 'blink', b: 'reload', name: 'Dịch Chuyển Nạp', desc: 'Mỗi lần Dịch Chuyển nạp lại 50% đạn.' },
    { id: 'turret_wall', a: 'turret', b: 'wall', name: 'Lô Cốt', desc: 'Tháp pháo dựng kèm một tấm khiên băng phía trước.' }
];
const COMBOS_OF = {};
COMBOS.forEach(c => { (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });

/** Hồi chiêu thực tế của một kỹ năng với người chơi */
function skillCooldown(p, id) {
    let cd = CARDS[id].cd * (p.cdMult || 1);
    if (id === 'dash' && combo(p, 'dash_aim')) cd += 2;
    if (id === 'hook' && combo(p, 'hook_shock')) cd += 3;
    if (id === 'wall' && combo(p, 'wall_trap')) cd += 3;
    if (id === 'heal' && combo(p, 'heal_shield')) cd += 3;
    if (id === 'gravity' && combo(p, 'grav_fire')) cd += 4;
    if (id === 'flare' && combo(p, 'flare_eagle')) cd *= 0.6;
    if (id === 'reload' && combo(p, 'reload_quick')) cd *= 0.6;
    return cd;
}

/* ============================== THẺ CHỈ SỐ (hiệp 2, 4, 6) ============================== */
const STAT_CARDS = [
    { id: 'hp', icon: '❤️', name: '+25 Máu', desc: 'Tăng 25 máu tối đa (vĩnh viễn).', apply: p => { p.maxHp += 25; } },
    { id: 'dmg', icon: '🗡️', name: '+10% Sát Thương', desc: 'Vĩnh viễn.', apply: p => { p.dmgMult *= 1.1; } },
    { id: 'spd', icon: '👟', name: '+8% Tốc Chạy', desc: 'Vĩnh viễn.', apply: p => { p.moveMult *= 1.08; } },
    { id: 'cdr', icon: '⏳', name: '-12% Hồi Chiêu', desc: 'Kỹ năng hồi nhanh hơn (vĩnh viễn).', apply: p => { p.cdMult *= 0.88; } },
    { id: 'rof', icon: '🔫', name: '+13% Tốc Đánh', desc: 'Vĩnh viễn.', apply: p => { p.fireRateMult *= 0.87; } },
    { id: 'arm', icon: '🦺', name: '+30 Giáp', desc: 'Mỗi hiệp khởi đầu thêm 30 giáp (vĩnh viễn).', apply: p => { p.maxArmor += 30; } },
    { id: 'r_legend', round: true, icon: '🌪️', name: 'Vũ Khí Huyền Thoại', desc: 'Hiệp này: khởi đầu với một vũ khí huyền thoại.', apply: p => { p.inventory[1] = { ...WEAPONS[['MINIGUN', 'RAILGUN'][Math.floor(Math.random() * 2)]] }; } },
    { id: 'r_kit', round: true, icon: '🎒', name: 'Bộ Đồ Nghề', desc: 'Hiệp này: khởi đầu với Shotgun + 3 lựu đạn.', apply: p => { p.inventory = [{ ...WEAPONS.SHOTGUN }, { ...WEAPONS.GRENADE }]; } },
    { id: 'r_reveal', round: true, icon: '📡', name: 'Định Vị', desc: 'Hiệp này: địch bị lộ vị trí 8 giây đầu.', start: (p, e) => { e.st.reveal = 11; } },
    { id: 'r_focus', round: true, icon: '🧠', name: 'Tập Trung', desc: 'Hiệp này: 15 giây đầu kỹ năng hồi nhanh gấp đôi.', start: p => { p.st.focus = 18; } },
    { id: 'r_armor', round: true, icon: '🛡️', name: 'Giáp Dày', desc: 'Hiệp này: +80 giáp.', apply: p => { p.maxArmor += 80; } },
    { id: 'r_zone', round: true, icon: '☂️', name: 'Áo Chống Bo', desc: 'Hiệp này: miễn nhiễm sát thương vòng bo.', apply: p => { p.zoneImmune = true; } },
    { id: 'r_haste', round: true, icon: '🏃', name: 'Xuất Phát Sớm', desc: 'Hiệp này: tăng tốc 6 giây đầu trận.', start: p => { p.st.haste = 9; } },
    { id: 'r_vamp', round: true, icon: '🩸', name: 'Khát Máu', desc: 'Hiệp này: hồi 15% sát thương gây ra.', apply: p => { p.roundVamp = 0.15; } }
];
const STAT_BY_ID = {}; STAT_CARDS.forEach(c => STAT_BY_ID[c.id] = c);

/** Gắn bộ thẻ vào người chơi lúc đầu hiệp (sau khi đã reset chỉ số gốc) */
function applyBuild(p) {
    p.cardSet = new Set(p.build);
    p.comboSet = new Set(COMBOS.filter(c => p.cardSet.has(c.a) && p.cardSet.has(c.b)).map(c => c.id));
    p.combos = [...p.comboSet];
    p.st = freshStatus();
    p.skills = p.build.filter(id => CARDS[id].kind === 'S').map(id => ({ id, cd: 0 }));
    p.superCharge = 0; p.superNeed = 5; p.lastStandUsed = false;
    p.build.forEach(id => { if (CARDS[id].kind === 'P') CARDS[id].apply(p); });
    if (combo(p, 'titan_last')) p.moveMult *= 0.9;
    p.minor.forEach(id => STAT_BY_ID[id].apply && STAT_BY_ID[id].apply(p));
    p.roundPerks.forEach(id => STAT_BY_ID[id].apply && STAT_BY_ID[id].apply(p));
}
function roundStartPerks() {
    players.forEach(p => p.roundPerks.forEach(id => STAT_BY_ID[id].start && STAT_BY_ID[id].start(p, enemyOf(p))));
}

/** Kích hoạt kỹ năng ở ô slot */
function castSkill(p, slot) {
    const s = p.skills && p.skills[slot];
    if (!s) return;
    if (s.cd > 0) { if (!p.isBot) floatText(p.x, p.y - 30, `${Math.ceil(s.cd)}s`, '#94a3b8', 12); return; }
    const card = CARDS[s.id];
    card.cast(p, enemyOf(p));
    s.cd = skillCooldown(p, s.id);
    p.stats.skills = (p.stats.skills || 0) + 1;
    skillText(p, card.icon + ' ' + card.name);
}

/** Ai được coi là "nhìn thấy / ngắm được" người khác */
function inSmoke(x, y) { return zones.find(z => z.type === 'smoke' && dist(x, y, z.x, z.y) < z.r); }
function targetable(viewer, t) {
    if (!t || t.hp <= 0) return false;
    if (t.st && t.st.reveal > 0) return true;
    const d = dist(viewer.x, viewer.y, t.x, t.y);
    if (t.st && t.st.invis > 0 && d > 60) return false;
    if (t.ghostT > 1 && d > 140) return false;
    const sm = inSmoke(t.x, t.y);
    if (sm && d > 60 && !(dist(viewer.x, viewer.y, sm.x, sm.y) < sm.r)) return false;
    if (fogGameplay() && !canSeeFrom(viewer.x, viewer.y, t.x, t.y, t.radius, viewer)) return false;
    return true;
}
function fogGameplay() { return settings.mode === 'online' || (settings.mode === 'bot' && settings.fow); }

/** Mục tiêu ngắm tự động: địch hoặc phân thân của địch (gần hơn thì ưu tiên) */
function aimTargetFor(p, range) {
    let best = null, bd = range;
    const e = enemyOf(p);
    if (e && targetable(p, e)) { const d = dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    decoys.forEach(dc => { if (dc.owner !== p.id) { const d = dist(p.x, p.y, dc.x, dc.y); if (d < bd && (!fogGameplay() || canSeeFrom(p.x, p.y, dc.x, dc.y, 0, p))) { bd = d; best = dc; } } });
    return best;
}

/** Sau mỗi đòn tấn công */
function onAttack(p) {
    if (p.st.invis > 0) { p.st.invis = 0; floatText(p.x, p.y - 30, 'Lộ diện!', '#c084fc', 12); }
    if (combo(p, 'dash_aim') && p.dashTime <= 0) { p.dashTime = 0.07; p.dashAngle = moveDir(p); }
}

/** Cập nhật mỗi khung hình (chỉ chạy ở máy chủ / chơi offline) */
function updateAbilities(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) return;
        const st = p.st;
        ['invis', 'haste', 'rage', 'slow', 'mark', 'reveal', 'reflect', 'invuln', 'ambush', 'focus'].forEach(k => { if (st[k] > 0) st[k] = Math.max(0, st[k] - dt); });
        if (st.shieldT > 0) { st.shieldT -= dt; if (st.shieldT <= 0) st.shield = 0; }
        if (st.heal > 0) { st.heal -= dt; p.hp = Math.min(p.maxHp, p.hp + st.healRate * dt); if (Math.random() < 0.3) spark(p.x, p.y, '#4ade80', 1, 60, 0.5, 2); }
        if (st.burn > 0) {
            st.burn -= dt; st.burnTick = (st.burnTick || 0) + dt;
            if (Math.random() < 0.5) particles.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y, vx: 0, vy: -60, life: 0.4, maxLife: 0.4, color: '#fb923c', size: 4, glow: true });
            if (st.burnTick > 0.25) { st.burnTick = 0; dealDamage(p, 2, st.burnBy, { zone: true, raw: true }); }
        }
        if (st.pendingShock > 0) { st.pendingShock -= dt; if (st.pendingShock <= 0) shockwave(p.x, p.y, p.id); }
        // hồi chiêu
        const rate = st.focus > 0 ? 2 : 1;
        p.skills.forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - dt * rate); });
        // Kiếm Vô Niệm: tự phản đạn khi cầm vũ khí cận chiến
        const w = getCurrentWeapon(p);
        if (p.noMind && w.type === 'MELEE' && w.id !== 'NONE') {
            const e = enemyOf(p);
            bullets.forEach(b => {
                if (b.owner === p.id || b.explosive || b.hook) return;
                if (dist(b.x, b.y, p.x, p.y) > p.radius + 46) return;
                if (Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 1.4) return;
                b.owner = p.id; b.life = 1.2; b.color = '#7dd3fc';
                b.angle = combo(p, 'sword_brawler') && e ? Math.atan2(e.y - b.y, e.x - b.x) : b.angle + Math.PI;
                spark(b.x, b.y, '#7dd3fc', 4, 180, 0.25, 2); AudioSys.playAt('block', p.x, p.y, 0.2);
                if (!(combo(p, 'sword_reflect') && st.reflect > 0)) reduceDurability(p, w, 1);
            });
        }
    });

    // ---- Vùng hiệu ứng ----
    for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        if (z.type === 'lava') {
            const on = lavaActive(z);
            z.tick += dt;
            if (on && z.tick > 0.25) {
                z.tick = 0;
                players.forEach(p => { if (p.hp > 0 && !p.pyro && dist(p.x, p.y, z.x, z.y) < z.r) { dealDamage(p, 5, -1, { zone: true, raw: true }); p.st.burn = Math.max(p.st.burn, 1); p.st.burnBy = -1; } });
            }
            continue;
        }
        z.t -= dt; z.tick += dt;
        const owner = players.find(q => q.id === z.owner);
        if (z.type === 'smoke') {
            if (owner && combo(owner, 'smoke_invis') && dist(owner.x, owner.y, z.x, z.y) < z.r) owner.st.invis = Math.max(owner.st.invis, 0.25);
            if (z.tick > 0.25 && owner && combo(owner, 'smoke_fire')) {
                z.tick = 0;
                players.forEach(p => { if (p.id !== z.owner && p.hp > 0 && dist(p.x, p.y, z.x, z.y) < z.r) dealDamage(p, 2.5, z.owner, { zone: true }); });
            }
        } else if (z.type === 'fire') {
            if (z.tick > 0.25) {
                z.tick = 0;
                players.forEach(p => { if (p.id !== z.owner && p.hp > 0 && !p.pyro && dist(p.x, p.y, z.x, z.y) < z.r) { dealDamage(p, 6.25, z.owner, { zone: true }); p.st.burn = Math.max(p.st.burn, 1); p.st.burnBy = z.owner; } });
            }
            if (Math.random() < 0.6) particles.push({ x: z.x + (Math.random() - 0.5) * z.r * 1.6, y: z.y + (Math.random() - 0.5) * z.r * 1.6, vx: 0, vy: -50, life: 0.5, maxLife: 0.5, color: Math.random() < 0.5 ? '#f97316' : '#facc15', size: 5, glow: true });
        } else if (z.type === 'gravity') {
            players.forEach(p => {
                if (p.id === z.owner || p.hp <= 0) return;
                const d = dist(p.x, p.y, z.x, z.y);
                if (d < z.r && d > 8) {
                    const a = Math.atan2(z.y - p.y, z.x - p.x), f = 900 * (1 - d / z.r * 0.5);
                    p.kx += Math.cos(a) * f * dt * 6; p.ky += Math.sin(a) * f * dt * 6;
                    if (owner && combo(owner, 'grav_fire')) { p.st.burn = Math.max(p.st.burn, 1); p.st.burnBy = z.owner; }
                }
            });
            if (z.t <= 0 && owner && combo(owner, 'grav_shock')) shockwave(z.x, z.y, z.owner, 170, 35);
        }
        if (z.t <= 0) zones.splice(i, 1);
    }

    // ---- Tháp pháo ----
    for (let i = turrets.length - 1; i >= 0; i--) {
        const t = turrets[i]; t.t -= dt; t.fire -= dt;
        const owner = players.find(q => q.id === t.owner);
        const e = owner && enemyOf(owner);
        if (e && e.hp > 0 && dist(t.x, t.y, e.x, e.y) < 470 && lineOfSight(t.x, t.y, e.x, e.y) && targetable(t, e)) {
            t.angle += angleDiff(Math.atan2(e.y - t.y, e.x - t.x), t.angle) * Math.min(1, dt * 10);
            if (t.fire <= 0) {
                t.fire = combo(owner, 'turret_rage') && owner.st.rage > 0 ? 0.2 : 0.42;
                bullets.push({ x: t.x + Math.cos(t.angle) * 16, y: t.y + Math.sin(t.angle) * 16, px: t.x, py: t.y, angle: t.angle + (Math.random() - 0.5) * 0.08, speed: 20, damage: 7, life: 0.5, owner: t.owner, color: '#fde68a', size: 2.5, knock: 30, bounces: 0, trail: 20 });
                AudioSys.playAt('smg', t.x, t.y, 0.12);
            }
        }
        if (t.t <= 0) { spark(t.x, t.y, '#94a3b8', 10, 160); turrets.splice(i, 1); }
    }

    // ---- Bẫy gai ----
    for (let i = mines.length - 1; i >= 0; i--) {
        const m = mines[i]; if (m.arm > 0) { m.arm -= dt; continue; }
        const owner = players.find(q => q.id === m.owner);
        const e = owner && enemyOf(owner);
        if (e && e.hp > 0 && dist(e.x, e.y, m.x, m.y) < e.radius + 14) {
            mines.splice(i, 1);
            spark(m.x, m.y, '#e5e7eb', 16, 260, 0.4, 3); ring(m.x, m.y, 5, 60, '#f87171', 0.3);
            dealDamage(e, 40, m.owner, { knock: 0 });
            e.stun = Math.max(e.stun, 1); floatText(e.x, e.y - 30, 'DÍNH BẪY!', '#f87171', 16);
            if (combo(owner, 'trap_hunter')) { e.st.reveal = Math.max(e.st.reveal, 4); }
            AudioSys.playAt('crit', m.x, m.y, 0.4);
        }
    }

    // ---- Phân thân ----
    for (let i = decoys.length - 1; i >= 0; i--) {
        const d = decoys[i]; d.t -= dt;
        const ox = d.x, oy = d.y;
        d.x += Math.cos(d.angle) * d.speed * dt; d.y += Math.sin(d.angle) * d.speed * dt;
        resolveCircle(d, d.radius);
        if (dist(ox, oy, d.x, d.y) < d.speed * dt * 0.3) d.angle += Math.PI / 2; // đụng tường thì rẽ
        if (d.t <= 0 || d.hp <= 0) {
            decoys.splice(i, 1);
            smoke(d.x, d.y, 6, 'rgba(200,200,220,0.35)', 14);
            const owner = players.find(q => q.id === d.owner);
            if (combo(owner, 'decoy_martyr')) explode(d.x, d.y, d.owner, 70, 130);
        }
    }

    // ---- Tường băng tạm thời ----
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        if (o.temp !== undefined) { o.temp -= dt; if (o.temp <= 0) { spark(o.x + o.w / 2, o.y + o.h / 2, '#bae6fd', 14, 200, 0.5, 3); obstacles.splice(i, 1); } }
    }
}

function lavaActive(z) { return ((world.time + z.phase) % 8) < 4.5; }
function lavaWarming(z) { const t = (world.time + z.phase) % 8; return t > 7; }

/** Móc trúng mục tiêu */
function hookHit(owner, target) {
    if (!owner) return;
    const a = Math.atan2(owner.y - target.y, owner.x - target.x), d = dist(owner.x, owner.y, target.x, target.y);
    target.kx += Math.cos(a) * Math.min(1300, d * 4.5); target.ky += Math.sin(a) * Math.min(1300, d * 4.5);
    target.stun = Math.max(target.stun, 0.45);
    floatText(target.x, target.y - 30, 'BỊ KÉO!', '#facc15', 15);
    if (combo(owner, 'hook_vampire')) { owner.hp = Math.min(owner.maxHp, owner.hp + 25); spark(owner.x, owner.y, '#4ade80', 6, 100); }
    if (combo(owner, 'hook_shock')) owner.st.pendingShock = 0.3;
}

/* ============================== CHỌN THẺ ============================== */
function isBuildRound(round) { return round % 2 === 1; }

function cardsForPick(p, kind, n) {
    if (kind === 'stat') {
        const pool = STAT_CARDS.slice(); const out = [];
        while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
        return out;
    }
    const owned = new Set(p.build);
    const skillsFull = p.build.filter(id => CARDS[id].kind === 'S').length >= 2;
    let pool = Object.keys(CARDS).filter(id => !owned.has(id) && !(skillsFull && CARDS[id].kind === 'S'));
    const makesCombo = id => (COMBOS_OF[id] || []).some(c => owned.has(c.a === id ? c.b : c.a));
    const weight = id => (makesCombo(id) ? 4 : 1) * (CARDS[id].kind === 'S' && p.build.length === 0 ? 1.5 : 1);
    const out = [];
    // luôn có ít nhất 1 thẻ tạo phối hợp nếu có thể
    const comboCards = pool.filter(makesCombo);
    if (comboCards.length && p.build.length) { const c = comboCards[Math.floor(Math.random() * comboCards.length)]; out.push(c); pool = pool.filter(x => x !== c); }
    // hiệp 1: đảm bảo có cả S lẫn P
    if (!p.build.length) {
        const s = pool.filter(id => CARDS[id].kind === 'S'), pp = pool.filter(id => CARDS[id].kind === 'P');
        const a = s[Math.floor(Math.random() * s.length)], b = pp[Math.floor(Math.random() * pp.length)];
        out.push(a, b); pool = pool.filter(x => x !== a && x !== b);
    }
    while (out.length < n && pool.length) {
        const total = pool.reduce((s, id) => s + weight(id), 0); let r = Math.random() * total, pick = pool[0];
        for (const id of pool) { r -= weight(id); if (r <= 0) { pick = id; break; } }
        out.push(pick); pool = pool.filter(x => x !== pick);
    }
    return out.sort(() => Math.random() - 0.5);
}

/** HTML mô tả một thẻ (dùng chung cho chủ phòng & khách) */
function cardHTML(id, kind, owned, keyLabel) {
    if (kind === 'stat') {
        const c = STAT_BY_ID[id];
        return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity">${c.round ? 'HIỆP NÀY' : 'VĨNH VIỄN'}</span><div class="aug-icon">${c.icon}</div><div class="aug-name">${c.name}</div><div class="aug-desc">${c.desc}</div>`;
    }
    const c = CARDS[id];
    const own = new Set(owned || []);
    const combos = (COMBOS_OF[id] || []).map(cb => {
        const other = cb.a === id ? cb.b : cb.a, active = own.has(other);
        return `<div class="combo ${active ? 'on' : ''}">${active ? '⚡' : '🔗'} <b>${cb.name}</b> <span>+ ${CARDS[other].icon} ${CARDS[other].name}</span>${active ? `<i>${cb.desc}</i>` : ''}</div>`;
    }).join('');
    const cd = c.kind === 'S' ? ` · ${c.cd}s` : '';
    return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity tag-${c.kind}">${c.kind === 'S' ? 'KỸ NĂNG' : 'NỘI TẠI'}${cd}</span><div class="aug-icon">${c.icon}</div><div class="aug-name">${c.name} <small>(${c.kind})</small></div><div class="aug-desc">${c.desc}</div>${combos ? `<div class="combos">${combos}</div>` : ''}`;
}
function cardClass(id, kind, owned) {
    if (kind === 'stat') return STAT_BY_ID[id].round ? 'common' : 'rare';
    const own = new Set(owned || []);
    const lights = (COMBOS_OF[id] || []).some(cb => own.has(cb.a === id ? cb.b : cb.a));
    return (CARDS[id].kind === 'S' ? 'skill' : 'passive') + (lights ? ' legend' : '');
}

function botPickCard(p, ids, kind) {
    if (kind === 'stat') return Math.floor(Math.random() * ids.length);
    const owned = new Set(p.build);
    const sc = ids.map((id, i) => ({ i, s: (COMBOS_OF[id] || []).filter(c => owned.has(c.a === id ? c.b : c.a)).length * 3 + (CARDS[id].kind === 'S' ? 1.2 : 1) + Math.random() * 1.5 }));
    sc.sort((a, b) => b.s - a.s);
    return sc[0].i;
}
