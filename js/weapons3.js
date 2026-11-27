/** ==================== 4 VŨ KHÍ MỚI (đợt 2) ====================
 *  Súng Phun Axit · Súng Đĩa Nảy · Gunblade · Nhật Nguyệt Cung
 *  Mỗi vũ khí có nội tại + kỹ năng Bậc Thầy + Kỹ Thuật Cao, hình vẽ, VFX, vùng ngắm. Nạp sau uniqskills.js.
 */
Object.assign(WEAPONS, {
    ACID:     { id: 'ACID', name: 'Súng Phun Axit', icon: '⚗️', type: 'GUN', mode: 'tap', aim: 'line', color: '#84cc16', damage: 8, fireRate: 34, speed: 0, spread: 0, range: 440, magSize: 8, mag: 8, reserve: 24, reloadTime: 2.0, moveScale: 0.92, width: 7, len: 26, tier: 2, desc: 'Bắn cục axit theo vòng cung tới chỗ ngắm, rơi xuống tạo vũng axit. Axit ăn giáp gấp 3 lần, làm mòn tường & thùng; vũng chồng lên nhau thì sát thương tăng dần. Chậm, sát thương trực tiếp thấp.' },
    DISC:     { id: 'DISC', name: 'Súng Đĩa Nảy', icon: '💿', type: 'GUN', mode: 'tap', aim: 'line', color: '#e2e8f0', damage: 15, fireRate: 24, speed: 0, spread: 0, range: 900, magSize: 6, mag: 6, reserve: 18, reloadTime: 1.6, moveScale: 1.0, width: 6, len: 24, tier: 2, desc: 'Đĩa sắc nảy trên tường tới 4 lần, mỗi lần nảy mạnh thêm 15%. Vùng ngắm hiện sẵn đường nảy — phục kích vòng qua góc tường. Bắn thẳng ở bãi trống thì yếu.' },
    GUNBLADE: { id: 'GUNBLADE', name: 'Gunblade', icon: '🗡️', type: 'GUN', mode: 'charge', chargeTime: 0.8, narrow: [0.4, 0.012], aim: 'line', color: '#f43f5e', damage: 55, fireRate: 26, speed: 34, spread: 0.4, range: 600, durability: 40, maxDurability: 40, moveScale: 1.0, width: 5, len: 40, tier: 3, desc: 'Dạng súng: giữ để ngắm, bắn 1 phát cực mạnh → chuyển sang kiếm (dù trúng hay trượt). Dạng kiếm: chém kèm lướt ngắn, giữ để chém rộng hơn; chỉ quay lại súng khi chém TRÚNG.' },
    SUNMOON:  { id: 'SUNMOON', name: 'Nhật Nguyệt Cung', icon: '🌗', type: 'GUN', mode: 'charge', chargeTime: 0.55, aim: 'line', color: '#fbbf24', damage: 22, fireRate: 20, speed: 0, spread: 0, range: 560, moveScale: 1.0, width: 5, len: 34, tier: 3, desc: 'Nhật Cung: bắn thẳng (không ngắm), tên gắn Ấn Nguyệt; giữ để lướt 2 lần (né đạn, xuyên tường, gây chảy máu) rồi thành song đao. Nguyệt Song Đao: chém nhanh gắn Ấn Nhật; giữ để nhảy lùi bắn 1 mũi tên cực mạnh (choáng + mù) rồi thành cung. Ấn Nhật + Ấn Nguyệt trên cùng địch → NỔ sát thương chuẩn.' }
});
Object.assign(BASE_WEIGHTS, { ACID: 6, DISC: 6, GUNBLADE: 4, SUNMOON: 4 });
AIM_ZOOM.GUNBLADE = 0.85;
const W3 = []; // vật thể của 4 vũ khí
const w3MM = p => p.meleeMult || 1, w3DM = p => p.dmgMult || 1;

/* ============================== TIỆN ÍCH CHUNG ============================== */
function w3GunTick(p, w, ang) { // phần "sổ sách" của một phát súng tự xử lý
    p.cooldown = w.fireRate * p.fireRateMult * (p.st.rage > 0 ? 0.75 : 1); p.ghostT = 0; p.angle = ang; p.lastFireT = world.time;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    onAttack(p); p.stats.shots++; p.muzzle = 0.06; p.recoil = 1;
    if (w.magSize) { if (!world.infiniteAmmo) w.mag--; else w.mag = Math.max(1, w.mag - 1); if (w.mag <= 0 && w.reserve <= 0 && !world.infiniteAmmo) p.autoThrowT = 0.45; }
}
function w3AimDist(p, enemy, def, max) {
    let d = def;
    if (p.manualEngaged && p.aimDist) d = p.aimDist;
    else if (enemy && enemy.hp > 0 && targetable(p, enemy)) d = dist(p.x, p.y, enemy.x, enemy.y);
    return Math.max(70, Math.min(max, d));
}
/** sát thương chuẩn: trừ đúng T máu, bỏ qua giáp / khiên / giảm sát thương (vẫn bị bất tử chặn) */
function trueDamage(target, T, attackerId) {
    if (!target || target.hp <= 0 || target.spawnShield > 0 || (target.st && target.st.invuln > 0)) return;
    const hp0 = target.hp, ar = target.armor || 0, sh = (target.st && target.st.shield) || 0;
    target.armor = 0; if (target.st) target.st.shield = 0;
    try { dealDamage(target, T, attackerId, { raw: true, knock: 1, melee: true }); }
    finally { if (target.hp > 0) { target.armor = ar; if (target.st) target.st.shield = sh; } }
    const lost = hp0 - Math.max(0, target.hp);
    if (target.hp > 0 && lost < T) { target.hp -= T - lost; if (target.hp <= 0) { target.hp = 0; killPlayer(target, attackerId); } }
}
function w3Step(f, step, pad = 3) { // di chuyển có nảy tường (trả về true nếu vừa nảy)
    const nx = f.x + f.vx * step, ny = f.y + f.vy * step;
    const blocked = (x, y) => x < pad || y < pad || x > MAP_W - pad || y > MAP_H - pad || !!pointInObstacle(x, y, pad);
    if (!blocked(nx, ny)) { f.x = nx; f.y = ny; return false; }
    const bx = blocked(nx, f.y), by = blocked(f.x, ny);
    if (bx && !by) f.vx = -f.vx; else if (by && !bx) f.vy = -f.vy; else { f.vx = -f.vx; f.vy = -f.vy; }
    return true;
}

/* ============================== ⚗️ SÚNG PHUN AXIT ============================== */
function acidFire(p, w, ang, enemy) {
    w3GunTick(p, w, ang);
    const d = w3AimDist(p, enemy, 300, w.range), m = muzzle(p, w, ang);
    const tx = p.x + Math.cos(ang) * d, ty = p.y + Math.sin(ang) * d;
    W3.push({ kind: 'blob', owner: p.id, x0: m.x, y0: m.y, x1: tx, y1: ty, t: 0, T: 0.35 + d / 1300, r: 55, splash: 8, size: 6 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.25); addShake(1);
}
function acidPool(o, x, y, r, t) {
    const T = t * (has(o, 'gunMod') && getCurrentWeapon(o).id === 'ACID' ? 1.5 : 1);
    zones.push({ type: 'acid', x, y, r, t: T, maxT: T, owner: o.id, tick: Math.random() * 0.25 });
}
function acidHit(target, d, ownerId) { // axit ăn giáp gấp 3
    if (target.armor > 0) { const eat = Math.min(target.armor, d * 3); target.armor -= eat; d -= eat / 3; if (Math.random() < 0.3) floatText(target.x, target.y - 30, '🛡 -' + Math.round(eat), '#bef264', 11); }
    if (target.st && target.st.shield > 0) { const eat = Math.min(target.st.shield, d * 3); target.st.shield -= eat; d -= eat / 3; }
    if (d > 0.01) dealDamage(target, d, ownerId, { zone: true, knock: 1 });
}
function blobLand(f, o) {
    spark(f.x1, f.y1, '#a3e635', 10, 200); AudioSys.playAt('hit', f.x1, f.y1, 0.25);
    for (let k = 0; k < 8; k++) particles.push({ x: f.x1, y: f.y1, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 0.4, maxLife: 0.4, color: '#bef264', size: 3 });
    enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x1, f.y1) < e.radius + 34) acidHit(e, f.splash * w3DM(o), o.id); });
    if (f.big) { // Bom Ăn Mòn
        ring(f.x1, f.y1, 10, 130, '#84cc16', 0.5, 7); addShake(6); AudioSys.playAt('explosion', f.x1, f.y1, 0.4);
        enemiesOf(o).forEach(e => {
            if (e.air > 0 || dist(e.x, e.y, f.x1, f.y1) > 130 + e.radius) return;
            dealDamage(e, 18 * w3DM(o), o.id, { knock: 200, angle: Math.atan2(e.y - f.y1, e.x - f.x1) });
            const had = (e.armor || 0) + ((e.st && e.st.shield) || 0);
            e.armor = 0; if (e.st) e.st.shield = 0; e.corrodeT = world.time + 3;
            floatText(e.x, e.y - 46, had > 0 ? `☣ PHÁ GIÁP -${Math.round(had)}` : '☣ ĂN MÒN', '#bef264', 15);
        });
    }
    acidPool(o, f.x1, f.y1, f.r, f.big ? 5 : 4.5);
}
function updateAcidZone(z, dt) {
    const o = players.find(q => q.id === z.owner);
    if (z.tick < 0.25) return;
    z.tick = 0;
    // người đứng trong vũng: đếm số vũng chồng nhau → sát thương tăng dần
    players.forEach(e => {
        if (e.hp <= 0 || e.air > 0 || (o && (e === o || sameTeam(o, e)))) return;
        if (dist(e.x, e.y, z.x, z.y) > z.r + e.radius * 0.5) return;
        const n = zones.filter(q => q.type === 'acid' && dist(e.x, e.y, q.x, q.y) < q.r + e.radius * 0.5).length;
        const d = 3 * (1 + 0.3 * (n - 1)); // mỗi vũng tự gây sát thương, vũng chồng nhau khuếch đại lẫn nhau
        acidHit(e, d * (o ? w3DM(o) : 1), z.owner);
        e.st.slow = Math.max(e.st.slow || 0, 0.15);
        if (n >= 2 && Math.random() < 0.25) floatText(e.x, e.y - 34, `☣ ×${n}`, '#bef264', 12);
    });
    // làm mòn tường, thùng
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const ob = obstacles[i]; if (!ob) continue; if (ob.energy) continue;
        const cx = Math.max(ob.x, Math.min(z.x, ob.x + ob.w)), cy = Math.max(ob.y, Math.min(z.y, ob.y + ob.h));
        if (dist(cx, cy, z.x, z.y) > z.r) continue;
        ob.hit = 0.1; ob.acidT = world.time + 0.6;
        if (ob.wood || ob.temp !== undefined) damageObstacle(ob, 7, o);
        else { ob.acidHp = (ob.acidHp === undefined ? 260 : ob.acidHp) - 6; if (ob.acidHp <= 0) { smoke(ob.x + ob.w / 2, ob.y + ob.h / 2, 8, 'rgba(163,230,53,0.35)', 18); floatText(ob.x + ob.w / 2, ob.y + ob.h / 2, '☣ TAN CHẢY', '#bef264', 14); obstacles.splice(i, 1); } }
    }
    for (let i = crates.length - 1; i >= 0; i--) { const c = crates[i]; if (!c) continue; if (dist(c.x, c.y, z.x, z.y) > z.r + 10) continue; c.acidT = (c.acidT || 0) + 0.25; if (c.acidT >= 1.5) { smoke(c.x, c.y, 5, 'rgba(163,230,53,0.35)', 14); crates.splice(i, 1); } }
}

/* ============================== 💿 SÚNG ĐĨA NẢY ============================== */
function discBounces(p) { return 4 + (has(p, 'gunMod') ? 1 : 0); }
function discFire(p, w, ang) {
    w3GunTick(p, w, ang);
    const m = muzzle(p, w, ang);
    W3.push(discObj(p, m.x, m.y, ang, { dmg: w.damage * attackMult(p, w), ret: p.discRetT > world.time }));
    AudioSys.playAt('rail', p.x, p.y, 0.2);
}
function discObj(p, x, y, a, o = {}) {
    return { kind: 'disc', owner: p.id, x, y, vx: Math.cos(a), vy: Math.sin(a), sp: o.sp || 900, left: o.bounces !== undefined ? o.bounces : discBounces(p), n: 0, go: 0, max: o.range || 900, dmg: o.dmg || 15, size: o.size || 6, ret: !!o.ret, pierce: !!o.pierce, hit: new Set(), spin: 0, t: 6, maxT: 6, big: !!o.big };
}
function updateDisc(f, o, dt) {
    f.spin += dt * 30;
    if (f.back) { // bay về tay
        const d = dist(f.x, f.y, o.x, o.y), st = f.sp * 1.1 * dt;
        if (d <= st + o.radius) { f.t = 0; const w = getCurrentWeapon(o); if (w.id === 'DISC' && w.magSize) w.mag = Math.min(effMag(o, w), w.mag + 1); spark(o.x, o.y, '#e2e8f0', 4, 120); return; }
        const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * st; f.y += Math.sin(a) * st;
        const e = enemiesOf(o).find(q => !(q.air > 0) && !f.hit.has(q.id) && dist(q.x, q.y, f.x, f.y) < q.radius + f.size); if (e) { f.hit.add(e.id); dealDamage(e, f.dmg, o.id, { knock: 120, angle: a }); spark(e.x, e.y, '#e2e8f0', 6, 200); }
        return;
    }
    let rem = f.sp * dt;
    while (rem > 0) {
        const s = Math.min(6, rem); rem -= s; f.go += s;
        if (w3Step(f, s)) {
            if (f.left <= 0) { f.done = true; break; }
            f.left--; f.n++; spark(f.x, f.y, '#f8fafc', 5, 180); if (Math.random() < 0.6) AudioSys.playAt('block', f.x, f.y, 0.12);
        }
        const mult = f.n === 0 ? 0.8 : Math.pow(1.15, f.n);
        const e = enemiesOf(o).find(q => !(q.air > 0) && !f.hit.has(q.id) && dist(q.x, q.y, f.x, f.y) < q.radius + f.size);
        if (e) {
            dealDamage(e, f.dmg * mult, o.id, { knock: 140, angle: Math.atan2(f.vy, f.vx) }); o.stats.hits++;
            if (f.n >= 2) floatText(e.x, e.y - 40, `💿 NẢY ×${f.n}`, '#e2e8f0', 13);
            spark(e.x, e.y, '#f1f5f9', 8, 220);
            if (f.pierce || f.ret) f.hit.add(e.id); else { f.t = 0; return; }
        }
        for (const d of decoys) if (d.owner !== o.id && dist(f.x, f.y, d.x, d.y) < d.radius + f.size) d.hp = 0;
        if (f.go >= f.max) { f.done = true; break; }
    }
    if (f.done) { if (f.ret) { f.back = true; f.done = false; f.hit.clear(); } else f.t = 0; }
}
/** đường nảy dự đoán (giống hệt đường bay thật) */
function discPath(p, a, bounces, range) {
    const f = { x: p.x + Math.cos(a) * (p.radius + 14), y: p.y + Math.sin(a) * (p.radius + 14), vx: Math.cos(a), vy: Math.sin(a) };
    const pts = [{ x: f.x, y: f.y }], hits = []; let go = 0, left = bounces;
    while (go < range) { go += 6; if (w3Step(f, 6)) { pts.push({ x: f.x, y: f.y }); hits.push({ x: f.x, y: f.y }); if (left-- <= 0) break; } }
    pts.push({ x: f.x, y: f.y });
    return { pts, hits };
}

/* ============================== 🗡️ GUNBLADE ============================== */
function gbSetForm(w, f) { w.form = f; w.type = f === 'gun' ? 'GUN' : 'MELEE'; w.range = f === 'gun' ? 600 : 105; w.aim = 'line'; }
function gbFire(p, w, ang, charge, mult) {
    if ((w.form || 'gun') === 'gun') {
        w3GunTick(p, w, ang);
        const c = charge || 0, m = muzzle(p, w, ang);
        const b = spawnBullet(p, m.x, m.y, ang + (Math.random() - 0.5) * spreadAt(w, c) * (p.spreadMult || 1), { speed: 34, damage: (55 + 45 * c) * mult, range: 300 + 500 * c, color: '#fda4af', size: 4.5, knock: 220, trail: 80, pierce: has(p, 'gunMod') && c >= 0.95 });
        b.gbShot = true;
        AudioSys.playAt('shoot_heavy', p.x, p.y, 0.5); addShake(4); p.kx -= Math.cos(ang) * 140; p.ky -= Math.sin(ang) * 140;
        p.gbShotT = world.time;
        gbSetForm(w, 'blade'); p.cooldown = Math.max(p.cooldown, 14);
        floatText(p.x, p.y - 40, '🗡 KIẾM!', '#fda4af', 13); spark(p.x, p.y, '#fda4af', 6, 160);
        return;
    }
    // dạng kiếm: chém + lướt ngắn
    const wide = (charge || 0) >= 0.9;
    p.cooldown = w.fireRate * 0.8 * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    p.dashTime = wide ? 0.14 : 0.1; p.dashAngle = ang;
    const reach = wide ? 125 : 95, half = wide ? Math.PI / 1.4 : Math.PI / 2.2;
    let dmg = (wide ? 40 : 30) * w3MM(p) * mult;
    if (has(p, 'meleeTech') && world.time - (p.gbShotT || -9) < 1.5) dmg *= 1.3;
    AudioSys.playAt('swing', p.x, p.y, wide ? 0.7 : 0.5);
    p.shotQueue.push({ t: wide ? 0.13 : 0.09, fn: () => {
        if (p.hp <= 0) return;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: reach + p.radius, color: '#fb7185', width: wide ? 14 : 10, life: 0.22, maxLife: 0.22, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false, arc: half });
        const hit = arcFoes(p, ang, reach, half);
        hit.forEach(e => { dealDamage(e, dmg, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 220, melee: true }); p.stats.hits++; spark(e.x, e.y, '#fecdd3', 8, 220); });
        hitDecoysObs(p, p.x + Math.cos(ang) * 60, p.y + Math.sin(ang) * 60, 40, dmg);
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.06); addShake(4); gbReload(p, w); }
    } });
}
function gbReload(p, w) { if (w.id !== 'GUNBLADE' || w.form === 'gun') return; gbSetForm(w, 'gun'); floatText(p.x, p.y - 44, '🔫 NẠP ĐẠN!', '#fda4af', 14); AudioSys.playAt('reload', p.x, p.y, 0.4); ring(p.x, p.y, 4, 40, '#fb7185', 0.3, 3); }

/* ============================== 🌗 NHẬT NGUYỆT CUNG ============================== */
function smSetForm(p, w, f) {
    w.form = f; w.type = f === 'sun' ? 'GUN' : 'MELEE'; w.range = f === 'sun' ? 560 : 85;
    p.smDash = null;
    if (f === 'moon') { // vừa thành song đao: mưa tên lên mọi địch có Ấn Nguyệt
        floatText(p.x, p.y - 54, '🌙 NGUYỆT SONG ĐAO', '#c7d2fe', 14);
        enemiesOf(p).forEach(e => { const M = e.smMk; if (!M || M.moon <= 0 || M.by !== p.id) return; const n = M.moon * 3; M.moon = 0; floatText(e.x, e.y - 50, `🌙 MƯA TÊN ×${n}`, '#c7d2fe', 14);
            for (let i = 0; i < n; i++) p.shotQueue.push({ t: 0.05 + i * 0.07, fn: () => { if (e.hp <= 0) return; const x = e.x + (Math.random() - 0.5) * 40, y = e.y + (Math.random() - 0.5) * 40; beams.push({ x1: x + 30, y1: y - 280, x2: x, y2: y, life: 0.18, maxLife: 0.18, color: '#c7d2fe' }); if (dist(x, y, e.x, e.y) < e.radius + 24) dealDamage(e, 8 * w3DM(p), p.id, { knock: 1 }); spark(x, y, '#e0e7ff', 3, 120); } }); });
    } else { // vừa thành cung: choáng + sát thương theo Ấn Nhật, mình được tăng tốc
        floatText(p.x, p.y - 54, '☀️ NHẬT CUNG', '#fde68a', 14);
        let any = 0;
        enemiesOf(p).forEach(e => { const M = e.smMk; if (!M || M.sun <= 0 || M.by !== p.id) return; const s = M.sun; M.sun = 0; any += s;
            dealDamage(e, 12 * s * w3MM(p), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.3 + 0.25 * s);
            ring(e.x, e.y, 5, 50, '#fde68a', 0.4, 4); floatText(e.x, e.y - 50, `☀️ CHOÁNG ×${s}`, '#fde68a', 14); });
        if (any) p.st.haste = Math.max(p.st.haste || 0, 1.5 + 0.5 * Math.min(4, any));
    }
}
function smMark(o, e, kind, n = 1) {
    if (!e || e.hp <= 0) return;
    const M = e.smMk && e.smMk.by === o.id && e.smMk.t > world.time ? e.smMk : (e.smMk = { sun: 0, moon: 0, by: o.id, t: 0 });
    const inf = e.smInf && e.smInf.by === o.id && e.smInf.kind === kind && e.smInf.t > world.time;
    M[kind] = Math.min(inf ? 999 : 5, M[kind] + n); M.t = world.time + (inf ? 30 : 6);
    if (inf) { e.smInf.t = world.time + 2; return; } // đang tích vô hạn: làm mới 2 giây
    if (e.smInf && e.smInf.t > world.time) return; // đang tích vô hạn loại kia: chưa nổ
    if (M.sun > 0 && M.moon > 0) { // ẤN NHẬT NGUYỆT: nổ sát thương chuẩn
        const T = (18 + 9 * (M.sun + M.moon)) * (has(o, 'meleeTech') && getCurrentWeapon(o).id === 'SUNMOON' ? 1.3 : 1);
        M.sun = 0; M.moon = 0;
        trueDamage(e, T, o.id);
        ring(e.x, e.y, 6, 70, '#fde68a', 0.45, 6); ring(e.x, e.y, 6, 55, '#c7d2fe', 0.45, 4); spark(e.x, e.y, '#fef3c7', 16, 280); addShake(5); hitStop(0.05);
        floatText(e.x, e.y - 56, `🌗 NHẬT NGUYỆT ${Math.round(T)} CHUẨN`, '#fef3c7', 16); AudioSys.playAt('crit', e.x, e.y, 0.5);
    }
}
function smArrow(p, a, o = {}) {
    const m = muzzle(p, getCurrentWeapon(p), a);
    W3.push({ kind: 'smArrow', owner: p.id, x: m.x, y: m.y, a, sp: o.sp || 1300, d: 0, max: o.max || 560, dmg: o.dmg || 22, pierce: o.pierce || 0, mark: o.mark || 'moon', marks: o.marks !== undefined ? o.marks : 1, stun: o.stun || 0, blind: o.blind || 0, big: !!o.big, wall: !!o.wall, inf: o.inf || null, htReset: !!o.htReset, emp: !!o.emp, hit: new Set(), t: 2, maxT: 2 });
}
function smDashGo(p, w, ang, last) {
    // lướt: bay qua người & tường (đáp chỗ trống), né đạn khi đang lướt; địch bị lướt qua chảy máu
    let D = 190, tx = p.x + Math.cos(ang) * D, ty = p.y + Math.sin(ang) * D;
    for (let k = 0; k < 14 && (pointInObstacle(tx, ty, p.radius + 2) || tx < p.radius || ty < p.radius || tx > MAP_W - p.radius || ty > MAP_H - p.radius); k++) {
        D = k < 7 ? 190 + (k + 1) * 18 : 190 - (k - 6) * 22; tx = p.x + Math.cos(ang) * D; ty = p.y + Math.sin(ang) * D;
    }
    if (pointInObstacle(tx, ty, p.radius + 2)) { const s = umbFreeSpot(p, tx, ty); tx = s.x; ty = s.y; }
    const ax = p.x, ay = p.y;
    startTravel(p, tx, ty, 0.16, null, null, 8); p.st.invuln = Math.max(p.st.invuln || 0, 0.2);
    afterImages(p, ax, ay, tx, ty, 5, '#fde68a');
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, tx, ty) < e.radius + 24) { dealDamage(e, 18 * w3MM(p), p.id, { melee: true, knock: 1 }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 2); e.st.burnBy = p.id; } spark(e.x, e.y, '#fca5a5', 8, 200); floatText(e.x, e.y - 40, '🩸 CHẢY MÁU', '#fca5a5', 12); } });
    AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    if (last) p.shotQueue.push({ t: 0.18, fn: () => { if (p.hp > 0 && getCurrentWeapon(p) === w) smSetForm(p, w, 'moon'); } });
    else { p.smDash = { t: world.time + 1.1 }; floatText(p.x, p.y - 40, '☀️ LƯỚT 1/2 — bấm để lướt tiếp', '#fde68a', 12); }
}
function smFire(p, w, ang, charge, mult) {
    const f = w.form || 'sun';
    if (f === 'sun') {
        if (p.smDash && p.smDash.t > world.time) { p.cooldown = 8; return smDashGo(p, w, ang, true); }
        if ((charge || 0) >= 0.9) { p.cooldown = 8; return smDashGo(p, w, ang, false); }
        // bắn thẳng phía trước, không ngắm
        p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; onAttack(p); p.stats.shots++; p.muzzle = 0.05; p.recoil = 1;
        const a = p.angle;
        if (p.smEmp === 'arrow') { p.smEmp = null; smArrow(p, a, { dmg: 46 * mult, pierce: 2, marks: 2, big: true, sp: 1650, max: 760, emp: true }); floatText(p.x, p.y - 40, '🌙 TIỄN CƯỜNG HOÁ', '#c7d2fe', 14); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.4); addShake(3); return; }
        if (p.smRapid > 0) { // liên thanh: 5 mũi rất nhanh
            p.smRapid--; floatText(p.x, p.y - 40, `🏹 LIÊN THANH ${3 - p.smRapid}/3`, '#e0e7ff', 13);
            for (let i = 0; i < 5; i++) p.shotQueue.push({ t: i * 0.055, fn: () => { if (p.hp <= 0) return; smArrow(p, p.angle + (Math.random() - 0.5) * 0.07, { dmg: 10 * mult, sp: 1500 }); p.muzzle = 0.04; AudioSys.playAt('whoosh', p.x, p.y, 0.15); } });
            return;
        }
        smArrow(p, a, { dmg: 22 * mult, pierce: has(p, 'gunMod') ? 1 : 0 });
        AudioSys.playAt('whoosh', p.x, p.y, 0.3); return;
    }
    // Nguyệt Song Đao
    if ((charge || 0) >= 0.9) { // nhảy lùi, bắn 1 mũi tên cực mạnh, thành cung
        p.cooldown = 20; const back = umbFreeSpot(p, p.x - Math.cos(ang) * 150, p.y - Math.sin(ang) * 150);
        floatText(p.x, p.y - 40, '🌙 NGUYỆT TIỄN!', '#c7d2fe', 14);
        startTravel(p, back.x, back.y, 0.28, 'umbLand', { fn: q => {
            smArrow(q, q.angle, { dmg: 48 * w3DM(q), pierce: 3, stun: 1, blind: 2.5, big: true, sp: 1600, max: 700, mark: 'moon' });
            AudioSys.playAt('shoot_heavy', q.x, q.y, 0.5); addShake(5);
            q.shotQueue.push({ t: 0.05, fn: () => { if (q.hp > 0 && getCurrentWeapon(q) === w) smSetForm(q, w, 'sun'); } });
        } }, 50);
        return;
    }
    if (p.smEmp === 'dash') { // đòn cường hoá: lướt theo hướng đánh rồi chém rộng
        p.smEmp = null; p.cooldown = 14 * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
        const D = Math.max(40, rayFree(p.x, p.y, ang, 170).d - p.radius), ax = p.x, ay = p.y;
        p.dashTime = D / 720; p.dashAngle = ang; p.st.invuln = Math.max(p.st.invuln || 0, p.dashTime);
        afterImages(p, ax, ay, ax + Math.cos(ang) * D, ay + Math.sin(ang) * D, 4, '#fde68a'); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        p.shotQueue.push({ t: p.dashTime + 0.02, fn: () => {
            if (p.hp <= 0) return;
            slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 115 + p.radius, color: '#fde68a', width: 14, life: 0.24, maxLife: 0.24, swing: 1, line: false, arc: 1.4 });
            arcFoes(p, ang, 115, 1.4).forEach(e => { dealDamage(e, 22 * w3MM(p) * mult, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 200, melee: true }); p.stats.hits++; smMark(p, e, 'sun'); spark(e.x, e.y, '#fde68a', 10, 240); });
            hitStop(0.05); addShake(4); floatText(p.x, p.y - 40, '☀️ ĐAO CƯỜNG HOÁ', '#fde68a', 13);
        } });
        return;
    }
    p.cooldown = 9 * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const side = (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1;
    AudioSys.playAt('swing', p.x, p.y, 0.35);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 85 + p.radius, color: '#c7d2fe', width: 7, life: 0.14, maxLife: 0.14, swing: side, line: false });
    const hit = arcFoes(p, ang, 85, 1.05);
    hit.forEach(e => { dealDamage(e, 13 * w3MM(p) * mult, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 90, melee: true }); p.stats.hits++; smMark(p, e, 'sun'); });
    hitDecoysObs(p, p.x + Math.cos(ang) * 50, p.y + Math.sin(ang) * 50, 34, 13);
    if (hit.length) { hitStop(0.03); addShake(2); }
}

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _makeWeaponW3 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponW3(id, p);
    if (w && w.id === 'GUNBLADE' && !w.form) gbSetForm(w, 'gun');
    if (w && w.id === 'SUNMOON' && !w.form) { w.form = 'sun'; w.type = 'GUN'; w.range = 560; }
    return w;
};
const _fireWeaponW3 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'ACID') return acidFire(p, w, ang, enemy);
    if (w && w.id === 'DISC') return discFire(p, w, ang);
    if (w && (w.id === 'GUNBLADE' || w.id === 'SUNMOON')) {
        if (w.form === undefined) w.id === 'GUNBLADE' ? gbSetForm(w, 'gun') : (w.form = 'sun');
        const mult = attackMult(p, w) * (p.gbDmgT > world.time ? 1.3 : 1);
        p.ghostT = 0; if (inBush(p.x, p.y)) p.st.exposed = 1.2;
        return w.id === 'GUNBLADE' ? gbFire(p, w, ang, charge, mult) : smFire(p, w, ang, charge, mult);
    }
    return _fireWeaponW3(p, w, ang, charge, enemy);
};
const _dealDamageW3 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.corrodeT > world.time) dmg *= 1.15; // Ăn Mòn: dễ tổn thương
    return _dealDamageW3(target, dmg, attackerId, opts);
};

/* ============================== CẬP NHẬT ============================== */
function updateW3(dt) {
    for (let i = W3.length - 1; i >= 0; i--) {
        const f = W3[i]; if (!f) continue; const o = players.find(q => q.id === f.owner);
        if (!o) { W3.splice(i, 1); continue; }
        if (f.kind === 'blob') { f.t += dt; if (f.t >= f.T) { blobLand(f, o); W3.splice(i, 1); } continue; }
        f.t -= dt;
        if (f.kind === 'disc') updateDisc(f, o, dt);
        else if (f.kind === 'smArrow') {
            const st = f.sp * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            if (Math.random() < 0.7) particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.25, maxLife: 0.25, color: f.mark === 'sun' ? 'rgba(253,230,138,0.6)' : 'rgba(199,210,254,0.6)', size: f.big ? 5 : 3 });
            const e = enemiesOf(o).find(q => !(q.air > 0) && !f.hit.has(q.id) && dist(q.x, q.y, f.x, f.y) < q.radius + (f.big ? 12 : 6));
            if (e) {
                f.hit.add(e.id);
                dealDamage(e, f.dmg, o.id, { angle: f.a, knock: f.big ? 300 : 90 }); o.stats.hits++;
                if (f.htReset) smHtReset(o, e, f, 'moon');
                if (f.inf) smSetInf(o, e, f.inf);
                for (let k = 0; k < f.marks; k++) smMark(o, e, f.mark);
                if (f.stun) e.stun = Math.max(e.stun, f.stun);
                if (f.blind && !has(e, 'nightVision')) e.st.blind = Math.max(e.st.blind || 0, f.blind);
                if (f.stun) floatText(e.x, e.y - 44, '😵 CHOÁNG + MÙ', '#c7d2fe', 14); else if (f.blind) floatText(e.x, e.y - 44, '🌙 MÙ NHẸ', '#c7d2fe', 13);
                spark(e.x, e.y, '#e0e7ff', 6, 200);
                if (f.pierce-- <= 0) { f.t = 0; }
            }
            if ((!f.wall && (pointInObstacle(f.x, f.y, 0))) || f.x < 0 || f.y < 0 || f.x > MAP_W || f.y > MAP_H || f.d >= f.max) f.t = 0;
        } else if (f.kind === 'acidRain') {
            f.k += dt; while (f.k >= f.gap && f.n > 0) { f.k -= f.gap; f.n--; const r = Math.sqrt(Math.random()) * f.R, a = Math.random() * Math.PI * 2; W3.push({ kind: 'blob', owner: o.id, x0: f.x + Math.cos(a) * r + 40, y0: f.y + Math.sin(a) * r - 260, x1: f.x + Math.cos(a) * r, y1: f.y + Math.sin(a) * r, t: 0, T: 0.45, r: 48, splash: 6, size: 5, rain: true }); }
            if (f.n <= 0) f.t = 0;
        } else if (f.kind === 'smSpin') {
            f.tick += dt; if (f.tick >= 0.2) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, o.x, o.y) < 95 + e.radius) { dealDamage(e, 8 * w3MM(o), o.id, { melee: true, knock: 60, angle: Math.atan2(e.y - o.y, e.x - o.x) }); smMark(o, e, 'sun'); } }); AudioSys.playAt('swing', o.x, o.y, 0.2); }
        }
        if (f.t <= 0) W3.splice(i, 1);
    }
    zones.forEach(z => { if (z.type === 'acid') updateAcidZone(z, dt); });
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.corrodeT > world.time) { p.armor = 0; if (p.st) p.st.shield = 0; if (Math.random() < 0.3) particles.push({ x: p.x + (Math.random() - 0.5) * 24, y: p.y, vx: 0, vy: 40, life: 0.5, maxLife: 0.5, color: '#a3e635', size: 2.5 }); }
        if (p.smMk && p.smMk.t < world.time) p.smMk = null;
        const w = getCurrentWeapon(p);
        if (w && w.id === 'SUNMOON' && p.smDash && p.smDash.t <= world.time) { smSetForm(p, w, 'moon'); }
    });
}
const _upeW3 = updatePartyExtras;
updatePartyExtras = function (dt) { _upeW3(dt); if (gameState === 'PLAYING' || gameState === 'KO') updateW3(dt); };

/* ============================== BẬC THẦY / KỸ THUẬT CAO ============================== */
Object.assign(MELEE_P, { GUNBLADE: 'Chém trúng trong 1.5 giây sau phát bắn ×1.3 sát thương.', SUNMOON: 'Ấn Nhật Nguyệt nổ mạnh hơn 30%.' });
Object.assign(GUN_P, { ACID: 'Vũng axit tồn tại lâu hơn 50%.', DISC: 'Đĩa nảy thêm 1 lần (5).', GUNBLADE: 'Phát bắn tụ lực đầy xuyên mục tiêu.', SUNMOON: 'Tên Nhật Cung xuyên thêm 1 mục tiêu.' });
const _meleeTechCastW3 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'GUNBLADE') { // Trảm Hoàn Đạn: chém tròn; trúng thì nạp lại súng + tăng sát thương 2s
        const R = 120;
        [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: R, color: '#fb7185', width: 14, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 }));
        let n = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius) { dealDamage(e, 34 * w3MM(p), p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - p.y, e.x - p.x) }); n++; } });
        ring(p.x, p.y, p.radius, R, '#fb7185', 0.35, 6); AudioSys.playAt('swing', p.x, p.y, 0.8); addShake(5);
        if (n) { gbSetForm(w, 'gun'); p.gbDmgT = world.time + 2; floatText(p.x, p.y - 48, '🔫 NẠP ĐẠN · +30% SÁT THƯƠNG 2s', '#fda4af', 14); }
        else floatText(p.x, p.y - 48, '🗡 TRẢM HOÀN ĐẠN', '#fda4af', 14);
        return;
    }
    if (w.id === 'SUNMOON') { // Nguyệt Luân Hộ Thể: 1 lớp khiên + 3 lưỡi trăng xoay quanh người 10 giây (giữ cả khi đổi vũ khí)
        for (let k = W3.length - 1; k >= 0; k--) if (W3[k].kind === 'smOrb' && W3[k].owner === p.id) W3.splice(k, 1);
        W3.push({ kind: 'smOrb', owner: p.id, t: 10, maxT: 10, hitCd: {}, a0: Math.random() * 6 });
        p.smOrbT = world.time + 10;
        p.st.shield = Math.max(p.st.shield || 0, 45); p.st.shieldT = Math.max(p.st.shieldT || 0, 10);
        ring(p.x, p.y, 10, 90, '#c7d2fe', 0.5, 5); spark(p.x, p.y, '#e0e7ff', 16, 220); castFx(p, '#c7d2fe', true);
        floatText(p.x, p.y - 44, '🌙 NGUYỆT LUÂN HỘ THỂ', '#e0e7ff', 16); AudioSys.playAt('rail', p.x, p.y, 0.4);
        return;
    }
    return _meleeTechCastW3(p);
};
const _gunModCastW3 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'ACID') { // Mưa Axit
        const d = Math.max(100, Math.min(420, p.skillDist || 320)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        W3.push({ kind: 'acidRain', owner: p.id, x, y, R: 170, n: 14, gap: 0.09, k: 0, t: 3, maxT: 3 });
        zones.push({ type: 'bombFall', x, y, r: 170, t: 0.6, maxT: 0.6, owner: p.id, tick: 0 });
        floatText(p.x, p.y - 44, '☣ MƯA AXIT!', '#bef264', 16); AudioSys.playAt('whoosh', x, y, 0.5);
        return;
    }
    if (w.id === 'DISC') { // Đĩa Quay Về: 6s mọi đĩa bay về tay sau khi nảy hết (+ hoàn đạn) và bắn ngay 1 đĩa lớn xuyên
        p.discRetT = world.time + 6;
        const m = muzzle(p, w, a); W3.push(discObj(p, m.x, m.y, a, { dmg: 26 * w3DM(p), size: 10, ret: true, pierce: true, big: true }));
        floatText(p.x, p.y - 44, '💿 ĐĨA QUAY VỀ (6s)', '#e2e8f0', 15); AudioSys.playAt('rail', p.x, p.y, 0.4);
        return;
    }
    if (w.id === 'GUNBLADE') { // Đạn Hàn: bắn 1 phát làm chậm, không đổi dạng
        const m = muzzle(p, w, a); spawnBullet(p, m.x, m.y, a, { speed: 30, damage: 22 * w3DM(p), range: 600, color: '#93c5fd', size: 5, slow: 2.5, trail: 60, knock: 120 });
        AudioSys.playAt('shoot_heavy', p.x, p.y, 0.4); floatText(p.x, p.y - 44, '❄ ĐẠN HÀN', '#93c5fd', 14);
        return;
    }
    if (w.id === 'SUNMOON') { // Nguyệt Quang Tiễn (cung): 5 mũi xuyên toả, mỗi mũi gắn Ấn Nguyệt
        for (let i = 0; i < 5; i++) smArrow(p, a + (i - 2) * 0.13, { dmg: 18 * w3DM(p), pierce: 2, mark: 'moon' });
        p.smRapid = 3;
        AudioSys.playAt('whoosh', p.x, p.y, 0.5); floatText(p.x, p.y - 44, '🌙 NGUYỆT QUANG TIỄN · 3 LOẠT LIÊN THANH', '#c7d2fe', 15);
        return;
    }
    return _gunModCastW3(p);
};
Object.assign(HT, {
    ACID: ['BOM ĂN MÒN', p => {
        const a = aimDir(p), d = Math.max(100, Math.min(380, p.skillDist || 300)), m = muzzle(p, getCurrentWeapon(p), a);
        W3.push({ kind: 'blob', owner: p.id, x0: m.x, y0: m.y, x1: p.x + Math.cos(a) * d, y1: p.y + Math.sin(a) * d, t: 0, T: 0.6, r: 80, splash: 10, size: 11, big: true });
        floatText(p.x, p.y - 44, '☣ BOM ĂN MÒN', '#bef264', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    }],
    DISC: ['BÃO ĐĨA', p => {
        const a = aimDir(p);
        for (let i = 0; i < 6; i++) { const m = muzzle(p, getCurrentWeapon(p), a); W3.push(discObj(p, m.x, m.y, a + (i - 2.5) * 0.28 + (Math.random() - 0.5) * 0.1, { dmg: 16 * w3DM(p), bounces: 6, sp: 820 + Math.random() * 160, range: 1100, ret: p.discRetT > world.time })); }
        AudioSys.playAt('rail', p.x, p.y, 0.5); floatText(p.x, p.y - 44, '💿 BÃO ĐĨA', '#e2e8f0', 15);
    }],
    GUNBLADE: ['BIẾN HOÁ BỘ', p => {
        const w = getCurrentWeapon(p), a = aimDir(p);
        if ((w.form || 'gun') === 'gun') { // nhảy lùi + tăng tốc
            const s = umbFreeSpot(p, p.x - Math.cos(a) * 180, p.y - Math.sin(a) * 180);
            startTravel(p, s.x, s.y, 0.32, null, null, 55); p.st.haste = Math.max(p.st.haste || 0, 2.5);
            floatText(p.x, p.y - 44, '🔫 BẬT LÙI', '#fda4af', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        } else { // kiếm lướt tới + tăng tốc, chém trúng thì nạp lại súng
            const D = Math.max(50, rayFree(p.x, p.y, a, 230).d - p.radius), ax = p.x, ay = p.y, bx = p.x + Math.cos(a) * D, by = p.y + Math.sin(a) * D;
            startTravel(p, bx, by, 0.16, null, null, 6); p.st.haste = Math.max(p.st.haste || 0, 2.5); afterImages(p, ax, ay, bx, by, 5, '#fb7185');
            let n = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < e.radius + 34) { dealDamage(e, 32 * w3MM(p), p.id, { melee: true, knock: 160, angle: a }); n++; } });
            slashes.push({ x: bx, y: by, ownerId: p.id, angle: a, range: 90, color: '#fb7185', width: 12, life: 0.2, maxLife: 0.2, swing: 1, line: false });
            if (n) gbReload(p, w);
            floatText(p.x, p.y - 44, '🗡 KIẾM LƯỚT', '#fda4af', 14); AudioSys.playAt('swing', p.x, p.y, 0.6);
        }
    }],
    SUNMOON: ['NHẬT NGUYỆT TUYỆT KỸ', p => {
        const w = getCurrentWeapon(p), a = aimDir(p);
        if ((w.form || 'sun') === 'sun') { // Nguyệt Thực Tiễn: xuyên tường, mù nhẹ, kẻ trúng tích Ấn Nguyệt vô hạn 2s → mưa tên
            smArrow(p, a, { dmg: 30 * w3DM(p), pierce: 9, marks: 0, mark: 'moon', big: true, wall: true, sp: 1500, max: 950, blind: 1, inf: 'moon', htReset: true });
            beams.push({ x1: p.x, y1: p.y, x2: p.x + Math.cos(a) * 950, y2: p.y + Math.sin(a) * 950, life: 0.35, maxLife: 0.35, color: '#c7d2fe' });
            W3.push({ kind: 'moonFx', x: p.x, y: p.y, a, t: 0.5, maxT: 0.5 });
            p.smEmp = 'arrow';
            AudioSys.playAt('shoot_heavy', p.x, p.y, 0.6); addShake(6); floatText(p.x, p.y - 44, '🌑 NGUYỆT THỰC TIỄN', '#c7d2fe', 15);
        } else { // Nhật Diệu Trảm: lướt xuyên chém, làm chậm (đang chậm → choáng), kẻ trúng tích Ấn Nhật vô hạn 2s → mất tầm nhìn
            const d = Math.max(80, Math.min(300, p.skillDist || 260)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
            const ax = p.x, ay = p.y; startTravel(p, s.x, s.y, 0.2, null, null, 30); afterImages(p, ax, ay, s.x, s.y, 7, '#fde68a');
            W3.push({ kind: 'sunTrail', x1: ax, y1: ay, x2: s.x, y2: s.y, a, t: 0.6, maxT: 0.6 });
            const F = {};
            enemiesOf(p).filter(e => !(e.air > 0) && segDist(e.x, e.y, ax, ay, s.x, s.y) < e.radius + 40).sort((u, v) => dist(ax, ay, u.x, u.y) - dist(ax, ay, v.x, v.y)).forEach(e => {
                smHtReset(p, e, F, 'sun');
                const slowed = (e.st.slow || 0) > 0;
                dealDamage(e, 26 * w3MM(p), p.id, { melee: true, knock: 140, angle: a });
                if (slowed) { e.stun = Math.max(e.stun, 1); floatText(e.x, e.y - 44, '💫 CHOÁNG', '#fde68a', 14); } else e.st.slow = Math.max(e.st.slow || 0, 1.6);
                smSetInf(p, e, 'sun');
                USK.push({ kind: 'xcut', x: e.x, y: e.y, a, t: 0.45, maxT: 0.45 }); spark(e.x, e.y, '#fde68a', 14, 280);
            });
            p.smEmp = 'dash';
            hitStop(0.05); addShake(6); AudioSys.playAt('swing', p.x, p.y, 0.7); floatText(p.x, p.y - 44, '☀️ NHẬT DIỆU TRẢM', '#fde68a', 15);
        }
    }]
});
CARDS.meleeTech.desc += '<br>Gunblade (dạng kiếm) = Trảm Hoàn Đạn · Nhật Nguyệt Cung (song đao) = Nhật Luân Vũ.';
CARDS.gunMod.desc += '<br>Súng Phun Axit = Mưa Axit · Súng Đĩa Nảy = Đĩa Quay Về · Gunblade (dạng súng) = Đạn Hàn · Nhật Nguyệt Cung (cung) = Nguyệt Quang Tiễn.';
Object.assign(HT_PROFILE, {
    ACID: { aim: 'point', R: 380, shape: 'point', aoe: 130, arc: true, col: '163,230,53', tag: '☣ PHÁ GIÁP 3s' },
    DISC: { aim: 'dir', R: 500, shape: 'cone', half: 0.8, col: '226,232,240' }
});
const _skillProfileW3 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'GUNBLADE') {
        if (id === 'meleeTech') return { aim: null, shape: 'selfaoe', aoe: 120, col: '251,113,133', tag: 'TRÚNG → NẠP ĐẠN' };
        if (id === 'gunMod') return { aim: 'dir', R: 600, shape: 'line', w: 14, col: '147,197,253' };
        if (id === 'hightech') return w.form === 'blade' ? { aim: 'dir', R: 230, shape: 'line', w: 60, col: '251,113,133', tag: '🗡 LƯỚT TỚI' } : { aim: 'dir', R: 180, shape: 'line', w: 30, col: '253,164,175', tag: '🔫 BẬT LÙI' };
    }
    if (w && w.id === 'SUNMOON') {
        if (id === 'meleeTech') return { aim: null, shape: 'selfaoe', aoe: 95, col: '253,230,138' };
        if (id === 'gunMod') return { aim: 'dir', R: 560, shape: 'cone', half: 0.3, col: '199,210,254' };
        if (id === 'hightech') return w.form === 'moon' ? { aim: 'point', R: 300, shape: 'point', aoe: 50, col: '253,230,138', tag: '☀️ LƯỚT XUYÊN' } : { aim: 'dir', R: 950, shape: 'line', w: 40, col: '199,210,254', tag: '🌑 XUYÊN TƯỜNG' };
    }
    if (w && w.id === 'ACID' && id === 'gunMod') return { aim: 'point', R: 420, shape: 'point', aoe: 170, arc: true, col: '163,230,53' };
    if (w && w.id === 'DISC' && id === 'gunMod') return { aim: 'dir', R: 600, shape: 'line', w: 24, col: '226,232,240', tag: '↩ QUAY VỀ' };
    return _skillProfileW3(p, id);
};

/* ============================== HÌNH VŨ KHÍ ============================== */
Object.assign(ART2, {
    ACID: (c, w, r, x0, ch, now) => {
        const g = c.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#d9f99d'); g.addColorStop(1, '#3f6212');
        c.fillStyle = g; c.beginPath(); c.arc(x0 + 2, 0, 7, 0, Math.PI * 2); c.fill(); outl(c); // bình axit
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(190,242,100,${0.4 + Math.sin(now * 6) * 0.2})`; c.beginPath(); c.arc(x0 + 2, 1.5, 4, 0, Math.PI * 2); c.fill(); c.restore();
        metal(c, x0 + 7, -2.5, 14, 5, '#4d7c0f', 1.5); metal(c, x0 + 20, -3.5, 6, 7, '#365314', 2);
        c.fillStyle = '#bef264'; c.beginPath(); c.arc(x0 + 27, 2 + Math.sin(now * 8) * 1.5, 1.6, 0, Math.PI * 2); c.fill(); // giọt
        MUZ.ACID = x0 + 27;
    },
    DISC: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 4, -3.5, 24, 7, '#475569', 2); metal(c, x0 - 1, 3, 4, 7, '#1e293b', 1);
        c.save(); c.translate(x0 + 12, -6); c.rotate(now * 12); c.fillStyle = '#e2e8f0'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); outl(c, 1);
        c.strokeStyle = '#64748b'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(2, 0); c.lineTo(6, 0); c.stroke(); } c.restore();
        MUZ.DISC = x0 + 22;
    },
    GUNBLADE: (c, w, r, x0, ch, now) => {
        const blade = w.form === 'blade';
        metal(c, x0 - 4, -1, 5, 9, '#3f3f46', 1.5); // báng/chuôi
        metal(c, x0, -4, 14, 7, '#71717a', 2); c.fillStyle = '#f43f5e'; c.fillRect(x0 + 3, -1, 6, 1.6);
        if (blade) {
            blade3(c, x0 + 12, 42, '#ffe4e6', '#be123c');
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(251,113,133,${0.4 + Math.sin(now * 10) * 0.2})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 + 14, 0); c.lineTo(x0 + 52, 0); c.stroke(); c.restore();
        } else {
            metal(c, x0 + 12, -2.5, 22, 4, '#52525b', 1.2, 0.6); // nòng
            blade3(c, x0 + 12, 18, '#f1f5f9', '#9f1239', 4); // lưỡi gập dưới nòng
            if (ch > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,164,175,${ch * 0.6})`; c.beginPath(); c.arc(x0 + 34, -0.5, 3 + ch * 3, 0, Math.PI * 2); c.fill(); c.restore(); }
        }
        MUZ.GUNBLADE = x0 + 35;
    },
    SUNMOON: (c, w, r, x0, ch, now) => {
        if ((w.form || 'sun') === 'sun') {
            c.strokeStyle = '#b45309'; c.lineWidth = 3.4; c.beginPath(); c.arc(x0 + 2, 0, 16, -1.25, 1.25); c.stroke();
            c.strokeStyle = '#fde68a'; c.lineWidth = 1.4; c.beginPath(); c.arc(x0 + 2, 0, 16, -1.2, 1.2); c.stroke();
            const sx = x0 + 2 + Math.cos(1.25) * 16; c.strokeStyle = '#fef3c7'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(sx, -15); c.lineTo(x0 + 2 - ch * 8, 0); c.lineTo(sx, 15); c.stroke();
            c.save(); c.translate(x0 + 18, 0); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,224,71,${0.6 + Math.sin(now * 5) * 0.2})`; c.beginPath(); c.arc(0, 0, 3.5, 0, Math.PI * 2); c.fill();
            for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.fillRect(4, -0.5, 3, 1); } c.restore(); // mặt trời
        } else {
            [-6, 6].forEach((oy, k) => { c.save(); c.translate(x0 + 4, oy); c.fillStyle = '#e0e7ff'; c.beginPath(); c.arc(8, 0, 12, -1.2, 1.2); c.arc(4, 0, 10, 1.1, -1.1, true); c.closePath(); c.fill(); outl(c, 0.8);
                c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(199,210,254,${0.4 + Math.sin(now * 6 + k) * 0.2})`; c.lineWidth = 1; c.beginPath(); c.arc(8, 0, 12, -1.1, 1.1); c.stroke(); c.restore(); });
        }
        MUZ.SUNMOON = x0 + 20;
    }
});
function blade3(c, x, L, a, b, h = 3) { blade(c, [[x, -h], [x + L - 6, -h * 0.7], [x + L, 0], [x + L - 6, h * 0.7], [x, h]], a, b); }

/* ============================== VẼ THẾ GIỚI ============================== */
const _drawW2FxW3 = drawW2Fx;
drawW2Fx = function (now) {
    // vũng axit (dưới cùng)
    zones.forEach(z => {
        if (z.type !== 'acid') return;
        const k = Math.min(1, z.t / 0.6, (z.maxT - z.t) / 0.15 + 0.2);
        ctx.save(); ctx.globalAlpha = Math.max(0, k);
        const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r); g.addColorStop(0, 'rgba(163,230,53,0.45)'); g.addColorStop(0.75, 'rgba(101,163,13,0.32)'); g.addColorStop(1, 'rgba(63,98,18,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 4; i++) { const t = (now * 0.8 + i * 0.27 + (z.x % 7) * 0.1) % 1, a = i * 1.7 + z.y; ctx.strokeStyle = `rgba(217,249,157,${0.5 * (1 - t)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * z.r * 0.45, z.y + Math.sin(a) * z.r * 0.45, 2 + t * 6, 0, Math.PI * 2); ctx.stroke(); } // bọt sôi
        ctx.restore();
    });
    obstacles.forEach(o => { if (o.acidT > world.time) { ctx.fillStyle = 'rgba(163,230,53,0.22)'; ctx.fillRect(o.x, o.y, o.w, o.h); } });
    _drawW2FxW3(now);
    ctx.save(); ctx.lineCap = 'round';
    W3.forEach(f => {
        if (f.kind === 'blob') {
            const k = Math.min(1, f.t / f.T), x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - (f.rain ? 0 : Math.sin(k * Math.PI) * (40 + dist(f.x0, f.y0, f.x1, f.y1) * 0.25));
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(f.x0 + (f.x1 - f.x0) * k, f.y0 + (f.y1 - f.y0) * k, f.size, f.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, f.size); g.addColorStop(0, '#ecfccb'); g.addColorStop(1, '#4d7c0f'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, f.size, 0, Math.PI * 2); ctx.fill();
            if (!f.rain && players[0] && f.owner === (localPlayer() || {}).id) { ctx.strokeStyle = 'rgba(190,242,100,0.35)'; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(f.x1, f.y1, f.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
        } else if (f.kind === 'disc') {
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.spin);
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(226,232,240,${0.15 + Math.min(0.4, f.n * 0.1)})`; ctx.beginPath(); ctx.arc(0, 0, f.size + 6, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = f.big ? '#fde68a' : '#e2e8f0'; ctx.beginPath();
            for (let i = 0; i < 12; i++) { const rr = i % 2 ? f.size * 0.7 : f.size; ctx.lineTo(Math.cos(i * Math.PI / 6) * rr, Math.sin(i * Math.PI / 6) * rr); } ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(0, 0, f.size * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (f.kind === 'smArrow') {
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); const L = f.big ? 46 : 26, col = f.mark === 'sun' ? '253,230,138' : '199,210,254';
            ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${col},0.45)`; ctx.lineWidth = f.big ? 10 : 6; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = f.big ? 3 : 2; ctx.beginPath(); ctx.moveTo(-L * 0.7, 0); ctx.lineTo(4, 0); ctx.stroke();
            ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.moveTo(f.big ? 12 : 8, 0); ctx.lineTo(0, -4); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (f.kind === 'smSpin') {
            const o = players.find(q => q.id === f.owner); if (!o) return;
            ctx.save(); ctx.translate(o.x, o.y); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 2; i++) { ctx.rotate(now * 14 + i * Math.PI); ctx.fillStyle = 'rgba(253,230,138,0.85)'; ctx.beginPath(); ctx.arc(80, 0, 14, -1.3, 1.3); ctx.arc(74, 0, 11, 1.2, -1.2, true); ctx.closePath(); ctx.fill(); }
            ctx.strokeStyle = 'rgba(253,230,138,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 95, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
    });
    // ấn Nhật / Nguyệt trên địch
    players.forEach(e => {
        const M = e.smMk; if (!M || e.hp <= 0 || (!M.sun && !M.moon)) return;
        const y = e.y - e.radius - 30; let x = e.x - ((M.sun ? 1 : 0) + (M.moon ? 1 : 0) - 1) * 10;
        ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        if (M.sun) { ctx.strokeText(`☀${M.sun}`, x, y); ctx.fillStyle = '#fde68a'; ctx.fillText(`☀${M.sun}`, x, y); x += 20; }
        if (M.moon) { ctx.strokeText(`🌙${M.moon}`, x, y); ctx.fillStyle = '#c7d2fe'; ctx.fillText(`🌙${M.moon}`, x, y); }
    });
    // bị ăn mòn
    players.forEach(e => { if (e.hp > 0 && e.corrodeT > world.time) { ctx.strokeStyle = `rgba(163,230,53,${0.5 + Math.sin(now * 12) * 0.2})`; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } });
    // vùng ngắm đĩa: đường nảy dự đoán (chỉ người chơi cầm Súng Đĩa)
    const me = localPlayer();
    if (me && me.hp > 0 && !me.isBot && getCurrentWeapon(me).id === 'DISC') {
        const P = discPath(me, me.angle, discBounces(me), 900), on = me.aiming || me.manualEngaged;
        ctx.strokeStyle = `rgba(226,232,240,${on ? 0.6 : 0.28})`; ctx.lineWidth = 2; ctx.setLineDash([6, 7]); ctx.lineDashOffset = -now * 40;
        ctx.beginPath(); P.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); ctx.setLineDash([]);
        P.hits.forEach((q, i) => { ctx.fillStyle = `rgba(253,230,138,${on ? 0.9 : 0.45})`; ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2); ctx.fill(); if (on) { ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(`×${Math.pow(1.15, i + 1).toFixed(2)}`, q.x, q.y - 8); } });
    }
    // Nhật Nguyệt Cung: nhắc bấm lướt lần 2 · Gunblade: dạng hiện tại
    if (me && me.hp > 0) {
        const w = getCurrentWeapon(me);
        if (w.id === 'SUNMOON' && me.smDash && me.smDash.t > world.time) { const k = (me.smDash.t - world.time) / 1.1; ctx.strokeStyle = 'rgba(253,230,138,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(me.x, me.y, me.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); }
    }
    ctx.restore();
};
// HUD vũ khí: nhãn dạng
const _drawHUDW3 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUDW3(W, H, now);
    const me = localPlayer(); if (!me || me.hp <= 0 || !['PLAYING', 'KO'].includes(gameState)) return;
    const w = getCurrentWeapon(me); let s = null, col = '#fff';
    if (w.id === 'GUNBLADE') { s = w.form === 'blade' ? '🗡 KIẾM — chém trúng để nạp đạn' : '🔫 SÚNG — 1 phát'; col = '#fda4af'; }
    if (w.id === 'SUNMOON') { s = (w.form || 'sun') === 'sun' ? '☀️ NHẬT CUNG — giữ: lướt ×2' : '🌙 NGUYỆT SONG ĐAO — giữ: nhảy lùi bắn'; col = (w.form || 'sun') === 'sun' ? '#fde68a' : '#c7d2fe'; }
    if (!s) return;
    ctx.save(); ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(s, W / 2, H - 112); ctx.fillStyle = col; ctx.fillText(s, W / 2, H - 112); ctx.restore();
};

/* ============================== NHẬT NGUYỆT CUNG · BẢN NÂNG CẤP ============================== */
// Kỹ Thuật Cao trúng kẻ có ấn: tiêu 1 ấn để hồi chiêu ngay (chỉ kẻ đầu tiên tốn ấn)
function smHtReset(o, e, F, pref) {
    if (F.resetUsed) return;
    const M = e.smMk; if (!M || M.by !== o.id || M.t < world.time || (M.sun <= 0 && M.moon <= 0)) return;
    const k = M[pref] > 0 ? pref : (pref === 'moon' ? 'sun' : 'moon'); M[k]--; F.resetUsed = true;
    // hoãn sang khung sau: chiêu trúng ngay lúc bấm thì game đặt hồi chiêu SAU khi hàm chiêu chạy xong
    const resetCd = () => (o.skills || []).forEach(s => { if (s.id === 'hightech') s.cd = 0; });
    resetCd(); o.shotQueue.push({ t: 0, fn: resetCd }); setTimeout(resetCd, 0);
    floatText(o.x, o.y - 58, '↺ HỒI CHIÊU (-1 ấn)', '#fef3c7', 14); ring(o.x, o.y, 6, 50, '#fef3c7', 0.35, 3); AudioSys.playAt('select', o.x, o.y, 0.4);
}
function smSetInf(o, e, kind) {
    if (!e.smMk || e.smMk.by !== o.id || e.smMk.t < world.time) e.smMk = { sun: 0, moon: 0, by: o.id, t: world.time + 30 };
    e.smInf = { kind, by: o.id, t: world.time + 2 };
    floatText(e.x, e.y - 60, kind === 'moon' ? '🌙∞ TÍCH VÔ HẠN' : '☀️∞ TÍCH VÔ HẠN', kind === 'moon' ? '#c7d2fe' : '#fde68a', 13);
}
// không thể kích hoạt lại Nguyệt Luân khi lưỡi trăng còn (hồi chiêu vẫn chạy); vũ khí khác vẫn dùng được
const _castSkillSM = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (s && s.id === 'meleeTech' && w && w.id === 'SUNMOON' && p.smOrbT > world.time) { if (!p.isBot) floatText(p.x, p.y - 30, `🌙 Lưỡi trăng còn ${Math.ceil(p.smOrbT - world.time)}s`, '#c7d2fe', 12); return; }
    return _castSkillSM(p, slot, aimVec);
};
const _upeSM = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeSM(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    const now = world.time;
    W3.forEach(f => {
        const o = players.find(q => q.id === f.owner);
        if (f.kind === 'smOrb') { // 3 lưỡi trăng xoay quanh người
            if (!o || o.hp <= 0) { f.t = 0; return; }
            for (let k = 0; k < 3; k++) {
                const a = f.a0 + now * 3.4 + k * Math.PI * 2 / 3, bx = o.x + Math.cos(a) * 76, by = o.y + Math.sin(a) * 76;
                for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (!b) continue; if (b.owner !== o.id && dist(b.x, b.y, bx, by) < 20 + (b.size || 3)) { spark(b.x, b.y, '#e0e7ff', 5, 180); bullets.splice(i, 1); } }
                enemiesOf(o).forEach(e => {
                    if (e.air > 0 || dist(e.x, e.y, bx, by) > e.radius + 18) return;
                    const key = e.id + '_' + k; if ((f.hitCd[key] || 0) > now) return; f.hitCd[key] = now + 0.45;
                    dealDamage(e, 10 * w3MM(o), o.id, { melee: true, knock: 120, angle: Math.atan2(e.y - o.y, e.x - o.x) }); e.st.slow = Math.max(e.st.slow || 0, 1.2);
                    spark(e.x, e.y, '#c7d2fe', 6, 200);
                });
            }
        } else if (f.kind === 'smRain') { // mưa tên trút xuống một mục tiêu
            const e = players.find(q => q.id === f.tid);
            if (!o || !e || e.hp <= 0) { f.t = 0; return; }
            f.k += dt;
            while (f.k >= 0.07 && f.n > 0) { f.k -= 0.07; f.n--; const x = e.x + (Math.random() - 0.5) * 50, y = e.y + (Math.random() - 0.5) * 50; beams.push({ x1: x + 34, y1: y - 300, x2: x, y2: y, life: 0.2, maxLife: 0.2, color: '#c7d2fe' }); if (dist(x, y, e.x, e.y) < e.radius + 26) dealDamage(e, 8 * w3DM(o), o.id, { knock: 1 }); spark(x, y, '#e0e7ff', 3, 120); if (f.n % 3 === 0) AudioSys.playAt('hit', x, y, 0.15); }
            if (f.n <= 0) f.t = 0; else f.t = Math.max(f.t, 0.2);
        }
    });
    // hết 2 giây không tích thêm → kết thúc trạng thái tích vô hạn
    players.forEach(e => {
        const I = e.smInf; if (!I || I.t > now) return;
        e.smInf = null;
        const o = players.find(q => q.id === I.by), M = e.smMk; if (!o || !M || e.hp <= 0) return;
        const n = M[I.kind] || 0; M[I.kind] = 0; if (n <= 0) return;
        if (I.kind === 'moon') { W3.push({ kind: 'smRain', owner: o.id, tid: e.id, n: Math.min(60, n * 3), k: 0, t: 5, maxT: 5 }); floatText(e.x, e.y - 56, `🌙 MƯA TÊN ×${Math.min(60, n * 3)}`, '#c7d2fe', 16); }
        else { const T = Math.min(6, 0.6 * n); if (!has(e, 'nightVision')) e.st.blind = Math.max(e.st.blind || 0, T); e.smDark = now + T; floatText(e.x, e.y - 56, `🌑 MẤT TẦM NHÌN ${T.toFixed(1)}s`, '#fde68a', 16); ring(e.x, e.y, 6, 80, '#78350f', 0.5, 6); }
    });
};
// tầm nhìn: bị Nhật Diệu kết thúc thì tối gần như hoàn toàn
const _visionRangeSM = visionRange;
visionRange = function (viewer) { const v = viewer || localPlayer(); const r = _visionRangeSM(viewer); return v && v.smDark > world.time ? r * 0.35 : r; };
const _skillProfileSM = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'SUNMOON') {
        if (id === 'meleeTech') return { aim: null, shape: 'selfaoe', aoe: 94, col: '199,210,254', tag: p.smOrbT > world.time ? `🌙 còn ${Math.ceil(p.smOrbT - world.time)}s` : '🌙 3 LƯỠI TRĂNG 10s' };
        if (id === 'gunMod') return { aim: 'dir', R: 560, shape: 'cone', half: 0.3, col: '199,210,254', tag: '+3 LOẠT LIÊN THANH' };
        if (id === 'hightech') return w.form === 'moon' ? { aim: 'point', R: 300, shape: 'point', aoe: 50, col: '253,230,138', tag: '☀️ CHẬM→CHOÁNG · ∞ ẤN' } : { aim: 'dir', R: 950, shape: 'line', w: 40, col: '199,210,254', tag: '🌑 XUYÊN TƯỜNG · ∞ ẤN' };
    }
    return _skillProfileSM(p, id);
};
WEAPONS.SUNMOON.desc = 'Nhật Cung: bắn thẳng, gắn Ấn Nguyệt; giữ để lướt 2 lần rồi thành song đao. Nguyệt Song Đao: chém nhanh gắn Ấn Nhật; giữ để nhảy lùi bắn tên choáng + mù rồi thành cung. Ấn tích tối đa 5; Ấn Nhật + Ấn Nguyệt trên cùng địch → NỔ sát thương chuẩn. Kỹ Thuật Cao trúng kẻ có ấn: tiêu 1 ấn để hồi chiêu ngay.';

/* ============================== ĐỒ HOẠ MỚI: SONG ĐAO · NHẬT NGUYỆT CUNG ============================== */
function daggerShape(c, L, glow, now, seed) { // một con dao găm cong: chuôi quấn dây, chắn tay vàng, lưỡi bạc có rãnh
    c.fillStyle = '#d6d3d1'; c.beginPath(); c.arc(-8, 0, 2.2, 0, Math.PI * 2); c.fill(); outl(c, 0.8); // núm chuôi
    metal(c, -7, -2, 9, 4, '#3b2416', 1.6, 0.2); // chuôi
    c.strokeStyle = '#b45309'; c.lineWidth = 0.9; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-5 + i * 2.6, -2); c.lineTo(-3.6 + i * 2.6, 2); c.stroke(); } // dây quấn
    metal(c, 1.5, -4.6, 2.4, 9.2, '#ca8a04', 1.2, 0.6); glint(c, 2.6, -3.4, 0.7); // chắn tay
    const g = c.createLinearGradient(0, -4, 0, 4); g.addColorStop(0, '#f8fafc'); g.addColorStop(0.45, '#cbd5e1'); g.addColorStop(1, '#475569');
    c.beginPath(); c.moveTo(4, -2.6); c.quadraticCurveTo(L * 0.55, -4.8, L, -0.6); c.lineTo(L + 1.6, 0.5); c.quadraticCurveTo(L * 0.55, 3, 4, 2.6); c.closePath();
    c.fillStyle = g; c.fill(); outl(c, 0.9);
    c.strokeStyle = 'rgba(15,23,42,0.45)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(5, 0); c.quadraticCurveTo(L * 0.5, -1.4, L * 0.85, -0.4); c.stroke(); // rãnh máu
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(5, -2.3); c.quadraticCurveTo(L * 0.55, -4.4, L - 1, -0.9); c.stroke(); // mép sáng
    glint(c, 6 + ((now * 22 + seed * 7) % (L - 6)), -1.6, 0.8);
    if (glow > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(226,232,240,${glow})`; c.lineWidth = 3; c.beginPath(); c.moveTo(5, -2.5); c.quadraticCurveTo(L * 0.55, -4.8, L, -0.6); c.stroke(); c.restore(); }
}
function moonBlade(c, R, now, k, glow) { // lưỡi trăng khuyết lớn
    const g = c.createLinearGradient(0, -R, R, R); g.addColorStop(0, '#f8fafc'); g.addColorStop(0.5, '#c7d2fe'); g.addColorStop(1, '#4338ca');
    c.beginPath(); c.arc(0, 0, R, -1.35, 1.35); c.arc(-R * 0.42, 0, R * 0.86, 1.12, -1.12, true); c.closePath();
    c.fillStyle = g; c.fill(); outl(c, 1);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = `rgba(224,231,255,${0.55 + Math.sin(now * 5 + k) * 0.25 + glow})`; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, R - 0.8, -1.25, 1.25); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)'; [[-0.7, 0.8], [0.2, 1.1], [0.85, 0.7]].forEach(([t, s]) => { c.beginPath(); c.arc(Math.cos(t) * (R - 3), Math.sin(t) * (R - 3), s, 0, Math.PI * 2); c.fill(); }); // sao nhỏ
    c.restore();
}
Object.assign(ART2, {
    DAGGERS: (c, w, r, x0, ch, now, p) => {
        const alt = p ? (p.strikeN || 0) % 2 : 0;
        [[-8, -0.2, alt ? 4 : 0, 0], [8, 0.2, alt ? 0 : 4, 1]].forEach(([oy, rot, fwd, i]) => {
            c.save(); c.translate(r + fwd, oy); c.rotate(rot); daggerShape(c, 22, ch * 0.6, now, i); c.restore();
        });
    },
    SUNMOON: (c, w, r, x0, ch, now, p) => {
        if ((w.form || 'sun') === 'sun') {
            // cung vàng hai tầng (recurve) + đĩa mặt trời ở tay cầm + dây + mũi tên đầu trăng
            const R = 17, pull = ch * 9, cx = x0 + 4;
            c.save(); c.strokeStyle = '#78350f'; c.lineWidth = 4.2; c.beginPath(); c.arc(cx, 0, R, -1.2, 1.2); c.stroke();
            const g = c.createLinearGradient(cx, -R, cx, R); g.addColorStop(0, '#fef3c7'); g.addColorStop(0.5, '#f59e0b'); g.addColorStop(1, '#fef3c7');
            c.strokeStyle = g; c.lineWidth = 2.4; c.beginPath(); c.arc(cx, 0, R, -1.2, 1.2); c.stroke();
            [-1, 1].forEach(sd => { const tx = cx + Math.cos(1.2) * R, ty = sd * Math.sin(1.2) * R; c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 5, ty + sd * 2, tx + 3, ty + sd * 6); c.stroke(); }); // đầu cong recurve
            const sx = cx + Math.cos(1.2) * R + 3;
            c.strokeStyle = 'rgba(254,243,199,0.9)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(sx, -R + 1); c.lineTo(cx - pull, 0); c.lineTo(sx, R - 1); c.stroke();
            metal(c, cx - pull, -0.8, 30, 1.6, '#d6d3d1', 0.8, 0.4); // thân tên
            c.fillStyle = '#e0e7ff'; c.beginPath(); c.moveTo(cx - pull + 36, 0); c.quadraticCurveTo(cx - pull + 30, -4.5, cx - pull + 28, -3); c.quadraticCurveTo(cx - pull + 31, 0, cx - pull + 28, 3); c.quadraticCurveTo(cx - pull + 30, 4.5, cx - pull + 36, 0); c.fill(); outl(c, 0.7); // đầu tên trăng
            c.fillStyle = '#fde68a'; c.fillRect(cx - pull - 2, -2.2, 4, 1.2); c.fillRect(cx - pull - 2, 1, 4, 1.2); // lông tên
            c.translate(cx + R - 1, 0); c.globalCompositeOperation = 'lighter';
            const sg = c.createRadialGradient(0, 0, 0, 0, 0, 7); sg.addColorStop(0, 'rgba(255,251,235,1)'); sg.addColorStop(0.5, 'rgba(253,224,71,0.8)'); sg.addColorStop(1, 'rgba(245,158,11,0)');
            c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill();
            c.rotate(now * 1.5); c.fillStyle = `rgba(253,224,71,${0.7 + ch * 0.3})`; for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(4.5, -0.9); c.lineTo(8 + ch * 2, 0); c.lineTo(4.5, 0.9); c.fill(); } // tia mặt trời
            c.restore();
            if (ch > 0.3) glint(c, cx - pull + 36, 0, 1 + ch);
        } else {
            // Nguyệt Song Đao: hai thanh loan đao cầm ở hai tay (chắn tay hình trăng khuyết, lưỡi cong bạc xanh)
            const alt = p ? (p.strikeN || 0) % 2 : 0;
            [[-8, -0.22, alt ? 5 : 0, 0], [8, 0.22, alt ? 0 : 5, 1]].forEach(([oy, rot, fwd, k]) => {
                c.save(); c.translate(r - 1 + fwd, oy); c.rotate(rot);
                metal(c, -8, -1.9, 10, 3.8, '#1e1b4b', 1.6, 0.3); // chuôi
                c.strokeStyle = '#a5b4fc'; c.lineWidth = 0.8; for (let q = 0; q < 3; q++) { c.beginPath(); c.moveTo(-6 + q * 2.6, -1.9); c.lineTo(-4.8 + q * 2.6, 1.9); c.stroke(); }
                c.fillStyle = '#e0e7ff'; c.beginPath(); c.arc(-9, 0, 1.8, 0, Math.PI * 2); c.fill(); outl(c, 0.6);
                c.fillStyle = '#c7d2fe'; c.beginPath(); c.arc(2.5, 0, 5, -1.9, 1.9); c.arc(0.8, 0, 4.2, 1.6, -1.6, true); c.closePath(); c.fill(); outl(c, 0.8); // chắn tay trăng khuyết
                const L = 30, g = c.createLinearGradient(0, -5, 0, 4); g.addColorStop(0, '#f8fafc'); g.addColorStop(0.5, '#c7d2fe'); g.addColorStop(1, '#4338ca');
                c.beginPath(); c.moveTo(4, -1.8); c.quadraticCurveTo(L * 0.55, -3.2 + (k ? 0 : 0), L, -6.5); c.quadraticCurveTo(L * 0.6, 1.2, 4, 2.2); c.closePath(); // lưỡi loan đao cong vút
                c.fillStyle = g; c.fill(); outl(c, 0.9);
                c.save(); c.globalCompositeOperation = 'lighter';
                c.strokeStyle = `rgba(224,231,255,${0.5 + Math.sin(now * 5 + k * 2) * 0.25 + ch * 0.3})`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(5, -1.7); c.quadraticCurveTo(L * 0.55, -3.1, L - 0.5, -6.2); c.stroke(); // mép sáng
                if (ch > 0.2) { c.strokeStyle = `rgba(165,180,252,${ch * 0.5})`; c.lineWidth = 5; c.stroke(); }
                c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(12 + ((now * 18 + k * 9) % 14), -2.4, 0.8, 0, Math.PI * 2); c.fill();
                c.restore();
                c.restore();
            });
        }
        MUZ.SUNMOON = x0 + 22;
    }
});

/* ============================== VẼ HIỆU ỨNG MỚI ============================== */
const _drawW2FxSM = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxSM(now);
    ctx.save(); ctx.lineCap = 'round';
    const T = world.time;
    W3.forEach(f => {
        const k = Math.max(0, f.t / f.maxT);
        if (f.kind === 'smOrb') {
            const o = players.find(q => q.id === f.owner); if (!o || o.hp <= 0) return;
            const fade = Math.min(1, f.t / 0.6);
            ctx.save(); ctx.globalAlpha = fade;
            ctx.strokeStyle = 'rgba(199,210,254,0.18)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.arc(o.x, o.y, 76, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            for (let j = 0; j < 3; j++) {
                const a = f.a0 + T * 3.4 + j * Math.PI * 2 / 3;
                ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(165,180,252,0.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(o.x, o.y, 76, a - 0.55, a); ctx.stroke(); ctx.restore(); // vệt đuôi
                ctx.save(); ctx.translate(o.x + Math.cos(a) * 76, o.y + Math.sin(a) * 76); ctx.rotate(a + Math.PI / 2);
                ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 24); g.addColorStop(0, 'rgba(224,231,255,0.6)'); g.addColorStop(1, 'rgba(99,102,241,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
                ctx.globalCompositeOperation = 'source-over'; moonBlade(ctx, 15, now, j, 0.2);
                ctx.restore();
            }
            ctx.restore();
        } else if (f.kind === 'moonFx') {
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
            const R = 30 + (1 - k) * 90; ctx.fillStyle = 'rgba(199,210,254,0.55)'; ctx.beginPath(); ctx.arc(0, 0, R, -1.3, 1.3); ctx.arc(-R * 0.4, 0, R * 0.85, 1.1, -1.1, true); ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (f.kind === 'sunTrail') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(253,224,71,${0.5 * k})`; ctx.lineWidth = 26 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
            ctx.strokeStyle = `rgba(255,251,235,${k})`; ctx.lineWidth = 3; ctx.stroke();
            const L = dist(f.x1, f.y1, f.x2, f.y2), n = Math.max(2, Math.floor(L / 70));
            for (let i = 0; i <= n; i++) { const x = f.x1 + (f.x2 - f.x1) * i / n, y = f.y1 + (f.y2 - f.y1) * i / n, r = (8 + 6 * (1 - k)) ; ctx.save(); ctx.translate(x, y); ctx.rotate(now * 4 + i); ctx.fillStyle = `rgba(253,224,71,${0.8 * k})`; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill(); for (let q = 0; q < 8; q++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(r * 0.6, -1.5); ctx.lineTo(r * 1.3, 0); ctx.lineTo(r * 0.6, 1.5); ctx.fill(); } ctx.restore(); }
            ctx.restore();
        }
    });
    // ký hiệu ∞ khi đang tích vô hạn
    players.forEach(e => { const I = e.smInf; if (!I || I.t < T || e.hp <= 0) return; const kk = (I.t - T) / 2; ctx.save(); ctx.strokeStyle = I.kind === 'moon' ? `rgba(199,210,254,${0.5 + kk * 0.5})` : `rgba(253,224,71,${0.5 + kk * 0.5})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kk); ctx.stroke(); ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = ctx.strokeStyle; ctx.fillText('∞', e.x + e.radius + 14, e.y - e.radius - 8); ctx.restore(); });
    ctx.restore();
};
