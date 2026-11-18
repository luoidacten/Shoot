/** ==================== KHÔNG KÍCH · THẢ BOM A→B · LASER VỆ TINH · PHÁO KÍCH · NAPALM ====================
 *  10 thẻ · 5 phép bổ trợ · 5 vật phẩm · 3 vũ khí nhặt được · màn chọn điểm trên bản đồ (không dừng trận)
 *  Hình ảnh đi qua mảng zones (tự đồng bộ online): warnLine, plane, bombFall, laserBeam, artyWarn, flareLight
 *  (đường thẳng: x,y = trung điểm, r = nửa chiều dài, phase = góc×1000)
 */
const strikes = [];
const STRIKE_MAXLEN = 700;
const angOf = z => (z.phase || 0) / 1000;
function strikeWarnT(p, base) { return base * (p && has(p, 'fastComms') ? 0.6 : 1); }
function payload(p) { return p && has(p, 'bigPayload') ? 1.3 : 1; }
function warnLine(p, ax, ay, bx, by, t, w) {
    const a = Math.atan2(by - ay, bx - ax);
    zones.push({ type: 'warnLine', x: (ax + bx) / 2, y: (ay + by) / 2, r: dist(ax, ay, bx, by) / 2, t, maxT: t, owner: p.id, tick: 0, phase: Math.round(a * 1000), totem: !!w });
}
function dropBomb(p, x, y, dmg, R, delay) {
    zones.push({ type: 'bombFall', x, y, r: R, t: delay, maxT: delay, owner: p.id, tick: 0 });
    strikes.push({ kind: 'bomb', owner: p.id, x, y, t: delay, dmg, R });
}
function clampLine(a, b) { const d = dist(a.x, a.y, b.x, b.y); if (d <= STRIKE_MAXLEN) return b; return { x: a.x + (b.x - a.x) / d * STRIKE_MAXLEN, y: a.y + (b.y - a.y) / d * STRIKE_MAXLEN }; }
/** Điểm A→B tự chọn (bot, chơi 2 người 1 máy): đường cắt ngang kẻ địch */
function autoLine(p) {
    const e = enemyOf(p), c = e && e.hp > 0 ? { x: e.x, y: e.y } : { x: p.x + Math.cos(p.angle) * 320, y: p.y + Math.sin(p.angle) * 320 };
    const a = Math.atan2(c.y - p.y, c.x - p.x);
    return { a: { x: c.x - Math.cos(a) * 220, y: c.y - Math.sin(a) * 220 }, b: { x: c.x + Math.cos(a) * 220, y: c.y + Math.sin(a) * 220 } };
}
function targetLine(p) { const t = p.pickTarget || autoLine(p); return { a: t.a, b: clampLine(t.a, t.b) }; }

/* ---------- 1. Máy bay không kích: bay xuyên bản đồ theo hướng chọn ---------- */
function planeStrike(p, ang, cx, cy, opt = {}) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const from = opt.from !== undefined ? opt.from : -150, to = opt.to !== undefined ? opt.to : 450;
    const ax = cx + dx * from, ay = cy + dy * from, bx = cx + dx * to, by = cy + dy * to;
    const warn = strikeWarnT(p, opt.warn || 1.5);
    warnLine(p, ax, ay, bx, by, warn, false);
    const lead = 900; // máy bay bay vào từ xa (bên kia tường) rồi bay qua hết
    strikes.push({ kind: 'plane', owner: p.id, t: warn, ang, sx: cx + dx * (from - lead), sy: cy + dy * (from - lead), cx, cy, from, to, travel: 0, next: from, gap: opt.gap || 70,
        dmg: (opt.dmg || 100) * payload(p), R: (opt.R || 105) * payload(p), speed: 1500, total: to - from + lead * 2, rockets: has(p, 'radioman') && combo(p, 'gunship') ? 2 : 0 });
    floatText(p.x, p.y - 40, opt.label || '✈️ KHÔNG KÍCH!', '#fde68a', 16); AudioSys.playAt('alarm', p.x, p.y, 0.3);
    if (has(p, 'radioman')) enemiesOf(p).forEach(e => { const t = Math.max(from, Math.min(to, (e.x - cx) * dx + (e.y - cy) * dy)); if (dist(e.x, e.y, cx + dx * t, cy + dy * t) < 160) spotFor(e, p.id, 3); });
}
/* ---------- 2. Thả bom A→B ---------- */
function carpetStrike(p, a, b, n) {
    const warn = strikeWarnT(p, 1.2);
    warnLine(p, a.x, a.y, b.x, b.y, warn, false);
    const cnt = (n || 8) + (combo(p, 'carpetPlus') ? 3 : 0);
    for (let i = 0; i < cnt; i++) { const k = cnt === 1 ? 0.5 : i / (cnt - 1); dropBomb(p, a.x + (b.x - a.x) * k + (Math.random() - 0.5) * 20, a.y + (b.y - a.y) * k + (Math.random() - 0.5) * 20, 95 * payload(p), 100 * payload(p), warn + 0.5 + i * 0.12); }
    floatText(p.x, p.y - 40, '💣 THẢ BOM!', '#fb923c', 16); AudioSys.playAt('alarm', p.x, p.y, 0.3);
}
/* ---------- 3. Laser vệ tinh quét A→B ---------- */
function laserStrike(p, a, b, opt = {}) {
    const warn = strikeWarnT(p, 1.0);
    warnLine(p, a.x, a.y, b.x, b.y, warn, true);
    strikes.push({ kind: 'laser', owner: p.id, t: warn, a, b, dur: opt.dur || 2, k: 0, tick: 0, dmg: (opt.dmg || 18) * payload(p) });
    floatText(p.x, p.y - 40, '🛰️ LASER VỆ TINH!', '#f472b6', 16); AudioSys.playAt('rail', p.x, p.y, 0.25);
}
/* ---------- 4. Pháo kích quanh 1 điểm ---------- */
function artyStrike(p, x, y) {
    const waves = combo(p, 'rapidArty') ? 4 : 3;
    for (let w = 0; w < waves; w++) for (let i = 0; i < 3; i++) {
        const a = Math.random() * 6.28, r = Math.random() * 120, sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r, d = strikeWarnT(p, 0.8) + w * 0.6 + i * 0.1;
        zones.push({ type: 'artyWarn', x: sx, y: sy, r: 85 * payload(p), t: d, maxT: d, owner: p.id, tick: 0 });
        strikes.push({ kind: 'bomb', owner: p.id, x: sx, y: sy, t: d, dmg: 75 * payload(p), R: 85 * payload(p) });
    }
    floatText(p.x, p.y - 40, '🎯 PHÁO KÍCH!', '#fca5a5', 16);
}
/* ---------- 5. Napalm: vệt lửa ---------- */
function napalmStrike(p, ang) {
    const warn = strikeWarnT(p, 0.6), dx = Math.cos(ang), dy = Math.sin(ang);
    warnLine(p, p.x + dx * 60, p.y + dy * 60, p.x + dx * 360, p.y + dy * 360, warn, false);
    for (let d = 60; d <= 360; d += 50) strikes.push({ kind: 'napalm', owner: p.id, x: p.x + dx * d, y: p.y + dy * d, t: warn + d / 900 });
    floatText(p.x, p.y - 40, '🔥 NAPALM!', '#fb923c', 16);
}

/* ============================== CẬP NHẬT (máy chủ) ============================== */
function updateStrikes(dt) {
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i], o = players.find(q => q.id === s.owner);
        s.t -= dt;
        if (s.kind === 'bomb') {
            if (s.t <= 0) { strikes.splice(i, 1); explode(s.x, s.y, s.owner, s.dmg, s.R); }
        } else if (s.kind === 'napalm') {
            if (s.t <= 0) { strikes.splice(i, 1); zones.push({ type: 'fire', x: s.x, y: s.y, r: 55, t: 4, maxT: 4, owner: s.owner, tick: 0 }); explosionFx(s.x, s.y, 50); }
        } else if (s.kind === 'plane') {
            if (s.t > 0) continue;
            if (!s.z) { s.z = { type: 'plane', x: s.sx, y: s.sy, r: 26, t: 9, maxT: 9, owner: s.owner, tick: 0, phase: Math.round(s.ang * 1000) }; zones.push(s.z); AudioSys.playAt('whoosh', s.cx, s.cy, 0.6, 3000); }
            s.travel += s.speed * dt;
            const dx = Math.cos(s.ang), dy = Math.sin(s.ang), x = s.sx + dx * s.travel, y = s.sy + dy * s.travel;
            s.z.x = x; s.z.y = y; s.z.t = 9;
            const along = (x - s.cx) * dx + (y - s.cy) * dy;
            while (along >= s.next && s.next <= s.to) {
                const bx = s.cx + dx * s.next + (Math.random() - 0.5) * 24, by = s.cy + dy * s.next + (Math.random() - 0.5) * 24;
                if (o) dropBomb(o, bx, by, s.dmg, s.R, 0.45); s.next += s.gap;
            }
            if (s.rockets > 0 && along > s.from && o) { // Máy Bay Chiến Đấu: bắn tên lửa vào địch gần đường bay
                const e = enemiesOf(o).filter(q => dist(q.x, q.y, x, y) < 450).sort((u, v) => dist(u.x, u.y, x, y) - dist(v.x, v.y, x, y))[0];
                if (e) { s.rockets--; const a = Math.atan2(e.y - y, e.x - x); bullets.push({ x, y, px: x, py: y, angle: a, speed: 16, damage: 0, life: 1.2, owner: o.id, color: '#ff7a1a', size: 5, knock: 0, bounces: 0, explosive: true, blastSmall: true, trail: 40 }); }
            }
            if (s.travel > s.total) { strikes.splice(i, 1); s.z.t = 0; }
        } else if (s.kind === 'laser') {
            if (s.t > 0) continue;
            s.k += dt / s.dur; s.tick -= dt;
            const x = s.a.x + (s.b.x - s.a.x) * Math.min(1, s.k), y = s.a.y + (s.b.y - s.a.y) * Math.min(1, s.k);
            if (!s.z) { s.z = { type: 'laserBeam', x, y, r: 38, t: s.dur + 0.2, maxT: s.dur + 0.2, owner: s.owner, tick: 0 }; zones.push(s.z); }
            s.z.x = x; s.z.y = y;
            if (s.tick <= 0 && o) {
                s.tick = 0.1;
                players.forEach(e => { if (e.hp > 0 && e.id !== o.id && !sameTeam(o, e) && !(e.air > 0) && dist(e.x, e.y, x, y) < 38 + e.radius) dealDamage(e, s.dmg * (combo(o, 'focusLaser') && e.painted && e.painted.by === o.id && e.painted.t > world.time ? 1.5 : 1), o.id, { angle: Math.random() * 6.28, knock: 40, noCharge: true }); });
                obstacles.slice().forEach(ob => { if (ob.wood && x > ob.x - 30 && x < ob.x + ob.w + 30 && y > ob.y - 30 && y < ob.y + ob.h + 30) damageObstacle(ob, 12, o); });
                if (Math.random() < 0.5) addShake(2);
            }
            if (s.k >= 1) strikes.splice(i, 1);
        }
    }
}
const _upe10 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe10(dt); updateStrikes(dt); };
const _resetRound10 = resetPlayerForRound;
resetPlayerForRound = function (p) { strikes.length = 0; return _resetRound10(p); };

/* ============================== 10 THẺ ============================== */
defS('airstrike', '✈️', 'Không Kích', 22, 'engage', 'Cảnh báo 1.5 giây rồi máy bay bay xuyên bản đồ theo hướng bạn chọn, rải bom dọc đường (40 sát thương mỗi quả).', p => { const a = aimDir(p); planeStrike(p, a, p.x + Math.cos(a) * 150, p.y + Math.sin(a) * 150); }, 450);
defS('carpetBomb', '💣', 'Thả Bom', 25, 'engage', 'Mở bản đồ: chạm điểm A rồi điểm B (tối đa 700). Bom rải dọc từ A tới B. (Bản đồ chỉ hiện vị trí của bạn; có lợi thế Bản Đồ Nhỏ thì hiện thêm tường, bụi, địch.)', p => { const t = targetLine(p); carpetStrike(p, t.a, t.b); }, 900);
defS('orbitalLaser', '🛰️', 'Laser Vệ Tinh', 28, 'engage', 'Mở bản đồ: chọn A rồi B. Tia laser từ trên trời quét từ A tới B trong 2 giây (70 sát thương/giây, phá được thùng gỗ).', p => { const t = targetLine(p); laserStrike(p, t.a, t.b); }, 900);
defS('artyCall', '🎯', 'Pháo Kích', 18, 'engage', 'Gọi 3 loạt pháo rơi ngẫu nhiên quanh điểm chọn (bán kính 120).', p => { const a = aimDir(p), d = Math.min(500, p.skillDist || 350); artyStrike(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); }, 500);
defS('napalmStrike', '🔥', 'Bom Napalm', 20, 'engage', 'Rải một vệt lửa dài 300 theo hướng chọn (cháy 4 giây).', p => napalmStrike(p, aimDir(p)), 360);
CARDS.carpetBomb.picker = 'carpet'; CARDS.orbitalLaser.picker = 'laser';
CARDS.airstrike.aim = 'dir'; CARDS.airstrike.aimR = 450; CARDS.artyCall.aim = 'point'; CARDS.artyCall.aimR = 500; CARDS.napalmStrike.aim = 'dir'; CARDS.napalmStrike.aimR = 360;
defP('fastComms', '📻', 'Liên Lạc Nhanh', 'Cảnh báo của không kích, thả bom, laser, pháo kích ngắn hơn 40% (địch khó né).', p => {});
defP('bigPayload', '💥', 'Tải Trọng Lớn', 'Bom và laser của bạn +30% sát thương và bán kính.', p => {});
defP('radioman', '📡', 'Lính Liên Lạc', 'Kỹ năng gọi hoả lực hồi nhanh hơn 25%; Không Kích làm lộ địch gần đường bay 3 giây.', p => {});
defP('bunker', '🛖', 'Hầm Trú Ẩn', 'Nhận ít hơn 50% sát thương nổ (bom, lựu đạn, tên lửa).', p => {});
defP('targetPainter', '🔴', 'Chỉ Điểm Mục Tiêu', 'Địch bị bạn bắn trúng trong 3 giây gần nhất nhận thêm 25% sát thương nổ từ bạn.', p => {});
const FIRE_SKILLS = ['airstrike', 'carpetBomb', 'orbitalLaser', 'artyCall', 'napalmStrike'];
[
    { id: 'carpetPlus', a: 'carpetBomb', b: 'bigPayload', name: 'Thảm Bom', desc: 'Thả Bom rải thêm 3 quả.' },
    { id: 'gunship', a: 'airstrike', b: 'radioman', name: 'Máy Bay Chiến Đấu', desc: 'Máy bay bắn thêm 2 tên lửa vào địch gần đường bay.' },
    { id: 'focusLaser', a: 'orbitalLaser', b: 'targetPainter', name: 'Laser Hội Tụ', desc: 'Laser gây gấp 1.5 lên địch đang bị chỉ điểm.' },
    { id: 'rapidArty', a: 'artyCall', b: 'fastComms', name: 'Pháo Thần Tốc', desc: 'Pháo Kích 4 loạt thay vì 3.' },
    { id: 'safeBomber', a: 'bunker', b: 'napalmStrike', name: 'Chống Cháy', desc: 'Không bị lửa của chính mình đốt; Napalm hồi nhanh 4 giây.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
const _skillCd10 = skillCooldown;
skillCooldown = function (p, id) { let cd = _skillCd10(p, id); if (FIRE_SKILLS.includes(id) && has(p, 'radioman')) cd *= 0.75; if (id === 'napalmStrike' && combo(p, 'safeBomber')) cd -= 4; return Math.max(1, cd); };
const _dealDamage10 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (target && target.st && target.hp > 0) {
        if (opts.blast && has(target, 'bunker')) dmg *= 0.5;
        if (opts.zone && atk === target && combo(target, 'safeBomber')) return;
        if (atk && atk !== target) {
            if (opts.bullet) target.painted = { by: atk.id, t: world.time + 3 };
            if (opts.blast && has(atk, 'targetPainter') && target.painted && target.painted.by === atk.id && target.painted.t > world.time) dmg *= 1.25;
        }
    }
    return _dealDamage10(target, dmg, attackerId, opts);
};

/* ============================== 5 PHÉP BỔ TRỢ ============================== */
Object.assign(SPELLS, {
    miniStrike: { icon: '🛩️', name: 'Không Kích Nhẹ', cd: 45, desc: 'Máy bay nhỏ rải 4 quả bom (25 sát thương) theo hướng kéo.', cast: p => { const a = spellAim(p); planeStrike(p, a, p.x, p.y, { from: 120, to: 420, gap: 100, dmg: 25, R: 75, warn: 1.0, label: '🛩️ KHÔNG KÍCH NHẸ' }); } },
    flareScan:  { icon: '🎆', name: 'Pháo Sáng', cd: 35, desc: 'Bắn pháo sáng rơi cách 350 theo hướng kéo: lộ mọi địch trong bán kính 380 suốt 4 giây.', cast: p => castFlare(p, spellAim(p)) },
    mineField:  { icon: '🧨', name: 'Rải Mìn', cd: 40, desc: 'Rải 3 quả mìn gai quanh chỗ bạn đứng.', cast: p => { for (let i = 0; i < 3; i++) { const a = p.angle + Math.PI + (i - 1) * 0.9; mines.push({ kind: 'spike', x: p.x + Math.cos(a) * 55, y: p.y + Math.sin(a) * 55, owner: p.id, arm: 0.6 }); } AudioSys.playAt('ui', p.x, p.y, 0.3); } },
    smokeLine:  { icon: '🌫️', name: 'Màn Khói', cd: 35, desc: 'Dựng 3 cột khói thành hàng ngang trước mặt theo hướng kéo (5 giây).', cast: p => { const a = spellAim(p), nx = -Math.sin(a), ny = Math.cos(a), cx = p.x + Math.cos(a) * 160, cy = p.y + Math.sin(a) * 160; [-1, 0, 1].forEach(k => { const x = cx + nx * k * 130, y = cy + ny * k * 130; zones.push({ type: 'smoke', x, y, r: 95, t: 5, maxT: 5, owner: p.id, tick: 0 }); smoke(x, y, 8, 'rgba(180,190,210,0.45)', 22); }); } },
    supplyDrop: { icon: '📦', name: 'Tiếp Tế Khẩn', cd: 50, desc: 'Sau 1.5 giây một hộp hỗ trợ rơi ngay cạnh bạn.', cast: p => { const a = p.angle, x = p.x + Math.cos(a) * 60, y = p.y + Math.sin(a) * 60; zones.push({ type: 'artyWarn', x, y, r: 30, t: 1.5, maxT: 1.5, owner: p.id, tick: 0 }); strikes.push({ kind: 'crate', owner: p.id, x, y, t: 1.5 }); } }
});
SPELL_IDS.push('miniStrike', 'flareScan', 'mineField', 'smokeLine', 'supplyDrop');
AIM_SPELLS.push('miniStrike', 'flareScan', 'smokeLine');
function castFlare(p, a) {
    const x = p.x + Math.cos(a) * 350, y = p.y + Math.sin(a) * 350;
    zones.push({ type: 'flareLight', x, y, r: 380, t: 4, maxT: 4, owner: p.id, tick: 0 });
    strikes.push({ kind: 'flare', owner: p.id, x, y, t: 4 });
    AudioSys.playAt('legend', x, y, 0.25);
}
// hòm tiếp tế & pháo sáng dùng chung vòng cập nhật
const _updateStrikes10 = updateStrikes;
updateStrikes = function (dt) {
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i];
        if (s.kind === 'crate' && s.t - dt <= 0) { strikes.splice(i, 1); const o = players.find(q => q.id === s.owner), c = makeCrate(s.x, s.y, 'SUPPORT'); if (o && sCombo(o, 'medDrop')) c.look = 'mega'; crates.push(c); spark(s.x, s.y, '#22c55e', 12, 160); AudioSys.playAt('slam', s.x, s.y, 0.25); }
        else if (s.kind === 'flare') { const o = players.find(q => q.id === s.owner); if (o) enemiesOf(o).forEach(e => { if (dist(e.x, e.y, s.x, s.y) < 380) spotFor(e, o.id, 0.3); }); if (s.t - dt <= 0) strikes.splice(i, 1); else s.t -= dt; }
    }
    _updateStrikes10(dt);
};
SPELL_COMBOS.push(
    { id: 'skyWatch', a: 'flareScan', b: 'miniStrike', name: 'Trinh Sát Đường Không', desc: 'Không Kích Nhẹ rải thêm 2 quả nếu Pháo Sáng đang cháy.' },
    { id: 'minedSmoke', a: 'smokeLine', b: 'mineField', name: 'Bẫy Trong Khói', desc: 'Màn Khói giấu thêm 1 quả mìn trong mỗi cột khói.' },
    { id: 'medDrop', a: 'supplyDrop', b: 'heal', name: 'Tiếp Tế Y Tế', desc: 'Hộp Tiếp Tế Khẩn luôn là Tim Lớn (+80 máu).' }
);
(function () {
    const ms = SPELLS.miniStrike.cast, sl = SPELLS.smokeLine.cast;
    SPELLS.miniStrike.cast = p => { if (sCombo(p, 'skyWatch') && zones.some(z => z.type === 'flareLight' && z.owner === p.id)) { const a = spellAim(p); planeStrike(p, a, p.x, p.y, { from: 120, to: 520, gap: 66, dmg: 25, R: 75, warn: 1.0, label: '🛩️ TRINH SÁT ĐƯỜNG KHÔNG' }); } else ms(p); };
    SPELLS.smokeLine.cast = p => { const n = zones.length; sl(p); if (sCombo(p, 'minedSmoke')) zones.slice(n).forEach(z => { if (z.type === 'smoke') mines.push({ kind: 'spike', x: z.x, y: z.y, owner: p.id, arm: 0.6 }); }); };
})();
/* ============================== 5 VẬT PHẨM ============================== */
Object.assign(ITEMS, {
    flareGun: { icon: '🎇', name: 'Súng Pháo Sáng', cast: p => castFlare(p, p.angle) },
    radio:    { icon: '📟', name: 'Bộ Đàm Mini', cast: p => planeStrike(p, p.angle, p.x, p.y, { from: 120, to: 420, gap: 100, dmg: 25, R: 75, warn: 1.0, label: '📟 GỌI KHÔNG KÍCH' }) },
    landmine: { icon: '💣', name: 'Mìn Cá Nhân', cast: p => { mines.push({ kind: 'spike', x: p.x, y: p.y, owner: p.id, arm: 0.8 }); AudioSys.playAt('ui', p.x, p.y, 0.3); } },
    adrenShot:{ icon: '💉', name: 'Tiêm Adrenaline', cast: p => { p.st.haste = Math.max(p.st.haste, 3); p.hp = Math.min(p.maxHp, p.hp + 20); spark(p.x, p.y, '#f43f5e', 10, 120); } },
    armorKit: { icon: '🔧', name: 'Bộ Vá Giáp', cast: p => { p.armor = Math.min(Math.max(150, p.maxArmor), (p.armor || 0) + 60); spark(p.x, p.y, COLORS.armor, 10, 120); } }
});
ITEM_IDS.push('flareGun', 'radio', 'landmine', 'adrenShot', 'armorKit');

/* bot dùng phép / vật phẩm mới */
const _botSpells10 = botSpells;
botSpells = function (p, dt) {
    const t0 = p.spellThinkT;
    _botSpells10(p, dt);
    if (!(t0 - dt <= 0) || gameState !== 'PLAYING') return;
    const e = enemyOf(p), d = e ? dist(p.x, p.y, e.x, e.y) : 1e9, vis = e && targetable(p, e), low = p.hp < p.maxHp * 0.4;
    const want = { miniStrike: vis && d > 150 && d < 420, flareScan: !vis && world.time > 5, mineField: vis && d < 260 && low, smokeLine: low && vis, supplyDrop: low && !vis,
        flareGun: !vis && world.time > 5, radio: vis && d > 150 && d < 420, landmine: vis && d < 200, adrenShot: low, armorKit: (p.armor || 0) < 20 && vis };
    (p.spells || []).forEach((s, i) => { if (s.cd <= 0 && want[s.id] && Math.random() < 0.6) { p.angle = e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle; castSpell(p, i); } });
    (p.items || []).forEach((it, i) => { if (want[it.id] && Math.random() < 0.5) useItem(p, i); });
};

/* ============================== 3 VŨ KHÍ NHẶT ĐƯỢC ============================== */
Object.assign(WEAPONS, {
    AIRCALL:  { id: 'AIRCALL', name: 'Bộ Đàm Không Kích', icon: '📻', type: 'GUN', mode: 'tap', aim: 'line', color: '#65a30d', damage: 0, fireRate: 50, speed: 1, spread: 0, range: 600, magSize: 2, mag: 2, reserve: 0, noReload: true, moveScale: 1, width: 5, len: 12, tier: 3, desc: 'Bắn = gọi máy bay không kích theo hướng ngắm (2 lần)' },
    BOMBTAB:  { id: 'BOMBTAB', name: 'Máy Tính Bảng Thả Bom', icon: '📲', type: 'GUN', mode: 'tap', aim: 'line', color: '#ea580c', damage: 0, fireRate: 50, speed: 1, spread: 0, range: 600, magSize: 1, mag: 1, reserve: 0, noReload: true, moveScale: 1, width: 6, len: 10, tier: 3, desc: 'Bắn = mở bản đồ, chọn A rồi B để thả bom (1 lần)' },
    LASERDES: { id: 'LASERDES', name: 'Bộ Chỉ Điểm Laser', icon: '🔦', type: 'GUN', mode: 'tap', aim: 'line', color: '#db2777', damage: 0, fireRate: 50, speed: 1, spread: 0, range: 600, magSize: 1, mag: 1, reserve: 0, noReload: true, moveScale: 1, width: 4, len: 14, tier: 3, desc: 'Bắn = mở bản đồ, chọn A rồi B để gọi laser vệ tinh (1 lần)' }
});
Object.assign(BASE_WEIGHTS, { AIRCALL: 3, BOMBTAB: 2, LASERDES: 2 });
const PICKER_WEAPONS = { BOMBTAB: 'carpet', LASERDES: 'laser' };
function useStrikeWeapon(p, w, a, b) {
    if (!world.infiniteAmmo) w.mag--;
    if (w.id === 'AIRCALL') { const ang = p.aimAngle !== undefined ? p.aimAngle : p.angle; planeStrike(p, ang, p.x + Math.cos(ang) * 150, p.y + Math.sin(ang) * 150); }
    else { const t = a ? { a, b: clampLine(a, b) } : (() => { const q = autoLine(p); return { a: q.a, b: q.b }; })(); if (w.id === 'BOMBTAB') carpetStrike(p, t.a, t.b); else laserStrike(p, t.a, t.b); }
    if (w.mag <= 0) { const i = p.inventory.indexOf(w); if (i >= 0) p.inventory[i] = { ...WEAPONS.NONE }; }
}
const _fireWeapon10 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w.id === 'AIRCALL' || PICKER_WEAPONS[w.id]) { p.cooldown = w.fireRate; p.lastFireT = world.time; if (w.mag > 0) useStrikeWeapon(p, w, null, null); return; }
    return _fireWeapon10(p, w, ang, charge, enemy);
};

/* ============================== MÀN CHỌN ĐIỂM A→B (không dừng trận) ============================== */
let picker = null; // { src: 'skill'|'weapon', slot, kind: 'carpet'|'laser', a, hover }
const pickPrev = {};
function pickerRect() {
    const W = SCREEN_W, H = SCREEN_H, k = Math.min(W * 0.86 / MAP_W, H * 0.7 / MAP_H), w = MAP_W * k, h = MAP_H * k;
    return { x: (W - w) / 2, y: (H - h) / 2 + 10, w, h, k, cancel: { x: (W + w) / 2 - 70, y: (H - h) / 2 - 30, w: 70, h: 28 } };
}
function openPicker(src, slot, kind) { picker = { src, slot, kind, a: null, hover: null }; AudioSys.play('ui'); }
function submitPicker(a, b) {
    const pk = picker; picker = null;
    if (net.role === 'guest') netSend({ t: 'tgt', src: pk.src, slot: pk.slot, a: [Math.round(a.x), Math.round(a.y)], b: [Math.round(b.x), Math.round(b.y)] });
    else execTarget(localPlayer(), pk.src, pk.slot, a, b);
}
function execTarget(p, src, slot, a, b) {
    if (!p || p.hp <= 0 || gameState !== 'PLAYING' || p.stun > 0) return;
    if (src === 'skill') {
        const s = p.skills && p.skills[slot]; if (!s || s.cd > 0 || p.st.silence > 0) return;
        p.pickTarget = { a, b }; try { castSkill(p, slot, null); } finally { p.pickTarget = null; }
    } else {
        const w = getCurrentWeapon(p); if (!PICKER_WEAPONS[w.id] || w.mag <= 0) return;
        p.cooldown = w.fireRate; useStrikeWeapon(p, w, a, b);
    }
}
const _onHostData10 = onHostData;
onHostData = function (g, m) {
    if (m && m.t === 'tgt' && Array.isArray(m.a) && Array.isArray(m.b)) { const p = players.find(q => q.id === g.id); execTarget(p, m.src === 'weapon' ? 'weapon' : 'skill', +m.slot || 0, { x: +m.a[0], y: +m.a[1] }, { x: +m.b[0], y: +m.b[1] }); return; }
    return _onHostData10(g, m);
};
// chặn nút: bấm kỹ năng / bắn vũ khí cần chọn điểm → mở bản đồ thay vì dùng ngay
const _readHuman10 = readHumanInput;
readHumanInput = function (id) {
    const r = _readHuman10(id), raw = window.__lastInp;
    if (id !== localId() || settings.mode === 'pvp') return r;
    const p = localPlayer(); if (!p || p.hp <= 0) return r;
    const clear = k => { r[k] = false; if (raw) raw[k] = false; };
    if (picker) { ['a', 's1', 's2', 's3'].forEach(clear); return r; }
    ['s1', 's2', 's3'].forEach((k, i) => {
        const down = !!r[k], was = !!pickPrev[k]; pickPrev[k] = down;
        const s = p.skills && p.skills[i], c = s && CARDS[s.id];
        if (c && c.picker) { if (down && !was && s.cd <= 0 && gameState === 'PLAYING') openPicker('skill', i, c.picker); clear(k); }
    });
    const w = getCurrentWeapon(p), downA = !!r.a, wasA = !!pickPrev.a; pickPrev.a = downA;
    if (PICKER_WEAPONS[w.id]) { if (downA && !wasA && w.mag > 0 && gameState === 'PLAYING') openPicker('weapon', 0, PICKER_WEAPONS[w.id]); clear('a'); }
    return r;
};
function pickerPoint(cx, cy) {
    const R = pickerRect();
    if (cx >= R.cancel.x && cx <= R.cancel.x + R.cancel.w && cy >= R.cancel.y && cy <= R.cancel.y + R.cancel.h) return 'cancel';
    if (cx < R.x || cx > R.x + R.w || cy < R.y || cy > R.y + R.h) return null;
    return { x: (cx - R.x) / R.k, y: (cy - R.y) / R.k };
}
function pickerTap(cx, cy) {
    const pt = pickerPoint(cx, cy);
    if (pt === 'cancel') { picker = null; AudioSys.play('ui'); return true; }
    if (!pt) return false;
    if (!picker.a) { picker.a = pt; AudioSys.play('tick', 0.3); }
    else submitPicker(picker.a, clampLine(picker.a, pt));
    return true;
}
function pickerEvent(e) {
    if (!picker || !['PLAYING', 'KO'].includes(gameState)) return;
    const pts = e.changedTouches ? [...e.changedTouches] : [e];
    for (const t of pts) {
        const r = pickerPoint(t.clientX, t.clientY);
        if (e.type === 'mousemove' || e.type === 'touchmove') { if (r && r !== 'cancel') picker.hover = r; continue; }
        if (r === null) continue; // ngoài bản đồ: để joystick / nút hoạt động bình thường
        e.stopPropagation(); e.preventDefault();
        if (r !== 'cancel') picker.hover = r;
        pickerTap(t.clientX, t.clientY);
        return;
    }
}
window.addEventListener('touchstart', pickerEvent, { capture: true, passive: false });
window.addEventListener('mousedown', pickerEvent, { capture: true });
window.addEventListener('mousemove', pickerEvent, { capture: true });
window.addEventListener('touchmove', pickerEvent, { capture: true, passive: true });
window.addEventListener('keydown', e => { if (picker && e.code === 'Escape') { picker = null; e.stopPropagation(); } }, { capture: true });

function drawPicker(me, W, H, now) {
    const R = pickerRect(), X = x => R.x + x * R.k, Y = y => R.y + y * R.k, full = me.adv === 'minimap';
    ctx.save();
    ctx.fillStyle = 'rgba(3,5,12,0.55)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15,23,42,0.95)'; rrect(ctx, R.x - 8, R.y - 40, R.w + 16, R.h + 48, 12); ctx.fill();
    ctx.strokeStyle = picker.kind === 'laser' ? '#f472b6' : '#fb923c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.strokeStyle = 'rgba(148,163,184,0.12)'; ctx.lineWidth = 1;
    for (let gx = 0; gx <= MAP_W; gx += 200) { ctx.beginPath(); ctx.moveTo(X(gx), R.y); ctx.lineTo(X(gx), R.y + R.h); ctx.stroke(); }
    for (let gy = 0; gy <= MAP_H; gy += 200) { ctx.beginPath(); ctx.moveTo(R.x, Y(gy)); ctx.lineTo(R.x + R.w, Y(gy)); ctx.stroke(); }
    if (full) { // lợi thế Bản Đồ Nhỏ: hiện thêm thông tin
        ctx.fillStyle = 'rgba(34,197,94,0.35)'; bushes.forEach(b => { ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), Math.max(2, b.r * R.k), 0, Math.PI * 2); ctx.fill(); });
        obstacles.forEach(o => { ctx.fillStyle = o.wood ? 'rgba(180,120,70,0.85)' : 'rgba(148,163,184,0.9)'; ctx.fillRect(X(o.x), Y(o.y), Math.max(1, o.w * R.k), Math.max(1, o.h * R.k)); });
        const z = world.zone; if (z && z.r) { ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.strokeStyle = 'rgba(96,165,250,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(z.x), Y(z.y), z.r * R.k, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        players.forEach(q => { if (q.hp > 0 && q !== me && (sameTeam(me, q) || targetable(me, q) || isSpotted(q, me.id))) { ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 5, 0, Math.PI * 2); ctx.fill(); } });
        pings.forEach(pg => { ctx.strokeStyle = 'rgba(248,113,113,0.7)'; ctx.beginPath(); ctx.arc(X(pg.x), Y(pg.y), 6, 0, Math.PI * 2); ctx.stroke(); });
    }
    ctx.fillStyle = me.color; ctx.beginPath(); ctx.arc(X(me.x), Y(me.y), 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // A, B và đường thả
    const a = picker.a, h = picker.hover;
    if (a) {
        const b = h ? clampLine(a, h) : null;
        if (b) { ctx.strokeStyle = picker.kind === 'laser' ? '#f472b6' : '#fb923c'; ctx.lineWidth = 4; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(X(a.x), Y(a.y), 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0b1020'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', X(a.x), Y(a.y));
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fde68a'; ctx.font = `700 13px ${FONT}`;
    ctx.fillText(`${picker.kind === 'laser' ? '🛰️ LASER VỆ TINH' : '💣 THẢ BOM'} · ${a ? 'CHẠM ĐIỂM B (tối đa 700)' : 'CHẠM ĐIỂM A'}`, R.x, R.y - 22);
    const c = R.cancel; ctx.fillStyle = '#7f1d1d'; rrect(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill(); ctx.fillStyle = '#fecaca'; ctx.textAlign = 'center'; ctx.font = `700 12px ${FONT}`; ctx.fillText('✖ HUỶ', c.x + c.w / 2, c.y + c.h / 2 + 1);
    if (!full) { ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = `600 10px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText('Bản đồ tĩnh: chỉ thấy vị trí của bạn (lợi thế Bản Đồ Nhỏ hiện thêm)', R.x + R.w, R.y + R.h + 4); }
    ctx.restore();
}
const _drawHUD10 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD10(W, H, now);
    const me = localPlayer();
    if (picker && (!me || me.hp <= 0 || !['PLAYING', 'KO'].includes(gameState))) picker = null;
    if (picker && me) drawPicker(me, W, H, now);
};

/* ============================== VẼ HÌNH ẢNH KHÔNG KÍCH ============================== */
const _drawNetZones10 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones10(now);
    zones.forEach(z => {
        if (z.type === 'warnLine') {
            const a = angOf(z), k = 0.5 + Math.sin(now * 14) * 0.3, wd = z.totem ? 30 : 70;
            ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(a);
            ctx.fillStyle = z.totem ? `rgba(244,114,182,${0.12 * k + 0.05})` : `rgba(239,68,68,${0.14 * k + 0.05})`; ctx.fillRect(-z.r, -wd / 2, z.r * 2, wd);
            ctx.strokeStyle = z.totem ? 'rgba(244,114,182,0.8)' : 'rgba(239,68,68,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -now * 60; ctx.strokeRect(-z.r, -wd / 2, z.r * 2, wd); ctx.setLineDash([]);
            ctx.fillStyle = `rgba(254,202,202,${k})`; ctx.font = `700 14px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let x = -z.r + 40; x < z.r; x += 160) ctx.fillText('⚠', x, 0);
            ctx.restore();
        } else if (z.type === 'bombFall') {
            const k = 1 - Math.max(0, z.t) / (z.maxT || 0.5);
            ctx.save(); ctx.fillStyle = `rgba(0,0,0,${0.15 + k * 0.35})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, 6 + k * 14, 3 + k * 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(239,68,68,${0.3 + k * 0.5})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.ellipse(z.x, z.y - (1 - k) * 80, 4 + k * 2, 7 + k * 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        } else if (z.type === 'artyWarn') {
            const k = 1 - Math.max(0, z.t) / (z.maxT || 1);
            ctx.save(); ctx.strokeStyle = `rgba(252,165,165,${0.4 + k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = `rgba(239,68,68,${0.08 + k * 0.2})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (z.type === 'laserBeam') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r * 1.6); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(244,114,182,0.75)'); g.addColorStop(1, 'rgba(244,114,182,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 1.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(253,164,175,0.35)'; ctx.fillRect(z.x - 6, z.y - 900, 12, 900);
            ctx.restore();
            if (Math.random() < 0.6) particles.push({ x: z.x + (Math.random() - 0.5) * 30, y: z.y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 120, life: 0.4, maxLife: 0.4, color: '#f9a8d4', size: 3, glow: true });
        } else if (z.type === 'flareLight') {
            const k = Math.min(1, z.t / 0.6);
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r); g.addColorStop(0, `rgba(254,240,138,${0.35 * k})`); g.addColorStop(1, 'rgba(254,240,138,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(z.x, z.y - 30 - Math.sin(now * 3) * 5, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
    });
};
// máy bay vẽ trên cùng (sau tường): dùng lớp vẽ decoys
const _drawDecoys10 = drawDecoys;
drawDecoys = function (now) {
    _drawDecoys10(now);
    zones.forEach(z => {
        if (z.type !== 'plane') return;
        const a = angOf(z);
        ctx.save(); ctx.translate(z.x + 40, z.y + 60); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.3)'; drawPlaneShape(1.0); ctx.restore(); // bóng
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(a);
        const owner = players.find(q => q.id === z.owner);
        const g = ctx.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, '#94a3b8'); g.addColorStop(1, '#334155');
        ctx.fillStyle = g; drawPlaneShape(1.0);
        ctx.fillStyle = owner ? owner.color : '#ef4444'; ctx.fillRect(-26, -3, 10, 6);
        ctx.fillStyle = 'rgba(125,211,252,0.9)'; ctx.beginPath(); ctx.ellipse(22, 0, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(251,146,60,${0.5 + Math.random() * 0.4})`; ctx.beginPath(); ctx.ellipse(-36, 0, 8 + Math.random() * 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
};
function drawPlaneShape(s) {
    ctx.beginPath();
    ctx.moveTo(34 * s, 0); ctx.quadraticCurveTo(26 * s, -6 * s, 8 * s, -6 * s); ctx.lineTo(0, -34 * s); ctx.lineTo(-8 * s, -34 * s); ctx.lineTo(-6 * s, -6 * s); ctx.lineTo(-24 * s, -5 * s); ctx.lineTo(-32 * s, -16 * s); ctx.lineTo(-36 * s, -16 * s);
    ctx.lineTo(-32 * s, 0); ctx.lineTo(-36 * s, 16 * s); ctx.lineTo(-32 * s, 16 * s); ctx.lineTo(-24 * s, 5 * s); ctx.lineTo(-6 * s, 6 * s); ctx.lineTo(-8 * s, 34 * s); ctx.lineTo(0, 34 * s); ctx.lineTo(8 * s, 6 * s); ctx.quadraticCurveTo(26 * s, 6 * s, 34 * s, 0);
    ctx.closePath(); ctx.fill();
}
