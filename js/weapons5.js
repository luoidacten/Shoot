/** ==================== ĐỢT 3: MA ĐAO NGÀN LƯỠI · NHƯ Ý KIM CÔ BỔNG · TAM KHÚC CÔN · ĐA KHÍ CỤ ====================
 *  Nạp sau robot.js.
 */
Object.assign(WEAPONS, {
    MADAO:     { id: 'MADAO', name: 'Ma Đao Ngàn Lưỡi', icon: '🗡️', type: 'MELEE', mode: 'charge', chargeTime: 0.6, aim: 'arc', color: '#dc2626', damage: 24, fireRate: 24, range: 100, durability: 45, maxDurability: 45, moveScale: 1.0, width: 6, len: 44, tier: 3, desc: 'Mỗi đòn trúng tích 1 LƯỠI ĐAO bay quanh người (tối đa 8). Giữ rồi thả: phóng toàn bộ lưỡi về phía trước, tự tìm địch. Đủ 8 lưỡi: đòn kế tiếp là THIÊN ĐAO chém tròn 360°.' },
    RUYIBANG:  { id: 'RUYIBANG', name: 'Như Ý Kim Cô Bổng', icon: '🥢', type: 'MELEE', mode: 'charge', chargeTime: 1.1, aim: 'line', color: '#facc15', damage: 20, fireRate: 22, range: 110, durability: 60, maxDurability: 60, moveScale: 1.05, width: 5, len: 50, tier: 3, desc: 'Gậy co giãn: chạm = đánh thường (3 đòn, đòn 3 choáng). Giữ càng lâu gậy càng DÀI (tới 420) rồi thọc thẳng; giữ đầy = QUÉT vòng cung khổng lồ. Mỗi đòn trúng tích Kim Cô — đủ 5 thì đòn kế làm choáng 1 giây.' },
    SANJIE:    { id: 'SANJIE', name: 'Tam Khúc Côn', icon: '🥢', type: 'MELEE', mode: 'charge', chargeTime: 0.7, aim: 'arc', color: '#b45309', damage: 16, fireRate: 20, range: 130, durability: 50, maxDurability: 50, moveScale: 1.05, width: 5, len: 46, tier: 3, desc: 'Đa hình 3 dạng. Trường Côn: quét xa, đẩy lùi. Tam Khúc: quất vòng cung đánh qua góc, 3 đòn trúng thì trói. Song Côn: đánh 2 tay cực nhanh. Giữ để chuyển dạng (mỗi lần chuyển là 1 chiêu: xoay hất văng · giật địch về · chống gậy nhảy vọt).' },
    MULTICUBE: { id: 'MULTICUBE', name: 'Đa Khí Cụ', icon: '🧊', type: 'MELEE', mode: 'charge', chargeTime: 0.6, aim: 'arc', color: '#22d3ee', damage: 18, fireRate: 22, range: 80, durability: 60, maxDurability: 60, moveScale: 1.0, width: 8, len: 22, tier: 4, desc: 'Khối lập phương biến hình 6 dạng: KHỐI (đập + chắn đạn phía trước) · KIẾM · SÚNG · CUNG · BÚA · GIÁO. Giữ rồi thả để biến sang dạng kế tiếp (mỗi lần biến nhận 20 khiên).' }
});
Object.assign(BASE_WEIGHTS, { MADAO: 4, RUYIBANG: 4, SANJIE: 5, MULTICUBE: 3 });
const W5FX = [];
const w5MM = p => p.meleeMult || 1, w5DM = p => p.dmgMult || 1;
function meleeBook(p, w, ang, cd) { p.cooldown = (cd || w.fireRate) * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++; if (inBush(p.x, p.y)) p.st.exposed = 1.2; }
function hitArc(p, w, ang, reach, half, dmg, o = {}) {
    const hit = arcFoes(p, ang, reach, half);
    hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: o.knock || 180, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++; if (o.stun) e.stun = Math.max(e.stun, o.stun); if (o.on) o.on(e); });
    if (hit.length) { reduceDurability(p, w, 1); hitStop(o.hs || 0.04); addShake(o.shake || 3); }
    hitDecoysObs(p, p.x + Math.cos(ang) * reach * 0.6, p.y + Math.sin(ang) * reach * 0.6, reach * 0.5, dmg);
    return hit;
}

/* ============================== MA ĐAO NGÀN LƯỠI ============================== */
function madaoAdd(p, n) { p.mdBlades = Math.min(8, (p.mdBlades || 0) + n); if (p.mdBlades >= 8 && !p.mdFull) { p.mdFull = true; floatText(p.x, p.y - 50, '🩸 8 LƯỠI — THIÊN ĐAO SẴN SÀNG', '#f87171', 13); } }
function madaoLaunch(p, ang, n, dmg) {
    for (let i = 0; i < n; i++) p.shotQueue.push({ t: i * 0.05, fn: () => { if (p.hp <= 0) return; W5FX.push({ kind: 'mdBlade', owner: p.id, x: p.x + Math.cos(ang + Math.PI / 2) * (i - n / 2) * 8, y: p.y + Math.sin(ang + Math.PI / 2) * (i - n / 2) * 8, a: ang + (i - n / 2) * 0.06, sp: 900, d: 0, max: 560, dmg, t: 1.2, maxT: 1.2 }); AudioSys.playAt('whoosh', p.x, p.y, 0.15); } });
}
function madaoFire(p, w, ang, charge, mult) {
    const dmg = w.damage * w5MM(p) * mult;
    if (charge >= 0.9 && (p.mdBlades || 0) > 0) { // phóng lưỡi
        meleeBook(p, w, ang, 22); const n = p.mdBlades; p.mdBlades = 0; p.mdFull = false;
        madaoLaunch(p, ang, n, 18 * w5MM(p) * mult); floatText(p.x, p.y - 44, `🗡 PHÓNG ${n} LƯỠI`, '#f87171', 14);
        return;
    }
    meleeBook(p, w, ang);
    if ((p.mdBlades || 0) >= 8) { // Thiên Đao: chém tròn 360°
        p.mdBlades = 0; p.mdFull = false;
        [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang + o, range: 150, color: '#ef4444', width: 18, life: 0.32, maxLife: 0.32, swing: 1, line: false, arc: Math.PI / 2 }));
        hitArc(p, w, ang, 150, Math.PI + 0.01, dmg * 2.4 * (has(p, 'meleeTech') ? 1.3 : 1), { knock: 420, hs: 0.08, shake: 8 });
        ring(p.x, p.y, 10, 150, '#dc2626', 0.45, 7); floatText(p.x, p.y - 50, '🩸 THIÊN ĐAO!', '#f87171', 17); AudioSys.playAt('crit', p.x, p.y, 0.6);
        return;
    }
    AudioSys.playAt('swing', p.x, p.y, 0.5);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: w.range + p.radius, color: '#dc2626', width: 11, life: 0.2, maxLife: 0.2, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false });
    const hit = hitArc(p, w, ang, w.range, 1.25, dmg);
    if (hit.length) madaoAdd(p, hit.length);
}
function updateMdBlade(f, o, dt) {
    const tgt = enemiesOf(o).filter(e => !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < 320).sort((u, v) => dist(f.x, f.y, u.x, u.y) - dist(f.x, f.y, v.x, v.y))[0];
    if (tgt) { const want = Math.atan2(tgt.y - f.y, tgt.x - f.x); f.a += Math.max(-5 * dt, Math.min(5 * dt, angleDiff(want, f.a))); }
    const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
    const e = enemiesOf(o).find(q => !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 10);
    if (e) { dealDamage(e, f.dmg, o.id, { melee: true, knock: 90, angle: f.a }); spark(e.x, e.y, '#f87171', 6, 220); f.t = 0; return; }
    if (pointInObstacle(f.x, f.y, 0) || f.d >= f.max) f.t = 0;
}

/* ============================== NHƯ Ý KIM CÔ BỔNG ============================== */
function ruyiHit(p, e, dmg, knock, ang) {
    let stun = 0;
    p.kimco = (p.kimco || 0) + 1;
    if (p.kimco > (has(p, 'meleeTech') ? 4 : 5)) { p.kimco = 0; stun = 1; floatText(e.x, e.y - 50, '🔱 KIM CÔ!', '#facc15', 14); ring(e.x, e.y, 5, 50, '#facc15', 0.4, 4); }
    dealDamage(e, dmg, p.id, { melee: true, knock, angle: ang }); if (stun) e.stun = Math.max(e.stun, stun); p.stats.hits++;
}
function ruyiFire(p, w, ang, charge, mult) {
    const dmg = w.damage * w5MM(p) * mult;
    if (charge >= 0.98) { // quét vòng cung khổng lồ
        meleeBook(p, w, ang, 34);
        const R = 300; W5FX.push({ kind: 'ruyiSweep', owner: p.id, a: ang, R, t: 0.35, maxT: 0.35 });
        arcFoes(p, ang, R, 1.6).forEach(e => ruyiHit(p, e, dmg * 1.8, 500, Math.atan2(e.y - p.y, e.x - p.x) + 0.6));
        addShake(8); AudioSys.playAt('whoosh', p.x, p.y, 0.7); floatText(p.x, p.y - 44, '🥢 QUÉT NGÀN QUÂN!', '#facc15', 15); reduceDurability(p, w, 1);
        return;
    }
    if (charge >= 0.3) { // dài ra theo thời gian giữ rồi thọc
        meleeBook(p, w, ang, 26);
        const L = 110 + 310 * Math.min(1, charge), free = rayFree(p.x, p.y, ang, L);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: free.d, color: '#facc15', width: 9 + charge * 6, life: 0.22, maxLife: 0.22, swing: 1, line: true });
        lineFoes(p, ang, free.d + 10, 16 + charge * 10).forEach(e => ruyiHit(p, e, dmg * (1 + charge), 300 + charge * 300, ang));
        AudioSys.playAt('whoosh', p.x, p.y, 0.5); reduceDurability(p, w, 1);
        return;
    }
    const n = (p.ruyiN = ((p.ruyiN || 0) % 3) + 1); meleeBook(p, w, ang, n === 3 ? 28 : w.fireRate);
    AudioSys.playAt('swing', p.x, p.y, 0.45);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 110 + p.radius, color: '#fde047', width: 8, life: 0.18, maxLife: 0.18, swing: n === 2 ? -1 : 1, line: n === 3 });
    const hit = n === 3 ? lineFoes(p, ang, 130, 18) : arcFoes(p, ang, 110, 1.0);
    hit.forEach(e => { ruyiHit(p, e, dmg * (n === 3 ? 1.4 : 1), n === 3 ? 320 : 160, Math.atan2(e.y - p.y, e.x - p.x)); if (n === 3) e.stun = Math.max(e.stun, 0.4); });
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.04); }
}

/* ============================== TAM KHÚC CÔN (đa hình) ============================== */
const SJ_FORMS = [{ name: 'Trường Côn', col: '#d97706' }, { name: 'Tam Khúc', col: '#a16207' }, { name: 'Song Côn', col: '#fbbf24' }];
function sjFire(p, w, ang, charge, mult) {
    const f = w.form || 0, dmg = w.damage * w5MM(p) * mult;
    if (charge >= 0.9) { // chuyển dạng = 1 chiêu
        meleeBook(p, w, ang, 18); const next = (f + 1) % 3;
        if (f === 0) { // xoay hất văng
            W5FX.push({ kind: 'sjSpin', owner: p.id, t: 0.35, maxT: 0.35 });
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 130 + e.radius) dealDamage(e, 22 * w5MM(p), p.id, { melee: true, knock: 520, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
            floatText(p.x, p.y - 44, '🌀 XOAY CÔN', '#fbbf24', 13);
        } else if (f === 1) { // giật địch gần nhất về
            const e = enemiesOf(p).filter(q => !(q.air > 0) && dist(q.x, q.y, p.x, p.y) < 240 && lineOfSight(p.x, p.y, q.x, q.y)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0];
            if (e) { const a = Math.atan2(p.y - e.y, p.x - e.x), d = dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 10; const nx = e.x + Math.cos(a) * d, ny = e.y + Math.sin(a) * d; if (!pointInObstacle(nx, ny, e.radius)) { W2FX.push({ kind: 'whip', owner: p.id, a: a + Math.PI, len: dist(p.x, p.y, e.x, e.y), t: 0.25, maxT: 0.25, col: '#d6a15a', pull: true }); e.x = nx; e.y = ny; } dealDamage(e, 16 * w5MM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.5); floatText(e.x, e.y - 44, '⛓ GIẬT VỀ', '#fbbf24', 13); }
        } else { // chống gậy nhảy vọt
            const s = umbFreeSpot(p, p.x + Math.cos(ang) * 210, p.y + Math.sin(ang) * 210);
            startTravel(p, s.x, s.y, 0.42, 'umbLand', { fn: q => { enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, q.x, q.y) < 90 + e.radius) dealDamage(e, 20 * w5MM(q), q.id, { melee: true, knock: 300, angle: Math.atan2(e.y - q.y, e.x - q.x) }); }); ring(q.x, q.y, 6, 90, '#d97706', 0.35, 5); } }, 90);
            floatText(p.x, p.y - 44, '🥢 NHẢY CÔN', '#fbbf24', 13);
        }
        w.form = next; if (has(p, 'meleeTech')) p.hp = Math.min(p.maxHp, p.hp + 10); floatText(p.x, p.y - 60, SJ_FORMS[next].name.toUpperCase(), SJ_FORMS[next].col, 13); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        return;
    }
    if (f === 0) { meleeBook(p, w, ang, 24); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 135 + p.radius, color: '#d97706', width: 9, life: 0.2, maxLife: 0.2, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false }); hitArc(p, w, ang, 135, 0.95, dmg * 1.1, { knock: 360 }); AudioSys.playAt('swing', p.x, p.y, 0.5); }
    else if (f === 1) { // quất vòng cung (đánh vòng qua góc tường)
        meleeBook(p, w, ang, 22); const side = (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1;
        W5FX.push({ kind: 'sjFlail', owner: p.id, a: ang, side, t: 0.25, maxT: 0.25 });
        const cx = p.x + Math.cos(ang) * 80 + Math.cos(ang + side * Math.PI / 2) * 40, cy = p.y + Math.sin(ang) * 80 + Math.sin(ang + side * Math.PI / 2) * 40;
        const hit = enemiesOf(p).filter(e => !(e.air > 0) && (dist(e.x, e.y, cx, cy) < 75 + e.radius || (dist(e.x, e.y, p.x, p.y) < 150 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.6)));
        hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: 140, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.sjHits = (e.sjBy === p.id && world.time - (e.sjT || 0) < 2.5 ? (e.sjHits || 0) : 0) + 1; e.sjBy = p.id; e.sjT = world.time; if (e.sjHits >= 3) { e.sjHits = 0; e.st.root = Math.max(e.st.root || 0, 1.2); floatText(e.x, e.y - 44, '⛓ TRÓI', '#fbbf24', 13); } p.stats.hits++; });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); } AudioSys.playAt('swing', p.x, p.y, 0.45);
    } else { // song côn: 2 đòn cực nhanh
        meleeBook(p, w, ang, 10); const side = (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 75 + p.radius, color: '#fbbf24', width: 6, life: 0.12, maxLife: 0.12, swing: side, line: false });
        hitArc(p, w, ang, 75, 1.0, dmg * 0.7, { knock: 80, hs: 0.02, shake: 1 }); AudioSys.playAt('swing', p.x, p.y, 0.3);
    }
}

/* ============================== ĐA KHÍ CỤ (6 dạng) ============================== */
const CUBE_FORMS = [
    { id: 'cube', name: 'KHỐI', icon: '🧊', type: 'MELEE', range: 70 }, { id: 'sword', name: 'KIẾM', icon: '⚔️', type: 'MELEE', range: 100 },
    { id: 'gun', name: 'SÚNG', icon: '🔫', type: 'GUN', range: 520 }, { id: 'bow', name: 'CUNG', icon: '🏹', type: 'GUN', range: 700 },
    { id: 'hammer', name: 'BÚA', icon: '🔨', type: 'MELEE', range: 95 }, { id: 'spear', name: 'GIÁO', icon: '🔱', type: 'MELEE', range: 160 }
];
const cubeForm = w => CUBE_FORMS[w.form || 0];
function cubeSetForm(p, w, i) {
    w.form = i % CUBE_FORMS.length; const F = cubeForm(w); w.type = F.type; w.range = F.range; w.aim = F.type === 'GUN' ? 'line' : 'arc';
    p.st.shield = Math.min(70, (p.st.shield || 0) + (has(p, 'meleeTech') ? 35 : 20)); p.st.shieldT = Math.max(p.st.shieldT || 0, 3);
    W5FX.push({ kind: 'cubeMorph', owner: p.id, t: 0.35, maxT: 0.35 }); floatText(p.x, p.y - 50, `${F.icon} ${F.name}`, '#67e8f9', 14); AudioSys.playAt('rail', p.x, p.y, 0.3);
}
function cubeFire(p, w, ang, charge, mult) {
    const F = cubeForm(w), dmg = 18 * w5MM(p) * mult;
    if (charge >= 0.9) { meleeBook(p, w, ang, 14); return cubeSetForm(p, w, (w.form || 0) + 1); }
    if (F.id === 'cube') { meleeBook(p, w, ang, 26); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 70 + p.radius, color: '#67e8f9', width: 12, life: 0.16, maxLife: 0.16, swing: 1, line: true }); hitArc(p, w, ang, 70, 0.9, dmg * 1.1, { knock: 420, stun: 0.25 }); AudioSys.playAt('block', p.x, p.y, 0.4); }
    else if (F.id === 'sword') { meleeBook(p, w, ang, 18); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 100 + p.radius, color: '#a5f3fc', width: 10, life: 0.2, maxLife: 0.2, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false }); hitArc(p, w, ang, 100, 1.2, dmg * 1.25); AudioSys.playAt('swing', p.x, p.y, 0.5); }
    else if (F.id === 'gun') { meleeBook(p, w, ang, 16); for (let i = 0; i < 3; i++) p.shotQueue.push({ t: i * 0.06, fn: () => { if (p.hp <= 0) return; const m = muzzle(p, w, p.angle); spawnBullet(p, m.x, m.y, p.angle + (Math.random() - 0.5) * 0.06, { speed: 24, damage: 9 * w5DM(p) * mult, range: 520, color: '#67e8f9', size: 2.8, trail: 26 }); p.muzzle = 0.04; AudioSys.playAt('smg', p.x, p.y, 0.15); } }); }
    else if (F.id === 'bow') { meleeBook(p, w, ang, 28); const m = muzzle(p, w, ang); spawnBullet(p, m.x, m.y, ang, { speed: 40, damage: 40 * w5DM(p) * mult, range: 720, color: '#a5f3fc', size: 4, pierce: true, trail: 70, arrow: true }); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
    } else if (F.id === 'hammer') { meleeBook(p, w, ang, 34); const x = p.x + Math.cos(ang) * 60, y = p.y + Math.sin(ang) * 60; ring(x, y, 8, 90, '#67e8f9', 0.35, 6); addShake(6); AudioSys.playAt('slam', x, y, 0.45); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < 90 + e.radius) { dealDamage(e, dmg * 1.6, p.id, { melee: true, knock: 380, angle: Math.atan2(e.y - y, e.x - x) }); e.stun = Math.max(e.stun, 0.6); p.stats.hits++; } }); }
    else { meleeBook(p, w, ang, 22); p.kx += Math.cos(ang) * 150; p.ky += Math.sin(ang) * 150; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 160 + p.radius, color: '#67e8f9', width: 7, life: 0.16, maxLife: 0.16, swing: 1, line: true }); lineFoes(p, ang, 160 + p.radius, 18).forEach(e => { dealDamage(e, dmg * 1.3, p.id, { melee: true, knock: 300, angle: ang }); p.stats.hits++; }); AudioSys.playAt('swing', p.x, p.y, 0.45); }
}
// dạng Khối: chắn đạn phía trước khi không đánh
function cubeBlock(p, w) { if ((w.form || 0) !== 0 || world.time - (p.lastFireT || -9) < 0.35) return; for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > p.radius + 28 || Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 0.9) continue; spark(b.x, b.y, '#a5f3fc', 4, 140); bullets.splice(i, 1); } }

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _fireWeaponW5 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!w) return _fireWeaponW5(p, w, ang, charge, enemy);
    if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; }
    const m = () => attackMult(p, w);
    if (w.id === 'MADAO') return madaoFire(p, w, ang, charge || 0, m());
    if (w.id === 'RUYIBANG') return ruyiFire(p, w, ang, charge || 0, m());
    if (w.id === 'SANJIE') return sjFire(p, w, ang, p.isBot && Math.random() < 0.6 ? 0 : (charge || 0), m());
    if (w.id === 'MULTICUBE') return cubeFire(p, w, ang, charge || 0, m());
    return _fireWeaponW5(p, w, ang, charge, enemy);
};
const _upeW5 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeW5(dt);
    for (let i = W5FX.length - 1; i >= 0; i--) { const f = W5FX[i]; if (!f) continue; f.t -= dt; const o = players.find(q => q.id === f.owner); if (f.kind === 'mdBlade' && o && f.t > 0) updateMdBlade(f, o, dt); if (f.t <= 0) W5FX.splice(i, 1); }
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => { if (p.hp <= 0) return; const w = getCurrentWeapon(p); if (w && w.id === 'MULTICUBE') cubeBlock(p, w); if ((p.mdOrbT || 0) > world.time) mdOrbit(p, dt); });
};
// Huyết Đao Trận: lưỡi xoay quanh người
function mdOrbit(p, dt) {
    p.mdOrbTick = (p.mdOrbTick || 0) + dt; if (p.mdOrbTick < 0.25) return; p.mdOrbTick = 0;
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 110 + e.radius) { dealDamage(e, 7 * w5MM(p), p.id, { melee: true, knock: 60, angle: Math.atan2(e.y - p.y, e.x - p.x) }); spark(e.x, e.y, '#f87171', 3, 160); } });
}

/* ============================== BẬC THẦY · KỸ THUẬT CAO ============================== */
Object.assign(MELEE_P, { MADAO: 'Thiên Đao mạnh hơn 30%.', RUYIBANG: 'Kim Cô chỉ cần 4 đòn (thay vì 5).', SANJIE: 'Mỗi lần chuyển dạng hồi 10 máu.', MULTICUBE: 'Mỗi lần biến dạng nhận 35 khiên thay vì 20.' });
const _meleeTechW5 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'MADAO') { p.mdOrbT = world.time + 4; madaoAdd(p, 4); floatText(p.x, p.y - 44, '🩸 HUYẾT ĐAO TRẬN', '#f87171', 15); AudioSys.playAt('rail', p.x, p.y, 0.4); return; }
    if (w.id === 'RUYIBANG') { // Định Hải Thần Châm: cắm gậy khổng lồ thành cột chắn + sóng chấn
        const d = Math.max(80, Math.min(300, p.skillDist || 240)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (!pointInObstacle(x, y, 20)) { const o = { x: x - 20, y: y - 20, w: 40, h: 40, wood: false, temp: 6, hp: 500, maxHp: 500, pillar: true }; obstacles.push(o); }
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < 150 + e.radius) { dealDamage(e, 30 * w5MM(p), p.id, { melee: true, knock: 500, angle: Math.atan2(e.y - y, e.x - x) }); e.stun = Math.max(e.stun, 0.7); } });
        ring(x, y, 10, 150, '#facc15', 0.5, 8); addShake(9); AudioSys.playAt('slam', x, y, 0.6); floatText(p.x, p.y - 44, '🔱 ĐỊNH HẢI THẦN CHÂM', '#facc15', 15);
        return;
    }
    if (w.id === 'SANJIE') { p.sjSpinT = world.time + 2; W5FX.push({ kind: 'sjSpin', owner: p.id, t: 2, maxT: 2 }); for (let k = 0; k < 8; k++) p.shotQueue.push({ t: k * 0.25, fn: () => { if (p.hp <= 0) return; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 120 + e.radius) dealDamage(e, 8 * w5MM(p), p.id, { melee: true, knock: 200, angle: Math.atan2(e.y - p.y, e.x - p.x) }); }); for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 120) { spark(b.x, b.y, '#fbbf24', 3, 140); bullets.splice(i, 1); } } } }); floatText(p.x, p.y - 44, '🌀 CUỒNG PHONG CÔN', '#fbbf24', 15); return; }
    if (w.id === 'MULTICUBE') { // Khối Nổ: 6 mảnh văng ra 6 hướng rồi tụ lại
        for (let i = 0; i < 6; i++) W5FX.push({ kind: 'mdBlade', owner: p.id, x: p.x, y: p.y, a: i * Math.PI / 3, sp: 700, d: 0, max: 260, dmg: 22 * w5MM(p), t: 0.8, maxT: 0.8, cube: true });
        p.st.shield = Math.min(80, (p.st.shield || 0) + 30); p.st.shieldT = 4; ring(p.x, p.y, 8, 90, '#67e8f9', 0.4, 5); floatText(p.x, p.y - 44, '🧊 KHỐI NỔ', '#67e8f9', 15); AudioSys.playAt('explosion', p.x, p.y, 0.3);
        return;
    }
    return _meleeTechW5(p);
};
const _gunModW5 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'MULTICUBE') { const m = muzzle(p, w, a); beams.push({ x1: m.x, y1: m.y, x2: m.x + Math.cos(a) * 700, y2: m.y + Math.sin(a) * 700, life: 0.35, maxLife: 0.35, color: '#67e8f9' }); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, m.x, m.y, m.x + Math.cos(a) * 700, m.y + Math.sin(a) * 700) < e.radius + 20) dealDamage(e, 55 * w5DM(p), p.id, { knock: 260, angle: a }); }); addShake(6); AudioSys.playAt('rail', p.x, p.y, 0.6); floatText(p.x, p.y - 44, '🧊 TIA HỘI TỤ', '#67e8f9', 15); return; }
    if (w.id === 'SANJIE') { [-0.25, 0, 0.25].forEach(o => htBullet(p, a + o, { damage: 18 * w5DM(p), speed: 18, size: 6, color: '#d97706', life: 0.7, trail: 30, knock: 200 })); floatText(p.x, p.y - 44, '🥢 CÔN PHI', '#fbbf24', 15); return; }
    return _gunModW5(p);
};
Object.assign(HT, {
    MADAO: ['NGÀN LƯỠI GIÁNG', p => { const a = aimDir(p), d = Math.max(100, Math.min(380, p.skillDist || 300)), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d; zones.push({ type: 'artyWarn', x: cx, y: cy, r: 140, t: 0.6, maxT: 0.6, owner: p.id, tick: 0 }); for (let i = 0; i < 14; i++) p.shotQueue.push({ t: 0.6 + i * 0.05, fn: () => { const r = Math.sqrt(Math.random()) * 140, t = Math.random() * 6.28, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; beams.push({ x1: x + 20, y1: y - 260, x2: x, y2: y, life: 0.2, maxLife: 0.2, color: '#ef4444' }); enemiesOf(p).forEach(e => { if (dist(e.x, e.y, x, y) < e.radius + 30) dealDamage(e, 14 * w5MM(p), p.id, { melee: true, knock: 1 }); }); spark(x, y, '#f87171', 5, 160); } }); floatText(p.x, p.y - 44, '🗡 NGÀN LƯỠI GIÁNG', '#f87171', 15); }],
    RUYIBANG: ['THIÊN BỔNG GIÁNG THẾ', p => { const a = aimDir(p), L = 520, x2 = p.x + Math.cos(a) * L, y2 = p.y + Math.sin(a) * L; W5FX.push({ kind: 'ruyiSlam', owner: p.id, a, L, t: 0.6, maxT: 0.6 }); p.shotQueue.push({ t: 0.35, fn: () => { enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, p.x, p.y, x2, y2) < e.radius + 34) { dealDamage(e, 60 * w5MM(p), p.id, { melee: true, knock: 300, angle: a + Math.PI / 2 }); e.stun = Math.max(e.stun, 1.2); } }); obstacles.slice().forEach(o => { if (segRect(p.x, p.y, x2, y2, o) >= 0) damageObstacle(o, 120, p); }); addShake(12); hitStop(0.08); AudioSys.playAt('slam', p.x, p.y, 0.8); } }); floatText(p.x, p.y - 44, '🔱 THIÊN BỔNG GIÁNG THẾ', '#facc15', 15); }],
    SANJIE: ['BÁCH CÔN', p => { const a = aimDir(p); W5FX.push({ kind: 'sjBoom', owner: p.id, x: p.x, y: p.y, a, d: 0, back: false, t: 3, maxT: 3, hit: new Set() }); floatText(p.x, p.y - 44, '🥢 BÁCH CÔN', '#fbbf24', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.6); }],
    MULTICUBE: ['LỤC HÌNH LIÊN KÍCH', p => { const w = getCurrentWeapon(p); for (let i = 0; i < 6; i++) p.shotQueue.push({ t: i * 0.18, fn: () => { if (p.hp <= 0 || getCurrentWeapon(p) !== w) return; w.form = i; const F = cubeForm(w); w.type = F.type; w.range = F.range; p.cooldown = 0; cubeFire(p, w, aimDir(p), F.id === 'bow' ? 0.9 : 0, 1.3); floatText(p.x, p.y - 50, F.icon, '#67e8f9', 16); } }); p.shotQueue.push({ t: 1.15, fn: () => { if (getCurrentWeapon(p) === w) cubeSetForm(p, w, 0); } }); floatText(p.x, p.y - 44, '🧊 LỤC HÌNH LIÊN KÍCH', '#67e8f9', 15); }]
});
// Bách Côn: ném côn xoay bay ra rồi quay về
const _upeSjBoom = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeSjBoom(dt);
    W5FX.forEach(f => { if (f.kind !== 'sjBoom' || f.t <= 0) return; const o = players.find(q => q.id === f.owner); if (!o) { f.t = 0; return; } const sp = 720 * dt;
        if (!f.back) { f.x += Math.cos(f.a) * sp; f.y += Math.sin(f.a) * sp; f.d += sp; if (f.d > 380 || pointInObstacle(f.x, f.y, 0)) { f.back = true; f.hit.clear(); } }
        else { const d = dist(f.x, f.y, o.x, o.y); if (d < sp + o.radius) { f.t = 0; return; } const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp; }
        enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 36) { f.hit.add(e.id); dealDamage(e, 24 * w5MM(o), o.id, { melee: true, knock: 260, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.stun = Math.max(e.stun, 0.4); } }); });
};
CARDS.meleeTech.desc += '<br>Ma Đao = Huyết Đao Trận · Kim Cô Bổng = Định Hải Thần Châm · Tam Khúc Côn = Cuồng Phong Côn · Đa Khí Cụ = Khối Nổ.';
CARDS.gunMod.desc += '<br>Đa Khí Cụ (dạng súng/cung) = Tia Hội Tụ.';
Object.assign(HT_PROFILE, { MADAO: { aim: 'point', R: 380, shape: 'point', aoe: 140, arc: true, col: '239,68,68' }, RUYIBANG: { aim: 'dir', R: 520, shape: 'line', w: 68, col: '250,204,21' }, SANJIE: { aim: 'dir', R: 380, shape: 'line', w: 72, col: '217,119,6' }, MULTICUBE: { aim: 'dir', R: 300, shape: 'cone', half: 0.6, col: '103,232,249', tag: '6 DẠNG LIÊN KÍCH' } });
const _skillProfileW5 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && id === 'meleeTech') { if (w.id === 'MADAO') return { aim: null, shape: 'selfaoe', aoe: 110, col: '239,68,68' }; if (w.id === 'RUYIBANG') return { aim: 'point', R: 300, shape: 'point', aoe: 150, col: '250,204,21' }; if (w.id === 'SANJIE') return { aim: null, shape: 'selfaoe', aoe: 120, col: '217,119,6' }; if (w.id === 'MULTICUBE') return { aim: null, shape: 'selfaoe', aoe: 260, col: '103,232,249' }; }
    if (w && id === 'gunMod') { if (w.id === 'MULTICUBE') return { aim: 'dir', R: 700, shape: 'line', w: 40, col: '103,232,249' }; if (w.id === 'SANJIE') return { aim: 'dir', R: 340, shape: 'cone', half: 0.3, col: '217,119,6' }; }
    return _skillProfileW5(p, id);
};

/* ============================== HÌNH VẼ ============================== */
Object.assign(ART2, {
    MADAO: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 6, -2.2, 9, 4.4, '#1c1917', 1.6); c.fillStyle = '#7f1d1d'; c.beginPath(); c.moveTo(x0 + 2, -6); c.lineTo(x0 + 6, 0); c.lineTo(x0 + 2, 6); c.lineTo(x0 - 1, 0); c.closePath(); c.fill(); outl(c, 0.8); // chắn tay
        const g = c.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#fecaca'); g.addColorStop(0.5, '#b91c1c'); g.addColorStop(1, '#450a0a');
        c.beginPath(); c.moveTo(x0 + 5, -3); c.lineTo(x0 + 22, -5); c.lineTo(x0 + 26, -2); c.lineTo(x0 + 36, -4); c.lineTo(x0 + 44, 0); c.lineTo(x0 + 36, 3); c.lineTo(x0 + 24, 2.5); c.lineTo(x0 + 5, 3); c.closePath(); c.fillStyle = g; c.fill(); outl(c, 1); // lưỡi răng cưa
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(248,113,113,${0.4 + Math.sin(now * 6) * 0.2 + ch * 0.4})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 6, -2.6); c.lineTo(x0 + 43, -0.3); c.stroke(); c.restore();
        // lưỡi đã tích bay sau lưng
        const n = p ? (p.mdBlades || 0) : 0; for (let i = 0; i < n; i++) { const t = now * 2 + i * Math.PI * 2 / Math.max(1, n); c.save(); c.translate(x0 - 14 + Math.cos(t) * 8, Math.sin(t) * 16); c.rotate(t); c.fillStyle = 'rgba(239,68,68,0.85)'; c.beginPath(); c.moveTo(-5, -1.2); c.lineTo(6, 0); c.lineTo(-5, 1.2); c.closePath(); c.fill(); c.restore(); }
    },
    RUYIBANG: (c, w, r, x0, ch) => {
        const L = 52 + ch * 40; metal(c, x0 - 24, -2.4, L, 4.8, '#7f1d1d', 2, 0.4);
        const g = c.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, '#fef9c3'); g.addColorStop(1, '#ca8a04');
        [x0 - 26, x0 - 24 + L - 6].forEach(x => { c.fillStyle = g; c.fillRect(x, -3.4, 8, 6.8); outl(c, 0.8); }); // 2 đầu vàng
        if (ch > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(250,204,21,${ch * 0.4})`; c.fillRect(x0 - 26, -5, L + 4, 10); c.restore(); }
    },
    SANJIE: (c, w, r, x0, ch, now) => {
        const f = w.form || 0, seg = (x, y, a, L) => { c.save(); c.translate(x, y); c.rotate(a); wood(c, 0, -2.2, L, 4.4, 2); metal(c, -1, -2.8, 3, 5.6, '#a16207', 1); metal(c, L - 2, -2.8, 3, 5.6, '#a16207', 1); c.restore(); };
        if (f === 0) { seg(x0 - 14, 0, 0, 20); seg(x0 + 7, 0, 0, 20); seg(x0 + 28, 0, 0, 20); }
        else if (f === 1) { seg(x0 - 4, 0, 0, 18); const a2 = Math.sin(now * 8) * 0.6; seg(x0 + 16, 0, a2, 16); seg(x0 + 16 + Math.cos(a2) * 18, Math.sin(a2) * 18, a2 * 1.8, 16); c.strokeStyle = '#a8a29e'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 14, 0); c.lineTo(x0 + 17, 0); c.stroke(); }
        else { [-7, 7].forEach(oy => seg(x0 - 2, oy, oy < 0 ? -0.15 : 0.15, 24)); }
    },
    MULTICUBE: (c, w, r, x0, ch, now) => {
        const F = cubeForm(w), glow = `rgba(103,232,249,${0.5 + Math.sin(now * 5) * 0.25})`;
        const cube = (x, s) => { c.fillStyle = '#0e7490'; c.fillRect(x - s, -s, s * 2, s * 2); c.strokeStyle = glow; c.lineWidth = 1.2; c.strokeRect(x - s, -s, s * 2, s * 2); c.beginPath(); c.moveTo(x - s, -s); c.lineTo(x + s, s); c.moveTo(x + s, -s); c.lineTo(x - s, s); c.stroke(); };
        if (F.id === 'cube') cube(x0 + 6, 9);
        else if (F.id === 'sword') { cube(x0 - 2, 4); blade(c, [[x0 + 2, -2.4], [x0 + 32, -1.4], [x0 + 37, 0], [x0 + 32, 1.4], [x0 + 2, 2.4]], '#e0f2fe', '#0891b2'); }
        else if (F.id === 'gun') { cube(x0 - 2, 5); metal(c, x0 + 3, -2.5, 20, 5, '#155e75', 1.5); c.fillStyle = glow; c.fillRect(x0 + 6, -1, 12, 2); MUZ.MULTICUBE = x0 + 23; }
        else if (F.id === 'bow') { cube(x0, 4); c.strokeStyle = '#22d3ee'; c.lineWidth = 2.6; c.beginPath(); c.arc(x0 + 4, 0, 16, -1.2, 1.2); c.stroke(); c.strokeStyle = 'rgba(224,242,254,0.8)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + 4 + Math.cos(1.2) * 16, -15); c.lineTo(x0 + 4 - ch * 8, 0); c.lineTo(x0 + 4 + Math.cos(1.2) * 16, 15); c.stroke(); }
        else if (F.id === 'hammer') { metal(c, x0 - 4, -2, 22, 4, '#155e75', 1.5); cube(x0 + 22, 8); }
        else { metal(c, x0 - 8, -1.8, 40, 3.6, '#155e75', 1.2); c.fillStyle = '#a5f3fc'; c.beginPath(); c.moveTo(x0 + 32, -4); c.lineTo(x0 + 44, 0); c.lineTo(x0 + 32, 4); c.closePath(); c.fill(); outl(c, 0.8); cube(x0 - 6, 3.5); }
    }
});
const _drawW2FxW5 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxW5(now);
    ctx.save(); ctx.lineCap = 'round';
    W5FX.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const k = Math.max(0, f.t / f.maxT);
        if (f.kind === 'mdBlade') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = f.cube ? 'rgba(103,232,249,0.9)' : 'rgba(239,68,68,0.9)'; ctx.beginPath(); ctx.moveTo(-10, -2.5); ctx.lineTo(12, 0); ctx.lineTo(-10, 2.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = f.cube ? 'rgba(103,232,249,0.3)' : 'rgba(239,68,68,0.3)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-8, 0); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'ruyiSweep') { const sp = f.a - 1.6 + (1 - k) * 3.2; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(250,204,21,${0.4 * k})`; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(o.x, o.y, f.R * 0.6, f.a - 1.6, sp); ctx.stroke(); ctx.restore(); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(sp); metal(ctx, 0, -4, f.R, 8, '#7f1d1d', 3, 0.4); ctx.fillStyle = '#facc15'; ctx.fillRect(f.R - 12, -5, 12, 10); ctx.restore(); }
        else if (f.kind === 'ruyiSlam') { const fall = Math.min(1, (1 - k) / 0.6); ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(f.a); ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, -10, f.L, 20); ctx.translate(0, -(1 - fall) * 160); metal(ctx, 0, -8, f.L, 16, '#7f1d1d', 4, 0.4); ctx.fillStyle = '#facc15'; ctx.fillRect(0, -10, 16, 20); ctx.fillRect(f.L - 16, -10, 16, 20); ctx.restore(); }
        else if (f.kind === 'sjSpin') { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(now * 18); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(251,191,36,${0.45 * Math.min(1, k * 3)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 1.3); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; wood(ctx, -60, -2.5, 120, 5, 2); ctx.restore(); }
        else if (f.kind === 'sjFlail') { const pr = 1 - k, sw = f.side * (pr * 2 - 1) * 1.1; const a = f.a + sw, L1 = 60, L2 = 55; const x1 = o.x + Math.cos(f.a) * 20, y1 = o.y + Math.sin(f.a) * 20, x2 = x1 + Math.cos(a) * L1, y2 = y1 + Math.sin(a) * L1, x3 = x2 + Math.cos(a + sw) * L2, y3 = y2 + Math.sin(a + sw) * L2; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'sjBoom') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 20); wood(ctx, -26, -2.5, 52, 5, 2); ctx.rotate(Math.PI / 3); wood(ctx, -20, -2.5, 40, 5, 2); ctx.restore(); }
        else if (f.kind === 'cubeMorph') { const R = 14 + (1 - k) * 30; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate((1 - k) * 2); ctx.strokeStyle = `rgba(103,232,249,${k})`; ctx.lineWidth = 2; ctx.strokeRect(-R, -R, R * 2, R * 2); ctx.restore(); }
    });
    players.forEach(p => { if (p.hp > 0 && p.mdOrbT > world.time) { for (let i = 0; i < 6; i++) { const a = now * 5 + i * Math.PI / 3; ctx.save(); ctx.translate(p.x + Math.cos(a) * 80, p.y + Math.sin(a) * 80); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = 'rgba(239,68,68,0.9)'; ctx.beginPath(); ctx.moveTo(-9, -2.5); ctx.lineTo(11, 0); ctx.lineTo(-9, 2.5); ctx.closePath(); ctx.fill(); ctx.restore(); } } });
    ctx.restore();
};
